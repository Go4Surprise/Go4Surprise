// Go4SurpriseFrontend/app/VerifyEmail.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../constants/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyEmail() {
  const { token, user_id } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verificando tu correo electrónico...');

  useEffect(() => {
    verifyEmail();
  }, [token, user_id]);

  const verifyEmail = async () => {
    if (!token || !user_id) {
      setStatus('error');
      setMessage('Enlace de verificación inválido. Faltan parámetros necesarios.');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/users/verify-email/`, {
        params: { token, user_id }
      });

      // Si la verificación es exitosa, guardamos el token de acceso
      if (response.data.access) {
        await AsyncStorage.setItem('accessToken', response.data.access);
        await AsyncStorage.setItem('refreshToken', response.data.refresh);
        await AsyncStorage.setItem('userId', response.data.user_id.toString());
        await AsyncStorage.setItem('id', response.data.id);
      }

      setStatus('success');
      setMessage(response.data.message || 'Tu correo ha sido verificado correctamente.');
    } catch (error) {
      setStatus('error');
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
        ? error.response.data.error 
        : 'No se pudo verificar tu correo electrónico. Por favor, intenta registrarte de nuevo.';
      setMessage(errorMessage);
    }
  };

  const handleContinue = () => {
    // Si fue exitoso, redirigimos a IntroPreferencesScreen, si no, a LoginScreen
    if (status === 'success') {
      router.push('/IntroPreferencesScreen');
    } else {
      router.push('/LoginScreen');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      
      {status === 'loading' && (
        <ActivityIndicator size="large" color="#1877F2" style={styles.loader} />
      )}
      
      <View style={styles.card}>
        <Text style={[
          styles.title, 
          status === 'success' ? styles.successTitle : status === 'error' ? styles.errorTitle : null
        ]}>
          {status === 'loading' ? 'Verificando...' : 
           status === 'success' ? '¡Verificación exitosa!' : 
           'Error de verificación'}
        </Text>
        
        <Text style={styles.message}>{message}</Text>
        
        {status !== 'loading' && (
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>
              {status === 'success' ? 'Continuar' : 'Volver al inicio de sesión'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successTitle: {
    color: '#42B72A',
  },
  errorTitle: {
    color: '#E4144C',
  },
  message: {
    fontSize: 16,
    color: '#606770',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },});