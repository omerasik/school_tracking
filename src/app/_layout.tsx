import { ThemeProvider as CustomThemeProvider } from "@/src/context/ThemeContext";
import AnimatedSplashScreen from "@design/Loading/AnimatedSplashScreen";
import AuthProvider from "@functional/auth/AuthProvider";
import useAuth from "@functional/auth/useAuth";
import { ThemeProvider } from "@react-navigation/native";
import { DefaultScreenOptions, Fonts, Theme } from "@style/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [Fonts.regular]: Inter_400Regular,
    [Fonts.medium]: Inter_500Medium,
    [Fonts.semiBold]: Inter_600SemiBold,
    [Fonts.bold]: Inter_700Bold,
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep splash screen visible
        await SplashScreen.preventAutoHideAsync();

        if (loaded || error) {
          if (error) {
            console.warn("Font loading error:", error);
          }
          // Hide native splash immediately
          await SplashScreen.hideAsync();

          // Show animated splash for 2 seconds
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Ready to show app
          setAppReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [loaded, error]);

  if (!appReady) {
    return <AnimatedSplashScreen />;
  }

  return (
    <CustomThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </CustomThemeProvider>
  );
}

const AuthGate = () => {
  const { isLoggedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isLoggedIn && inAuthGroup) {
      router.replace("/(app)/(tabs)/attendances");
    }
  }, [isLoggedIn, segments, navigationState?.key]);

  return (
    <ThemeProvider value={Theme}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ ...DefaultScreenOptions, headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
