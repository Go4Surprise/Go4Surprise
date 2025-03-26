import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '../constants/apiUrl';
import { useLocalSearchParams } from "expo-router";

const BookingDetailsScreen = () => {
  const { bookingId } = useLocalSearchParams();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("accessToken");
        setToken(storedToken);
      } catch (error) {
        console.error("Error obteniendo el token:", error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!bookingId) return; // No ejecutar si `bookingId` aún es null

    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/bookings/obtener-reserva/${bookingId}/`);
        setBookingDetails(response.data);
        console.log("Detalles de la reserva:", response.data);
      } catch (error) {
        console.error("Error al obtener la reserva:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]); // Se ejecuta solo cuando `bookingId` cambia y no es null

  const handlePayment = async () => {
    if (!bookingDetails?.id) {
      console.error("No hay un ID de reserva válido para procesar el pago.");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/bookings/iniciar-pago/${bookingDetails.id}/`);
      const { checkout_url } = response.data;
  
      if (checkout_url) {
        window.location.href = checkout_url; // Abre la URL de Stripe en el navegador
      } else {
        console.error("No se recibió una URL de pago.");
      }
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    }
  };

  if (loading || !bookingDetails) {
    return <ActivityIndicator size="large" color="#6772E5" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.detailsBox}>
        <Text style={styles.title}>Detalles de la Reserva</Text>

        <View style={styles.detailContainer}>
          <Ionicons name="location-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.location}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="calendar-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.experience_date}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="people-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.participants} personas</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="cash-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.total_price}€</Text>
        </View>

        {bookingDetails.status === "PENDING" && (
          <TouchableOpacity style={styles.button} onPress={handlePayment}>
            <Text style={styles.buttonText}>Proceder al pago</Text>
            <Ionicons name="arrow-forward-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4", alignItems: "center" },
  detailsBox: {
    width: "90%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center", color: "#333" },
  detailContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  detailText: { fontSize: 16, marginLeft: 10, color: "#555" },
  button: { marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#6772E5", padding: 15, borderRadius: 10 },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginRight: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default BookingDetailsScreen;
