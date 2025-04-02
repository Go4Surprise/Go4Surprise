import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Reviews() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const reviews = [
        { user: 'Juan Pérez', stars: '★★★★★', date: '1 de Enero, 2025', content: '¡Fue una experiencia increíble! Muy recomendable.' },
        { user: 'María López', stars: '★★★★☆', date: '15 de Febrero, 2025', content: 'Muy divertido, aunque me hubiera gustado más variedad.' },
        { user: 'Carlos Gómez', stars: '★★★★★', date: '10 de Marzo, 2025', content: 'Definitivamente lo haré otra vez. ¡Muy recomendado!' },
        { user: 'Laura Martínez', stars: '★★★★★', date: '15 de Febrero, 2025', content: 'Una experiencia única. Volveré sin duda. ¡Totalmente recomendable!' },
        { user: 'Javier Sánchez', stars: '★★★★★', date: '5 de Enero, 2025', content: 'Increíble servicio. Todo perfecto desde el inicio hasta el final.' },
        { user: 'Ana Rodríguez', stars: '★★★★★', date: '28 de Diciembre, 2024', content: '¡Un plan genial! Lo disfruté mucho, totalmente lo que buscaba.' },
        { user: 'Pablo López', stars: '★★★★★', date: '1 de Marzo, 2025', content: 'Una experiencia inolvidable. Todo estuvo impecable. ¡Muy recomendable!' },
        { user: 'Marta García', stars: '★★★★★', date: '7 de Febrero, 2025', content: 'Pasamos un día increíble, sin duda repetiré. ¡Lo mejor de todo fue la atención!' },
        { user: 'Enrique Fernández', stars: '★★★★★', date: '18 de Marzo, 2025', content: 'Perfecto en todos los aspectos. Un plan diferente y divertido. ¡Lo haré de nuevo!' }
    ];

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
    linkText: { color: 'blue', fontWeight: 'bold', textAlign: 'center', borderRadius: 8, padding: 10 }
});