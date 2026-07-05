import React from 'react';

const ICON_MAP = {
  '01d': '☀️', '01n': '🌙', '02d': '🌤️', '02n': '☁️',
  '03d': '⛅', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

function ForecastCard({ forecast }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="forecast-section">
      <h3>Looking Ahead</h3>
      <div className="forecast-grid">
        {forecast.map((day, i) => (
          <div className="forecast-day" key={i}>
            <div className="date">{formatDate(day.date)}</div>
            <span style={{ fontSize: '2.5rem' }}>{ICON_MAP[day.icon] || '🌡️'}</span>
            <div className="temps">
              <span className="high">{Math.round(day.temp_max)}°</span>
              <span className="low">{Math.round(day.temp_min)}°</span>
            </div>
            <div className="desc">{day.description}</div>
            <div className="extra">
              {day.humidity != null ? `Humidity: ${day.humidity}% · ` : ''}Wind: {day.wind_speed} m/s
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ForecastCard;
