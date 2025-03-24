// components/DashboardCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DashboardCardProps {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
}

const DashboardCard = ({ title, description, icon, color, onPress }: DashboardCardProps) => {
    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={onPress}
        >
            <View style={styles.cardIconContainer}>
                <Ionicons name={icon} size={48} color={color} />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
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

export default DashboardCard;