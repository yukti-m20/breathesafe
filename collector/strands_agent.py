"""
strands_agent.py
----------------
AWS Strands Agents SDK integration for BreatheSafe.

Provides:
  - Three @tool helper functions consumed by the Strands Agent
  - _build_model()    -- selects the correct LLM backend from STRANDS_PROVIDER env
  - create_agent()    -- assembles the Agent with tools + model
  - generate_action() -- high-level: given badge data, return 1-2 sentence health
                         recommendation (deterministic fallback on any error)
"""

import logging
import os

try:
    from strands import Agent, tool
    from strands.models import BedrockModel
    STRANDS_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    STRANDS_AVAILABLE = False
    # Safe stub decorator & agent class if strands package is missing
    def tool(fn):
        return fn

    class Agent:
        def __init__(self, *args, **kwargs):
            pass
        def run(self, prompt: str):
            return ""

    class BedrockModel:
        def __init__(self, *args, **kwargs):
            pass

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Strands @tool definitions
# ---------------------------------------------------------------------------

@tool
def get_mode_thresholds(mode: str) -> dict:
    """
    Return the gas-index and heat-index amber/red thresholds for a given mode.

    These values mirror the ESP32 firmware constants exactly:
      - child:  gas amber=1.5, gas red=2.5, heat amber=30, heat red=35
      - adult:  gas amber=2.0, gas red=3.5, heat amber=32, heat red=39
      - asthma: gas amber=1.4, gas red=2.2, heat amber=30, heat red=35

    Args:
        mode: One of "child", "adult", or "asthma" (case-insensitive).

    Returns:
        Dict with keys: gas_amber, gas_red, heat_amber, heat_red.
        Defaults to adult thresholds for unknown modes.
    """
    THRESHOLDS = {
        "child":  {"gas_amber": 1.5, "gas_red": 2.5, "heat_amber": 30, "heat_red": 35},
        "adult":  {"gas_amber": 2.0, "gas_red": 3.5, "heat_amber": 32, "heat_red": 39},
        "asthma": {"gas_amber": 1.4, "gas_red": 2.2, "heat_amber": 30, "heat_red": 35},
    }
    return THRESHOLDS.get(mode.lower(), THRESHOLDS["adult"])


@tool
def get_protective_actions(
    level: str,
    gas_level: str,
    heat_level: str,
    mode: str,
) -> list[str]:
    """
    Return a prioritised list of specific protective actions based on current
    air-quality and heat levels for the given wearer mode.

    Args:
        level:      Overall badge level ("GOOD", "MODERATE", "UNHEALTHY").
        gas_level:  Gas-sensor sub-level ("GOOD", "MODERATE", "UNHEALTHY").
        heat_level: Heat-index sub-level ("GOOD", "MODERATE", "UNHEALTHY").
        mode:       Badge wearer mode ("child", "adult", "asthma").

    Returns:
        List of actionable recommendation strings, most urgent first.
    """
    actions: list[str] = []
    lvl  = level.upper()
    gas  = gas_level.upper()
    heat = heat_level.upper()
    m    = mode.lower()

    # Gas-driven actions
    if gas == "UNHEALTHY":
        actions.append("Move immediately to a well-ventilated area or indoors.")
        actions.append("Wear a high-quality mask (N95/KN95) if you must stay outside.")
        if m == "asthma":
            actions.append("Use your rescue inhaler if you feel any breathing difficulty.")
        actions.append("Avoid physical exertion until air quality improves.")
    elif gas == "MODERATE":
        actions.append("Limit prolonged outdoor exposure.")
        if m in ("child", "asthma"):
            actions.append("Consider a mask for sensitive individuals.")
        actions.append("Keep windows closed if indoors.")

    # Heat-driven actions
    if heat == "UNHEALTHY":
        actions.append("Hydrate frequently — drink water every 15-20 minutes.")
        actions.append("Seek shade or air-conditioned spaces immediately.")
        if m == "child":
            actions.append("Stop all outdoor play and move children indoors now.")
    elif heat == "MODERATE":
        actions.append("Take regular hydration breaks.")
        actions.append("Avoid peak-sun-hour outdoor activity (10 am - 4 pm).")

    # Overall level catch-all when no sub-driver fired
    if lvl == "GOOD" and not actions:
        actions.append("Air quality is good. Enjoy your day!")
    elif lvl == "MODERATE" and not actions:
        actions.append("Conditions are moderate. Stay aware and limit strenuous outdoor activity.")

    return actions


@tool
def is_warmup_period(warmup_left_s: int) -> str:
    """
    Return a human-readable warmup status string for the MQ gas sensor.

    The MQ gas sensor requires a warm-up period after power-on before its
    readings become reliable.

    Args:
        warmup_left_s: Seconds remaining in the sensor warm-up period (0 = ready).

    Returns:
        Human-readable string describing the warm-up state.
    """
    if warmup_left_s <= 0:
        return "Sensor is fully warmed up and readings are reliable."
    minutes = warmup_left_s // 60
    seconds = warmup_left_s % 60
    if minutes > 0:
        return (
            f"Sensor is warming up -- {minutes}m {seconds}s remaining. "
            "Gas readings may not yet be accurate."
        )
    return (
        f"Sensor is warming up -- {seconds} seconds remaining. "
        "Gas readings may not yet be accurate."
    )


