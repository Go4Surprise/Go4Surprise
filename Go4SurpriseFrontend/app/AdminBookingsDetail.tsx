import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

type HorarioPreferencia = "MORNING" | "AFTERNOON" | "NIGHT";
type Categoria = "ADVENTURE" | "CULTURE" | "SPORTS" | "GASTRONOMY" | "NIGHTLIFE" | "MUSIC";

const horarioPreferenciaMap: Record<HorarioPreferencia, string> = {
    MORNING: "Mañana",
    AFTERNOON: "Tarde",
    NIGHT: "Noche",
};

const categoriasMap: Record<Categoria, string> = {
    ADVENTURE: "Aventura",
    CULTURE: "Cultura",
    SPORTS: "Deporte",
    GASTRONOMY: "Gastronomía",
    NIGHTLIFE: "Ocio nocturno",
    MUSIC: "Música",
};

const translateHorario = (horario: HorarioPreferencia | null): string =>
    horario ? horarioPreferenciaMap[horario] || horario : "Sin preferencia";

const translateCategoria = (categoria: Categoria | null): string =>
    categoria ? categoriasMap[categoria] || categoria : "Sin categoría";

interface BookingDetail {
    id: string;
    experience_date: string;
    booking_date: string;
    participants: number;
    total_price: number;
    status: string;
    cancellable: boolean;
    experience: {
        name: string;
        location: string;
        time_preference: string;
        categories: string[];
        hint: string | null;
        price: number;
        title: string;
        description: string;
        link: string;
        notas_adicionales: string;
    };
}

