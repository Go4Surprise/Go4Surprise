import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextField, Button, MenuItem, FormControl, InputLabel, Select, Box, Stack, SelectChangeEvent } from '@mui/material';
import axios, { AxiosError } from 'axios';
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
    location: '',
    duration: 0,
    experience_date: new Date(),
    price: 0,
    participants: 0,
    category: "ADVENTURE"
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedUserId = await AsyncStorage.getItem('id');
      const storedToken = await AsyncStorage.getItem('accessToken');
      setUserId(storedUserId);
      setToken(storedToken);
      setReserva({ ...reserva, user: storedUserId });
    };

    fetchData();
  }, []);

  // Manejador para campos de tipo TextField (input)
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string, value: any } }) => {
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
    var date = reserva.experience_date.getFullYear() + "-" + reserva.experience_date.getMonth() + "-" + reserva.experience_date.getDay();
    console.log(date);
    const data = {
      participants: reserva.participants,
      price: reserva.price,
      user: reserva.user,
      experience_date: date,
      location: reserva.location,
      duration: reserva.duration,
      category: reserva.category
    }
    axios
      .post(`${BASE_URL}/bookings/crear-reserva/`, 
        data
        , { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        console.log('Response:', response.data);// Handle success
        window.location.href = '/HomeScreen';
      })
      .catch((error) => {
        console.error('Error:', error.response ? error.response.data : error.message); // Handle error
      });
    console.log(reserva);

  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 3 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Location"
            name="location"
            fullWidth
            value={reserva.location}
            onChange={handleTextFieldChange}
            required
          />
          <FormControl fullWidth>
            <InputLabel>Duration (in hours)</InputLabel>
            <Select
              label="Duration"
              name="duration"
              value={reserva.duration}
              onChange={handleSelectChange} 
              required// Usar el manejador específico para Select
            >
              <MenuItem value={1}>1 hour</MenuItem>
              <MenuItem value={2}>2 hours</MenuItem>
              <MenuItem value={3}>3 hours</MenuItem>
              <MenuItem value={4}>4 hours</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Price"
            name="price"
            type="number"
            fullWidth
            value={reserva.price}
            onChange={handleTextFieldChange}
            required
          />
          <TextField
            label="Participants"
            name="participants"
            type="number"
            fullWidth
            value={reserva.participants}
            onChange={handleTextFieldChange}
            required
          />
          <TextField
            label="Experience Date"
            name="experience_date"
            type="date"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            // Convertimos la fecha a formato string (yyyy-MM-dd)
            value={reserva.experience_date.toISOString().split('T')[0]}
            onChange={(e) => {
              const dateValue = new Date(e.target.value);
              handleTextFieldChange({ target: { name: 'experience_date', value: dateValue } });
            }}
          />
          <Button variant="contained" type="submit" fullWidth>
            Register Booking
          </Button>
        </Stack>
      </form>
    </Box>
  );
}