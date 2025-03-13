import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants/apiUrl';

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleRegister = async () => {
        try {
            await axios.post(`${BASE_URL}/users/register/`, {
                username,
                password,
                name,
                surname,
                email,
                phone,
            });
            Alert.alert('Registro exitoso');
            router.push('/PreferencesFormScreen');
        } catch (error) {
            Alert.alert('Error en la solicitud', (error as any).message);
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
                <Text style={styles.title}>Crear Cuenta</Text>

                <TextInput 
                    style={styles.input} 
                    placeholder="Nombre de usuario" 
                    value={username} 
                    onChangeText={setUsername} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Contraseña" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Nombre" 
                    value={name} 
                    onChangeText={setName} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Apellido" 
                    value={surname} 
                    onChangeText={setSurname} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Correo electrónico" 
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address" 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Teléfono" 
                    value={phone} 
                    onChangeText={setPhone} 
                    keyboardType="phone-pad" 
                />

                {/* Botón de Registro */}
                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>

                {/* Enlace a Login */}
                <Text style={styles.loginText} onPress={() => router.push('/LoginScreen')}>
                    ¿Ya tienes cuenta? <Text style={styles.loginLink}>Inicia sesión</Text>
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1877F2',
        marginBottom: 16,
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
