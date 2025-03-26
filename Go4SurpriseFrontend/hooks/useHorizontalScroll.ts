import { useRef, useState, useEffect } from 'react';
import { ScrollView } from 'react-native';

export const useHorizontalScroll = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  return {
    scrollViewRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};