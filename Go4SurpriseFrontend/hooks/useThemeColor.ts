import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ColorNameType = keyof typeof Colors.light;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorNameType
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Validate theme before accessing
    const validTheme = (theme === 'light' || theme === 'dark') ? theme : 'light';
    
    // Use type-safe access without bracket notation
    if (validTheme === 'light') {
      return getColorSafely(Colors.light, colorName);
    } else {
      return getColorSafely(Colors.dark, colorName);
    }
  }
}

// Helper function to access colors without bracket notation
function getColorSafely(colorSet: Record<ColorNameType, string>, name: ColorNameType): string {
  // This function helps avoid direct bracket notation while maintaining type safety
  // A switch statement ensures we're only accessing valid properties
  switch (name) {
    // Add cases for each possible color name in your application
    // TypeScript will warn if any colors are missing
    case 'text':
      return colorSet.text;
    case 'background':
      return colorSet.background;
    // Add all other color names here
    default:
      // This is a type-safe fallback that ensures all possible values are handled
      // TypeScript will enforce that this is exhaustive
      const exhaustiveCheck: never = name;
      throw new Error(`Unhandled color name: ${exhaustiveCheck}`);
  }
}