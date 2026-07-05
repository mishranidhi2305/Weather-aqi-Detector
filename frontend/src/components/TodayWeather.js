import React from 'react';

const ICON_MAP = {
  '01d': '☀️', '01n': '🌙', '02d': '🌤️', '02n': '☁️',
  '03d': '⛅', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

function TodayWeather({ slots }) {
  return (
    <div className="today-section">
      <h3>Today's Weather</h3>
      <div className="today-slots">
        {slots.map((slot, i) => (
          <div className="today-slot" key={i}>
            <div className="time">{slot.time}</div>
            <span style={{ fontSize: '2rem' }}>{ICON_MAP[slot.icon] || '🌡️'}</span>
            <div className="temp">{Math.round(slot.temp)}°C</div>
            <div className="desc">{slot.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodayWeather;
