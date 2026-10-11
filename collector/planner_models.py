import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DayBlock(BaseModel):
    id: str
    title: str
    start_hour: int
    end_hour: int
    environment: str  # indoor | outdoor
    activity: str     # rest | light | exercise

class ExposureRequest(BaseModel):
    city: str = "Delhi NCR"
    mode: str = "adult"
    blocks: List[DayBlock]

class IngestReading(BaseModel):
    id: Optional[str] = "esp32-badge"
    mode: Optional[str] = "ADULT"
    level: Optional[str] = "GOOD"
    gas_level: Optional[str] = "GOOD"
    heat_level: Optional[str] = "GOOD"
    temp_c: Optional[float] = 28.0
    hum: Optional[float] = 60.0
    heat_index_c: Optional[float] = 30.0
    gas_index: Optional[float] = 1.05
    score: Optional[float] = 0.05
    gas_dose_idx_h: Optional[float] = 0.02

class CoachQuery(BaseModel):
    query: str
    city: str = "Delhi NCR"
    mode: str = "adult"
    lang: Optional[str] = "en"
    score_context: Optional[str] = None
    forecast_context: Optional[str] = None

class CallTriggerRequest(BaseModel):
    phone_number: str
    reason: str  # 'aqi_spike' | 'mask_advisory' | 'predictive_alert' | custom text
    city: Optional[str] = "Delhi NCR"
    mode: Optional[str] = "adult"
    lang: Optional[str] = "en"
    auto_trigger: Optional[bool] = False


class TwilioConfigRequest(BaseModel):
    account_sid: str
    auth_token: str
    from_number: str