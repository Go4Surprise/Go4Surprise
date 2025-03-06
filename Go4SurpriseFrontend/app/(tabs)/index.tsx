import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Go4Surprise</Text>
      <Text style={styles.subtitle}>Bienvenido</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/LoginScreen')}>
        <Text style={styles.buttonText}>Iniciar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.registerText}>
        ¿No tienes cuenta? 
        <Text style={styles.registerLink} onPress={() => router.push('/RegisterScreen')}>
          Regístrate aquí
        </Text>
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
    color: '#777',
  },
  registerLink: {
    color: '#004AAD',
    fontWeight: 'bold',
  },
});
