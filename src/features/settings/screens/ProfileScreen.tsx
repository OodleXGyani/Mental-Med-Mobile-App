import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Phone, MapPin, Edit, LogOut } from 'lucide-react-native';
import { useAuth } from '../../authentication/hooks/useAuth';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  // Mock user data
  const userProfile = {
    name: 'Rahul Sharma',
    role: 'Pharmacist',
    email: 'rahul.sharma@pharmacy.com',
    phone: '+91 98765 43210',
    location: 'MediPlus Pharmacy, Hyderabad',
    joinDate: 'January 2024',
    address: '123 Medical Street, Hyderabad, India 500001',
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
      {/* Header */}
      <Text style={styles.title}>Profile</Text>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
          </View>
          <Pressable style={styles.editBadge}>
            <Edit size={14} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileRole}>{userProfile.role}</Text>
          <Text style={styles.joinDate}>
            Member since {userProfile.joinDate}
          </Text>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Mail size={16} color="#1CA39A" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userProfile.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Phone size={16} color="#1CA39A" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{userProfile.phone}</Text>
          </View>
        </View>
      </View>

      {/* Location Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pharmacy Location</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MapPin size={16} color="#1CA39A" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{userProfile.address}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>1,234</Text>
          <Text style={styles.statLabel}>Orders Processed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Accuracy Rate</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Customers Served</Text>
        </View>
      </View>

      {/* Edit Profile Button */}
      <Pressable style={styles.editButton}>
        <Edit size={16} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </Pressable>

      {/* Sign Out Button */}
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <LogOut size={16} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </Pressable>
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
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1CA39A',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1CA39A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B8378',
    marginTop: 2,
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B59D90',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E5F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A68F82',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312F2E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E3DE',
    marginVertical: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1CA39A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A68F82',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  signOutButton: {
    backgroundColor: '#E03131',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
