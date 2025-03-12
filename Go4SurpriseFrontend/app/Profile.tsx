import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function UserProfileScreen() {
  
  const [user, setUser] = useState({
    name: '',
    email: '',
    username: '',
    surname: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', username: '', surname: '', phone: '' });


  // Función para obtener datos del usuario
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/LoginScreen'); // Redirige si no hay token
        return;
      }

      const response = await axios.get('http://localhost:8000/users/get_user_info/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log(response);

      setUser(response.data); // Guarda los datos del usuario
    } catch (error) {
      console.error('Error obteniendo datos del usuario', error);
      Alert.alert('Error', 'No se pudo obtener la información del usuario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleEditProfile = () => {
      if (user) {
          setEditedUser({
              name: user.name || '',
              surname: user.surname || '', 
              username: user.username || '',  
              email: user.email || '',
              phone: user.phone || ''
          });
          setModalVisible(true);
      }
  };


  const handleSaveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.put('http://localhost:8000/users/update/', editedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(editedUser);
      setModalVisible(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando perfil', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };

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
                        console.log("Intentando eliminar cuenta...");
                        const token = await AsyncStorage.getItem('accessToken');
                        if (!token) {
                            console.error("Token no encontrado");
                            Alert.alert("Error", "No tienes sesión iniciada.");
                            return;
                        }
                        
                        const response = await axios.delete('http://localhost:8000/users/delete/', {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        console.log("Respuesta del servidor:", response.status);
                        await AsyncStorage.clear();
                        router.replace('/LoginScreen');
                        Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada correctamente.");
                    } catch (error) {
                        console.error("Error al eliminar la cuenta:", error);
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
      {user && (
                <View style={styles.profileCard}>
                  <Text style={styles.username}>{user.name}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>
        )}

      {/* Opciones del perfil */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={handleEditProfile}>
          <Ionicons name="person" size={20} color="#004AAD" style={styles.icon}/>
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

       {/* Modal de edición de perfil */}
       <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TextInput style={styles.input} value={editedUser.name} onChangeText={(text) => setEditedUser({ ...editedUser, name: text })} placeholder="Nombre" />
            <TextInput style={styles.input} value={editedUser.surname} onChangeText={(text) => setEditedUser({ ...editedUser, surname: text })} placeholder="Apellido" />
            <TextInput style={styles.input} value={editedUser.username} onChangeText={(text) => setEditedUser({ ...editedUser, username: text })} placeholder="Usuario" />
            <TextInput style={styles.input} value={editedUser.email} onChangeText={(text) => setEditedUser({ ...editedUser, email: text })} placeholder="Email" keyboardType="email-address" />
            <TextInput style={styles.input} value={editedUser.phone} onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })} placeholder="Teléfono" keyboardType="phone-pad" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveChanges}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
},modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContent: {
  width: '80%',
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
},
input: {
  borderBottomWidth: 1,
  borderColor: '#ccc',
  marginBottom: 10,
  paddingVertical: 5,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
modalButton: {
  backgroundColor: '#004AAD',
  padding: 10,
  borderRadius: 5,
  flex: 1,
  alignItems: 'center',
  marginHorizontal: 5,
},
cancelButton: {
  backgroundColor: '#d9534f',
},
modalButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
});