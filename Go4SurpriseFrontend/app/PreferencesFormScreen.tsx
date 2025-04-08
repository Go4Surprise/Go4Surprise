import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert, Animated, View, SafeAreaView, StatusBar, Dimensions, Platform, ScrollView } from 'react-native';
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
type CategorySelections = Record<string, string[]>;

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
  onOptionSelect,
  isLargeScreen
}: {
  option: string;
  index: number;
  isSelected: boolean;
  onOptionSelect: (option: string) => void;
  isLargeScreen?: boolean;
}) => (
  <TouchableOpacity
    key={index}
    style={[
      styles.optionButton, 
      isSelected ? styles.selectedOption : null
    ]}
    activeOpacity={0.7}
    onPress={() => {onOptionSelect(option)}}
  >
    <Text 
      style={[
        styles.optionText, 
        isSelected ? styles.selectedOptionText : null,
        isLargeScreen && { fontSize: 18 }
      ]}
    >
      {option}
    </Text>
    {isSelected && (
      <View style={styles.checkmark}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function PreferencesFormScreen(): React.ReactElement {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<CategorySelections>({});
  const [error, setError] = useState<string>('');
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const cardOpacity = useState(new Animated.Value(1))[0];
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [isLargeScreen, setIsLargeScreen] = useState(screenWidth > 768);

  // Handle screen dimension changes
  useEffect(() => {
    const handleDimensionChange = ({ window }) => {
      setIsLargeScreen(window.width > 768);
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionChange);
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

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
        return selections.Música || [];
      case 'Cultura y Arte':
        return selections["Cultura y Arte"] || [];
      case 'Deporte y Motor':
        return selections["Deporte y Motor"] || [];
      case 'Gastronomía':
        return selections.Gastronomía || [];
      case 'Ocio Nocturno':
        return selections["Ocio Nocturno"] || [];
      case 'Aventura':
        return selections.Aventura || [];
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
          Alert.alert('Error', 'No se encontró ningún token. Inicie sesión de nuevo.');
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
  }, [router]);

  // Animation when question changes
  useEffect(() => {
    animateTransition();
  }, [currentQuestionIndex]);

  const animateTransition = () => {
    // Fade out current card
    Animated.sequence([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      // Reset position while invisible
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 0,
        useNativeDriver: true,
      }),
      // Fade in and slide to position
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };

  const isCategorySelected = (): boolean => {
    const currentQuestion = getCurrentQuestion(currentQuestionIndex);
    const category = currentQuestion.category;
    const selections = getCategorySelections(category, selectedOptions);
    return selections.length > 0;
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
      void submitPreferences();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError('');
    }
  };
  
  const submitPreferences = async () => {
    if (!token) return;
  
    try {
      // Using an explicit mapping approach to avoid bracket notation
      const payload = {
        music: selectedOptions.Música.length > 0 ? selectedOptions.Música : ["🚫 Nada en especial"],
        culture: selectedOptions["Cultura y Arte"].length > 0 ? selectedOptions["Cultura y Arte"] : ["🚫 Nada en especial"],
        sports: selectedOptions["Deporte y Motor"].length > 0 ? selectedOptions["Deporte y Motor"] : ["🚫 Nada en especial"],
        gastronomy: selectedOptions.Gastronomía.length > 0 ? selectedOptions.Gastronomía : ["🚫 Nada en especial"],
        nightlife: selectedOptions["Ocio Nocturno"].length > 0 ? selectedOptions["Ocio Nocturno"] : ["🚫 Nada en especial"],
        adventure: selectedOptions.Aventura.length > 0 ? selectedOptions.Aventura : ["🚫 Nada en especial"]
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

  const getImageForCategory = (category: string) => {
    switch (category) {
      case 'Música':
        return require('../assets/images/musica.png');
      case 'Cultura y Arte':
        return require('../assets/images/cultura.png');
      case 'Deporte y Motor':
        return require('../assets/images/deporte.png');
      case 'Gastronomía':
        return require('../assets/images/gastronomia.png');
      case 'Ocio Nocturno':
        return require('../assets/images/ocionocturno.png');
      case 'Aventura':
        return require('../assets/images/aventura.png');
      default:
        return null;
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        contentContainerStyle={[
          isLargeScreen ? styles.scrollViewLarge : styles.scrollViewMobile
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.container, 
          { opacity: fadeAnim },
          isLargeScreen && styles.containerLarge
        ]}>
          {/* Progress bar */}
          <View style={[
            styles.progressContainer,
            isLargeScreen && styles.progressContainerLarge
          ]}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
          
          {/* Card for question */}
          {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? (
            <Animated.View 
              style={[
                styles.card,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: slideAnim }]
                },
                isLargeScreen && styles.cardLarge
              ]}
            >
              <Animated.Image
                source={getImageForCategory(getCurrentQuestion(currentQuestionIndex).category)}
                style={[
                  styles.categoryIcon,
                  isLargeScreen && styles.categoryIconLarge
                ]}
              />

              <Text style={styles.categoryTag}>
                {getCurrentQuestion(currentQuestionIndex).category}
              </Text>

              <Text style={[
                styles.question,
                isLargeScreen && styles.questionLarge
              ]}>
                {getQuestionText()}
              </Text>
              
              <Text style={styles.helperText}>
                Selecciona las opciones que te interesen
              </Text>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <View style={[
                styles.optionsContainer,
                isLargeScreen && styles.optionsContainerLarge
              ]}>
                {renderOptions()}
              </View>
            </Animated.View>
          ) : null}

          {/* Navigation buttons */}
          <View style={[
            styles.buttonRow,
            isLargeScreen && styles.buttonRowLarge
          ]}>
            {currentQuestionIndex > 0 ? (
              <TouchableOpacity 
                style={[
                  styles.backButton,
                  isLargeScreen && styles.backButtonLarge
                ]} 
                onPress={prevQuestion}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonSpacer} />
            )}

            <TouchableOpacity 
              style={[
                styles.nextButton, 
                !isCategorySelected() && styles.disabledButton,
                isLargeScreen && styles.nextButtonLarge
              ]} 
              onPress={nextQuestion}
              disabled={!isCategorySelected()}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'Siguiente' : 'Finalizar'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
  
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollViewMobile: {
    flexGrow: 1,
  },
  scrollViewLarge: {
    flexGrow: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
  },
  containerLarge: {
    maxWidth: 800,
    width: '90%',
    alignSelf: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressContainerLarge: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF385C', // Tinder red
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    flex: 1,
  },
  cardLarge: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
    padding: 32,
    minHeight: 450,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  categoryIconLarge: {
    width: 80,
    height: 80,
  },
  categoryTag: {
    alignSelf: 'center',
    fontSize: 14,
    color: '#555555',
    backgroundColor: '#F5F8FA', // Twitter light blue bg
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    fontWeight: '600',
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#000000',
    lineHeight: 30,
  },
  questionLarge: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 24,
  },
  helperText: {
    fontSize: 15,
    color: '#657786', // Twitter secondary text
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 10,
    width: '100%',
  },
  optionsContainerLarge: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E1E8ED', // Twitter border color
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        borderColor: '#1DA1F2',
        transform: [{scale: 1.02}],
      }
    }),
  },
  selectedOption: {
    backgroundColor: '#F5F8FA',
    borderColor: '#1DA1F2', // Twitter blue
  },
  optionText: {
    color: '#14171A', // Twitter primary text
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: '#1DA1F2', // Twitter blue
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1DA1F2', // Twitter blue
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {  
    color: '#E0245E', // Twitter red
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
  },
  buttonRowLarge: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    padding: 16,
    borderRadius: 30,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        backgroundColor: '#F5F8FA',
      }
    }),
  },
  backButtonLarge: {
    width: 120,
  },
  buttonSpacer: {
    width: 100,
  },
  backButtonText: {
    color: '#1DA1F2', // Twitter blue
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#FF385C', // Tinder red
    padding: 16,
    borderRadius: 30,
    width: 120,
    alignItems: 'center',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        backgroundColor: '#FF1443',
        transform: [{scale: 1.03}],
      }
    }),
  },
  nextButtonLarge: {
    width: 150,
    padding: 18,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
    }),
  },
});