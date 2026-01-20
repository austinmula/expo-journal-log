import React, { ReactNode } from 'react';
import {
  View,
  Modal as RNModal,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}: ModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[
              styles.content,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: insets.bottom + theme.spacing.md,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            {(title || showCloseButton) && (
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: theme.colors.borderLight,
                    paddingHorizontal: theme.spacing.md,
                    paddingBottom: theme.spacing.md,
                  },
                ]}
              >
                {title && (
                  <Text
                    style={[
                      styles.title,
                      { color: theme.colors.text },
                    ]}
                  >
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    hitSlop={12}
                    style={({ pressed }) => [
                      styles.closeButton,
                      {
                        backgroundColor: theme.colors.borderLight,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.closeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      x
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <ScrollView
              style={[
                styles.body,
                { paddingHorizontal: theme.spacing.md },
              ]}
              contentContainerStyle={{ paddingBottom: theme.spacing.md }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  handle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    flexGrow: 0,
  },
});
