import { RefObject } from "react";
import { ScrollView } from "react-native";

// Reservation data interface
export interface Reservation {
  user: string | null;
  location: string;
  duration: number;
  experience_date: Date;
  price: number;
  participants: number;
  category: string;
}

// Card props interfaces
export interface CardProps {
  city?: { name: string; image: string };
  category?: { id: string; name: string; image: string };
  isSelected: boolean;
  onSelect: () => void;
}

// Scroll handlers interface
export interface ScrollHandlers {
  ref: RefObject<ScrollView>;
  isDragging: boolean;
  isActive: boolean;
  onMouseDown: () => void;
  onMouseMove: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchMove: () => void;
  onTouchEnd: () => void;
}

// ScrollView props interface
export interface ScrollViewProps {
  ref: RefObject<ScrollView>;
  isDragging: boolean;
  isActive: boolean;
  onMouseDown: () => void;
  onMouseMove: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchMove: () => void;
  onTouchEnd: () => void;
}