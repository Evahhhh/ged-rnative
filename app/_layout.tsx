import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/Auth';

export const unstable_settings = {
  // Assurer que le rechargement ré-exécute le layout racine.
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('--- NAV ---');
    console.log('Loading:', loading);
    console.log('Session:', session ? 'Exists' : 'null');
    console.log('Segments:', segments);

    if (loading) {
      console.log('Returning due to loading');
      return; // Wait for the session to load
    }

    const isAuthRoute = segments.includes('login') || segments.includes('signup');
    console.log('isAuthRoute:', isAuthRoute);

    if (session && isAuthRoute) {
      // User is signed in but on an auth screen (login/signup), redirect to home.
      console.log('Redirecting to (tabs) because user is on auth route while logged in');
      router.replace('/(tabs)');
    } else if (!session && !isAuthRoute) {
      // User is not signed in and not on an auth screen, redirect to login.
      console.log('Redirecting to login because user is not on auth route and not logged in');
      router.replace('/login');
    } else {
      console.log('No redirect needed.');
    }
  }, [session, loading, segments]);

  return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="document/[id]" options={{ title: 'Détail du document' }} />
        <Stack.Screen name="document/edit/[id]" options={{ title: 'Modifier le document' }} />
      </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
