import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isBefore, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BASE_URL } from '../constants/apiUrl';

interface Reserva {
  id: string;
  booking_date: string;
  experience_date: string;
  participants: number;
  price: number;
  status: string;
  total_price: number;
  cancellable: boolean;
  time_preference: string;
  city: string;
  experience_hint: string;
}

const MyBookings = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    void fetchReservas();
    fadeIn();
  }, []);

  const fetchReservas = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const usuarioId = await AsyncStorage.getItem("id"); // ✅ UUID del modelo Usuario

      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }
      
      const response = await axios.get(`${BASE_URL}/bookings/users/${usuarioId}/`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      console.log("Datos de la API:", response.data); // Agregado para depuración

      if (Array.isArray(response.data)) {
        const sorted = response.data
          .map(item => ({
            ...item,
            experience_date: new Date(item.experience_date),
            time_preference: item.experience.time_preference,
            city: item.experience.location,
          }))
          .filter(item => item.experience_date >= new Date())
          .sort((a, b) => a.experience_date.getTime() - b.experience_date.getTime());
        setReservas(sorted);
      } else {
        throw new Error("Formato de datos incorrecto");
      }
    } catch (error) {
      console.error("Error al obtener las reservas:", error); // Agregado para depuración
      setError("Error al obtener las reservas");
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const cancelarReserva = async () => {
    if (!selectedBookingId) return;

    try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
            router.push("/LoginScreen");
            return;
        }

        console.log(`Enviando solicitud para actualizar reserva con ID: ${selectedBookingId}`); // Debugging log
        const response = await axios.put(`${BASE_URL}/bookings/cancel/${selectedBookingId}/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
      });

        if (response.status === 200) {
            console.log("Booking updated successfully:", response.data); // Debugging log
            Alert.alert("Reserva cancelada", "La reserva ha sido cancelada exitosamente.");
            setReservas((prevReservas) =>
                prevReservas.map((reserva) =>
                    reserva.id === selectedBookingId ? { ...reserva, status: "cancelled" } : reserva
                )
            );
        }
    } catch (error) {
        console.error("Error al actualizar la reserva:", error); // Debugging log
        Alert.alert("Error", "No se pudo cancelar la reserva. Inténtalo de nuevo.");
    } finally {
        setModalVisible(false);
    }
};

const renderItem = ({ item }: { item: Reserva }) => {
  const timePreferenceMap: { [key: string]: string } = {
    MORNING: "Mañana",
    AFTERNOON: "Tarde",
    NIGHT: "Noche",
  };

      {item.experience_hint && (  // Solo mostramos la pista si existe
        <Text style={styles.label}>
          <Ionicons name="bulb" size={16} color="#FF9900" /> {" "}
          <Text style={styles.bold}>Pista de la experiencia:</Text> {item.experience_hint}
        </Text>
      
      )}

  const isCancelled = item.status === "cancelled";
  const isConfirmed = item.status === "CONFIRMED";

  return (
    
    <View
      style={[
        styles.card,
        isCancelled && styles.cancelledCard, // Apply red tone and reduced opacity for canceled bookings
        isConfirmed && styles.confirmedCard, // Apply green tone and reduced opacity for confirmed bookings
      ]}
    >
      <Text style={styles.label}>
        <Ionicons name="calendar" size={16} color="#1877F2" />{" "}
        <Text style={styles.bold}>Fecha Experiencia:</Text>{" "}
        {format(new Date(item.experience_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
      </Text>

      <Text style={styles.label}>
        <Ionicons name="people" size={16} color="#1877F2" />{" "}
        <Text style={styles.bold}>Participantes:</Text> {item.participants}
      </Text>

      <Text style={styles.label}>
        <Ionicons name="pricetag" size={16} color="#1877F2" />{" "}
        <Text style={styles.bold}>Precio Total:</Text> {item.total_price}€
      </Text>

      <Text style={styles.label}>
        <Ionicons name="time" size={16} color="#1877F2" />{" "}
        <Text style={styles.bold}>Preferencia Horaria:</Text>{" "}
        {timePreferenceMap[item.time_preference] || item.time_preference}
      </Text>

      <Text style={styles.label}>
        <Ionicons name="location" size={16} color="#1877F2" />{" "}
        <Text style={styles.bold}>Ciudad:</Text> {item.city}
      </Text>

      {!isCancelled && item.cancellable && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setSelectedBookingId(item.id);
            setModalVisible(true);
          }}
        >
          <Ionicons name="close-circle" size={16} color="white" />
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {isBefore(
        item.experience_date instanceof Date ? item.experience_date : parseISO(item.experience_date),
        new Date()
      ) && (
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => {
            console.log("Dejar reseña", item.id);
          }}
        >
          <Ionicons name="star" size={16} color="white" />
          <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#1877F2" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.push("/HomeScreen")}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Mis Reservas</Text>

      <FlatList
        data={reservas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.noReservationsText}>Todavía no tienes ninguna reserva.</Text>}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Reserva</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres cancelar esta reserva?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={cancelarReserva}
              >
                <Text style={styles.modalConfirmButtonText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1877F2",
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    color: "#D9534F",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  noReservationsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#ddd",
   
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  bold: {
    fontWeight: "bold",
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    textAlign: "center",
    color: "white",
    marginTop: 8,
  },
  statusConfirmed: {
    backgroundColor: "#28a745",
  },
  statusCancelled: {
    backgroundColor: "#dc3545",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "white",
    marginLeft: 5,
  },
  reviewButton: {
    backgroundColor: "#f39c12",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  reviewButtonText: {
    color: "white",
    marginLeft: 5,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 1,
  },
  cancelledCard: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb", 
    opacity: 0.8, 
  },
  confirmedCard: {
    backgroundColor: "#d4edda", // Light green background
    borderColor: "#c3e6cb", 
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#d3d3d3",
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default MyBookings;
