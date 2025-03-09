import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ImageBackground, ScrollView 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PreferencesFormScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // Numeric rating fields (0-5)
  const [adventure, setAdventure] = useState('0');
  const [culture, setCulture] = useState('0');
  const [sports, setSports] = useState('0');
  const [gastronomy, setGastronomy] = useState('0');
  const [nightlife, setNightlife] = useState('0');
  const [music, setMusic] = useState('0');

  // Additional questions
  const [preferredEventType, setPreferredEventType] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('accessToken');
      console.log('Token:', storedToken);
      if (!storedToken) {
        Alert.alert('Error', 'No token found. Please log in again.');
        router.push('/LoginScreen');
      } else {
        setToken(storedToken);
      }
  };
    fetchToken();
  }, []);

  const handleSubmitPreferences = async () => {
    if (!token) return;
    try {
      await axios.patch(
        'http://localhost:8000/users/preferences/',
        {
          adventure: parseInt(adventure, 10),
          culture: parseInt(culture, 10),
          sports: parseInt(sports, 10),
          gastronomy: parseInt(gastronomy, 10),
          nightlife: parseInt(nightlife, 10),
          music: parseInt(music, 10),
          preferred_event_type: preferredEventType,
          group_size: groupSize,
          dietary_restrictions: dietaryRestrictions,
          preferred_time: preferredTime,
          budget_range: budgetRange,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Éxito', 'Preferencias actualizadas correctamente');
      router.push('/HomeScreen');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron actualizar las preferencias');
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/Background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Cuestionario de Preferencias</Text>

          {/* Numeric Ratings */}
          <Text style={styles.question}>¿Cuánto disfrutas actividades de aventura? (0-5)</Text>
          <TextInput
            style={styles.input}
            value={adventure}
            onChangeText={setAdventure}
            keyboardType="numeric"
          />

          <Text style={styles.question}>¿Qué tan interesado estás en experiencias culturales? (0-5)</Text>
          <TextInput
            style={styles.input}
            value={culture}
            onChangeText={setCulture}
            keyboardType="numeric"
          />

          <Text style={styles.question}>¿Qué tan interesado estás en deportes? (0-5)</Text>
          <TextInput
            style={styles.input}
            value={sports}
            onChangeText={setSports}
            keyboardType="numeric"
          />

          <Text style={styles.question}>¿Qué tan emocionado estás por experiencias gastronómicas? (0-5)</Text>
          <TextInput
            style={styles.input}
            value={gastronomy}
            onChangeText={setGastronomy}
            keyboardType="numeric"
          />

          <Text style={styles.question}>¿Qué tan importante es para ti la vida nocturna? (0-5)</Text>
          <TextInput
            style={styles.input}
            value={nightlife}
            onChangeText={setNightlife}
            keyboardType="numeric"
          />

          <Text style={styles.question}>¿Qué tan interesado estás en la música? (0-5)</Text>
          <TextInput
            style={styles.input}
            value={music}
            onChangeText={setMusic}
            keyboardType="numeric"
          />

          {/* Additional Questions */}
          <Text style={styles.question}>¿Qué tipo de evento te gustaría asistir?</Text>
          <Picker
            selectedValue={preferredEventType}
            style={styles.picker}
            onValueChange={(itemValue) => setPreferredEventType(itemValue)}
          >
            <Picker.Item label="Selecciona un tipo" value="" />
            <Picker.Item label="Mystery Event" value="Mystery Event" />
            <Picker.Item label="Themed Party" value="Themed Party" />
            <Picker.Item label="Outdoor Adventure" value="Outdoor Adventure" />
            <Picker.Item label="Cultural Tour" value="Cultural Tour" />
            <Picker.Item label="Food & Drink Experience" value="Food & Drink Experience" />
            <Picker.Item label="Live Music/Concert" value="Live Music/Concert" />
          </Picker>

          <Text style={styles.question}>¿Cuál es el tamaño de tu grupo típico?</Text>
          <Picker
            selectedValue={groupSize}
            style={styles.picker}
            onValueChange={(itemValue) => setGroupSize(itemValue)}
          >
            <Picker.Item label="Selecciona una opción" value="" />
            <Picker.Item label="Solo" value="Solo" />
            <Picker.Item label="Pareja" value="Couple" />
            <Picker.Item label="Pequeño (3-5 personas)" value="Small Group" />
            <Picker.Item label="Grande (6+ personas)" value="Large Group" />
          </Picker>

          <Text style={styles.question}>¿Tienes alguna restricción alimentaria? (opcional)</Text>
          <TextInput
            style={styles.input}
            value={dietaryRestrictions}
            onChangeText={setDietaryRestrictions}
            placeholder="Ejemplo: Vegetariano, Sin gluten, etc."
          />

          <Text style={styles.question}>¿En qué momento del día prefieres los eventos?</Text>
          <Picker
            selectedValue={preferredTime}
            style={styles.picker}
            onValueChange={(itemValue) => setPreferredTime(itemValue)}
          >
            <Picker.Item label="Selecciona una opción" value="" />
            <Picker.Item label="Mañana" value="Morning" />
            <Picker.Item label="Tarde" value="Afternoon" />
            <Picker.Item label="Noche" value="Evening" />
            <Picker.Item label="Sin preferencia" value="No Preference" />
          </Picker>

          <Text style={styles.question}>¿Cuál es tu rango de presupuesto?</Text>
          <Picker
            selectedValue={budgetRange}
            style={styles.picker}
            onValueChange={(itemValue) => setBudgetRange(itemValue)}
          >
            <Picker.Item label="Selecciona una opción" value="" />
            <Picker.Item label="Bajo" value="Low" />
            <Picker.Item label="Medio" value="Medium" />
            <Picker.Item label="Alto" value="High" />
          </Picker>

          <TouchableOpacity style={styles.button} onPress={handleSubmitPreferences}>
            <Text style={styles.buttonText}>Guardar Preferencias</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004AAD',
  },
  container: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    margin: 20,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  picker: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 10,
  }
});
