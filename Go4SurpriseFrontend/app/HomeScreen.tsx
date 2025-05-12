import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Modal,
  Animated,
  TouchableWithoutFeedback,
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
import PendingBookingAdvert from './PendingBookingAdvert';

// Add interface for user data
interface User {
  pfp?: string;
}

// Add interface for experience data
interface Experience {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
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

// Define quotes and images
const quotes = [
  "La vida misma es una sorpresa. Atrévete a descubrir la tuya.",
  "Lo mejor de la vida llega sin avisar.",
  "Cada día es una nueva aventura esperando a ser vivida.",
  "Las experiencias inolvidables comienzan con un ‘¿y si…?’",
  "La magia está en lo inesperado.",
  "El mejor plan es el que aún no conoces.",
  "No necesitas conocer el destino para disfrutar del viaje.",
  "Las sorpresas dan sabor a la rutina.",
  "Donde menos lo esperas, nace el recuerdo más grande.",
  "Vive hoy. Sorpréndete siempre.",
];

const sorpresinImages = [
  require('../assets/images/sorpresin/Sorpresin1.png'),
  require('../assets/images/sorpresin/Sorpresin2.png'),
  require('../assets/images/sorpresin/Sorpresin3.png'),
  require('../assets/images/sorpresin/Sorpresin4.png'),
];

// Define interface for reviews
interface Review {
  firstName: string;
  lastName: string;
  reviewText: string;
}

// Mock reviews data (replace with actual data if available)
const reviewsData: Review[] = [
  { firstName: "Juan", lastName: "Pérez", reviewText: "¡Increíble experiencia! Me encantó." },
  { firstName: "María", lastName: "Gómez", reviewText: "Una sorpresa inolvidable, lo recomiendo." },
  { firstName: "Carlos", lastName: "López", reviewText: "Todo estuvo perfecto, repetiría sin duda." },
  { firstName: "Ana", lastName: "Martínez", reviewText: "La organización fue excelente, muy divertido." },
  { firstName: "Luis", lastName: "Hernández", reviewText: "Una experiencia única, superó mis expectativas." },
];

// Reutilizar el componente StarRating
const StarRating = ({ stars }: { stars: number }) => (
  <View style={styles.reviewRating}>
    {Array.from({ length: stars }).map((_, i) => (
      <Ionicons key={i} name="star" size={16} color="#FFD700" />
    ))}
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const reviewCardWidth = width * 0.7; // Extraer constante para ancho de tarjeta

  // Definiciones de tamaños de pantalla más detalladas
  const isSmallMobile = width < 375;
  const isMobile = width >= 375 && width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User>({});
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [scrollX] = useState(new Animated.Value(0)); // Animación para el desplazamiento horizontal de las reviews
  const [currentIndex, setCurrentIndex] = useState(0); // Índice actual del carrusel de reviews
  const [error, setError] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState<string>('');
  const [randomImage, setRandomImage] = useState<any>(null);
  const [imageHoverAnimation] = useState(new Animated.Value(1)); // Inicializa la animación de hover para imágenes
  const [quoteAnimation] = useState(new Animated.Value(0)); // Inicializa la animación para la frase
  const reviewScrollRef = useRef<ScrollView>(null); // Add ref for ScrollView

  const scaleAnimations = useState(() => {
    const animations = experiencesData.reduce((acc, experience) => {
      acc[experience.title] = new Animated.Value(1); // Inicializa la escala en 1 para categorías
      return acc;
    }, {} as { [key: string]: Animated.Value });

    // Inicializa la escala en 1 para las reviews
    for (let i = 0; i < 5; i++) {
      animations[`review-${i}`] = new Animated.Value(1);
    }

    return animations;
  })[0];

  const handlePressIn = (key: string) => {
    if (scaleAnimations[key]) {
      Animated.spring(scaleAnimations[key], {
        toValue: 1.2, // Escala al 120% para el efecto de pop
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = (key: string) => {
    if (scaleAnimations[key]) {
      Animated.spring(scaleAnimations[key], {
        toValue: 1, // Vuelve a la escala original
        friction: 3, // Reduce la fricción para un efecto más suave
        tension: 40, // Aumenta la tensión para un rebote más rápido
        useNativeDriver: true,
      }).start();
    }
  };

  const handleImageHoverIn = () => {
    Animated.spring(imageHoverAnimation, {
      toValue: 1.2, // Escala al 120%
      useNativeDriver: true,
    }).start();
  };

  const handleImageHoverOut = () => {
    Animated.spring(imageHoverAnimation, {
      toValue: 1, // Vuelve a la escala original
      useNativeDriver: true,
    }).start();
  };

  const handleNextReview = () => {
    const nextIndex = (currentIndex + 1) % reviewsData.length;
    reviewScrollRef.current?.scrollTo({ x: nextIndex * width * 0.7, animated: true }); // Use ref to scroll
    setCurrentIndex(nextIndex);
  };

  const handlePrevReview = () => {
    const prevIndex = (currentIndex - 1 + reviewsData.length) % reviewsData.length;
    reviewScrollRef.current?.scrollTo({ x: prevIndex * width * 0.7, animated: true }); // Use ref to scroll
    setCurrentIndex(prevIndex);
  };

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
      setError("No se pudo cargar la información del usuario.");
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

  // Unificar lógica de desplazamiento automático
  useEffect(() => {
    const interval = setInterval(() => {
      handleNextReview(); // Desplazamiento automático
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    // Select a random quote and image on screen refresh
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setRandomImage(sorpresinImages[Math.floor(Math.random() * sorpresinImages.length)]);

    // Animar la entrada de la frase y la imagen
    Animated.sequence([
      Animated.timing(imageHoverAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(quoteAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      {error && <Text style={styles.errorText}>{error}</Text>}
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 30 }]} // Añadir paddingBottom
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
                        : `${BASE_URL}${user.pfp}`,
                    }
                    : require("../assets/images/user-logo-none.png")
                }
                style={styles.profileIcon}
                onError={() => setUser((prev) => ({ ...prev, pfp: '' }))}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Countdown */}
        <CountDown />


        {/* Pending Booking Advert */}
        <PendingBookingAdvert />

        {/* Main Banner */}
        <View style={styles.centeredContainer}>
          <ImageBackground
            source={require("../assets/images/LittleBackground.jpg")}
            style={[
              styles.background,
              {
                height: isSmallMobile ? 200 : isMobile ? 250 : isTablet ? 300 : 400,
                width: isDesktop ? 1024 : isTablet ? "100%" : "100%",
              },
            ]}
            imageStyle={styles.image}
            resizeMode="cover"
          >
            <View style={styles.overlayContent}>
              <Text style={[styles.subtitle, dynamicStyles.mainSubtitle]}>
                ATRÉVETE A UNA
              </Text>
              <Text style={[styles.subtitle, dynamicStyles.mainSubtitle]}> {/* Cambiar stylessubtitle a styles.subtitle */}
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
                  accessibilityLabel="Botón para registrarse en una experiencia sorpresa"
                >
                  <Text style={[styles.surpriseButtonText, dynamicStyles.buttonText]}>
                    ¡Sorpréndeme!
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Quote Section */}
        <View style={styles.quoteContainer}>
          <View style={styles.quoteContent}>
            <TouchableWithoutFeedback
              onPressIn={handleImageHoverIn}
              onPressOut={handleImageHoverOut}
            >
              <Animated.Image
                source={randomImage}
                style={[
                  styles.quoteImage,
                  { transform: [{ scale: imageHoverAnimation }] },
                ]}
                resizeMode="contain"
              />
            </TouchableWithoutFeedback>
            <View style={styles.quoteTextContainer}>
              <Animated.Text
                style={[
                  styles.quoteText,
                  {
                    opacity: quoteAnimation,
                    transform: [
                      {
                        translateY: quoteAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.quoteMarks}>“</Text>
                {randomQuote}
                <Text style={styles.quoteMarks}>”</Text>
              </Animated.Text>
              <Text style={styles.quoteAuthor}>Go4Surprise</Text>
            </View>
          </View>
        </View>

        {/* Experiences Section */}
        <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Experiencias que ofrecemos</Text>
          <View style={styles.experiencesContainer}>
            {experiencesData.map((experience) => (
              <TouchableWithoutFeedback
                key={experience.title}
                onPress={() => {
                  handlePressIn(experience.title);
                  setTimeout(() => handlePressOut(experience.title), 150); // Ensure the pop effect completes
                }}
              >
                <Animated.View
                  style={[
                    styles.experienceCard,
                    { transform: [{ scale: scaleAnimations[experience.title] }] },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedExperience(experience)}
                    accessibilityLabel={`Seleccionar experiencia de ${experience.title}`}
                  >
                    <Ionicons name={experience.icon} size={24} color="#004AAD" style={styles.icon} />
                    <Text style={styles.experienceTitle}>{experience.title}</Text>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
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
                  accessibilityLabel="Cerrar detalles de la experiencia"
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Reviews Section */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Opiniones de nuestros usuarios</Text>
          <View style={styles.reviewsCarouselContainer}>
            <TouchableOpacity
              onPress={handlePrevReview}
              style={styles.carouselButton}
              accessibilityLabel="Botón para ir a la reseña anterior"
            >
              <Ionicons name="chevron-back" size={24} color="#004AAD" />
            </TouchableOpacity>
            <ScrollView
              horizontal
              pagingEnabled
              ref={reviewScrollRef}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsCarousel}
            >
              {reviewsData.map((review, index) => (
                <View key={`review-${index}`} style={[styles.reviewCard, { width: reviewCardWidth }]}>
                  <Ionicons name="person-circle-outline" size={60} color="#ccc" style={{ marginBottom: 10 }} />
                  <Text style={styles.reviewUserName}>{`${review.firstName} ${review.lastName}`}</Text>
                  <Text style={styles.reviewText}>{review.reviewText}</Text>
                  <StarRating stars={4.5} /> {/* Ejemplo con 4.5 estrellas */}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={handleNextReview}
              style={styles.carouselButton}
              accessibilityLabel="Botón para ir a la siguiente reseña"
            >
              <Ionicons name="chevron-forward" size={24} color="#004AAD" />
            </TouchableOpacity>
          </View>
          {/* Botón Mostrar Más */}
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => router.push('/MoreReviews')}
            accessibilityLabel="Botón para mostrar más opiniones"
          >
            <Text style={styles.showMoreButtonText}>Más opiniones</Text> {/* Cambiar texto */}
          </TouchableOpacity>
        </View>
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
    padding: 2,
  },
  profileIcon: {
    width: 53,
    height: 53,
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
    backgroundColor: "#004AAD", // Cambiar a un color más oscuro
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    paddingVertical: 12, // Más espacio interno
    paddingHorizontal: 25,
  },
  surpriseButtonText: {
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    fontSize: 18, // Aumentar tamaño de texto
  },
  bookingsButton: {
    backgroundColor: "blue", // Cambiar a un color más oscuro
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
    fontSize: 26, // Aumentar el tamaño texto
    fontWeight: 'bold',
    color: '#004AAD',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase', // Convertir a mayúsculas
    letterSpacing: 1.2, // Espaciado entre letras
  },
  experiencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.15, // Suavizar la sombra
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, // Aumentar el radio de la sombra
    elevation: 6,
    alignItems: 'center', // Centrar contenido horizontalmente
    justifyContent: 'center', // Centrar contenido verticalmente
  },
  icon: {
    marginBottom: 10,
    textAlign: 'center', // Asegurar que el ícono esté centrado
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
    alignItems: 'center', // Centrar contenido horizontalmente
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
    height: 400,
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  quoteContainer: {
    marginTop: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#004AAD',
    width: '90%',
    alignSelf: 'center',
  },
  quoteContent: {
    flexDirection: 'column', // Cambia a columna para centrar verticalmente
    alignItems: 'center', // Centra horizontalmente
    justifyContent: 'center', // Centra verticalmente
    gap: 15, // Espacio entre la imagen y la frase
  },
  quoteTextContainer: {
    alignItems: 'center', // Centra el texto horizontalmente
    marginTop: 10, // Espacio entre la imagen y el texto
  },
  quoteText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#004AAD',
    textAlign: 'center', // Centra el texto
    marginBottom: 5,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Centra el autor
  },
  quoteMarks: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004AAD',
  },
  quoteImage: {
    width: 100, // Aumenta el tamaño de la imagen
    height: 100,
  },
  reviewsCarouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsCarousel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004AAD',
    textAlign: 'center',
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  reviewRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselButton: {
    padding: 10,
  },
  showMoreButton: {
    marginTop: 20,
    alignSelf: 'center',
    borderColor: '#007ACC', // Cambiar a un tono más suave
    borderWidth: 2, // Añadir borde
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  showMoreButtonText: {
    color: '#007ACC', // Cambiar el texto al mismo color que el borde
    fontWeight: 'bold',
    fontSize: 16,
  },
});