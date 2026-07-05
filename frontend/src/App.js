import React, { useState } from 'react';
import axios from 'axios';
import UserForm from './components/UserForm';
import CurrentWeather from './components/CurrentWeather';
import AQICard from './components/AQICard';
import TodayWeather from './components/TodayWeather';
import ForecastCard from './components/ForecastCard';
import './App.css';

function App() {
  const [userName, setUserName] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (name, city) => {
    setUserName(name);
    setLoading(true);
    setError('');
    setDashboard(null);

    try {
      const encodedCity = encodeURIComponent(city);
      const [weatherRes, aqiRes] = await Promise.allSettled([
        axios.get(`/api/weather/${encodedCity}`),
        axios.get(`/api/aqi/${encodedCity}`),
      ]);

      const result = { city };

      if (weatherRes.status === 'fulfilled') {
        result.weather = weatherRes.value.data;
      } else {
        result.weather = null;
        result.weatherError = weatherRes.reason?.response?.data?.error || 'Weather service unavailable';
      }

      if (aqiRes.status === 'fulfilled') {
        result.aqi = aqiRes.value.data;
      } else {
        result.aqi = null;
        result.aqiError = aqiRes.reason?.response?.data?.error || 'AQI service unavailable';
      }

      setDashboard(result);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather & AQI Dashboard</h1>
        <p>Get real-time weather and air quality information for any city</p>
      </header>

      <UserForm onSubmit={handleSubmit} loading={loading} />

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Fetching weather data...</p>
        </div>
      )}

      {dashboard && !loading && (
        <div className="dashboard">
          <h2 className="greeting">
            Hello, {userName}! Here's the weather for {dashboard.weather?.city || dashboard.city}
            {dashboard.weather?.country ? `, ${dashboard.weather.country}` : ''}
          </h2>

          <div className="dashboard-grid">
            {dashboard.weather && (
              <CurrentWeather data={dashboard.weather.current} />
            )}
            {dashboard.weatherError && (
              <div className="card error-card">
                <h3>Weather</h3>
                <p>{dashboard.weatherError}</p>
              </div>
            )}

            {dashboard.aqi && (
              <AQICard data={dashboard.aqi} />
            )}
            {dashboard.aqiError && (
              <div className="card error-card">
                <h3>Air Quality</h3>
                <p>{dashboard.aqiError}</p>
              </div>
            )}
          </div>

          {dashboard.weather?.today && dashboard.weather.today.length > 0 && (
            <TodayWeather slots={dashboard.weather.today} />
          )}

          {dashboard.weather?.forecast && dashboard.weather.forecast.length > 0 && (
            <ForecastCard forecast={dashboard.weather.forecast} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
