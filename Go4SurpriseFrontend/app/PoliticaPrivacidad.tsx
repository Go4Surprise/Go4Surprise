import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

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

      <Text style={styles.sectionTitle}>2. Responsable del Tratamiento de Datos</Text>
      <Text style={styles.paragraph}>
        El responsable del tratamiento de los datos personales es Go4Surprise. Para cualquier consulta sobre el tratamiento de tus datos, puedes ponerte en contacto con nosotros a través de:
      </Text>

      <Text
        style={[styles.paragraph, { color: 'blue', textDecorationLine: 'underline' }]}
        onPress={() => Linking.openURL('mailto:Go4surprise.ispp@gmail.com')}
      >
        Go4surprise.ispp@gmail.com
      </Text>

      <Text style={styles.sectionTitle}>3. Recopilación de Datos Personales</Text>
      <Text style={styles.paragraph}>
        Go4Surprise recopila información personal de los usuarios para la correcta gestión de reservas y personalización de experiencias. Los datos recopilados incluyen:
      </Text>
      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}> Datos obligatorios:</Text> Nombre, apellido, correo electrónico, número de teléfono, fecha de nacimiento y preferencias de eventos a través del cuestionario inicial.</Text>
      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}> Datos opcionales:</Text>Preferencias detalladas a través del cuestionario para elaborar la reserva del evento sorpresa, reseñas y contenido multimedia.</Text>
      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}> Datos de pago:</Text> No se almacenan en nuestra plataforma. Las transacciones se procesan de forma segura mediante Stripe.</Text>

      <Text style={styles.paragraph}>
        La recopilación de estos datos se realiza con el fin de ofrecer el servicio solicitado.
      </Text>

      <Text style={styles.paragraph}>
        La base legal para este tratamiento es:
      </Text>

      <Text style={styles.listItem}>• El consentimiento del usuario.</Text>
      <Text style={styles.listItem}>• La ejecución del contrato al hacer una reserva.</Text>
      <Text style={styles.listItem}>• El interés legítimo en mejorar la seguridad y el servicio.</Text>

      <Text style={styles.paragraph}>
        Todos los datos se recopilan conforme al Reglamento General de Protección de Datos (RGPD - UE 2016/679).
      </Text>

      <Text style={styles.sectionTitle}>4. Uso de la Información</Text>
      <Text style={styles.paragraph}>Los datos recopilados se utilizarán para:</Text>
      <Text style={styles.listItem}>• Gestionar la cuenta del usuario y procesar reservas.</Text>
      <Text style={styles.listItem}>• Personalizar la experiencia en la plataforma.</Text>
      <Text style={styles.listItem}>• Enviar notificaciones relevantes sobre eventos.</Text>
      <Text style={styles.listItem}>• Garantizar la seguridad de la plataforma y prevenir fraudes.</Text>

      <Text style={styles.paragraph}>
        La base legal para este tratamiento es el cumplimiento del contrato con el usuario, su consentimiento y el interés legítimo de Go4Surprise en la seguridad de la plataforma.
      </Text>

      <Text style={styles.sectionTitle}>5. Uso de Datos por Terceros</Text>
      <Text style={styles.paragraph}>
        Go4Surprise no vende ni comparte información personal con terceros con fines comerciales. Sin embargo, algunos datos pueden compartirse con:
      </Text>
      <Text style={styles.listItem}>• Proveedores de eventos, para la correcta gestión de reservas.</Text>
      <Text style={styles.listItem}>• Plataformas de pago, como Stripe o PayPal, para procesar transacciones de manera segura.</Text>
      <Text style={styles.listItem}>• Autoridades legales, en caso de requerimientos judiciales.</Text>

      <Text style={styles.paragraph}>
        Los terceros mencionados son responsables del tratamiento de los datos, y Go4Surprise se asegura de que cumplan con las obligaciones correspondientes mediante acuerdos y garantías adecuadas.
      </Text>

      <Text style={styles.sectionTitle}>6. Derechos del Usuario</Text>

      <Text style={styles.paragraph}>
        Los usuarios tienen los siguientes derechos respecto a sus datos personales:
      </Text>

      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}>Acceso</Text>: Pueden solicitar una copia de los datos personales que tenemos sobre ellos.</Text>
      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}>Rectificación</Text>: Modificar información incorrecta o desactualizada.</Text>
      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}>Eliminación</Text>: Solicitar la eliminación de su cuenta y datos personales.</Text>
      <Text style={styles.listItem}>• <Text style={{ fontWeight: 'bold' }}>Oposición</Text>: Restringir o limitar el uso de sus datos en ciertos casos.</Text>

      <Text style={styles.paragraph}>
        Las solicitudes pueden realizarse contactando al servicio de atención al cliente a través del correo: 
        <Text
          style={[styles.paragraph, { color: 'blue', textDecorationLine: 'underline' }]}
          onPress={() => Linking.openURL('mailto:Go4surprise.ispp@gmail.com')}
        >
          Go4surprise.ispp@gmail.com
        </Text>
      </Text>

      <Text style={styles.paragraph}>
        Todas las solicitudes serán procesadas en un máximo de 30 días conforme al Reglamento General de Protección de Datos (RGPD - UE 2016/679).
      </Text>

      <Text style={styles.sectionTitle}>7. Conservación de los Datos Personales</Text>

      <Text style={styles.paragraph}>
        Los datos personales se conservarán durante el tiempo necesario para cumplir con los fines establecidos en esta política o mientras sea necesario para cumplir con las obligaciones legales y contractuales de Go4Surprise.
      </Text>

      <Text style={styles.paragraph}>
        Una vez que los datos ya no sean necesarios, se eliminarán de forma segura conforme a lo establecido por la normativa vigente.
      </Text>

      <Text style={styles.sectionTitle}>8. Seguridad de la Información</Text>
      <Text style={styles.paragraph}>
        Go4Surprise implementa medidas de seguridad avanzadas para proteger los datos personales:
      </Text>
      <Text style={styles.listItem}>• Cifrado de datos mediante protocolos seguros.</Text>
      <Text style={styles.listItem}>• Almacenamiento en servidores seguros con acceso restringido.</Text>
      <Text style={styles.listItem}>• Monitorización constante para detectar actividades sospechosas.</Text>
      
      <Text style={styles.paragraph}>
        Estas medidas tienen como fin garantizar la confidencialidad, integridad y disponibilidad de los datos personales.
      </Text>
      
      <Text style={styles.sectionTitle}>9. Uso de Contenido Generado por Usuarios</Text>
      <Text style={styles.paragraph}>Los usuarios pueden compartir fotos, videos y reseñas en la plataforma. Al hacerlo:</Text>
      <Text style={styles.listItem}>• Siguen siendo dueños de su contenido.</Text>
      <Text style={styles.listItem}>• Otorgan a Go4Surprise una licencia no exclusiva para su uso con fines promocionales.</Text>
      <Text style={styles.listItem}>• No deben subir contenido ofensivo, ilegal o que infrinja derechos de terceros.</Text>
      <Text style={styles.listItem}>• Go4Surprise notificará al usuario previamente si incumple las normas. En el caso de que este no tome ninguna medida al respecto se eliminará el contenido correspondiente.</Text>

      <Text style={styles.sectionTitle}>10. Cambios en la Política de Privacidad</Text>
      <Text style={styles.paragraph}>
        Go4Surprise únicamente podrá modificar la política de privacidad si no se incumple las leyes que seguimos y si no son modificaciones a grande escala.
      </Text>
      <Text style={styles.paragraph}>
        Cualquier cambio será notificado a los usuarios a través de la plataforma o correo electrónico  <br></br>
        <Text
          style={[styles.paragraph, { color: 'blue', textDecorationLine: 'underline' }]}
          onPress={() => Linking.openURL('mailto:Go4surprise.ispp@gmail.com')}
        >
          Go4surprise.ispp@gmail.com
        </Text>
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
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 30,
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