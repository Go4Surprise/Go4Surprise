import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <ImageBackground 
      source={require('../../assets/images/Background.jpg')} 
      style={styles.background}
      resizeMode="cover" // Ajusta la imagen de fondo
    >
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Bienvenido</Text>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/LoginScreen')}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.registerText}>
          ¿No tienes cuenta? {' '}
          <Text style={styles.registerLink} onPress={() => router.push('/RegisterScreen')}>
            Regístrate aquí
          </Text>
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
  },
  logo: {
    width: 200,
    height: 300,
    marginBottom: 0.3,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black', // Color blanco para mayor contraste
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'blue',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    fontSize: 14,
    color: 'black',
  },
  registerLink: {
    color: 'blue', 
    fontWeight: 'bold',
  },
});
