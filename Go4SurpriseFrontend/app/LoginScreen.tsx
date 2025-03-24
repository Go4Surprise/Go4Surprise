import React from 'react';
import { 
    View, StyleSheet, useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LoginForm } from '../components/LoginForm';
import { LeftSection } from '../components/LeftSection';

export default function LoginScreen() {
    const router = useRouter();
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

            router.push(preferences_set ? '/HomeScreen' : '/IntroPreferencesScreen');
        } catch (error) {
            setErrorMessage('Credenciales incorrectas. Inténtalo de nuevo.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
                <LeftSection />
                <View style={styles.rightSection}>
                    <LoginForm router={router} />
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
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contentDesktop: {
        flexDirection: 'row',
    },
    contentMobile: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    rightSection: {
        flex: 1,
        alignItems: 'center',
        maxWidth: 400,
    },
});
