import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, useWindowDimensions, ScrollView, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '../constants/apiUrl';
import { useLocalSearchParams, useRouter } from "expo-router";

// Importación condicional del WebView solo para plataformas móviles
let WebViewComponent = null;
try {
  // Intentamos importar el WebView solo si no estamos en web
  if (Platform.OS !== 'web') {
    WebViewComponent = require('react-native-webview').WebView;
  }
} catch (error) {
  console.log('WebView no disponible en esta plataforma');
}

const BookingDetailsScreen = () => {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const { width,  } = useWindowDimensions();
  
  // Determinar si estamos en un dispositivo móvil o desktop
  const isMobile = width < 768;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("accessToken");
        setToken(storedToken);
      } catch (error) {
        console.error("Error obteniendo el token:", error);
      }
    };
    void fetchUserData();
  }, []);

  useEffect(() => {
    if (!bookingId) return; // No ejecutar si `bookingId` aún es null
    void fetchBookingDetails();
  }, [bookingId]); // Se ejecuta solo cuando `bookingId` cambia y no es null

  const handlePayment = async () => {
    if (!bookingDetails?.id) {
      console.error("No hay un ID de reserva válido para procesar el pago.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/bookings/iniciar-pago/${bookingDetails.id}/`);
      const { checkout_url } = response.data;
  
      if (checkout_url) {
        if (Platform.OS === 'web') {
          // En web, abrimos en una nueva pestaña
          window.location.href = checkout_url;
        } else if (WebViewComponent) {
          // En móvil con WebView disponible, usamos el WebView
          setPaymentUrl(checkout_url);
          setShowWebView(true);
        } else {
          // Fallback a Linking (abre el navegador predeterminado)
          void Linking.openURL(checkout_url);
        }
      } else {
        console.error("No se recibió una URL de pago.");
      }
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar el evento cuando la navegación del WebView cambia
  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;
    
    // Verificar si la URL es la URL de éxito o cancelación
    // Esto depende de cómo esté configurado tu backend de Stripe
    if (url.includes('/success') || url.includes('/completed')) {
      // El pago fue exitoso, cerrar el WebView y actualizar el estado
      setShowWebView(false);
      // Opcional: refrescar los detalles de la reserva
      fetchBookingDetails();
    } else if (url.includes('/cancel') || url.includes('/failed')) {
      // El pago fue cancelado, cerrar el WebView
      setShowWebView(false);
    }
  };
  
  // Refetch booking details function
  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/bookings/obtener-reserva/${bookingId}/`);
      setBookingDetails(response.data);
      console.log("Detalles de la reserva actualizados:", response.data);
    } catch (error) {
      console.error("Error al obtener la reserva:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6772E5" />
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          isMobile ? styles.scrollContainerMobile : styles.scrollContainerDesktop
        ]}
      >
        <View style={[
          styles.container, 
          isMobile ? styles.containerMobile : styles.containerDesktop
        ]}>
          <View style={[
            styles.detailsBox, 
            isMobile ? styles.detailsBoxMobile : styles.detailsBoxDesktop
          ]}>
            <Text style={[
              styles.title, 
              isMobile ? styles.titleMobile : styles.titleDesktop
            ]}>Detalles de la Reserva</Text>

            <View style={styles.detailsGrid}>
              <View style={[
                styles.detailContainer, 
                isMobile ? styles.detailContainerMobile : styles.detailContainerDesktop
              ]}>
                <Ionicons 
                  name="location-outline" 
                  size={isMobile ? 22 : 24} 
                  color="#444" 
                />
                <Text style={[
                  styles.detailText, 
                  isMobile ? styles.detailTextMobile : styles.detailTextDesktop
                ]}>
                  {bookingDetails.experience.location}
                </Text>
              </View>

              <View style={[
                styles.detailContainer, 
                isMobile ? styles.detailContainerMobile : styles.detailContainerDesktop
              ]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={isMobile ? 22 : 24} 
                  color="#444" 
                />
                <Text style={[
                  styles.detailText, 
                  isMobile ? styles.detailTextMobile : styles.detailTextDesktop
                ]}>
                  {bookingDetails.experience_date}
                </Text>
              </View>

              <View style={[
                styles.detailContainer, 
                isMobile ? styles.detailContainerMobile : styles.detailContainerDesktop
              ]}>
                <Ionicons 
                  name="people-outline" 
                  size={isMobile ? 22 : 24} 
                  color="#444" 
                />
                <Text style={[
                  styles.detailText, 
                  isMobile ? styles.detailTextMobile : styles.detailTextDesktop
                ]}>
                  {bookingDetails.participants} personas
                </Text>
              </View>

              <View style={[
                styles.detailContainer, 
                isMobile ? styles.detailContainerMobile : styles.detailContainerDesktop
              ]}>
                <Ionicons 
                  name="cash-outline" 
                  size={isMobile ? 22 : 24} 
                  color="#444" 
                />
                <Text style={[
                  styles.detailText, 
                  isMobile ? styles.detailTextMobile : styles.detailTextDesktop
                ]}>
                  {bookingDetails.total_price}€
                </Text>
              </View>
            </View>

            {bookingDetails.status === "PENDING" && (
              <TouchableOpacity 
                style={[
                  styles.button, 
                  isMobile ? styles.buttonMobile : styles.buttonDesktop
                ]} 
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={[
                      styles.buttonText, 
                      isMobile ? styles.buttonTextMobile : styles.buttonTextDesktop
                    ]}>
                      Proceder al pago
                    </Text>
                    <Ionicons 
                      name="arrow-forward-outline" 
                      size={isMobile ? 22 : 24} 
                      color="#FFF" 
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal con WebView para el pago (solo visible en plataformas móviles con WebView) */}
      {WebViewComponent && showWebView && (
        <Modal
          visible={showWebView}
          animationType="slide"
          onRequestClose={() => { setShowWebView(false); }}
        >
          <View style={styles.webViewContainer}>
            <View style={styles.webViewHeader}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => { setShowWebView(false); }}
              >
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.webViewTitle}>Pago Seguro</Text>
            </View>
            
            {paymentUrl && (
              <WebViewComponent
                source={{ uri: paymentUrl }}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoader}>
                    <ActivityIndicator size="large" color="#6772E5" />
                  </View>
                )}
              />
            )}
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Estilos base
  scrollContainer: {
    flexGrow: 1,
  },
  scrollContainerMobile: {
    padding: 10,
  },
  scrollContainerDesktop: {
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    alignItems: "center", 
    justifyContent: "center",
  },
  containerMobile: {
    width: "100%",
    paddingVertical: 10,
  },
  containerDesktop: {
    width: "100%",
    paddingVertical: 20,
    maxWidth: 900,
    marginHorizontal: "auto",
  },
  detailsBox: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  detailsBoxMobile: {
    width: "100%",
    marginTop: 10,
  },
  detailsBoxDesktop: {
    width: "70%",
    marginTop: 20,
    alignSelf: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  titleMobile: {
    fontSize: 20,
  },
  titleDesktop: {
    fontSize: 24,
  },
  detailsGrid: {
    width: "100%",
  },
  detailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailContainerMobile: {
    paddingVertical: 8,
  },
  detailContainerDesktop: {
    paddingVertical: 12,
  },
  detailText: {
    marginLeft: 10,
    color: "#555",
  },
  detailTextMobile: {
    fontSize: 16,
  },
  detailTextDesktop: {
    fontSize: 18,
  },
  button: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6772E5",
    borderRadius: 10,
    minHeight: 50,
  },
  buttonMobile: {
    padding: 15,
  },
  buttonDesktop: {
    padding: 16,
    maxWidth: 300,
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginRight: 10,
  },
  buttonTextMobile: {
    fontSize: 16,
  },
  buttonTextDesktop: {
    fontSize: 18,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  // Estilos para el WebView Modal
  webViewContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 5,
  },
  webViewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 40, // Para compensar el espacio del botón de cerrar
    color: "#333",
  },
  webViewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});

export default BookingDetailsScreen;