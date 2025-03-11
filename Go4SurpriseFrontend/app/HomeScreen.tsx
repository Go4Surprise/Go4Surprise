import React from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';
import { router, Stack } from 'expo-router';
import { useNavigation } from 'expo-router';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
        <>
            <Stack.Screen options={{ headerShown: false }} />
        </>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Go4Surprise</Text>
        </View>
        <View style={styles.navLinks}>
          <TouchableOpacity><Text style={styles.navText}>COUNT-DOWN</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.navText}>RESEÑAS</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/MyBookings')}><Text style={styles.navText}>MIS RESERVAS</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoContainer}>
          <Image source={require('../assets/images/user-logo-none.png')} style={styles.profileIcon} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.centeredContainer}>
        <ImageBackground source={require('../assets/images/LittleBackground.jpg')} style={styles.background} imageStyle={styles.image}>
          <View style={styles.overlayContent}>
            <Text style={styles.subtitle}>¿No tienes ganas de organizar un evento? Deja que nosotros te demos una sorpresa</Text>
            <Text style={styles.subsubtitle}>Descubre el evento 24 horas antes</Text>
            <TouchableOpacity style={styles.surpriseButton} onPress={() => router.push('/RegisterBookings')}>
              <Text style={styles.surpriseButtonText}>¡Sorpréndeme!</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      
      <View style={styles.contentBox}>
        <Text style={styles.sectionTitle}>¿No te lo crees? Mira la opinión de otras personas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewUser}>Juan Pérez</Text>
            <Text style={styles.reviewStars}>★★★★★</Text>
            <Text style={styles.reviewDate}>1 de Enero, 2023</Text>
            <Text style={styles.reviewContent}>¡Fue una experiencia increíble! Muy recomendable.</Text>
          </View>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewUser}>María López</Text>
            <Text style={styles.reviewStars}>★★★★☆</Text>
            <Text style={styles.reviewDate}>15 de Febrero, 2023</Text>
            <Text style={styles.reviewContent}>Muy divertido, aunque me hubiera gustado más variedad.</Text>
          </View>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewUser}>Carlos Gómez</Text>
            <Text style={styles.reviewStars}>★★★★★</Text>
            <Text style={styles.reviewDate}>10 de Marzo, 2023</Text>
            <Text style={styles.reviewContent}>Definitivamente lo haré otra vez. ¡Muy recomendado!</Text>
          </View>
        </ScrollView>
        <Text style={styles.linkText} onPress={() => navigation.navigate('MoreReviews')}>
          Más opiniones
        </Text>
      </View>

      <View style={styles.contentBox}>
        <Text style={styles.sectionTitle}>Algunas de las experiencias que ofrecemos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.experienceCard}>
            <Image source={{uri: 'https://e00-elmundo.uecdn.es/assets/multimedia/imagenes/2021/11/08/16363869596750.jpg'}} style={styles.experienceImage} />
            <Text style={styles.experienceTitle}>Cena a ciegas</Text>
          </View>
          <View style={styles.experienceCard}>
            <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Escape_Room_-_%22The_Expedition%22_%28Escape_Quest_Bethesda%29.jpg'}} style={styles.experienceImage} />
            <Text style={styles.experienceTitle}>Escape Room</Text>
          </View>
          <View style={styles.experienceCard}>
            <Image source={{uri: 'https://d2exd72xrrp1s7.cloudfront.net/www/gu/guvk13n7fs5rboxjeh2z5up04degi9c5-c1860640-full/18cb1ec8f9c?width=2688&height=995&crop=true&q=40'}} style={styles.experienceImage} />
            <Text style={styles.experienceTitle}>Aventura en la naturaleza</Text>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
      logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      logo: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: 10,
      },
      title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#004AAD',
      },
      navLinks: {
        flexDirection: 'row',
        gap: 20,
      },
      navText: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
        marginHorizontal: 50,
      },
      profileIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
      },
      centeredContainer: {
        alignItems: 'center',
        marginVertical: 20,
      },
      background: {
        width: '90%',
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
      },
      image: {
        borderRadius: 15,
      },
      overlayContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
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
        subtitle: {
          fontSize: 18,
          textAlign: 'center',
          marginBottom: 10,
        },
        subsubtitle: {
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 20,
        },
        surpriseButton: {
          backgroundColor: '#004AAD',
          paddingVertical: 12,
          paddingHorizontal: 40,
          borderRadius: 8,
        },
        surpriseButtonText: {
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
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
    });