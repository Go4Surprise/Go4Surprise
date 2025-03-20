import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, 
    ActivityIndicator, Alert, useWindowDimensions, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPanel() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [adminName, setAdminName] = useState('Administrador');

    useEffect(() => {
        void checkAdminStatus();
        void loadAdminName();
    }, []);

    const checkAdminStatus = async () => {
        const isAdmin = await AsyncStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            Alert.alert('Acceso denegado', 'No tienes permisos para acceder a esta sección.');
            router.replace('/HomeScreen');
        } else {
            setLoading(false);
        }
    };

    const loadAdminName = async () => {
        // You could fetch the admin's name from storage or API if needed
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
            // For now, just setting a generic name. In a real app, you might fetch user info
            setAdminName('Administrador');
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

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1877F2" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity 
                            style={styles.homeButton}
                            onPress={() => router.push('/HomeScreen')}
                        >
                            <Ionicons name="home-outline" size={22} color="#1877F2" />
                            <Text style={styles.homeButtonText}>Inicio</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Panel de Administración</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.buttonText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.welcomeText}>Bienvenido, {adminName}</Text>

                <View style={styles.dashboardContainer}>
                    <Text style={styles.sectionTitle}>Gestión de la Plataforma</Text>
                    
                    <View style={styles.cardsContainer}>
                        <TouchableOpacity 
                            style={styles.card}
                            onPress={() => router.push('/AdminUserPanel')}
                        >
                            <View style={styles.cardIconContainer}>
                                <Ionicons name="people" size={48} color="#1877F2" />
                            </View>
                            <Text style={styles.cardTitle}>Gestión de Usuarios</Text>
                            <Text style={styles.cardDescription}>
                                Administra los usuarios de la plataforma y gestiona cuentas.
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.card}>
                            <View style={styles.cardIconContainer}>
                                <Ionicons name="stats-chart" size={48} color="#42B72A" />
                            </View>
                            <Text style={styles.cardTitle}>Estadísticas</Text>
                            <Text style={styles.cardDescription}>
                                Visualiza estadísticas y métricas de uso de la plataforma. No Implementado.
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.card}
                        >
                            <View style={styles.cardIconContainer}>
                                <Ionicons name="calendar" size={48} color="#FF6B00" />
                            </View>
                            <Text style={styles.cardTitle}>Gestión de Reservas</Text>
                            <Text style={styles.cardDescription}>
                                Administra las reservas, visualiza detalles y gestiona estados. No Implementado.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingTop: 50,
    },
    contentDesktop: {
        width: '100%',
        maxWidth: 1100,
        alignSelf: 'center',
    },
    contentMobile: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1877F2',
    },
    homeButtonText: {
        marginLeft: 5,
        color: '#1877F2',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    logoutButton: {
        backgroundColor: '#E4144C',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    welcomeText: {
        fontSize: 18,
        color: '#555',
        marginBottom: 30,
    },
    dashboardContainer: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: 20,
        width: '48%',
        minWidth: 280,
    },
    cardIconContainer: {
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    cardDescription: {
        color: '#555',
        fontSize: 14,
        lineHeight: 20,
    },
});
