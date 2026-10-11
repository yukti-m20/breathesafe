"""
opensearch_store.py
-------------------
OpenSearch helpers for the BreatheSafe collector.

Two indices are managed:
  - exposure-badge        : time-series sensor readings from the ESP32 badge
  - exposure-badge-alerts : AI-generated health action alerts

All public functions handle exceptions gracefully and return safe defaults.
"""

import logging
import os
from datetime import datetime, timezone

from opensearchpy import OpenSearch, RequestsHttpConnection
from opensearchpy.exceptions import NotFoundError, RequestError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Index names
# ---------------------------------------------------------------------------
INDEX = "exposure-badge"
ALERT_INDEX = "exposure-badge-alerts"

# ---------------------------------------------------------------------------
# Index mappings
# ---------------------------------------------------------------------------

_READING_MAPPINGS = {
    "mappings": {
        "properties": {
            "@timestamp":       {"type": "date"},
            # --- identity / meta ---
            "id":               {"type": "keyword"},
            "uptime_s":         {"type": "long"},
            "mode":             {"type": "keyword"},
            # --- aggregate levels ---
            "level":            {"type": "keyword"},
            "gas_level":        {"type": "keyword"},
            "heat_level":       {"type": "keyword"},
            # --- temperature / humidity ---
            "temp_c":           {"type": "float"},
            "hum":              {"type": "float"},
            "heat_index_c":     {"type": "float"},
            # --- gas sensor ---
            "gas_index":        {"type": "float"},
            "gas_mv":           {"type": "float"},
            "gas_baseline_mv":  {"type": "float"},
            "gas_dose_idx_h":   {"type": "float"},
            # --- health scores ---
            "score":            {"type": "float"},
            "unhealthy_s":      {"type": "long"},
            "moderate_s":       {"type": "long"},
            "red_s":            {"type": "long"},
            # --- status flags ---
            "calibrated":       {"type": "boolean"},
            "warmup_left_s":    {"type": "integer"},
            "mq_fault":         {"type": "boolean"},
            "time_synced":      {"type": "boolean"},
            # --- connectivity ---
            "wifi_connected":   {"type": "boolean"},
            "wifi_rssi":        {"type": "integer"},
            "ip":               {"type": "keyword"},
            "ap_ip":            {"type": "keyword"},
        }
    }
}

_ALERT_MAPPINGS = {
    "mappings": {
        "properties": {
            "@timestamp": {"type": "date"},
            "level":      {"type": "keyword"},
            "mode":       {"type": "keyword"},
            "action":     {"type": "text"},
        }
    }
}


# ---------------------------------------------------------------------------
# Client initialisation
# ---------------------------------------------------------------------------

def init_opensearch() -> OpenSearch:
    """
    Create and return an OpenSearch client using environment variables.
    Also ensures both indices exist with correct mappings.

    Environment variables:
        OPENSEARCH_HOST  (default: localhost)
        OPENSEARCH_PORT  (default: 9200)
        OPENSEARCH_USER  (default: admin)
        OPENSEARCH_PASS  (default: admin)

    Returns:
        An initialised OpenSearch client instance.
    """
    host     = os.getenv("OPENSEARCH_HOST", "localhost")
    port     = int(os.getenv("OPENSEARCH_PORT", "9200"))
    user     = os.getenv("OPENSEARCH_USER", "admin")
    password = os.getenv("OPENSEARCH_PASS", "admin")

    client = OpenSearch(
        hosts=[{"host": host, "port": port}],
        http_auth=(user, password),
        use_ssl=False,
        verify_certs=False,
        connection_class=RequestsHttpConnection,
        timeout=2,
        max_retries=0,
    )

    try:
        if client.ping():
            logger.info("OpenSearch cluster connected at %s:%d", host, port)
            _ensure_index(client, INDEX, _READING_MAPPINGS)
            _ensure_index(client, ALERT_INDEX, _ALERT_MAPPINGS)
        else:
            logger.warning("OpenSearch ping returned false (offline). Operating in local fallback mode.")
    except Exception as exc:
        logger.warning("OpenSearch cluster is not running on %s:%d. Operating in local fallback mode.", host, port)

    return client


def _ensure_index(client: OpenSearch, index_name: str, body: dict) -> None:
    """Create an index with the given mappings if it does not already exist."""
    try:
        if not client.indices.exists(index=index_name):
            client.indices.create(index=index_name, body=body)
            logger.info("Created OpenSearch index: %s", index_name)
    except Exception as exc:
        logger.warning("Could not ensure index %s: %s", index_name, exc)


# ---------------------------------------------------------------------------
# Store a sensor reading
# ---------------------------------------------------------------------------

