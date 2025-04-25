import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const reviews = [
  { id: 1, firstName: "Juan", lastName: "Pérez", stars: 5, text: "¡Increíble experiencia! Muy recomendable." },
  { id: 2, firstName: "María", lastName: "Gómez", stars: 4, text: "Me encantó la sorpresa, fue inolvidable." },
  { id: 3, firstName: "Carlos", lastName: "López", stars: 5, text: "Un servicio excelente, repetiré seguro." },
  { id: 4, firstName: "Ana", lastName: "Martínez", stars: 4, text: "La mejor experiencia que he tenido en mucho tiempo." },
  { id: 5, firstName: "Luis", lastName: "Hernández", stars: 5, text: "¡Sorprendente y emocionante! 10/10." },
];

// Crear un componente reutilizable para las estrellas
const StarRating = ({ stars }: { stars: number }) => (
  <View style={styles.starsContainer}>
    {Array.from({ length: stars }).map((_, i) => (
      <Ionicons key={i} name="star" size={16} color="#FFD700" />
    ))}
  </View>
);

export default function Reviews() {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.8;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    const nextIndex = Math.min(currentIndex + 1, reviews.length - 1);
    scrollRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
    setCurrentIndex(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    scrollRef.current?.scrollTo({ x: prevIndex * cardWidth, animated: true });
    setCurrentIndex(prevIndex);
  };

  return (
    <View style={[styles.container, { paddingBottom: 20 }]}>
      <TouchableOpacity
        style={styles.arrowButton}
        onPress={handlePrev}
        accessibilityLabel="Botón para ir a la reseña anterior"
      >
        <Ionicons name="chevron-back" size={24} color="#004AAD" />
      </TouchableOpacity>
      <ScrollView
        horizontal
        ref={scrollRef}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {reviews.map((review) => (
          <View key={review.id} style={[styles.reviewCard, { width: cardWidth }]}>
            <Image
              source={require('../assets/images/user-logo-none.png')}
              style={styles.userImage}
            />
            <Text style={styles.userName}>{`${review.firstName} ${review.lastName}`}</Text>
            <StarRating stars={review.stars} />
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.arrowButton}
        onPress={handleNext}
        accessibilityLabel="Botón para ir a la siguiente reseña"
      >
        <Ionicons name="chevron-forward" size={24} color="#004AAD" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
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
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004AAD',
    marginBottom: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  arrowButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
});
