import React from 'react';
import { Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PoliticaPrivacidad = () => {
  const router = useRouter();
  const { from } = useLocalSearchParams();

  const handleBack = () => {
    if (from === 'register') {
      router.push('/RegisterScreen'); // Ajusta esto si tu ruta es distinta
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
      <Text style={styles.title}>Política de Privacidad de Go4Surprise</Text>

      <Text style={styles.sectionTitle}>1. Introducción</Text>
      <Text style={styles.paragraph}>
        Go4Surprise se compromete a proteger la privacidad de sus usuarios y garantizar la seguridad de la información personal proporcionada. Esta política de privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos los datos personales de los usuarios en conformidad con las normativas aplicables, incluyendo el Reglamento General de Protección de Datos (GDPR).
      </Text>

      <Text style={styles.sectionTitle}>2. Recopilación de Datos Personales</Text>
      <Text style={styles.paragraph}>
        Go4Surprise recopila información personal de los usuarios para la correcta gestión de reservas y personalización de experiencias. Los datos recopilados incluyen:
      </Text>
      <Text style={styles.listItem}>• Datos obligatorios: Nombre, correo electrónico, número de teléfono, fecha de nacimiento y preferencias de eventos.</Text>
      <Text style={styles.listItem}>• Datos opcionales: Preferencias detalladas a través del cuestionario para elaborar el evento sorpresa, reseñas y contenido multimedia.</Text>
      <Text style={styles.listItem}>• Datos de pago: No se almacenan, ya que son procesados directamente por Stripe.</Text>

      <Text style={styles.sectionTitle}>3. Uso de la Información</Text>
      <Text style={styles.paragraph}>Los datos recopilados se utilizarán para:</Text>
      <Text style={styles.listItem}>• Gestionar la cuenta del usuario y procesar reservas.</Text>
      <Text style={styles.listItem}>• Personalizar la experiencia en la plataforma.</Text>
      <Text style={styles.listItem}>• Enviar notificaciones relevantes sobre eventos.</Text>
      <Text style={styles.listItem}>• Garantizar la seguridad de la plataforma y prevenir fraudes.</Text>

      <Text style={styles.sectionTitle}>4. Uso de Datos por Terceros</Text>
      <Text style={styles.paragraph}>
        Go4Surprise no vende ni comparte información personal con terceros con fines comerciales. Sin embargo, algunos datos pueden compartirse con:
      </Text>
      <Text style={styles.listItem}>• Proveedores de eventos, para la correcta gestión de reservas.</Text>
      <Text style={styles.listItem}>• Plataformas de pago, como Stripe, para procesar transacciones de manera segura.</Text>
      <Text style={styles.listItem}>• Autoridades legales, en caso de requerimientos judiciales.</Text>

      <Text style={styles.sectionTitle}>5. Derechos del Usuario</Text>
      <Text style={styles.paragraph}>Los usuarios tienen los siguientes derechos respecto a sus datos:</Text>
      <Text style={styles.listItem}>• Acceso: Pueden solicitar acceso a la plataforma para su correcto funcionamiento.</Text>
      <Text style={styles.listItem}>• Rectificación: Modificar información incorrecta o desactualizada.</Text>
      <Text style={styles.listItem}>• Eliminación: Solicitar la eliminación de su cuenta y datos personales.</Text>
      <Text style={styles.listItem}>• Oposición: Restringir o limitar el uso de sus datos en ciertos casos.</Text>
      <Text style={styles.paragraph}>
        Las solicitudes pueden realizarse a través del servicio de atención al cliente y serán procesadas en un máximo de 30 días.
      </Text>

      <Text style={styles.sectionTitle}>6. Seguridad de la Información</Text>
      <Text style={styles.paragraph}>
        Go4Surprise implementa medidas de seguridad avanzadas para proteger los datos personales:
      </Text>
      <Text style={styles.listItem}>• Cifrado de datos mediante protocolos seguros.</Text>
      <Text style={styles.listItem}>• Almacenamiento en servidores seguros con acceso restringido.</Text>
      <Text style={styles.listItem}>• Monitorización constante para detectar actividades sospechosas.</Text>

      <Text style={styles.sectionTitle}>7. Uso de Contenido Generado por Usuarios</Text>
      <Text style={styles.paragraph}>Los usuarios pueden compartir fotos, videos y reseñas en la plataforma. Al hacerlo:</Text>
      <Text style={styles.listItem}>• Siguen siendo dueños de su contenido.</Text>
      <Text style={styles.listItem}>• Otorgan a Go4Surprise una licencia no exclusiva para su uso con fines promocionales.</Text>
      <Text style={styles.listItem}>• No deben subir contenido ofensivo, ilegal o que infrinja derechos de terceros.</Text>
      <Text style={styles.listItem}>• Go4Surprise se reserva el derecho de eliminar contenido que incumpla sus normas.</Text>

      <Text style={styles.sectionTitle}>8. Cambios en la Política de Privacidad</Text>
      <Text style={styles.paragraph}>
        Go4Surprise se reserva el derecho de modificar esta política de privacidad en cualquier momento. Cualquier cambio será notificado a los usuarios a través de la plataforma o correo electrónico.
      </Text>
      <Text style={styles.paragraph}>
        Si tienes alguna duda sobre esta política de privacidad, contáctanos a través del servicio de atención al cliente.
      </Text>
    </ScrollView>
    </>
  );
};

export default PoliticaPrivacidad;

const styles = StyleSheet.create({
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
    marginLeft: 10,
    marginBottom: 6,
  },
});