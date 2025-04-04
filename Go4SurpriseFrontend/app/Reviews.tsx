import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';

interface Review {
    id: number;
    user: string;
    stars: string;
    date: string;
    content: string;
}

export default function Reviews() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                content: review.comentario
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

    // Consolidated handlers for mouse events
    const handleInteractionStart = (x, isTouch = false) => {
        setIsDragging(true);
        setStartX(x);
        if (scrollViewRef.current) {
            setScrollLeft(scrollViewRef.current.getScrollableNode().scrollLeft);
        }
        if (!isTouch) event.preventDefault();
    };

    const handleInteractionMove = (x) => {
        if (!isDragging) return;
        const distance = startX - x;
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: scrollLeft + distance, animated: false });
        }
    };

    // Effect for handling document-level mouse up
    useEffect(() => {
        const handleGlobalMouseUp = () => isDragging && setIsDragging(false);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => { document.removeEventListener('mouseup', handleGlobalMouseUp); };
    }, [isDragging]);

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
            <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', marginBottom: 5 }}
                onMouseDown={(e) => { handleInteractionStart(e.pageX); }}
                onMouseMove={(e) => { handleInteractionMove(e.pageX); }}
                onMouseUp={() => { setIsDragging(false); }}
                onMouseLeave={() => { setIsDragging(false); }}
                onTouchStart={(e) => { handleInteractionStart(e.touches[0].pageX, true); }}
                onTouchMove={(e) => { handleInteractionMove(e.touches[0].pageX); }}
                onTouchEnd={() => { setIsDragging(false); }}
                scrollEventThrottle={16}
                decelerationRate="normal"
            >
                {reviews.map((review, index) => (
                    <View key={index} style={styles.reviewCard}>
                        <Text style={styles.reviewUser}>{review.user}</Text>
                        <Text style={styles.reviewStars}>{review.stars}</Text>
                        <Text style={styles.reviewDate}>{review.date}</Text>
                        <Text style={styles.reviewContent}>{review.content}</Text>
                    </View>
                ))}
            </ScrollView>
            <Text style={styles.linkText} onPress={() => router.push("/MoreReviews")}>
                Más opiniones
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    contentBox: { padding: 20, marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#004AAD' },
    reviewCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginRight: 15, width: 200 },
    reviewUser: { fontSize: 16, fontWeight: 'bold' },
    reviewStars: { fontSize: 16, color: '#FFD700' },
    reviewDate: { fontSize: 14, color: '#777' },
    reviewContent: { fontSize: 14, color: '#333' },
    linkText: { color: 'blue', fontWeight: 'bold', textAlign: 'center', borderRadius: 8, padding: 10 },
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
    }
});