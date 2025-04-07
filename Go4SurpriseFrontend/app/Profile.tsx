import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { BASE_URL } from '../constants/apiUrl';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Platform } from 'react-native';


interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  surname: string;
  phone: string;
  pfp: string;
  birthdate: Date;
}

export default function UserProfileScreen() {
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    username: '',
    surname: '',
    phone: '',
    pfp: '',
    birthdate: new Date(),
  });
  
  const [, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', username: '', surname: '', phone: '', pfp: '' , birthdate: new Date() });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);


  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/LoginScreen'); // Redirige si no hay token
        return;
      }
      const response = await axios.get(`${BASE_URL}/users/get_user_info/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
       // Asegura que el ID está incluido antes de actualizar el estado
       setUser(prevState => ({
        ...prevState,
        id: response.data.id || '',  
        name: response.data.name,
        email: response.data.email,
        username: response.data.username,
        surname: response.data.surname,
        phone: response.data.phone,
        pfp: response.data.pfp,
        birthdate: response.data.birthdate,
    }));
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  };
  

  useEffect(() => {
    fetchUserData();
  }, []);
  

  // Open edit profile modal with current user data
  const handleEditProfile = () => {
    if (user) {
        setEditedUser({
            name: user.name || '',
            surname: user.surname || '', 
            username: user.username || '',  
            email: user.email || '',
            phone: user.phone || '',
            pfp: user.pfp || '',
            birthdate: user.birthdate || new Date(),
        });
        setModalVisible(true);
    }
  };

  const pickImage = async () => {

    // Seleccionar una imagen de la galería
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images',],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });
    console.log("Imagen detectada:", result);
    if (!result.canceled) {
          setEditedUser(prevState => ({ ...prevState, pfp: result.assets[0].uri })); // Actualiza el estado con la URI de la imagen seleccionada   
    }
  };


  const handleSaveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('name', editedUser.name);
      formData.append('surname', editedUser.surname);
      formData.append('username', editedUser.username);
      formData.append('email', editedUser.email);
      formData.append('phone', editedUser.phone);
      formData.append('birthdate', editedUser.birthdate.toISOString().split('T')[0]); // Formato YYYY-MM-DD
  
      if (editedUser.pfp && editedUser.pfp.startsWith('data:image')) {
        const base64Data = editedUser.pfp.split(',')[1];
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
        const pfpFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        formData.append('pfp', pfpFile);
      }
  
      await axios.put(`${BASE_URL}/users/update/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setUser(prevState => ({
        ...prevState,
        ...editedUser
      }));
  
      setModalVisible(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el perfil', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };
  

  // Change password through API
  const handleChangePassword = async () => {
    try {
      setPasswordError('');

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setPasswordError("No se encontró ninguna sesión activa.");
        return;
      }

      await axios.post(
        `${BASE_URL}/users/change_password/`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert("Success", "Contraseña actualizada exitosamente.");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setPasswordError("❌La contraseña actual es incorrecta.");
        } else {
          setPasswordError("⚠️ No se pudo cambiar la contraseña. Inténtalo de nuevo.");
        }
      } else {
        setPasswordError("🚫 No se pudo conectar al servidor.");
      }
    }
  };

  // Get user ID from AsyncStorage
  const getUserIdFromToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        Alert.alert("Error", "No se encontró ninguna sesión activa.");
        return null;
      }
      return userId;
    } catch (error) {
      console.error("Error al obtener el ID de usuario:", error);
      return null;
    }
  };

  // Get usuario_id from API
  const getUsuarioId = async (userId: string, token: string): Promise<string | null> => {
    try {
      const usuarioResponse = await axios.get(`${BASE_URL}/users/get-usuario-id/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId }
      });
      return usuarioResponse.data.usuario_id;
    } catch (error) {
      console.error("Error al obtener el ID de usuario:", error);
      return null;
    }
  };


  // Validate authentication data
  const validateAuthData = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const userId = await getUserIdFromToken();
    return { token, userId, isValid: !!userId && !!token };
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      router.replace('/LoginScreen');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
      Alert.alert("Error", "No se pudo completar el cierre de sesión.");
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
  
      const response = await axios.delete(`${BASE_URL}/users/delete/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (response.status === 204) {
        await AsyncStorage.clear();
        router.replace('/LoginScreen');
      } else {
        Alert.alert("Error", "No se pudo eliminar la cuenta. Inténtalo más tarde.");
      }
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      Alert.alert("Error", "No se pudo eliminar la cuenta. Inténtalo más tarde.");
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      

       {/* Botón para ir a HomeScreen */}
       <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/HomeScreen')}>
        <Ionicons name="home" size={30} color="#fff" />
      </TouchableOpacity>
      
      {/* Encabezado con fondo de imagen */}
      <ImageBackground source={require('../assets/images/LittleBackground.jpg')} style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={user.pfp ? { uri: `${BASE_URL}${user.pfp}` } : require('../assets/images/user-logo-none.png')} style={styles.avatar} />
        </View>
      </ImageBackground>

      {/* Tarjeta del perfil */}
      {user && (
                <View style={styles.profileCard}>
                  <Text style={styles.username}>{user.name} {user.surname}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>
        )}

      {/* Profile options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={handleEditProfile}>
          <Ionicons name="person" size={20} color="#004AAD" style={styles.icon}/>
          <Text style={styles.optionText}>Editar Perfil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionButton} onPress={() => { setPasswordModalVisible(true); }}>
          <Ionicons name="lock-closed" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Cambiar Contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/MyBookings')}>
          <Ionicons name="time" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Reservas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.optionButton, styles.logoutButton]} onPress={() => void handleLogout()}>
          <Ionicons name="log-out" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.optionButton, styles.deleteButton]} onPress={() => void handleDeleteAccount()}>
          <Ionicons name="trash" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.deleteText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </View>
      
      {/* Footer con logo pequeño y nombre de la app en línea */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Go4Surprise</Text>
      </View>

      {/* Edit profile modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <Text style={styles.label}>Nombre</Text>
              <TextInput style={styles.input} value={editedUser.name} onChangeText={(text) => setEditedUser({ ...editedUser, name: text })} placeholder="Nombre" />
              <Text style={styles.label}>Apellidos</Text>
              <TextInput style={styles.input} value={editedUser.surname} onChangeText={(text) => setEditedUser({ ...editedUser, surname: text })} placeholder="Apellido" />
              <Text style={styles.label}>Usuario</Text>
              <TextInput style={styles.input} value={editedUser.username} onChangeText={(text) => setEditedUser({ ...editedUser, username: text })} placeholder="Usuario" />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={editedUser.email} onChangeText={(text) => setEditedUser({ ...editedUser, email: text })} placeholder="Email" keyboardType="email-address" />
              <Text style={styles.label}>Teléfono</Text>
              <TextInput style={styles.input} value={editedUser.phone} onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })} placeholder="Teléfono" keyboardType="phone-pad" />
              <Text style={styles.label}>Fecha de Nacimiento</Text>
              {Platform.OS === 'web' ? (
                <input
                  style={styles.webDateInput}
                  type="date"
                  value={new Date(editedUser.birthdate).toISOString().split('T')[0]}
                  onChange={(e) => setEditedUser({ ...editedUser, birthdate: new Date(e.target.value) })}
                />
              ) : (
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {editedUser.birthdate ? new Date(editedUser.birthdate).toLocaleDateString() : 'Seleccionar Fecha'}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>Foto de Perfil</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <Text style={styles.imagePickerButtonText}>Seleccionar Imagen</Text>
              </TouchableOpacity>
              {editedUser.pfp ? (
                  <Image source={{ uri: editedUser.pfp }} style={styles.profileImagePreview} />
              ) : null}            
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={() => void handleSaveChanges()}>
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); }}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Change password modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Contraseña actual"
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => void handleChangePassword()}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setPasswordModalVisible(false); }}>
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
  webDateInput: {
    width: '100%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  
  dateButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#333',
  },  
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
    top: 40,           // Ajusta según altura de status bar
    left: 20,
    backgroundColor: '#004AAD',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },  
  footer: {
    alignItems: 'center',
    marginTop: 100,
    padding: 5,
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
  borderRadius: 10,
  maxHeight: '80%',
  padding: 5,
},
modalScrollContent: {
  padding: 15,
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
imagePickerButton: {
  backgroundColor: '#004AAD',
  padding: 10,
  borderRadius: 5,
  alignItems: 'center',
  marginVertical: 10,
},
imagePickerButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
profileImagePreview: {
  width: 100,
  height: 100,
  borderRadius: 50,
  marginVertical: 10,
},
  errorText: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});