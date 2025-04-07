import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';

export default function Reviews({ navigation }) {
    const scrollViewRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [activePage, setActivePage] = useState(0);
    const [width, setWidth] = useState(Dimensions.get('window').width);

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
                            <Text style={styles.reviewUser}>{review.user}</Text>
                            <Text style={styles.reviewStars}>{review.stars}</Text>
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
    reviewUser: { 
        fontSize: 16, 
        fontWeight: 'bold',
        marginBottom: 5
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