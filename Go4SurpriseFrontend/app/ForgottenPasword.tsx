import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function ForgottenPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const sendEmail = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor, introduce un correo válido.');
            return;
        }

        try {
            await axios.post('http://localhost:8000/users/forgot-password/', { email });
            Alert.alert('Éxito', 'Hemos enviado un enlace de recuperación a tu correo.');
        } catch (error) {
            Alert.alert('Error', 'No se pudo procesar la solicitud. Inténtalo más tarde.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Botón de Volver */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/LoginScreen')}> 
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            {/* Logo */}
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />

            {/* Tarjeta con el formulario */}
            <View style={styles.card}>
                <Text style={styles.title}>Recuperar Contraseña</Text>

                <Text style={styles.textInfo}>
                    Introduce tu correo y te enviaremos un enlace para recuperar tu cuenta.
                </Text>

                <TextInput 
                    style={styles.input} 
                    placeholder="Correo electrónico" 
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address" 
                />

                {/* Botón de envío */}
                <TouchableOpacity style={styles.button} onPress={sendEmail}>
                    <Text style={styles.buttonText}>Enviar enlace</Text>
                </TouchableOpacity>

                {/* Enlace a Login */}
                <Text style={styles.loginText} onPress={() => router.push('/')}>
                    ¿Ya la recordaste? <Text style={styles.loginLink}>Inicia sesión</Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1877F2',
        marginBottom: 10,
    },
    textInfo: {
        fontSize: 14,
        color: '#606770',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 14,
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        backgroundColor: '#F9F9F9',
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#1877F2',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginText: {
        marginTop: 16,
        fontSize: 14,
        color: '#606770',
    },
    loginLink: {
        color: '#1877F2',
        fontWeight: 'bold',
    },
});
