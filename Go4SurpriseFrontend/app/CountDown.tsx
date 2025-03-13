import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { differenceInDays, parseISO } from "date-fns";

export default function CountDown() {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    useEffect(() => {
        fetchNextBooking();
    }, []);

    const fetchNextBooking = async () => {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            const userId = await AsyncStorage.getItem("userId");

            if (!token || !userId) return;

            const usuarioResponse = await axios.get(`http://localhost:8000/users/get-usuario-id/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { user_id: userId },
            });

            const usuarioId = usuarioResponse.data.usuario_id;

            const response = await axios.get(`http://localhost:8000/bookings/users/${usuarioId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (Array.isArray(response.data)) {
                const upcomingBookings = response.data
                    .map((booking: any) => ({
                        ...booking,
                        experience_date: parseISO(booking.experience_date),
                    }))
                    .filter((booking: any) => booking.experience_date > new Date())
                    .sort((a: any, b: any) => a.experience_date - b.experience_date);

                if (upcomingBookings.length > 0) {
                    const nextBooking = upcomingBookings[0];
                    const daysRemaining = differenceInDays(nextBooking.experience_date, new Date());
                    setDaysLeft(daysRemaining);
                } else {
                    setDaysLeft(null);
                }
            }
        } catch (error) {
            console.error("Error al obtener la próxima reserva:", error);
        }
    };

    if (daysLeft === null) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Quedan</Text>
            <Text style={styles.daysNumber}>{daysLeft}</Text>
            <Text style={styles.text}>días para tu próxima experiencia</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
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
        maxWidth: 300,  // 🔹 Máximo 300px de ancho
        alignSelf: "center", // 🔹 Centrado automáticamente
    },
    daysNumber: {
        fontSize: 75,
        fontWeight: "bold",
        color: "#004AAD",
    },
    text: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
    },
});
