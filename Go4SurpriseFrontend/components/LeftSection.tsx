import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export const LeftSection = () => {
    return (
        <View style={styles.leftSection}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.description}>
                ¿No tienes ganas de organizar un evento? Deja que nosotros te demos una sorpresa
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    leftSection: {
        flex: 1,
        maxWidth: 500,
        marginBottom: 20,
        alignItems: 'center',
        minWidth: 300,
    },
    logo: {
        width: 220,
        height: 220,
        resizeMode: 'contain',
    },
    description: {
        fontSize: 20,
        color: '#333',
        marginTop: 10,
        textAlign: 'left',
    },
});