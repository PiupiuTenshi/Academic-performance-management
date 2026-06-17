import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getMenuByRole } from "../../utils/roleMenu";
import logoImg from "../../assets/logo.png";

export default function Sidebar() {
  const { user } = useAuth();
  const menu = user ? getMenuByRole(user.role) : [];

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <img src={logoImg} alt="PTIT Logo" />
        <span>Quản lý kết quả học tập</span>
      </Link>
      <nav className="sidebar-nav">
        {menu.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