const AdminBookingsDetail = () => {
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [experienceDate, setExperienceDate] = useState<string | null>(null);
    const [participants, setParticipants] = useState<number | null>(null);
    const [totalPrice, setTotalPrice] = useState<number | null>(null);
    const [experienceLocation, setExperienceLocation] = useState<string | null>(null);
    const [experienceHorario, setExperienceHorario] = useState<string | null>(null);
    const [experienceCategories, setExperienceCategories] = useState<string[]>([]);
    const [experiencePrice, setExperiencePrice] = useState<number | null>(null);
    const [experienceTitle, setExperienceTitle] = useState<string | null>(null);
    const [experienceDescription, setExperienceDescription] = useState<string | null>(null);
    const [experienceLink, setExperienceLink] = useState<string | null>(null);
    const [experienceNotasAdicionales, setExperienceNotasAdicionales] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [bookingDate, setBookingDate] = useState<string | null>(null);

    const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
    const router = useRouter();
    const { id } = useLocalSearchParams();

    useEffect(() => {
        void fetchBookingDetail();
    }, []);

    const fetchBookingDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen');
                return;
            }

            const response = await axios.get(`${BASE_URL}/bookings/admin/detail/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = response.data;
            setBooking(data);
            setSelectedStatus(data.status);
            setExperienceDate(data.experience_date);
            setParticipants(data.participants);
            setTotalPrice(data.total_price);
            setExperienceLocation(data.experience?.location || '');
            setExperienceHorario(data.experience?.time_preference || null);
            setExperienceCategories(data.experience?.categories || []);
            setHint(data.experience?.hint || '');
            setExperiencePrice(data.experience?.price || null);
            setSelectedExperienceId(data.experience?.id || null);
            setExperienceTitle(data.experience?.title || '');
            setExperienceDescription(data.experience?.description || '');
            setExperienceLink(data.experience?.link || '');
            setExperienceNotasAdicionales(data.experience?.notas_adicionales || '');
            setBookingDate(data.booking_date);
        } catch (error: any) {
            if (error.response?.status === 401) {
                Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen');
            } else {
                setError('Error al cargar los detalles de la reserva. Por favor, inténtalo de nuevo.');
            }
            console.error('Error fetching booking detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async () => {
        if (!selectedStatus || !experienceDate || !participants || !totalPrice || !selectedExperienceId) {
            Alert.alert('Error', 'Por favor asegúrate de completar todos los campos.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen');
                return;
            }

            await axios.put(
                `${BASE_URL}/bookings/admin/update/${id}/`,
                {
                    status: selectedStatus,
                    experience: {
                        id: selectedExperienceId,
                        location: experienceLocation,
                        time_preference: experienceHorario,
                        categories: experienceCategories,
                        hint: hint ?? "",
                        price: experiencePrice,
                        title: experienceTitle,
                        description: experienceDescription,
                        link: experienceLink,
                        notas_adicionales: experienceNotasAdicionales,
                    },
                    experience_date: experienceDate,
                    participants: participants,
                    total_price: totalPrice,
                    booking_date: bookingDate
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
        } catch (error: any) {
            if (error.response?.status === 401) {
                Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen');
            } else {
                Alert.alert('Error', 'No se pudo actualizar la reserva.');
            }
            console.error('Error al actualizar la reserva:', error);
        }
    };

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#1877F2" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.push('/AdminBookingsPanel')}>
                    <Ionicons name="arrow-back" size={24} color="#1877F2" />
                </TouchableOpacity>
                <Text style={styles.title}>Detalle de la Reserva</Text>
            </View>
            {booking && (
                <View style={styles.card}>
                    <Text style={styles.label}><Ionicons name="calendar" size={16} color="#1877F2" /> Fecha de la experiencia:</Text>
                    <TextInput
                        style={styles.input}
                        value={experienceDate ?? ''}
                        onChangeText={setExperienceDate}
                        placeholder="YYYY-MM-DD"
                    />
                    <Text style={styles.label}><Ionicons name="calendar" size={16} color="#1877F2" /> Fecha de Reserva:</Text>
                    <TextInput
                        style={styles.input}
                        value={bookingDate ?? ''}
                        onChangeText={setBookingDate}
                        placeholder="YYYY-MM-DD"
                    />
                    <Text style={styles.label}><Ionicons name="people" size={16} color="#1877F2" /> Participantes: {participants}</Text>
                    <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Precio Total: {totalPrice?.toString() ?? ''} €</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}><Ionicons name="information-circle" size={16} color="#1877F2" /> Estado Actual:</Text>
                        <Picker
                            selectedValue={selectedStatus ?? booking.status}
                            onValueChange={(itemValue) => { setSelectedStatus(itemValue); }}
                            style={[styles.transparentPicker, styles.widePicker]}
                        >
                            <Picker.Item label="Pendiente" value="PENDING" />
                            <Picker.Item label="Confirmada" value="CONFIRMED" />
                            <Picker.Item label="Cancelada" value="CANCELLED" />
                        </Picker>
                    </View>
                    <Text style={styles.label}><Ionicons name="location" size={16} color="#1877F2" /> Ubicación: {experienceLocation}</Text>
                    <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Precio de experiencia: {experiencePrice}</Text>
                    <Text style={styles.label}>
                        <Ionicons name="time" size={16} color="#1877F2" /> Horario Preferencia: {experienceHorario ? translateHorario(experienceHorario as HorarioPreferencia) : "Sin preferencia"}
                    </Text>
                    <Text style={styles.label}>
                        <Ionicons name="pricetag" size={16} color="#1877F2" /> Categorías descartadas: {experienceCategories.length > 0 ? experienceCategories.map(cat => translateCategoria(cat as Categoria)).join(', ') : "Ninguna"}
                    </Text>
                    <Text style={styles.label}><Ionicons name="text" size={16} color="#1877F2" /> Notas adicionales: {experienceNotasAdicionales ? experienceNotasAdicionales : "Sin notas adicionales"}</Text>
                    <Text style={styles.label}><Ionicons name="information-circle" size={16} color="#1877F2" /> Título: </Text>
                    <TextInput
                        style={styles.input}
                        value={experienceTitle ?? ''}
                        onChangeText={setExperienceTitle}
                        placeholder="Ingrese el título de la experiencia..."
                    />
                    <Text style={styles.label}><Ionicons name="information-circle" size={16} color="#1877F2" /> Descripción:</Text>
                    <TextInput
                        style={styles.input}
                        value={experienceDescription ?? ''}
                        onChangeText={setExperienceDescription}
                        placeholder="Ingrese la descripción de la experiencia..."
                    />
                    <Text style={styles.label}><Ionicons name="link" size={16} color="#1877F2" /> Link: </Text>
                    <TextInput
                        style={styles.input}
                        value={experienceLink ?? ''}
                        onChangeText={setExperienceLink}
                        placeholder="Ingrese el link de la experiencia..."
                    />
                    <Text style={styles.label}><Ionicons name="bulb" size={16} color="#1877F2" /> Pista:</Text>
                    <TextInput
                        style={styles.input}
                        value={hint ?? ''}
                        onChangeText={setHint}
                        placeholder="Ingrese una pista para la experiencia..."
                    />
                    <TouchableOpacity
                        style={[styles.updateButton, styles.updateButtonSpacing]}
                        onPress={() => { void updateBookingStatus() }}
                    >
                        <Text style={styles.updateButtonText}>Actualizar Reserva</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
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
        width: '100%',
        maxWidth: 1200,
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
        padding: 8,
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
        width: '100%',
    },
    updateButtonSpacing: {
        marginTop: 8,
    },
    transparentPicker: {
        height: 40,
        backgroundColor: 'white',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    widePicker: {
        flex: 1,
        marginLeft: 15,
    },
    backButton: {
        marginRight: 5,
        padding: 5, // Add padding to make it easier to tap
    },
});

export default AdminBookingsDetail;
