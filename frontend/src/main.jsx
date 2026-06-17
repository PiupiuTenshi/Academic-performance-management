import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
