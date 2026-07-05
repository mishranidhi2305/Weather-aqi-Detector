import React from 'react';

function AQICard({ data }) {
  const { aqi, pollutants } = data;

  return (
    <div className="card">
      <h3>Air Quality Index</h3>
      <div className="aqi-main">
        <div className="aqi-index" style={{ color: aqi.color }}>
          {aqi.index}
        </div>
        <div className="aqi-level" style={{ color: aqi.color }}>
          {aqi.level}
        </div>
        <div className="aqi-description">{aqi.description}</div>
      </div>
      <div className="pollutants-grid">
        {Object.entries(pollutants).map(([key, p]) => (
          <div className="pollutant" key={key}>
            <span className="name">{p.name}</span>
            <span className="val">{p.value} {p.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AQICard;
