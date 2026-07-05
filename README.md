# Weather & AQI Dashboard - 3-Tier Microservice Architecture

A full-stack application that takes a user's name and city, then displays real-time weather data and Air Quality Index (AQI) information. Uses the free Open-Meteo API — no API key required.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              TIER 1 - PRESENTATION                  │
│     React Frontend + Nginx Reverse Proxy            │
│     (Port 80 Docker / Port 3000 local dev)          │
│    User Form → Weather / AQI / Forecast Cards       │
└────────┬────────────────────────────────┬───────────┘
         │ /api/weather/*                 │ /api/aqi/*
         │ (nginx proxy_pass)             │ (nginx proxy_pass)
┌────────▼──────────┐        ┌────────────▼───────────┐
│  TIER 2 - SERVICE │        │   TIER 2 - SERVICE     │
│  Weather Service  │        │     AQI Service        │
│   (Port 3001)     │        │    (Port 3002)         │
│  Current Weather  │        │  Air Quality Index     │
│  Today's Forecast │        │  European AQI Scale    │
│  7-Day Outlook    │        │  Pollutant Breakdown   │
└───────────────────┘        └────────────────────────┘
         │                            │
         └──────────┬─────────────────┘
                    │ HTTP
         ┌──────────▼──────────┐
         │    Open-Meteo API   │
         │  (Free, no API key) │
         └─────────────────────┘
```

## Features

- **User Input**: Enter your name and city
- **Current Weather**: Temperature, humidity, wind speed, pressure
- **Today's Weather**: Hourly forecast for the rest of today
- **Looking Ahead**: 7-day daily forecast with min/max temps
- **Air Quality Index**: European AQI scale with color coding (Good → Extremely Poor)
- **Pollutant Breakdown**: PM2.5, PM10, NO₂, O₃, SO₂, CO concentrations

## Prerequisites

- **Node.js** v16+ and npm
- **Docker & Docker Compose** (for containerized deployment)

No API key is required — the app uses the free [Open-Meteo API](https://open-meteo.com/).

## Quick Start (Local Development)

### 1. Install Dependencies & Start Services

Open 3 terminals and run:

**Terminal 1 - Weather Service:**
```bash
cd services/weather-service
npm install
npm start
```

**Terminal 2 - AQI Service:**
```bash
cd services/aqi-service
npm install
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm start
```

### 2. Open the App

Navigate to **http://localhost:3000** in your browser.

## Docker Deployment

```bash
# Build and run all services
docker-compose up --build
```

Open **http://localhost** (port 80) in your browser.

The Nginx reverse proxy in the frontend container routes `/api/weather/*` and `/api/aqi/*` requests to the respective backend services.

## API Endpoints

### Weather Service (Port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/:city` | Current weather + 7-day forecast |
| GET | `/health` | Service health check |

### AQI Service (Port 3002)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aqi/:city` | Air quality index + pollutants |
| GET | `/health` | Service health check |

## Tech Stack

- **Frontend**: React 18, Axios, CSS3 (Glassmorphism UI)
- **Reverse Proxy**: Nginx (routes API calls to backend services)
- **Microservices**: Express.js, Axios
- **External API**: Open-Meteo (Weather, Forecast, Air Quality — free, no key)
- **Containerization**: Docker, Docker Compose