# ---------------------------------------------------------------------------
# Model factory
# ---------------------------------------------------------------------------

def _build_model():
    """
    Instantiate the correct Strands model backend based on STRANDS_PROVIDER.

    Supported values (set in .env):
      bedrock   -> AWS Bedrock (default)
      anthropic -> Anthropic Claude
      openai    -> OpenAI
      ollama    -> Local Ollama

    Returns:
        A Strands-compatible model instance.
    """
    provider = os.getenv("STRANDS_PROVIDER", "bedrock").lower()

    if provider == "anthropic":
        from strands.models.anthropic import AnthropicModel  # type: ignore
        logger.info("Using Strands model backend: Anthropic")
        return AnthropicModel(
            client_args={"api_key": os.getenv("ANTHROPIC_API_KEY")},
            model_id="claude-3-haiku-20240307",
        )

    if provider == "openai":
        from strands.models.openai import OpenAIModel  # type: ignore
        logger.info("Using Strands model backend: OpenAI")
        return OpenAIModel(
            client_args={"api_key": os.getenv("OPENAI_API_KEY")},
            model_id="gpt-4o-mini",
        )

    if provider == "ollama":
        from strands.models.ollama import OllamaModel  # type: ignore
        logger.info("Using Strands model backend: Ollama")
        return OllamaModel(
            host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
            model_id=os.getenv("OLLAMA_MODEL", "llama3"),
        )

    # Default: AWS Bedrock
    model_id = os.getenv("STRANDS_MODEL_ID", "us.amazon.nova-lite-v1:0")
    logger.info("Using Strands model backend: AWS Bedrock (%s)", model_id)
    return BedrockModel(model_id=model_id)


# ---------------------------------------------------------------------------
# Agent factory
# ---------------------------------------------------------------------------

def create_agent() -> Agent:
    """
    Assemble and return a Strands Agent configured with the health tools and
    the model selected by STRANDS_PROVIDER.

    Returns:
        Configured Strands Agent instance ready to receive prompts.
    """
    model = _build_model()
    agent = Agent(
        model=model,
        tools=[get_mode_thresholds, get_protective_actions, is_warmup_period],
        system_prompt=(
            "You are a personal health safety assistant for a wearable air quality badge "
            "worn by schoolchildren and their caregivers. "
            "Your recommendations must be clear, practical, and age-appropriate. "
            "Always prioritise the safety of children and individuals with asthma."
        ),
    )
    logger.info("Strands Agent created successfully.")
    return agent


# ---------------------------------------------------------------------------
# High-level action generation
# ---------------------------------------------------------------------------

# Deterministic fallbacks keyed by overall level — used when the LLM is
# unavailable, misconfigured, or raises any exception.
_FALLBACKS: dict[str, str] = {
    "GOOD":      "Air quality is good. No action needed -- enjoy your day!",
    "MODERATE":  "Air quality is moderate. Consider limiting prolonged outdoor exposure.",
    "UNHEALTHY": (
        "Unhealthy air detected! Move to a well-ventilated area and consider wearing a mask."
    ),
}


def generate_action(badge_data: dict) -> str:
    """
    Generate a 1-2 sentence health recommendation from the badge sensor data.

    Builds a structured prompt, calls the Strands Agent (creating a fresh one),
    and returns the response trimmed to 200 characters.

    Falls back to a deterministic message keyed on badge_data["level"] if the
    agent call fails for ANY reason (missing API keys, network errors, etc.).

    Args:
        badge_data: Full dict from the badge GET /api/data response.

    Returns:
        A short, actionable recommendation string (<=200 chars).
    """
    level      = badge_data.get("level", "GOOD")
    gas_level  = badge_data.get("gas_level", "GOOD")
    heat_level = badge_data.get("heat_level", "GOOD")
    mode       = badge_data.get("mode", "ADULT")
    temp_c     = badge_data.get("temp_c", 0.0)
    hum        = badge_data.get("hum", 0.0)
    hi_c       = badge_data.get("heat_index_c", 0.0)
    gas_index  = badge_data.get("gas_index", 0.0)
    score      = badge_data.get("score", 0.0)
    warmup     = badge_data.get("warmup_left_s", 0)
    mq_fault   = badge_data.get("mq_fault", False)

    # Compact, information-dense prompt
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

    try:
        agent = create_agent()
        result = agent(prompt)
        text: str = str(result).strip()
        # Trim to 200 characters at a word boundary to avoid cutting mid-word
        if len(text) > 200:
            text = text[:197].rsplit(" ", 1)[0] + "..."
        return text if text else _FALLBACKS.get(level.upper(), _FALLBACKS["GOOD"])
    except Exception as exc:
        logger.warning(
            "Strands Agent call failed (%s); using deterministic fallback for level=%s.",
            exc,
            level,
        )
        return _FALLBACKS.get(level.upper(), _FALLBACKS["GOOD"])
