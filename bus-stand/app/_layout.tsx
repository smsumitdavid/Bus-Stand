import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ✅ Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load fonts (We can add custom fonts here later if needed)
  const [fontsLoaded] = useFonts({
    // 'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || !fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        {/* ✅ Status Bar: Dark text for modern look */}
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <Stack
          screenOptions={{
            headerShown: false, // We use custom headers in pages
            animation: 'slide_from_right', // iOS style smooth animation
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          {/* 1. Main Tab Navigation (Home & Bus Details) - FIRST SCREEN */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* 2. Auth Flow (Only for Drivers) */}
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false,
              presentation: 'modal', // Opens like a popup for drivers
            }} 
          />
          
          {/* 3. Bus Search Results & Tracking */}
          <Stack.Screen name="bus" options={{ headerShown: false }} />
          
          {/* 4. Entry Point Handling */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
