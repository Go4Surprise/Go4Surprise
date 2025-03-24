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
}


const questions: Question[] = [
  { id: 1, question: '¿Qué tipo de experiencias relacionadas con la música sueles disfrutar más?', category: 'Música', options: ['🎉 Un festival épico', '🎭 Un musical emocionante', '🎤 Karaoke con amigos', '🎻 Un evento clásico', '🚫 Nada en especial'] },
  { id: 2, question: 'Si descubres una nueva ciudad, ¿qué te atrae más?', category: 'Cultura y Arte', options: ['🏛️ Las calles históricas', '🖼️ Un museo impresionante', '🎭 Una obra de teatro o espectáculos en vivo', '🧑‍🎨 Talleres creativos', '🚫 Nada en especial'] },
  { id: 3, question: '¿Cuál de estas emociones te hace sentir más vivo?', category: 'Deporte y Motor', options: ['⚽ Gritar en un estadio', '🏎️ Sentir la velocidad', '🏆 Competir en un torneo o competición', '🔥 Vivir la adrenalina de una carrera', '🚫 Nada en especial'] },
  { id: 4, question: '¿Qué tipo de experiencias gastronómicas disfrutas más?', category: 'Gastronomía', options: ['🎤 Un brunch con música en vivo', '🍷 Una cata de vinos', '👨‍🍳 Talleres de cocina', '🍽️ Degustar comida gourmet', '🚫 Nada en especial'] },
  { id: 5, question: '¿Qué actividades elegirías para pasarlo bien con amigos?', category: 'Ocio Nocturno', options: ['🔫Batallas de láser tag o paintball', '🕵️‍♂️ Escape Rooms o juegos en equipo', '🕹️ Arcades o realidad virtual', '🎉 Fiestas temáticas o discotecas', '🚫 Nada en especial'] },
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
    if (index >= 0 && index < questions.length) {
      return questions[index];
    }
    return questions[0]; // Default to first question if somehow out of bounds
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
    if (option === '🚫 Nada en especial') {
      return [option];
    }
    
    // Si ya está seleccionado, quitarlo
    if (currentSelections.includes(option)) {
      return currentSelections.filter(item => item !== option);
    }
    
    // Si no está seleccionado, añadirlo y quitar opciones neutrales
    return [
      ...currentSelections.filter(item => 
        item !== '🚫 Nada en especial'
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
    const newSelectedOptions: CategorySelections = {};
    
    // Copy existing categories
    if (oldSelections.Música) {
      newSelectedOptions.Música = category === 'Música' ? updatedSelections : oldSelections.Música;
    }
    if (oldSelections["Cultura y Arte"]) {
      newSelectedOptions["Cultura y Arte"] = category === 'Cultura y Arte' ? updatedSelections : oldSelections["Cultura y Arte"];
    }
    if (oldSelections["Deporte y Motor"]) {
      newSelectedOptions["Deporte y Motor"] = category === 'Deporte y Motor' ? updatedSelections : oldSelections["Deporte y Motor"];
    }
    if (oldSelections.Gastronomía) {
      newSelectedOptions.Gastronomía = category === 'Gastronomía' ? updatedSelections : oldSelections.Gastronomía;
    }
    if (oldSelections["Ocio Nocturno"]) {
      newSelectedOptions["Ocio Nocturno"] = category === 'Ocio Nocturno' ? updatedSelections : oldSelections["Ocio Nocturno"];
    }
    if (oldSelections.Aventura) {
      newSelectedOptions.Aventura = category === 'Aventura' ? updatedSelections : oldSelections.Aventura;
    }
    
    // Handle new categories
    if (!Object.prototype.hasOwnProperty.call(newSelectedOptions, category)) {
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
  
  // Helper function to render a single option
  const renderOption = (option: string, index: number, isSelected: boolean) => {
    return (
      <QuestionOption
        key={index}
        option={option}
        index={index}
        isSelected={isSelected}
        onOptionSelect={handleOptionSelect}
      />
    );
  };
  
  // Render question options - with reduced complexity
  const renderOptions = () => {
    const currentQuestion = getCurrentQuestion(currentQuestionIndex);
    const category = currentQuestion.category;
    const categorySelections = getCategorySelections(category, selectedOptions);
    
    return currentQuestion.options.map((option, index) => {
      const isSelected = categorySelections.includes(option);
      return renderOption(option, index, isSelected);
    });
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
          <Text style={styles.helperText}>Puedes marcar una o varias opciones según tus preferencias.</Text>
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
    backgroundColor: '#4098F5',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B3D9FF',
  },
  selectedOption: {
    backgroundColor: '#E91E63',
    borderColor: '#FFEAF4',
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
  helperText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },  

});