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
  SafeAreaView,
  TextInput,
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isBefore, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BASE_URL } from '../constants/apiUrl';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

interface Reserva {
  id: string;
  booking_date: string;
  experience_date: Date;
  participants: number;
  price: number;
  status: string;
  total_price: number;
  cancellable: boolean;
  time_preference: string;
  city: string;
  experience_hint?: string;
  experience: {
    id: string;
    time_preference: string;
    location: string;
  };
}

interface ItemWithHeader {
  type: "header" | "item";
  title?: string;
  data?: Reserva;
}

const MyBookings = () => {
  const [allItems, setAllItems] = useState<ItemWithHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scrollRef = useRef<FlatList<ItemWithHeader>>(null);
  const [pastSectionIndex, setPastSectionIndex] = useState<number | null>(null);
  const [futureSectionIndex, setFutureSectionIndex] = useState<number | null>(null);
  
  const [reviewedExperiences, setReviewedExperiences] = useState<string[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Array<{uri: string, type: string}>>([]);

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

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fetchReservas = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const usuarioId = await AsyncStorage.getItem("id");

      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión de nuevo.");
        router.push("/LoginScreen");
        return;
      }

      const [response, pastBookings] = await Promise.all([
        axios.get(`${BASE_URL}/bookings/users/${usuarioId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/bookings/user_past_bookings/${usuarioId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const futuras = Array.isArray(response.data)
        ? response.data
            .map((item) => ({
              ...item,
              experience_date: new Date(item.experience_date),
              time_preference: item.experience.time_preference,
              city: item.experience.location,
              experience_hint: item.experience.hint,
            }))
            .filter((item) => item.experience_date >= new Date())
            .sort((a, b) => a.experience_date.getTime() - b.experience_date.getTime())
        : [];

      const pasadas = Array.isArray(pastBookings.data)
        ? pastBookings.data
            .map((item) => ({
              ...item,
              experience_date: new Date(item.experience_date),
              time_preference: item.experience.time_preference,
              city: item.experience.location,
              experience_hint: item.experience.hint,
            }))
            .sort((a, b) => b.experience_date.getTime() - a.experience_date.getTime())
        : [];

      const items: ItemWithHeader[] = [];

      const futureIndex = 0;
      items.push({ type: "header", title: "Próximas Reservas" });
      if (futuras.length === 0) {
        items.push({ type: "item", data: undefined, title: "No tienes próximas reservas." });
      } else {
        futuras.forEach((item) => items.push({ type: "item", data: item }));
      }      

      const pastStartIndex = items.length;
      items.push({ type: "header", title: "Reservas Pasadas" });
      if (pasadas.length === 0) {
        items.push({ type: "item", data: undefined, title: "No tienes reservas pasadas." });
      } else {
        pasadas.forEach((item) => items.push({ type: "item", data: item }));
      }

      setFutureSectionIndex(futureIndex);
      setPastSectionIndex(pastStartIndex);
      setAllItems(items);
    } catch (error) {
      console.error("Error al obtener las reservas:", error);
      setError("Error al obtener las reservas");
    } finally {
      setLoading(false);
    }
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

      const response = await axios.put(`${BASE_URL}/bookings/cancel/${selectedBookingId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        Alert.alert("Reserva cancelada", "La reserva ha sido cancelada exitosamente.");
        setAllItems((prevItems) =>
          prevItems.map((item) =>
            item.type === "item" && item.data?.id === selectedBookingId
              ? { ...item, data: { ...item.data, status: "cancelled" } }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error al cancelar la reserva:", error);
      Alert.alert("Error", "No se pudo cancelar la reserva. Inténtalo de nuevo.");
    } finally {
      setModalVisible(false);
    }
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
        prev.includes(selectedExperienceId as string) 
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

const renderItem = ({ item }: { item: ItemWithHeader }) => {
  if (item.type === "header") {
    return (
      <Text style={styles.sectionHeader}>{item.title}</Text>
    );
  }

  if (!item.data) {
    return (
      <Text style={styles.emptySectionText}>{item.title}</Text>
    );
  }

  const reserva = item.data!;
  const timePreferenceMap: { [key: string]: string } = {
    MORNING: "Mañana",
    AFTERNOON: "Tarde",
    NIGHT: "Noche",
  };

  const isCancelled = reserva.status === "cancelled";
  const isConfirmed = reserva.status === "CONFIRMED";
  const isPastDate = isBefore(
    reserva.experience_date instanceof Date ? reserva.experience_date : parseISO(reserva.experience_date),
    new Date()
  );
  
  const hasReviewed = reviewedExperiences.includes(reserva.experience.id);

  return (
    <View
      style={[
        styles.card,
        isCancelled && styles.cancelledCard, // Apply red tone and reduced opacity for canceled bookings
        isConfirmed && styles.confirmedCard, // Apply green tone and reduced opacity for confirmed bookings
      ]}
    >
      <View style={styles.labelContainer}>
        <Ionicons name="calendar" size={16} color="#1877F2" style={styles.icon} />
        <Text style={styles.label}>
          <Text style={styles.bold}>Fecha Experiencia: </Text>
          {format(new Date(reserva.experience_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </Text>
      </View>

      <View style={styles.labelContainer}>
        <Ionicons name="people" size={16} color="#1877F2" />{" "}
        <Text style={styles.label}>
          <Text style={styles.bold}>Participantes:</Text> {reserva.participants}
        </Text>
      </View>

      <View style={styles.labelContainer}>
        <Ionicons name="pricetag" size={16} color="#1877F2" />{" "}
        <Text style={styles.label}>
          <Text style={styles.bold}>Precio Total:</Text> {reserva.total_price} €
        </Text>
      </View>
      
      <View style={styles.labelContainer}>
        <Ionicons name="time" size={16} color="#1877F2" style={styles.icon} />
        <Text style={styles.label}>
          <Text style={styles.bold}>Preferencia Horaria: </Text>
          {timePreferenceMap[reserva.time_preference] || reserva.time_preference}
        </Text>
      </View>
      
      <View style={styles.labelContainer}>
        <Ionicons name="location" size={16} color="#1877F2" style={styles.icon} />
        <Text style={styles.label}>
          <Text style={styles.bold}>Ciudad: </Text>
          {reserva.city}
        </Text>
      </View>
      
      {reserva.experience_hint && (
        <View style={styles.labelContainer}>
          <Ionicons name="bulb" size={16} color="#FF9900" style={styles.icon} />
          <Text style={styles.label}>
            <Text style={styles.bold}>Pista de la experiencia: </Text>
            {reserva.experience_hint}
          </Text>
        </View>
      )}
      
      {!isCancelled && !isPastDate && reserva.cancellable && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setSelectedBookingId(reserva.id);
            setModalVisible(true);
          }}
        >
          <Ionicons name="close-circle" size={16} color="white" />
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}
      
      {isConfirmed && isPastDate && !hasReviewed && (
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => openReviewModal(reserva.experience.id)}
        >
          <Ionicons name="star" size={16} color="white" />
          <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
        </TouchableOpacity>
      )}
      
      {isConfirmed && isPastDate && hasReviewed && (
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => router.push("/HomeScreen")}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => futureSectionIndex !== null && scrollRef.current?.scrollToIndex({ index: futureSectionIndex, animated: true })}
          >
            <Text style={styles.navButtonText}>Próximas Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => pastSectionIndex !== null && scrollRef.current?.scrollToIndex({ index: pastSectionIndex, animated: true })}
          >
            <Text style={styles.navButtonText}>Reservas Pasadas</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: 50 }]}>
        <FlatList
          ref={scrollRef}
          data={allItems}
          keyExtractor={(item, index) => `${item.type}-${item.title || item.data?.id}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.noReservationsText}>No tienes reservas.</Text>}
        />
      </Animated.View>

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
                onPress={cancelarReserva}
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
                  onPress={() => setReviewRating(star)}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
  },
  fixedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  navButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#1877F2",
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
  },
  navButtonText: {
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    color: "#D9534F",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  noReservationsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1877F2",
    marginBottom: 10,
    marginTop: 2,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelledCard: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb", 
    opacity: 0.8, 
  },
  confirmedCard: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb", 
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  bold: {
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "white",
    marginLeft: 5,
  },
  reviewButton: {
    backgroundColor: "#f39c12",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  reviewButtonText: {
    color: "white",
    marginLeft: 5,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#d3d3d3",
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptySectionText: {
    fontSize: 16,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 10,
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
});

export default MyBookings;