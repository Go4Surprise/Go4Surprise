import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../constants/apiUrl';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [errors, setErrors] = useState<{ 
        username?: string; 
        password?: string; 
        name?: string; 
        surname?: string; 
        email?: string; 
        phone?: string; 
    }>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const validateFields = () => {
        let newErrors: { 
            username?: string; 
            password?: string; 
            name?: string; 
            surname?: string; 
            email?: string; 
            phone?: string; 
        } = {};

        if (!username) newErrors.username = "El nombre de usuario es obligatorio";
        if (!password) {
            newErrors.password = "La contraseña es obligatoria";
        } else if (password.length < 6) {
            newErrors.password = "La contraseña debe tener al menos 6 caracteres";
        }
        if (!name) newErrors.name = "El nombre es obligatorio";
        if (!surname) newErrors.surname = "El apellido es obligatorio";
        if (!email) {
            newErrors.email = "El correo es obligatorio";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "El correo electrónico no es válido";
        }
        if (!phone) {
            newErrors.phone = "El teléfono es obligatorio";
        } else if (!/^\d{9}$/.test(phone)) {
            newErrors.phone = "El teléfono debe tener 9 dígitos";
        }

        setErrors(newErrors); 
        return Object.keys(newErrors).length === 0; 
    };

    const checkUsernameExists = async () => {
        setErrorMessage(null); 
        try {
            const response = await axios.get(`${BASE_URL}/users/check_username/${username}`);
            return response.data.exists; 
        } catch (error) {
            setErrorMessage('Error al verificar el nombre de usuario.'); 
            return false; 
        }
    };

    const handleRegister = async () => {
        const fieldsValid = validateFields();
        if (!fieldsValid) return; 

        const userExists = await checkUsernameExists();
        if (userExists) {
            setErrors((prev) => ({ ...prev, username: "El nombre de usuario ya está en uso" }));
            return; 
        }

        setErrorMessage(null); 
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
            setErrorMessage('Error al hacer el registro. Verifica que todos los campos están correctos');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/LoginScreen')}> 
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <Image source={require('../assets/images/logo.png')} style={styles.logo} />

            <View style={styles.card}>
                <Text style={styles.title}>Crear Cuenta</Text>

                <TextInput 
                    style={styles.input} 
                    placeholder="Nombre de usuario" 
                    value={username} 
                    onChangeText={setUsername} 
                />
                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder="Contraseña" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder="Nombre" 
                    value={name} 
                    onChangeText={setName} 
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder="Apellido" 
                    value={surname} 
                    onChangeText={setSurname} 
                />
                {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder="Correo electrónico" 
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address" 
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder="Teléfono" 
                    value={phone} 
                    onChangeText={setPhone} 
                    keyboardType="phone-pad" 
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>

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
        marginBottom: 6,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        alignSelf: 'flex-start',
        marginBottom: 6,
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
