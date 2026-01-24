/**
 * Security Store
 * Zustand store for managing app security state
 */

import { create } from 'zustand';
import { securityService } from '@/services/securityService';
import {
  SecuritySettings,
  BiometricCapabilities,
  AuthMethod,
  AuthResult,
  DEFAULT_SECURITY_SETTINGS,
} from '@/types/security';

interface SecurityState {
  // State
  isLocked: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  settings: SecuritySettings;
  biometricCapabilities: BiometricCapabilities | null;
  lastBackgroundTime: number | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  authenticateWithBiometrics: () => Promise<AuthResult>;
  authenticateWithPin: (pin: string) => Promise<AuthResult>;
  setPin: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  removePin: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<boolean>;
  updateSettings: (updates: Partial<SecuritySettings>) => Promise<void>;
  setAuthMethod: (method: AuthMethod) => Promise<void>;
  disableSecurity: (currentPin?: string) => Promise<boolean>;
  handleAppBackground: () => void;
  handleAppForeground: () => void;
  checkShouldLock: () => boolean;
  clearError: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  // Initial state
  isLocked: false,
  isAuthenticated: false,
  isInitialized: false,
  settings: DEFAULT_SECURITY_SETTINGS,
  biometricCapabilities: null,
  lastBackgroundTime: null,
  error: null,

