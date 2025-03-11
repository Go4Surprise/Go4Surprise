import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextField, Button, MenuItem, FormControl, InputLabel, Select, Box, Stack, SelectChangeEvent } from '@mui/material';
import axios, { AxiosError } from 'axios';

interface Reserva {
  usuario_id: string | null;
  location: string;
  duration: number;
  experience_date: Date;
  price: number;
  participants: number;
}

export default function RegisterBooking() {
  const [reserva, setReserva] = useState<Reserva>({
    usuario_id: null,
    location: '',
    duration: 0,
    experience_date: new Date(),
    price: 0,
    participants: 0,
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('accessToken');
      setUserId(storedUserId);
      setToken(storedToken);
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
    axios
      .post(`http://localhost:8000/bookings/users/${userId}`, reserva, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        console.log('Response:', response.data); // Handle success
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
          />
          <FormControl fullWidth>
            <InputLabel>Duration (in hours)</InputLabel>
            <Select
              label="Duration"
              name="duration"
              value={reserva.duration}
              onChange={handleSelectChange} // Usar el manejador específico para Select
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
          />
          <TextField
            label="Participants"
            name="participants"
            type="number"
            fullWidth
            value={reserva.participants}
            onChange={handleTextFieldChange}
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
