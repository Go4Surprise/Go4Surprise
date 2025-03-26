import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';
import { useWindowDimensions } from "react-native";
import { router } from 'expo-router';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CountDown from './CountDown';
import Reviews from './Reviews';
import Experiences from './Experiences';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin when component mounts
    void checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await AsyncStorage.getItem('isAdmin');
    setIsAdmin(adminStatus === 'true');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: width * 0.1 }]}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/images/logo.png")} style={styles.logo} />
          <Text style={styles.title}>Go4Surprise</Text>
        </View>
        <View style={styles.headerRightContainer}>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={() => router.push("/AdminPanel")}
            >
              <Ionicons name="shield-checkmark" size={24} color="#1877F2" />
              <Text style={styles.adminText}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push("/Profile")}>
            <Image source={require("../assets/images/user-logo-none.png")} style={styles.profileIcon} />
          </TouchableOpacity>
        </View>
      </View>
      <CountDown />
      <View style={styles.centeredContainer}>
        <ImageBackground
          source={require("../assets/images/LittleBackground.jpg")}
          style={[styles.background, { height: width < 600 ? 250 : 350 }]} // 🔹 Ajusta altura según el ancho
          imageStyle={styles.image}
        >
          <View style={styles.overlayContent}>
            <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 30 : 50 }]}>
              ATRÉVETE A UNA
            </Text>
            <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 30 : 50 }]}>
              EXPERIENCIA SORPRESA
            </Text>
            <Text style={[styles.subsubtitle, { fontSize: isSmallScreen ? 18 : 30 }]}>
              ¡Descubre la experiencia 24 horas antes!
            </Text>
            <TouchableOpacity
              style={styles.surpriseButton}
              activeOpacity={0.8}
              onPress={() => router.push("/RegisterBookings")}
            >
              <Text style={styles.surpriseButtonText}>¡Sorpréndeme!</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      <Reviews navigation={navigation} />
      <Experiences />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#004AAD",
  },
  profileIcon: {
    width: 35,
    height: 35,
  },
  navText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginHorizontal: 50,
  },
  centeredContainer: {
    alignSelf: "center",
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  background: {
    width: "100%", // 🔹 Ocupará el 90% del ancho de la pantalla
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    opacity: 0.6,
  },
  overlayContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#004AAD",
    textAlign: "center",
    marginBottom: 5,
    textShadowColor: "rgba(3, 25, 120, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subsubtitle: {
    fontSize: 30,
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  surpriseButton: {
    backgroundColor: "blue",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: "#FF6F61",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  surpriseButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  experienceCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 15,
  },
  experienceImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  contentBox: {
    padding: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#004AAD',
  },
  reviewContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewStars: {
    fontSize: 16,
    color: '#FFD700',
  },
  reviewDate: {
    fontSize: 14,
    color: '#777',
  },
  reviewContent: {
    fontSize: 14,
    color: '#333',
  },
  linkText: {
    color: 'blue',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: 8,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginRight: 15,
    width: 200,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1877F2',
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
  },
  adminText: {
    marginLeft: 5,
    color: '#1877F2',
    fontWeight: 'bold',
  },
});