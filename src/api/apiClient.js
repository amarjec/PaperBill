import axios from 'axios';
import { storageService } from '../services/storageService'; 

const apiClient = axios.create({
  // Replace this with your actual computer's local IP address and port
  baseURL: process.env.EXPO_PUBLIC_API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Runs before every API call
apiClient.interceptors.request.use(
  async (config) => {
    // Fetch the latest token from our storage service
    const { token } = await storageService.getAuth();
    
    if (token) {
      // If a token exists, attach it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;