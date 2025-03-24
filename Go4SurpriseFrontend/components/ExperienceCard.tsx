import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type ExperienceCardProps = {
  experience: {
    title: string;
    image: string;
  };
};

const ExperienceCard = ({ experience }: ExperienceCardProps) => {
  return (
    <View style={styles.experienceCard}>
      <Image source={{ uri: experience.image }} style={styles.experienceImage} />
      <Text style={styles.experienceTitle}>{experience.title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default ExperienceCard;