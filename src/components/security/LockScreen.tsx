/**
 * LockScreen Component
 * Full screen lock overlay with biometric and PIN authentication options
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSecurityStore } from '@/stores/securityStore';
import { PinInput } from './PinInput';
import { BiometricPrompt } from './BiometricPrompt';

type AuthMode = 'biometric' | 'pin';

export function LockScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    settings,
    biometricCapabilities,
    error,
    authenticateWithBiometrics,
    authenticateWithPin,
    clearError,
  } = useSecurityStore();

  // Determine initial auth mode based on settings
  const getInitialMode = (): AuthMode => {
    if (settings.biometricEnabled && biometricCapabilities?.isEnrolled) {
      return 'biometric';
    }
    return 'pin';
  };

  const [authMode, setAuthMode] = useState<AuthMode>(getInitialMode());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pinResetTrigger, setPinResetTrigger] = useState(0);
  const [pinError, setPinError] = useState<string | undefined>();

  // Auto-trigger biometric auth on mount if available
  useEffect(() => {
    if (authMode === 'biometric' && !isAuthenticating) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometricAuth = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    clearError();

    const result = await authenticateWithBiometrics();

    setIsAuthenticating(false);

    if (!result.success && !result.cancelled) {
      // If biometric fails and PIN is available, suggest switching
      if (settings.pinEnabled) {
        // Stay on biometric screen, user can switch manually
      }
    }
  }, [
    isAuthenticating,
    clearError,
    authenticateWithBiometrics,
    settings.pinEnabled,
  ]);

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (isAuthenticating) return;

      setIsAuthenticating(true);
      clearError();
      setPinError(undefined);

      const result = await authenticateWithPin(pin);

      setIsAuthenticating(false);

      if (!result.success) {
        setPinError(result.error || 'Incorrect PIN');
        setPinResetTrigger((prev) => prev + 1);
      }
    },
    [isAuthenticating, clearError, authenticateWithPin]
  );

  const switchToPin = useCallback(() => {
    clearError();
    setPinError(undefined);
    setAuthMode('pin');
  }, [clearError]);

  const switchToBiometric = useCallback(() => {
    clearError();
    setPinError(undefined);
    setAuthMode('biometric');
    // Trigger biometric auth when switching
    setTimeout(handleBiometricAuth, 100);
  }, [clearError, handleBiometricAuth]);

  const canUseBiometric =
    settings.biometricEnabled && biometricCapabilities?.isEnrolled;
  const canUsePin = settings.pinEnabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header with app icon/name */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <Ionicons
            name="journal-outline"
            size={40}
            color={theme.colors.primary}
          />
        </View>
        <Text style={[styles.appName, { color: theme.colors.text }]}>
          Journal
        </Text>
        <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
          Unlock to access your journal
        </Text>
      </View>

      {/* Auth content */}
      <View style={styles.content}>
        {authMode === 'biometric' && canUseBiometric && (
          <BiometricPrompt
            biometricType={biometricCapabilities?.biometricTypes[0] || 'none'}
            biometricName={biometricCapabilities?.biometricName || 'Biometric'}
            onPress={handleBiometricAuth}
            loading={isAuthenticating}
            error={error || undefined}
          />
        )}

        {authMode === 'pin' && canUsePin && (
          <PinInput
            length={4}
            onComplete={handlePinComplete}
            error={!!pinError}
            errorMessage={pinError}
            title="Enter PIN"
            subtitle="Enter your PIN to unlock"
            disabled={isAuthenticating}
            resetTrigger={pinResetTrigger}
          />
        )}
      </View>

      {/* Auth method switcher */}
      <View style={styles.footer}>
        {authMode === 'biometric' && canUsePin && (
          <Pressable
            style={({ pressed }) => [
              styles.switchButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={switchToPin}
          >
            <Ionicons
              name="keypad-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={[styles.switchText, { color: theme.colors.primary }]}>
              Use PIN instead
            </Text>
          </Pressable>
        )}

        {authMode === 'pin' && canUseBiometric && (
          <Pressable
            style={({ pressed }) => [
              styles.switchButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={switchToBiometric}
          >
            <Ionicons
              name={
                biometricCapabilities?.biometricTypes[0] === 'facial'
                  ? 'scan-outline'
                  : 'finger-print-outline'
              }
              size={20}
              color={theme.colors.primary}
            />
            <Text style={[styles.switchText, { color: theme.colors.primary }]}>
              Use {biometricCapabilities?.biometricName || 'Biometric'} instead
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  lockMessage: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
