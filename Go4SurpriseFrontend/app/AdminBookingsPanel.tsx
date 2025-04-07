import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, useWindowDimensions, Modal, Button
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';
import { Ionicons } from '@expo/vector-icons';

const estadoMap: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    cancelled: "Cancelada",
};

const translateEstado = (estado: string): string => estadoMap[estado] || estado;

type Booking = {
    id: string;
    experience_date: string;
    participants: number;
    total_price: number;
    status: string;
};

const AdminBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // New state for success message
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
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
            if (!token) {
                Alert.alert('Error', 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen'); // Redirect to login if no token
                return;
            }

            const response = await axios.get(`${BASE_URL}/bookings/admin/list/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const sortedBookings = response.data.sort((a: Booking, b: Booking) => 
                new Date(b.experience_date).getTime() - new Date(a.experience_date).getTime()
            );
            setBookings(sortedBookings);
        } catch (error: any) {
            if (error.response?.status === 401) {
                Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen'); // Redirect to login on 401
            } else {
                setError('Error al cargar las reservas. Por favor, inténtalo de nuevo.');
            }
            console.error('Error al obtener las reservas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        setModalVisible(true); // Show confirmation modal
    };

    const confirmDeleteBooking = async () => {
        if (selectedBookingId) {
            const success = await deleteBooking(selectedBookingId);
            if (success) {
                setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== selectedBookingId)); // Update state
                setSuccessMessage('La reserva se ha eliminado correctamente.');
                setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
            }
        }
        setModalVisible(false); // Hide modal
        setSelectedBookingId(null);
    };

    const deleteBooking = async (bookingId: string) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            await axios.delete(`${BASE_URL}/bookings/admin/delete/${bookingId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return true;
        } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar la reserva.');
            console.error('Error al eliminar la reserva:', error); // Log the error for debugging
            return false;
        }
    };

    const handleBookingPress = (bookingId: string) => {
        router.push(`/AdminBookingsDetail?id=${bookingId}`);
    };

    const renderItem = ({ item }: { item: Booking }) => {
        const isPastDate = new Date(item.experience_date) < new Date();
        const cardStyle = [
            styles.card,
            isPastDate ? styles.cardPastDate : null,
            item.status === 'cancelled' ? styles.cardCancelled : null,
            item.status === 'CONFIRMED' ? styles.cardConfirmed : null,
        ];
        const statusTextStyle = [
            styles.statusText,
            item.status === 'cancelled' ? styles.statusCancelled : null,
            item.status === 'CONFIRMED' ? styles.statusConfirmed : null,
        ];

        return (
            <TouchableOpacity onPress={() => handleBookingPress(item.id)}>
                <View style={cardStyle}>
                    <Text style={styles.label}><Ionicons name="calendar" size={16} color="#1877F2" /> Fecha: {item.experience_date}</Text>
                    <Text style={styles.label}><Ionicons name="people" size={16} color="#1877F2" /> Participantes: {item.participants}</Text>
                    <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Precio Total: {item.total_price}€</Text>
                    <Text style={statusTextStyle}>Estado: {translateEstado(item.status)}</Text>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteBooking(item.id)}>
                        <Ionicons name="trash" size={16} color="white" />
                        <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#1877F2" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.dashboardButton} onPress={() => router.push('/AdminPanel')}>
                    <Ionicons name="grid-outline" size={24} color="#1877F2" />
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>Gestión de Reservas</Text>
            {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.noBookingsText}>No hay reservas registradas.</Text>}
            />
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>¿Estás seguro de que quieres eliminar esta reserva?</Text>
                        <View style={styles.modalButtons}>
                            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="#6c757d" />
                            <Button title="Eliminar" onPress={confirmDeleteBooking} color="#dc3545" />
                        </View>
                    </View>
                </View>
            </Modal>
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
    cardPastDate: {
        backgroundColor: '#E0E0E0', // Light gray for past dates
        borderColor: '#B0B0B0', // Gray border for past dates
    },
    cardCancelled: {
        backgroundColor: '#FFE4E1', // Light red for canceled bookings
        borderColor: '#FF6B6B', // Red border for canceled bookings
    },
    cardConfirmed: {
        backgroundColor: '#DFF2BF', // Light green for confirmed bookings
        borderColor: '#4CAF50', // Dark green border for confirmed bookings
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
        color: '#333',
    },
    statusText: {
        fontSize: 16,
        marginBottom: 6,
        color: '#333',
    },
    statusCancelled: {
        color: '#FF6B6B', // Red text for canceled bookings
    },
    statusConfirmed: {
        color: '#4CAF50', // Green text for confirmed bookings
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
    noBookingsText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#777',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dashboardButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1877F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AdminBookings;