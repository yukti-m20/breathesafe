import json
from typing import List, Dict, Any, Optional

# Major cities with realistic diurnal pollution & heat profiles (base AQI, variation curve)
CITY_PROFILES = {
    "Delhi NCR": {"base_aqi": 185, "base_temp": 32, "peak_hours": [8, 9, 10, 19, 20, 21, 22]},
    "Mumbai": {"base_aqi": 95, "base_temp": 33, "humidity": 78, "peak_hours": [9, 10, 18, 19]},
    "Bengaluru": {"base_aqi": 65, "base_temp": 26, "humidity": 65, "peak_hours": [9, 10, 18, 19]},
    "Kolkata": {"base_aqi": 140, "base_temp": 31, "humidity": 75, "peak_hours": [8, 9, 19, 20]},
    "Hyderabad": {"base_aqi": 88, "base_temp": 30, "humidity": 60, "peak_hours": [9, 10, 18, 19]},
    "Chennai": {"base_aqi": 75, "base_temp": 34, "humidity": 80, "peak_hours": [8, 9, 18, 19]},
    "Pune": {"base_aqi": 82, "base_temp": 28, "humidity": 62, "peak_hours": [9, 10, 18, 19]}
}

MODE_THRESHOLDS = {
    "child": {"amber_aqi": 100, "red_aqi": 160, "hi_amber": 30.0, "hi_red": 35.0, "desc": "More sensitive lungs, smaller body mass"},
    "adult": {"amber_aqi": 150, "red_aqi": 250, "hi_amber": 32.0, "hi_red": 39.0, "desc": "Standard occupational limits"},
    "asthma": {"amber_aqi": 80, "red_aqi": 130, "hi_amber": 29.0, "hi_red": 34.0, "desc": "Hypersensitive airway thresholds"}
}

ACTIVITY_MULTIPLIERS = {
    "rest": 0.8,        # Light breathing (sleep/sedentary)
    "light": 1.0,       # Walking/sitting in class/office
    "exercise": 2.5     # Deep pulmonary ventilation (run/gym/sports)
}

ENVIRONMENT_FACTORS = {
    "indoor": 0.45,     # 55% filtration/attenuation indoors
    "outdoor": 1.0      # 100% direct ambient exposure
}

def get_48h_forecast(city: str = "Delhi NCR") -> List[Dict[str, Any]]:
    """Generates synthetic 48-hour hourly AQI, Temp, Humidity, and Heat Index for a city."""
    city_data = CITY_PROFILES.get(city, CITY_PROFILES["Delhi NCR"])
    base_aqi = city_data["base_aqi"]
    base_t = city_data["base_temp"]
    
    forecast = []
    for h in range(48):
        hour_of_day = h % 24
        day_offset = h // 24
        
        # Diurnal curves: AQI higher in late evening/early morning (inversion)
        if 6 <= hour_of_day <= 10:
            aqi_mod = 1.25
            temp_mod = -2
        elif 12 <= hour_of_day <= 16:
            aqi_mod = 0.80  # Dispersion
            temp_mod = 4    # Afternoon peak heat
        elif 18 <= hour_of_day <= 23:
            aqi_mod = 1.35  # Evening traffic + cooling inversion
            temp_mod = 0
        else:
            aqi_mod = 1.10
            temp_mod = -4   # Night minimum
            
        cur_aqi = int(base_aqi * aqi_mod + (h % 5) * 3)
        cur_temp = round(base_t + temp_mod + ((h * 7) % 3) * 0.4, 1)
        cur_hum = round(60 + (10 if hour_of_day < 8 else -15), 1)
        
        # Simple Heat Index approximation
        hi = round(cur_temp + (cur_hum / 100.0) * 3.5, 1)
        
        forecast.append({
            "hour_index": h,
            "day": "Today" if day_offset == 0 else "Tomorrow",
            "hour": f"{hour_of_day:02d}:00",
            "time_label": f"{hour_of_day % 12 or 12} {'AM' if hour_of_day < 12 else 'PM'}",
            "aqi": cur_aqi,
            "temp_c": cur_temp,
            "humidity": cur_hum,
            "heat_index_c": hi
        })
    return forecast

