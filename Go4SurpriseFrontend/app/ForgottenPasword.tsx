import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants/apiUrl';

export default function ForgottenPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const sendEmail = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        if (!email.trim()) {
            setErrorMessage('Por favor, introduce un correo válido.');
            return;
        }

        try {
            await axios.post(`${BASE_URL}/users/password_reset/`, { email }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
            });

            setSuccessMessage('El correo ha sido enviado correctamente.');
        } catch (error) {
            setErrorMessage('No se pudo procesar la solicitud. Inténtalo más tarde.');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/LoginScreen')}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <Image source={require('../assets/images/logo.png')} style={styles.logo} />

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

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={() => void sendEmail()}>
                    <Text style={styles.buttonText}>Enviar enlace</Text>
                </TouchableOpacity>

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
    errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 10,
    },
    successText: {
        color: 'green',
        fontSize: 14,
        marginBottom: 10,
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

