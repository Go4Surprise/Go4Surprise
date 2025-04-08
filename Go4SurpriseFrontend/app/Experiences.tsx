import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { experiencesData } from '../data/experiencesData';
import ExperienceCard from '../components/ExperienceCard';

export default function Experiences() {
    const scrollViewRef = useRef(null);
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
    
    // Determinar el ancho de las tarjetas según el tamaño de la pantalla
    const getCardWidth = () => {
        if (width < 600) {
            // Móvil: 1.5 tarjetas visibles
            return width * 0.65;
        } else if (width < 1024) {
            // Tablet: 2.5 tarjetas visibles
            return width * 0.35;
        } else {
            // Desktop: 3.5+ tarjetas visibles
            return width * 0.25;
        }
    };

    const cardWidth = getCardWidth();

    // Manejar el evento de scroll y actualizar la página activa
    const handleScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const newPage = Math.round(contentOffset / cardWidth);
        if (newPage >= 0 && newPage < experiencesData.length) {
            setActivePage(newPage);
        }
    };

    // Funciones para navegar entre tarjetas
    const scrollToPrevious = () => {
        const newPage = activePage - 1;
        scrollViewRef.current.scrollTo({ x: newPage * cardWidth, animated: true });
        setActivePage(newPage);
    };

    const scrollToNext = () => {
        if (activePage < experiencesData.length - 1 ) {
            const newPage = activePage + 1;
            scrollViewRef.current.scrollTo({ x: newPage * cardWidth, animated: true });
            setActivePage(newPage);
        }
    };

    return (
        <View style={styles.contentBox}>
            <Text style={[
                styles.sectionTitle,
                width >= 768 && styles.sectionTitleDesktop
            ]}>
                Algunas de las experiencias que ofrecemos
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
                    contentOffset={{ x: 5, y: 0 }}
                >
                    {experiencesData.map((exp, index) => (
                        <View 
                            key={index} 
                            style={{ 
                                width: cardWidth, 
                                paddingHorizontal: -2, // Reducido aún más para tarjetas muy compactas
                                opacity: activePage === index ? 1 : 0.85,
                                transform: [{ scale: activePage === index ? 1 : 0.95 }]
                            }}
                        >
                            <ExperienceCard experience={exp} />
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
            
            {/* Indicadores de paginación - solo visibles en móvil y tablet */}
            {width < 768 && (
                <View style={styles.paginationContainer}>
                    {experiencesData.map((_, index) => (
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
    sectionTitleDesktop: {
        fontSize: 24,
        marginBottom: 20
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
        fontWeight: 'bold'
    },
    scrollView: {
        overflow: 'visible'
    },
    scrollViewContent: {
        paddingHorizontal: 15,
        paddingBottom: 5,
        paddingRight: 50 // Espacio adicional al final
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 10
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
    }
});