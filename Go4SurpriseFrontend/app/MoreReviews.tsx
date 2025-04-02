import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

// Custom hook for handling hover state
const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  const onHoverIn = () => setIsHovered(true);
  const onHoverOut = () => setIsHovered(false);
  
  return { isHovered, onHoverIn, onHoverOut };
};

// Review card component with hover effect
const ReviewCard = ({ review, style }) => {
  const { isHovered, onHoverIn, onHoverOut } = useHover();
  
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
      <Text style={styles.reviewStars}>{review.stars}</Text>
      <Text style={styles.reviewContent}>{review.content}</Text>
      <View style={styles.reviewFooter}>
        <Text style={styles.reviewUser}>{review.user}</Text>
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>
    </Pressable>
  );
};

export default function MoreReviews() {
    const router = useRouter();
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    
    // Handle screen dimension changes
    useEffect(() => {
        const updateLayout = () => {
            setScreenWidth(Dimensions.get('window').width);
        };
        
        Dimensions.addEventListener('change', updateLayout);
        return () => {
            // For newer React Native versions
            Dimensions.removeEventListener('change', updateLayout);
        };
    }, []);
    
    // Calculate number of columns based on screen width
    const getColumnCount = () => {
        if (screenWidth > 768) return 3;
        if (screenWidth > 480) return 2;
        return 1;
    };
    
    // Organize reviews into balanced columns
    const organizeReviewsInColumns = () => {
        const columnCount = getColumnCount();
        const columns = Array.from({ length: columnCount }, () => []);
        
        const horizontalPadding = 20;
        const columnGap = 12;
        const totalGapWidth = (columnCount - 1) * columnGap;
        const availableWidth = screenWidth - horizontalPadding - totalGapWidth;
        const widthFactor = 0.8;
        const cardWidth = (availableWidth / columnCount) * widthFactor;
        
        reviews.forEach((review, index) => {
            const shortestColumnIndex = columns
                .map((column, i) => ({ 
                    index: i, 
                    height: column.reduce((sum, item) => sum + estimateHeight(item.content), 0) 
                }))
                .sort((a, b) => a.height - b.height)[0].index;
                
            columns[shortestColumnIndex].push(review);
        });
        
        return { columns, cardWidth };
    };
    
    const estimateHeight = (content) => {
        const baseHeight = 120;
        const contentLength = content.length;
        const estimatedLines = Math.ceil(contentLength / 35);
        return baseHeight + (estimatedLines * 22);
    };

    const reviews = [
        { user: 'Juan Pérez', stars: '★★★★★', date: '1 de Enero, 2025', content: '¡Fue una experiencia increíble! Muy recomendable.' },
        { user: 'María López', stars: '★★★★☆', date: '15 de Febrero, 2025', content: 'Muy divertido, aunque me hubiera gustado más variedad. Aun así, el precio valió la pena y me encantó la sorpresa. Definitivamente repetiría la experiencia.' },
        { user: 'Carlos Gómez', stars: '★★★★★', date: '10 de Marzo, 2025', content: 'Definitivamente lo haré otra vez. ¡Muy recomendado!' },
        { user: 'Laura Martínez', stars: '★★★★★', date: '15 de Febrero, 2025', content: 'Una experiencia única. Volveré sin duda. ¡Totalmente recomendable!' },
        { user: 'Javier Sánchez', stars: '★★★★★', date: '5 de Enero, 2025', content: 'Increíble servicio. Todo perfecto desde el inicio hasta el final. El equipo fue muy atento y la sorpresa superó mis expectativas. La organización fue impecable y todo salió según lo planeado.' },
        { user: 'Ana Rodríguez', stars: '★★★★★', date: '28 de Diciembre, 2024', content: '¡Un plan genial! Lo disfruté mucho, totalmente lo que buscaba.' },
        { user: 'Pablo López', stars: '★★★★★', date: '1 de Marzo, 2025', content: 'Una experiencia inolvidable. Todo estuvo impecable. ¡Muy recomendable!' },
        { user: 'Marta García', stars: '★★★★☆', date: '7 de Febrero, 2025', content: 'Pasamos un día increíble, sin duda repetiré. ¡Lo mejor de todo fue la atención!' },
        { user: 'Enrique Fernández', stars: '★★★★★', date: '18 de Marzo, 2025', content: 'Perfecto en todos los aspectos. Un plan diferente y divertido. ¡Lo haré de nuevo!' },
        { user: 'Sofía Ruiz', stars: '★★★★★', date: '5 de Abril, 2025', content: 'Superó todas mis expectativas. La organización fue perfecta y la sorpresa fue increíble. No puedo esperar a probar otra experiencia. El equipo fue muy profesional y amable.' },
        { user: 'Daniel Torres', stars: '★★★★☆', date: '12 de Mayo, 2025', content: 'Gran experiencia, muy original.' },
        { user: 'Carmen Navarro', stars: '★★★★★', date: '23 de Junio, 2025', content: 'Me encantó todo. Desde la atención al cliente hasta la experiencia en sí. Fue un día inolvidable y lo recomendaría a cualquiera que busque algo diferente y emocionante.' },
        { user: 'Roberto Gil', stars: '★★★★★', date: '8 de Julio, 2025', content: 'Increíble desde el principio hasta el final. Repetiré seguro.' },
        { user: 'Lucía Vázquez', stars: '★★★★☆', date: '17 de Agosto, 2025', content: 'Una experiencia muy bien organizada y llena de sorpresas. El equipo pensó en todos los detalles.' },
        { user: 'Roberto Gil', stars: '★★★★★', date: '8 de Julio, 2025', content: 'Increíble desde el principio hasta el final. Repetiré seguro.' }
    ];

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
    reviewFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 10,
        marginTop: 6,
    },
    reviewUser: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    reviewDate: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginTop: 3,
    },
});
