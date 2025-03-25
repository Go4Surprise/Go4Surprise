import React, { useState, useEffect, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TextField, Button, MenuItem, FormControl, InputLabel,
  Select, Box, Stack, SelectChangeEvent, Typography,
  Alert
} from "@mui/material";
import axios from "axios";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { BASE_URL } from '../constants/apiUrl';
import { CardProps, Reservation, ScrollViewProps } from "../types/bookingTypes";
import { cities, categories } from "../data/bookingData";

// Card Components
const CityCard = ({ city, isSelected, onSelect }: CardProps) => (
  <Button
    style={{ width: 200, height: 300, margin: 5 }}
    onClick={onSelect}
    variant={isSelected ? "outlined" : "text"}
  >
    <div style={{ width: "100%", height: "80%", position: "relative" }}>
      <img
        src={city.image}
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
      />
      <Text>{city.name}</Text>
    </div>
  </Button>
);

const CategoryCard = ({ category, isSelected, onSelect }: CardProps) => (
  <Button
    style={{ width: 200, height: 300, margin: 5 }}
    onClick={onSelect}
    variant={isSelected ? "outlined" : "text"}
  >
    <div style={{ width: "100%", height: "80%", position: "relative" }}>
      <img
        src={category.image}
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
      />
      <Text>{category.name}</Text>
    </div>
  </Button>
);

// Horizontal Scrollable Component
const HorizontalScrollable = ({ children, scrollViewProps }: { 
  children: React.ReactNode, 
  scrollViewProps: ScrollViewProps 
}) => (
  <ScrollView
    ref={scrollViewProps.ref}
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ 
      marginBottom: 5,
      cursor: scrollViewProps.isDragging && scrollViewProps.isActive ? 'grabbing' : 'grab'
    }}
    onMouseDown={scrollViewProps.onMouseDown}
    onMouseMove={scrollViewProps.onMouseMove}
    onMouseUp={scrollViewProps.onMouseUp}
    onMouseLeave={scrollViewProps.onMouseLeave}
    onTouchStart={scrollViewProps.onTouchStart}
    onTouchMove={scrollViewProps.onTouchMove}
    onTouchEnd={scrollViewProps.onTouchEnd}
    scrollEventThrottle={16}
    decelerationRate="normal"
  >
    {children}
  </ScrollView>
);

