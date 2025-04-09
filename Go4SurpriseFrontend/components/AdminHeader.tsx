// components/AdminHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface AdminHeaderProps {
    router: any;
    adminName: string;
    onLogout: () => void;
}

const handleLogout = async (router: any) => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('id');
    await AsyncStorage.removeItem('isAdmin');
    router.replace('/LoginScreen');
};

const AdminHeader = ({ router, adminName, onLogout }: AdminHeaderProps) => {
    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity 
                        style={styles.homeButton}
                        onPress={() => router.push('/HomeScreen')}
                    >
                        <Ionicons name="home-outline" size={22} color="#1877F2" />
                        <Text style={styles.homeButtonText}>Inicio</Text>
                    </TouchableOpacity>
                </View>
    
                <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout(router)}>
                    <Text style={styles.buttonText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>Panel de Administración</Text>
            <Text style={styles.welcomeText}>Bienvenido, {adminName}</Text>
        </>
    );
};

const styles = StyleSheet.create({
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
        fontSize: 16,
        paddingLeft: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1877F2',
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
        textAlign: 'center',
    },
});

export default AdminHeader;