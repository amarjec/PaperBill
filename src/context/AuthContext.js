import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize: Load session on app startup
  useEffect(() => {
    const init = async () => {
      const { token, user } = await storageService.getAuth();
      if (token) {
        setToken(token);
        setUser(user);
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (idToken, deviceId) => {
    try {
      const data = await authApi.googleLogin(idToken, deviceId);
      if (data.success) {
        await storageService.saveAuth(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (e) {}
    await storageService.clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);