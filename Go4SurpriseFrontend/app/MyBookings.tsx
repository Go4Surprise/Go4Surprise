import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, ScrollView, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '../constants/apiUrl';

interface Reserva {
  id: string;
  booking_date: string;
  experience_date: string;
  participants: number;
  price: number;
  status: string;
  total_price: number;
}

const ReservasList = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchReservas();
    fadeIn();
  }, []);

  const fetchReservas = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        Alert.alert("Error", "Usuario no autenticado. Inicia sesión nuevamente.");
        return;
      }

      // Obtener el usuario_id desde la nueva API
      const usuarioResponse = await axios.get(`${BASE_URL}/users/get-usuario-id/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId }
      });

      const usuarioId = usuarioResponse.data.usuario_id;

      // Obtener las reservas usando el usuario_id
      const response = await axios.get(`${BASE_URL}/bookings/users/${usuarioId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        setReservas(response.data);
      } else {
        throw new Error("Formato de datos incorrecto");
      }
    } catch (error) {
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

  if (loading) return <Text style={styles.loadingText}>Cargando reservas...</Text>;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <Text style={styles.title}>MIS RESERVAS</Text>
      <ScrollView>
        {reservas.length === 0 ? (
          <Text style={styles.noReservationsText}>Todavía no tienes ninguna reserva.</Text>
        ) : (
          reservas.map((reserva) => (
            <View key={reserva.id} style={styles.card}>
              <Text style={styles.label}><Text style={styles.bold}>Fecha de Reserva:</Text> {reserva.booking_date}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Fecha de Experiencia:</Text> {reserva.experience_date}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Participantes:</Text> {reserva.participants}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Precio:</Text> ${reserva.price}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Estado:</Text> {reserva.status}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Precio Total:</Text> ${reserva.total_price}</Text>
            </View>
          ))
        )}
      </ScrollView>
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
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
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
    backgroundColor: "#007BFF",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
  },
  label: {
    color: "#fff",
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
});

export default ReservasList;