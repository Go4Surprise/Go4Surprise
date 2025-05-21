import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  TextInput,
  Image
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { BASE_URL } from '../constants/apiUrl';
import * as ImagePicker from 'expo-image-picker';


interface Reserva {
  id: string;
  booking_date: Date;
  experience_date: Date;
  participants: number;
  price: number;
  status: string;
  total_price: number;
  cancellable: boolean;
  time_preference: string;
  city: string;
  experience_hint: string;
  paid: boolean;
  experience: {
    id: string;
    time_preference: string;
    location: string;
  };
}

const MyBookings = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("activas");
  const [reviewedExperiences, setReviewedExperiences] = useState<string[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Array<{ uri: string, type: string }>>([]);
  const [unpaidBookings, setUnpaidBookings] = useState<Reserva[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    if (unpaidBookings.length > 0 && selectedTab !== "pendientes") {
      // Inicia el parpadeo solo si no está seleccionada la pestaña de pendientes
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      // Detiene la animación y restablece la opacidad si se selecciona la pestaña
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
        fadeAnim.setValue(1); // Asegura que vuelva a opacidad completa
      }
    }
  }, [unpaidBookings, selectedTab]);


  useEffect(() => {
    void fetchReservas();
    void fetchUserReviews();
    fadeIn();
  }, []);

  const fetchUserReviews = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("id");

      if (!token || !userId) return;

      const response = await axios.get(`${BASE_URL}/reviews/getByUser/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        // Extract experience IDs that the user has already reviewed
        const experienceIds = response.data.map(review => review.experience);
        setReviewedExperiences(experienceIds);
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  const fetchReservas = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const usuarioId = await AsyncStorage.getItem("id"); // ✅ UUID del modelo Usuario

      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }

      const response = await axios.get(`${BASE_URL}/bookings/users/${usuarioId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      console.log("Datos de la API:", response.data); // Agregado para depuración

      if (Array.isArray(response.data)) {
        const sorted = response.data
          .map(item => ({
            ...item,
            experience_date: new Date(item.experience_date),
            booking_date: new Date(item.booking_date),
            time_preference: item.experience.time_preference,
            city: item.experience.location,
          }))
          .sort((a, b) => a.experience_date.getTime() - b.experience_date.getTime());
        setReservas(sorted);
        setUnpaidBookings(sorted.filter(item => item.paid === false));
        console.log("Reservas no pagadas:", unpaidBookings); // Agregado para depuración
        console.log("Reservas ordenadas:", sorted); // Agregado para depuración
      } else {
        throw new Error("Formato de datos incorrecto");
      }
    } catch (error) {
      console.error("Error al obtener las reservas:", error); // Agregado para depuración
      setError("Error al obtener las reservas");
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const isCancellable = (reserva: Reserva) => {
    const currentDate = new Date();
    const booking_date = new Date(reserva.booking_date);
    const now_date = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000);
    const timeDifference = now_date.getTime() - booking_date.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    // La reserva es cancelable si la fecha de la experiencia es más de 24 horas en el futuro
    return hoursDifference < 24;
  };

  const cancelarReserva = async () => {
    if (!selectedBookingId) return;

    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }

      console.log(`Sending request to update booking with ID: ${selectedBookingId}`); // Debugging log
      const response = await axios.put(`${BASE_URL}/bookings/cancel/${selectedBookingId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        console.log("Booking updated successfully:", response.data); // Debugging log
        Alert.alert("Reserva cancelada", "La reserva ha sido cancelada exitosamente.");
        setReservas((prevReservas) =>
          prevReservas.map((reserva) =>
            reserva.id === selectedBookingId ? { ...reserva, status: "CANCELLED" } : reserva
          )
        );
      }
    } catch (error) {
      console.error("Error al actualizar la reserva:", error); // Debugging log
      Alert.alert("Error", "No se pudo cancelar la reserva. Inténtalo de nuevo.");
    } finally {
      setModalVisible(false);
      setModalVisible(false);
    }
  };

  const reservasFiltradas = reservas.filter((item) => {
    const fecha = new Date(item.experience_date);
    const ahora = new Date();

    if (selectedTab === "activas") {
      return item.status !== "CANCELLED" && fecha >= ahora && item.paid;
    } else if (selectedTab === "pasadas") {
      return item.status !== "CANCELLED" && fecha < ahora && item.paid;
    } else if (selectedTab === "canceladas") {
      return item.status === "CANCELLED";
    } else if (selectedTab === "pendientes") {
      return !item.paid && item.status !== "CANCELLED";
    }

    return false;
  });

  const openGoogleCalendar = (item: Reserva) => {
    const startDate = new Date(item.experience_date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2h

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Go4Surprise&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=Reserva+sorpresa+en+${item.city}&location=${item.city}`;

    Linking.openURL(url);
  };

  const openReviewModal = (experienceId: string) => {
    setSelectedExperienceId(experienceId);
    setReviewRating(5);
    setReviewComment("");
    setReviewModalVisible(true);
  };

  const pickMedia = async () => {
    if (selectedMedia.length >= 5) {
      Alert.alert('Límite alcanzado', 'Solo puedes añadir hasta 5 archivos multimedia.');
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    };

    let result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      const type = selectedAsset.uri.endsWith('.mp4') ? 'video' : 'image';

      setSelectedMedia(prev => [...prev, { uri: selectedAsset.uri, type }]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const submitReview = async () => {
    if (!selectedExperienceId) return;

    try {
      setSubmittingReview(true);
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("id");

      if (!token || !userId) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }

      const formData = new FormData();

      formData.append('puntuacion', reviewRating.toString());
      formData.append('comentario', reviewComment);
      formData.append('experience', selectedExperienceId);
      formData.append('user', userId);

      // Process media files
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];

        if (Platform.OS === 'web') {
          try {
            // For web: Convert data URI to blob synchronously before sending
            const response = await fetch(media.uri);
            const blob = await response.blob();
            const filename = `file${i}.${media.uri.split(';')[0].split('/')[1] || 'jpg'}`;
            formData.append('media_files', blob, filename);
          } catch (err) {
            console.error('Error processing web file:', err);
          }
        } else {
          // For mobile: Make sure we're creating the file object correctly
          const filename = media.uri.split('/').pop() || `file${i}`;
          const match = /\.(\w+)$/.exec(filename);
          const fileType = match ? match[1] : (media.type === 'video' ? 'mp4' : 'jpg');
          const mimeType = media.type === 'video' ? `video/${fileType}` : `image/${fileType}`;

          // Explicitly define the file structure as expected by the backend
          formData.append('media_files', {
            uri: media.uri,
            type: mimeType,
            name: filename
          } as any);
        }
      }

      // Log the FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of (formData as any).entries()) {
        console.log(`${key}: ${typeof value === 'object' ? 'File object' : value}`);
      }

      const response = await axios.post(`${BASE_URL}/reviews/create/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });

      if (response.status === 201) {
        // Add experience to reviewed list to prevent additional reviews
        setReviewedExperiences(prev => [...prev, selectedExperienceId]);
        Alert.alert("Éxito", "Tu reseña ha sido enviada. ¡Gracias por tu opinión!");
        setReviewModalVisible(false);
      }
    } catch (error: any) {
      console.error("Error al enviar la reseña:", error);

      // Handle case where user already reviewed this experience
      if (error.response?.status === 400 &&
        error.response?.data?.error?.includes("Ya has dejado una reseña")) {
        Alert.alert("Error", "Ya has dejado una reseña para esta experiencia.");
        setReviewedExperiences(prev =>
          prev.includes(selectedExperienceId)
            ? prev
            : [...prev, selectedExperienceId as string]
        );
      } else {
        Alert.alert("Error", "No se pudo enviar la reseña. Inténtalo de nuevo.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderItem = ({ item }: { item: Reserva }) => {
    const timePreferenceMap: { [key: string]: string } = {
      MORNING: "Mañana",
      AFTERNOON: "Tarde",
      NIGHT: "Noche",
    };

    {
      item.experience_hint && (  // Solo mostramos la pista si existe
        <Text style={styles.label}>
          <Ionicons name="bulb" size={16} color="#FF9900" /> {" "}
          <Text style={styles.bold}>Pista:</Text> {item.experience_hint}
        </Text>

      )
    }


    const hasReviewed = reviewedExperiences.includes(item.experience.id);
    const isCancelled = item.status === "CANCELLED";
    const isConfirmed = item.status === "CONFIRMED";
    const isPaid = item.paid;

    return (

      <View
        style={[
          styles.card,
          isCancelled && styles.cancelledCard, // Apply red tone and reduced opacity for canceled bookings
          isConfirmed && styles.confirmedCard, // Apply green tone and reduced opacity for confirmed bookings
        ]}
      >
        <Text style={styles.label}>
          <Ionicons name="location" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Ciudad:</Text> {item.city}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="calendar" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Fecha:</Text>{" "}
          {format(new Date(item.experience_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="people" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Participantes:</Text> {item.participants}
        </Text>

        <Text style={styles.label}>
          <Ionicons name="pricetag" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Precio Total:</Text> {item.total_price}€
        </Text>

        <Text style={styles.label}>
          <Ionicons name="time" size={16} color="#1877F2" />{" "}
          <Text style={styles.bold}>Preferencia Horaria:</Text>{" "}
          {timePreferenceMap[item.time_preference] || item.time_preference}
        </Text>

        {!isPaid && (
          <View
            style={styles.paymentButtonsContainer}>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => router.push({ pathname: "/BookingDetails", params: { bookingId: item.id } })}>
              <Ionicons name="card" size={16} color="white" />
              <Text style={styles.buttonText}>Pagar ahora</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isCancelled && isCancellable(item) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSelectedBookingId(item.id);
              setModalVisible(true);
            }}
          >
            <Ionicons name="close-circle" size={16} color="white" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        {isPaid && !isCancelled && isAfter(new Date(item.experience_date), new Date()) && (
          <View style={styles.calendarButtonsContainer}>
            <TouchableOpacity
              style={styles.googleCalendarButton}
              onPress={() => openGoogleCalendar(item)}
            >
              <Ionicons name="logo-google" size={16} color="white" />
              <Text style={styles.buttonText}>Añadir a Google Calendar</Text>
            </TouchableOpacity>
          </View>
        )}

        {isBefore(new Date(item.experience_date), new Date()) && !hasReviewed && !isCancelled
          && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => openReviewModal(item.experience.id)}
            >
              <Ionicons name="star" size={16} color="white" />
              <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
            </TouchableOpacity>
          )}

        {!isCancelled && hasReviewed && (
          <View style={styles.alreadyReviewedContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.alreadyReviewedText}>Reseña enviada</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#1877F2" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <Animated.View style={[styles.container]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.push("/HomeScreen")}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Mis Reservas</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "activas" && styles.tabButtonActive]}
          onPress={() => setSelectedTab("activas")}
        >
          <Text style={[styles.tabText, selectedTab === "activas" && styles.tabTextActive]}>Activas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "pasadas" && styles.tabButtonActive]}
          onPress={() => { setSelectedTab("pasadas"); }}
        >
          <Text style={[styles.tabText, selectedTab === "pasadas" && styles.tabTextActive]}>Pasadas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "canceladas" && styles.tabButtonActive]}
          onPress={() => { setSelectedTab("canceladas"); }}
        >
          <Text style={[styles.tabText, selectedTab === "canceladas" && styles.tabTextActive]}>Canceladas</Text>
        </TouchableOpacity>
      </View>

      {unpaidBookings.length > 0 && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={[
              styles.pendingPaymentButton,
              selectedTab === "pendientes" && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab("pendientes")}
          >
            <Text
              style={[
                styles.pendingPaymentText,
                selectedTab === "pendientes" && styles.tabTextActive,
              ]}
            >
              Pendientes de pago
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <FlatList
        data={reservasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.noReservationsText}>
            {selectedTab === "activas"
              ? "No tienes reservas activas."
              : selectedTab === "pasadas"
                ? "No tienes reservas pasadas."
                : selectedTab === "canceladas"
                  ? "No tienes reservas canceladas."
                  : "No tienes reservas pendientes de pago."}
          </Text>
        }
      />


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Reserva</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres cancelar esta reserva?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => { void cancelarReserva(); }}
              >
                <Text style={styles.modalConfirmButtonText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <Text style={styles.modalTitle}>Dejar una Reseña</Text>

            <Text style={styles.ratingLabel}>Puntuación:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => { setReviewRating(star); }}
                >
                  <Ionicons
                    name={reviewRating >= star ? "star" : "star-outline"}
                    size={32}
                    color={reviewRating >= star ? "#FFD700" : "#ccc"}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.commentLabel}>Comentario:</Text>
            <TextInput
              style={styles.commentInput}
              multiline={true}
              numberOfLines={4}
              placeholder="Comparte tu experiencia..."
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <Text style={styles.modalLabel}>Añadir fotos o videos (máx. 5)</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickMedia}>
              <Text style={styles.uploadButtonText}>Seleccionar archivo</Text>
            </TouchableOpacity>

            {selectedMedia.length > 0 && (
              <FlatList
                horizontal
                data={selectedMedia}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.mediaPreviewContainer}>
                    {item.type === 'image' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                    ) : (
                      <View style={styles.videoPreview}>
                        <Ionicons name="videocam" size={24} color="#004AAD" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            <View style={[styles.modalButtons, styles.reviewModalButtons]}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitReviewButton, { opacity: submittingReview ? 0.7 : 1 }]}
                onPress={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitReviewButtonText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
    color: "#1e1e1e",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollViewContainer: {
    paddingBottom: 20, // Espacio extra en la parte inferior para el desplazamiento
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 10,
    maxWidth: '90%',
    alignSelf: 'center',
  },

  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  tabButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  tabText: {
    color: '#333',
    fontWeight: '600',
  },

  tabTextActive: {
    color: '#fff',
  },
  calendarButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 8,
    borderRadius: 8,
  },

  calendarButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "bold",
  },
  calendarButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },

  paymentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },

  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9900', // naranja
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },

  googleCalendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF', // rojo Google
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  appleCalendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000', // negro Apple
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#e63946",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  noReservationsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  card: {
    backgroundColor: "#fefefe",
    padding: 18,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  label: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "600",
    color: "#222",
  },
  status: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 12,
    fontSize: 14,
    alignSelf: "flex-start",
  },
  statusConfirmed: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusCancelled: {
    backgroundColor: "#fdecea",
    color: "#b02a37",
  },
  cancelButton: {
    backgroundColor: "#e63946",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  reviewButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  reviewButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 20,
    zIndex: 2,
  },
  cancelledCard: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffcccc",
    opacity: 0.9,
  },
  confirmedCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#c6f6d5",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e1e1e",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#e63946",
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  reviewModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    maxHeight: "80%",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 10,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 10,
  },
  commentInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginTop: 5,
    padding: 10,
    textAlignVertical: "top",
  },
  submitReviewButton: {
    flex: 1,
    backgroundColor: "#1877F2",
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  submitReviewButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  reviewModalButtons: {
    marginTop: 20,
  },
  alreadyReviewedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginTop: 10,
  },
  alreadyReviewedText: {
    color: "#4CAF50",
    marginLeft: 5,
    fontWeight: "500",
  },
  uploadButton: {
    backgroundColor: '#004AAD',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mediaPreviewContainer: {
    position: 'relative',
    margin: 5,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  videoPreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  pendingPaymentButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF9900',
  },
  pendingPaymentText: {
    color: '#333',
    fontWeight: '600',
  },

});


export default MyBookings;