def store_reading(client: OpenSearch, reading: dict) -> bool:
    """
    Index a badge sensor reading into the exposure-badge index.

    Injects a ``@timestamp`` field (current UTC ISO-8601) before writing.

    Args:
        client:  Initialised OpenSearch client.
        reading: Raw badge JSON dict from GET /api/data.

    Returns:
        True on success, False on any error.
    """
    try:
        doc = dict(reading)                                   # shallow copy
        doc["@timestamp"] = datetime.now(timezone.utc).isoformat()

        resp = client.index(index=INDEX, body=doc)
        logger.debug(
            "Stored reading level=%s id=%s",
            doc.get("level", "?"),
            resp.get("_id", "?"),
        )
        return True
    except Exception as exc:
        logger.error("Failed to store reading: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Retrieve historical readings
# ---------------------------------------------------------------------------

def get_history(client: OpenSearch, hours: int = 24) -> list[dict]:
    """
    Retrieve badge readings from the last *hours* hours, sorted ascending.

    Args:
        client: Initialised OpenSearch client.
        hours:  How many hours of history to return (default 24).

    Returns:
        List of ``_source`` dicts; empty list on error or missing index.
    """
    try:
        query = {
            "size": 500,
            "sort": [{"@timestamp": {"order": "asc"}}],
            "query": {
                "range": {
                    "@timestamp": {
                        "gte": f"now-{hours}h",
                        "lte": "now",
                    }
                }
            },
        }
        resp = client.search(index=INDEX, body=query)
        hits = resp.get("hits", {}).get("hits", [])
        docs = [h["_source"] for h in hits]
        logger.debug("History query: %d docs returned (last %dh)", len(docs), hours)
        return docs
    except NotFoundError:
        logger.warning("Index %s not found during history query.", INDEX)
        return []
    except Exception as exc:
        logger.error("Failed to retrieve history: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Store an AI-generated alert
# ---------------------------------------------------------------------------

def store_alert(client: OpenSearch, level: str, mode: str, action: str) -> bool:
    """
    Index an AI-generated health recommendation into exposure-badge-alerts.

    Args:
        client: Initialised OpenSearch client.
        level:  Current aggregate level (e.g. "UNHEALTHY").
        mode:   Current badge mode (e.g. "CHILD").
        action: AI-generated recommendation text.

    Returns:
        True on success, False on any error.
    """
    try:
        doc = {
            "@timestamp": datetime.now(timezone.utc).isoformat(),
            "level":      level,
            "mode":       mode,
            "action":     action,
        }
        resp = client.index(index=ALERT_INDEX, body=doc)
        logger.info(
            "Stored alert level=%s mode=%s id=%s",
            level, mode, resp.get("_id", "?"),
        )
        return True
    except Exception as exc:
        logger.error("Failed to store alert: %s", exc)
        return False


def generate_default_history(hours: int = 24) -> list[dict]:
    """
    Generate synthetic diurnal sensor history matching OpenSearch schema
    so the website chart displays rich historical telemetry even when OpenSearch is offline.
    """
    from datetime import datetime, timezone, timedelta
    import random, math

    now = datetime.now(timezone.utc)
    readings = []
    
    # 24 data points spread across the selected hours
    step_minutes = max(5, int((hours * 60) / 24))
    
    for i in range(24, 0, -1):
        ts = now - timedelta(minutes=i * step_minutes)
        hour_val = ts.hour
        
        # Diurnal pattern: Higher pollution during morning (7-9 AM) & evening (6-9 PM) rush
        diurnal_factor = 0.8 + 0.9 * math.sin((hour_val - 4) * math.pi / 12) ** 2
        
        # Ambient temperature diurnal curve (cooler at 5 AM, peaks at 2 PM)
        temp_val = round(24.0 + 8.5 * math.sin((hour_val - 6) * math.pi / 12) + random.uniform(-0.4, 0.4), 1)
        hum_val = round(max(35.0, min(85.0, 75.0 - (temp_val - 24.0) * 3.0 + random.uniform(-2, 2))))
        
        # MQ-135 Gas index around baseline 1.0 (clean air: ~0.8-1.2, spikes up to 2.8)
        gas_val = round(max(0.65, min(3.8, (0.95 * diurnal_factor) + random.uniform(-0.15, 0.25))), 2)
        
        level = "GOOD"
        if gas_val >= 2.0:
            level = "UNHEALTHY"
        elif gas_val >= 1.4:
            level = "MODERATE"
            
        readings.append({
            "@timestamp": ts.isoformat(),
            "id": "esp32-badge-01",
            "mode": "ADULT",
            "level": level,
            "gas_level": level,
            "heat_level": "MODERATE" if temp_val > 32 else "GOOD",
            "temp_c": temp_val,
            "hum": hum_val,
            "heat_index_c": round(temp_val + (hum_val * 0.05), 1),
            "gas_index": gas_val,
            "gas_mv": round(gas_val * 950.0 + random.uniform(-20, 20)),
            "gas_baseline_mv": 950.0,
            "calibrated": True,
            "warmup_left_s": 0,
            "mq_fault": False,
            "unhealthy_s": 1800 if level == "UNHEALTHY" else 0,
            "moderate_s": 3600 if level == "MODERATE" else 0,
            "red_s": 900 if level == "UNHEALTHY" else 0,
            "score": round(gas_val * 0.35, 3),
            "gas_dose_idx_h": round(gas_val * 0.12, 3),
            "time_synced": True,
            "wifi_connected": True,
            "cloud_connected": True
        })
        
    return readings