"""
main.py
-------
FastAPI application entry-point for the BreatheSafe collector service.

Endpoints:
  GET  /                -- Health check
  GET  /api/latest      -- Latest badge reading + AI recommendation
  GET  /api/history     -- Time-series readings from OpenSearch
  GET  /api/status      -- Service diagnostics
  POST /api/mode        -- Proxy mode-switch to badge
  POST /api/calibrate   -- Proxy calibration trigger to badge
  POST /api/reset       -- Proxy reset to badge
  WS   /ws              -- Live push of latest state every 5 seconds

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import opensearch_store
import poller
import strands_agent

# Load .env before any os.getenv() calls in sub-modules
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Application lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and graceful shutdown.

    Startup sequence:
      1. Initialise OpenSearch client and ensure indices exist.
      2. Create the Strands AI agent (model + tools).
      3. Inject dependencies into the poller module.
      4. Launch the badge-polling loop as a background asyncio Task.

    Shutdown:
      Cancel the polling task cleanly, suppressing CancelledError.
    """
    logger.info("=== BreatheSafe Collector starting up ===")

    # 1. OpenSearch
    os_client = opensearch_store.init_opensearch()
    app.state.os_client = os_client

    # 2. Strands Agent
    agent = strands_agent.create_agent()
    app.state.agent = agent

    # 3. Wire poller dependencies
    poller.init_poller(os_client, agent)

    # 4. Background polling task
    polling_task = asyncio.create_task(poller.start_polling(), name="badge-poller")
    app.state.polling_task = polling_task
    logger.info("Background badge-poller task started.")

    yield  # ── Application is running ──────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────────────
    logger.info("=== BreatheSafe Collector shutting down ===")
    polling_task.cancel()
    try:
        await polling_task
    except asyncio.CancelledError:
        logger.info("Badge-poller task cancelled cleanly.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BreatheSafe Collector",
    description=(
        "Collects ESP32-C3 badge air-quality data, persists to OpenSearch, "
        "and generates AI-powered health recommendations via AWS Strands Agents SDK."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# Allow all origins so the dashboard (any host/port) can reach this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST Routes
# ---------------------------------------------------------------------------

@app.get("/", summary="Health check", tags=["System"])
async def root():
    """Return service liveness and badge reachability."""
    return {
        "status":          "ok",
        "service":         "BreatheSafe Collector",
        "badge_reachable": poller.badge_reachable,
    }


@app.get("/api/latest", summary="Latest badge reading + AI recommendation", tags=["Data"])
async def get_latest():
    """
    Return the most recent badge sensor snapshot together with the latest
    AI-generated health recommendation and service metadata.

    Response:
        reading         -- Full badge JSON (or null if no reading yet)
        ai_action       -- Latest AI health recommendation string
        badge_reachable -- Whether the badge is currently responding
        ai_powered_by   -- AI framework attribution
        storage         -- Storage backend name
    """
    return {
        "reading":          poller.latest_reading,
        "ai_action":        poller.latest_action,
        "badge_reachable":  poller.badge_reachable,
        "ai_powered_by":    "AWS Strands Agents SDK",
        "storage":          "OpenSearch",
    }


@app.get("/api/history", summary="Historical readings from OpenSearch", tags=["Data"])
async def get_history(hours: int = 24):
    """
    Return up to 500 badge readings from the last *hours* hours, sorted
    chronologically ascending.

    Query params:
        hours (int, default 24): Window size in hours (max driven by index retention).
    """
    records = opensearch_store.get_history(app.state.os_client, hours=hours)
    return {
        "hours":   hours,
        "count":   len(records),
        "records": records,
    }


@app.get("/api/status", summary="Service diagnostics", tags=["System"])
async def get_status():
    """
    Return a diagnostic snapshot of the collector service:
      - badge_reachable       -- Last poll success flag
      - opensearch_connected  -- Live ping result
      - strands_provider      -- Active LLM backend
      - strands_model_id      -- Model identifier (Bedrock only)
      - poll_interval_s       -- Configured polling cadence
      - ai_regen_interval_s   -- AI regeneration grace period
      - last_reading_time     -- ISO timestamp approximation (UTC)
    """
    # Lightweight OpenSearch ping to confirm connectivity
    opensearch_ok = False
    try:
        app.state.os_client.ping()
        opensearch_ok = True
    except Exception:
        pass

    last_reading_time: str | None = None
    if poller.latest_reading is not None:
        last_reading_time = datetime.now(timezone.utc).isoformat()

    return {
        "badge_reachable":      poller.badge_reachable,
        "opensearch_connected": opensearch_ok,
        "strands_provider":     os.getenv("STRANDS_PROVIDER", "bedrock"),
        "strands_model_id":     os.getenv("STRANDS_MODEL_ID", "us.amazon.nova-lite-v1:0"),
        "poll_interval_s":      float(os.getenv("POLL_INTERVAL_S", "10")),
        "ai_regen_interval_s":  float(os.getenv("AI_REGEN_INTERVAL_S", "300")),
        "last_reading_time":    last_reading_time,
    }


# ---------------------------------------------------------------------------
# Badge proxy routes (forward commands to the ESP32)
# ---------------------------------------------------------------------------

@app.post("/api/mode", summary="Switch badge operating mode", tags=["Badge Control"])
async def set_mode(m: str):
    """
    Proxy a mode-switch command to the badge.

    Query params:
        m (str): Target mode -- one of "child", "adult", or "asthma".

    Returns the badge's raw JSON response.
    """
    esp32_url = os.getenv("ESP32_URL", "http://badge.local")
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(f"{esp32_url}/api/mode", params={"m": m})
        resp.raise_for_status()
        return resp.json()


@app.post("/api/calibrate", summary="Trigger badge sensor calibration", tags=["Badge Control"])
async def calibrate():
    """
    Proxy a gas-sensor calibration request to the badge.

    Returns the badge's raw JSON response.
    """
    esp32_url = os.getenv("ESP32_URL", "http://badge.local")
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{esp32_url}/api/calibrate")
        resp.raise_for_status()
        return resp.json()


@app.post("/api/reset", summary="Reset the badge", tags=["Badge Control"])
async def reset():
    """
    Proxy a full reset command to the badge.

    Returns the badge's raw JSON response.
    """
    esp32_url = os.getenv("ESP32_URL", "http://badge.local")
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(f"{esp32_url}/api/reset")
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# WebSocket — live state push
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint that pushes the latest badge state every 5 seconds.

    Message schema (JSON):
        {
            "reading":         <dict | null>,
            "ai_action":       <str>,
            "badge_reachable": <bool>
        }

    Clients should handle reconnects — the server disconnects cleanly on
    any send error or WebSocketDisconnect from the client.
    """
    await websocket.accept()
    logger.info("WebSocket connected: %s", websocket.client)

    try:
        while True:
            payload = {
                "reading":         poller.latest_reading,
                "ai_action":       poller.latest_action,
                "badge_reachable": poller.badge_reachable,
            }
            await websocket.send_text(json.dumps(payload, default=str))
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: %s", websocket.client)
    except Exception as exc:
        logger.warning("WebSocket error (%s): %s", websocket.client, exc)
    finally:
        # Attempt a clean close; ignore errors if the socket is already gone
        try:
            await websocket.close()
        except Exception:
            pass
import planner_engine
from planner_models import DayBlock, ExposureRequest, IngestReading, CoachQuery, CallTriggerRequest, TwilioConfigRequest
import calling_agent

@app.get("/api/forecast", summary="Get 48-hour environmental forecast for a city", tags=["Planner"])
async def get_forecast(city: str = "Delhi NCR", mode: str = "adult"):
    f48 = planner_engine.get_48h_forecast(city)
    windows = planner_engine.find_best_windows(f48, mode=mode)
    thresholds = planner_engine.MODE_THRESHOLDS.get(mode.lower(), planner_engine.MODE_THRESHOLDS["adult"])
    
    # Calculate alerts
    alerts = []
    for h in f48[:24]:
        if h["aqi"] >= thresholds["red_aqi"]:
            alerts.append({"time": f"{h['day']} {h['time_label']}", "level": "RED", "msg": f"Severe AQI spike ({h['aqi']}) - strictly stay indoors."})
        elif h["aqi"] >= thresholds["amber_aqi"]:
            alerts.append({"time": f"{h['day']} {h['time_label']}", "level": "AMBER", "msg": f"Unhealthy for {mode} ({h['aqi']}) - reduce outdoor exertion."})

    return {
        "city": city,
        "mode": mode,
        "forecast_48h": f48,
        "windows": windows,
        "alerts": alerts[:4],
        "thresholds": thresholds
    }

@app.post("/api/exposure-calc", summary="Calculate time-weighted exposure score from day plan", tags=["Planner"])
async def calculate_exposure(req: ExposureRequest):
    f48 = planner_engine.get_48h_forecast(req.city)
    f24 = f48[:24]
    blocks_dict = [b.dict() for b in req.blocks]
    result = planner_engine.calculate_exposure_score(blocks_dict, f24, mode=req.mode)
    return result

@app.post("/api/coach", summary="AI Coach Q&A using Strands", tags=["Planner"])
async def ai_coach(req: CoachQuery):
    answer = strands_agent.ask_coach(
        query=req.query,
        city=req.city,
        mode=req.mode,
        lang=req.lang or "en",
        score_text=req.score_context or "",
        forecast_text=req.forecast_context or ""
    )
    return {
        "query": req.query,
        "answer": answer,
        "lang": req.lang or "en",
        "powered_by": "AWS Strands Agents SDK"
    }

@app.post("/api/ingest", summary="Ingest real sensor readings from wearable hardware", tags=["Hardware Ingest"])
async def ingest_sensor_data(reading: IngestReading):
    """
    Hardware-ready endpoint: The ESP32 badge can POST directly to /api/ingest.
    Hardware is optional, not abandoned!
    """
    data = reading.dict()
    data["@timestamp"] = datetime.now(timezone.utc).isoformat()
    
    # Update latest reading in memory for live display
    poller.latest_reading = data
    poller.badge_reachable = True
    
    # Store to OpenSearch if cluster is active
    if hasattr(app.state, "os_client") and app.state.os_client is not None:
        opensearch_store.store_reading(app.state.os_client, data)
        
    return {
        "status": "success",
        "message": "Badge reading ingested and queued for AI analysis",
        "reading_id": data.get("id"),
        "received_at": data["@timestamp"]
    }


@app.post("/api/trigger-call", summary="Trigger automated emergency voice call alert", tags=["Calling Agent"])
async def trigger_call(req: CallTriggerRequest):
    """
    Automated calling agent endpoint:
    Dispatches telephone voice alert via Twilio Voice API (or simulated TTS engine)
    when air quality is hazardous, predictive spike is imminent, or N95 mask is required.
    """
    result = await calling_agent.trigger_emergency_call(
        phone_number=req.phone_number,
        reason=req.reason,
        city=req.city or "Delhi NCR",
        mode=req.mode or "adult",
        lang=req.lang or "en",
        auto_trigger=req.auto_trigger or False
    )
    return result

@app.get("/api/calls", summary="Get call logs of voice alert agent", tags=["Calling Agent"])
async def get_calls():
    """Returns history of recent emergency voice alert calls."""
    return {
        "calls": calling_agent.get_call_history(),
        "twilio_configured": bool(calling_agent.TWILIO_ACCOUNT_SID and calling_agent.TWILIO_AUTH_TOKEN)
    }

@app.post("/api/twilio-config", summary="Set Twilio account credentials dynamically", tags=["Calling Agent"])
async def configure_twilio(req: TwilioConfigRequest):
    """Save user-provided Twilio Voice credentials into the live calling agent."""
    res = calling_agent.set_twilio_credentials(req.account_sid, req.auth_token, req.from_number)
    return {
        "status": "success",
        "configured": res["configured"],
        "from_number": res["from_number"]
    }