def calculate_exposure_score(blocks: List[Dict[str, Any]], forecast_24h: List[Dict[str, Any]], mode: str = "adult") -> Dict[str, Any]:
    """Calculates time-weighted exposure score for the day."""
    thresholds = MODE_THRESHOLDS.get(mode, MODE_THRESHOLDS["adult"])
    amber_thresh = thresholds["amber_aqi"]
    red_thresh = thresholds["red_aqi"]
    
    total_weighted_dose = 0.0
    unhealthy_air_minutes = 0
    heat_stress_minutes = 0
    
    hourly_breakdown = []
    
    # We iterate over hours 0..23
    for h in range(24):
        f_hour = forecast_24h[h] if h < len(forecast_24h) else forecast_24h[0]
        ambient_aqi = f_hour["aqi"]
        ambient_hi = f_hour["heat_index_c"]
        
        # Find block matching this hour
        block = next((b for b in blocks if b["start_hour"] <= h < b["end_hour"]), None)
        if not block:
            env = "indoor"
            act = "rest"
            title = "Home / Rest"
        else:
            env = block.get("environment", "indoor")
            act = block.get("activity", "light")
            title = block.get("title", "Routine")
            
        act_factor = ACTIVITY_MULTIPLIERS.get(act, 1.0)
        env_factor = ENVIRONMENT_FACTORS.get(env, 0.45)
        
        # Effective exposure experienced by the lungs
        effective_aqi = round(ambient_aqi * env_factor * act_factor, 1)
        effective_hi = round(ambient_hi * (0.85 if env == "indoor" else 1.0), 1)
        
        total_weighted_dose += effective_aqi * 1.0  # AQI-hours
        
        # Is effective AQI unhealthy for this mode?
        if effective_aqi >= amber_thresh:
            unhealthy_air_minutes += 60
            
        if effective_hi >= thresholds["hi_amber"]:
            heat_stress_minutes += 60
            
        hourly_breakdown.append({
            "hour": f_hour["hour"],
            "title": title,
            "environment": env,
            "activity": act,
            "ambient_aqi": ambient_aqi,
            "effective_aqi": effective_aqi,
            "effective_hi": effective_hi
        })
        
    hours_bad = unhealthy_air_minutes // 60
    mins_bad = unhealthy_air_minutes % 60
    
    hours_heat = heat_stress_minutes // 60
    mins_heat = heat_stress_minutes % 60
    
    # Normalised score (0 to 10 scale)
    dose_score = round(min(total_weighted_dose / 1200.0, 10.0), 2)
    
    # Hindi summary generation
    hindi_status = "सामान्य" if dose_score < 3.5 else ("मध्यम" if dose_score < 6.5 else "चिंताजनक (खराब)")
    hindi_summary = (
        f"आज आपका कुल प्रदूषण स्कोर {dose_score}/10 रहा ({hindi_status})। "
        f"अस्वस्थ हवा में लगभग {hours_bad} घंटे {mins_bad} मिनट व्यतीत हुए। "
        f"{'दोपहर में अधिक गर्मी से बचें।' if hours_heat > 0 else 'तापमान नियंत्रण में है।'}"
    )

    return {
        "score": dose_score,
        "total_dose_aqi_h": round(total_weighted_dose, 1),
        "unhealthy_air_text": f"{hours_bad}h {mins_bad:02d}m today",
        "unhealthy_air_minutes": unhealthy_air_minutes,
        "heat_stress_text": f"{hours_heat}h {mins_heat:02d}m today",
        "heat_stress_minutes": heat_stress_minutes,
        "mode": mode,
        "hindi_summary": hindi_summary,
        "hourly_breakdown": hourly_breakdown
    }

def find_best_windows(forecast_48h: List[Dict[str, Any]], mode: str = "adult") -> Dict[str, Any]:
    """Finds best 1-2 hour windows for outdoor activity/running vs windows to avoid."""
    thresholds = MODE_THRESHOLDS.get(mode, MODE_THRESHOLDS["adult"])
    amber = thresholds["amber_aqi"]
    
    # Rank morning windows (5 AM - 9 AM) and evening (4 PM - 8 PM)
    windows = []
    for i in range(len(forecast_48h) - 1):
        h1 = forecast_48h[i]
        h2 = forecast_48h[i+1]
        avg_aqi = (h1["aqi"] + h2["aqi"]) / 2.0
        avg_hi = (h1["heat_index_c"] + h2["heat_index_c"]) / 2.0
        
        windows.append({
            "day": h1["day"],
            "window": f"{h1['time_label']} - {h2['time_label']}",
            "avg_aqi": int(avg_aqi),
            "avg_hi": round(avg_hi, 1),
            "hour_start": int(h1["hour"][:2]),
            "safe": avg_aqi < amber and avg_hi < thresholds["hi_amber"]
        })
        
    # Best window is lowest AQI + comfortable HI
    morning_candidates = [w for w in windows if 5 <= w["hour_start"] <= 8 and w["day"] == "Today"]
    evening_candidates = [w for w in windows if 16 <= w["hour_start"] <= 20 and w["day"] == "Today"]
    
    best_morning = min(morning_candidates, key=lambda x: x["avg_aqi"]) if morning_candidates else windows[6]
    worst_window = max(windows[:24], key=lambda x: x["avg_aqi"])
    
    return {
        "best_window": f"{best_morning['window']} ({best_morning['day']})",
        "best_aqi": best_morning["avg_aqi"],
        "avoid_window": f"{worst_window['window']} ({worst_window['day']})",
        "avoid_aqi": worst_window["avg_aqi"],
        "recommendation": f"Best outdoor window: {best_morning['window']} (AQI ~{best_morning['avg_aqi']}). Strictly avoid {worst_window['window']} (AQI ~{worst_window['avg_aqi']}) for {mode}."
    }
