import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Dimensions, Pressable, ActivityIndicator, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface ReviewMedia {
  id: number;
  file_url: string;
  file_type: string;
}

interface Review {
  id: number;
  user: string;
  stars: string;
  date: string;
  content: string;
  userPicture?: string;
  media?: ReviewMedia[]; // Added media array to store associated files
}

const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  const onHoverIn = () => { setIsHovered(true); };
  const onHoverOut = () => { setIsHovered(false); };
  
  return { isHovered, onHoverIn, onHoverOut };
};

const ReviewCard = ({ review, style }) => {
  const { isHovered, onHoverIn, onHoverOut } = useHover();
  // Add refs for videos
  const videoRefs = useRef({});
  
  return (
    <Pressable 
      onHoverIn={onHoverIn} 
      onHoverOut={onHoverOut}
      style={[
        styles.reviewCard,
        style,
        isHovered && styles.reviewCardHovered
      ]}
    >
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewStars}>{review.stars}</Text>
      </View>
      <Text style={styles.reviewContent}>{review.content}</Text>
      
      {/* Display media files if available */}
      {review.media && review.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {review.media.map((mediaItem) => (
            <View key={mediaItem.id} style={styles.mediaItem}>
              {mediaItem.file_type === 'image' ? (
                <Image 
                  source={{ uri: mediaItem.file_url }} 
                  style={styles.mediaImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.videoWrapper}>
                  <Video
                    ref={ref => { videoRefs.current[mediaItem.id] = ref; }}
                    source={{ uri: mediaItem.file_url }}
                    style={styles.video}
                    useNativeControls
                    resizeMode="cover"
                    isLooping={false}
                    shouldPlay={false}
                    posterSource={{ uri: 'https://img.icons8.com/color/96/000000/video.png' }}
                    posterStyle={styles.videoPoster}
                  />
                  <TouchableOpacity 
                    style={styles.playButton}
                    onPress={() => {
                      const videoRef = videoRefs.current[mediaItem.id];
                      if (videoRef) {
                        videoRef.presentFullscreenPlayer();
                      }
                    }}
                  >
                    <Ionicons name="play-circle" size={40} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.reviewFooter}>
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
        <View style={styles.userInfoContainer}>
          <Text style={styles.reviewUser}>{review.user}</Text>
          {review.date !== '' && <Text style={styles.reviewDate}>{review.date}</Text>}
        </View>
      </View>
    </Pressable>
  );
};

export default function MoreReviews() {
    const router = useRouter();
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const updateLayout = () => {
            setScreenWidth(Dimensions.get('window').width);
        };
        
        Dimensions.addEventListener('change', updateLayout);
        return () => {
            Dimensions.removeEventListener('change', updateLayout);
        };
    }, []);
    
    const fetchReviews = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/reviews/getAll/`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });
            
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
                userPicture: review.user_picture || null,
                media: review.media || [] // Extract media information from API response
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
    
    const getColumnCount = () => {
        if (screenWidth > 768) return 3;
        if (screenWidth > 480) return 2;
        return 1;
    };
    
    const organizeReviewsInColumns = () => {
        const columnCount = getColumnCount();
        const columns = Array.from({ length: columnCount }, () => []);
        
        const horizontalPadding = 20;
        const columnGap = 12;
        const totalGapWidth = (columnCount - 1) * columnGap;
        const availableWidth = screenWidth - horizontalPadding - totalGapWidth;
        const widthFactor = 0.8;
        const cardWidth = (availableWidth / columnCount) * widthFactor;
        
        reviews.forEach((review, ) => {
            const shortestColumnIndex = columns
                .map((column, i) => ({ 
                    index: i, 
                    height: column.reduce((sum, item) => sum + estimateHeight(item.content), 0) 
                }))
                .sort((a, b) => a.height - b.height)[0].index;
                
                if (Object.prototype.hasOwnProperty.call(columns, shortestColumnIndex)) {
                    columns[shortestColumnIndex].push(review);
                }
        });
        
        return { columns, cardWidth };
    };
    
    const estimateHeight = (content) => {
        const baseHeight = 120;
        const contentLength = content.length;
        const estimatedLines = Math.ceil(contentLength / 35);
        return baseHeight + (estimatedLines * 22);
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.push('/HomeScreen')}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Opiniones de usuarios</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#004AAD" />
                    <Text style={styles.loadingText}>Cargando opiniones...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.push('/HomeScreen')}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Opiniones de usuarios</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => void fetchReviews()}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Empty reviews state
    if (reviews.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.push('/HomeScreen')}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Opiniones de usuarios</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>No hay opiniones disponibles</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { columns, cardWidth } = organizeReviewsInColumns();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => router.push('/HomeScreen')}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Opiniones de usuarios</Text>
            </View>
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.masonryContainer}>
                    {columns.map((column, columnIndex) => (
                        <View 
                            key={`column-${columnIndex}`}
                            style={[styles.column, { width: cardWidth }]}
                        >
                            {column.map((review, reviewIndex) => (
                                <ReviewCard
                                    key={`col${columnIndex}-review${reviewIndex}`}
                                    review={review}
                                    style={{backgroundColor: '#f0f6ff'}}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#004AAD',
        textAlign: 'center',
        flex: 1,
        marginRight: 40,
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: '#004AAD',
        fontSize: 16,
        fontWeight: '500',
    },
    scrollContent: {
        padding: 10, // Reduced padding
        alignItems: 'center',
    },
    masonryContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
    },
    column: {
        flexDirection: 'column',
    },
    reviewCard: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        transition: '0.3s',
        cursor: 'pointer',
    },
    reviewCardHovered: {
        transform: [{ translateY: -5 }],
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        backgroundColor: '#f8faff',
        borderColor: 'rgba(0,74,173,0.1)',
    },
    reviewHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 10,
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
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
    userInfoContainer: {
        flex: 1,
    },
    reviewStars: {
        fontSize: 24,
        color: '#FFD700',
        marginBottom: 10,
        textAlign: 'center',
    },
    reviewContent: {
        fontSize: 20,
        color: '#333',
        lineHeight: 22,
        flex: 1,
        textAlign: 'center',
        marginBottom: 14,
        fontStyle: 'italic',
    },
    reviewUser: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewDate: {
        fontSize: 14,
        color: '#777',
        marginTop: 3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    errorText: {
        fontSize: 16,
        color: '#e74c3c',
        marginBottom: 15,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#004AAD',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Add styles for media display
    mediaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 14,
        gap: 8,
    },
    mediaItem: {
        position: 'relative',
        overflow: 'hidden',
    },
    mediaImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    videoWrapper: {
        width: 100,
        height: 100,
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    videoPoster: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    playButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoPlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(0,74,173,0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    videoPlaceholderText: {
        color: '#004AAD',
        fontWeight: 'bold',
    }
});
