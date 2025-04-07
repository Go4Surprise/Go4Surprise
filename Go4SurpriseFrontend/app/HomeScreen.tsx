import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ImageBackground, 
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CountDown from './CountDown';
import Reviews from './Reviews';
import Experiences from './Experiences';
import axios from "axios";
import { BASE_URL } from '@/constants/apiUrl';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  
  // Definiciones de tamaños de pantalla más detalladas
  const isSmallMobile = width < 375;
  const isMobile = width >= 375 && width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const [isAdmin, setIsAdmin] = useState(false);
  const [hasBookings, setHasBookings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Función para verificar estado de reservas
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const usuarioId = await AsyncStorage.getItem("id");
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }

      const response = await axios.get(`${BASE_URL}/bookings/users/${usuarioId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHasBookings(Array.isArray(response.data) && response.data.length > 0);
    } catch (error) {
      console.error("Error al comprobar reservas:", error);
      setHasBookings(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar estado de administrador
  const checkAdminStatus = useCallback(async () => {
    const adminStatus = await AsyncStorage.getItem('isAdmin');
    setIsAdmin(adminStatus === 'true');
  }, []);

  // Cargar datos cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
      checkAdminStatus();
    }, [fetchBookings, checkAdminStatus])
  );

  // Estilos dinámicos basados en el tamaño de la pantalla
  const dynamicStyles = {
    header: {
      paddingHorizontal: isSmallMobile ? width * 0.05 : isMobile ? width * 0.07 : width * 0.1,
      paddingVertical: isSmallMobile ? 10 : 15
    },
    logo: {
      width: isSmallMobile ? 40 : isMobile ? 35 : 40,
      height: isSmallMobile ? 40 : isMobile ? 35 : 40,
    },
    title: {
      fontSize: isSmallMobile ? 20 : isMobile ? 24 : 30,
    },
    background: {
      height: isSmallMobile ? 200 : isMobile ? 250 : isTablet ? 300 : 350,
    },
    mainSubtitle: {
      fontSize: isSmallMobile ? 22 : isMobile ? 26 : isTablet ? 40 : 50,
    },
    subsubtitle: {
      fontSize: isSmallMobile ? 14 : isMobile ? 16 : isTablet ? 22 : 28,
    },
    buttonText: {
      fontSize: isSmallMobile ? 14 : isMobile ? 16 : isTablet ? 18 : 20,
    },
    buttons: {
      paddingVertical: isSmallMobile ? 8 : isMobile ? 10 : 12,
      paddingHorizontal: isSmallMobile ? 15 : isMobile ? 20 : 25,
    },
    centeredContainer: {
      // width se aplica directamente en el componente
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("../assets/images/logo.png")} 
              style={[styles.logo, dynamicStyles.logo]} 
              resizeMode="contain"
            />
            <Text style={[styles.title, dynamicStyles.title]}>Go4Surprise</Text>
          </View>
          <View style={styles.headerRightContainer}>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={() => router.push("/AdminPanel")}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark" size={isSmallMobile ? 18 : 24} color="#1877F2" />
                <Text style={styles.adminText}>Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => router.push("/Profile")}
              style={styles.profileButton}
              activeOpacity={0.7}
            >
              <Image 
                source={require("../assets/images/user-logo-none.png")} 
                style={styles.profileIcon} 
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Countdown */}
        <CountDown />

        {/* Main Banner */}
        <View style={styles.centeredContainer}>
          <ImageBackground
            source={require("../assets/images/LittleBackground.jpg")}
            style={[styles.background, { 
              height: isSmallMobile ? 200 : isMobile ? 250 : isTablet ? 300 : 400,
              width: isDesktop ? 1024 : isTablet ? "100%" : "100%"
            }]}
            imageStyle={styles.image}
            resizeMode="cover"
          >
            <View style={styles.overlayContent}>
              <Text style={[styles.subtitle, dynamicStyles.mainSubtitle]}>
                ATRÉVETE A UNA
              </Text>
              <Text style={[styles.subtitle, dynamicStyles.mainSubtitle]}>
                EXPERIENCIA SORPRESA
              </Text>
              <Text style={[styles.subsubtitle, dynamicStyles.subsubtitle]}>
                ¡Descubre la experiencia 24 horas antes!
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.surpriseButton, dynamicStyles.buttons]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/RegisterBookings")}
                >
                  <Text style={[styles.surpriseButtonText, dynamicStyles.buttonText]}>¡Sorpréndeme!</Text>
                </TouchableOpacity>

                {hasBookings && (
                  <TouchableOpacity
                    style={[styles.bookingsButton, dynamicStyles.buttons]}
                    activeOpacity={0.8}
                    onPress={() => router.push("/MyBookings")}
                  >
                    <Text style={[styles.bookingsButtonText, dynamicStyles.buttonText]}>Mis reservas</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Reviews Section */}
        <Reviews navigation={navigation} />

        {/* Experiences Section */}
        <Experiences />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20, 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: 'nowrap',
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    marginRight: 3,
  },
  title: {
    fontWeight: "bold",
    color: "#004AAD",
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginLeft: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1877F2',
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
  },
  adminText: {
    marginLeft: 5,
    color: '#1877F2',
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  profileIcon: {
    width: 52,  
    height: 52,
    borderRadius: 20,
  },
  centeredContainer: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    width: "100%",
    maxWidth: 1200,
    paddingHorizontal: 20,
  },
  background: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
  },
  image: {
    opacity: 0.6,
    borderRadius: 20,
    width: "100%",
    height: "100%",
  },
  overlayContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    width: '100%',
  },
  subtitle: {
    fontWeight: "bold",
    color: "#004AAD",
    textAlign: "center",
    marginBottom: 5,
    textShadowColor: "rgba(3, 25, 120, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subsubtitle: {
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  surpriseButton: {
    backgroundColor: "blue",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  surpriseButtonText: {
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  bookingsButton: {
    backgroundColor: "blue",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  bookingsButtonText: {
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
});