import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { experiencesData } from '../data/experiencesData';
import ExperienceCard from '../components/ExperienceCard';

export default function Experiences() {

  return (
    <View style={styles.contentBox}>
      <Text style={styles.sectionTitle}>Algunas de las experiencias que ofrecemos</Text>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          marginBottom: 5
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {experiencesData.map((exp, index) => (
          <ExperienceCard key={index} experience={exp} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentBox: {
    padding: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#004AAD',
  }
});