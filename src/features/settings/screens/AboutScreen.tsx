import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Mail, Phone, Globe } from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';

export const AboutScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const features = [
    'Mobile POS with barcode scanning',
    'Real-time inventory management',
    'Order tracking & fulfillment',
    'Staff attendance with GPS',
    'GST-compliant billing',
    'Multi-pharmacy support',
    'EPPNext integration',
  ];

  const handleEmail = () => {
    Linking.openURL('mailto:support@meds15.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleWebsite = () => {
    Linking.openURL('https://pharmacy.oodleslab.com');
  };

  const handleTerms = () => {
    Linking.openURL('https://pharmacy.oodleslab.com/terms');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://pharmacy.oodleslab.com/privacy');
  };

  const handleLicense = () => {
    Linking.openURL('https://pharmacy.oodleslab.com/license');
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          About
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image
          source={require('../../../assets/images/Medslogo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.colors.text }]}>
          Meds15
        </Text>
        <Text style={[styles.appTagline, { color: theme.colors.mutedText }]}>
          Pharmacy Management System
        </Text>
        <Text style={[styles.appVersion, { color: theme.colors.mutedText }]}>
          Version 1.0.0
        </Text>
      </View>

      {/* Description */}
      <View
        style={[
          styles.descriptionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[styles.descriptionText, { color: theme.colors.mutedText }]}
        >
          Meds15 is a comprehensive pharmacy management solution designed to
          streamline operations for Indian pharmacies. From POS billing and
          inventory management to order tracking and fulfillment, staff
          coordination — all in one platform.
        </Text>
      </View>

      {/* Features */}
      <View
        style={[
          styles.featuresCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Key Features
        </Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View
              style={[
                styles.featureDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text
              style={[styles.featureText, { color: theme.colors.mutedText }]}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Contact Section */}
      <View
        style={[
          styles.contactCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Contact Us
        </Text>

        <Pressable style={styles.contactRow} onPress={handleWebsite}>
          <View
            style={[
              styles.contactIconWrap,
              theme.dark ? styles.contactIconWrapDark : styles.contactIconWrapLight,
            ]}
          >
            <Globe size={18} color={theme.colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.contactContent}>
            <Text
              style={[styles.contactLabel, { color: theme.colors.mutedText }]}
            >
              Website
            </Text>
            <Text style={[styles.contactValue, { color: theme.colors.text }]}>
              pharmacy.oodleslab.com
            </Text>
          </View>
        </Pressable>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <Pressable style={styles.contactRow} onPress={handleEmail}>
          <View
            style={[
              styles.contactIconWrap,
              theme.dark ? styles.contactIconWrapDark : styles.contactIconWrapLight,
            ]}
          >
            <Mail size={18} color={theme.colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.contactContent}>
            <Text
              style={[styles.contactLabel, { color: theme.colors.mutedText }]}
            >
              Email
            </Text>
            <Text style={[styles.contactValue, { color: theme.colors.text }]}>
              support@meds15.com
            </Text>
          </View>
        </Pressable>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <Pressable style={styles.contactRow} onPress={handlePhone}>
          <View
            style={[
              styles.contactIconWrap,
              theme.dark ? styles.contactIconWrapDark : styles.contactIconWrapLight,
            ]}
          >
            <Phone size={18} color={theme.colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.contactContent}>
            <Text
              style={[styles.contactLabel, { color: theme.colors.mutedText }]}
            >
              Phone
            </Text>
            <Text style={[styles.contactValue, { color: theme.colors.text }]}>
              +91 98765 43210
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Legal */}
      <View
        style={[
          styles.legalCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Pressable onPress={handleTerms}>
          <Text style={[styles.legalLink, { color: theme.colors.primary }]}>
            Terms & Conditions
          </Text>
        </Pressable>
        <Pressable style={styles.legalPressable} onPress={handlePrivacyPolicy}>
          <Text style={[styles.legalLink, { color: theme.colors.primary }]}>
            Privacy Policy
          </Text>
        </Pressable>
        <Pressable style={styles.legalPressable} onPress={handleLicense}>
          <Text style={[styles.legalLink, { color: theme.colors.primary }]}>
            License Agreement
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footerCard}>
        <Text style={[styles.footerText, { color: theme.colors.mutedText }]}>
          © 2024 Meds15. All rights reserved.
        </Text>
        <Text style={[styles.footerSubtext, { color: theme.colors.mutedText }]}>
          Made with ❤️ for Indian Pharmacies
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
    flex: 1,
    textAlign: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B8378',
    marginTop: 4,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B59D90',
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 14,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A5149',
    lineHeight: 20,
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1CA39A',
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A5149',
    flex: 1,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactIconWrapLight: {
    backgroundColor: '#E5F4F3',
  },
  contactIconWrapDark: {
    backgroundColor: '#163330',
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A68F82',
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#312F2E',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 14,
  },
  legalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  legalPressable: {
    marginTop: 8,
  },
  legalLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1CA39A',
  },
  footerCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A68F82',
  },
  footerSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B59D90',
    marginTop: 4,
  },
});
