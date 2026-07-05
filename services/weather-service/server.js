const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// WMO weather code to description + icon mapping
const WMO_CODES = {
  0: { description: 'Clear sky', icon: '01d' },
  1: { description: 'Mainly clear', icon: '02d' },
  2: { description: 'Partly cloudy', icon: '03d' },
  3: { description: 'Overcast', icon: '04d' },
  45: { description: 'Fog', icon: '50d' },
  48: { description: 'Depositing rime fog', icon: '50d' },
  51: { description: 'Light drizzle', icon: '09d' },
  53: { description: 'Moderate drizzle', icon: '09d' },
  55: { description: 'Dense drizzle', icon: '09d' },
  61: { description: 'Slight rain', icon: '10d' },
  63: { description: 'Moderate rain', icon: '10d' },
  65: { description: 'Heavy rain', icon: '10d' },
  71: { description: 'Slight snowfall', icon: '13d' },
  73: { description: 'Moderate snowfall', icon: '13d' },
  75: { description: 'Heavy snowfall', icon: '13d' },
  80: { description: 'Slight rain showers', icon: '09d' },
  81: { description: 'Moderate rain showers', icon: '09d' },
  82: { description: 'Violent rain showers', icon: '09d' },
  85: { description: 'Slight snow showers', icon: '13d' },
  86: { description: 'Heavy snow showers', icon: '13d' },
  95: { description: 'Thunderstorm', icon: '11d' },
  96: { description: 'Thunderstorm with hail', icon: '11d' },
  99: { description: 'Thunderstorm with heavy hail', icon: '11d' },
};

function getWeatherInfo(code, isDay) {
  const info = WMO_CODES[code] || { description: 'Unknown', icon: '01d' };
  const icon = isDay === 0 ? info.icon.replace('d', 'n') : info.icon;
  return { description: info.description, icon };
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'weather-service' });
});

// Geocode city name to coordinates
async function geocodeCity(city) {
  const geoRes = await axios.get(
    'https://geocoding-api.open-meteo.com/v1/search',
    { params: { name: city, count: 1, language: 'en' } }
  );
  if (!geoRes.data.results || geoRes.data.results.length === 0) {
    return null;
  }
  return geoRes.data.results[0];
}

// Get current weather + today's summary + 7-day forecast
app.get('/api/weather/:city', async (req, res) => {
  const { city } = req.params;

  try {
    // Step 1: Geocode city
    const location = await geocodeCity(city);
    if (!location) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }

    const { latitude, longitude, name, country_code } = location;

    // Step 2: Fetch weather from Open-Meteo (no API key needed!)
    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,is_day',
        hourly: 'temperature_2m,weather_code,is_day',
        daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean',
        wind_speed_unit: 'ms',
        timezone: 'auto',
        forecast_days: 7,
      },
    });

    const data = weatherRes.data;
    const currentData = data.current;
    const hourlyData = data.hourly;
    const dailyData = data.daily;

    // Current weather
    const currentWeatherInfo = getWeatherInfo(currentData.weather_code, currentData.is_day);

    // Today's hourly slots (remaining hours)
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = dailyData.time[0];
    const todaySlots = [];
    for (let i = 0; i < hourlyData.time.length; i++) {
      const timeStr = hourlyData.time[i];
      if (!timeStr.startsWith(todayStr)) continue;
      const hour = parseInt(timeStr.split('T')[1].split(':')[0], 10);
      if (hour <= currentHour) continue;
      const info = getWeatherInfo(hourlyData.weather_code[i], hourlyData.is_day[i]);
      todaySlots.push({
        time: timeStr.split('T')[1],
        temp: hourlyData.temperature_2m[i],
        description: info.description,
        icon: info.icon,
      });
    }

    // Daily forecast (skip today)
    const forecast = [];
    for (let i = 1; i < dailyData.time.length; i++) {
      const dayCode = dailyData.weather_code[i];
      const info = getWeatherInfo(dayCode, 1);
      forecast.push({
        date: dailyData.time[i],
        temp_max: dailyData.temperature_2m_max[i],
        temp_min: dailyData.temperature_2m_min[i],
        description: info.description,
        icon: info.icon,
        humidity: dailyData.relative_humidity_2m_mean ? dailyData.relative_humidity_2m_mean[i] : null,
        wind_speed: dailyData.wind_speed_10m_max[i],
      });
    }

    // Sunrise/sunset for today (unix timestamps)
    const sunriseUnix = Math.floor(new Date(dailyData.sunrise[0]).getTime() / 1000);
    const sunsetUnix = Math.floor(new Date(dailyData.sunset[0]).getTime() / 1000);

    res.json({
      city: name,
      country: country_code,
      current: {
        temp: currentData.temperature_2m,
        feels_like: currentData.apparent_temperature,
        temp_min: dailyData.temperature_2m_min[0],
        temp_max: dailyData.temperature_2m_max[0],
        humidity: currentData.relative_humidity_2m,
        pressure: currentData.surface_pressure,
        description: currentWeatherInfo.description,
        icon: currentWeatherInfo.icon,
        wind_speed: currentData.wind_speed_10m,
        visibility: 10000,
        sunrise: sunriseUnix,
        sunset: sunsetUnix,
      },
      today: todaySlots,
      forecast,
    });
  } catch (err) {
    console.error('Weather service error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`Weather Service running on port ${PORT} (using Open-Meteo - no API key needed)`);
});
