// AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminHeader from '../components/AdminHeader';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPanel() {
    const [loading, setLoading] = useState(true);
    const [adminName, setAdminName] = useState('Administrador');
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

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
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
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
                <AdminHeader 
                    router={router} 
                    adminName={adminName} 
                    onLogout={handleLogout} 
                />
                <AdminDashboard router={router} />
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
});