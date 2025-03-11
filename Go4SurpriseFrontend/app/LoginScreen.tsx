import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Image, Alert, ImageBackground 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface LoginResponse {
    id: string;
    user_id: number;
    username: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    pfp: string | null;
    access: string;
    refresh: string;
    preferences_set: boolean;
}

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLogin = async () => {
        setErrorMessage(null);
        try {
            const response = await axios.post<LoginResponse>(
                'http://localhost:8000/users/login/',
                { username, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const { user_id, access, refresh, preferences_set } = response.data;

            await AsyncStorage.setItem('accessToken', access);
            await AsyncStorage.setItem('userId', user_id.toString());
            await AsyncStorage.setItem('refreshToken', refresh);


            Alert.alert('Éxito', 'Inicio de sesión correcto');

            if (!preferences_set) {
                router.push('/PreferencesFormScreen');
            } else {
                router.push('/HomeScreen');
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = 
                    error.response?.data?.error ||
                    error.response?.data?.username ||
                    error.response?.data?.password ||
                    'Credenciales incorrectas';
                
                setErrorMessage(errorMessage);
            } else {
                setErrorMessage('Algo salió mal. Por favor, inténtalo de nuevo.');
            }
        }
    };

    return (
        <ImageBackground 
            source={require('../assets/images/Background.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}> 
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>

                <Image source={require('../assets/images/logo.png')} style={styles.logo} />
                <Text style={styles.title}>Go4Surprise</Text>
                <Text style={styles.subtitle}>Iniciar sesión</Text>

                <TextInput 
                    style={styles.input} 
                    placeholder="Username" 
                    value={username} 
                    onChangeText={setUsername} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Contraseña" 
                    secureTextEntry 
                    value={password} 
                    onChangeText={setPassword} 
                />

                {errorMessage && (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                )}

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Acceder</Text>
                </TouchableOpacity>

                <Text style={styles.linkText} onPress={() => router.push('/ForgottenPasword')}>
                    ¿Has olvidado tu contraseña?
                </Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
        margin: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#004AAD',
    },
    subtitle: {
        fontSize: 18,
        color: '#777',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    errorText: {
        color: 'red',
        marginTop: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#333',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkText: {
        color: 'blue',
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
});
