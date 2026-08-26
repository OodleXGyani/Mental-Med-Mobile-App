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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';
import { AppIcon } from '../../../shared/components';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  typeof STACK_ROUTES.LOGIN
>;

export const LoginScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // OTP Form States
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtpFocused, setPhoneOtpFocused] = useState(false);
  const [emailOtpFocused, setEmailOtpFocused] = useState(false);
  
  const { loginHandshake, verifyOtp, resetStep, authStep, handshakeData, loginEmail, loading, error } = useAuth();

  const handleLogin = async () => {
    await loginHandshake(email, password);
  };
  
  const handleVerifyOtp = async () => {
    if (handshakeData && loginEmail) {
      await verifyOtp(loginEmail, handshakeData.otp_token, phoneOtp, emailOtp);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate(STACK_ROUTES.FORGOT_PASSWORD);
  };
  
  const handleBackToLogin = () => {
    resetStep();
    setPhoneOtp('');
    setEmailOtp('');
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
            paddingTop: Math.max(insets.top, 15) + 15,
            paddingBottom: Math.max(insets.bottom, 20) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/images/Medslogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {authStep === 'AWAITING_OTP' ? 'Verify Identity' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            {authStep === 'AWAITING_OTP' 
              ? 'Enter the code sent to your devices' 
              : 'Sign in to your Meds15 Staff account'}
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
          {authStep === 'IDLE' ? (
            <>
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
                    onChangeText={setEmail}
                    editable={!loading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.mutedText }]}>
                    Password
                  </Text>
                  <Pressable onPress={handleForgotPassword} disabled={loading}>
                    <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    theme.dark ? styles.inputWrapperDark : styles.inputWrapperLight,
                    {
                      borderColor: passwordFocused
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon
                    name="Lock"
                    size={18}
                    color={passwordFocused ? theme.colors.primary : theme.colors.mutedText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.mutedText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    autoCapitalize="none"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <AppIcon
                      name={showPassword ? 'Eye' : 'EyeOff'}
                      size={18}
                      color={theme.colors.mutedText}
                    />
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* OTP Inputs */}
              {handshakeData?.needs_verification?.includes('phone') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.mutedText }]}>
                    Phone Code ({handshakeData.phone_hint})
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      theme.dark ? styles.inputWrapperDark : styles.inputWrapperLight,
                      {
                        borderColor: phoneOtpFocused
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name="Smartphone"
                      size={18}
                      color={phoneOtpFocused ? theme.colors.primary : theme.colors.mutedText}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }, styles.otpInput]}
                      placeholder="000000"
                      placeholderTextColor={theme.colors.mutedText}
                      value={phoneOtp}
                      onChangeText={setPhoneOtp}
                      editable={!loading}
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => setPhoneOtpFocused(true)}
                      onBlur={() => setPhoneOtpFocused(false)}
                    />
                  </View>
                </View>
              )}
              
              {handshakeData?.needs_verification?.includes('email') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.mutedText }]}>
                    Email Code ({handshakeData.email_hint})
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      theme.dark ? styles.inputWrapperDark : styles.inputWrapperLight,
                      {
                        borderColor: emailOtpFocused
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name="Mail"
                      size={18}
                      color={emailOtpFocused ? theme.colors.primary : theme.colors.mutedText}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }, styles.otpInput]}
                      placeholder="000000"
                      placeholderTextColor={theme.colors.mutedText}
                      value={emailOtp}
                      onChangeText={setEmailOtp}
                      editable={!loading}
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => setEmailOtpFocused(true)}
                      onBlur={() => setEmailOtpFocused(false)}
                    />
                  </View>
                </View>
              )}
            </>
          )}

          {/* Error Message */}
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

          {/* Action Button */}
          <Pressable
            style={[
              styles.signInButton,
              { backgroundColor: theme.colors.primary },
              loading && styles.signInButtonDisabled,
            ]}
            onPress={authStep === 'IDLE' ? handleLogin : handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.signInButtonText}>
                  {authStep === 'IDLE' ? 'Sign In' : 'Verify & Continue'}
                </Text>
                <AppIcon name="ArrowRight" size={18} color="#FFFFFF" style={styles.buttonIcon} />
              </>
            )}
          </Pressable>
          
          {/* Back to Login Button */}
          {authStep === 'AWAITING_OTP' && (
            <Pressable
              style={styles.backButton}
              onPress={handleBackToLogin}
              disabled={loading}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.mutedText }]}>
                Back to Login
              </Text>
            </Pressable>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AppIcon name="Shield" size={13} color={theme.colors.mutedText} />
          <Text style={[styles.footerText, { color: theme.colors.mutedText }]}>
            {' '}Secured by Meds15 ERP
          </Text>
        </View>
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
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logoImage: {
    width: 150,
    height: 80,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  eyeButton: {
    paddingLeft: 10,
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
  signInButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
    shadowColor: '#1CA39A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signInButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputWrapperLight: {
    backgroundColor: '#F8F9FA',
  },
  inputWrapperDark: {
    backgroundColor: '#1E1E1E',
  },
  otpInput: {
    fontSize: 18,
    letterSpacing: 8,
  },
  errorBoxLight: {
    backgroundColor: '#FFF1F1',
  },
  errorBoxDark: {
    backgroundColor: '#3B1E1E',
  },
});
