import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const questions = [
  { id: 1, question: 'Si tu vida fuera una película, ¿qué género sería?', category: 'Música', options: ['🎤 Un festival épico', '🎭 Un musical emocionante', '🎸 Un concierto íntimo', '🎻 Un evento clásico', '🚫 Nada en especial'] },
  { id: 2, question: 'Si descubres una nueva ciudad, ¿qué te atrae más?', category: 'Cultura y Arte', options: ['🏛️ Las calles históricas', '🖼️ Un museo impresionante', '🎭 Una obra de teatro', '🎉 Un evento local', '🚫 Nada en especial'] },
  { id: 3, question: '¿Cuál de estas emociones te hace sentir más vivo?', category: 'Deporte y Motor', options: ['⚽ Gritar en un estadio', '🏎️ Sentir la velocidad', '🏆 Competir en un torneo', '🔥 Vivir la adrenalina de una carrera', '🚫 Nada en especial'] },
  { id: 4, question: 'Si pudieras comer algo ahora mismo, ¿qué elegirías?', category: 'Gastronomía', options: ['🥞 Un brunch con amigos', '🍷 Una cata de vinos', '👨‍🍳 Cocinar algo creativo', '🍽️ Degustar comida gourmet', '🚫 Nada en especial'] },
  { id: 5, question: '¿Cómo disfrutarías más tu tiempo libre?', category: 'Ocio Nocturno', options: ['💃 Bailando sin parar', '🕵️‍♂️ Ganando en un escape room', '🕹️ Jugando en un arcade', '🕶️ Viviendo una experiencia de realidad virtual', '🚫 Nada en especial'] },
  { id: 6, question: '¿Cómo describirías tu espíritu aventurero?', category: 'Aventura', options: ['⛰️ Adrenalina pura', '🪂 Amo las alturas', '🌲 Explorar la naturaleza', '💪 Reto físico extremo', '🚫 Nada en especial'] },
  { id: 7, question: '¿Tienes alguna restricción alimentaria? (Opcional)', category: 'DietaryRestrictions', input: true, optional: true },
  { id: 8, question: '¿Cuál es tu rango de presupuesto?', category: 'BudgetRange', options: ['💰 Bajo', '💵 Medio', '💎 Alto', '🚫 Prefiero no responder'] },
];

export default function PreferencesFormScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [preferences, setPreferences] = useState({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('accessToken');
      if (!storedToken) {
        Alert.alert('Error', 'No token found. Please log in again.');
        router.push('/LoginScreen');
      } else {
        setToken(storedToken);
      }
    };
    fetchToken();
    fadeIn();
  }, [currentQuestionIndex]);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleOptionSelect = (option: string) => {
    const category = questions[currentQuestionIndex]?.category || '';
    let updatedSelections = selectedOptions[category] || [];
    
    if (option === '🚫 Nada en especial' || option === '🚫 Prefiero no responder') {
      updatedSelections = [option];
    } else {
      updatedSelections = updatedSelections.includes(option)
        ? updatedSelections.filter(item => item !== option)
        : [...updatedSelections.filter(item => item !== '🚫 Nada en especial' && item !== '🚫 Prefiero no responder'), option];
    }
    
    setSelectedOptions((prev) => ({ ...prev, [category]: updatedSelections }));
    setError('');
  };

  const nextQuestion = () => {
    const category = questions[currentQuestionIndex].category;
    if (!questions[currentQuestionIndex].optional && !selectedOptions[category]?.length) {
      setError('Debes seleccionar al menos una opción.');
      return;
    }
    setPreferences((prev) => ({ ...prev, [category]: selectedOptions[category] || [] }));
    setInputValue('');
    setError('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitPreferences();
    }
  };

  const submitPreferences = async () => {
    if (!token) return;
  
    try {
      const payload = {
        music: selectedOptions["Música"] || ["🚫 Nada en especial"],
        culture: selectedOptions["Cultura y Arte"] || ["🚫 Nada en especial"],
        sports: selectedOptions["Deporte y Motor"] || ["🚫 Nada en especial"],
        gastronomy: selectedOptions["Gastronomía"] || ["🚫 Nada en especial"],
        nightlife: selectedOptions["Ocio Nocturno"] || ["🚫 Nada en especial"],
        adventure: selectedOptions["Aventura"] || ["🚫 Nada en especial"],
        dietary_restrictions: inputValue.trim() ? [inputValue.trim()] : [],
        budget_range: selectedOptions["BudgetRange"] || [],
      };
  
      console.log("Datos enviados:", payload); 
  
      await axios.patch(
        "http://localhost:8000/users/preferences/",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      Alert.alert("¡Listo!", "Tus preferencias han sido guardadas.");
      router.push("/HomeScreen");
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar las preferencias");
    }
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <Text style={styles.question}>{questions[currentQuestionIndex]?.question || ''}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {questions[currentQuestionIndex].input ? (
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Ejemplo: Vegetariano, Sin Gluten, Sin Lactosa"
          onSubmitEditing={() => handleOptionSelect(inputValue)}
        />
      ) : (
        questions[currentQuestionIndex]?.options?.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, selectedOptions[questions[currentQuestionIndex]?.category || '']?.includes(option) && styles.selectedOption]}
            onPress={() => handleOptionSelect(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
  },
  optionButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#004AAD',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {  
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});