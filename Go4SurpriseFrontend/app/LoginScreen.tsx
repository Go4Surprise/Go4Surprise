import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, complete todos los campos');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/users/login/', {
        username,
        password,
      });

      Alert.alert('Éxito', 'Inicio de sesión correcto');
      router.push('/HomeScreen');
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessage('Debe ingresar un correo y una contraseña válidos.');
        } else if (error.response.status === 404) {
          setErrorMessage('El username ingresado no existe.');
        } else if (error.response.status === 401) {
          setErrorMessage('Contraseña incorrecta.');
        } else {
          setErrorMessage('Error en el inicio de sesión. Intente nuevamente.');
        }
      } else {
        setErrorMessage('Error de conexión con el servidor.');
      }
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/Background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}> 
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Go4Surprise</Text>
        <Text style={styles.subtitle}>Iniciar sesión</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Acceder</Text>
        </TouchableOpacity>

        <Text style={styles.linkText} onPress={() => router.push('/ForgottenPasword')}>
          ¿Has olvidado tu contraseña?
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    margin: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004AAD',
  },
  subtitle: {
    fontSize: 18,
    color: '#777',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: 'blue',
    fontWeight: 'bold',
  },
});
