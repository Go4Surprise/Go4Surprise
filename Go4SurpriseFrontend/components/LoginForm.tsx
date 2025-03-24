import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';

interface LoginFormProps {
    router: any;
}

export const LoginForm = ({ router }: LoginFormProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const saveUserData = async (userData: any) => {
        const { access, user_id, refresh, id, is_superuser, is_staff } = userData;
        await AsyncStorage.setItem('accessToken', access);
        await AsyncStorage.setItem('userId', user_id.toString());
        await AsyncStorage.setItem('refreshToken', refresh);
        await AsyncStorage.setItem('id', id);
        await AsyncStorage.setItem('isAdmin', (is_superuser && is_staff).toString());
    };

    const navigateAfterLogin = (preferencesSet: boolean) => {
        router.replace(preferencesSet ? '/HomeScreen' : '/PreferencesFormScreen');
    };

    const handleLogin = async () => {
        setErrorMessage(null);
        try {
            const response = await axios.post(
                `${BASE_URL}/users/login/`,
                { username, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            await saveUserData(response.data);
            Alert.alert('Éxito', 'Inicio de sesión correcto');
            navigateAfterLogin(response.data.preferences_set);
        } catch (error) {
            setErrorMessage('Credenciales incorrectas. Inténtalo de nuevo.');
        }
    };

    return (
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
    );
};

const styles = StyleSheet.create({
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
});