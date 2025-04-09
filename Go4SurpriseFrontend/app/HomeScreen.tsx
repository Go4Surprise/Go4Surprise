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
  useWindowDimensions,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CountDown from './CountDown';
import Reviews from './Reviews';
import axios from "axios";
import { BASE_URL } from '@/constants/apiUrl';
import { useFocusEffect } from '@react-navigation/native';

// Add interface for user data
interface User {
  pfp?: string;
}

// Add interface for experience data
interface Experience {
  title: string;
  icon: string;
  image: any;
  description: string;
}

// Define experiences data
const experiencesData: Experience[] = [
  {
    title: 'Aventura',
    icon: 'walk-outline',
    image: require('../assets/images/aventura.png'),
    description: 'Actividades en la naturaleza, al aire libre, donde se respirará aire puro y un ambiente de aventura y diversión increíble.',
  },
  {
    title: 'Cultura',
    icon: 'book-outline',
    image: require('../assets/images/cultura.png'),
    description: 'Sumérgete en el mundo de los museos, teatros y eventos culturales que te conectarán con la historia y las tradiciones.',
  },
  {
    title: 'Deporte',
    icon: 'fitness-outline',
    image: require('../assets/images/deporte.png'),
    description: 'Participa en actividades deportivas que fomentan la salud, el trabajo en equipo y la superación personal.',
  },
  {
    title: 'Gastronomía',
    icon: 'restaurant-outline',
    image: require('../assets/images/gastronomia.png'),
    description: 'Disfruta de experiencias culinarias únicas, catas de vino y deliciosas comidas que deleitarán tu paladar.',
  },
  {
    title: 'Ocio Nocturno',
    icon: 'moon-outline',
    image: require('../assets/images/ocionocturno.png'),
    description: 'Vive la magia de la noche con bares, discotecas y eventos nocturnos llenos de energía y diversión.',
  },
  {
    title: 'Música',
    icon: 'musical-notes-outline',
    image: require('../assets/images/musica.png'),
    description: 'Déjate llevar por el ritmo en conciertos, festivales y eventos musicales que te harán vibrar.',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  // Definiciones de tamaños de pantalla más detalladas
  const isSmallMobile = width < 375;
  const isMobile = width >= 375 && width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User>({});
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        return;
      }
      
      const response = await axios.get(`${BASE_URL}/users/get_user_info/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setUser({
        pfp: response.data.pfp || '',
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };


  // Verificar estado de administrador
  const checkAdminStatus = useCallback(async () => {
    const adminStatus = await AsyncStorage.getItem('isAdmin');
    setIsAdmin(adminStatus === 'true');
  }, []);

  // Cargar datos cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      checkAdminStatus();
      fetchUserData();
    }, [checkAdminStatus])
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
                source={
                  user.pfp
                    ? {
                      uri: user.pfp.startsWith('http')
                        ? user.pfp
                        : `${BASE_URL}${user.pfp}`
                    }
                    : require("../assets/images/user-logo-none.png")
                }
                style={styles.profileIcon}
                onError={() => setUser(prev => ({ ...prev, pfp: '' }))}
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
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Experiences Section */}
        <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Experiencias que ofrecemos</Text>
          <View style={styles.experiencesContainer}>
            {experiencesData.map((experience) => (
              <TouchableOpacity
                key={experience.title}
                style={styles.experienceCard}
                activeOpacity={0.8}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onPress={() => setSelectedExperience(experience)}
              >
                <Ionicons name={experience.icon} size={24} color="#004AAD" style={styles.icon} />
                <Text style={styles.experienceTitle}>{experience.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modal for Experience Details */}
        {selectedExperience && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={!!selectedExperience}
            onRequestClose={() => setSelectedExperience(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Image source={selectedExperience.image} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedExperience.title}</Text>
                <Text style={styles.modalDescription}>{selectedExperience.description}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedExperience(null)}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Reviews Section */}
        <Reviews navigation={navigation} />
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
    borderRadius: 27.5,
    borderWidth: 1,
    borderColor: '#E1E1E1',
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004AAD',
    marginBottom: 20,
    textAlign: 'center',
  },
  experiencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  experienceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    transition: 'transform 0.2s ease-in-out',
  },
  icon: {
    marginBottom: 10,
  },
  experienceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004AAD',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004AAD',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#004AAD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});