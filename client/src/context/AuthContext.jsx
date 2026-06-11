import { createContext, useContext, useEffect, useState } from 'react';
import { setToken, getToken } from '../api/client.js';
import { authApi } from '../api/resources.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Відновлення сесії за збереженим токеном
  useEffect(() => {
    async function load() {
      if (getToken()) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          setToken(null);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function login(email, password) {
    const { token, user } = await authApi.login(email, password);
    setToken(token);
    setUser(user);
  }

  async function register(payload) {
    const { token, user } = await authApi.register(payload);
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  // Перечитати профіль із сервера (після зміни організації/ролі)
  async function refresh() {
    try {
      setUser(await authApi.me());
    } catch { /* сесія недійсна — ігноруємо */ }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
