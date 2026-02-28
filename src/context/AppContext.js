import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import apiClient from '../api/apiClient'; // The axios instance we discussed

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      const id = Device.osInternalBuildId || "unknown_device";
      
      setDeviceId(id);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load storage", e);
    } finally {
      setLoading(false);
    }
  };

  const loginOwner = async (idToken) => {
    try {
      const response = await apiClient.post('/auth/google-login', {
        idToken,
        deviceId: deviceId
      });

      if (response.data.success) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setToken(token);
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login Failed" };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.log("Logout cleanup on server failed");
    }
    await AsyncStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, token, loading, deviceId, loginOwner, logout, setUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);