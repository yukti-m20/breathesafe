"""
poller.py
---------
Background async polling task for the BreatheSafe collector.

Responsibilities:
  1. Poll the ESP32 badge GET /api/data every POLL_INTERVAL_S seconds.
  2. Store every reading in OpenSearch via opensearch_store.
  3. Regenerate an AI health recommendation via strands_agent when the
     overall level changes OR the AI_REGEN_INTERVAL_S grace period elapses.
  4. Persist AI-generated alerts in OpenSearch for MODERATE or UNHEALTHY levels.
  5. Expose module-level state (latest_reading, latest_action, badge_reachable)
     for the FastAPI routes and WebSocket to read directly.
"""

import asyncio
import logging
import os
import time
from datetime import datetime, timezone

import httpx

import opensearch_store
import strands_agent

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level shared state
# (FastAPI routes read these variables directly — Python's GIL makes simple
#  attribute assignments safe without explicit locking in this single-process
#  async context.)
# ---------------------------------------------------------------------------

latest_reading: dict | None = None           # Last successful badge reading
latest_action: str = "Waiting for sensor data..."  # Last AI recommendation
last_action_time: float = 0.0               # monotonic timestamp of last AI call
badge_reachable: bool = False               # Whether the badge responded last poll

# Private state (set by init_poller)
os_client = None    # opensearch_store.OpenSearch client
_agent    = None    # Strands Agent instance
_last_level: str = ""   # Tracks level changes to trigger AI re-generation


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def init_poller(opensearch_client, strands_agent_instance) -> None:
    """
    Inject dependencies into the poller module.

    Must be called once at application startup (from the lifespan handler in
    main.py) before start_polling() is awaited.

    Args:
        opensearch_client:       Initialised OpenSearch client from opensearch_store.
        strands_agent_instance:  Strands Agent from strands_agent.create_agent().
    """
    global os_client, _agent
    os_client = opensearch_client
    _agent    = strands_agent_instance
    logger.info("Poller initialised with OpenSearch client and Strands Agent.")


# ---------------------------------------------------------------------------
# Single poll cycle
# ---------------------------------------------------------------------------

async def poll_badge() -> None:
    """
    Execute one complete poll cycle:
      1. HTTP GET /api/data from the badge (5 s timeout).
      2. Update latest_reading and badge_reachable.
      3. Persist the reading to OpenSearch.
      4. Conditionally regenerate the AI health action (level changed OR interval).
      5. Persist an OpenSearch alert for MODERATE / UNHEALTHY levels.

    All exceptions are caught so the outer loop never crashes.
    """
    global latest_reading, latest_action, last_action_time, badge_reachable, _last_level

    esp32_url         = os.getenv("ESP32_URL", "http://badge.local")
    ai_regen_interval = float(os.getenv("AI_REGEN_INTERVAL_S", "300"))
    endpoint          = f"{esp32_url}/api/data"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(endpoint)
            response.raise_for_status()
            data: dict = response.json()

        # ── Update shared state ────────────────────────────────────────────
        latest_reading  = data
        badge_reachable = True
        current_level   = data.get("level", "GOOD")
        current_time    = time.monotonic()

        logger.info(
            "[%s] Poll OK  level=%-10s temp=%.1fC  gas_idx=%.2f",
            datetime.now(timezone.utc).strftime("%H:%M:%S"),
            current_level,
            data.get("temp_c", 0.0),
            data.get("gas_index", 0.0),
        )

        # ── Persist reading to OpenSearch ──────────────────────────────────
        if os_client is not None:
            opensearch_store.store_reading(os_client, data)

        # ── Decide whether to regenerate AI action ─────────────────────────
        level_changed    = current_level != _last_level
        interval_elapsed = (current_time - last_action_time) >= ai_regen_interval

        if level_changed or interval_elapsed:
            _last_level = current_level

            # Run the synchronous Strands SDK call in a thread-pool executor
            # so we don't block the async event loop during model inference.
            loop   = asyncio.get_event_loop()
            action = await loop.run_in_executor(
                None,                    # default ThreadPoolExecutor
                _run_generate_action,    # sync wrapper
                data,
            )

            latest_action    = action
            last_action_time = current_time

            logger.info(
                "AI action [%s]: %.80s%s",
                current_level,
                action,
                "..." if len(action) > 80 else "",
            )

            # ── Persist alert for elevated levels ─────────────────────────
            if os_client is not None and current_level in ("MODERATE", "UNHEALTHY"):
                opensearch_store.store_alert(
                    client=os_client,
                    level=current_level,
                    mode=data.get("mode", "UNKNOWN"),
                    action=action,
                )

    except httpx.RequestError as exc:
        badge_reachable = False
        logger.warning("Badge unreachable (%s): %s", endpoint, exc)
    except httpx.HTTPStatusError as exc:
        badge_reachable = False
        logger.warning("Badge HTTP error %d for %s", exc.response.status_code, endpoint)
    except Exception as exc:
        badge_reachable = False
        logger.warning("Unexpected poll error: %s", exc, exc_info=True)


