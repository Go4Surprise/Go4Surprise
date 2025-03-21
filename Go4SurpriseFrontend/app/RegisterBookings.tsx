import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Stack,
  SelectChangeEvent,
  Input,
  Typography,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { BASE_URL } from '../constants/apiUrl';

interface Reserva {
  user: string | null;
  location: string;
  duration: number;
  experience_date: Date;
  price: number;
  participants: number;
  category: string;
}

export default function RegisterBooking() {
  const [reserva, setReserva] = useState<Reserva>({
    user: null,
    location: "",
    duration: 0,
    experience_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price: 0,
    participants: 0,
    category: "",
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Add refs for the ScrollViews
  const cityScrollViewRef = useRef<ScrollView>(null);
  const categoryScrollViewRef = useRef<ScrollView>(null);
  
  // Add state for tracking mouse drag
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeScrollView, setActiveScrollView] = useState<'city' | 'category' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedUserId = await AsyncStorage.getItem("id");
      const storedToken = await AsyncStorage.getItem("accessToken");
      setUserId(storedUserId);
      setToken(storedToken);
      setReserva({ ...reserva, user: storedUserId });
    };

    fetchData();
  }, []);

  // Manejador para campos de tipo TextField (input)
  const handleTextFieldChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    setReserva({
      ...reserva,
      [name]: value,
    });
  };

  // Manejador para campos de tipo Select
  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setReserva({
      ...reserva,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    var date =
      reserva.experience_date.getFullYear() +
      "-" +
      String(reserva.experience_date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(reserva.experience_date.getDate()).padStart(2, "0");
    const data = {
      participants: reserva.participants,
      price: reserva.price,
      user: reserva.user,
      experience_date: date,
      location: reserva.location,
      duration: reserva.duration,
      category: reserva.category,
    };
    axios
      .post(`${BASE_URL}/bookings/crear-reserva/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        router.push("/HomeScreen");
      })
      .catch((error) => {
        console.error(
          "Error:",
          error.response ? error.response.data : error.message
        ); // Handle error
      });
  };

  // Mouse event handlers for drag scrolling
  const handleMouseDown = (e: React.MouseEvent, scrollViewType: 'city' | 'category') => {
    setIsDragging(true);
    setStartX(e.pageX);
    setActiveScrollView(scrollViewType);
    
    const scrollView = scrollViewType === 'city' ? 
      cityScrollViewRef.current : categoryScrollViewRef.current;
    
    if (scrollView) {
      setScrollLeft(scrollView.getScrollableNode().scrollLeft);
    }
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const x = e.pageX;
    const distance = startX - x;
    
    const scrollView = activeScrollView === 'city' ? 
      cityScrollViewRef.current : categoryScrollViewRef.current;
    
    if (scrollView) {
      scrollView.scrollTo({ x: scrollLeft + distance, animated: false });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveScrollView(null);
  };

  // Add effect to handle mouse up outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setActiveScrollView(null);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Update mouse event handlers to also work with touch
  const handleTouchStart = (e: React.TouchEvent, scrollViewType: 'city' | 'category') => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setActiveScrollView(scrollViewType);
    
    const scrollView = scrollViewType === 'city' ? 
      cityScrollViewRef.current : categoryScrollViewRef.current;
    
    if (scrollView) {
      setScrollLeft(scrollView.getScrollableNode().scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const x = e.touches[0].pageX;
    const distance = startX - x;
    
    const scrollView = activeScrollView === 'city' ? 
      cityScrollViewRef.current : categoryScrollViewRef.current;
    
    if (scrollView) {
      scrollView.scrollTo({ x: scrollLeft + distance, animated: false });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setActiveScrollView(null);
  };

  return (
    <ScrollView contentContainerStyle={{ 
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Box sx={{ 
        maxWidth: 600, 
        padding: 3, 
        width: "100%", 
        margin: "0 auto" 
      }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h6">
              Elige tu ciudad: {reserva.location !== "" ? reserva.location : ""}
            </Typography>
            <View style={{ height: 320 }}>
              <ScrollView
                ref={cityScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
                style={{ 
                  width: '100%',
                  height: 320,
                  marginBottom: 5,
                  flexGrow: 0,
                  cursor: isDragging && activeScrollView === 'city' ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'city')}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={(e) => handleTouchStart(e, 'city')}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                scrollEventThrottle={16}
                decelerationRate="normal"
              >
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, location: "Sevilla" })}
                variant={reserva.location == "Sevilla" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://s0.smartresize.com/wallpaper/53/36/HD-wallpaper-sevilla-seville-spain.jpg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Sevilla</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, location: "Valencia" })}
                variant={reserva.location == "Valencia" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://s2.best-wallpaper.net/wallpaper/iphone/1601/Spain-Valencia-City-of-Arts-and-Sciences-building-river-blue-water_iphone_640x1136.jpg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Valencia</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() =>
                  setReserva({ ...reserva, location: "Barcelona" })
                }
                variant={reserva.location == "Barcelona" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://w0.peakpx.com/wallpaper/232/246/HD-wallpaper-barcelona-night-city-drone-drone-graphy-night-graphy-graphy-sagrada-familia-spain-travel-urban-thumbnail.jpg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Barcelona</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, location: "Madrid" })}
                variant={reserva.location == "Madrid" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://wallpaper.forfun.com/fetch/b1/b1624b6eef9ca171cff6789d12b2b314.jpeg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Madrid</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, location: "Bilbao" })}
                variant={reserva.location == "Bilbao" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1631361378665-13098c2d4173?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YmlsYmFvfGVufDB8fDB8fHww"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Bilbao</Text>
                </div>
              </Button>
            </ScrollView>
            </View>

            <Typography variant="h6">
              Elige una Categoria:{" "}
              {reserva.category !== "" ? reserva.category : ""}
            </Typography>

            <ScrollView
              ref={categoryScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ 
                marginBottom: 5,
                cursor: isDragging && activeScrollView === 'category' ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'category')}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => handleTouchStart(e, 'category')}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              scrollEventThrottle={16}
              decelerationRate="normal"
            >
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, category: "MUSIC" })}
                variant={reserva.category == "MUSIC" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_u7BOfVSvMCbfnI6mY-3UIP3n1CL9GaN4KA&s"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Música</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, category: "CULTURE" })}
                variant={reserva.category == "CULTURE" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://w0.peakpx.com/wallpaper/704/401/HD-wallpaper-people-inside-natural-history-museum.jpg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Cultura</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, category: "SPORTS" })}
                variant={reserva.category == "SPORTS" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://wallpapers.com/images/hd/basketball-hoop-sky-view-pohob7ikh9lti4j5.jpg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Deportes</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() =>
                  setReserva({ ...reserva, category: "GASTRONOMY" })
                }
                variant={
                  reserva.category == "GASTRONOMY" ? "outlined" : "text"
                }
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://cdn.shopify.com/s/files/1/1353/1137/files/64562323_41f54904-4bd4-4f3c-b17e-2733c9232c55.webp?v=1730181214"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Gastronomía</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() =>
                  setReserva({ ...reserva, category: "NIGHTLIFE" })
                }
                variant={
                  reserva.category == "NIGHTLIFE" ? "outlined" : "text"
                }
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3Jhd3BpeGVsb2ZmaWNlN190aGVfcGljdHVyZV9vZl9wZW9wbGVfaW5fcmF2aW5nX2NvbmNlcnRfaW5fZ29hX19kNWIzNjkzMC00ZGEyLTQxNjUtODFhMi0xYmFmYWM4MmY5ODEtYi5qcGc.jpg"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Vida Nocturna</Text>
                </div>
              </Button>
              <Button
                style={{ width: 200, height: 300, margin: 5 }}
                onClick={() => setReserva({ ...reserva, category: "ADVENTURE" })}
                variant={reserva.category == "ADVENTURE" ? "outlined" : "text"}
              >
                <div
                  style={{ width: "100%", height: "80%", position: "relative" }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1600807497639-3b5d8e74a232?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGhpa2luZ3xlbnwwfHwwfHx8MA%3D%3D"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <Text>Aventura</Text>
                </div>
              </Button>
            </ScrollView>

            <FormControl fullWidth>
              <InputLabel>Duración</InputLabel>
              <Select
                label="Duration"
                name="duration"
                value={reserva.duration}
                onChange={handleSelectChange}
                required // Usar el manejador específico para Select
              >
                <MenuItem value={1}>1 hora</MenuItem>
                <MenuItem value={2}>2 hora</MenuItem>
                <MenuItem value={3}>3 hora</MenuItem>
                <MenuItem value={4}>4 hora</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Precio</InputLabel>
              <Select
                label="precio"
                name="price"
                value={reserva.price}
                onChange={handleSelectChange}
                required // Usar el manejador específico para Select
              >
                <MenuItem value={20}>20 €</MenuItem>
                <MenuItem value={40}>40 €</MenuItem>
                <MenuItem value={60}>60 €</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Participantes"
              name="participants"
              type="number"
              fullWidth
              value={reserva.participants}
              onChange={handleTextFieldChange}
              required
            />
            <TextField
              label="Fecha de la Experiencia"
              name="experience_date"
              type="date"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0], // Prevent past dates
              }}
              // Convertimos la fecha a formato string (yyyy-MM-dd)
              value={reserva.experience_date.toISOString().split("T")[0]}
              onChange={(e) => {
                const dateValue = new Date(e.target.value);
                handleTextFieldChange({
                  target: { name: "experience_date", value: dateValue },
                });
              }}
            />
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={
                reserva.category == "" ||
                reserva.location == "" ||
                reserva.duration == null ||
                reserva.price == 0 ||
                reserva.participants == 0
              }
            >
              Register Booking
            </Button>
          </Stack>
        </form>
      </Box>
    </ScrollView>
  );
}
