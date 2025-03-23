import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ThemeType = 'light' | 'dark';
type ColorNameType = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    
    // Safe access to the color
    if (validTheme === 'light') {
      return Colors.light[colorName];
    } else {
      return Colors.dark[colorName];
    }
  }
}