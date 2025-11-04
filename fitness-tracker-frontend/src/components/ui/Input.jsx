import React from 'react';

export default function Input({ label, type = 'text', value, onChange, name, placeholder }) {
  return (
    <div className="ui-input">
      {label && <label className="ui-label">{label}</label>}
      <input
        className="ui-input-field"
        type={type}
        value={value}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