  /**
   * Initialize security store by loading settings and checking capabilities
   */
  initialize: async () => {
    try {
      // Load settings and check biometric capabilities in parallel
      const [settings, capabilities] = await Promise.all([
        securityService.getSettings(),
        securityService.checkBiometricCapabilities(),
      ]);

      // Determine if app should start locked
      const shouldLock =
        settings.authMethod !== 'none' && settings.requireAuthOnLaunch;

      set({
        settings,
        biometricCapabilities: capabilities,
        isLocked: shouldLock,
        isAuthenticated: !shouldLock,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Error initializing security store:', error);
      set({
        isInitialized: true,
        error: 'Failed to initialize security',
      });
    }
  },

  /**
   * Lock the app
   */
  lock: () => {
    const { settings } = get();
    if (settings.authMethod !== 'none') {
      set({ isLocked: true, isAuthenticated: false });
    }
  },

  /**
   * Unlock the app (after successful authentication)
   */
  unlock: () => {
    set({ isLocked: false, isAuthenticated: true, error: null });
  },

  /**
   * Authenticate using biometrics
   */
  authenticateWithBiometrics: async () => {
    const result = await securityService.authenticateWithBiometrics();

    if (result.success) {
      get().unlock();
    } else if (!result.cancelled) {
      set({ error: result.error || 'Biometric authentication failed' });
    }

    return result;
  },

  /**
   * Authenticate using PIN
   */
  authenticateWithPin: async (pin: string) => {
    const result = await securityService.verifyPin(pin);

    if (result.success) {
      get().unlock();
    } else {
      set({ error: result.error || 'PIN verification failed' });
    }

    return result;
  },

  /**
   * Set a new PIN
   */
  setPin: async (pin: string) => {
    const success = await securityService.setPin(pin);

    if (success) {
      const newSettings = await securityService.updateSettings({
        pinEnabled: true,
        authMethod: get().settings.biometricEnabled ? 'biometric' : 'pin',
      });
      set({ settings: newSettings });
    }

    return success;
  },

  /**
   * Change existing PIN
   */
  changePin: async (currentPin: string, newPin: string) => {
    // Verify current PIN first
    const verifyResult = await securityService.verifyPin(currentPin);
    if (!verifyResult.success) {
      set({ error: 'Current PIN is incorrect' });
      return false;
    }

    // Set new PIN
    const success = await securityService.setPin(newPin);
    if (!success) {
      set({ error: 'Failed to set new PIN' });
    }

    return success;
  },

  /**
   * Remove the PIN (requires current PIN verification if security is enabled)
   */
  removePin: async () => {
    const success = await securityService.removePin();

    if (success) {
      const { settings } = get();
      const newSettings = await securityService.updateSettings({
        pinEnabled: false,
        // If biometrics are enabled, keep using that; otherwise disable security
        authMethod: settings.biometricEnabled ? 'biometric' : 'none',
      });
      set({ settings: newSettings });
    }

    return success;
  },

  /**
   * Enable biometric authentication
   */
  enableBiometrics: async () => {
    const capabilities = get().biometricCapabilities;

    // Check if biometrics are available and enrolled
    if (!capabilities?.isAvailable || !capabilities?.isEnrolled) {
      set({ error: 'Biometrics not available or not enrolled' });
      return false;
    }

    // Test biometric authentication first
    const testResult = await securityService.authenticateWithBiometrics(
      'Verify to enable biometric unlock'
    );

    if (!testResult.success) {
      if (!testResult.cancelled) {
        set({ error: 'Failed to verify biometrics' });
      }
      return false;
    }

    const newSettings = await securityService.updateSettings({
      biometricEnabled: true,
      authMethod: 'biometric',
    });
    set({ settings: newSettings });

    return true;
  },

  /**
   * Disable biometric authentication
   */
  disableBiometrics: async () => {
    const { settings } = get();
    const newSettings = await securityService.updateSettings({
      biometricEnabled: false,
      // Fall back to PIN if enabled, otherwise disable security
      authMethod: settings.pinEnabled ? 'pin' : 'none',
    });
    set({ settings: newSettings });

    return true;
  },

  /**
   * Update security settings
   */
  updateSettings: async (updates: Partial<SecuritySettings>) => {
    const newSettings = await securityService.updateSettings(updates);
    set({ settings: newSettings });
  },

  /**
   * Set the authentication method
   */
  setAuthMethod: async (method: AuthMethod) => {
    const newSettings = await securityService.updateSettings({
      authMethod: method,
    });
    set({ settings: newSettings });
  },

  /**
   * Disable all security (requires PIN verification if PIN is enabled)
   */
  disableSecurity: async (currentPin?: string) => {
    const { settings } = get();

    // If PIN is enabled, verify it first
    if (settings.pinEnabled && currentPin) {
      const verifyResult = await securityService.verifyPin(currentPin);
      if (!verifyResult.success) {
        set({ error: 'Incorrect PIN' });
        return false;
      }
    }

    // Reset all security
    const success = await securityService.resetSecurity();
    if (success) {
      set({
        settings: DEFAULT_SECURITY_SETTINGS,
        isLocked: false,
        isAuthenticated: true,
      });
    }

    return success;
  },

  /**
   * Handle app going to background
   */
  handleAppBackground: () => {
    set({ lastBackgroundTime: Date.now() });
  },

  /**
   * Handle app coming to foreground
   */
  handleAppForeground: () => {
    const { checkShouldLock, lock } = get();
    if (checkShouldLock()) {
      lock();
    }
    set({ lastBackgroundTime: null });
  },

  /**
   * Check if the app should be locked based on timeout
   */
  checkShouldLock: () => {
    const { settings, lastBackgroundTime, isAuthenticated } = get();

    // If security is disabled, never lock
    if (settings.authMethod === 'none') {
      return false;
    }

    // If not authenticated, should be locked
    if (!isAuthenticated) {
      return true;
    }

    // If no background time recorded, don't lock
    if (!lastBackgroundTime) {
      return false;
    }

    // Check if timeout has elapsed
    const timeoutMs = settings.autoLockTimeout * 60 * 1000;
    const timeSinceBackground = Date.now() - lastBackgroundTime;

    // If timeout is 0, lock immediately
    if (settings.autoLockTimeout === 0) {
      return true;
    }

    return timeSinceBackground >= timeoutMs;
  },

  /**
   * Clear any error message
   */
  clearError: () => {
    set({ error: null });
  },
}));

// Selector hooks for common patterns
export const useIsLocked = () => useSecurityStore((state) => state.isLocked);
export const useIsSecurityEnabled = () =>
  useSecurityStore((state) => state.settings.authMethod !== 'none');
export const useBiometricCapabilities = () =>
  useSecurityStore((state) => state.biometricCapabilities);
