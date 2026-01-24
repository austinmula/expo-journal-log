import 'react-native-get-random-values';
import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { databaseService } from '@/services/database';
import { useSecurityStore } from '@/stores/securityStore';
import { LockScreen } from '@/components/security';

function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const appState = useRef(AppState.currentState);
  const {
    isLocked,
    isInitialized,
    initialize,
    handleAppBackground,
    handleAppForeground,
  } = useSecurityStore();

  // Initialize security on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          // App is going to background
          handleAppBackground();
        } else if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App is coming to foreground
          handleAppForeground();
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppBackground, handleAppForeground]);

  // Show loading while security initializes
  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <>
      {children}
      {isLocked && <LockScreen />}
    </>
  );
}

function RootLayoutNav() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <SecurityWrapper>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="entry/new"
            options={{
              title: 'New Entry',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="entry/[id]"
            options={{
              title: 'Entry',
            }}
          />
          <Stack.Screen
            name="tags/index"
            options={{
              title: 'Manage Tags',
            }}
          />
          <Stack.Screen
            name="tags/[id]"
            options={{
              title: 'Tag Entries',
            }}
          />
          <Stack.Screen
            name="trash"
            options={{
              title: 'Recently Deleted',
            }}
          />
        </Stack>
      </SecurityWrapper>
    </>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    async function initialize() {
      try {
        await databaseService.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still set ready to true so user can see error state
        setIsReady(true);
      }
    }

    initialize();
  }, []);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },
});
