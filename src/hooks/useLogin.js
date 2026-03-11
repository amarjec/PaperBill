import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import * as Device from 'expo-device';

export function useLogin() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth(); // Consuming our modular AuthContext

  useEffect(() => {
    // Standard Google Configuration
    GoogleSignin.configure({
      webClientId: '67101226269-osb1bmb7a2b40hjnr0nolmrrps0lelcc.apps.googleusercontent.com',
      androidClientId: '67101226269-leg7gl71sutrnfvpv5196gr4sqgta77v.apps.googleusercontent.com',
      iosClientId: '67101226269-n21pml7l3og8aadasvfltmic8p65pref.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (!idToken) throw new Error('No ID token found.');
        
        const deviceId = Device.osInternalBuildId || "unknown_device";
        const result = await login(idToken, deviceId); // Modular API call

        if (!result.success) {
          Alert.alert("Login Error", result.message);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', 'Unable to authenticate with Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { handleGoogleLogin, isLoggingIn };
}