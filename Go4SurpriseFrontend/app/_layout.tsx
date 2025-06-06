import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ForgottenPasword" options={{ headerShown: false }} />
        <Stack.Screen name="HomeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="MyBookings" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Profile" options={{ headerShown: false }} />
        <Stack.Screen name="PasswordResetConfirm" options={{ headerShown: false }} />        
        <Stack.Screen name="AdminPanel" options={{ headerShown: false }} />
        <Stack.Screen name="AdminUserPanel" options={{ headerShown: false }} />
        <Stack.Screen name="PreferencesFormScreen" options={{ headerShown: false }} />
        <Stack.Screen name="IntroPreferencesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CondicionesUso" options={{ headerShown: false }} />
        <Stack.Screen name="PoliticaPrivacidad" options={{ headerShown: false }} />
        <Stack.Screen name="CompleteProfileScreen" options={{ headerShown: false }} />
        <Stack.Screen name="BookingDetails" options={{ headerShown: false }} />
        <Stack.Screen name="VerifyEmail" options={{ headerShown: false }} />
        <Stack.Screen name="RegisterBookings" options={{ headerShown: false }} />
        <Stack.Screen name="AdminBookingsDetail" options={{ headerShown: false }} />
        <Stack.Screen name="AdminBookingsPanel" options={{ headerShown: false }} />
        <Stack.Screen name="Experiences" options={{ headerShown: false }} />
        <Stack.Screen name="CountDown" options={{ headerShown: false }} />
        <Stack.Screen name="Reviews" options={{ headerShown: false }} />
        <Stack.Screen name="MoreReviews" options={{ headerShown: false }} />
        <Stack.Screen name="UserDetails/[id]" options={{ headerShown: false }} />
    </Stack>
      {Platform.OS === 'web' && <div id="root-portal" style={{ zIndex: 99999 }} />}
    </>
  );
}