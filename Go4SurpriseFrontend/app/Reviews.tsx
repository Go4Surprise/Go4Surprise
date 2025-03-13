import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function Reviews({ navigation }) {
    const reviews = [
        {
            user: 'Juan Pérez',
            stars: '★★★★★',
            date: '1 de Enero, 2023',
            content: '¡Fue una experiencia increíble! Muy recomendable.',
        },
        {
            user: 'María López',
            stars: '★★★★☆',
            date: '15 de Febrero, 2023',
            content: 'Muy divertido, aunque me hubiera gustado más variedad.',
        },
        {
            user: 'Carlos Gómez',
            stars: '★★★★★',
            date: '10 de Marzo, 2023',
            content: 'Definitivamente lo haré otra vez. ¡Muy recomendado!',
        },
        {
            user: 'Laura Martínez',
            stars: '★★★★★',
            date: '15 de Febrero, 2023',
            content: 'Una experiencia única. Volveré sin duda. ¡Totalmente recomendable!'
        },
        {
            user: 'Javier Sánchez',
            stars: '★★★★★',
            date: '5 de Enero, 2023',
            content: 'Increíble servicio. Todo perfecto desde el inicio hasta el final.'
        },
        {
            user: 'Ana Rodríguez',
            stars: '★★★★★',
            date: '22 de Enero, 2023',
            content: '¡Un plan genial! Lo disfruté mucho, totalmente lo que buscaba.'
        },
        {
            user: 'Pablo López',
            stars: '★★★★★',
            date: '1 de Marzo, 2023',
            content: 'Una experiencia inolvidable. Todo estuvo impecable. ¡Muy recomendable!'
        },
        {
            user: 'Marta García',
            stars: '★★★★★',
            date: '7 de Febrero, 2023',
            content: 'Pasamos un día increíble, sin duda repetiré. ¡Lo mejor de todo fue la atención!'
        },
        {
            user: 'Enrique Fernández',
            stars: '★★★★★',
            date: '18 de Marzo, 2023',
            content: 'Perfecto en todos los aspectos. Un plan diferente y divertido. ¡Lo haré de nuevo!'
        }

    ];

    return (
        <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
