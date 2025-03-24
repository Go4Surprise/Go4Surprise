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
    const isMobile = width < 768;

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