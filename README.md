# AeroShield AI 🌬️
### *GenAI-Powered Winter Smog & Urban Air Pollution Navigator for Families and Communities*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://aeroshield-ai-pi.vercel.app)
[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

🌐 **Live Deployment**: [https://aeroshield-ai-pi.vercel.app](https://aeroshield-ai-pi.vercel.app)

AeroShield AI is a full-stack, science-grounded GenAI application built to help households and neighborhood communities navigate severe winter smog and urban air pollution. It combines real-time hyperlocal air quality data, atmospheric thermal inversion forecasting, interactive room engineering calculators, and generative AI routines to minimize both personal exposure and community emissions.

---

## 🌟 Key Capabilities

1. **Hyperlocal Real-Time AQI & Inversion Forecasting (Live Open-Meteo Integration)**
   - Live PM2.5, PM10, NO2, CO, SO2, and US AQI gauges.
   - Diurnal atmospheric inversion cycle analysis: automatically flags early morning/night ground traps.
   - **"Clean Window" Detection**: Pinpoints exact midday solar heating windows when vertical thermal mixing lowers ground-level PM2.5, recommending optimal safe hours for controlled ventilation.
   - **Berkeley Earth Exposure Benchmark**: Translates ambient PM2.5 into passive daily cigarette inhalation equivalents.

2. **Personalized Low-Emission Daily Routine Generator**
   - Interactive household profiler (family size, infants, seniors, asthma/cardiac vulnerability).
   - Generates a 4-phase daily strategy: Morning Preparation, Midday Flush, Evening Commute, and Night-Time Clean Sleep Zone.
   - Clear duality in recommendations: **Low-Emission Tactic** (cutting personal footprint) paired with **IAQ Safety Hack** (protecting lungs).
   - **Direct Impact Explainer**: Quantifies avoided lung PM2.5 (in micrograms), avoided CO2 (in kg), and equivalent cigarettes prevented.

3. **Indoor Air Quality (IAQ) Lab & DIY Purification Hub**
   - **Interactive Room CADR Calculator**: Dynamic slider computing required Clean Air Delivery Rate (CFM) for 4.5 Air Changes per Hour (ACH) based on room area and ceiling height.
   - **DIY Corsi-Rosenthal Box Blueprint**: Step-by-step engineering guide to construct a 4-filter MERV-13 air cleaner delivering 350-450 CFM for ~$65 (80% cheaper than commercial HEPA).
   - **Physics & Evidence-Backed Science Cards**:
     - *Stack Effect & Positive Pressure*: Why cold winter air forces smog in through lower cracks and how to maintain positive pressure.
     - *Kitchen Exhaust Isolation*: Mitigating 400+ µg/m³ cooking PM2.5 spikes.
     - *Damp-Mopping vs Dry Sweeping*: Preventing toxic resuspended heavy metal soot.

4. **Interactive AeroShield GenAI Copilot**
   - Multi-turn conversational assistant with context of your city and current AQI.
   - Powered by **Google Gemini** (`gemini-1.5-flash`) with an instant expert heuristic fallback model when no API key is provided.

5. **Community Clean Air Hub & Action Pledges**
   - Crowdsourced action tracker for school carpools, anti-idling pledges, leaf/waste burning cessation, and DIY filter sharing.
   - Localized traffic congestion & ground inversion hotspot watch with mitigation alerts.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on v24)
- **npm** v9+

### 2. Start the Application
The frontend is pre-built into `client/dist` and served directly by the Express backend on **port 5000**:

```bash
npm start
```

Open your browser to:
```
http://localhost:5000
```

### 3. Development Mode (Optional)
If you want to run live development with Vite HMR:
```bash
# Terminal 1: Backend API server
npm run dev:server

# Terminal 2: React Vite client
npm run dev:client
```
The Vite client runs at `http://localhost:3000` and automatically proxies `/api` calls to `http://localhost:5000`.

### 4. Running Backend Verification Tests
```bash
npm test
```

---

## ⚙️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts (diurnal forecast charts).
- **Backend**: Express (Node.js ES Modules), RESTful API endpoints.
- **Air Quality & Forecast API**: Open-Meteo Air Quality & Geocoding APIs (worldwide coverage, no API key required).
- **GenAI**: `@google/generative-ai` with Google Gemini 1.5 Flash + robust built-in heuristic reasoning fallback engine.
- **Formulas & Benchmarks**:
  - Berkeley Earth: 22 µg/m³ PM2.5 / 24h ≈ 1 cigarette equivalent.
  - CADR equation: `(Room Area × Ceiling Height × 4.5 ACH) / 60 = Required CFM`.
  - UC Davis / Corsi-Rosenthal Open-Source Air Cleaner principles.
