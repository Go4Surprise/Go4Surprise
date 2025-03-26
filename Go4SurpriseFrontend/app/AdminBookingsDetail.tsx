import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

type BookingDetail = {
    id: string;
    experience_date: string;
    participants: number;
    total_price: number;
    status: string;
    cancellable: boolean;
    experience: {
        name: string;
        location: string;
        duration: number;
        category: string;
        hint: string | null;
    };
};

const AdminBookingsDetail = () => {
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [experienceDate, setExperienceDate] = useState<string | null>(null);
    const [participants, setParticipants] = useState<number | null>(null);
    const [totalPrice, setTotalPrice] = useState<number | null>(null);
    const [experienceLocation, setExperienceLocation] = useState<string | null>(null);
    const [experienceDuration, setExperienceDuration] = useState<number | null>(null);
    const [experienceCategory, setExperienceCategory] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const router = useRouter();
    const { id } = useLocalSearchParams();

    useEffect(() => {
        fetchBookingDetail();
    }, []);

    const fetchBookingDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/bookings/admin/detail/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setBooking(response.data);
            setSelectedStatus(response.data.status);
            setExperienceDate(response.data.experience_date);
            setParticipants(response.data.participants);
            setTotalPrice(response.data.total_price);
            setExperienceLocation(response.data.experience.location);
            setExperienceDuration(response.data.experience.duration);
            setExperienceCategory(response.data.experience.category);
            setHint(response.data.experience.hint || '');
        } catch (error) {
            setError('Error al cargar los detalles de la reserva. Por favor, inténtalo de nuevo.');
            console.error('Error fetching booking detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async () => {
        if (!selectedStatus || !experienceDate || !participants || !totalPrice) {
            Alert.alert('Error', 'Por favor asegúrate de completar todos los campos.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('accessToken');
            await axios.put(
                `${BASE_URL}/bookings/admin/update/${id}/`,
                {
                    status: selectedStatus,
                    hint: hint || "", // Enviar el hint vacío si no se ha ingresado nada
                    experience_date: experienceDate,
                    participants: participants,
                    total_price: totalPrice,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            router.push({
                pathname: '/AdminBookingsPanel',
                params: { successMessage: 'La reserva se ha actualizado correctamente.' },
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado de la reserva.');
            console.error('Error updating booking status:', error);
        }
    };

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#1877F2" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Detalle de la Reserva</Text>
            {booking && (
                <View style={styles.card}>
                    <Text style={styles.label}><Ionicons name="calendar" size={16} color="#1877F2" /> Fecha:</Text>
                    <TextInput
                        style={styles.input}
                        value={experienceDate ?? ''}
                        onChangeText={setExperienceDate}
                        placeholder="Ingrese la fecha de la experiencia"
                    />
                    <Text style={styles.label}><Ionicons name="people" size={16} color="#1877F2" /> Participantes:</Text>
                    <TextInput
                        style={styles.input}
                        value={participants?.toString() ?? ''}
                        onChangeText={(text) => setParticipants(Number(text))}
                        keyboardType="numeric"
                        placeholder="Número de participantes"
                    />
                    <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Precio Total:</Text>
                    <TextInput
                        style={styles.input}
                        value={totalPrice?.toString() ?? ''}
                        onChangeText={(text) => setTotalPrice(Number(text))}
                        keyboardType="numeric"
                        placeholder="Precio total"
                    />
                    <View style={styles.row}>
                        <Text style={styles.label}><Ionicons name="information-circle" size={16} color="#1877F2" /> Estado Actual:</Text>
                        <Picker
                            selectedValue={selectedStatus || booking.status}
                            onValueChange={(itemValue) => {
                                setSelectedStatus(itemValue);
                            }}
                            style={styles.inlinePicker}
                        >
                            <Picker.Item label="Pendiente" value="PENDING" />
                            <Picker.Item label="Confirmada" value="CONFIRMED" />
                            <Picker.Item label="Cancelada" value="CANCELLED" />
                        </Picker>
                    </View>

                    <Text style={styles.label}><Ionicons name="location" size={16} color="#1877F2" /> Ubicación: {experienceLocation}</Text>
                    <Text style={styles.label}><Ionicons name="time" size={16} color="#1877F2" /> Duración: {experienceDuration} minutos</Text>
                    <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Categoría: {experienceCategory}</Text>
                    
                    <Text style={styles.label}><Ionicons name="bulb" size={16} color="#1877F2" /> Pista:</Text>
                    <TextInput
                        style={styles.input}
                        value={hint ?? ''}
                        onChangeText={setHint}
                        placeholder="Ingrese una pista para la experiencia..."
                    />

                    {/* Botón para actualizar */}
                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={updateBookingStatus}
                    >
                        <Text style={styles.updateButtonText}>Actualizar Reserva</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1877F2',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 1,
        borderColor: '#ddd',
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
        color: '#333',
    },
    picker: {
        marginTop: 10,
        marginBottom: 20,
        height: 50,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    updateButton: {
        backgroundColor: '#1877F2',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    updateButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    inlinePicker: {
        flex: 1,
        height: 40,
        marginLeft: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: 'white',
    },
});

export default AdminBookingsDetail;
