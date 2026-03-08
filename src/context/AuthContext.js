import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { storageService } from '../services/storageService';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { router } from 'expo-router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize: load cached session from storage on app start
  useEffect(() => {
    const init = async () => {
      const { token: savedToken, user: savedUser } = await storageService.getAuth();
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
      }
      setLoading(false);
    };
    init();
  }, []);

  // ── refreshSession ──────────────────────────────────────────────────────────
  // Fetches the latest user profile from the server and syncs it into context
  // + storage. Called on app-foreground and after any action that could change
  // premium/subscription status. This is the single source of truth.
  const refreshSession = useCallback(async () => {
    // Only refresh for logged-in owners (staff have no subscription to sync)
    const { token: savedToken, user: savedUser } = await storageService.getAuth();
    if (!savedToken || !savedUser || savedUser.role === 'Staff' || savedUser.permissions) return;

    try {
      const res = await userApi.getProfile();
      if (res.success) {
        setUser(res.user);
        await storageService.saveAuth(savedToken, res.user);
      }
    } catch {
      // Network failure — silently keep cached values, never crash
    }
  }, []);

  // ── AppState listener ───────────────────────────────────────────────────────
  // Every time the app comes to the foreground (switching back from another app,
  // unlocking phone, etc.) re-fetch the profile so isPremium is always fresh.
  useEffect(() => {
    // Small delay on mount so the storage init above finishes first
    const initialTimer = setTimeout(() => refreshSession(), 800);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshSession();
      }
    });

    return () => {
      clearTimeout(initialTimer);
      subscription.remove();
    };
  }, [refreshSession]);

  // Owner Login (Google)
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

  // Staff Login
  const staffLogin = async (phoneNumber, pin, deviceId) => {
    try {
      const data = await authApi.staffLogin(phoneNumber, pin, deviceId);
      if (data.success) {
        await storageService.saveAuth(data.token, data.staff);
        setToken(data.token);
        setUser(data.staff);
      }
      return data;
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  // Explicit session update — used after profile edits, payment success, etc.
  const updateSessionUser = async (updatedUserData) => {
    setUser(updatedUserData);
    await storageService.saveAuth(token, updatedUserData);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    await storageService.clearAuth();
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, staffLogin, logout,
      setUser, updateSessionUser, refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);