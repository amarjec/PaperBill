import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'pb_auth_token',
  USER: 'pb_user_data',
};

export const storageService = {
  saveAuth: async (token, user) => {
    await AsyncStorage.multiSet([
      [KEYS.TOKEN, token],
      [KEYS.USER, JSON.stringify(user)],
    ]);
  },
  getAuth: async () => {
    const token = await AsyncStorage.getItem(KEYS.TOKEN);
    const userStr = await AsyncStorage.getItem(KEYS.USER);
    return { token, user: userStr ? JSON.parse(userStr) : null };
  },
  clearAuth: async () => {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
  }
};