// components/AdminDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DashboardCard from './DashboardCard';

interface AdminDashboardProps {
    router: any;
}

const AdminDashboard = ({ router }: AdminDashboardProps) => {
    const dashboardItems = [
        {
            id: 'users',
            title: 'Gestión de Usuarios',
            description: 'Administra los usuarios de la plataforma y gestiona cuentas.',
            icon: 'people',
            color: '#1877F2',
            onPress: () => router.push('/AdminUserPanel'),
        },
        {
            id: 'stats',
            title: 'Estadísticas',
            description: 'Visualiza estadísticas y métricas de uso de la plataforma. No Implementado.',
            icon: 'stats-chart',
            color: '#42B72A',
            onPress: () => null
        },
        {
            id: 'reservations',
            title: 'Gestión de Reservas',
            description: 'Administra las reservas, visualiza detalles y gestiona estados.',
            icon: 'calendar',
            color: '#FF6B00',
            onPress: () => router.push('/AdminBookingsPanel'),
        }
    ];

    return (
        <View style={styles.dashboardContainer}>
            <Text style={styles.sectionTitle}>Gestión de la Plataforma</Text>
            
            <View style={styles.cardsContainer}>
                {dashboardItems.map(item => (
                    <DashboardCard 
                        key={item.id}
                        title={item.title}
                        description={item.description}
                        icon={item.icon}
                        color={item.color}
                        onPress={item.onPress}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dashboardContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',  
        alignItems: 'center',       
        alignSelf: 'center',      
        gap: 10,    
    },
});

export default AdminDashboard;