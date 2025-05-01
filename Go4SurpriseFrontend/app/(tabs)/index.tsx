import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, findNodeHandle } from 'react-native';
import { useRouter } from 'expo-router';
import { Dimensions } from 'react-native'; 
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

  return (
    <ImageBackground 
      source={require('../../assets/images/fondolanding2.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView ref={scrollRef} contentContainerStyle={{ flexGrow: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
          <View style={styles.navLinks}>
            <TouchableOpacity onPress={() => { scrollToSection(homeRef); }}>
              <Text style={styles.navItem}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { scrollToSection(aboutRef); }}>
              <Text style={styles.navItem}>Sobre nosotros</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.getStartedBtn} onPress={() => router.push('/LoginScreen')}>
            <Text style={styles.getStartedText}>Comenzar</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN HOME */}
        <View ref={homeRef} style={styles.homeSection}>
          <View style={styles.homeTextContainer}>
            <Text style={styles.homeTitle}>GO4SURPRISE</Text>
            <Text style={styles.homeDescription}>
              En Go4Surprise, eligiendo una fecha y ciudad, serás capaz de asistir a un evento totalmente sorpresa.{"\n\n"}
              Estas entradas además gozarán de un precio reducido en comparación con las vendidas por la competencia para el mismo evento.
            </Text>
            <TouchableOpacity style={styles.homeButton} onPress={() => { scrollToSection(contactRef); }}>
              <Text style={styles.homeButtonText}>Contáctanos</Text>
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
              <Text style={styles.featureText}>48 horas antes recibirás una pista de tu evento, revelado 24 horas antes.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>🛒 Compra sin sorpresas</Text>
              <Text style={styles.featureText}>También disponemos de compra tradicional a precios reducidos.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>📸 Presume de tus experiencias</Text>
              <Text style={styles.featureText}>Comparte fotos y reseñas de los eventos realizados en la app.</Text>
            </View>
          </View>
        </View>
        {/* SECCIÓN CONTACTO */}
        <View ref={contactRef} style={styles.contactSection}>
          <Text style={styles.contactTitle}>¿Tienes dudas o problemas?</Text>
          <Text style={styles.contactText}>
            Escríbenos a <Text style={{ fontWeight: 'bold' }}>Go4surprise.ispp@gmail.com</Text> y te ayudaremos lo antes posible.
          </Text>
        </View>

        {/* FOOTER CON ENLACES LEGALES */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/PoliticaPrivacidad', params: { from: 'home' } })}>
            <Text style={styles.footerLink}>Política de Privacidad</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>|</Text>
          <TouchableOpacity onPress={() =>router.push({ pathname: '/CondicionesUso', params: { from: 'home' } })}>
            <Text style={styles.footerLink}>Condiciones de Uso</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerLink: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  footerSeparator: {
    fontSize: 14,
    color: '#6b7280',
  },  
  aboutContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  aboutTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureBox: {
    width: '48%',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
  },  
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
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
    color: '#333',
    fontWeight: '500',
    marginHorizontal: 10,
    fontSize: 18,
  },
  getStartedBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  getStartedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  textContainer: {
    flex: 1,
    maxWidth: '50%',
    paddingRight: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  moreInfoButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  moreInfoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  homeSection: {
    height: Dimensions.get('window').height,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // ✅ blanco con opacidad
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },  
homeTextContainer: {
  width: '100%',
},
homeTitle: {
  fontSize: 36,
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: 20,
},
homeDescription: {
  fontSize: 18,
  lineHeight: 26,
  color: '#374151',
  marginBottom: 30,
},
homeButton: {
  backgroundColor: '#6366f1',
  paddingVertical: 12,
  paddingHorizontal: 32,
  borderRadius: 10,
},
homeButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
contactSection: {
  backgroundColor: 'rgba(86, 151, 255, 0.8)',
  padding: 30,
  marginTop: 60,
  alignItems: 'center',
  justifyContent: 'center',
},
contactTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: 10,
  textAlign: 'center',
},
contactText: {
  fontSize: 16,
  color: '#ffffff',
  textAlign: 'center',
  lineHeight: 22,
},
});
