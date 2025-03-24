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
}

// Define specific keys for the categories to avoid dynamic property access
interface CategorySelections {
  [key: string]: string[];
  "Música"?: string[];
  "Cultura y Arte"?: string[];
  "Deporte y Motor"?: string[];
  "Gastronomía"?: string[];
  "Ocio Nocturno"?: string[];
  "Aventura"?: string[];
}

const questions: Question[] = [
  { id: 1, question: 'Si tu vida fuera una película, ¿qué género sería?', category: 'Música', options: ['🎤 Un festival épico', '🎭 Un musical emocionante', '🎸 Un concierto íntimo', '🎻 Un evento clásico', '🚫 Nada en especial'] },
  { id: 2, question: 'Si descubres una nueva ciudad, ¿qué te atrae más?', category: 'Cultura y Arte', options: ['🏛️ Las calles históricas', '🖼️ Un museo impresionante', '🎭 Una obra de teatro', '🎉 Un evento local', '🚫 Nada en especial'] },
  { id: 3, question: '¿Cuál de estas emociones te hace sentir más vivo?', category: 'Deporte y Motor', options: ['⚽ Gritar en un estadio', '🏎️ Sentir la velocidad', '🏆 Competir en un torneo', '🔥 Vivir la adrenalina de una carrera', '🚫 Nada en especial'] },
  { id: 4, question: 'Si pudieras comer algo ahora mismo, ¿qué elegirías?', category: 'Gastronomía', options: ['🥞 Un brunch con amigos', '🍷 Una cata de vinos', '👨‍🍳 Cocinar algo creativo', '🍽️ Degustar comida gourmet', '🚫 Nada en especial'] },
  { id: 5, question: '¿Cómo disfrutarías más tu tiempo libre?', category: 'Ocio Nocturno', options: ['💃 Bailando sin parar', '🕵️‍♂️ Ganando en un escape room', '🕹️ Jugando en un arcade', '🕶️ Viviendo una experiencia de realidad virtual', '🚫 Nada en especial'] },
  { id: 6, question: '¿Cómo describirías tu espíritu aventurero?', category: 'Aventura', options: ['⛰️ Adrenalina pura', '🪂 Amo las alturas', '🌲 Explorar la naturaleza', '💪 Reto físico extremo', '🚫 Nada en especial'] },
];

// Component for rendering a question option
const QuestionOption = ({
  option,
  index,
  isSelected,
  onOptionSelect
}: {
  option: string;
  index: number;
  isSelected: boolean;
  onOptionSelect: (option: string) => void;
}) => (
  <TouchableOpacity
    key={index}
    style={[
      styles.optionButton, 
      isSelected ? styles.selectedOption : null
    ]}
    onPress={() => {onOptionSelect(option)}}
  >
    <Text style={styles.optionText}>{option}</Text>
  </TouchableOpacity>
);

