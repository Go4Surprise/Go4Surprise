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
  ScrollView,
  LayoutAnimation,
  Platform,
  Linking
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BASE_URL } from '../constants/apiUrl';
import * as Calendar from 'expo-calendar';


interface Reserva {
  id: string;
  booking_date: Date;
  experience_date: Date;
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
  const [selectedTab, setSelectedTab] = useState("activas");

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
            booking_date: new Date(item.booking_date),
            time_preference: item.experience.time_preference,
            city: item.experience.location,
          }))
          .sort((a, b) => a.experience_date.getTime() - b.experience_date.getTime());
        setReservas(sorted);
        console.log("Reservas ordenadas:", sorted); // Agregado para depuración
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

  const isCancellable = (reserva: Reserva) => {
    const currentDate = new Date();
    const booking_date = new Date(reserva.booking_date);
    const now_date = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000);
    const timeDifference = now_date.getTime() - booking_date.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    // La reserva es cancelable si la fecha de la experiencia es más de 24 horas en el futuro
    return hoursDifference < 24;
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

      console.log(`Sending request to update booking with ID: ${selectedBookingId}`); // Debugging log
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

  const reservasFiltradas = reservas.filter((item) => {
    const fecha = new Date(item.experience_date);
    const ahora = new Date();

    if (selectedTab === "activas") {
      return item.status !== "cancelled" && fecha >= ahora;
    } else if (selectedTab === "pasadas") {
      return item.status !== "cancelled" && fecha < ahora;
    } else if (selectedTab === "canceladas") {
      return item.status === "cancelled";
    }

    return false;
  });

  const openGoogleCalendar = (item: Reserva) => {
    const startDate = new Date(item.experience_date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2h

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Go4Surprise&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=Reserva+sorpresa+en+${item.city}&location=${item.city}`;

    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: Reserva }) => {
    const timePreferenceMap: { [key: string]: string } = {
      MORNING: "Mañana",
      AFTERNOON: "Tarde",
      EVENING: "Noche",
    };

    {
      item.experience_hint && (  // Solo mostramos la pista si existe
        <Text style={styles.label}>
          <Ionicons name="bulb" size={16} color="#FF9900" /> {" "}
          <Text style={styles.bold}>Pista:</Text> {item.experience_hint}
        </Text>

      )
    }

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
          <Text style={styles.bold}>Fecha de Experiencia:</Text>{" "}
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

        {!isCancelled && isCancellable(item) && (
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

        {!isCancelled && isAfter(new Date(item.experience_date), new Date()) && (
          <View style={styles.calendarButtonsContainer}>
            <TouchableOpacity
              style={styles.googleCalendarButton}
              onPress={() => openGoogleCalendar(item)}
            >
              <Ionicons name="logo-google" size={16} color="white" />
              <Text style={styles.buttonText}>Añadir a Google Calendar</Text>
            </TouchableOpacity>
          </View>
        )}

        {isBefore(new Date(item.experience_date), new Date()) && !isCancelled
          && (
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
    <Animated.View style={[styles.container]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.push("/HomeScreen")}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Mis Reservas</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "activas" && styles.tabButtonActive]}
          onPress={() => setSelectedTab("activas")}
        >
          <Text style={[styles.tabText, selectedTab === "activas" && styles.tabTextActive]}>Activas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "pasadas" && styles.tabButtonActive]}
          onPress={() => setSelectedTab("pasadas")}
        >
          <Text style={[styles.tabText, selectedTab === "pasadas" && styles.tabTextActive]}>Pasadas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "canceladas" && styles.tabButtonActive]}
          onPress={() => setSelectedTab("canceladas")}
        >
          <Text style={[styles.tabText, selectedTab === "canceladas" && styles.tabTextActive]}>Canceladas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reservasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.noReservationsText}>
            {selectedTab === "activas"
              ? "No tienes reservas activas."
              : selectedTab === "pasadas"
                ? "No tienes reservas pasadas."
                : "No tienes reservas canceladas."}
          </Text>
        }
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
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
    color: "#1e1e1e",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollViewContainer: {
    paddingBottom: 20, // Espacio extra en la parte inferior para el desplazamiento
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 10,
  },

  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  tabButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  tabText: {
    color: '#333',
    fontWeight: '600',
  },

  tabTextActive: {
    color: '#fff',
  },
  calendarButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 8,
    borderRadius: 8,
  },

  calendarButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "bold",
  },
  calendarButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },

  googleCalendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF', // rojo Google
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  appleCalendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000', // negro Apple
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#e63946",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  noReservationsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  card: {
    backgroundColor: "#fefefe",
    padding: 18,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  label: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "600",
    color: "#222",
  },
  status: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 12,
    fontSize: 14,
    alignSelf: "flex-start",
  },
  statusConfirmed: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusCancelled: {
    backgroundColor: "#fdecea",
    color: "#b02a37",
  },
  cancelButton: {
    backgroundColor: "#e63946",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  reviewButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  reviewButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 20,
    zIndex: 2,
  },
  cancelledCard: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffcccc",
    opacity: 0.9,
  },
  confirmedCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#c6f6d5",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e1e1e",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#e63946",
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
});


export default MyBookings;
