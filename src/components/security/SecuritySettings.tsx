/**
 * SecuritySettings Component
 * UI for configuring app security options (biometrics, PIN, auto-lock)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSecurityStore } from '@/stores/securityStore';
import { Card, Modal, Button } from '@/components/ui';
import { PinInput } from './PinInput';

type SetupMode = 'none' | 'set-pin' | 'confirm-pin' | 'change-pin' | 'disable';

const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
];

export function SecuritySettings() {
  const theme = useTheme();
  const {
    settings,
    biometricCapabilities,
    setPin,
    removePin,
    enableBiometrics,
    disableBiometrics,
    updateSettings,
    disableSecurity,
    error,
    clearError,
  } = useSecurityStore();

  const [setupMode, setSetupMode] = useState<SetupMode>('none');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>();
  const [pinResetTrigger, setPinResetTrigger] = useState(0);
  const [showAutoLockPicker, setShowAutoLockPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSecurityEnabled = settings.authMethod !== 'none';

  const handleSetupPin = useCallback(() => {
    setSetupMode('set-pin');
    setNewPin('');
    setPinError(undefined);
    setPinResetTrigger((prev) => prev + 1);
  }, []);

  const handleChangePin = useCallback(() => {
    setSetupMode('change-pin');
    setNewPin('');
    setPinError(undefined);
    setPinResetTrigger((prev) => prev + 1);
  }, []);

  const handlePinEntered = useCallback(
    async (pin: string) => {
      if (setupMode === 'set-pin') {
        // Store the first PIN entry and ask for confirmation
        setNewPin(pin);
        setSetupMode('confirm-pin');
        setPinResetTrigger((prev) => prev + 1);
      } else if (setupMode === 'confirm-pin') {
        // Verify the confirmation matches
        if (pin === newPin) {
          setIsLoading(true);
          const success = await setPin(pin);
          setIsLoading(false);

          if (success) {
            setSetupMode('none');
            setNewPin('');
          } else {
            setPinError('Failed to set PIN. Please try again.');
            setPinResetTrigger((prev) => prev + 1);
          }
        } else {
          setPinError('PINs do not match. Please try again.');
          setSetupMode('set-pin');
          setNewPin('');
          setPinResetTrigger((prev) => prev + 1);
        }
      } else if (setupMode === 'change-pin') {
        // For change PIN, first verify current PIN
        // Then go to set-pin mode
        setNewPin(pin);
        setSetupMode('set-pin');
        setPinResetTrigger((prev) => prev + 1);
      } else if (setupMode === 'disable') {
        // Verify PIN to disable security
        setIsLoading(true);
        const success = await disableSecurity(pin);
        setIsLoading(false);

        if (success) {
          setSetupMode('none');
        } else {
          setPinError('Incorrect PIN');
          setPinResetTrigger((prev) => prev + 1);
        }
      }
    },
    [setupMode, newPin, setPin, disableSecurity]
  );

  const handleEnableBiometrics = useCallback(async () => {
    setIsLoading(true);
    clearError();
    const success = await enableBiometrics();
    setIsLoading(false);

    if (!success && !error) {
      Alert.alert(
        'Biometrics Unavailable',
        'Please ensure biometrics are set up in your device settings.'
      );
    }
  }, [enableBiometrics, clearError, error]);

  const handleDisableBiometrics = useCallback(async () => {
    Alert.alert(
      'Disable Biometrics',
      'Are you sure you want to disable biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await disableBiometrics();
          },
        },
      ]
    );
  }, [disableBiometrics]);

  const handleDisableSecurity = useCallback(() => {
    if (settings.pinEnabled) {
      // Need to verify PIN first
      setSetupMode('disable');
      setPinError(undefined);
      setPinResetTrigger((prev) => prev + 1);
    } else {
      // Just biometrics enabled, can disable directly
      Alert.alert(
        'Disable Security',
        'Are you sure you want to disable app security?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await disableSecurity();
            },
          },
        ]
      );
    }
  }, [settings.pinEnabled, disableSecurity]);

  const handleRemovePin = useCallback(() => {
    Alert.alert('Remove PIN', 'Are you sure you want to remove your PIN?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removePin();
        },
      },
    ]);
  }, [removePin]);

  const handleAutoLockChange = useCallback(
    async (value: number) => {
      await updateSettings({ autoLockTimeout: value });
      setShowAutoLockPicker(false);
    },
    [updateSettings]
  );

  const closeModal = useCallback(() => {
    setSetupMode('none');
    setNewPin('');
    setPinError(undefined);
  }, []);

  const getModalTitle = () => {
    switch (setupMode) {
      case 'set-pin':
        return 'Create PIN';
      case 'confirm-pin':
        return 'Confirm PIN';
      case 'change-pin':
        return 'Enter Current PIN';
      case 'disable':
        return 'Enter PIN to Disable';
      default:
        return '';
    }
  };

  const getModalSubtitle = () => {
    switch (setupMode) {
      case 'set-pin':
        return 'Choose a 4-digit PIN';
      case 'confirm-pin':
        return 'Re-enter your PIN to confirm';
      case 'change-pin':
        return 'Verify your current PIN';
      case 'disable':
        return 'Enter your PIN to confirm';
      default:
        return '';
    }
  };

  const biometricAvailable =
    biometricCapabilities?.isAvailable && biometricCapabilities?.isEnrolled;

  return (
    <View style={styles.container}>
      {/* Security Status */}
      <Card style={styles.card}>
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: isSecurityEnabled
                  ? theme.colors.successLight
                  : theme.colors.warningLight,
              },
            ]}
          >
            <Ionicons
              name={isSecurityEnabled ? 'shield-checkmark' : 'shield-outline'}
              size={24}
              color={
                isSecurityEnabled ? theme.colors.success : theme.colors.warning
              }
            />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
              {isSecurityEnabled ? 'Security Enabled' : 'Security Disabled'}
            </Text>
            <Text
              style={[
                styles.statusSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {isSecurityEnabled
                ? `Using ${settings.biometricEnabled ? biometricCapabilities?.biometricName : 'PIN'}`
                : 'Your journal is not protected'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Biometric Option */}
      {biometricAvailable && (
        <>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            BIOMETRIC
          </Text>
          <Card style={styles.card}>
            <Pressable
              style={[
                styles.option,
                { borderBottomColor: theme.colors.borderLight },
              ]}
              onPress={
                settings.biometricEnabled
                  ? handleDisableBiometrics
                  : handleEnableBiometrics
              }
              disabled={isLoading}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={
                    biometricCapabilities?.biometricTypes[0] === 'facial'
                      ? 'scan-outline'
                      : 'finger-print-outline'
                  }
                  size={22}
                  color={theme.colors.text}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                  {biometricCapabilities?.biometricName || 'Biometric'}
                </Text>
              </View>
              <Switch
                value={settings.biometricEnabled}
                onValueChange={
                  settings.biometricEnabled
                    ? handleDisableBiometrics
                    : handleEnableBiometrics
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryLight,
                }}
                thumbColor={
                  settings.biometricEnabled
                    ? theme.colors.primary
                    : theme.colors.textTertiary
                }
              />
            </Pressable>
          </Card>
        </>
      )}

      {/* PIN Option */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
      >
        PIN
      </Text>
      <Card style={styles.card}>
        {!settings.pinEnabled ? (
          <Pressable
            style={[styles.option, { borderBottomWidth: 0 }]}
            onPress={handleSetupPin}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name="keypad-outline"
                size={22}
                color={theme.colors.text}
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                Set up PIN
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[
                styles.option,
                { borderBottomColor: theme.colors.borderLight },
              ]}
              onPress={handleChangePin}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="keypad-outline"
                  size={22}
                  color={theme.colors.text}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                  Change PIN
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textTertiary}
              />
            </Pressable>
            <Pressable
              style={[styles.option, { borderBottomWidth: 0 }]}
              onPress={handleRemovePin}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={theme.colors.error}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, { color: theme.colors.error }]}>
                  Remove PIN
                </Text>
              </View>
            </Pressable>
          </>
        )}
      </Card>

      {/* Auto-lock Settings (only if security is enabled) */}
      {isSecurityEnabled && (
        <>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            AUTO-LOCK
          </Text>
          <Card style={styles.card}>
            <Pressable
              style={[styles.option, { borderBottomWidth: 0 }]}
              onPress={() => setShowAutoLockPicker(true)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="timer-outline"
                  size={22}
                  color={theme.colors.text}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                  Lock after
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text
                  style={[
                    styles.optionValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {AUTO_LOCK_OPTIONS.find(
                    (o) => o.value === settings.autoLockTimeout
                  )?.label || 'Immediately'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </View>
            </Pressable>
          </Card>
        </>
      )}

      {/* Disable Security Button (only if enabled) */}
      {isSecurityEnabled && (
        <View style={styles.disableContainer}>
          <Button
            title="Disable Security"
            variant="ghost"
            onPress={handleDisableSecurity}
            textStyle={{ color: theme.colors.error }}
            style={{ borderColor: theme.colors.error }}
          />
        </View>
      )}

      {/* PIN Setup Modal */}
      <Modal
        visible={setupMode !== 'none'}
        onClose={closeModal}
        title={getModalTitle()}
      >
        <View style={styles.modalContent}>
          <PinInput
            length={4}
            onComplete={handlePinEntered}
            error={!!pinError}
            errorMessage={pinError}
            title=""
            subtitle={getModalSubtitle()}
            disabled={isLoading}
            resetTrigger={pinResetTrigger}
          />
          <Pressable
            style={[styles.cancelButton, { marginTop: 24 }]}
            onPress={closeModal}
          >
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </Modal>

      {/* Auto-lock Picker Modal */}
      <Modal
        visible={showAutoLockPicker}
        onClose={() => setShowAutoLockPicker(false)}
        title="Auto-lock Timer"
      >
        <View style={styles.pickerContent}>
          {AUTO_LOCK_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.pickerOption,
                { borderBottomColor: theme.colors.borderLight },
              ]}
              onPress={() => handleAutoLockChange(option.value)}
            >
              <Text
                style={[styles.pickerOptionText, { color: theme.colors.text }]}
              >
                {option.label}
              </Text>
              {settings.autoLockTimeout === option.value && (
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={theme.colors.primary}
                />
              )}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    padding: 0,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionValue: {
    fontSize: 16,
  },
  disableContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  modalContent: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContent: {
    paddingVertical: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
  },
});
