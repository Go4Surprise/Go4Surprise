import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, findNodeHandle } from 'react-native';
import { useRouter } from 'expo-router';
import { Dimensions, Linking, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
export default function IndexScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);


  const scrollToSection = (ref) => {
    ref?.current?.measureLayout(
      findNodeHandle(scrollRef.current),
      (x, y) => {
        scrollRef.current.scrollTo({ y: y, animated: true });
      }
    );
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  function VideosSection() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768; // Ajusta este valor si quieres otro breakpoint

    return (
      <View
        style={[
          styles.videosContainer,
          { flexDirection: isLargeScreen ? 'row' : 'column' }
        ]}
      >
        {/* Primer video */}
        <View style={[
          styles.videoWrapper,
          isLargeScreen ? { width: '45%' } : { width: '100%', marginBottom: 20 }
        ]}>
          {Platform.OS === 'web' ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/4WpYimpT-JU"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <WebView
              style={{ height: 200, width: '100%' }}
              javaScriptEnabled
              domStorageEnabled
              source={{ uri: 'https://www.youtube.com/embed/4WpYimpT-JU' }}
            />
          )}
        </View>

        {/* Segundo video */}
        <View style={[
          styles.videoWrapper,
          isLargeScreen ? { width: '45%' } : { width: '100%', marginBottom: 20 }
        ]}>
          {Platform.OS === 'web' ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/fNxMuoVXPS0"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <WebView
              style={{ height: 200, width: '100%' }}
              javaScriptEnabled
              domStorageEnabled
              source={{ uri: 'https://www.youtube.com/embed/fNxMuoVXPS0' }}
            />
          )}
        </View>
      </View >
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/fondolanding2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView ref={scrollRef} contentContainerStyle={{ flexGrow: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { scrollToSection(homeRef); }}>
            <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
          </TouchableOpacity>
          <View style={styles.navLinks}>
            <TouchableOpacity onPress={() => { scrollToSection(homeRef); }}>
              <Text style={styles.navItem}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { scrollToSection(aboutRef); }}>
              <Text style={styles.navItem}>Sobre nosotros</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { scrollToSection(contactRef); }}>
              <Text style={styles.navItem}>Contáctanos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN HOME */}
        <View ref={homeRef} style={styles.homeSection}>
          <View style={styles.homeTextContainer}>
            <Text style={styles.homeTitle}>GO4SURPRISE</Text>
            <Text style={styles.homeDescription}>
              En Go4Surprise, eligiendo una fecha y ciudad, serás capaz de asistir a un evento totalmente sorpresa.{"\n\n"}
              Estas entradas además gozarán de un precio reducido en comparación con las vendidas por la competencia para el mismo evento.
            </Text>
            <TouchableOpacity style={styles.getStartedBtn} onPress={() => router.push('/LoginScreen')}>
              <Text style={styles.getStartedText}>Comenzar</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* SECCIÓN ABOUT US */}
        <View ref={aboutRef} style={styles.aboutContainer}>
          <Text style={styles.aboutTitle}>Algunas de nuestras características</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🎯 Elección de fecha y lugar</Text>
              <Text style={styles.featureText}>Podrás acomodar la fecha y lugar del evento a tus necesidades.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🕒 Pistas a las 48 horas</Text>
              <Text style={styles.featureText}>48 horas antes recibirás una pista de tu evento, siendo este revelado 24 horas antes de su comienzo.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🎁 Revelación 24h antes</Text>
              <Text style={styles.featureText}>24 horas antes de tu evento recibirás un correo con los detalles de la experiencia que te toca disfrutar.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>📸 Presume de tus experiencias</Text>
              <Text style={styles.featureText}>Podrás compartir fotos y reseñas de todos los eventos realizados en la aplicación.</Text>
            </View>
          </View>
        </View>
        {/* SECCIÓN VIDEO */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={styles.aboutTitle}>¿Cómo funciona?</Text>
          <Text style={styles.homeDescription}>
            En el siguiente video te explicamos cómo funciona Go4Surprise.{"\n\n"}
            ¡No olvides suscribirte a nuestro canal!
          </Text>
          <VideosSection />
        </View>

        {/* SECCIÓN CONTACTO */}
        <View ref={contactRef} style={styles.contactSection}>
          <Text style={styles.contactTitle}>¿Tienes dudas o problemas?</Text>
          <Text style={styles.contactText}>
            Escríbenos a{' '}
            <Text
              style={styles.emailText}
              onPress={() => { void Linking.openURL('mailto:go4surprise.ispp@gmail.com') }}
            >
              go4surprise.ispp@gmail.com
            </Text>{' '}
            y te ayudaremos lo antes posible.
          </Text>
        </View>

        {/* FOOTER CON ENLACES LEGALES */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/PoliticaPrivacidad', params: { from: 'home' } })}>
            <Text style={styles.footerLink}>Política de Privacidad</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>|</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/CondicionesUso', params: { from: 'home' } })}>
            <Text style={styles.footerLink}>Condiciones de Uso</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
          <Ionicons name="arrow-up-circle" size={40} color="white" />
        </TouchableOpacity>


      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backdropFilter: 'blur(10px)',
  },
  headerLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  navLinks: {
    flexDirection: 'row',
  },
  navItem: {
    color: '#1f2937',
    fontWeight: '600',
    marginHorizontal: 12,
    fontSize: 16,
  },
  getStartedBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  getStartedText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 30,
  },
  homeSection: {
    height: Dimensions.get('window').height,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  homeTextContainer: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  homeDescription: {
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
    marginBottom: 30,
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  featureBox: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
  },
  contactSection: {
    backgroundColor: '#1d4ed8',
    padding: 40,
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#e0f2fe',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e0f2fe',
    textAlign: 'center',
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingVertical: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  footerLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  footerSeparator: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    backgroundColor: '#2563eb',
    borderRadius: 25,
    padding: 2,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  videosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1200,
    height: 250,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
    marginBottom: 60,
  },
  videoWrapper: {
    marginHorizontal: 10,
    width: '45%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  }

});
