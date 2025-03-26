import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const BookingDetailsScreen = () => {
  const navigation = useNavigation();

  // Datos ficticios de la reserva
  const bookingDetails = {
    city: "Sevilla",
    date: "10 de Abril, 2025",
    duration: "2 horas",
    price: "30€ (Regular)",
    participants: 2,
    discard_category: "Cultura",
    image:
      "https://www.andaluciatravelguide.com/wp-content/uploads/2013/12/sevilla-sunset-skyline-1140x420.jpg", // Imagen de Unsplash
  };

  const handlePayment = () => {
    console.log("Redirigiendo a Stripe...");
    // Aquí más adelante integrarás Stripe
  };

  return (
    <View style={styles.container}>
      {/* Imagen de la ciudad */}
      <Image source={{ uri: bookingDetails.image }} style={styles.image} />

      {/* Contenedor de detalles */}
      <View style={styles.detailsBox}>
        <Text style={styles.title}>Detalles de la Reserva</Text>

        <View style={styles.detailContainer}>
          <Ionicons name="location-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.city}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="calendar-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.date}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="time-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.duration}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="people-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.participants} personas</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="close-circle-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.discard_category}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Ionicons name="cash-outline" size={22} color="#444" />
          <Text style={styles.detailText}>{bookingDetails.price}</Text>
        </View>

        {/* Botón de pago */}
        <TouchableOpacity style={styles.button} onPress={handlePayment}>
          <Text style={styles.buttonText}>Proceder al pago</Text>
          <Ionicons name="arrow-forward-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  detailsBox: {
    width: "90%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    marginTop: -30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  detailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#555",
  },
  button: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6772E5",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 10,
  },
});

export default BookingDetailsScreen;
