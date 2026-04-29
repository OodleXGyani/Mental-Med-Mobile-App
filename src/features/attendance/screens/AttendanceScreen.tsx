import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAttendance } from '../hooks/useAttendance';

const monthDays = [
  'S', 'M', 'T', 'W', 'T', 'F', 'S',
  ' ', ' ', ' ', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', '10', '11',
  '12', '13', '14', '15', '16', '17', '18',
  '19', '20', '21', '22', '23', '24', '25',
  '26', '27', '28', '29', '30', ' ', ' ',
];

export const AttendanceScreen = () => {
  const { presentCount } = useAttendance();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Attendance</Text>

      <View style={styles.checkInCard}>
        <Text style={styles.dateText}>Thursday, 23 April</Text>
        <View style={styles.checkInButton}>
          <Text style={styles.checkInText}>Check In</Text>
        </View>
        <Text style={styles.gpsText}>GPS location will be captured</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.presentValue}>{presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.halfValue}>2</Text>
          <Text style={styles.statLabel}>Half Day</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.leaveValue}>1</Text>
          <Text style={styles.statLabel}>Leave</Text>
        </View>
      </View>

      <Text style={styles.monthTitle}>April 2026</Text>
      <View style={styles.calendarGrid}>
        {monthDays.map((day, index) => (
          <View key={String(index)} style={[styles.dayCell, day === '22' && styles.todayCell]}>
            <Text style={[styles.dayText, day === '22' && styles.todayText]}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.requestLeaveButton}>
        <Text style={styles.requestLeaveText}>Request Leave</Text>
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
    marginBottom: 12,
  },
  checkInCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#E8E3DE',
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  dateText: {
    textAlign: 'center',
    color: '#9B8378',
    fontWeight: '600',
    marginBottom: 8,
  },
  checkInButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkInText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  gpsText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#B2988B',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#E8E3DE',
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  presentValue: {
    color: '#1CA39A',
    fontWeight: '800',
    fontSize: 28,
  },
  halfValue: {
    color: '#F08C00',
    fontWeight: '800',
    fontSize: 28,
  },
  leaveValue: {
    color: '#E03131',
    fontWeight: '800',
    fontSize: 28,
  },
  statLabel: {
    color: '#A68F82',
    fontSize: 12,
    marginTop: 3,
  },
  monthTitle: {
    color: '#3C3531',
    fontWeight: '800',
    fontSize: 18,
    marginVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  dayCell: {
    width: '13.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 4,
  },
  dayText: {
    color: '#9F8579',
    fontSize: 12,
    fontWeight: '600',
  },
  todayCell: {
    backgroundColor: '#FAD9D9',
  },
  todayText: {
    color: '#B32727',
    fontWeight: '800',
  },
  requestLeaveButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  requestLeaveText: {
    color: '#5A514D',
    fontWeight: '700',
  },
});
