import { Redirect } from 'expo-router';

// Simple redirect to your actual entry point
export default function Index() {
  return <Redirect href="/(tabs)" />;
}