import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { login as loginApi } from "../services/auth.api";
import logoImg from "../assets/logo.png";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await loginApi(username, password);
      // data = { accessToken, user }
      login(data);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng nhập thất bại. Kiểm tra lại thông tin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoImg} alt="PTIT Logo" />
          <span>QLKQHT</span>
        </div>
        <p className="login-sub">Hệ thống Quản lý Kết quả Học tập</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Tên đăng nhập</label>
            <input
              id="login-username"
              className="form-control"
              type="text"
              placeholder="Nhập username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              className="form-control"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
