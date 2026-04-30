import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Mail, Phone, Globe } from 'lucide-react-native';

export const AboutScreen = () => {
  const insets = useSafeAreaInsets();
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
    Linking.openURL('https://www.meds15.com');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoBadge}>
          <Zap size={40} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.appName}>Meds15</Text>
        <Text style={styles.appTagline}>Pharmacy Management System</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>

      {/* Description */}
      <View style={styles.descriptionCard}>
        <Text style={styles.descriptionText}>
          Meds15 is a comprehensive pharmacy management solution designed to
          streamline operations for Indian pharmacies. From POS billing and
          inventory management to order tracking and fulfillment, staff
          coordination — all in one platform.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Contact Section */}
      <View style={styles.contactCard}>
        <Text style={styles.sectionTitle}>Contact Us</Text>

        <Pressable style={styles.contactRow} onPress={handleWebsite}>
          <View style={styles.contactIconWrap}>
            <Globe size={18} color="#1CA39A" strokeWidth={2.2} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Website</Text>
            <Text style={styles.contactValue}>www.meds15.com</Text>
          </View>
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.contactRow} onPress={handleEmail}>
          <View style={styles.contactIconWrap}>
            <Mail size={18} color="#1CA39A" strokeWidth={2.2} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@meds15.com</Text>
          </View>
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.contactRow} onPress={handlePhone}>
          <View style={styles.contactIconWrap}>
            <Phone size={18} color="#1CA39A" strokeWidth={2.2} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+91 98765 43210</Text>
          </View>
        </Pressable>
      </View>

      {/* Legal */}
      <View style={styles.legalCard}>
        <Pressable>
          <Text style={styles.legalLink}>Terms & Conditions</Text>
        </Pressable>
        <Pressable style={styles.legalPressable}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Pressable>
        <Pressable style={styles.legalPressable}>
          <Text style={styles.legalLink}>License Agreement</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footerCard}>
        <Text style={styles.footerText}>
          © 2024 Meds15. All rights reserved.
        </Text>
        <Text style={styles.footerSubtext}>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1CA39A',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#E5F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
