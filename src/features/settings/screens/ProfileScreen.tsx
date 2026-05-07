import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Phone, MapPin } from 'lucide-react-native';
import { profileService, type UserProfile } from '../services/profileService';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const data = await profileService.fetchUserProfile();
        if (mounted) {
          setProfile(data);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load profile.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color="#1CA39A" />
      </View>
    );
  }

  const userProfile = profile;

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
      <Text style={styles.title}>Profile</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(
                userProfile?.full_name ??
                userProfile?.employee_name ??
                'U'
              ).charAt(0)}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {userProfile?.employee_status}
            </Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile?.full_name}</Text>
          <Text style={styles.profileRole}>{userProfile?.designation}</Text>
          <Text style={styles.joinDate}>
            Joined {userProfile?.date_of_joining}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Mail size={16} color="#1CA39A" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {userProfile?.company_email ??
                userProfile?.personal_email ??
                userProfile?.user_id}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Phone size={16} color="#1CA39A" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{userProfile?.mobile_no}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Work Details</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MapPin size={16} color="#1CA39A" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Company</Text>
            <Text style={styles.infoValue}>{userProfile?.company}</Text>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{userProfile?.department}</Text>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>{userProfile?.employee}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{userProfile?.gender ?? '-'}</Text>
          <Text style={styles.statLabel}>Gender</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {userProfile?.checkin_status ?? '-'}
          </Text>
          <Text style={styles.statLabel}>Check-in Status</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {userProfile?.enabled ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statLabel}>Enabled</Text>
        </View>
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
    marginBottom: 12,
    alignItems: 'center',
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
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5F4F3',
  },
  statusText: { color: '#1CA39A', fontSize: 11, fontWeight: '700' },
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#E03131',
    marginBottom: 12,
    fontWeight: '600',
  },
});