// Scrolling hooks and handlers
const useScrollHandlers = (scrollViewRef: React.RefObject<ScrollView>, scrollState: any, setScrollState: any, scrollViewType: 'city' | 'category') => {
  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollView = scrollViewRef.current;
    if (scrollView) {
      setScrollState({
        isDragging: true,
        startX: e.pageX,
        scrollLeft: scrollView.getScrollableNode().scrollLeft,
        activeScrollView: scrollViewType
      });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scrollState.isDragging || scrollState.activeScrollView !== scrollViewType) return;
    const x = e.pageX;
    const distance = scrollState.startX - x;
    const scrollView = scrollViewRef.current;
    if (scrollView) {
      scrollView.scrollTo({ x: scrollState.scrollLeft + distance, animated: false });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollView = scrollViewRef.current;
    if (scrollView) {
      setScrollState({
        isDragging: true,
        startX: e.touches[0].pageX,
        scrollLeft: scrollView.getScrollableNode().scrollLeft,
        activeScrollView: scrollViewType
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollState.isDragging || scrollState.activeScrollView !== scrollViewType) return;
    const x = e.touches[0].pageX;
    const distance = scrollState.startX - x;
    const scrollView = scrollViewRef.current;
    if (scrollView) {
      scrollView.scrollTo({ x: scrollState.scrollLeft + distance, animated: false });
    }
  };

  const resetScroll = () => {
    setScrollState(prev => ({ ...prev, isDragging: false, activeScrollView: null }));
  };

  return {
    ref: scrollViewRef,
    isDragging: scrollState.isDragging,
    isActive: scrollState.activeScrollView === scrollViewType,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: resetScroll,
    onMouseLeave: resetScroll,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: resetScroll
  };
};

// Form fields component
const BookingFormFields = ({ 
  reserva, 
  handleTextFieldChange, 
  handleSelectChange,
  errors
}: { 
  reserva: Reservation, 
  handleTextFieldChange: any, 
  handleSelectChange: any,
  errors: any
}) => (
  <>
    <FormControl fullWidth>
      <InputLabel>Duración</InputLabel>
      <Select
        label="Duration"
        name="duration"
        value={reserva.duration}
        onChange={handleSelectChange}
        required
      >
        {[1, 2, 3, 4].map(h => (
          <MenuItem key={h} value={h}>{h} hora{h > 1 ? 's' : ''}</MenuItem>
        ))}
      </Select>
    </FormControl>
    
    <FormControl fullWidth>
      <InputLabel>Precio</InputLabel>
      <Select
        label="precio"
        name="price"
        value={reserva.price}
        onChange={handleSelectChange}
        required
        error={reserva.price <= 0}
      >
        {[20, 40, 60].map(price => (
          <MenuItem key={price} value={price}>{price} €</MenuItem>
        ))}
      </Select>
      {reserva.price <= 0 && (
        <Typography color="error" variant="caption" sx={{ marginLeft: 2 }}>
          El precio debe ser mayor que 0
        </Typography>
      )}
    </FormControl>
    
    <TextField
      label="Participantes"
      name="participants"
      type="number"
      fullWidth
      value={reserva.participants}
      onChange={handleTextFieldChange}
      required
      inputProps={{
        min: 1
      }}
      error={errors.participants || reserva.participants <= 0}
      helperText={errors.participants || reserva.participants <= 0 ? "El número de participantes debe ser mayor que 0" : ""}
    />
    
    <TextField
      label="Fecha de la Experiencia"
      name="experience_date"
      type="date"
      fullWidth
      InputLabelProps={{ shrink: true }}
      inputProps={{
        min: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      }}
      value={reserva.experience_date.toISOString().split("T")[0]}
      onChange={(e) => {
        const dateValue = new Date(e.target.value);
        handleTextFieldChange({
          target: { name: "experience_date", value: dateValue },
        });
      }}
    />

    <TextField
      label="Notas Adicionales"
      name="notas_adicionales"
      multiline
      rows={4}
      fullWidth
      placeholder="Añade cualquier información adicional que consideres relevante para tu experiencia (alergias, mascotas, ...)"
      value={reserva.notas_adicionales}
      onChange={handleTextFieldChange}
    />
  </>
);

// Main component
export default function RegisterBooking() {
  // State
  const [reserva, setReserva] = useState<Reservation>({
    user: null,
    location: "",
    duration: 0,
    experience_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price: 20,
    participants: 1,
    categories: [],
    notas_adicionales: "",
  });
  const [token, setToken] = useState<string | null>(null);
  
  const [errors, setErrors] = useState({
    participants: false
  });
  const [backendErrors, setBackendErrors] = useState<string | null>(null);
  
  // Refs & Scroll state
  const cityScrollViewRef = useRef<ScrollView>(null);
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const [scrollState, setScrollState] = useState({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    activeScrollView: null as 'city' | 'category' | null
  });

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("id");
        const storedToken = await AsyncStorage.getItem("accessToken");
        setToken(storedToken);
        setReserva(prev => ({ ...prev, user: storedUserId }));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    void fetchUserData();
  }, []);

  // Handle mouse up outside component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (scrollState.isDragging) {
        setScrollState(prev => ({...prev, isDragging: false, activeScrollView: null}));
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => { document.removeEventListener('mouseup', handleGlobalMouseUp); };
  }, [scrollState.isDragging]);

  // Input handlers
  const handleTextFieldChange = (
    e: { target: { name: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    
    // Add validation for participants
    if (name === "participants") {
      const numValue = parseInt(value as string);
      setErrors({
        ...errors,
        participants: numValue <= 0
      });
    }
    
    setReserva(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setReserva(prev => ({ ...prev, [name]: value }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setBackendErrors(null);
    
    try {
      const date = formatDateForAPI(reserva.experience_date);
      const data = {
        participants: reserva.participants,
        price: reserva.price,
        user: reserva.user,
        experience_date: date,
        location: reserva.location,
        duration: reserva.duration,
        categories: reserva.categories,
        notas_adicionales: reserva.notas_adicionales
      };
      
      await axios.post(
        `${BASE_URL}/bookings/crear-reserva/`, 
        data, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      router.push("/HomeScreen");
    } catch (error: any) {
            console.error(
        "Error:", error.response ? error.response.data : error.message
      );
    }
  };

  // Helper functions
  const formatDateForAPI = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const isFormValid = () => {
    return (
      reserva.location !== "" &&
      reserva.duration !== 0 &&
      reserva.price > 0 &&
      reserva.participants > 0
    );
  };

  // Modified toggleCategory function to handle multiple selections
  const toggleCategory = (categoryId: string) => {
    setReserva(prev => {
      if (prev.categories.includes(categoryId)) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== categoryId)
        };
      } 
      
      if (prev.categories.length >= 3) {
        return prev;
      }
      
      return {
        ...prev,
        categories: [...prev.categories, categoryId]
      };
    });
  };

  const totalPrice = useMemo(() => {
    const basePrice = reserva.price * reserva.participants;
    
    // Sumar descartes (primera gratis, después 5€ por descarte)
    const categoryFees = Math.max(0, reserva.categories.length - 1) * 5;
    
    return basePrice + categoryFees;
  }, [reserva.price, reserva.participants, reserva.categories]);

  // Get scroll handlers using custom hook
  const cityScrollProps = useScrollHandlers(cityScrollViewRef, scrollState, setScrollState, 'city');
  const categoryScrollProps = useScrollHandlers(categoryScrollViewRef, scrollState, setScrollState, 'category');

  return (
    <ScrollView contentContainerStyle={{ 
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Box sx={{ maxWidth: 600, padding: 3, width: "100%", margin: "0 auto" }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h6">
              Elige tu ciudad: {reserva.location !== "" ? reserva.location : ""}
            </Typography>
            
            <View style={{ height: 320 }}>
              <HorizontalScrollable scrollViewProps={cityScrollProps}>
                {cities.map((city) => (
                  <CityCard 
                    key={city.name}
                    city={city}
                    isSelected={reserva.location === city.name}
                    onSelect={() => setReserva(prev => ({ ...prev, location: city.name }))}
                  />
                ))}
              </HorizontalScrollable>
            </View>

            <Typography variant="h6">
              Descarta categorías (Máximo 3, primer descarte gratuito, después 5€ por descarte): 
              {reserva.categories.length > 0 ? 
                reserva.categories.join(", ") : 
                ""}
              {reserva.categories.length >= 3 && 
                <Typography variant="caption" color="warning.main"> (Máximo alcanzado)</Typography>
              }
            </Typography>

            <HorizontalScrollable scrollViewProps={categoryScrollProps}>
              {categories.map((category) => (
                <CategoryCard 
                  key={category.id}
                  category={category}
                  isSelected={reserva.categories.includes(category.id)}
                  onSelect={() => toggleCategory(category.id)}
                />
              ))}
            </HorizontalScrollable>

            <BookingFormFields 
              reserva={reserva}
              handleTextFieldChange={handleTextFieldChange}
              handleSelectChange={handleSelectChange}
              errors={errors}
            />
            
            <Box 
              sx={{ 
                padding: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                backgroundColor: '#f5f5f5',
                marginTop: 2,
                marginBottom: 2 
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Desglose del precio:
              </Typography>
              <Typography variant="body2">
                Precio base: {reserva.price}€ × {reserva.participants} {reserva.participants > 1 ? 'personas' : 'persona'} = {reserva.price * reserva.participants}€
              </Typography>
              {reserva.categories.length > 0 && (
                <Typography variant="body2">
                  Categorías descartadas: {reserva.categories.length} {reserva.categories.length === 1 ? '(gratis)' : `(primera gratis, +${(reserva.categories.length - 1) * 5}€)`}
                </Typography>
              )}
              <Typography variant="h6" sx={{ marginTop: 1, fontWeight: 'bold', color: '#1976d2' }}>
                Precio Total: {totalPrice}€
              </Typography>
            </Box>
            
            {/* Display backend errors */}
            {backendErrors && (
              <Box 
                sx={{ 
                  padding: 2, 
                  border: '1px solid #f44336', 
                  borderRadius: 1,
                  backgroundColor: '#ffebee',
                  marginBottom: 2 
                }}
              >
                <Typography 
                  variant="body2" 
                  color="error"
                  style={{ whiteSpace: 'pre-line' }}
                >
                  <strong>Error:</strong> {backendErrors}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={!isFormValid()}
            >
              Realizar Reserva
            </Button>
          </Stack>
        </form>
      </Box>
    </ScrollView>
  );
}