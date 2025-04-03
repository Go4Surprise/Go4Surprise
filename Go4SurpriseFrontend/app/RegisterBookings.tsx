import React, { useState, useEffect, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TextField, Button, MenuItem, FormControl, InputLabel,
  Select, Box, Stack, SelectChangeEvent, Typography,
  Alert, Slider, useMediaQuery, useTheme, Grid, IconButton
} from "@mui/material";
import axios from "axios";
import { ScrollView, Text, View, Dimensions, Platform, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { BASE_URL } from '../constants/apiUrl';
import { CardProps, Reservation, ScrollViewProps } from "../types/bookingTypes";

type ScrollState = {
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
  activeScrollView: 'city' | 'category' | null;
};
import { cities, categories } from "../data/bookingData";

// Responsive card dimensions
const getCardDimensions = (isMobile: boolean) => ({
  width: isMobile ? 150 : 200,
  height: isMobile ? 200 : 300,
  margin: isMobile ? 5 : 8
});

// Card Components
const CityCard = ({ city, isSelected, onSelect, isMobile }: CardProps & { isMobile: boolean }) => {
  const { width, height, margin } = getCardDimensions(isMobile);
  
  return (
    <Button
      style={{ 
        width, 
        height, 
        margin,
        padding: 0,
        overflow: 'hidden',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        borderRadius: 10
      }}
      onClick={onSelect}
      variant={isSelected ? "outlined" : "text"}
    >
      <div style={{ 
        width: "100%", 
        height: "85%", 
        position: "relative",
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          width: "100%", 
          height: "100%", 
          overflow: 'hidden',
          position: 'relative' 
        }}>
          <img
            src={city.image}
            alt={city.name}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover"
            }}
          />
        </div>
        <Text style={{ 
          fontSize: isMobile ? 14 : 16,
          textAlign: 'center',
          width: '100%',
          marginTop: 8,
          fontWeight: isSelected ? 'bold' : 'normal',
          color: isSelected ? '#1976d2' : 'inherit'
        }}>{city.name}</Text>
      </div>
    </Button>
  );
};

const CategoryCard = ({ category, isSelected, onSelect, isMobile }: CardProps & { isMobile: boolean }) => {
  const { width, height, margin } = getCardDimensions(isMobile);
  
  return (
    <Button
      style={{
        width,
        height,
        margin,
        padding: 0,
        overflow: 'hidden',
        opacity: isSelected ? 0.8 : 1,
        backgroundColor: isSelected ? "#e0e0e0" : "transparent", 
        transition: "opacity 0.3s, background-color 0.3s",
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        borderRadius: 10
      }}
      onClick={onSelect}
      variant={isSelected ? "outlined" : "text"}
    >
      <div style={{ 
        width: "100%", 
        height: "85%", 
        position: "relative",
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          width: "100%", 
          height: "100%", 
          overflow: 'hidden',
          position: 'relative' 
        }}>
          <img
            src={category.image}
            alt={category.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: isSelected ? "grayscale(50%)" : "none"
            }}
          />
        </div>
        <Text style={{ 
          fontSize: isMobile ? 14 : 16,
          textAlign: 'center',
          width: '100%',
          marginTop: 8,
          fontWeight: isSelected ? 'bold' : 'normal',
          color: isSelected ? '#1976d2' : 'inherit'
        }}>{category.name}</Text>
      </div>
    </Button>
  );
};

// Horizontal Scrollable Component
const HorizontalScrollable = ({ children, scrollViewProps, containerHeight }: { 
  children: React.ReactNode, 
  scrollViewProps: ScrollViewProps,
  containerHeight: number 
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
    <View style={{ height: containerHeight }}>
      {children}
    </View>
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
    setScrollState((prev: ScrollState) => ({ ...prev, isDragging: false, activeScrollView: null }));
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
  errors,
  isMobile
}: { 
  reserva: Reservation, 
  handleTextFieldChange: any, 
  handleSelectChange: any,
  errors: any,
  isMobile: boolean
}) => (
  <Stack spacing={isMobile ? 2.5 : 3}>
    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
      <InputLabel>Preferencia de Horario</InputLabel>
      <Select
        label="Preferencia de Horario"
        name="horario_preferencia"
        value={reserva.horario_preferencia}
        onChange={handleSelectChange}
        required
      >
        <MenuItem value="MORNING">Mañana</MenuItem>
        <MenuItem value="AFTERNOON">Tarde</MenuItem>
        <MenuItem value="NIGHT">Noche</MenuItem>
      </Select>
    </FormControl>
    
    <FormControl fullWidth>
      <Typography variant={isMobile ? "body2" : "body1"}>Precio</Typography>
      <Slider
        name="price"
        value={reserva.price}
        onChange={(e, value) => handleTextFieldChange({ target: { name: "price", value } })}
        step={20}
        marks={[
          { value: 20, label: '20 €' },
          { value: 40, label: '40 €' },
          { value: 60, label: '60 €' }
        ]}
        min={20}
        max={60}
        valueLabelDisplay="auto"
        size={isMobile ? "small" : "medium"}
      />
    </FormControl>
    
    <TextField
      label="Participantes"
      name="participants"
      type="number"
      fullWidth
      value={reserva.participants}
      onChange={handleTextFieldChange}
      required
      size={isMobile ? "small" : "medium"}
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
      size={isMobile ? "small" : "medium"}
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
      rows={isMobile ? 3 : 4}
      fullWidth
      size={isMobile ? "small" : "medium"}
      placeholder="Añade cualquier información adicional que consideres relevante para tu experiencia (alergias, mascotas, ...)"
      value={reserva.notas_adicionales}
      onChange={handleTextFieldChange}
    />
  </Stack>
);

