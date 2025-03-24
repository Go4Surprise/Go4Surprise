import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function Reviews({ navigation }) {
    // Add ref for the ScrollView
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Add state for tracking mouse drag
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const reviews = [
        {
            user: 'Juan Pérez',
            stars: '★★★★★',
            date: '1 de Enero, 2025',
            content: '¡Fue una experiencia increíble! Muy recomendable.',
        },
        {
            user: 'María López',
            stars: '★★★★☆',
            date: '15 de Febrero, 2025',
            content: 'Muy divertido, aunque me hubiera gustado más variedad.',
        },
        {
            user: 'Carlos Gómez',
            stars: '★★★★★',
            date: '10 de Marzo, 2025',
            content: 'Definitivamente lo haré otra vez. ¡Muy recomendado!',
        },
        {
            user: 'Laura Martínez',
            stars: '★★★★★',
            date: '15 de Febrero, 2025',
            content: 'Una experiencia única. Volveré sin duda. ¡Totalmente recomendable!'
        },
        {
            user: 'Javier Sánchez',
            stars: '★★★★★',
            date: '5 de Enero, 2025',
            content: 'Increíble servicio. Todo perfecto desde el inicio hasta el final.'
        },
        {
            user: 'Ana Rodríguez',
            stars: '★★★★★',
            date: '28 de Diciembre, 2024',
            content: '¡Un plan genial! Lo disfruté mucho, totalmente lo que buscaba.'
        },
        {
            user: 'Pablo López',
            stars: '★★★★★',
            date: '1 de Marzo, 2025',
            content: 'Una experiencia inolvidable. Todo estuvo impecable. ¡Muy recomendable!'
        },
        {
            user: 'Marta García',
            stars: '★★★★★',
            date: '7 de Febrero, 2025',
            content: 'Pasamos un día increíble, sin duda repetiré. ¡Lo mejor de todo fue la atención!'
        },
        {
            user: 'Enrique Fernández',
            stars: '★★★★★',
            date: '18 de Marzo, 2025',
            content: 'Perfecto en todos los aspectos. Un plan diferente y divertido. ¡Lo haré de nuevo!'
        }

    ];

    // Mouse event handlers for drag scrolling
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX);
        
        if (scrollViewRef.current) {
            setScrollLeft(scrollViewRef.current.getScrollableNode().scrollLeft);
        }
        
        // Prevent default to avoid text selection during drag
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        
        const x = e.pageX;
        const distance = startX - x;
        
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: scrollLeft + distance, animated: false });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Add effect to handle mouse up outside the component
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };
        
        document.addEventListener('mouseup', handleGlobalMouseUp);
        
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX);
        
        if (scrollViewRef.current) {
            setScrollLeft(scrollViewRef.current.getScrollableNode().scrollLeft);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        
        const x = e.touches[0].pageX;
        const distance = startX - x;
        
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: scrollLeft + distance, animated: false });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ 
                    cursor: isDragging ? 'grabbing' : 'grab',
                    marginBottom: 5
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
            <Text style={styles.linkText} onPress={() => navigation.navigate('MoreReviews')}>
                Más opiniones
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    contentBox: {
        padding: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#004AAD',
    },
    reviewCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        marginRight: 15,
        width: 200,
    },
    reviewUser: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewStars: {
        fontSize: 16,
        color: '#FFD700',
    },
    reviewDate: {
        fontSize: 14,
        color: '#777',
    },
    reviewContent: {
        fontSize: 14,
        color: '#333',
    },
    linkText: {
        color: 'blue',
        fontWeight: 'bold',
        textAlign: 'center',
        borderRadius: 8,
        padding: 10,
    },
});
