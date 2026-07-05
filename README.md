# Weather & AQI Dashboard - 3-Tier Microservice Architecture

A full-stack application that takes a user's name and city, then displays real-time weather data and Air Quality Index (AQI) information.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              TIER 1 - PRESENTATION                  │
│         React Frontend (Port 3003)                  │
│    User Form → Weather / AQI / Forecast Cards       │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│              TIER 2 - APPLICATION                   │
│         API Gateway (Port 3000)                     │
│   Rate Limiting · Input Validation · Orchestration  │
└────────┬────────────────────────────────┬───────────┘
         │ HTTP                           │ HTTP
┌────────▼──────────┐        ┌────────────▼───────────┐
│  TIER 3 - SERVICE │        │   TIER 3 - SERVICE     │
│  Weather Service  │        │     AQI Service        │
│   (Port 3001)     │        │    (Port 3002)         │
│  Current Weather  │        │  Air Quality Index     │
│  Today's Forecast │        │  Pollutant Breakdown   │
│  5-Day Outlook    │        │                        │
└───────────────────┘        └────────────────────────┘
         │                            │
         └──────────┬─────────────────┘
                    │
         ┌──────────▼──────────┐
         │  OpenWeatherMap API │
         │   (External)        │
         └─────────────────────┘
```

## Features

- **User Input**: Enter your name and city
- **Current Weather**: Temperature, humidity, wind, pressure, sunrise/sunset
- **Today's Weather**: Hourly forecast for the rest of today
- **Looking Ahead**: 5-day daily forecast
- **Air Quality Index**: AQI level with color coding (Good → Very Poor)
- **Pollutant Breakdown**: CO, NO, NO₂, O₃, SO₂, PM2.5, PM10, NH₃

## Prerequisites

- **Node.js** v16+ and npm
- **OpenWeatherMap API Key** (free tier works): [Get one here](https://openweathermap.org/api)

## Quick Start (Local Development)

### 1. Get your API Key

Sign up at [openweathermap.org](https://openweathermap.org/api) and get a free API key.

### 2. Configure Environment

Set your API key in both service `.env` files:

```bash
# services/weather-service/.env
OPENWEATHER_API_KEY=your_api_key_here

# services/aqi-service/.env
OPENWEATHER_API_KEY=your_api_key_here
```

### 3. Install Dependencies & Start Services

Open 4 terminals and run:

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

**Terminal 3 - API Gateway:**
```bash
cd api-gateway
npm install
npm start
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm install
npm start
```

### 4. Open the App

Navigate to **http://localhost:3003** in your browser.

## Docker Deployment

```bash
# Set your API key
export OPENWEATHER_API_KEY=your_api_key_here

# Build and run all services
docker-compose up --build
```

Open **http://localhost:3003** in your browser.

## API Endpoints

### API Gateway (Port 3000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/:city` | Combined weather + AQI data |
| GET | `/health` | Service health check |

### Weather Service (Port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/:city` | Current weather + forecast |
| GET | `/health` | Service health check |

### AQI Service (Port 3002)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aqi/:city` | Air quality index + pollutants |
| GET | `/health` | Service health check |

## Tech Stack

- **Frontend**: React 18, Axios, CSS3 (Glassmorphism UI)
- **API Gateway**: Express.js, express-rate-limit
- **Microservices**: Express.js, Axios
- **External API**: OpenWeatherMap (Weather, Forecast, Air Pollution)
- **Containerization**: Docker, Docker Compose
