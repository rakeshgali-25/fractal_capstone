// components/ui/Select.jsx
import React from "react";

export default function Select({ name, value, onChange, options, labelKey = "name", valueKey = "id", placeholder = "Select an option" }) {
  return (
    <select className="ui-select-field" name={name} value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option[valueKey]} value={option[valueKey]}>
          {option[labelKey]}
        </option>
      ))}
    </select>

  );
}
