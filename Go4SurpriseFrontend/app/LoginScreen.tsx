import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Image, Alert, useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { BASE_URL } from '../constants/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // States for standard login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set up the Google authentication request
  const [, response, promptAsync] = Google.useAuthRequest({
    //expoClientId: 'YOUR_EXPO_CLIENT_ID',
    //iosClientId: 'YOUR_IOS_CLIENT_ID',
    //androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: '964097563380-ij5ek733mtdb89of91va7t6imqrg5fjv.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const token = authentication?.accessToken;
      if (!token) {
        console.error("Authentication token is null or undefined.");
        return;
      }
      axios.post(
        `${BASE_URL}/users/social/google/`,
        { access_token: token },
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then(response => {
        console.log("Response data: ", response.data)
        const { access, refresh, user_id, id, preferences_set, is_superuser, is_staff } = response.data;
        AsyncStorage.setItem('accessToken', access);
        AsyncStorage.setItem('refreshToken', refresh);
        AsyncStorage.setItem('userId', user_id.toString());
        AsyncStorage.setItem('id', id);
        AsyncStorage.setItem('isAdmin', (is_superuser && is_staff).toString());
        console.log("User admin status set to:", (is_superuser && is_staff).toString());
        Alert.alert('Éxito', 'Inicio de sesión con Google correcto');
        if (!preferences_set) {
          router.push('/CompleteProfileScreen');
        } else {
          router.push(preferences_set ? '/HomeScreen' : '/IntroPreferencesScreen');
        }
      })      
      .catch(error => {
        console.log("Social login error data:", error.response?.data);
        Alert.alert('Error de inicio con Google', error.message);
      });
    }
  }, [response]);


  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      const response = await axios.post(
        `${BASE_URL}/users/login/`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { access, user_id, refresh, id, preferences_set, is_superuser, is_staff } = response.data;
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('userId', user_id.toString());
      await AsyncStorage.setItem('refreshToken', refresh);
      await AsyncStorage.setItem('id', id);
      await AsyncStorage.setItem('isAdmin', (is_superuser && is_staff).toString());
      Alert.alert('Éxito', 'Inicio de sesión correcto');
      if (!preferences_set) {
        router.push('/CompleteProfileScreen');
      } else {
        router.push(preferences_set ? '/HomeScreen' : '/IntroPreferencesScreen');
      }
    } catch (error) {
      console.log(error)
      setErrorMessage('Credenciales incorrectas. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
        {/* Left section - logo and text */}
        <View style={styles.leftSection}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.description}>
            ¿No tienes ganas de organizar un evento? Deja que nosotros te demos una sorpresa
          </Text>
        </View>

        {/* Right section - form */}
        <View style={styles.rightSection}>
          <View style={styles.card}>
            <TextInput 
              style={styles.input} 
              placeholder="Username" 
              value={username} 
              onChangeText={setUsername} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña" 
              secureTextEntry 
              value={password} 
              onChangeText={setPassword} 
            />

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.button} onPress={() => void handleLogin()}>
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <Text style={styles.linkText} onPress={() => router.push('/ForgottenPasword')}>
              ¿Has olvidado la contraseña?
            </Text>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/RegisterScreen')}>
              <Text style={styles.secondaryButtonText}>Crear una cuenta</Text>
            </TouchableOpacity>

            {/* Google login button */}
            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
              <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 1100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentDesktop: {
    flexDirection: 'row',
  },
  contentMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    maxWidth: 500,
    marginBottom: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  description: {
    fontSize: 20,
    color: '#333',
    marginTop: 10,
    textAlign: 'left',
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 400,
  },
  card: {
    width: 400,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#1877F2',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  secondaryButton: {
    backgroundColor: '#42B72A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});