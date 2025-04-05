import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../constants/apiUrl';

interface Review {
    id: number;
    user: string;
    stars: string;
    date: string;
    content: string;
    userPicture?: string; // Added user picture field
}

export default function Reviews({ navigation }) {
    const router = useRouter();
    const scrollViewRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [activePage, setActivePage] = useState(0);
    const [width, setWidth] = useState(Dimensions.get('window').width);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Actualizar ancho cuando la orientación cambia
    useEffect(() => {
        const updateLayout = () => {
            setWidth(Dimensions.get('window').width);
        };

        Dimensions.addEventListener('change', updateLayout);
        return () => {
            // Limpieza para versiones más antiguas de React Native
            if (Dimensions.removeEventListener) {
                Dimensions.removeEventListener('change', updateLayout);
            }
        };
    }, []);

    // Fetch reviews from API using the dedicated endpoint for latest 10 reviews
    const fetchReviews = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/reviews/getLatestTen/`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });
            
            // Format the reviews data
            const formattedReviews = response.data.map(review => ({
                id: review.id,
                user: review.user_name || 'Usuario anónimo',
                stars: '★'.repeat(Math.floor(parseFloat(review.puntuacion))) + 
                      '☆'.repeat(5 - Math.floor(parseFloat(review.puntuacion))),
                date: review.booking_date 
                    ? new Date(review.booking_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '',
                content: review.comentario,
                userPicture: review.user_picture || null // Extract user profile picture
            }));
            
            setReviews(formattedReviews);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Error al cargar las opiniones');
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchReviews();
    }, []);

    // Calcular el ancho de cada tarjeta de reseña
    const getCardWidth = () => {
        if (width < 600) {
            return width * 0.7; // Móvil: 70% de la pantalla
        } else if (width < 1024) {
            return width * 0.4; // Tablet: 40% de la pantalla
        } else {
            return width * 0.25; // Desktop: 25% de la pantalla
        }
    };

    const cardWidth = getCardWidth();

    // Función para manejar el scroll y actualizar la página activa
    const handleScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const newPage = Math.round(contentOffset / cardWidth);
        if (newPage >= 0 && newPage < reviews.length) {
            setActivePage(newPage);
        }
    };

    // Función para desplazarse a la tarjeta anterior
    const scrollToPrevious = () => {
        if (activePage > 0 && scrollViewRef.current) {
            const newPage = activePage - 1;
            scrollViewRef.current.scrollTo({ x: newPage * cardWidth, animated: true });
            setActivePage(newPage);
        }
    };

    // Función para desplazarse a la tarjeta siguiente
    const scrollToNext = () => {
        if (activePage < reviews.length - 1 && scrollViewRef.current) {
            const newPage = activePage + 1;
            scrollViewRef.current.scrollTo({ x: newPage * cardWidth, animated: true });
            setActivePage(newPage);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <View style={styles.contentBox}>
                <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#004AAD" />
                    <Text style={styles.loadingText}>Cargando opiniones...</Text>
                </View>
            </View>
        );
    }

    // Show error state
    if (error) {
        return (
            <View style={styles.contentBox}>
                <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </View>
        );
    }

    // Show empty state
    if (reviews.length === 0) {
        return (
            <View style={styles.contentBox}>
                <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay opiniones disponibles todavía</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.contentBox}>
            <Text style={[
                styles.sectionTitle,
                width >= 768 && { fontSize: 24, marginBottom: 20 }
            ]}>
                ¿No te lo crees? Mira la opinión de otras personas
            </Text>
            
            <View style={styles.scrollContainer}>
                {/* Botón de scroll izquierdo - solo en desktop */}
                {width >= 768 && (
                    <TouchableOpacity 
                        style={[styles.scrollButton, styles.scrollButtonLeft]}
                        onPress={scrollToPrevious}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.scrollButtonText, { transform: [{ rotate: '180deg' }] }]}>▸</Text>
                    </TouchableOpacity>
                )}
                
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    snapToInterval={cardWidth}
                    decelerationRate="fast"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {reviews.map((review, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.reviewCard,
                                { 
                                    width: cardWidth - 20,
                                    opacity: activePage === index ? 1 : 0.85,
                                    transform: [{ scale: activePage === index ? 1 : 0.95 }] 
                                }
                            ]}
                        >
                            <View style={styles.reviewHeader}>
                                <View style={styles.profileImageContainer}>
                                    {review.userPicture ? (
                                        <Image 
                                            source={{ uri: review.userPicture }} 
                                            style={styles.profileImage} 
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.profileImage, styles.defaultProfileImage]}>
                                            <Text style={styles.defaultProfileText}>
                                                {review.user.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.reviewUserInfo}>
                                    <Text style={styles.reviewUser}>{review.user}</Text>
                                    <Text style={styles.reviewStars}>{review.stars}</Text>
                                </View>
                            </View>
                            <Text style={styles.reviewDate}>{review.date}</Text>
                            <Text style={styles.reviewContent}>{review.content}</Text>
                        </View>
                    ))}
                </ScrollView>
                
                {/* Botón de scroll derecho - solo en desktop */}
                {width >= 768 && (
                    <TouchableOpacity 
                        style={[styles.scrollButton, styles.scrollButtonRight]}
                        onPress={scrollToNext}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.scrollButtonText}>▸</Text>
                    </TouchableOpacity>
                )}
            </View>
            
            {/* Indicadores de paginación - solo en móvil y tablet */}
            {width < 768 && (
                <View style={styles.paginationContainer}>
                    {reviews.map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.paginationDot,
                                activePage === index && styles.paginationDotActive
                            ]} 
                        />
                    ))}
                </View>
            )}
            
            <TouchableOpacity 
                style={[
                    styles.linkButton,
                    width < 600 ? styles.linkButtonMobile : styles.linkButtonDesktop
                ]} 
                onPress={() => navigation.navigate('MoreReviews')}
            >
                <Text style={width < 600 ? styles.linkTextMobile : styles.linkTextDesktop}>
                    Ver más opiniones
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    contentBox: { 
        padding: 20, 
        marginBottom: 30,
        width: '100%'
    },
    sectionTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 15, 
        color: '#004AAD',
        textAlign: 'center'
    },
    scrollContainer: {
        position: 'relative',
        marginBottom: 15,
        marginHorizontal: 20 // Espacio extra para los botones que ahora están fuera
    },
    scrollButton: {
        position: 'absolute',
        top: '50%',
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 74, 173, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        transform: [{ translateY: -20 }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5
    },
    scrollButtonLeft: {
        left: -20
    },
    scrollButtonRight: {
        right: -20
    },
    scrollButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        transform: [{ rotate: width => width === styles.scrollButtonLeft ? '180deg' : '0deg' }]
    },
    scrollView: {
        overflow: 'visible'
    },
    scrollViewContent: {
        paddingHorizontal: 10,
        paddingBottom: 5,
        paddingRight: 20
    },
    reviewCard: { 
        backgroundColor: '#f9f9f9', 
        padding: 15, 
        borderRadius: 12, 
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 150,
        justifyContent: 'space-between'
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    profileImageContainer: {
        marginRight: 10,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    defaultProfileImage: {
        backgroundColor: '#004AAD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    defaultProfileText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reviewUserInfo: {
        flex: 1,
    },
    reviewUser: { 
        fontSize: 16, 
        fontWeight: 'bold',
        marginBottom: 2,
    },
    reviewStars: { 
        fontSize: 16, 
        color: '#FFD700',
        marginBottom: 5
    },
    reviewDate: { 
        fontSize: 14, 
        color: '#777',
        marginBottom: 8
    },
    reviewContent: { 
        fontSize: 14, 
        color: '#333',
        flexGrow: 1
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 5
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ccc',
        marginHorizontal: 4
    },
    paginationDotActive: {
        backgroundColor: '#004AAD',
        width: 10,
        height: 10,
        borderRadius: 5
    },
    loadingContainer: { 
        height: 200, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        marginTop: 10, 
        fontSize: 14, 
        color: '#666' 
    },
    errorContainer: { 
        height: 200, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    errorText: { 
        fontSize: 14, 
        color: '#e74c3c', 
        textAlign: 'center' 
    },
    emptyContainer: { 
        height: 200, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    emptyText: { 
        fontSize: 14, 
        color: '#666', 
        textAlign: 'center' 
    },
    linkButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8
    },
    linkButtonDesktop: {
        alignSelf: 'center'
    },
    linkButtonMobile: {
        backgroundColor: '#004AAD',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignSelf: 'stretch'
    },
    linkTextDesktop: {
        color: '#004AAD',
        fontWeight: 'bold',
        textDecorationLine: 'underline'
    },
    linkTextMobile: {
        color: 'white',
        fontWeight: 'bold'
    }
});