import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

export default function Experiences() {
  // Add ref for the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Add state for tracking mouse drag
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const experiences = [
    {
      title: 'Cena a ciegas',
      image: 'https://e00-elmundo.uecdn.es/assets/multimedia/imagenes/2021/11/08/16363869596750.jpg',
    },
    {
      title: 'Escape Room',
      image: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Escape_Room_-_%22The_Expedition%22_%28Escape_Quest_Bethesda%29.jpg',
    },
    {
      title: 'Skydiving',
      image: 'https://dictionary.cambridge.org/es/images/thumb/skydiv_noun_002_34101.jpg?version=6.0.46',
    },
    {
        title: 'Conciertos',
        image: 'https://www.barricada.com.es/wp-content/uploads/2024/03/conciertos-de-rock-2.jpg',
      },
      {
        title: 'Puenting',
        image: 'https://www.outdoor-factory.com/wp-content/uploads/2018/03/Captura-de-pantalla-2016-04-12-a-las-21.41.11-1024x714.png',
      },
      {
        title: 'Club Nocturno',
        image: 'https://popmenucloud.com/lpgoauys/1b647efa-4899-4bd2-91f3-271071474244.jpg',
      },
      {
        title: 'Karting',
        image: 'https://emocionatetours.com/wp-content/uploads/2024/12/H.webp',
      },
      {
        title: 'Karaoke',
        image: 'https://finnsbeachclub.com/wp-content/uploads/2024/10/cheerful-friends-having-fun-while-singing-karaoke-2023-11-27-05-26-27-utc-scaled.jpg',
      },
      {
        title: 'Degustación de vinos',
        image: 'https://www.bodegasdeandalucia.com/img/cms/Degustaci%C3%B3n%20de%20vinos3.jpg',
      },
      {
        title: 'Paintball',
        image: 'https://assets.simpleviewcms.com/simpleview/image/fetch/c_fill,h_1080,w_1920/f_jpg/q_65/https://media.newmindmedia.com/TellUs/image/%3Ffile%3DOlympiaparken_paintball_foto_daniel_nrodby-263_1335521767.jpg&dh%3D800&dw%3D1200&t%3D4',
      },
      {
        title: 'Museos',
        image: 'https://i0.wp.com/evemuseografia.com/wp-content/uploads/2019/07/EVE31072019B.jpg',
      },
      {
        title: 'Cine',
        image: 'https://billiken.lat/wp-content/uploads/2022/10/tienen-futuro-las-salas-de-cine-ST.jpg',
      },
      {
        title: 'Festivales de música',
        image: 'https://www.zevrafestival.com/images/2024/carousel/ZEVRA-VIERNESDIA01-RAULBARBA-111.jpg',
      }
  ];

  // Mouse event handlers for drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    
    if (scrollViewRef.current) {
      setScrollLeft(scrollViewRef.current.getScrollableNode().scrollLeft);
    }
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const x = e.pageX;
    const distance = startX - x;
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: scrollLeft + distance, animated: false });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add effect to handle mouse up outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    
    if (scrollViewRef.current) {
      setScrollLeft(scrollViewRef.current.getScrollableNode().scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const x = e.touches[0].pageX;
    const distance = startX - x;
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: scrollLeft + distance, animated: false });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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
        {experiences.map((exp, index) => (
          <View key={index} style={styles.experienceCard}>
            <Image source={{ uri: exp.image }} style={styles.experienceImage} />
            <Text style={styles.experienceTitle}>{exp.title}</Text>
          </View>
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
});
