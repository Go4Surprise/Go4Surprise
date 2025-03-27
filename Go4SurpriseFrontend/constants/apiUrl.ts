import { Platform } from 'react-native';

// Use built-in __DEV__ variable which is true in development and false in production
export const BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://go4-backend-dot-ispp-2425-g10.ew.r.appspot.com'; // Production URL