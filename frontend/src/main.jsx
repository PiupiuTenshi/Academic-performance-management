import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

function App() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Academic Performance Management</p>
        <h1>Quản lý kết quả học tập</h1>
        <p className="summary">
          Khung frontend Phase 0 đã sẵn sàng để phát triển các màn hình đăng nhập, nhập điểm,
          tra cứu bảng điểm và quản trị hệ thống.
        </p>
        <dl className="meta">
          <div>
            <dt>API Base URL</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Frontend</dt>
            <dd>React + Vite</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

