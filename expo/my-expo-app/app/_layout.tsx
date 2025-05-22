import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text } from 'react-native'; // Added for RealmProvider fallback
import 'react-native-reanimated';

import { RealmProvider } from '@realm/react';
import { Profile, HealthEntry } from '../lib/realm/schemas';
import { AuthProvider, useAuth } from '../lib/context/AuthContext'; // Import AuthProvider and useAuth
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter, useSegments, Redirect } from 'expo-router'; // Import useRouter and useSegments

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// This component now needs to be wrapped by AuthProvider to use useAuth
function ProtectedLayout() {
  const { userToken, isLoading: authIsLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    const allLoaded = fontsLoaded && !authIsLoading;
    if (allLoaded) {
      SplashScreen.hideAsync();

      const inAuthGroup = segments[0] === '(auth)'; // Assuming auth screens are in an (auth) group
      // Or check for specific routes: const isAuthRoute = segments.includes('login') || segments.includes('register');
      // For top-level routes app/login.tsx, app/register.tsx, segments[0] would be 'login' or 'register'.
      const currentRoute = segments.join('/') || '(tabs)'; // Default to main app area
      const isAuthRoute = currentRoute === 'login' || currentRoute === 'register';


      if (!userToken && !isAuthRoute) {
        console.log('User not authenticated, redirecting to login from:', currentRoute);
        router.replace('/login');
      } else if (userToken && isAuthRoute) {
        console.log('User authenticated, redirecting from auth route to main app:', currentRoute);
        router.replace('/(tabs)'); // Main app screen
      }
    }
  }, [userToken, authIsLoading, fontsLoaded, segments, router]);

  if (!fontsLoaded || authIsLoading) {
    return null; // Or a custom loading component / Splash screen remains visible
  }

  // If userToken is null and we are not yet on an auth route,
  // the effect above will redirect. This return is for when token is present,
  // or if we are already on an auth route and token is null.
  // This structure means login/register screens are part of the same root stack
  // but redirection logic handles visibility.
  // Expo Router v3 has better group handling for this.
  // For now, this effect-based redirect is common.

  // The Stack component defines the navigation structure.
  // If not authenticated, and on /login or /register, this Stack is still technically rendered,
  // but the user sees the login/register screen because of the URL.
  // If authenticated, they are pushed to /(tabs).
  // This setup works if login/register are defined as screens within this Stack,
  // or if they are top-level files in `app/` directory.
  // Given `app/login.tsx` and `app/register.tsx` are top-level, they are accessible.
  // The Stack below is primarily for the authenticated part of the app.
  // We might need to adjust Stack.Screen definitions if we want login/register to have different layouts (e.g. no header).

  const colorScheme = useColorScheme();
  return (
    <RealmProvider schemas={[Profile, HealthEntry]} fallback={<Text>Loading Realm...</Text>}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          {/* If login/register were part of this stack and not top-level files: */}
          {/* <Stack.Screen name="login" options={{ headerShown: false }} /> */}
          {/* <Stack.Screen name="register" options={{ headerShown: false }} /> */}
        </Stack>
      </ThemeProvider>
    </RealmProvider>
  );
}

export default function RootLayout() {
  // AuthProvider now wraps the actual layout logic component
  return (
    <AuthProvider>
      <ProtectedLayout />
    </AuthProvider>
  );
}
