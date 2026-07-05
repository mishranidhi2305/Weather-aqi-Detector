import React from 'react';

const ICON_MAP = {
  '01d': '☀️', '01n': '🌙',
  '02d': '🌤️', '02n': '☁️',
  '03d': '⛅', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

function CurrentWeather({ data }) {
  const weatherEmoji = ICON_MAP[data.icon] || '🌡️';

  const formatTime = (unix) => {
    return new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card current-weather">
      <h3>Current Weather</h3>
      <div className="weather-main">
        <span style={{ fontSize: '4rem' }}>{weatherEmoji}</span>
        <div>
          <div className="weather-temp">{Math.round(data.temp)}°C</div>
          <div className="weather-desc">{data.description}</div>
        </div>
      </div>
      <div className="weather-details">
        <div className="weather-detail">
          <span className="label">Feels Like</span>
          <span className="value">{Math.round(data.feels_like)}°C</span>
        </div>
        <div className="weather-detail">
          <span className="label">Humidity</span>
          <span className="value">{data.humidity}%</span>
        </div>
        <div className="weather-detail">
          <span className="label">Wind</span>
          <span className="value">{data.wind_speed} m/s</span>
        </div>
        <div className="weather-detail">
          <span className="label">Pressure</span>
          <span className="value">{data.pressure} hPa</span>
        </div>
        <div className="weather-detail">
          <span className="label">High / Low</span>
          <span className="value">{Math.round(data.temp_max)}° / {Math.round(data.temp_min)}°</span>
        </div>
        <div className="weather-detail">
          <span className="label">Visibility</span>
          <span className="value">{(data.visibility / 1000).toFixed(1)} km</span>
        </div>
        <div className="weather-detail">
          <span className="label">Sunrise</span>
          <span className="value">{formatTime(data.sunrise)}</span>
        </div>
        <div className="weather-detail">
          <span className="label">Sunset</span>
          <span className="value">{formatTime(data.sunset)}</span>
        </div>
      </div>
    </div>
  );
}

export default CurrentWeather;
