/**
 * Security Service
 * Handles biometric authentication, PIN storage, and security settings management
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {
  SecuritySettings,
  BiometricCapabilities,
  BiometricType,
  AuthResult,
  DEFAULT_SECURITY_SETTINGS,
} from '@/types/security';

// Secure Store keys
const SECURITY_SETTINGS_KEY = 'journal_security_settings';
const PIN_HASH_KEY = 'journal_pin_hash';
const PIN_SALT_KEY = 'journal_pin_salt';

/**
 * Generate a random salt for PIN hashing
 */
async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a PIN with a salt using SHA-256
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  const saltedPin = salt + pin;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPin
  );
  return hash;
}

/**
 * Map expo-local-authentication types to our BiometricType
 */
function mapBiometricType(type: LocalAuthentication.AuthenticationType): BiometricType {
  switch (type) {
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return 'fingerprint';
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return 'facial';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'iris';
    default:
      return 'none';
  }
}

/**
 * Get a human-readable name for the available biometric type
 */
function getBiometricName(types: BiometricType[]): string {
  if (types.includes('facial')) {
    return 'Face ID';
  }
  if (types.includes('fingerprint')) {
    return 'Fingerprint';
  }
  if (types.includes('iris')) {
    return 'Iris';
  }
  return 'Biometric';
}

export const securityService = {
  /**
   * Check what biometric capabilities are available on this device
   */
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      // Check if hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return {
          isAvailable: false,
          isEnrolled: false,
          biometricTypes: [],
          biometricName: 'Not available',
        };
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes = supportedTypes.map(mapBiometricType);

      return {
        isAvailable: hasHardware,
        isEnrolled,
        biometricTypes,
        biometricName: getBiometricName(biometricTypes),
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        biometricTypes: [],
        biometricName: 'Error checking',
      };
    }
  },

  /**
   * Authenticate with biometrics (Face ID, Touch ID, Fingerprint)
   */
  async authenticateWithBiometrics(
    promptMessage: string = 'Authenticate to access your journal'
  ): Promise<AuthResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // Don't allow device passcode as fallback
        fallbackLabel: 'Use PIN', // This shows if biometric fails
      });

      if (result.success) {
        return { success: true };
      }

      // Handle different error cases
      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        return { success: false, cancelled: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
    }
  },

  /**
   * Store a new PIN securely (hashed)
   */
  async setPin(pin: string): Promise<boolean> {
    try {
      // Validate PIN format (4-6 digits)
      if (!/^\d{4,6}$/.test(pin)) {
        throw new Error('PIN must be 4-6 digits');
      }

      // Generate a new salt
      const salt = await generateSalt();

      // Hash the PIN
      const hashedPin = await hashPin(pin, salt);

      // Store both the hash and salt securely
      await SecureStore.setItemAsync(PIN_HASH_KEY, hashedPin);
      await SecureStore.setItemAsync(PIN_SALT_KEY, salt);

      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  },

  /**
   * Verify a PIN against the stored hash
   */
  async verifyPin(pin: string): Promise<AuthResult> {
    try {
      // Get stored hash and salt
      const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
      const storedSalt = await SecureStore.getItemAsync(PIN_SALT_KEY);

      if (!storedHash || !storedSalt) {
        return { success: false, error: 'No PIN set' };
      }

      // Hash the input PIN with the stored salt
      const inputHash = await hashPin(pin, storedSalt);

      // Compare hashes
      if (inputHash === storedHash) {
        return { success: true };
      }

      return { success: false, error: 'Incorrect PIN' };
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification error',
      };
    }
  },

  /**
   * Check if a PIN has been set
   */
  async hasPinSet(): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
      return storedHash !== null;
    } catch (error) {
      console.error('Error checking PIN:', error);
      return false;
    }
  },

  /**
   * Remove the stored PIN
   */
  async removePin(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(PIN_HASH_KEY);
      await SecureStore.deleteItemAsync(PIN_SALT_KEY);
      return true;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  },

  /**
   * Get security settings from secure storage
   */
  async getSettings(): Promise<SecuritySettings> {
    try {
      const settingsJson = await SecureStore.getItemAsync(SECURITY_SETTINGS_KEY);
      if (!settingsJson) {
        return DEFAULT_SECURITY_SETTINGS;
      }
      return JSON.parse(settingsJson) as SecuritySettings;
    } catch (error) {
      console.error('Error getting security settings:', error);
      return DEFAULT_SECURITY_SETTINGS;
    }
  },

  /**
   * Save security settings to secure storage
   */
  async saveSettings(settings: SecuritySettings): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(
        SECURITY_SETTINGS_KEY,
        JSON.stringify(settings)
      );
      return true;
    } catch (error) {
      console.error('Error saving security settings:', error);
      return false;
    }
  },

  /**
   * Update specific security settings
   */
  async updateSettings(
    updates: Partial<SecuritySettings>
  ): Promise<SecuritySettings> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    await this.saveSettings(newSettings);
    return newSettings;
  },

  /**
   * Reset all security settings and remove PIN
   */
  async resetSecurity(): Promise<boolean> {
    try {
      await this.removePin();
      await this.saveSettings(DEFAULT_SECURITY_SETTINGS);
      return true;
    } catch (error) {
      console.error('Error resetting security:', error);
      return false;
    }
  },

  /**
   * Check if security is enabled (any auth method set)
   */
  async isSecurityEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.authMethod !== 'none';
  },
};
