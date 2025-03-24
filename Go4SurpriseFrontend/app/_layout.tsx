import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
      <Stack.Screen name="ForgottenPasword" options={{ headerShown: false }} />
      <Stack.Screen name="HomeScreen" options={{ headerShown: false }} />
      <Stack.Screen name="MyBookings" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" options={{ headerShown: false }} />

      <Stack.Screen name="AdminPanel" options={{ headerShown: false }} />
      <Stack.Screen name="AdminUserPanel" options={{ headerShown: false }} />
    </Stack>
  );
}
