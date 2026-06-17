import React from "react";

// Input có label, error message
export default function Input({ label, id, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`form-control ${error ? "error" : ""}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
