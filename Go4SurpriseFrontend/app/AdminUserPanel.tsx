import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, Alert, useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';
import { Ionicons } from '@expo/vector-icons';

interface User {
    id: number;
    username: string;
    email: string;
    is_superuser: boolean;
    is_staff: boolean;
    date_joined: string;
    first_name: string;
    last_name: string;
};

export default function AdminPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        void checkAdminStatus();
        void fetchUsers();
    }, []);

    const checkAdminStatus = async () => {
        const isAdmin = await AsyncStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            Alert.alert('Acceso denegado', 'No tienes permisos para acceder a esta sección.');
            router.replace('/HomeScreen');
        }
    };

    const fetchUsers = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/users/admin/list/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            setError('Error al cargar los usuarios');
            setLoading(false);
            console.error('Error al cargar los usuarios:', error);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('id');
        await AsyncStorage.removeItem('isAdmin');
        router.replace('/LoginScreen');
    };

    const viewUserDetails = (userId: number) => {
        router.push(`/UserDetails/${userId}`);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1877F2" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.button} onPress={() => void fetchUsers()}>
                    <Text style={styles.buttonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.dashboardButton} onPress={() => router.push('/AdminPanel')}>
                        <Ionicons name="grid-outline" size={24} color="#1877F2" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutButton} onPress={() => void handleLogout()}>
                        <Text style={styles.buttonText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
                    <Text style={styles.title}>Gestión de Usuarios</Text>

                <View style={styles.card}>
                    <Text style={styles.subtitle}>Lista de usuarios</Text>
                    <View style={styles.listContainer}>
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.userItem}
                                    onPress={() => { viewUserDetails(item.id); }}
                                >
                                    <View style={styles.userInfo}>
                                        <Text style={styles.username}>{item.username}</Text>
                                        <Text>{item.email}</Text>
                                        <Text>
                                            {item.first_name} {item.last_name}
                                        </Text>
                                    </View>
                                    <View style={styles.userStatus}>
                                        {item.is_superuser && item.is_staff && (
                                            <Text style={styles.adminBadge}>Admin</Text>
                                        )}
                                        {item.is_staff && !item.is_superuser && (
                                            <Text style={styles.staffBadge}>Staff</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
    },
    contentDesktop: {
        alignSelf: 'center',
    },
    contentMobile: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1877F2',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    card: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: 10,
    },
    listContainer: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    userInfo: {
        flex: 1,
        paddingRight: 10,
    },
    userStatus: {
        flexDirection: 'row',
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    adminBadge: {
        backgroundColor: '#1877F2',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 16,
        fontWeight: 'bold',
    },
    staffBadge: {
        backgroundColor: '#42B72A',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        fontSize: 16,
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        backgroundColor: '#E4E6EB',
    },
    button: {
        backgroundColor: '#1877F2',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    logoutButton: {
        backgroundColor: '#E4144C',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
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
