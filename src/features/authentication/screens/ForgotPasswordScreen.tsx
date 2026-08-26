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
import { ChevronLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';
import { authService } from '../services/authService';
import { AppIcon } from '../../../shared/components';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  typeof STACK_ROUTES.FORGOT_PASSWORD
>;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  const handleSendResetLink = async () => {
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const message = await authService.forgotPassword(email);
      setSuccessMessage(message);
      setSubmitted(true);
      setTimeout(() => {
        navigation.goBack();
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send reset link. Please try again.',
      );
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
            paddingBottom: Math.max(insets.bottom, 20) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            theme.dark ? styles.backButtonDark : styles.backButtonLight,
          ]}
          disabled={loading}
        >
          <ChevronLeft size={22} color={theme.colors.text} strokeWidth={2.5} />
        </Pressable>

        {submitted ? (
          /* ── Success State ── */
          <View style={styles.successSection}>
            <View
              style={[
                styles.successIconCircle,
                theme.dark ? styles.iconCircleDark : styles.iconCircleLight,
              ]}
            >
              <AppIcon name="CheckCircle2" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              Email Sent!
            </Text>
            <Text style={[styles.successMessage, { color: theme.colors.mutedText }]}>
              {successMessage ||
                "Check your inbox for the password reset link. Redirecting you back shortly."}
            </Text>
          </View>
        ) : (
          /* ── Form State ── */
          <>
            {/* Icon & Title */}
            <View style={styles.headerSection}>
              <View
                style={[
                  styles.mailIconCircle,
                  theme.dark ? styles.iconCircleDark : styles.iconCircleLight,
                ]}
              >
                <AppIcon name="Mail" size={36} color={theme.colors.primary} />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Forgot Password?
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
                Enter your email and we'll send you a reset link
              </Text>
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.mutedText }]}>
                  Email Address
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    theme.dark ? styles.inputWrapperDark : styles.inputWrapperLight,
                    {
                      borderColor: emailFocused
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon
                    name="Mail"
                    size={18}
                    color={emailFocused ? theme.colors.primary : theme.colors.mutedText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="you@example.com"
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
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Error */}
              {error ? (
                <View
                  style={[
                    styles.errorBox,
                    theme.dark ? styles.errorBoxDark : styles.errorBoxLight,
                    {
                      borderColor: theme.colors.danger,
                    },
                  ]}
                >
                  <AppIcon name="AlertCircle" size={15} color={theme.colors.danger} style={styles.errorIcon} />
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Send Button */}
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
                  <>
                    <Text style={styles.sendButtonText}>Send Reset Link</Text>
                    <AppIcon name="ArrowRight" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  </>
                )}
              </Pressable>
            </View>

            {/* Info Footer */}
            <View style={styles.footer}>
              <AppIcon name="Info" size={13} color={theme.colors.mutedText} />
              <Text style={[styles.footerText, { color: theme.colors.mutedText }]}>
                {' '}Check spam if you don't receive it
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
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  mailIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  sendButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#1CA39A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // ── Success State ──
  successSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  backButtonLight: {
    backgroundColor: '#F0F0F0',
  },
  backButtonDark: {
    backgroundColor: '#2A2A2A',
  },
  iconCircleLight: {
    backgroundColor: '#E8F5F4',
  },
  iconCircleDark: {
    backgroundColor: '#163330',
  },
  inputWrapperLight: {
    backgroundColor: '#F8F9FA',
  },
  inputWrapperDark: {
    backgroundColor: '#1E1E1E',
  },
  errorBoxLight: {
    backgroundColor: '#FFF1F1',
  },
  errorBoxDark: {
    backgroundColor: '#3B1E1E',
  },
});
