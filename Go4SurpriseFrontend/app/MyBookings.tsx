import React, { useEffect, useRef, useState } from "react";
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
  SafeAreaView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { BASE_URL } from "../constants/apiUrl";

interface Reserva {
  id: string;
  booking_date: string;
  experience_date: Date;
  participants: number;
  price: number;
  status: string;
  total_price: number;
  cancellable: boolean;
  time_preference: string;
  city: string;
  experience_hint?: string;
}

interface ItemWithHeader {
  type: "header" | "item";
  title?: string;
  data?: Reserva;
}

const MyBookings = () => {
  const [allItems, setAllItems] = useState<ItemWithHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scrollRef = useRef<FlatList<ItemWithHeader>>(null);
  const [pastSectionIndex, setPastSectionIndex] = useState<number | null>(null);
  const [futureSectionIndex, setFutureSectionIndex] = useState<number | null>(null);

  useEffect(() => {
    void fetchReservas();
    fadeIn();
  }, []);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fetchReservas = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const usuarioId = await AsyncStorage.getItem("id");

      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }

      const [response, pastBookings] = await Promise.all([
        axios.get(`${BASE_URL}/bookings/users/${usuarioId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/bookings/user_past_bookings/${usuarioId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const futuras = Array.isArray(response.data)
        ? response.data
            .map((item) => ({
              ...item,
              experience_date: new Date(item.experience_date),
              time_preference: item.experience.time_preference,
              city: item.experience.location,
              experience_hint: item.experience.hint,
            }))
            .filter((item) => item.experience_date >= new Date())
            .sort((a, b) => a.experience_date.getTime() - b.experience_date.getTime())
        : [];

      const pasadas = Array.isArray(pastBookings.data)
        ? pastBookings.data
            .map((item) => ({
              ...item,
              experience_date: new Date(item.experience_date),
              time_preference: item.experience.time_preference,
              city: item.experience.location,
              experience_hint: item.experience.hint,
            }))
            .sort((a, b) => b.experience_date.getTime() - a.experience_date.getTime())
        : [];

      const items: ItemWithHeader[] = [];

      const futureIndex = 0;
      items.push({ type: "header", title: "Próximas Reservas" });
      if (futuras.length === 0) {
        items.push({ type: "item", data: undefined, title: "No tienes próximas reservas." });
      } else {
        futuras.forEach((item) => items.push({ type: "item", data: item }));
      }      

      const pastStartIndex = items.length;
      items.push({ type: "header", title: "Reservas Pasadas" });
      if (pasadas.length === 0) {
        items.push({ type: "item", data: undefined, title: "No tienes reservas pasadas." });
      } else {
        pasadas.forEach((item) => items.push({ type: "item", data: item }));
      }

      setFutureSectionIndex(futureIndex);
      setPastSectionIndex(pastStartIndex);
      setAllItems(items);
    } catch (error) {
      console.error("Error al obtener las reservas:", error);
      setError("Error al obtener las reservas");
    } finally {
      setLoading(false);
    }
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

      const response = await axios.put(`${BASE_URL}/bookings/cancel/${selectedBookingId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        Alert.alert("Reserva cancelada", "La reserva ha sido cancelada exitosamente.");
        setAllItems((prevItems) =>
          prevItems.map((item) =>
            item.type === "item" && item.data?.id === selectedBookingId
              ? { ...item, data: { ...item.data, status: "cancelled" } }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error al cancelar la reserva:", error);
      Alert.alert("Error", "No se pudo cancelar la reserva. Inténtalo de nuevo.");
    } finally {
      setModalVisible(false);
    }
  };

  const renderItem = ({ item }: { item: ItemWithHeader }) => {
    if (item.type === "header") {
      return (
        <Text style={styles.sectionHeader}>{item.title}</Text>
      );
    }

    if (!item.data) {
      return (
        <Text style={styles.emptySectionText}>{item.title}</Text>
      );
    }    

    const reserva = item.data!;
    const isCancelled = reserva.status === "cancelled";
    const isConfirmed = reserva.status === "CONFIRMED";
    const timePreferenceMap: { [key: string]: string } = {
      MORNING: "Mañana",
      AFTERNOON: "Tarde",
      EVENING: "Noche",
    };

    return (
      <View
        style={[
          styles.card,
          isCancelled && styles.cancelledCard,
          isConfirmed && styles.confirmedCard,
        ]}
      >
        <Text style={styles.label}>
          <Ionicons name="calendar" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Fecha de Experiencia:</Text>{" "}
          {format(new Date(reserva.experience_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="people" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Participantes:</Text> {reserva.participants}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="pricetag" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Precio Total:</Text> ${reserva.total_price}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="time" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Preferencia Horaria:</Text>{" "}
          {timePreferenceMap[reserva.time_preference] || reserva.time_preference}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="location" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Ciudad:</Text> {reserva.city}
        </Text>

        {reserva.experience_hint && (
          <Text style={styles.label}>
            <Ionicons name="bulb" size={16} color="#FF9900" />{" "}
            <Text style={styles.bold}>Pista de la experiencia:</Text> {reserva.experience_hint}
          </Text>
        )}

        {!isCancelled && reserva.cancellable && !isBefore(reserva.experience_date, new Date()) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSelectedBookingId(reserva.id);
              setModalVisible(true);
            }}
          >
            <Ionicons name="close-circle" size={16} color="white" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        {isBefore(reserva.experience_date, new Date()) && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => {
              console.log("Dejar reseña", reserva.id);
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => router.push("/HomeScreen")}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => futureSectionIndex !== null && scrollRef.current?.scrollToIndex({ index: futureSectionIndex, animated: true })}
          >
            <Text style={styles.navButtonText}>Próximas Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => pastSectionIndex !== null && scrollRef.current?.scrollToIndex({ index: pastSectionIndex, animated: true })}
          >
            <Text style={styles.navButtonText}>Reservas Pasadas</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: 70 }]}>
        <FlatList
          ref={scrollRef}
          data={allItems}
          keyExtractor={(item, index) => `${item.type}-${item.title || item.data?.id}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.noReservationsText}>No tienes reservas.</Text>}
        />
      </Animated.View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
  },
  fixedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#1877F2",
    borderRadius: 6,
  },
  navButtonText: {
    color: "white",
    fontWeight: "bold",
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
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1877F2",
    marginBottom: 10,
    marginTop: 20,
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
  cancelledCard: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb", 
    opacity: 0.8, 
  },
  confirmedCard: {
    backgroundColor: "#d4edda", // Light green background
    borderColor: "#c3e6cb", 
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  bold: {
    fontWeight: "bold",
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
  emptySectionText: {
    fontSize: 16,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default MyBookings;