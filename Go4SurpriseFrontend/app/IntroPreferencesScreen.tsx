import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function IntroPreferencesScreen() {
  const router = useRouter();
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const screenWidth = Dimensions.get('window').width;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.8)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  // Confetis con desfases diferentes
  const confetti1 = useRef(new Animated.Value(0)).current;
  const confetti2 = useRef(new Animated.Value(-screenHeight / 2)).current;

  useEffect(() => {
    const updateHeight = () => {
      setScreenHeight(Dimensions.get('window').height);
    };
    const subscription = Dimensions.addEventListener('change', updateHeight);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.07,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const animateConfetti = (
        animatedValue: Animated.Value,
        delay = 0
      ) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: screenHeight,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -screenHeight,
            duration: 8000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateConfetti(confetti1, 0);
    animateConfetti(confetti2, 6666);

    return () => {
      subscription.remove();
    };    
  }, [screenHeight]);

  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(0);  // Reinicia opacidad
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, [])
  );  

  const handleStart = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.push('/PreferencesFormScreen');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.wrapper, { minHeight: screenHeight }]}>
        <Animated.Image
          source={require('../assets/images/confeti.png')}
          style={[
            styles.backgroundImage,
            {
              height: screenHeight * 2,
              transform: [{ translateY: confetti1 }],
            },
          ]}
        />
        <Animated.Image
          source={require('../assets/images/confeti.png')}
          style={[
            styles.backgroundImage,
            {
              height: screenHeight * 2,
              transform: [{ translateY: confetti2 }],
            },
          ]}
        />

        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Animated.Image
            source={require('../assets/images/intro-preferences-illustration.png')}
            style={[
              styles.image,
              screenWidth < 400 && { width: 220, height: 220 },
              { transform: [{ scale: imageScale }] },
            ]}
          />

          <Text style={styles.welcome}>¡Bienvenido/a!</Text>
          <Text style={styles.title}>
            ¡Prepárate para descubrir experiencias <Text style={styles.highlight}>sorpresa</Text>!
          </Text>

          <Text style={styles.description}>
            Solo necesitas responder unas preguntas para que podamos crear eventos únicos adaptados a tus gustos.
          </Text>

          <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
            <TouchableOpacity style={styles.button} onPress={handleStart}>
              <Text style={styles.buttonText}>🚀 Empezar cuestionario</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.note}>¡Te llevará menos de 1 minuto ⏱!</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFF5FC',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: -50,
    left: 0,
    width: '100%',
    resizeMode: 'cover',
    opacity: 0.12,
    zIndex: -1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  image: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  welcome: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  highlight: {
    color: '#E91E63',
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    color: '#555',
    marginBottom: 30,
    paddingHorizontal: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
});
