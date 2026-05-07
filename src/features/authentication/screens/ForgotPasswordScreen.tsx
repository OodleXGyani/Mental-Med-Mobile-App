import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  typeof STACK_ROUTES.FORGOT_PASSWORD
>;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [email, setEmail] = useState('your@email.com');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSendResetLink = async () => {
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      setTimeout(() => {
        navigation.goBack();
      }, 3000);
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + 16,
            paddingBottom: Math.max(insets.bottom, 14) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={loading}
        >
          <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2.5} />
        </Pressable>

        {submitted ? (
          <View style={styles.successSection}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: theme.dark ? '#163330' : '#E8F5F4' },
              ]}
            >
              <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                ✓
              </Text>
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              Reset Link Sent
            </Text>
            <Text
              style={[styles.successMessage, { color: theme.colors.mutedText }]}
            >
              Check your email for the password reset link. We'll redirect you
              back to login shortly.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.iconSection}>
              <View
                style={[
                  styles.mailIconCircle,
                  { backgroundColor: theme.dark ? '#163330' : '#E8F5F4' },
                ]}
              >
                <Mail size={40} color={theme.colors.primary} strokeWidth={2} />
              </View>
            </View>

            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Forgot Password?
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.mutedText }]}
              >
                Enter your email to receive a reset link
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.colors.mutedText}
                  value={email}
                  onChangeText={nextEmail => {
                    setEmail(nextEmail);
                    setError('');
                  }}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {error ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: theme.dark ? '#3B1E1E' : '#FFEBEE',
                      borderLeftColor: theme.colors.danger,
                    },
                  ]}
                >
                  <Text
                    style={[styles.errorText, { color: theme.colors.danger }]}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.colors.primary },
                  loading && styles.sendButtonDisabled,
                ]}
                onPress={handleSendResetLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Send Reset Link</Text>
                )}
              </Pressable>
            </View>

            <View
              style={[
                styles.infoBox,
                { backgroundColor: theme.dark ? '#163330' : '#E8F5F4' },
              ]}
            >
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>
                Don't receive the email? Check your spam folder or try another
                email address.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mailIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sendButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  successSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
