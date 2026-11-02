<div align="center">

<img src="https://img.shields.io/badge/MaintenAi-Predictive%20Maintenance%20Platform-6C5CE7?style=for-the-badge&logo=robotframework&logoColor=white" alt="MaintenAi banner" />

# 🛠️ MaintenAi

**AI-powered predictive maintenance — catch equipment failures before they happen.**

[![Build Status](https://img.shields.io/github/actions/workflow/status/your-org/maintenai/ci.yml?branch=main&style=flat-square)](https://github.com/your-org/maintenai/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg?style=flat-square)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Stars](https://img.shields.io/github/stars/your-org/maintenai?style=flat-square)](https://github.com/your-org/maintenai/stargazers)

[Overview](#-overview) •
[Features](#-key-features) •
[Architecture](#-architecture) •
[Quick Start](#-quick-start) •
[Usage](#-usage) •
[Roadmap](#-roadmap) •
[Contributing](#-contributing)

</div>

---

## 📖 Overview

**MaintenAi** ingests live sensor data (vibration, temperature, pressure, current draw) from industrial equipment, runs it through trained ML models, and predicts **when** and **why** a machine is likely to fail — before it actually breaks down.

Instead of fixed maintenance schedules or reacting after a breakdown, teams get:

- 🔔 Early-warning alerts with a confidence score
- 📉 Remaining Useful Life (RUL) estimates per asset
- 📊 A live dashboard for fleet-wide health monitoring
- 🧠 Explainable predictions (which sensor readings drove the alert)

> ⚠️ **Note:** This README assumes a generic predictive-maintenance architecture for a project named *MaintenAi*. Swap in your real stack, screenshots, and module names where marked.

---

## ✨ Key Features

| | |
|---|---|
| 🔌 **Multi-source ingestion** | Connect MQTT, OPC-UA, REST, or CSV batch uploads from sensors/PLCs |
| 🧠 **ML failure prediction** | Gradient-boosted & LSTM models for anomaly detection and RUL estimation |
| ⏱️ **Real-time pipeline** | Stream processing with sub-second alerting |
| 📊 **Interactive dashboard** | Fleet health, trend charts, and per-asset drill-downs |
| 🔗 **Integrations** | Slack/Email/Webhook alerts, CMMS/ERP export (SAP PM, Maximo) |
| 🧩 **Explainability** | SHAP-based feature attribution for every prediction |
| 🐳 **Deploy anywhere** | Docker Compose, Kubernetes Helm chart, or bare-metal edge device |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Edge["🏭 Edge / Shop Floor"]
        S1[Vibration Sensor]
        S2[Temperature Sensor]
        S3[Current/Power Sensor]
        PLC[PLC / OPC-UA Gateway]
    end

    subgraph Ingest["📥 Ingestion Layer"]
        MQTT[MQTT Broker]
        API[REST Ingest API]
    end

    subgraph Core["🧠 MaintenAi Core"]
        STREAM[Stream Processor<br/>Kafka / Redis Streams]
        FEAT[Feature Engineering]
        MODEL[ML Inference Engine<br/>Anomaly Detection + RUL]
        DB[(Time-Series DB<br/>InfluxDB / TimescaleDB)]
    end

    subgraph Serve["📊 Application Layer"]
        BACKEND[Backend API<br/>FastAPI]
        DASH[Web Dashboard<br/>React]
        ALERT[Alert Manager]
    end

    subgraph Out["🔔 Outputs"]
        SLACK[Slack / Email]
        CMMS[CMMS / ERP Export]
        WEBHOOK[Custom Webhooks]
    end

    S1 & S2 & S3 --> PLC --> MQTT
    MQTT --> STREAM
    API --> STREAM
    STREAM --> FEAT --> MODEL
    MODEL --> DB
    DB --> BACKEND
    MODEL --> ALERT
    BACKEND --> DASH
    ALERT --> SLACK
    ALERT --> WEBHOOK
    BACKEND --> CMMS

    style Core fill:#6C5CE7,color:#fff
    style Serve fill:#00B894,color:#fff
    style Out fill:#FDCB6E,color:#000
```

### Prediction Workflow

```mermaid
flowchart TD
    A[Raw Sensor Data] --> B{Data Quality Check}
    B -- Invalid/Missing --> C[Impute / Flag]
    B -- Valid --> D[Feature Extraction<br/>FFT, rolling stats, deltas]
    C --> D
    D --> E[Anomaly Detection Model]
    E --> F{Anomaly Score<br/>> Threshold?}
    F -- No --> G[Log & Continue Monitoring]
    F -- Yes --> H[RUL Estimation Model]
    H --> I[Generate Explanation<br/>SHAP values]
    I --> J[Create Alert + Confidence Score]
    J --> K[Dispatch: Dashboard / Slack / CMMS Ticket]

    style F fill:#FDCB6E,color:#000
    style J fill:#D63031,color:#fff
    style K fill:#00B894,color:#fff
```

---

## 🧰 Tech Stack

<div align="center">

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)
![InfluxDB](https://img.shields.io/badge/InfluxDB-22ADF6?style=flat-square&logo=influxdb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)

</div>

---

## 📂 Project Structure

```
maintenai/
├── ingestion/              # MQTT / OPC-UA / REST connectors
│   ├── mqtt_listener.py
│   └── opcua_client.py
├── pipeline/                # Stream processing & feature engineering
│   ├── stream_processor.py
│   └── features.py
├── models/                  # Training & inference code
│   ├── anomaly_detector.py
│   ├── rul_estimator.py
│   └── train.py
├── backend/                  # FastAPI service
│   ├── main.py
│   ├── routers/
│   └── alerts/
├── dashboard/                 # React frontend
│   ├── src/
│   └── public/
├── infra/                     # Docker, Helm, Terraform
│   ├── docker-compose.yml
│   └── helm/
├── tests/
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Docker & Docker Compose
- Node.js 18+ (for the dashboard)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/maintenai.git
cd maintenai
cp .env.example .env
```

### 2. Spin up the stack

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts the MQTT broker, time-series DB, backend API, and dashboard.

### 3. Install Python dependencies (for local dev)

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run the inference service

```bash
python -m backend.main
```

The dashboard will be available at **http://localhost:3000** and the API docs at **http://localhost:8000/docs**.

---

## 💻 Usage

### Ingest sensor data

```python
from maintenai.ingestion import MQTTListener

listener = MQTTListener(
    broker="localhost",
    topic="factory/line1/pump_motor/+",
)
listener.start(callback=process_reading)
```

### Run a prediction

```python
from maintenai.models import AnomalyDetector, RULEstimator

detector = AnomalyDetector.load("models/anomaly_v2.pt")
rul_model = RULEstimator.load("models/rul_v2.pt")

reading = {
    "vibration_rms": 4.8,
    "temperature_c": 78.2,
    "current_amps": 12.4,
}

score = detector.predict(reading)

if score.is_anomalous:
    rul_days = rul_model.estimate(reading, asset_id="pump_motor_07")
    print(f"⚠️ Anomaly detected (confidence={score.confidence:.2f})")
    print(f"Estimated remaining useful life: {rul_days} days")
```

### Query via REST API

```bash
curl -X GET "http://localhost:8000/api/v1/assets/pump_motor_07/health" \
  -H "Authorization: Bearer $MAINTENAI_API_KEY"
```

```json
{
  "asset_id": "pump_motor_07",
  "status": "warning",
  "anomaly_score": 0.87,
  "estimated_rul_days": 14,
  "top_contributing_factors": [
    "vibration_rms (+0.42)",
    "temperature_c (+0.21)"
  ]
}
```

---

## 📊 Dashboard Preview

<div align="center">

| Fleet Overview | Asset Deep-Dive |
|:---:|:---:|
| ![Fleet dashboard placeholder](https://via.placeholder.com/420x260/6C5CE7/ffffff?text=Fleet+Health+Dashboard) | ![Asset detail placeholder](https://via.placeholder.com/420x260/00B894/ffffff?text=Asset+RUL+Trend) |

*Replace these placeholders with real screenshots of your dashboard (`docs/images/`).*

</div>

---

## 🗺️ Roadmap

- [x] Core anomaly detection pipeline
- [x] RUL estimation model
- [x] Real-time dashboard
- [ ] Edge deployment (on-device inference)
- [ ] Multi-tenant SaaS mode
- [ ] AutoML model retraining pipeline
- [ ] Mobile alerting app

See the [open issues](https://github.com/your-org/maintenai/issues) for the full list.

---

## 🤝 Contributing

Contributions make the open-source community amazing. Any contributions are **greatly appreciated**.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and PR process.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 📬 Contact

**Your Name / Org** — [@your_handle](https://twitter.com/your_handle) — your.email@example.com

Project Link: [https://github.com/your-org/maintenai](https://github.com/your-org/maintenai)

<div align="center">

⭐ If MaintenAi helps you keep your machines running, consider starring the repo!

</div>
[README.md](https://github.com/user-attachments/files/34285271/README.md)
# MainAI — AI-Powered Predictive Maintenance System

Industrial predictive maintenance frontend built with Next.js 16, PostgreSQL, and Drizzle ORM.

## Architecture

- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **Database:** PostgreSQL with Drizzle ORM 0.45.2
- **Driver:** pg 8.20.0
- **TypeScript:** 5.9.3
- **Styling:** Tailwind CSS 4.1.17

## Data Sources

### Fixture Preview (Default)
Static frontend fixtures in `src/data/fixtures.ts` are used when `NEXT_PUBLIC_DATA_SOURCE_MODE="fixture_preview"`. These are illustrative synthetic records for UI development and preview.

### Live Backend
When `NEXT_PUBLIC_DATA_SOURCE_MODE="live_backend"`, data is served from PostgreSQL via Next.js Route Handlers. The service adapter never silently falls back to fixture data if a live request fails.

## AI4I 2020 Predictive Maintenance Dataset

### Source
- **Dataset:** AI4I 2020 Predictive Maintenance Dataset
- **Source URL:** https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
- **License:** CC BY 4.0 (attribution required)
- **Records:** ~10,000 synthetic records
- **Nature:** Synthetic dataset — not real-world measurements

### Fields
| Field | Type | Unit | Description |
|-------|------|------|-------------|
| UDI | integer | — | Unique unit identifier |
| Product ID | string | — | Product identifier (e.g., L001863) |
| Type | enum (L/M/H) | — | Quality level |
| Air temperature | double | K | Operating temperature |
| Process temperature | double | K | Process temperature |
| Rotational speed | integer | rpm | |
| Torque | double | Nm | Newton-meters |
| Tool wear | integer | min | |
| Machine failure | boolean | 0/1 | Overall failure label |
| TWF | boolean | 0/1 | Tool Wear Failure |
| HDF | boolean | 0/1 | Heat Dissipation Failure |
| PWF | boolean | 0/1 | Power Failure |
| OSF | boolean | 0/1 | Overstrain Failure |
| RNF | boolean | 0/1 | Random Failure |

### Limitations
- The dataset does NOT contain vibration, acoustic, or other sensor readings present in MainAI's telemetry model. These fields are not fabricated.
- Failure labels are NOT Remaining Useful Life (RUL) measurements.
- All records are synthetic.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and set `DATABASE_URL`:
```
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/app_db"
NEXT_PUBLIC_DATA_SOURCE_MODE="fixture_preview"
```

Never commit real credentials to version control (`.env` is already in `.gitignore`).

### 3. Database Schema
```bash
npx drizzle-kit push
```
This creates all tables including `ai4i_telemetry_records` for the AI4I dataset. Migration SQL is at `drizzle/0001_fantastic_night_thrasher.sql`.

### 4. Download the AI4I Dataset
Download the CSV from the UCI Machine Learning Repository and place it at:
```
data/ai4i/ai4i-2020-predictive-maintenance.csv
```
The `data/` directory is excluded from version control (in `.gitignore`).

### 5. Import the Dataset
```bash
npx tsx scripts/import-ai4i.ts data/ai4i/ai4i-2020-predictive-maintenance.csv
```
The import is idempotent — re-running it updates existing records by UDI without duplicating.

### 6. Enable Live Backend Mode
```
NEXT_PUBLIC_DATA_SOURCE_MODE="live_backend"
```
This switches the service adapter to query PostgreSQL instead of using local fixtures.

### 7. Run the Application
```bash
npm run dev
```

## Verification Commands

| Command | Purpose |
|---------|---------|
| `npx tsc --noEmit` | TypeScript type checking |
| `npm run build` | Production build |
| `npx tsx scripts/test-ai4i-csv-parser.ts` | CSV parser unit tests |
| `npx drizzle-kit push` | Apply database schema migrations |
| `npx tsx scripts/import-ai4i.ts <csv-path>` | Import AI4I dataset |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Database health check |
| `/api/ai4i/records` | GET | Paginated AI4I telemetry records (query: `page`, `pageSize`, `type`, `machineFailure`) |
| `/api/ai4i/summary` | GET | AI4I dataset summary (failure counts, mode distribution, type breakdown) |
| `/api/maintenance/work-orders/[workOrderId]` | GET/PATCH | Work order detail and status transitions |

## Dashboard Integration

The dashboard (`/dashboard`) displays an AI4I 2020 Synthetic Dataset Summary panel showing:
- Total imported records
- Machine failure count and failure rate
- Failure mode distribution (TWF, HDF, PWF, OSF, RNF)
- Records by machine type (L, M, H)
- Synthetic data disclosure and field descriptions

When live-backend mode is not configured or the database is unavailable, the panel shows an error state without substituting fixture data.

## Project Structure

```
src/
  app/
    api/
      ai4i/
        records/route.ts    # Paginated AI4I records
        summary/route.ts    # AI4I failure statistics
      health/route.ts       # Health check
      maintenance/
        work-orders/[workOrderId]/route.ts  # Work order CRUD
    dashboard/page.tsx      # Dashboard (fixture + AI4I summary)
    fleet/page.tsx          # Fleet inventory
    ...
  components/
    dashboard/
      Ai4iDatasetPanel.tsx  # AI4I metrics display
      DashboardWorkspace.tsx # Main dashboard layout
      ...
  db/
    index.ts                # Connection pool
    schema.ts               # Drizzle schema (includes ai4i_telemetry_records)
    seed.ts                 # Idempotent fixture seed
  services/
    telemetryAdapter.ts     # Service adapter (fixture_preview + live_backend)
  types/
    telemetry.ts            # TypeScript contracts (includes AI4I types)
  data/
    fixtures.ts             # Local frontend fixtures
scripts/
  import-ai4i.ts            # AI4I dataset import pipeline
  test-ai4i-csv-parser.ts   # CSV parser unit tests
data/ai4i/                  # AI4I CSV storage (gitignored)
```
