import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Image, Alert, useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const { width } = useWindowDimensions();
    const isMobile = width < 768; // Cuando el ancho es menor a 768px, pasamos a vista móvil

    const handleLogin = async () => {
        setErrorMessage(null);
        try {
            const response = await axios.post(
                `${BASE_URL}/users/login/`,
                { username, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const { access, user_id, refresh, id, preferences_set, is_superuser, is_staff } = response.data;
            await AsyncStorage.setItem('accessToken', access);
            await AsyncStorage.setItem('userId', user_id.toString());
            await AsyncStorage.setItem('refreshToken', refresh);
            await AsyncStorage.setItem('id', id);
            await AsyncStorage.setItem('isAdmin', (is_superuser && is_staff).toString());

            Alert.alert('Éxito', 'Inicio de sesión correcto');

            router.push(preferences_set ? '/HomeScreen' : '/PreferencesFormScreen');
        } catch (error) {
            setErrorMessage('Credenciales incorrectas. Inténtalo de nuevo.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
                {/* SECCIÓN IZQUIERDA - LOGO Y TEXTO */}
                <View style={styles.leftSection}>
                    <Image source={require('../assets/images/logo.png')} style={styles.logo} />
                    <Text style={styles.description}>
                    ¿No tienes ganas de organizar un evento? Deja que nosotros te demos una sorpresa
                    </Text>
                </View>

                {/* SECCIÓN DERECHA - FORMULARIO */}
                <View style={styles.rightSection}>
                    <View style={styles.card}>
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

                        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

                        <TouchableOpacity style={styles.button} onPress={() => void handleLogin()}>
                            <Text style={styles.buttonText}>Iniciar sesión</Text>
                        </TouchableOpacity>

                        <Text style={styles.linkText} onPress={() => router.push('/ForgottenPasword')}>
                            ¿Has olvidado la contraseña?
                        </Text>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/RegisterScreen')}>
                            <Text style={styles.secondaryButtonText}>Crear una cuenta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    content: {
        width: '100%',
        maxWidth: 1100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contentDesktop: {
        flexDirection: 'row', // Layout horizontal en pantallas grandes
    },
    contentMobile: {
        flexDirection: 'column', // Layout vertical en móviles
        alignItems: 'center',
    },
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
    rightSection: {
        flex: 1,
        alignItems: 'center',
        maxWidth: 400,
    },
    card: {
        width: 400,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#1877F2',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkText: {
        color: '#1877F2',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 10,
    },
    secondaryButton: {
        backgroundColor: '#42B72A',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    createPageText: {
        marginTop: 20,
        fontSize: 14,
        color: '#606770',
        textAlign: 'center',
    },
});

