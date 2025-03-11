import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function UserProfileScreen() {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      router.replace('/LoginScreen'); // Redirige a la pantalla de inicio de sesión
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Eliminar Cuenta",
      "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              await axios.delete('http://localhost:8000/users/delete/', {
                headers: { Authorization: `Bearer ${token}` }
              });
              await AsyncStorage.clear();
              router.replace('/LoginScreen');
            } catch (error) {
              console.error("Error al eliminar la cuenta", error);
              Alert.alert("Error", "No se pudo eliminar la cuenta.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Encabezado con fondo de imagen */}
      <ImageBackground source={require('../assets/images/LittleBackground.jpg')} style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={require('../assets/images/user-logo-none.png')} style={styles.avatar} />
        </View>
      </ImageBackground>
      
      {/* Tarjeta del perfil */}
      <View style={styles.profileCard}>
        <Text style={styles.username}>Nombre de Usuario</Text>
        <Text style={styles.email}>usuario@email.com</Text>
      </View>

      {/* Opciones del perfil */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="person" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="lock-closed" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Cambiar Contraseña</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="time" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Historial de Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionButton, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionButton, styles.deleteButton]} onPress={handleDeleteAccount}>
          <Ionicons name="trash" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.deleteText}>Eliminar Cuenta</Text>
        </TouchableOpacity>
      </View>

      {/* Botón para ir a HomeScreen */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/HomeScreen')}>
        <Ionicons name="home" size={30} color="#fff" />
      </TouchableOpacity>
      
      {/* Footer con logo pequeño y nombre de la app en línea */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Go4Surprise</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    backgroundColor: '#d9534f',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  }, 
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
    paddingBottom: 50,
  },
  header: {
    width: '100%',
    height: 150,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '90%',
    marginTop: 60,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#777',
  },
  optionsContainer: {
    width: '90%',
    marginTop: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004AAD',
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  homeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#004AAD',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 100,
    padding: 5,
  },
  footerLogo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  footerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#777',
    marginTop: 5,
  },
  backgroundLogo: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  width: '100%',
  height: '100%',
},

});