def ask_coach(query: str, city: str, mode: str, lang: str = "en", score_text: str = "", forecast_text: str = "") -> str:
    """
    Answers user queries in the chosen language ('en' or 'hi')
    using Strands tools & prompt context.
    """
    q_lower = query.lower()
    is_hi = (lang == "hi")
    
    # Target hour calculation
    target_hour = None
    for h in range(1, 13):
        if f"{h} pm" in q_lower or f"{h}pm" in q_lower:
            target_hour = h + 12
            break
        elif f"{h} am" in q_lower or f"{h}am" in q_lower:
            target_hour = h
            break

    # Time-based response
    if target_hour is not None:
        if 16 <= target_hour <= 21:
            if mode in ("child", "asthma"):
                if is_hi:
                    return (
                        f"⚠️ {city} में {mode} प्रोफाइल के लिए शाम {target_hour % 12 or 12} बजे बाहर जाना सुरक्षित नहीं है। "
                        f"शाम 4 से 8 बजे प्रदूषण का स्तर बहुत अधिक रहता है। "
                        f"सलाह: बच्चों और संवेदनशील व्यक्तियों को इनडोर खेल खिलाएं या बाहर जाने का समय सुबह 6:30 - 7:30 बजे रखें।"
                    )
                else:
                    return (
                        f"⚠️ For {mode.capitalize()} mode in {city}, outdoor activity around {target_hour % 12 or 12} PM is NOT recommended. "
                        f"Pollution peaks between 4 PM - 8 PM due to traffic and cooling inversion. Keep play indoors or shift outdoor activity to 6:30 - 7:30 AM."
                    )
            else:
                if is_hi:
                    return (
                        f"⚠️ {city} में शाम के समय हवा की गुणवत्ता कमजोर हो जाती है। "
                        f"हल्की सैर ठीक है, लेकिन शाम 4 से 7:30 के बीच भारी दौड़ या कठिन व्यायाम से बचें।"
                    )
                else:
                    return (
                        f"⚠️ {city} air quality drops in late afternoon. Light walking is acceptable, but avoid intense cardio or outdoor runs between 4 PM - 7:30 PM."
                    )
        elif 6 <= target_hour <= 9:
            if is_hi:
                return (
                    f"✅ सुबह का समय ({target_hour % 12 or 12} बजे) सबसे अनुकूल है! "
                    f"तापमान सुखद है और हवा में फैलाव बेहतर है। {mode} प्रोफाइल के लिए बाहर जाना पूरी तरह सुरक्षित है।"
                )
            else:
                return (
                    f"✅ Morning window ({target_hour % 12 or 12} AM) is optimal! Ambient temperatures are pleasant and air dispersion is favorable. Safe for {mode.capitalize()}."
                )

    if "mask" in q_lower or "n95" in q_lower or "मास्क" in q_lower:
        if is_hi:
            return f"😷 {city} में यदि आप 20 मिनट से अधिक बाहर रह रहे हैं, तो N95 मास्क अवश्य पहनें, विशेष रूप से {mode} प्रोफाइल के लिए जब AQI 120 से अधिक हो।"
        else:
            return f"😷 In {city}, wear a certified N95 respirator if outdoors for >20 mins, especially for {mode} mode when AQI exceeds 120."

    if "run" in q_lower or "exercise" in q_lower or "play" in q_lower or "कसरत" in q_lower or "दौड़" in q_lower:
        if is_hi:
            return (
                f"🏃 {city} में कसरत या दौड़ने के लिए सुबह 6:00 से 7:30 बजे का समय सबसे उत्तम है। "
                f"भारी कसरत से फेफड़ों में 2.5 गुना अधिक हवा और धूल खिंचती है; शाम 4:30 के बाद बाहर कसरत न करें।"
            )
        else:
            return (
                f"🏃 Best window for exercise/running in {city} is early morning (6:00 AM – 7:30 AM). Vigorous exertion multiplies lung intake by 2.5×; avoid outdoor workouts after 4:30 PM."
            )

    if is_hi:
        return (
            f"🛡️ {city} में {mode} प्रोफाइल के लिए: शाम के समय खिड़कियां बंद रखें और एयर प्यूरीफायर का उपयोग करें। "
            f"व्यायाम सुबह 6-8 बजे के बीच करें और गर्मी अधिक होने पर पर्याप्त पानी पिएं।"
        )
    else:
        return (
            f"🛡️ For {mode.capitalize()} mode in {city}: Maintain indoor filtration during evening traffic hours. Keep intense exercise to early morning (6–8 AM) and hydrate well if Heat Index exceeds 32°C."
        )
