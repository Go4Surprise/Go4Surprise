// components/AdminHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AdminHeaderProps {
    router: any;
    adminName: string;
    onLogout: () => void;
}

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
                    <Text style={styles.title}>Panel de Administración</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.buttonText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
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
});

export default AdminHeader;