def _run_generate_action(data: dict) -> str:
    """
    Synchronous wrapper around AI action generation.

    Uses the pre-warmed module-level _agent if available; otherwise falls back
    to strands_agent.generate_action() which creates a fresh agent internally.

    This function is called inside a ThreadPoolExecutor so it MUST be
    synchronous (no async/await).

    Args:
        data: Badge sensor data dict.

    Returns:
        AI-generated (or deterministic fallback) recommendation string.
    """
    try:
        if _agent is not None:
            level      = data.get("level", "GOOD")
            gas_level  = data.get("gas_level", "GOOD")
            heat_level = data.get("heat_level", "GOOD")
            mode       = data.get("mode", "ADULT")
            temp_c     = data.get("temp_c", 0.0)
            hum        = data.get("hum", 0.0)
            hi_c       = data.get("heat_index_c", 0.0)
            gas_index  = data.get("gas_index", 0.0)
            score      = data.get("score", 0.0)
            warmup     = data.get("warmup_left_s", 0)
            mq_fault   = data.get("mq_fault", False)

            prompt = (
                "You are a personal health safety assistant for a wearable air quality badge. "
                "Given these sensor readings:\n"
                f"  Mode: {mode}\n"
                f"  Overall level: {level}\n"
                f"  Gas level: {gas_level} (gas index {gas_index:.2f})\n"
                f"  Heat level: {heat_level} (heat index {hi_c:.1f} C)\n"
                f"  Temperature: {temp_c:.1f} C, Humidity: {hum:.0f}%\n"
                f"  Composite score: {score:.3f}\n"
                f"  Sensor warmup remaining: {warmup}s\n"
                f"  MQ sensor fault: {mq_fault}\n\n"
                "Generate a single, specific, actionable recommendation in 1-2 sentences. "
                "Be direct and practical. If the sensor is still warming up, say so."
            )

            result = _agent(prompt)
            text = str(result).strip()
            if len(text) > 200:
                text = text[:197].rsplit(" ", 1)[0] + "..."
            if text:
                return text

        # Fallback: use the standalone generate_action() which creates its own agent
        return strands_agent.generate_action(data)

    except Exception as exc:
        logger.warning("AI generation failed in thread executor: %s", exc)
        return strands_agent.generate_action(data)


# ---------------------------------------------------------------------------
# Polling loop
# ---------------------------------------------------------------------------

async def start_polling() -> None:
    """
    Continuously poll the badge every POLL_INTERVAL_S seconds.

    Runs indefinitely as a background asyncio Task.  Individual poll failures
    are absorbed — the loop NEVER propagates exceptions to the caller.

    Call this from the FastAPI lifespan handler via asyncio.create_task().
    """
    poll_interval = float(os.getenv("POLL_INTERVAL_S", "10"))
    logger.info("Badge polling loop started. Interval: %.0f s", poll_interval)

    while True:
        try:
            await poll_badge()
        except Exception as exc:
            # Belt-and-suspenders: poll_badge() already catches everything,
            # but we guard here too so the task never silently dies.
            logger.error("Unhandled error in poll_badge (should not happen): %s", exc)
        await asyncio.sleep(poll_interval)
