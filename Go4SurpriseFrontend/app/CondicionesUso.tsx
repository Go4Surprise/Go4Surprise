import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CondicionesUso = () => {
  const router = useRouter();
  const { from } = useLocalSearchParams();

  const handleBack = () => {
    if (from === 'register') {
      router.push('/RegisterScreen'); 
    } else {
      router.push('/');
    }
  };
    return (
      <>
       <TouchableOpacity style={styles.backButton} onPress={handleBack}>
             <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
     
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Condiciones de Uso</Text>

      <Text style={styles.paragraph}>
        Los siguientes términos establecen las reglas bajo las cuales los usuarios pueden acceder y utilizar la plataforma Go4Surprise:
      </Text>

      <Text style={styles.sectionTitle}>1. Requisitos de edad y uso</Text>
      <Text style={styles.listItem}>• Los usuarios deben ser mayores de 18 años para registrarse y hacer reservas en la plataforma.</Text>
      <Text style={styles.listItem}>• Si un usuario es menor de 18 años, solo podrá participar en eventos si la reserva es realizada por un adulto responsable (padre, madre o tutor legal).</Text>
      <Text style={styles.listItem}>• El adulto que realiza la reserva asume la responsabilidad total por el menor, incluyendo el cumplimiento de las normativas de seguridad y las condiciones del evento.</Text>
      <Text style={styles.listItem}>• En caso de que un menor reserve un evento sin la debida autorización de un adulto, Go4Surprise se reserva el derecho de cancelar la reserva sin reembolso.</Text>

      <Text style={styles.sectionTitle}>2. Responsabilidad del usuario</Text>
      <Text style={styles.listItem}>• El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso, que incluyen su nombre de usuario y contraseña. Se compromete a notificar inmediatamente a Go4Surprise en caso de uso no autorizado de su cuenta o cualquier violación de seguridad.</Text>
      <Text style={styles.listItem}>• Go4Surprise se reserva el derecho de verificar la veracidad de la información proporcionada. En caso de sospecha de falsedad, la cuenta puede ser suspendida temporalmente hasta que se confirme la identidad del usuario.</Text>

      <Text style={styles.sectionTitle}>3. Uso adecuado de la plataforma</Text>
      <Text style={styles.listItem}>• Se prohíbe cualquier intento de hackeo, fraude o uso indebido de la plataforma, que incluye pero no se limita a:</Text>
      <Text style={styles.subItem}>  - Acceder a la cuenta de otro usuario sin autorización</Text>
      <Text style={styles.subItem}>  - Realizar transacciones fraudulentas o no autorizadas</Text>
      <Text style={styles.subItem}>  - Interferir con el funcionamiento normal de la plataforma</Text>
      <Text style={styles.listItem}>• Los usuarios no deben compartir información sobre eventos sorpresa, incluyendo detalles, pistas, ubicaciones y cualquier otro dato que pueda revelar la naturaleza de la sorpresa, antes de la fecha del evento. La confidencialidad es clave para mantener la experiencia de sorpresa; cualquier infracción a esta política puede resultar en la anulación de la reserva.</Text>
      <Text style={styles.listItem}>• La plataforma está destinada exclusivamente para el uso personal de los usuarios. Se prohíbe el uso de Go4Surprise para fines comerciales, como la reventa de entradas o la promoción de negocios sin la autorización expresa de la empresa.</Text>
    </ScrollView>
    </>
  );
};

export default CondicionesUso;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 24,
  },
  listItem: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
  },
  subItem: {
    fontSize: 15,
    color: '#4b5563',
    marginLeft: 16,
    marginBottom: 6,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 5,
    zIndex: 10,
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 50,
    elevation: 4,
  },  
});
