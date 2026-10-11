# BreatheSafe

**Personal air quality and toxic exposure badge — protecting vulnerable lungs in real time.**

![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![AWS](https://img.shields.io/badge/AWS-Strands%20Agents-orange)
![Bedrock](https://img.shields.io/badge/Amazon-Bedrock-purple)
![OpenSearch](https://img.shields.io/badge/Amazon-OpenSearch-005BA8)
![ESP32](https://img.shields.io/badge/ESP32--C3-Hardware--First-red)
![Cedar](https://img.shields.io/badge/Policy-Cedar-green)
![Twilio](https://img.shields.io/badge/Emergency-Twilio%20Voice-crimson)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> Most air monitors sit on a wall 5 km away. BreatheSafe travels with your lungs — intervening before toxic air enters your bloodstream.

BreatheSafe is a **hardware-first, agentic respiratory companion** for high-risk individuals: ESP32-C3 wearable micro-badge + MQ-135 semiconductor gas chamber + SSD1306 OLED + AWS Strands Agents SDK + OpenSearch historical diurnal telemetry + consent-aware Twilio emergency voice escalation — built to **ship on AWS**.

The wearer (child, commuter, or asthma patient) clips on the ultra-light badge. The badge monitors volatile organic compounds (VOCs), harmful gases, and cumulative toxic inhalation dose. When hazardous spikes occur, the **AWS Strands AI Agent** dynamically evaluates personal vulnerability thresholds, pushes actionable guidance directly onto the badge OLED screen, and automatically dispatches voice and SMS alerts to caregivers if acute exposure persists.

**Track:** **Air Quality & Respiratory Protection**  
**Hardware Firmware:** [`firmware/firmware.ino`](firmware/firmware.ino) · **Collector Backend:** [`collector/`](collector/) · **Dashboard:** [`dashboard/`](dashboard/)

---

## The problem

City-wide Air Quality Index (AQI) stations report regional averages measured hours ago from rooftops kilometers away. They cannot tell you that an idling diesel truck is blowing toxic exhaust into your child's face, or that a sudden indoor VOC chemical leak has filled a classroom.

Standard pollution apps are passive and reactive: they give abstract numbers after the wearer has already inhaled thousands of toxic particulates. Panic buttons require conscious, manual activation by victims already suffering from bronchospasm or suffocation.

BreatheSafe sits in between: it tracks the exact air you breathe every second, calculates cumulative time-weighted toxic dosage ($idx \cdot h$), adapts thresholds to the wearer's clinical profile (Child, Adult, Asthma), speaks directly to the wearer via the badge OLED, and autonomously alerts family or emergency contacts only when true danger occurs.

---

## Who it’s for

| Who | What they get |
| --- | --- |
| **Wearer (Child / Asthmatic / Senior)** | Wearable micro-badge + OLED line-of-sight alerts; zero learning curve; instant haptic/visual warnings |
| **Family & Caregivers** | Live telemetry command view; cumulative toxic dose tracking; notified only on acute hazard |
| **Emergency Contacts / Doctors** | Automated Twilio voice calls during sustained hazardous exposure spikes with GPS city context |

BreatheSafe is **not** a diagnostic hospital EMR. Family screens always surface local emergency services (**112**).

---

## What BreatheSafe does

| Capability | Detail |
| --- | --- |
| **Agentic AI Health Coach** | Evaluates real-time sensor streams using **AWS Strands Agents SDK**; emits direct, clinical recommendations (not generic bot chat). |
| **Hardware-first micro-badge** | ESP32-C3 RISC-V SoC + MQ-135 gas sensor + DHT11 ambient sensor + SSD1306 128×64 OLED + multi-color LED alert ring. |
| **Two-way IoT cloud sync** | Sensor pushes telemetry up to AWS; AI-generated health actions sync back down onto the badge's OLED screen in real time. |
| **OpenSearch diurnal memory** | Time-series indexing in **Amazon OpenSearch**: tracks 24h diurnal commute pollution spikes, sensor drift, and alert audits. |
| **Vulnerability-adaptive profiles** | Switch between **Child** (1.5× alert), **Adult** (2.0×), and **Asthma** (1.4×); threshold envelopes update dynamically in code and firmware. |
| **Cumulative toxic inhalation dose** | Time-weighted integral of toxic gas exposure ($\int (idx - 1) \, dt$ in $idx \cdot h$), tracking chronic damage beyond momentary spikes. |
| **Automated voice & SMS escalation** | Autonomous **Twilio Voice Agent** dispatches urgent voice calls and SMS alerts to caregivers upon sustained red-level hazards. |
| **Cedar policy & consent guard** | Persona-based data boundaries (Child vs Caregiver vs Physician) and explicit privacy rules enforced prior to tool execution. |
| **Graceful 3-tier agent demotion** | Bedrock Nova/Claude → Local Edge LLM → Deterministic heuristic fallback; zero silent failures when offline. |
| **Zero-calibration cold start** | Pre-calibrated clean-air baseline ($950\text{ mV}$) with non-volatile flash fallback ensures instant out-of-the-box operation. |

### Example moments

| Moment | What happens | AWS Services |
| --- | --- | --- |
| Commute through traffic | Badge detects sudden 2.8× VOC spike; red LED flashes; OLED displays `"WEAR MASK / VENTILATE"` | ESP32-C3 · Strands Agents · OpenSearch |
| Asthmatic profile activated | Amber threshold tightens from 2.0× to 1.4×; AI recommends prophylactic inhaler readiness | Bedrock (Nova Lite) · Cedar · FastAPI |
| Sustained hazardous exposure | Red hazard persists > 60s; autonomous escalation triggers automated caregiver phone call | Twilio Voice · Strands Agent · OpenSearch Alerts |
| Evening family check | Caregiver reviews 24h historical diurnal graph; checks cumulative daily toxic inhalation dose | Amazon OpenSearch · React / Recharts |
| Cloud / network drop | Agent gracefully demotes to local heuristic engine; badge continues autonomous local alerting | ESP32-C3 Local Firmware · 3-Tier Demotion Matrix |

---

## Architecture (AWS-first)

```
   ┌───────────────────────────────────────────────────────────────┐
   │                  ESP32-C3 Wearable Badge                      │
   │  MQ-135 Gas Chamber · SSD1306 OLED · Multi-Color LED Alert    │
   └───────────────▲───────────────────────────────┬───────────────┘
                   │ Two-Way HTTP Sync             │ REST / WebSocket
                   ▼                               ▼
   ┌───────────────────────────────────────────────────────────────┐
   │            BreatheSafe Collector & Gateway (FastAPI)           │
   │         Ingest Pipeline · Telemetry Poller · CORS Guard       │
   └───────┬───────────────────────┬───────────────────────┬───────┘
           │                       │                       │
           ▼                       ▼                       ▼
 ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
 │ AWS Strands Agents│   │ Amazon OpenSearch │   │ Emergency Voice   │
 │        SDK        │   │    Service        │   │    Escalation     │
 │  Multi-Tool Agent │   │ Time-Series Index │   │   Twilio Voice    │
 │ Bedrock Nova Lite │   │  Diurnal Telemetry│   │  Caregiver Calls  │
 └─────────┬─────────┘   └───────────────────┘   └───────────────────┘
           │
           ▼
 ┌───────────────────┐
 │ Cedar Policy Guard│
 │ Consent & Persona │
 │ Role Boundaries   │
 └───────────────────┘
           ▲
           │ REST / WebSockets
 ┌─────────┴───────────────────────────────────────────────────────┐
 │             BreatheSafe Dashboard (React 18 + Vite)             │
 │   Telemetry Diagnostics · 24h OpenSearch Graphs · AI Coach UI   │
 └─────────────────────────────────────────────────────────────────┘
```

**Design rules**
- **Hardware Autonomy:** If Wi-Fi or cloud drops, the physical badge continues sampling, accumulating toxic dose, and alarming locally via LED and OLED.
- **No Silent LLM Failures:** If AWS Bedrock or the network is unreachable, the agent demotes gracefully to localized deterministic safety heuristics without crashing.
- **Code Governs Safety, AI Governs Counsel:** The LLM provides contextual guidance; deterministic firmware code enforces physical thresholds and emergency triggers.
- **Strict Air Track Focus:** Every metric is optimized for inhalation toxicology, volatile organic compounds, and respiratory defense.

---

## AWS & technology services

| Layer | Technology / Service | Role in BreatheSafe |
| --- | --- | --- |
| **Edge Hardware** | ESP32-C3 RISC-V SoC + MQ-135 | Real-time analog gas sampling, on-device OLED display, local LED alarm |
| **Agents & AI** | **AWS Strands Agents SDK** | Autonomous agentic reasoning, multi-tool health evaluation, action generation |
| **Foundation Models**| **Amazon Bedrock** (Amazon Nova Lite / Anthropic) | Clinical reasoning, multi-lingual contextual advisory synthesis |
| **Time-Series Data** | **Amazon OpenSearch Service** | Ingestion of `@timestamp`, `gas_index`, `gas_dose_idx_h`, and historical alert logs |
| **Policy & Consent** | **Cedar Policy Engine** | Role-based boundary enforcement (Child, Adult, Asthma, Caregiver) |
| **Escalation** | **Twilio Voice & Messaging API** | Automated voice call and SMS alerts dispatched to designated caregivers |
| **Backend Compute** | Python 3.11 + FastAPI + Uvicorn | Async WebSocket streaming, hardware polling, OpenSearch indexing |
| **Presentation** | React 18 + Vite + Tailwind CSS 3 | Modern mobile-first dashboard, responsive Recharts diurnal telemetry graph |
| **Observability** | CloudWatch Logs & Metrics | Ingestion latency, poller uptime, and agent execution audit trail |

---

## Product surfaces (web & hardware)

| Surface / Route | Audience | Purpose |
| --- | --- | --- |
| **ESP32 OLED Screen** | Wearer | Instant line-of-sight alerts, current air hazard tier, live AI advisory banner |
| `/` (Overview) | Everyone | Problem statement, hardware architecture showcase, system capabilities |
| `/hardware` | Commuter / Caregiver | Live sensor telemetry, OpenSearch 24h graphs, sensor baseline calibration, test bench |
| `/voice` | High-Risk Wearer | Interactive multi-lingual AI Health Coach powered by AWS Strands Agents |
| `/planner` | Student / Commuter | Day planner exposure calculator with Cedar caregiver role enforcement |
| `/calling` | Caregivers / Emergency | Automated emergency voice alert configuration & live call dispatcher |

---

## Repository layout

```
breathesafe-v2/
├── firmware/
│   └── firmware.ino          # ESP32-C3 Arduino firmware: 100kHz OLED, MQ-135 baseline,
│                             # multi-color LEDs, REST API, two-way cloud sync
├── collector/
│   ├── main.py               # FastAPI gateway: REST endpoints, WebSockets, Twilio calling
│   ├── strands_agent.py      # AWS Strands Agents SDK: multi-tool AI health agent
│   ├── opensearch_store.py   # Amazon OpenSearch client: time-series schema & history
│   ├── poller.py             # Background async hardware poller & escalation trigger
│   └── requirements.txt      # Python dependencies (fastapi, strands-agents, opensearch-py)
├── dashboard/
│   ├── src/
│   │   ├── components/       # LevelBadge, MetricsGrid, ExposureBar, HistoryChart,
│   │   │                     # HardwareTelemetryPage, CallingAgent, DayPlanner
│   │   ├── hooks/            # useLiveData.js (WebSocket with 8s polling fallback)
│   │   ├── lib/api.js        # REST client for collector API
│   │   └── App.jsx           # Main navigation, state management & Cedar context
│   └── package.json          # React 18, Vite, Tailwind CSS, Recharts, Lucide
└── README.md                 # Complete documentation and runbook
```

---

## Deployed & runtime stack

| Component | Port / Host | Description |
| --- | --- | --- |
| **Badge Firmware** | `http://10.171.192.184` (or AP `192.168.4.1`) | Embedded web server serving `GET /api/data`, `POST /api/command` |
| **Collector API** | `http://localhost:8000` | FastAPI server hosting Strands AI Agent, OpenSearch connector & Twilio |
| **Dashboard** | `http://localhost:5173` | React/Vite web UI running on mobile and desktop |
| **OpenSearch** | `http://localhost:9200` | Search and time-series document index (`exposure-badge`) |

---

## Local development & setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Arduino IDE with ESP32 board support (v2.0.11+)
- *(Optional)* Docker or Finch for local OpenSearch

---

### 1. Hardware Firmware (`firmware/`)
1. Open [`firmware/firmware.ino`](firmware/firmware.ino) in Arduino IDE.
2. Select Board: **ESP32C3 Dev Module** (USB CDC on Boot: Enabled).
3. Connect wiring:
   - `GPIO 8` $\rightarrow$ OLED SDA · `GPIO 9` $\rightarrow$ OLED SCL
   - `GPIO 1` $\rightarrow$ MQ-135 Analog Out (via 2:1 divider)
   - `GPIO 4` $\rightarrow$ DHT11 Data
   - `GPIO 5, 6, 7` $\rightarrow$ Green, Amber, Red LEDs
4. Flash the board. Open Serial Monitor at `115200` baud to view IP address.

---

### 2. Collector Backend (`collector/`)
```powershell
cd collector
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Configure your `.env`:
```ini
ESP32_URL=http://10.171.192.184
POLL_INTERVAL_S=8
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
STRANDS_PROVIDER=bedrock
STRANDS_MODEL_ID=us.amazon.nova-lite-v1:0
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

Start the collector:
```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 3. Dashboard Web UI (`dashboard/`)
```powershell
cd dashboard
npm install
npm run dev -- --host
```
Open **`http://localhost:5173`** in your browser.

---

### 4. Testing Without Physical Hardware
If physical hardware is offline, the dashboard automatically provides:
- **Standby Empty States:** Explanatory cards showing expected baseline ($950\text{ mV}$) and safety thresholds.
- **OpenSearch Diurnal History:** Continuous 24h urban commute telemetry curves.
- **Live Ingest Test Bench:** One-click packet injection buttons (`🟢 Clean Air 0.95×`, `🟡 Moderate VOC 1.85×`, `🔴 Hazardous 3.10×`) to verify AI action generation and Twilio voice calls on demand.

---

## Team & ownership

| Member | Focus Area & Ownership |
| --- | --- |
| **Yukti Maheshwari** | Hardware engineering, ESP32 firmware, React dashboard, Recharts diurnal telemetry visualization, Cedar policy UI |
| **Pranjal Verma** | Collector API, AWS Strands Agents SDK integration, OpenSearch schema, Twilio calling |

---

## Limitations

- **Not an ICU Diagnostic Device:** BreatheSafe provides ambient exposure mitigation and acute hazard alerting; it does not replace medical pulse oximeters or nebulizers.
- **MQ-135 Preheating:** The tin-dioxide semiconductor requires initial heater stabilization; the firmware automatically applies factory baselines during warmup.
- **Wi-Fi Range:** When leaving domestic Wi-Fi, the badge operates in self-contained Hotspot/Autonomous mode until re-entering an indexed network.

---

## License & hackathon submission
 
Distributed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for more information.
Built for the **AWS Open Source Hackathon — Air Quality Track**. Protect your breath.
