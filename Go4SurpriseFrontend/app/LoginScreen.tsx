import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Image, Alert, useWindowDimensions, Modal, ScrollView,
  Platform, KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { BASE_URL } from '../constants/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SvgXml } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

// SVG del logo de Google
const googleLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  <circle cx="12" cy="12" r="3" fill="white"/>
</svg>`;

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallHeight = height < 700;

  // States for standard login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for email verification
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendInProgress, setResendInProgress] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set up the Google authentication request
  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: '964097563380-ij5ek733mtdb89of91va7t6imqrg5fjv.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuth(response);
    }
  }, [response]);

  const handleGoogleAuth = async (response: any) => {
    try {
      setIsLoading(true);
      const { authentication } = response;
      const token = authentication?.accessToken;
      
      if (!token) {
        throw new Error("El token de autenticación es nulo o no está definido.");
      }
      
      const result = await axios.post(
        `${BASE_URL}/users/social/google/`,
        { access_token: token },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const { access, refresh, user_id, id, preferences_set, is_superuser, is_staff, profile_complete } = result.data;
      
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      await AsyncStorage.setItem('userId', user_id.toString());
      await AsyncStorage.setItem('id', id);
      await AsyncStorage.setItem('isAdmin', (is_superuser && is_staff).toString());
      
      Alert.alert('Éxito', 'Inicio de sesión con Google correcto');
      
      if (!profile_complete) {
        router.push('/CompleteProfileScreen');
      } else {
        router.push(preferences_set ? '/HomeScreen' : '/IntroPreferencesScreen');
      }
    } catch (error: any) {
      console.log("Social login error:", error.response?.data || error.message);
      Alert.alert('Error de inicio con Google', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage('Por favor, ingresa tu nombre de usuario y contraseña.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `${BASE_URL}/users/login/`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const { access, user_id, refresh, id, profile_complete, preferences_set, is_superuser, is_staff, email_verified } = response.data;
      
      // Verificar si el email está verificado
      if (!email_verified) {
        setVerificationEmail(response.data.email);
        setShowVerificationModal(true);
        setIsLoading(false);
        return;
      }
      
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('userId', user_id.toString());
      await AsyncStorage.setItem('refreshToken', refresh);
      await AsyncStorage.setItem('id', id);
      await AsyncStorage.setItem('isAdmin', (is_superuser && is_staff).toString());
      
      Alert.alert('Éxito', 'Inicio de sesión correcto');
      
      if (!profile_complete) {
        router.push('/CompleteProfileScreen');
      } else {
        router.push(preferences_set ? '/HomeScreen' : '/IntroPreferencesScreen');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Email no verificado
        if (error.response.data?.error?.includes('verificar')) {
          setVerificationEmail(username);
          setShowVerificationModal(true);
          setIsLoading(false);
          return;
        }
      }
      setErrorMessage('Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendInProgress(true);
    setResendSuccess(false);
    
    try {
      await axios.post(
        `${BASE_URL}/users/login/`,
        { 
          username, 
          password, 
          resend_verification: true 
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setResendSuccess(true);
      setTimeout(() => {
        setShowVerificationModal(false);
      }, 3000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el correo de verificación. Inténtalo más tarde.');
    } finally {
      setResendInProgress(false);
    }
  };

  const renderForm = () => (
    <View style={styles.card}>
      <TextInput 
        style={styles.input} 
        placeholder="Nombre de usuario" 
        value={username} 
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Contraseña" 
          secureTextEntry={!showPassword}
          value={password} 
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin} 
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
          accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <Ionicons 
            name={showPassword ? 'eye-off' : 'eye'} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.forgotPasswordButton} 
        onPress={() => router.push('/ForgottenPasword')}
      >
        <Text style={styles.linkText}>¿Has olvidado la contraseña?</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => router.push('/RegisterScreen')}
        disabled={isLoading}
      >
        <Text style={styles.secondaryButtonText}>Registrate</Text>
      </TouchableOpacity>

      <View style={styles.socialLoginContainer}>
        <Text style={styles.socialLoginText}>Regístrate con:</Text>
        <View style={styles.socialButtonsRow}>
          <TouchableOpacity 
            style={styles.socialIconButton} 
            onPress={() => promptAsync()}
            disabled={isLoading}
          >
            <View style={styles.googleIconContainer}>
              <SvgXml xml={googleLogoSVG} width={24} height={24} />
            </View>
          </TouchableOpacity>
          {/* Espacio para añadir otros botones de redes sociales en el futuro */}
        </View>
      </View>
    </View>
  );

  const renderVerificationModal = () => (
    <Modal
      visible={showVerificationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowVerificationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Verificación de correo</Text>
          
          {resendSuccess ? (
            <Text style={styles.successMessage}>
              Correo de verificación enviado. Por favor, revisa tu correo, incluyendo la bandeja de spam.
            </Text>
          ) : (
            <>
              <Text style={styles.modalText}>
                Tu cuenta no ha sido verificada. Necesitas verificar tu correo electrónico para continuar.
              </Text>
              {verificationEmail && (
                <Text style={styles.emailText}>Correo: {verificationEmail}</Text>
              )}
              <TouchableOpacity 
                style={[styles.verifyButton, resendInProgress && styles.disabledButton]}
                onPress={handleResendVerification}
                disabled={resendInProgress}
              >
                <Text style={styles.verifyButtonText}>
                  {resendInProgress ? 'Enviando...' : 'Reenviar correo de verificación'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => { setShowVerificationModal(false); }}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar style="auto" />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          isMobile && styles.scrollContainerMobile
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.container,
          isMobile && styles.containerMobile,
          isSmallHeight && styles.containerSmallHeight
        ]}>
          <View style={[
            styles.content,
            isMobile ? styles.contentMobile : styles.contentDesktop
          ]}>
            {/* Left section - logo and text */}
            <View style={[
              styles.leftSection,
              isMobile && styles.leftSectionMobile,
              isSmallHeight && styles.leftSectionSmallHeight
            ]}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={[
                  styles.logo,
                  isMobile && styles.logoMobile,
                  isSmallHeight && styles.logoSmallHeight
                ]} 
              />
              <Text style={[
                styles.description,
                isMobile && styles.descriptionMobile
              ]}>
                ¿No tienes ganas de organizar un evento? Deja que nosotros te demos una sorpresa
              </Text>
            </View>

            {/* Right section - form */}
            <View style={[
              styles.rightSection,
              isMobile && styles.rightSectionMobile
            ]}>
              {renderForm()}
            </View>
          </View>
          
          {renderVerificationModal()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F4F4F4',
  },
  scrollContainerMobile: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  containerMobile: {
    paddingHorizontal: 0,
  },
  containerSmallHeight: {
    paddingVertical: 10,
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
    justifyContent: 'center',
  },
  leftSection: {
    flex: 1,
    maxWidth: 500,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  leftSectionMobile: {
    marginBottom: 20,
    maxWidth: '100%',
  },
  leftSectionSmallHeight: {
    marginBottom: 10,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  logoMobile: {
    width: 180,
    height: 180,
  },
  logoSmallHeight: {
    width: 140,
    height: 140,
  },
  description: {
    fontSize: 20,
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  descriptionMobile: {
    fontSize: 18,
    marginTop: 10,
    lineHeight: 24,
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  rightSectionMobile: {
    maxWidth: '100%',
    width: '100%',
  },
  card: {
    width: '100%',
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
    marginBottom: 12,
    fontSize: 16,
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    width: '100%',
    padding: 12,
    paddingRight: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: '30%',
    transform: [{ translateY: -12 }],
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  linkText: {
    color: '#1877F2',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 12,
  },
  secondaryButton: {
    backgroundColor: '#42B72A',
    paddingVertical:
    12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  socialLoginText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  socialIconButton: {
    padding: 8,
  },
  googleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1877F2',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5c9ff',
    opacity: 0.8,
  },
  successMessage: {
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});