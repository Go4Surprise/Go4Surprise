import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ImageBackground } from 'react-native';
import { router, useNavigation } from 'expo-router';
import axios from 'axios';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:8000/users/login/', {
        email,
        password,
      });

      Alert.alert('Éxito', 'Inicio de sesión correcto');
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/Background.jpg')} // Ruta de la imagen de fondo
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Go4Surprise</Text>
        <Text style={styles.subtitle}>Iniciar sesión</Text>

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.button} onPress={() => router.push('/PreferencesFormScreen')}>
      <Text style={styles.buttonText}>Acceder</Text>
      </TouchableOpacity>

        <Text style={styles.forgotPasswordText}>¿Has olvidado tu <Text style={styles.linkText}>contraseña?</Text></Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Leve transparencia para mejorar visibilidad
    borderRadius: 10, // Para que no se vea tan cuadrado
    margin: 20, // Da un poco de margen a los lados
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
  forgotPasswordText: {
    fontSize: 14,
    color: '#777',
  },
  linkText: {
    color: '#004AAD',
    fontWeight: 'bold',
  },
});
