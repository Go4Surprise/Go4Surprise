import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
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
        time_preference: string;
        categories: string[];
        hint: string | null;
        price: number;
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
    const [experienceHorario, setExperienceHorario] = useState<string | null>(null);
    const [experienceCategories, setExperienceCategories] = useState<string[]>([]);
    const [experiencePrice, setExperiencePrice] = useState<number | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    
    type Experience = {
        id: string;
        title: string;
    };

    const [experiences, setExperiences] = useState<Experience[]>([]); // Lista de experiencias
    const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null); // Experiencia seleccionada
    const router = useRouter();
    const { id } = useLocalSearchParams();

    useEffect(() => {
        fetchBookingDetail();
        fetchExperiences(); // Cargar experiencias disponibles
    }, []);

    const fetchBookingDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'No se encontró un token de autenticación. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen'); // Redirect to login if no token
                return;
            }

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
            setExperienceLocation(response.data.experience?.location || '');
            setExperienceHorario(response.data.experience?.time_preference || null);
            setExperienceCategories(response.data.experience?.categories || []);
            setHint(response.data.experience?.hint || '');
            setExperiencePrice(response.data.experience?.price || null);
            setSelectedExperienceId(response.data.experience?.id || null); // Ensure experience ID is set
        } catch (error: any) {
            if (error.response?.status === 401) {
                Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen'); // Redirect to login on 401
            } else {
                setError('Error al cargar los detalles de la reserva. Por favor, inténtalo de nuevo.');
            }
            console.error('Error fetching booking detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExperiences = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/experiences/list/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setExperiences(response.data);
        } catch (error) {
            console.error('Error fetching experiences:', error);
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
                router.replace('/LoginScreen'); // Redirect to login if no token
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
                        hint: hint || "",
                        price: experiencePrice
                    },
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
        } catch (error: any) {
            if (error.response?.status === 401) {
                Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                router.replace('/LoginScreen'); // Redirect to login on 401
            } else {
                Alert.alert('Error', 'No se pudo actualizar la reserva.');
            }
            console.error('Error al actualizar la reserva:', error);
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
                            style={[styles.transparentPicker, styles.widePicker]} // Aplicar estilos actualizados
                        >
                            <Picker.Item label="Pendiente" value="PENDING" />
                            <Picker.Item label="Confirmada" value="CONFIRMED" />
                            <Picker.Item label="Cancelada" value="cancelled" />
                        </Picker>
                    </View>

                    {/* Mover el desplegable de experiencias al lado del título */}
                    <View style={styles.row}>
                        <Text style={styles.label}><Ionicons name="briefcase" size={16} color="#1877F2" /> Experiencia:</Text>
                        <Picker
                            selectedValue={selectedExperienceId}
                            onValueChange={(itemValue) => setSelectedExperienceId(itemValue)}
                            style={[styles.transparentPicker, styles.widePicker]} // Aplicar estilos actualizados
                        >
                            {experiences.map((exp) => (
                                <Picker.Item key={exp.id} label={exp.title} value={exp.id} />
                            ))}
                        </Picker>
                        
                    </View>

                    

                    <Text style={styles.label}><Ionicons name="location" size={16} color="#1877F2" /> Ubicación: {experienceLocation}</Text>
                    <Text style={styles.label}><Ionicons name="pricetag" size={16} color="#1877F2" /> Precio de experiencia: {experiencePrice}</Text>
                    <Text style={styles.label}>
                        <Ionicons name="time" size={16} color="#1877F2" /> 
                        Horario Preferencia: {experienceHorario ? translateHorario(experienceHorario as HorarioPreferencia) : "Sin preferencia"}
                    </Text>
                    <Text style={styles.label}>
                        <Ionicons name="pricetag" size={16} color="#1877F2" /> 
                        Categorías descartadas: {experienceCategories.length > 0 ? experienceCategories.map(cat => translateCategoria(cat as Categoria)).join(', ') : "Ninguna"}
                    </Text>

                    <Text style={styles.label}><Ionicons name="bulb" size={16} color="#1877F2" /> Pista:</Text>
                    <TextInput
                        style={styles.input}
                        value={hint ?? ''}
                        onChangeText={setHint}
                        placeholder="Ingrese una pista para la experiencia..."
                    />

                    {/* Botón para actualizar con más espacio */}
                    <TouchableOpacity
                        style={[styles.updateButton, styles.updateButtonSpacing]}
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
    updateButtonSpacing: {
        marginTop: 20, // Agregar espacio adicional entre el botón y las propiedades
    },
    transparentPicker: {
        height: 40,
        backgroundColor: 'white', // Fondo blanco como los inputs
        borderColor: '#ddd', // Borde gris claro
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    widePicker: {
        flex: 1, // Hacer que el Picker ocupe más espacio horizontal
        marginLeft: 15, // Agregar espacio entre el título y el Picker
    },
});

export default AdminBookingsDetail;
