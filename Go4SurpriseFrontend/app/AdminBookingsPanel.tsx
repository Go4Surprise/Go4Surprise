import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, useWindowDimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';
import { Ionicons } from '@expo/vector-icons';

type Booking = {
    id: string;
    experience_date: string;
    participants: number;
    total_price: number;
};

const AdminBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // New state for success message
    const router = useRouter();
    const { width } = useWindowDimensions();
    const searchParams = useLocalSearchParams();
    const isMobile = width < 768;

    useEffect(() => {
        checkAdminStatus();
        fetchBookings();

        // Show the success message if passed in the navigation params
        if (searchParams.successMessage) {
            setSuccessMessage(searchParams.successMessage as string);
            setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
        }
    }, [searchParams.successMessage]); // Add dependency to re-trigger when params change

    const checkAdminStatus = async () => {
        const isAdmin = await AsyncStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            Alert.alert('Acceso denegado', 'No tienes permisos para acceder a esta sección.');
            router.replace('/HomeScreen');
        }
    };

    const fetchBookings = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/bookings/admin/list/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setBookings(response.data);
        } catch (error) {
            setError('Error al cargar las reservas. Por favor, inténtalo de nuevo.');
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = (bookingId: string) => {
        Alert.alert('Eliminar Reserva', '¿Estás seguro de que quieres eliminar esta reserva?', [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Eliminar', 
                onPress: async () => {
                    const success = await deleteBooking(bookingId);
                    if (success) {
                        setSuccessMessage('La reserva se ha eliminado correctamente.');
                        setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
                    }
                } 
            },
        ]);
    };

    const deleteBooking = async (bookingId: string) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            await axios.delete(`${BASE_URL}/bookings/admin/delete/${bookingId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchBookings();
            return true;
        } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar la reserva.');
            return false;
        }
    };

    const handleBookingPress = (bookingId: string) => {
        router.push(`/AdminBookingsDetail?id=${bookingId}`);
    };

    const renderItem = ({ item }: { item: Booking }) => (
        <TouchableOpacity onPress={() => handleBookingPress(item.id)}>
            <View style={styles.card}>
                <Text style={styles.label}><Ionicons name="calendar" size={16} color="#1877F2" /> Fecha: {item.experience_date}</Text>
                <Text style={styles.label}><Ionicons name="people" size={16} color="#1877F2" /> Participantes: {item.participants}</Text>
                <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Precio Total: ${item.total_price}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteBooking(item.id)}>
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#1877F2" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/AdminPanel')}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Gestión de Reservas</Text>
            {successMessage && <Text style={styles.successText}>{successMessage}</Text>} {/* Display success message */}
            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.noBookingsText}>No hay reservas registradas.</Text>}
            />
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
    successText: {
        color: 'green',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
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
    deleteButton: {
        backgroundColor: '#dc3545',
        padding: 8,
        borderRadius: 6,
        marginTop: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: 'white',
        marginLeft: 5,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    noBookingsText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#777',
    },
});

export default AdminBookings;