const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// European AQI ranges: 0-20 Good, 20-40 Fair, 40-60 Moderate, 60-80 Poor, 80-100 Very Poor, 100+ Extremely Poor
function getAQIInfo(aqiValue) {
  if (aqiValue == null) return { index: 0, level: 'Unknown', color: '#999', description: 'No data available.' };
  if (aqiValue <= 20) return { index: Math.round(aqiValue), level: 'Good', color: '#00e400', description: 'Air quality is satisfactory, and air pollution poses little or no risk.' };
  if (aqiValue <= 40) return { index: Math.round(aqiValue), level: 'Fair', color: '#ffff00', description: 'Air quality is acceptable. Some pollutants may be a concern for sensitive individuals.' };
  if (aqiValue <= 60) return { index: Math.round(aqiValue), level: 'Moderate', color: '#ff7e00', description: 'Members of sensitive groups may experience health effects.' };
  if (aqiValue <= 80) return { index: Math.round(aqiValue), level: 'Poor', color: '#ff0000', description: 'Everyone may begin to experience health effects.' };
  if (aqiValue <= 100) return { index: Math.round(aqiValue), level: 'Very Poor', color: '#7e0023', description: 'Health alert: everyone may experience serious health effects.' };
  return { index: Math.round(aqiValue), level: 'Extremely Poor', color: '#4a0013', description: 'Health emergency: entire population is at risk.' };
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aqi-service' });
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

// Get AQI by city name
app.get('/api/aqi/:city', async (req, res) => {
  const { city } = req.params;

  try {
    // Step 1: Geocode city
    const location = await geocodeCity(city);
    if (!location) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }

    const { latitude, longitude, name, country_code } = location;

    // Step 2: Fetch AQI from Open-Meteo (no API key needed!)
    const aqiRes = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude,
        longitude,
        current: 'european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
        timezone: 'auto',
      },
    });

    const currentData = aqiRes.data.current;
    const aqiInfo = getAQIInfo(currentData.european_aqi);

    res.json({
      city: name,
      country: country_code,
      aqi: {
        index: aqiInfo.index,
        level: aqiInfo.level,
        color: aqiInfo.color,
        description: aqiInfo.description,
      },
      pollutants: {
        co: { value: currentData.carbon_monoxide || 0, unit: 'μg/m³', name: 'Carbon Monoxide' },
        no2: { value: currentData.nitrogen_dioxide || 0, unit: 'μg/m³', name: 'Nitrogen Dioxide' },
        o3: { value: currentData.ozone || 0, unit: 'μg/m³', name: 'Ozone' },
        so2: { value: currentData.sulphur_dioxide || 0, unit: 'μg/m³', name: 'Sulphur Dioxide' },
        pm2_5: { value: currentData.pm2_5 || 0, unit: 'μg/m³', name: 'PM2.5' },
        pm10: { value: currentData.pm10 || 0, unit: 'μg/m³', name: 'PM10' },
      },
      timestamp: Math.floor(new Date(currentData.time).getTime() / 1000),
    });
  } catch (err) {
    console.error('AQI service error:', err.message);
    res.status(500).json({ error: 'Failed to fetch AQI data' });
  }
});

app.listen(PORT, () => {
  console.log(`AQI Service running on port ${PORT} (using Open-Meteo - no API key needed)`);
});
