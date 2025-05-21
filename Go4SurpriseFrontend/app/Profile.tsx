import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { BASE_URL } from '../constants/apiUrl';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Keyboard } from 'react-native';


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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);



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

  // Escuchar tecla Enter en web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (modalVisible) {
            handleSaveChanges();
          } else if (passwordModalVisible) {
            handleChangePassword();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalVisible, passwordModalVisible, editedUser, currentPassword, newPassword]);
  

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
      let birthdateString = '';
      if (editedUser.birthdate) {
        try {
          if (editedUser.birthdate instanceof Date) {
            birthdateString = editedUser.birthdate.toISOString().split('T')[0];
          } 
          else if (typeof editedUser.birthdate === 'string') {
            const dateObj = new Date(editedUser.birthdate);
            birthdateString = dateObj.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting date:', e);
          birthdateString = new Date().toISOString().split('T')[0];
        }
      }
      formData.append('birthdate', birthdateString);
  
      if (editedUser.pfp && editedUser.pfp !== user.pfp) {
        if (editedUser.pfp.startsWith('data:image')) {
          // Handle base64 encoded images from web
          const base64Data = editedUser.pfp.split(',')[1];
          const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
          const pfpFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
          formData.append('pfp', pfpFile);
        } else if (Platform.OS !== 'web') {
          // Handle file URI from mobile
          const filename = editedUser.pfp.split('/').pop();
          const match = /\.(\w+)$/.exec(filename ?? 'image.jpg');
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('pfp', {
            uri: editedUser.pfp,
            name: filename || 'profile.jpg',
            type
          } as any);
        }
      }
  
      await axios.put(`${BASE_URL}/users/update/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Fetch fresh user data from the server instead of just updating local state
      await fetchUserData();
      
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
        setShowDeleteModal(false);
        setShowDeleteSuccess(true);
        setTimeout(() => {
          router.replace('/LoginScreen'); // Redirect to main screen
        }, 5000);
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
          <Image 
            source={
              user.pfp 
                ? { uri: user.pfp.startsWith('http') 
                    ? user.pfp // Use as is if it's a full URL (from GCS)
                    : `${BASE_URL}${user.pfp}` // Otherwise prepend BASE_URL
                  } 
                : require('../assets/images/user-logo-none.png')
            } 
            style={styles.avatar}
            onError={() => {
              // If image fails to load, set user.pfp to empty string so default image is shown
              setUser(prevUser => ({...prevUser, pfp: ''}))
            }}
          />
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
        
        <TouchableOpacity style={[styles.optionButton, styles.deleteButton]} onPress={() => setShowDeleteModal(true)}>
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
              <TextInput style={styles.input} value={editedUser.name} 
                onChangeText={(text) => setEditedUser({ ...editedUser, name: text })} placeholder="Nombre" 
                returnKeyType="done" onSubmitEditing={handleSaveChanges}/>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput style={styles.input} value={editedUser.surname} onChangeText={(text) => setEditedUser({ ...editedUser, surname: text })} placeholder="Apellido" 
                returnKeyType="done" onSubmitEditing={handleSaveChanges}/>
              <Text style={styles.label}>Usuario</Text>
              <TextInput style={styles.input} value={editedUser.username} onChangeText={(text) => setEditedUser({ ...editedUser, username: text })} placeholder="Usuario" 
                returnKeyType="done" onSubmitEditing={handleSaveChanges}/>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={editedUser.email} onChangeText={(text) => setEditedUser({ ...editedUser, email: text })} placeholder="Email" keyboardType="email-address" 
                returnKeyType="done" onSubmitEditing={handleSaveChanges}/>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput style={styles.input} value={editedUser.phone} onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })} placeholder="Teléfono" keyboardType="phone-pad" 
                returnKeyType="done" onSubmitEditing={handleSaveChanges}/>
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
              <Image 
                source={
                  editedUser.pfp 
                    ? { uri: editedUser.pfp } 
                    : require('../assets/images/user-logo-none.png')
                }
                style={styles.profileImagePreview}
                onError={() => {
                  setEditedUser(prev => ({...prev, pfp: ''}))
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={() => void handleSaveChanges()}>
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); }}>
                  <Text style={styles.cancelButton}>Cancelar</Text>
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

            {/* Contraseña actual */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Contraseña actual"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={24} color="#777" />
              </TouchableOpacity>
            </View>

            {/* Nueva contraseña */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nueva contraseña"
                secureTextEntry={!showNewPassword}
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => void handleChangePassword()}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setPasswordModalVisible(false); }}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={50} color="#d9534f" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
            <Text style={styles.modalText}>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y eliminará todas tus reservas asociadas.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteSuccess}
        onRequestClose={() => setShowDeleteSuccess(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainerDeleteSuccess}>
            <Text style={styles.modalTextDeleteSuccess}>
              Tu cuenta ha sido eliminada con éxito.
            </Text>
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
    boxSizing: 'border-box' as 'border-box', // Explicitly cast to valid BoxSizing type
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
    width: 65,  
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },  
  footer: {
    alignItems: 'center',
    marginTop: 30,
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
  width: '90%',
  maxHeight: '90%',
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 20,
  justifyContent: 'center',
},
modalScrollContent: {
  padding: 15,
  paddingBottom: 40,
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#1877F2',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    paddingVertical: 5,
  },
  successText: {
    color: "green",
    fontSize: 14,
    marginBottom: 10,
    alignSelf: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainerDeleteSuccess: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTextDeleteSuccess: {
    fontSize: 16,
    color: "green",
    textAlign: "center",
    fontWeight: "bold",
  },
  
});