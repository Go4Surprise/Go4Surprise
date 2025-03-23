import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/apiUrl';

interface Question {
  id: number;
  question: string;
  category: string;
  options: string[];
};

type CategorySelections = Record<string, string[]>;
type Preferences = Record<string, string[]>;

const questions: Question[] = [
  { id: 1, question: 'Si tu vida fuera una película, ¿qué género sería?', category: 'Música', options: ['🎤 Un festival épico', '🎭 Un musical emocionante', '🎸 Un concierto íntimo', '🎻 Un evento clásico', '🚫 Nada en especial'] },
  { id: 2, question: 'Si descubres una nueva ciudad, ¿qué te atrae más?', category: 'Cultura y Arte', options: ['🏛️ Las calles históricas', '🖼️ Un museo impresionante', '🎭 Una obra de teatro', '🎉 Un evento local', '🚫 Nada en especial'] },
  { id: 3, question: '¿Cuál de estas emociones te hace sentir más vivo?', category: 'Deporte y Motor', options: ['⚽ Gritar en un estadio', '🏎️ Sentir la velocidad', '🏆 Competir en un torneo', '🔥 Vivir la adrenalina de una carrera', '🚫 Nada en especial'] },
  { id: 4, question: 'Si pudieras comer algo ahora mismo, ¿qué elegirías?', category: 'Gastronomía', options: ['🥞 Un brunch con amigos', '🍷 Una cata de vinos', '👨‍🍳 Cocinar algo creativo', '🍽️ Degustar comida gourmet', '🚫 Nada en especial'] },
  { id: 5, question: '¿Cómo disfrutarías más tu tiempo libre?', category: 'Ocio Nocturno', options: ['💃 Bailando sin parar', '🕵️‍♂️ Ganando en un escape room', '🕹️ Jugando en un arcade', '🕶️ Viviendo una experiencia de realidad virtual', '🚫 Nada en especial'] },
  { id: 6, question: '¿Cómo describirías tu espíritu aventurero?', category: 'Aventura', options: ['⛰️ Adrenalina pura', '🪂 Amo las alturas', '🌲 Explorar la naturaleza', '💪 Reto físico extremo', '🚫 Nada en especial'] },
];

export default function PreferencesFormScreen(): React.ReactElement {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<CategorySelections>({});
  const [error, setError] = useState<string>('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (!storedToken) {
          Alert.alert('Error', 'No token found. Please log in again.');
          router.push('/LoginScreen');
        } else {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error fetching token:', error);
        Alert.alert('Error', 'Hubo un problema al recuperar tu sesión');
        router.push('/LoginScreen');
      }
    };
    
    fetchToken();
    fadeIn();
  }, [currentQuestionIndex, router]);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleOptionSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const category = currentQuestion.category;
    // Solución más segura: usar Object.entries para encontrar la categoría correcta
    const currentSelections = [...(Object.entries(selectedOptions)
      .find(([key]) => key === category)?.[1] ?? [])];
    
    let updatedSelections: string[];
    
    if (option === '🚫 Nada en especial' || option === '🚫 Prefiero no responder') {
      updatedSelections = [option];
    } else {
      // Si ya está seleccionado, quitarlo
      if (currentSelections.includes(option)) {
        updatedSelections = currentSelections.filter(item => item !== option);
      } else {
        // Si no está seleccionado, añadirlo y quitar opciones neutrales
        updatedSelections = [
          ...currentSelections.filter(item => 
            item !== '🚫 Nada en especial' && item !== '🚫 Prefiero no responder'
          ), 
          option
        ];
      }
    }
    
    // Crear un nuevo objeto de opciones seleccionadas de manera segura
    const newSelectedOptions = Object.entries(selectedOptions).reduce(
      (acc, [key, value]) => {
        acc[key] = key === category ? updatedSelections : value;
        return acc;
      },
      {}
    );
    
    // Para categorías que aún no existen en el objeto
    if (!Object.keys(newSelectedOptions).includes(category)) {
      newSelectedOptions[category] = updatedSelections;
    }
    
    setSelectedOptions(newSelectedOptions);
    setError('');
  };

  const nextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const category = currentQuestion.category;
    if (!selectedOptions[category]?.length) {
      setError('Debes seleccionar al menos una opción.');
      return;
    }
    
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
        adventure: selectedOptions["Aventura"] || ["🚫 Nada en especial"]
      };
  
      console.log("Datos enviados:", payload);
  
      await axios.patch(
        `${BASE_URL}/users/preferences/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      Alert.alert("¡Listo!", "Tus preferencias han sido guardadas.");
      router.push("/HomeScreen");
    } catch (error) {
      console.error("Error guardando preferencias:", error);
      Alert.alert("Error", "No se pudieron guardar las preferencias");
    }
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? (
        <>
          <Text style={styles.question}>{questions[currentQuestionIndex].question}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
          {questions[currentQuestionIndex].options.map((option, index) => {
            const category = questions[currentQuestionIndex].category;
            // Solución más segura para obtener selecciones de categoría
            const categorySelections = Object.entries(selectedOptions)
            .find(([key]) => key === category)?.[1] ?? [];
            const isSelected = categorySelections.includes(option);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton, 
                  isSelected ? styles.selectedOption : null
                ]}
                onPress={() => handleOptionSelect(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      ) : null}

      <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
        <Text style={styles.buttonText}>
          {currentQuestionIndex < questions.length - 1 ? 'Siguiente' : 'Finalizar'}
        </Text>
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