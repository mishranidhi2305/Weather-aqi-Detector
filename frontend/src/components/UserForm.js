import React, { useState } from 'react';

function UserForm({ onSubmit, loading }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && city.trim()) {
      onSubmit(name.trim(), city.trim());
    }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={50}
      />
      <input
        type="text"
        placeholder="City (e.g. Delhi, London)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
        maxLength={100}
      />
      <button type="submit" disabled={loading || !name.trim() || !city.trim()}>
        {loading ? 'Loading...' : 'Get Weather'}
      </button>
    </form>
  );
}

export default UserForm;
