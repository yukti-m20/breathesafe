# 🌬️ BreatheSafe Shield — Complete Software Stack Guide

This software stack connects to your **ESP32-C3 Exposure Badge**, collects and persists time-series environmental data to **OpenSearch**, generates real-time health advisories using **AWS Strands Agents SDK**, and displays a mobile-friendly dashboard.

---

## 🛠️ Stack Overview (AWS Open Source "Build It")

1. **Badge Hardware (ESP32-C3)**:
   - Connects to Wi-Fi and serves `GET /api/data` directly.
   - Has fallback Wi-Fi AP: `ExposureBadge` / `badge1234`.
2. **OpenSearch (Data & Search)**:
   - Local container providing fast time-series search & indexing for historical data.
3. **Collector Backend (FastAPI + Python)**:
   - Polls your badge every 10 seconds.
   - Streams live changes via WebSockets.
   - Proxies Profile Mode changes (CHILD / ADULT / ASTHMA) back to the hardware.
4. **AWS Strands Agents SDK (Agents and AI)**:
   - Tool-augmented AI agent evaluating temperature, gas index, and heat index to generate immediate medical & protective actions.
5. **Modern Dashboard (React + Vite + Tailwind + Recharts)**:
   - Live color-coded alert hero badge.
   - Real-time gauge metrics (Temp, Humidity, Gas Index, Heat Index).
   - Daily exposure dose accumulation bars.
   - Historical time-series graph from OpenSearch.

---

## 🚀 Step-by-Step Run Instructions

### 1. Start OpenSearch (Local Container)
Run with Finch (AWS open-source container engine) or Docker:
```bash
cd breathesafe-v2
finch compose up -d
# OR with docker compose:
docker compose up -d
```
*(OpenSearch is available on `http://localhost:9200`)*

---

### 2. Run the Collector Backend

1. Open a terminal in `breathesafe-v2/collector`:
```bash
cd collector
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp .env.example .env
```
Ensure `ESP32_URL` points to your badge (`http://badge.local` or the actual IP address printed in your Serial Monitor, e.g. `http://192.168.1.50`).

3. Start the collector:
```bash
python -m uvicorn main:app --reload --port 8000
```

---

### 3. Run the Dashboard Frontend

1. Open another terminal in `breathesafe-v2/dashboard`:
```bash
cd dashboard
npm install
npm run dev
```

2. Open your browser on your laptop or phone at:
```
http://localhost:5173
```

---

## 🏆 Hackathon Pitch Points
- **Track 01 (Air)**: Direct tracking of ambient VOC/Gas index, real-time exposure dose calculation, and profile-adaptive thresholds (protecting children and asthma patients).
- **Track 02 (Heat and Water)**: Instant calculation of Heat Index via Rothfusz equation, warning when compounded heat + pollution stressors reach hazardous conditions.
- **AWS Open Source Alignment**: Satisfies track requirements by employing **AWS Strands Agents SDK** for multi-tool intelligent reasoning and **OpenSearch** for time-series sensor ingestion.
