import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from "axios";
import { BASE_URL } from '../constants/apiUrl';

interface Reservation  {
  id: string;
  booking_date: string;
  experience_date: string;
  participants: number;
  price: number;
  status: string;
  total_price: number;
  experience: {  
    title: string;
  };
}


export default function UserProfileScreen() {
  
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    username: '',
    surname: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', username: '', surname: '', phone: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState(''); // Estado para manejar errores en el modal
  const [reservationsModalVisible, setReservationsModalVisible] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);


  // Función para obtener datos del usuario
  const fetchUserData = async () => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            router.replace('/LoginScreen'); // Redirige si no hay token
            return;
        }

        const response = await axios.get(`${BASE_URL}/users/get_user_info/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Datos del usuario:", response.data);

        // Asegura que el ID está incluido antes de actualizar el estado
        setUser(prevState => ({
            ...prevState,
            id: response.data.id || '',  // 🔹 Se asegura de que el id se guarde
            name: response.data.name,
            email: response.data.email,
            username: response.data.username,
            surname: response.data.surname,
            phone: response.data.phone
        }));

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
      await axios.put(`${BASE_URL}/users/update/`, editedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prevState => ({
        ...prevState, // Mantiene el id y otros campos
        ...editedUser // Sobreescribe los campos editados
      }));
      setModalVisible(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando perfil', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };
  const handleChangePassword = async () => {
    try {
        setPasswordError(''); // Reiniciar el mensaje de error al intentar cambiar la contraseña

        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            setPasswordError("No tienes sesión iniciada.");
            return;
        }

        const response = await axios.post(
            `${BASE_URL}/users/change_password/`,
            { current_password: currentPassword, new_password: newPassword },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        Alert.alert("Éxito", "Contraseña actualizada correctamente.");

    } catch (error) {
        console.log("Error al cambiar contraseña:", error);

        if (axios.isAxiosError(error) && error.response) {  
            console.log("Detalles del error:", error.response);

            if (error.response.status === 401) {
                setPasswordError("❌ La contraseña actual es incorrecta.");
            } else {
                setPasswordError("⚠️ No se pudo cambiar la contraseña. Inténtalo de nuevo.");
            }
        } else {
            setPasswordError("🚫 No se pudo conectar con el servidor.");
        }
    }
  };

  const fetchPastReservations = async () => {
      try {
          const token = await AsyncStorage.getItem("accessToken");
          const userId = await AsyncStorage.getItem("userId");

          if (!token || !userId) {
              Alert.alert("Error", "No tienes sesión iniciada.");
              return;
          }

          // 📌 Obtener usuario_id desde la API
          const usuarioResponse = await axios.get(`${BASE_URL}/users/get-usuario-id/`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { user_id: userId }
          });

          const usuarioId = usuarioResponse.data.usuario_id;

          // 📌 Obtener las reservas con usuarioId
          const response = await axios.get<Reservation[]>(`${BASE_URL}/bookings/user_past_bookings/${usuarioId}/`, {
              headers: { Authorization: `Bearer ${token}` },
          });

          console.log("Reservas obtenidas:", response.data);

          if (Array.isArray(response.data)) {
              setReservations(response.data);
          } else {
              throw new Error("Formato de datos incorrecto");
          }

          setReservationsModalVisible(true);

      } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
              console.error('Error obteniendo el historial de reservas:', error.response?.data || error.message);
              Alert.alert("Error", error.response?.data?.message || "No se pudo obtener el historial de reservas.");
          } else {
              console.error("Error inesperado:", error);
              Alert.alert("Error", "Ocurrió un error inesperado.");
          }
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
    console.log("📌 handleDeleteAccount() ejecutándose..."); 

    // Elimina el Alert.alert y prueba con un console.log primero
    console.log("🛠️ Simulando alerta de confirmación...");
    
    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            console.error("❌ Token no encontrado");
            return;
        }

        console.log("📡 Enviando petición DELETE a la API...");

        const response = await axios.delete(`${BASE_URL}/users/delete/`	, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ Respuesta del servidor:", response.status);

        if (response.status === 204 || response.status === 200) {
            await AsyncStorage.clear();
            router.replace('/LoginScreen');
            console.log("✅ Redirigiendo a la pantalla de Login...");
        }
    } catch (error) {
        console.error("❌ Error al eliminar la cuenta:", error);
    }
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
        <TouchableOpacity style={styles.optionButton} onPress={() => setPasswordModalVisible(true)}>
          <Ionicons name="lock-closed" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Cambiar Contraseña</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={fetchPastReservations}>
          <Ionicons name="time" size={20} color="#004AAD" style={styles.icon} />
          <Text style={styles.optionText}>Historial de Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionButton, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.optionButton, styles.deleteButton]} 
            onPress={() => {
                console.log("🛠️ Botón de eliminar cuenta presionado."); // <-- Ver si se ejecuta
                handleDeleteAccount();
            }}
        >
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
      {/* Modal para cambiar contraseña */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

                  {/* Mostrar mensaje de error si existe */}
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
                      <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
                          <Text style={styles.modalButtonText}>Guardar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setPasswordModalVisible(false)}>
                          <Text style={styles.modalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
      {/* Modal para Historial de Reservas */}
      <Modal visible={reservationsModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Historial de Reservas</Text>

                  {reservations.length > 0 ? (
                      <ScrollView style={{ maxHeight: 300 }}>
                          {reservations.map((res, index) => (
                              <View key={index} style={styles.reservationItem}>
                                  <Text style={styles.reservationText}>📅 Fecha: {res.experience_date}</Text>
                                  <Text style={styles.reservationText}>🏠 Experiencia: {res.experience.title}</Text>
                                  <Text style={styles.reservationText}>💰 Total: {res.total_price}€</Text>
                              </View>
                          ))}
                      </ScrollView>
                  ) : (
                      <Text style={styles.noReservations}>No tienes reservas pasadas.</Text>
                  )}

                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setReservationsModalVisible(false)}>
                      <Text style={styles.modalButtonText}>Cerrar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reservationItem: {
      backgroundColor: '#ffffff',
      padding: 15,
      marginVertical: 8,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
      width: '90%',
      alignSelf: 'center',
      alignItems: 'center',
  },
  reservationDate: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#004AAD',
  },
  reservationExperience: {
      fontSize: 18,
      fontWeight: '600',
      marginVertical: 4,
      color: '#333',
  },
  reservationPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#27ae60',
  },
  noReservations: {
      textAlign: 'center',
      fontSize: 16,
      color: 'gray',
      marginTop: 10,
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
  errorText: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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