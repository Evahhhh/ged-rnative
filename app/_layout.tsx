import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/Auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {

    if (loading) {
      console.log('Returning due to loading');
      return;
    }

    const isAuthRoute = segments.includes('login') || segments.includes('signup');

    if (session && isAuthRoute) {
      router.replace('/(tabs)');
    } else if (!session && !isAuthRoute) {
      router.replace('/login');
    }
  }, [session, loading, segments]);

  return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ title:"Retour", headerShown: false }} />
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
