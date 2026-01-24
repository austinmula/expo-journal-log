/**
 * Security Types
 * Types for app security features including biometric authentication and PIN protection
 */

/**
 * Available authentication methods
 * - 'biometric': Face ID, Touch ID, or Fingerprint
 * - 'pin': 4-6 digit PIN code
 * - 'none': No security enabled
 */
export type AuthMethod = 'biometric' | 'pin' | 'none';

/**
 * Types of biometric authentication available on device
 */
export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

/**
 * Security settings configuration
 */
export interface SecuritySettings {
  /** The primary authentication method */
  authMethod: AuthMethod;
  /** Whether biometric authentication is enabled */
  biometricEnabled: boolean;
  /** Whether PIN authentication is enabled (used as fallback or primary) */
  pinEnabled: boolean;
  /** Auto-lock timeout in minutes (0 = lock immediately on background) */
  autoLockTimeout: number;
  /** Whether to require authentication on app launch */
  requireAuthOnLaunch: boolean;
}

/**
 * Result of checking biometric hardware availability
 */
export interface BiometricCapabilities {
  /** Whether any biometric hardware is available */
  isAvailable: boolean;
  /** Whether biometric credentials are enrolled */
  isEnrolled: boolean;
  /** Types of biometrics available */
  biometricTypes: BiometricType[];
  /** Human-readable name of the biometric type (e.g., "Face ID", "Fingerprint") */
  biometricName: string;
}

/**
 * Result of an authentication attempt
 */
export interface AuthResult {
  /** Whether authentication succeeded */
  success: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** Whether the user cancelled the authentication */
  cancelled?: boolean;
}

/**
 * Default security settings for new users
 */
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  authMethod: 'none',
  biometricEnabled: false,
  pinEnabled: false,
  autoLockTimeout: 0,
  requireAuthOnLaunch: true,
};
