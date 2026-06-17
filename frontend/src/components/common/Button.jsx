import React from "react";

// variant: "primary" | "danger" | "success" | "outline"
// size: "sm" | "md" (default)
export default function Button({ children, variant = "primary", size, onClick, disabled, type = "button", style }) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
