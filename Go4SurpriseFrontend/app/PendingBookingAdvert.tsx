import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { differenceInDays, parseISO } from "date-fns";
import { BASE_URL } from '../constants/apiUrl';
import { router } from "expo-router";

interface Reserva {
    id: string;
    paid: boolean;
}

// Define a type for the processed booking with Date object


export default function PendingBookingAdvert() {
    const [unpaidBookings, setUnpaidBookings] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void fetchReservas();
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
                const bookings_unpaid = response.data
                    .filter(item => item.paid === false)
                setUnpaidBookings(bookings_unpaid);
                console.log("Reservas no pagadas:", unpaidBookings); // Agregado para depuración
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

    if (loading || unpaidBookings.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Tienes una reserva pendiente de pago
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push("/MyBookings")}>
                <Text style={styles.buttonText}>Pagar aquí</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff5f5",
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginVertical: 10,
        maxWidth: 300,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#ff4d4d",
        marginTop: 40,
    },
    text: {
        fontSize: 16,
        color: "#b30000",
        textAlign: "center",
        marginBottom: 15,
        fontWeight: "600",
    },
    button: {
        backgroundColor: "#ff4d4d",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});