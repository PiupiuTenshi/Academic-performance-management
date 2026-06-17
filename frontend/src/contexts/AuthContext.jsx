import React, { createContext, useEffect, useState } from "react";
import { getMe } from "../services/auth.api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    async function restoreSession() {
      if (!savedToken) {
        setInitializing(false);
        return;
      }

      setToken(savedToken);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      try {
        const data = await getMe();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (_) {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setInitializing(false);
      }
    }

    restoreSession();
  }, []);

  function login(data) {
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
