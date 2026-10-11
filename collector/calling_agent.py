"""
calling_agent.py
----------------
Automated emergency voice alerting engine for BreatheSafe.
Places automated telephone voice calls to users or caregivers when:
  1. Real-time air quality spikes past hazardous/red thresholds.
  2. 48h predictive models forecast imminent severe particulate pollution.
  3. Urgent N95 respirator / mask advisory is required before outdoor transit.

Supports:
  - Twilio Voice REST API (via HTTP/TwiML with Amazon Polly / Google TTS voices)
  - Simulated Voice Call dispatch with full TwiML generation, transcript, and audio test preview
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("calling_agent")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+18005550199")

# In-memory call log for dashboard visibility and auditing
call_history: list[Dict[str, Any]] = []

def generate_voice_script(reason: str, mode: str, city: str, lang: str = "en") -> Dict[str, str]:
    """
    Generate spoken voice messages tailored to emergency reason, vulnerability profile, and language.
    """
    lang = (lang or "en").lower()
    mode_cap = mode.capitalize()
    
    if lang == "hi":
        if "mask" in reason.lower() or "n95" in reason.lower():
            text = (
                f"नमस्ते। यह ब्रीद-सेफ आपातकालीन स्वास्थ्य सेवा है। {city} में वायु गुणवत्ता गंभीर स्तर पर पहुँच गई है। "
                f"अपने {mode_cap} सुरक्षा मोड के अनुसार, बाहर निकलने से पहले कृपया अनिवार्य रूप से N95 मास्क पहनें, "
                f"खिड़कियाँ बंद रखें, और बाहरी व्यायाम से बचें।"
            )
        elif "predict" in reason.lower() or "forecast" in reason.lower():
            text = (
                f"नमस्ते। ब्रीद-सेफ 48 घंटे के पूर्वानुमान चेतावनी: {city} में अगले कुछ घंटों में भयंकर प्रदूषण और वायु गुणवत्ता सूचकांक लाल स्तर पर जाने की संभावना है। "
                f"कृपया अपनी यात्रा योजना बदलें और इनडोर एयर प्यूरीफायर चालू रखें।"
            )
        else:
            text = (
                f"चेतावनी! ब्रीद-सेफ सेंसर ने {city} में अत्यंत खतरनाक वायु प्रदूषण का स्तर दर्ज किया है। "
                f"{mode_cap} सुरक्षा प्रोफाइल खतरे में है। तुरंत किसी स्वच्छ इनडोर स्थान में जाएँ और सुरक्षात्मक N95 मास्क पहनें।"
            )
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="hi-IN">{text}</Say>
    <Pause length="1"/>
    <Say voice="Polly.Aditi" language="hi-IN">सुरक्षित रहें। ब्रीद-सेफ स्वास्थ्य सुरक्षा द्वारा जारी।</Say>
</Response>"""
    else:
        # Default English
        if "mask" in reason.lower() or "n95" in reason.lower():
            text = (
                f"Attention. This is an urgent advisory from BreatheSafe Shield. "
                f"Air quality in {city} has deteriorated to hazardous levels. "
                f"For your {mode_cap} profile, wearing a certified N95 respirator is strictly mandatory before going outdoors. "
                f"Keep all windows sealed and activate indoor air filtration."
            )
        elif "predict" in reason.lower() or "forecast" in reason.lower():
            text = (
                f"Notice from BreatheSafe Predictive Analytics. A dangerous AQI pollution spike is forecast for {city} within the next 3 hours. "
                f"High-risk exposure is predicted. Please reschedule outdoor activities, carry an N95 mask, and remain in protected zones."
            )
        else:
            text = (
                f"Emergency Alert from BreatheSafe. Real-time air quality in {city} has crossed the hazardous red threshold. "
                f"Immediate action required for {mode_cap} mode: Move indoors, minimize physical exertion, and equip an N95 respirator."
            )
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna" language="en-US">{text}</Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna" language="en-US">Stay safe and breathe clean air. BreatheSafe Shield protection alert.</Say>
</Response>"""

    return {"text": text, "twiml": twiml}


async def trigger_emergency_call(
    phone_number: str,
    reason: str,
    city: str = "Delhi NCR",
    mode: str = "adult",
    lang: str = "en",
    auto_trigger: bool = False
) -> Dict[str, Any]:
    """
    Trigger emergency outbound call via Twilio Voice API if credentials exist,
    or via high-fidelity simulated agent call with audio-ready TwiML.
    """
    scripts = generate_voice_script(reason, mode, city, lang)
    spoken_text = scripts["text"]
    twiml = scripts["twiml"]
    
    timestamp = datetime.now(timezone.utc).isoformat()
    call_id = f"CALL-{int(datetime.now().timestamp())}"
    
    provider = "simulation"
    status = "completed"
    error = None

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER:
        try:
            # Twilio REST API voice call endpoint
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Calls.json"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                    data={
                        "To": phone_number,
                        "From": TWILIO_FROM_NUMBER,
                        "Twiml": twiml,
                    }
                )
                if resp.status_code in (200, 201):
                    provider = "twilio_live"
                    call_meta = resp.json()
                    call_id = call_meta.get("sid", call_id)
                    status = call_meta.get("status", "queued")
                else:
                    provider = "twilio_fallback_simulation"
                    error = f"Twilio API {resp.status_code}: {resp.text}"
                    logger.warning(f"Twilio call failed, falling back to simulated dispatch: {error}")
        except Exception as e:
            provider = "twilio_fallback_simulation"
            error = str(e)
            logger.error(f"Error calling Twilio: {e}")
    else:
        provider = "simulated_agent"

    call_record = {
        "call_id": call_id,
        "phone_number": phone_number,
        "timestamp": timestamp,
        "reason": reason,
        "city": city,
        "mode": mode,
        "lang": lang,
        "provider": provider,
        "status": status,
        "auto_trigger": auto_trigger,
        "spoken_script": spoken_text,
        "twiml": twiml,
        "error": error
    }
    
    # Store at front of log
    call_history.insert(0, call_record)
    if len(call_history) > 50:
        call_history.pop()
        
    return call_record

def get_call_history() -> list[Dict[str, Any]]:
    return call_history


def set_twilio_credentials(account_sid: str, auth_token: str, from_number: str):
    global TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
    TWILIO_ACCOUNT_SID = (account_sid or "").strip()
    TWILIO_AUTH_TOKEN = (auth_token or "").strip()
    TWILIO_FROM_NUMBER = (from_number or "").strip()
    return {
        "configured": bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER),
        "from_number": TWILIO_FROM_NUMBER
    }