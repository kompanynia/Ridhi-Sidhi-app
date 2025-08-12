import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { trpc, trpcClient, isBackendConfigured } from '@/lib/trpc';
import { colors } from '@/constants/colors';

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Head>
        <link rel="icon" href="https://i.ibb.co/zhp7JwT0/IMG-0885.jpg" />
        <link rel="apple-touch-icon" href="https://i.ibb.co/zhp7JwT0/IMG-0885.jpg" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.white,
            },
            headerTintColor: colors.primary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
          <Stack.Screen name="signup" options={{ title: "Sign Up", headerShown: false }} />
          <Stack.Screen name="location" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
          <Stack.Screen name="invoice" options={{ title: "Invoice" }} />
          <Stack.Screen name="test-connection" options={{ title: "Test Connection" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );

  try {
    if (isBackendConfigured() && trpcClient) {
      return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <>{content}</>
        </trpc.Provider>
      );
    }
  } catch (trpcError) {
    console.error('tRPC initialization error:', trpcError);
  }

  return content;
}