// Back button component
const BackButton = ({ onPress, isMobile }: { onPress: () => void, isMobile: boolean }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{
      alignSelf: 'flex-start',
      marginBottom: 16
    }}
  >
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        color: '#1976d2',
        fontWeight: 'bold',
        paddingY: 1,
        paddingX: 1.5,
        borderRadius: 0,
        width: 'fit-content',
        transition: '0.3s',
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)'
        }
      }}
    >
      <span style={{ marginRight: 8 }}>&#8592;</span>
      <Typography variant={isMobile ? "body2" : "body1"} component="span">
        Volver a Inicio
      </Typography>
    </Box>
  </TouchableOpacity>
);

// Main component
export default function RegisterBooking() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get screen dimensions for responsive adjustments
  const [windowDimensions, setWindowDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  });
  
  // Detect if we're on a large screen
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  const isExtraLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    
    return () => {
      // Remove event listener
      if (typeof subscription?.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  // Calculate card container height based on screen size
  const cardContainerHeight = useMemo(() => {
    return isMobile ? 240 : 320;
  }, [isMobile]);

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
    horario_preferencia: "MORNING",
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

  // Navigation handler
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
        time_preference: reserva.horario_preferencia,
        categories: reserva.categories,
        notas_adicionales: reserva.notas_adicionales,
      };

      if (!token) {
        throw new Error("No se encontró un token de autenticación.");
      }
      
      const response = await axios.post(
        `${BASE_URL}/bookings/crear-reserva/`, 
        data, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Obtén el bookingId de la respuesta
      const bookingId = response.data.id;
      console.log("BookingId:", bookingId);

      // Redirige a la página de detalles de la reserva pasando el bookingId
      router.push({ pathname: "/BookingDetails", params: { bookingId } });
      
    } catch (error: any) {
      console.error("Error:", error.response ? error.response.data : error.message);

      // Handle backend error response
      if (error.response?.data) {
        const errorDetails = error.response.data;
        if (typeof errorDetails === "object" && errorDetails.detail) {
          setBackendErrors(errorDetails.detail);
        } else if (typeof errorDetails === "string") {
          setBackendErrors(errorDetails);
        } else {
          setBackendErrors("Ocurrió un error desconocido.");
        }
      } else {
        setBackendErrors("Error de conexión con el servidor.");
      }
    }
  };

  // Helper functions
  const formatDateForAPI = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const isFormValid = () => {
    return (
      reserva.location !== "" &&
      reserva.horario_preferencia !== "" &&
      reserva.price > 0 &&
      reserva.participants > 0 &&
      reserva.experience_date !== null
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
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: isMobile ? 10 : 16
    }}>
      <Box sx={{ 
        width: "100%", 
        maxWidth: { xs: '90%', sm: '90%', md: '90%', lg: '90%' }, 
        padding: { xs: 2, sm: 2.5, md: 3 }, 
        margin: "0 auto"
      }}>
        <BackButton onPress={() => router.push('/HomeScreen')} isMobile={isMobile} />
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={isMobile ? 2.5 : 3}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              fontWeight="bold" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: '#1976d2',
                fontSize: isMobile ? '1.1rem' : '1.5rem',
                marginTop: isMobile ? 1.5 : 0,
                marginBottom: isMobile ? 1.5 : 0.5
              }}
            >
              Elige Ciudad
            </Typography>
            
            {reserva.location !== "" && (
              <Typography variant="body1" fontWeight="medium">
                {reserva.location}
              </Typography>
            )}
            
            <View style={{ height: cardContainerHeight }}>
              <HorizontalScrollable 
                scrollViewProps={cityScrollProps}
                containerHeight={cardContainerHeight}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  {cities.map((city) => (
                    <CityCard 
                      key={city.name}
                      city={city}
                      isSelected={reserva.location === city.name}
                      onSelect={() => setReserva(prev => ({ ...prev, location: city.name }))}
                      isMobile={isMobile}
                    />
                  ))}
                </Box>
              </HorizontalScrollable>
            </View>

            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              fontWeight="bold" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: '#1976d2',
                marginTop: isMobile ? 3 : 2,
                marginBottom: isMobile ? 1.5 : 0.5,
                fontSize: isMobile ? '1.1rem' : '1.5rem'
              }}
            >
              No te gusta algo? ¡Descártalo!
            </Typography>
            
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="textSecondary" 
              sx={{ marginBottom: 0.5 }}
            >
              (El primero es <strong>GRATIS</strong>, cada descarte extra cuesta <strong>5€</strong>, máximo: <strong>3 descartes permitidos</strong>)
            </Typography> 
            
            {reserva.categories.length > 0 && (
              <Typography variant="body2" fontWeight="medium">
                {reserva.categories.join(", ")}
                {reserva.categories.length >= 3 && 
                  <Typography 
                    component="span" 
                    variant="caption" 
                    color="warning.main"
                  > (Máximo alcanzado)</Typography>
                }
              </Typography>
            )}

            <View style={{ height: cardContainerHeight }}>
              <HorizontalScrollable 
                scrollViewProps={categoryScrollProps}
                containerHeight={cardContainerHeight}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  {categories.map((category) => (
                    <CategoryCard 
                      key={category.id}
                      category={category}
                      isSelected={reserva.categories.includes(category.id)}
                      onSelect={() => toggleCategory(category.id)}
                      isMobile={isMobile}
                    />
                  ))}
                </Box>
              </HorizontalScrollable>
            </View>

            <Box sx={{ marginTop: isMobile ? 3 : 2 }}>
              <BookingFormFields 
                reserva={reserva}
                handleTextFieldChange={handleTextFieldChange}
                handleSelectChange={handleSelectChange}
                errors={errors}
                isMobile={isMobile}
              />
            </Box>
            
            <Box 
              sx={{ 
                padding: { xs: 2.5, sm: 3 },
                border: '1px solid #e0e0e0', 
                borderRadius: 1.5,
                backgroundColor: '#f5f5f5',
                marginTop: { xs: 3, sm: 2 },
                marginBottom: { xs: 3, sm: 2 } 
              }}
            >
              <Typography variant={isMobile ? "subtitle2" : "subtitle1"} fontWeight="bold" gutterBottom sx={{ marginBottom: isMobile ? 1.5 : 1 }}>
                Desglose del precio:
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"}>
                Precio base: {reserva.price}€ × {reserva.participants} {reserva.participants > 1 ? 'personas' : 'persona'} = {reserva.price * reserva.participants}€
              </Typography>
              {reserva.categories.length > 0 && (
                <Typography variant={isMobile ? "caption" : "body2"}>
                  Categorías descartadas: {reserva.categories.length} {reserva.categories.length === 1 ? '(gratis)' : `(primera gratis, +${(reserva.categories.length - 1) * 5}€)`}
                </Typography>
              )}
              <Typography 
                variant={isMobile ? "subtitle2" : "h6"} 
                sx={{ marginTop: isMobile ? 2 : 1, fontWeight: 'bold', color: '#1976d2' }}
              >
                Precio Total: {totalPrice}€
              </Typography>
            </Box>
            
            {/* Display backend errors */}
            {backendErrors && (
              <Box 
                sx={{ 
                  padding: { xs: 1.5, sm: 2 },
                  border: '1px solid #f44336', 
                  borderRadius: 1,
                  backgroundColor: '#ffebee',
                  marginBottom: { xs: 1.5, sm: 2 }
                }}
              >
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="error"
                  style={{ whiteSpace: 'pre-line' }}
                >
                  <strong>Error:</strong> {typeof backendErrors === "string" ? backendErrors : JSON.stringify(backendErrors, null, 2)}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              type="submit"
              fullWidth
              size={isMobile ? "medium" : "large"}
              disabled={!isFormValid()}
              sx={{ 
                marginTop: { xs: 2, sm: 2 },
                padding: isMobile ? '10px 0' : undefined,
                fontSize: isMobile ? '1rem' : undefined
              }}
            >
              Realizar Reserva
            </Button>
          </Stack>
        </form>
      </Box>
    </ScrollView>
  );
}