import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from '../constants/apiUrl';
import WebDatePicker from '../components/WebDatePicker';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 18)));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdateError, setBirthdateError] = useState(''); // Error state for birthdate
  const [phoneError, setPhoneError] = useState(''); // Error state for phone

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          setBirthdateError(''); // Clear any existing errors
          setPhoneError('');
          router.push('/LoginScreen');
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };
    void checkToken();
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    const formattedDate = currentDate.toISOString().split('T')[0];
    setBirthdate(formattedDate);
    setBirthdateError(''); // Clear error when user selects a date
  };

  const onWebDateChange = (selectedDate: Date) => {
    setDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setBirthdate(formattedDate);
    setBirthdateError(''); // Clear error when user selects a date
  };

  const isValidPhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^\+?[1-9]\d{8,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleCompleteProfile = async () => {
    // Reset errors before validation
    setBirthdateError('');
    setPhoneError('');

    let hasError = false;

    // Validate inputs
    if (!birthdate) {
      setBirthdateError('Por favor, selecciona tu fecha de nacimiento.');
      hasError = true;
    }
    if (!phone) {
      setPhoneError('Por favor, ingresa tu número de teléfono.');
      hasError = true;
    } else if (!isValidPhoneNumber(phone)) {
      setPhoneError('El número de teléfono debe tener entre 9 y 15 dígitos y puede comenzar con +.');
      hasError = true;
    }

    if (hasError) return; // Stop if there are validation errors

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        setBirthdateError('');
        setPhoneError('No se encontró el token de acceso');
        return;
      }

      await axios.put(`${BASE_URL}/users/update/`, { birthdate, phone }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      // Success: Navigate and clear errors
      setBirthdateError('');
      setPhoneError('');
      router.push('/IntroPreferencesScreen');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        setPhoneError(error.message || 'No se pudo actualizar el perfil');
      } else {
        setPhoneError('No se pudo actualizar el perfil');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completa tu Perfil</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fecha de nacimiento</Text>
        {Platform.OS === 'web' ? (
          <WebDatePicker selected={date} onChange={onWebDateChange} />
        ) : (
          <>
            <TouchableOpacity
              onPress={() => void setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateText}>{birthdate || 'Selecciona una fecha (YYYY-MM-DD)'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </>
        )}
        {birthdateError ? <Text style={styles.errorText}>{birthdateError}</Text> : null}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 698334522 o +34698334522"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            setPhoneError(''); // Clear error as user types
          }}
          keyboardType="phone-pad"
        />
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      </View>
      <TouchableOpacity style={styles.button} onPress={() => void handleCompleteProfile()}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F4F4F4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  dateButton: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
  },
  dateText: {
    color: '#333',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});