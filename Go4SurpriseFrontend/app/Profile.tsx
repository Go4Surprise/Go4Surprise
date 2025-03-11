import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

export default function UserProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Go4Surprise</Text>
        </View>
      </View>
      
      <View style={styles.profileContainer}>
        <Image source={require('../assets/images/user-logo-none.png')} style={styles.profileImage} />
        <Text style={styles.username}>Nombre de Usuario</Text>
        <Text style={styles.email}>usuario@email.com</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Configuración</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Historial de Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionButton, styles.logoutButton]}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004AAD',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#777',
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