export default function PreferencesFormScreen(): React.ReactElement {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<CategorySelections>({});
  const [error, setError] = useState<string>('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Helper function to get the current question safely
  const getCurrentQuestion = (index: number): Question => {
    // Validate index is an integer
    const safeIndex = Math.floor(Number(index));
    
    // Ensure index is within bounds of the array
    if (!Number.isNaN(safeIndex) && safeIndex >= 0 && safeIndex < questions.length) {
      return questions[safeIndex];
    }
    
    // Default to first question if somehow out of bounds
    return questions[0];
  };

  // Helper function to get category selections safely
  const getCategorySelections = (category: string, selections: CategorySelections): string[] => {
    switch (category) {
      case 'Música':
        return selections.Música ?? [];
      case 'Cultura y Arte':
        return selections["Cultura y Arte"] ?? [];
      case 'Deporte y Motor':
        return selections["Deporte y Motor"] ?? [];
      case 'Gastronomía':
        return selections.Gastronomía ?? [];
      case 'Ocio Nocturno':
        return selections["Ocio Nocturno"] ?? [];
      case 'Aventura':
        return selections.Aventura ?? [];
      default:
        return [];
    }
  };

  // Helper function to update selections for a specific category
  const updateCategorySelections = (
    category: string, 
    currentSelections: string[], 
    option: string
  ): string[] => {
    if (option === '🚫 Nada en especial' || option === '🚫 Prefiero no responder') {
      return [option];
    }
    
    // Si ya está seleccionado, quitarlo
    if (currentSelections.includes(option)) {
      return currentSelections.filter(item => item !== option);
    }
    
    // Si no está seleccionado, añadirlo y quitar opciones neutrales
    return [
      ...currentSelections.filter(item => 
        item !== '🚫 Nada en especial' && item !== '🚫 Prefiero no responder'
      ), 
      option
    ];
  };

  // Helper function to create a new selections object
  const createNewSelectedOptions = (
    category: string,
    updatedSelections: string[],
    oldSelections: CategorySelections
  ): CategorySelections => {
    const newSelectedOptions: CategorySelections = { ...oldSelections };
    
    // Update or add the category
    switch (category) {
      case 'Música':
        newSelectedOptions.Música = updatedSelections;
        break;
      case 'Cultura y Arte':
        newSelectedOptions["Cultura y Arte"] = updatedSelections;
        break;
      case 'Deporte y Motor':
        newSelectedOptions["Deporte y Motor"] = updatedSelections;
        break;
      case 'Gastronomía':
        newSelectedOptions.Gastronomía = updatedSelections;
        break;
      case 'Ocio Nocturno':
        newSelectedOptions["Ocio Nocturno"] = updatedSelections;
        break;
      case 'Aventura':
        newSelectedOptions.Aventura = updatedSelections;
        break;
    }
    
    return newSelectedOptions;
  };

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
    
    void fetchToken();
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
    const currentQuestion = getCurrentQuestion(currentQuestionIndex);
    const category = currentQuestion.category;
    
    // Get current selections for this category
    const currentSelections = getCategorySelections(category, selectedOptions);
    
    // Update selections for this category
    const updatedSelections = updateCategorySelections(category, currentSelections, option);
    
    // Create new selected options object
    const newSelectedOptions = createNewSelectedOptions(category, updatedSelections, selectedOptions);
    
    setSelectedOptions(newSelectedOptions);
    setError('');
  };

  const nextQuestion = () => {
    const currentQuestion = getCurrentQuestion(currentQuestionIndex);
    const category = currentQuestion.category;

    if (!selectedOptions[category].length) {
      setError('Debes seleccionar al menos una opción.');
      return;
    }
    
    setError('');
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      void submitPreferences();
    }
  };

  const submitPreferences = async () => {
    if (!token) return;
  
    try {
      // Using an explicit mapping approach to avoid bracket notation
      const payload = {
        music: selectedOptions.Música ?? ["🚫 Nada en especial"],
        culture: selectedOptions["Cultura y Arte"] ?? ["🚫 Nada en especial"],
        sports: selectedOptions["Deporte y Motor"] ?? ["🚫 Nada en especial"],
        gastronomy: selectedOptions.Gastronomía ?? ["🚫 Nada en especial"],
        nightlife: selectedOptions["Ocio Nocturno"] ?? ["🚫 Nada en especial"],
        adventure: selectedOptions.Aventura ?? ["🚫 Nada en especial"]
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
  
  // Render question options - simplified
  const renderOptions = () => {
    const currentQuestion = getCurrentQuestion(currentQuestionIndex);
    const category = currentQuestion.category;
    const categorySelections = getCategorySelections(category, selectedOptions);
    
    return currentQuestion.options.map((option, index) => (
      <QuestionOption
        key={index}
        option={option}
        index={index}
        isSelected={categorySelections.includes(option)}
        onOptionSelect={handleOptionSelect}
      />
    ));
  };
  
  // Get the question text
  const getQuestionText = () => {
    const currentQuestion = getCurrentQuestion(currentQuestionIndex);
    return currentQuestion.question;
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? (
        <>
          <Text style={styles.question}>{getQuestionText()}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {renderOptions()}
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