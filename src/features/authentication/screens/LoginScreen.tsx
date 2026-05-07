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
import { Link } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  typeof STACK_ROUTES.LOGIN
>;

export const LoginScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [email, setEmail] = useState('manager@meds15.test');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    await login(email, password);
  };

  const handleForgotPassword = () => {
    navigation.navigate(STACK_ROUTES.FORGOT_PASSWORD);
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
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Link size={36} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Meds15 Staff
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            Sign in to your account
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              email
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
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.mutedText}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Password
            </Text>
            <View
              style={[
                styles.passwordInputWrapper,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.mutedText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={[
              styles.signInButton,
              { backgroundColor: theme.colors.primary },
              loading && styles.signInButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </Pressable>

          {/* Error Message */}
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
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Forgot Password Link */}
          <Pressable
            onPress={handleForgotPassword}
            style={styles.forgotPasswordLink}
            disabled={loading}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                { color: theme.colors.primary },
              ]}
            >
              Forgot password?
            </Text>
          </Pressable>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.dark ? '#163330' : '#E8F5F4' },
          ]}
        >
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            This screen uses the live ERP Pharmacy login API and shows server or
            network errors inline.
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
    backgroundColor: '#F5F5F6',
  },
  content: {
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1CA39A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9B8378',
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
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  eyeText: {
    fontSize: 18,
  },
  signInButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E03131',
  },
  errorText: {
    color: '#E03131',
    fontSize: 13,
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#1CA39A',
    fontSize: 13,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E8F5F4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  infoText: {
    color: '#2B9A92',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
