import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ImageBackground } from 'react-native';
import { useNavigation, Stack } from 'expo-router';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function ForgottenPasword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const router = useRouter();

  const sendEmail = async () => {
    
  };

  return (
    <ImageBackground 
      source={require('../assets/images/Background.jpg')} // Ruta de la imagen de fondo
      style={styles.background}
      resizeMode="cover"
    >
      <>
        <Stack.Screen options={{ headerShown: false }} />
      </>
      <View style={styles.container}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Go4Surprise</Text>
        <Text style={styles.subtitle}>¿Tienes problemas para entrar?</Text>

        <Text style={styles.textInfo}>Introduce tu correo electrónico y 
          te enviaremos un enlace para que vuelvas a entrar en tu cuenta.</Text>

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />

        <TouchableOpacity style={styles.button} onPress={sendEmail}>
          <Text style={styles.buttonText}>Enviar enlace de acceso</Text>
        </TouchableOpacity>

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
  textInfo: {
    fontSize: 12,
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
    color: 'blue',
    fontWeight: 'bold',
  },
});
