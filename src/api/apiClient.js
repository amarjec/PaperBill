import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const apiClient = axios.create({
  baseURL: 'http://172.26.204.16:8080/api', // Use your local IP for physical device testing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically add JWT Token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  const deviceId = await AsyncStorage.getItem('deviceId'); // Unique ID for Single-Device policy
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Global Errors (Like Single-Device Kick-out)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const message = error.response.data.message;

      if (message === 'LOGOUT_REQUIRED') {
        Alert.alert('Session Expired', 'You have logged in from another device.');
        await AsyncStorage.clear();
        // TODO: Navigate to Login Screen here using a Navigation Service
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;