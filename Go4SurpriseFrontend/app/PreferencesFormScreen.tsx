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
    onPress={() => onOptionSelect(option)}
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
    // No need to check if currentQuestion exists since we're controlling the index
    // and making sure it's within bounds in the UI
    const currentQuestion = (() => {
      if (currentQuestionIndex === 0) return questions[0];
      if (currentQuestionIndex === 1) return questions[1];
      if (currentQuestionIndex === 2) return questions[2];
      if (currentQuestionIndex === 3) return questions[3];
      if (currentQuestionIndex === 4) return questions[4];
      if (currentQuestionIndex === 5) return questions[5];
      // This ensures a type-safe return that can't be undefined
      return questions[0]; // Default to first question if somehow out of bounds
    })();
    
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
    
    // Crear un nuevo objeto de opciones seleccionadas de manera segura sin usar notación de corchetes
    const newSelectedOptions: CategorySelections = {};
    
    // Copiar todas las categorías existentes de manera segura sin notación de corchetes
    if (selectedOptions.Música) {
      newSelectedOptions.Música = category === 'Música' ? updatedSelections : selectedOptions.Música;
    }
    if (selectedOptions["Cultura y Arte"]) {
      newSelectedOptions["Cultura y Arte"] = category === 'Cultura y Arte' ? updatedSelections : selectedOptions["Cultura y Arte"];
    }
    if (selectedOptions["Deporte y Motor"]) {
      newSelectedOptions["Deporte y Motor"] = category === 'Deporte y Motor' ? updatedSelections : selectedOptions["Deporte y Motor"];
    }
    if (selectedOptions.Gastronomía) {
      newSelectedOptions.Gastronomía = category === 'Gastronomía' ? updatedSelections : selectedOptions.Gastronomía;
    }
    if (selectedOptions["Ocio Nocturno"]) {
      newSelectedOptions["Ocio Nocturno"] = category === 'Ocio Nocturno' ? updatedSelections : selectedOptions["Ocio Nocturno"];
    }
    if (selectedOptions.Aventura) {
      newSelectedOptions.Aventura = category === 'Aventura' ? updatedSelections : selectedOptions.Aventura;
    }
    
    // Para categorías que aún no existen en el objeto
    // Usar un switch para asignar de forma segura según la categoría
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
        default:
          // En caso de una categoría no reconocida, no hacer nada
          break;
      }
    }
    
    setSelectedOptions(newSelectedOptions);
    setError('');
  };

  const nextQuestion = () => {
    // No need to check if currentQuestion exists since we're controlling the index
    // and making sure it's within bounds in the UI
    const currentQuestion = (() => {
      if (currentQuestionIndex === 0) return questions[0];
      if (currentQuestionIndex === 1) return questions[1];
      if (currentQuestionIndex === 2) return questions[2];
      if (currentQuestionIndex === 3) return questions[3];
      if (currentQuestionIndex === 4) return questions[4];
      if (currentQuestionIndex === 5) return questions[5];
      // This ensures a type-safe return that can't be undefined
      return questions[0]; // Default to first question if somehow out of bounds
    })();
    
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
        music: selectedOptions.Música || ["🚫 Nada en especial"],
        culture: selectedOptions["Cultura y Arte"] || ["🚫 Nada en especial"],
        sports: selectedOptions["Deporte y Motor"] || ["🚫 Nada en especial"],
        gastronomy: selectedOptions.Gastronomía || ["🚫 Nada en especial"],
        nightlife: selectedOptions["Ocio Nocturno"] || ["🚫 Nada en especial"],
        adventure: selectedOptions.Aventura || ["🚫 Nada en especial"]
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
  
  // Render question options
  const renderOptions = () => {
    // No need to check if currentQuestion exists since we're controlling the index
    // and making sure it's within bounds in the UI
    const currentQuestion = (() => {
      if (currentQuestionIndex === 0) return questions[0];
      if (currentQuestionIndex === 1) return questions[1];
      if (currentQuestionIndex === 2) return questions[2];
      if (currentQuestionIndex === 3) return questions[3];
      if (currentQuestionIndex === 4) return questions[4];
      if (currentQuestionIndex === 5) return questions[5];
      // This ensures a type-safe return that can't be undefined
      return questions[0]; // Default to first question if somehow out of bounds
    })();
    
    const category = currentQuestion.category;
    
    return currentQuestion.options.map((option, index) => {
      // Obtener las selecciones de categoría de forma segura
      let categorySelections: string[] = [];
      
      // Usar un switch para obtener las selecciones según la categoría
      switch (category) {
        case 'Música':
          categorySelections = selectedOptions.Música ?? [];
          break;
        case 'Cultura y Arte':
          categorySelections = selectedOptions["Cultura y Arte"] ?? [];
          break;
        case 'Deporte y Motor':
          categorySelections = selectedOptions["Deporte y Motor"] ?? [];
          break;
        case 'Gastronomía':
          categorySelections = selectedOptions.Gastronomía ?? [];
          break;
        case 'Ocio Nocturno':
          categorySelections = selectedOptions["Ocio Nocturno"] ?? [];
          break;
        case 'Aventura':
          categorySelections = selectedOptions.Aventura ?? [];
          break;
        default:
          // En caso de una categoría no reconocida, mantener vacío
          break;
      }
      
      const isSelected = categorySelections.includes(option);
      
      return (
        <QuestionOption
          key={index}
          option={option}
          index={index}
          isSelected={isSelected}
          onOptionSelect={handleOptionSelect}
        />
      );
    });
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? (
        <>
          <Text style={styles.question}>
            {(() => {
              // Safe access to question text without using bracket notation
              if (currentQuestionIndex === 0) return questions[0].question;
              if (currentQuestionIndex === 1) return questions[1].question;
              if (currentQuestionIndex === 2) return questions[2].question;
              if (currentQuestionIndex === 3) return questions[3].question;
              if (currentQuestionIndex === 4) return questions[4].question;
              if (currentQuestionIndex === 5) return questions[5].question;
              return "";
            })()}
          </Text>
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