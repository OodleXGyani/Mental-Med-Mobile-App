import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Phone, MapPin } from 'lucide-react-native';
import { profileService, type UserProfile } from '../services/profileService';
import { useAppTheme } from '../../../shared/theme';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
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
      <View
        style={[
          styles.screen,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const userProfile = profile;

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
      <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>

      {errorMessage ? (
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
          {errorMessage}
        </Text>
      ) : null}

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {(
                userProfile?.full_name ??
                userProfile?.employee_name ??
                'U'
              ).charAt(0)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
              {userProfile?.employee_status}
            </Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.colors.text }]}>
            {userProfile?.full_name}
          </Text>
          <Text style={[styles.profileRole, { color: theme.colors.mutedText }]}>
            {userProfile?.designation}
          </Text>
          <Text style={[styles.joinDate, { color: theme.colors.mutedText }]}>
            Joined {userProfile?.date_of_joining}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Contact Information
        </Text>

        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoIconWrap,
              { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
            ]}
          >
            <Mail size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.mutedText }]}>
              Email
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {userProfile?.company_email ??
                userProfile?.personal_email ??
                userProfile?.user_id}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoIconWrap,
              { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
            ]}
          >
            <Phone size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.mutedText }]}>
              Phone
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {userProfile?.mobile_no}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Work Details
        </Text>

        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoIconWrap,
              { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
            ]}
          >
            <MapPin size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.mutedText }]}>
              Company
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {userProfile?.company}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.colors.mutedText }]}>
              Department
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {userProfile?.department}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.colors.mutedText }]}>
              Employee ID
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {userProfile?.employee}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {userProfile?.gender ?? '-'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
            Gender
          </Text>
        </View>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {userProfile?.checkin_status ?? '-'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
            Check-in Status
          </Text>
        </View>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {userProfile?.enabled ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
            Enabled
          </Text>
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
