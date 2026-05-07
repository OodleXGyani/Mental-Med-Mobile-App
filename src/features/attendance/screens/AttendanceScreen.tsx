import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Calendar } from 'lucide-react-native';
import { attendanceService } from '../services/attendanceService';
import { profileService } from '../../settings/services/profileService';
import { useAppTheme } from '../../../shared/theme';

const DEFAULT_EMPLOYEE_ID = 'HR-EMP-00001';

const leaveTypes = [
  { label: 'Sick Leave', value: 'sick' },
  { label: 'Personal Leave', value: 'personal' },
  { label: 'Casual Leave', value: 'casual' },
  { label: 'Earned Leave', value: 'earned' },
];

interface LeaveForm {
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const toDateString = (value: Date) => value.toISOString().split('T')[0];

  return {
    fromDate: toDateString(start),
    toDate: toDateString(end),
  };
};

const generateCalendarDays = (
  attendanceData: Array<{
    attendance_date: string;
    status: string;
    in_time: string | null;
    out_time: string | null;
    working_hours: number;
  }>,
) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create a map for quick lookup of attendance data
  const attendanceMap = new Map(
    attendanceData.map(day => [day.attendance_date, day]),
  );

  const calendarDays: Array<{
    date: string | null;
    dayNumber: number | null;
    status: string | null;
  }> = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push({ date: null, dayNumber: null, status: null });
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    const attendance = attendanceMap.get(dateString);

    calendarDays.push({
      date: dateString,
      dayNumber: day,
      status: attendance?.status || 'Absent',
    });
  }

  return calendarDays;
};

export const AttendanceScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [leaveForm, setLeaveForm] = useState<LeaveForm>({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeName, setEmployeeName] = useState('Employee');
  const [employeeId, setEmployeeId] = useState(DEFAULT_EMPLOYEE_ID);
  const [checkinStatus, setCheckinStatus] = useState<'IN' | 'OUT'>('OUT');
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    halfDay: 0,
    leave: 0,
  });
  const [attendanceCalendar, setAttendanceCalendar] = useState<
    Array<{
      attendance_date: string;
      status: string;
      in_time: string | null;
      out_time: string | null;
      working_hours: number;
    }>
  >([]);
  const [errorMessage, setErrorMessage] = useState('');

  const monthRange = useMemo(() => getMonthRange(), []);
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const profile = await profileService.fetchUserProfile();
      setEmployeeName(profile.full_name || profile.employee_name);
      setEmployeeId(profile.employee || DEFAULT_EMPLOYEE_ID);
      setCheckinStatus(profile.checkin_status ?? 'OUT');

      const [summary, calendar] = await Promise.all([
        attendanceService.fetchAttendanceSummary(
          monthRange.fromDate,
          monthRange.toDate,
          profile.employee || DEFAULT_EMPLOYEE_ID,
        ),
        attendanceService.fetchAttendanceByDate(
          monthRange.fromDate,
          monthRange.toDate,
          profile.employee || DEFAULT_EMPLOYEE_ID,
        ),
      ]);

      console.log('Attendance Summary:', summary);

      setAttendanceSummary({
        present: summary.summary.Present,
        halfDay: summary.summary['Half Day'],
        leave: summary.summary.Leave,
      });
      setAttendanceCalendar(calendar);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load attendance.',
      );
    } finally {
      setLoading(false);
    }
  }, [monthRange.fromDate, monthRange.toDate]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const handleSubmitLeave = () => {
    if (leaveForm.leaveType && leaveForm.fromDate && leaveForm.toDate) {
      // Handle submit
      console.log('Leave request submitted:', leaveForm);
      setLeaveForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
      setShowLeaveModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowLeaveModal(false);
    setShowDropdown(false);
    setLeaveForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
  };

  const getLeaveTypeLabel = () => {
    const selected = leaveTypes.find(t => t.value === leaveForm.leaveType);
    return selected ? selected.label : 'Leave Type';
  };

  const requestCurrentCoordinates = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'We need your location to submit attendance with real coordinates.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Location permission denied.');
      }
    }

    const fallbackCoords = { latitude: 28.6139, longitude: 77.209 };

    return await new Promise<{ latitude: number; longitude: number }>(
      resolve => {
        const navigator = globalThis as any;
        const geolocation = navigator?.geolocation;

        if (!geolocation?.getCurrentPosition) {
          resolve(fallbackCoords);
          return;
        }

        const timeoutId = setTimeout(() => {
          resolve(fallbackCoords);
        }, 10000);

        geolocation.getCurrentPosition(
          (position: any) => {
            clearTimeout(timeoutId);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => {
            clearTimeout(timeoutId);
            resolve(fallbackCoords);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 10000,
          },
        );
      },
    );
  }, []);

  const handleCheckin = useCallback(async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const { latitude, longitude } = await requestCurrentCoordinates();
      const nextLogType = checkinStatus === 'OUT' ? 'IN' : 'OUT';

      await attendanceService.createEmployeeCheckin({
        employee: employeeId,
        log_type: nextLogType,
        latitude,
        longitude,
      });

      Alert.alert('Success', `Attendance marked as ${nextLogType}.`);
      setCheckinStatus(nextLogType === 'IN' ? 'IN' : 'OUT');
      await loadAttendance();
    } catch (error) {
      Alert.alert(
        'Unable to mark attendance',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    checkinStatus,
    employeeId,
    loadAttendance,
    requestCurrentCoordinates,
    submitting,
  ]);

  const checkinButtonLabel = checkinStatus === 'OUT' ? 'Check In' : 'Check Out';

  return (
    <>
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
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Attendance
        </Text>

        <View
          style={[
            styles.checkInCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.dateText, { color: theme.colors.mutedText }]}>
            {employeeName}
          </Text>
          <Pressable
            style={[
              styles.checkInButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleCheckin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkInText}>→ {checkinButtonLabel}</Text>
            )}
          </Pressable>
          <Text style={[styles.gpsText, { color: theme.colors.mutedText }]}>
            GPS location will be captured
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            style={{ marginBottom: 12 }}
            color={theme.colors.primary}
          />
        ) : null}
        {errorMessage ? (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {errorMessage}
          </Text>
        ) : null}

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.presentValue, { color: theme.colors.success }]}
            >
              {attendanceSummary.present}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
              Present
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.halfValue, { color: theme.colors.warning }]}>
              {attendanceSummary.halfDay}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
              Half Day
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.leaveValue, { color: theme.colors.danger }]}>
              {attendanceSummary.leave}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
              Leave
            </Text>
          </View>
        </View>

        {/* Calendar Day Headers */}
        <View
          style={[
            styles.calendarContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.calendarHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>
              {monthLabel}
            </Text>
          </View>
          <View style={styles.dayHeaderRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text
                  style={[
                    styles.dayHeaderText,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays(attendanceCalendar).map((day, index) => (
              <View
                key={String(index)}
                style={[
                  styles.dayCell,
                  day.date === null && styles.emptyCell,
                  day.status === 'Present' && {
                    backgroundColor: theme.dark ? '#1E3B38' : '#DDF1EE',
                  },
                  day.status === 'Half Day' && {
                    backgroundColor: theme.dark ? '#3A2D1A' : '#FFE4BC',
                  },
                  day.status === 'Leave' && {
                    backgroundColor: theme.dark ? '#3A1C1C' : '#FFD6D6',
                  },
                  day.status === 'Absent' && {
                    backgroundColor: theme.dark ? '#2A2420' : '#F2ECE7',
                  },
                ]}
              >
                {day.dayNumber !== null ? (
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: theme.colors.text },
                      day.status === 'Present' && {
                        color: theme.colors.success,
                      },
                      day.status === 'Half Day' && {
                        color: theme.colors.warning,
                      },
                      day.status === 'Leave' && { color: theme.colors.danger },
                      day.status === 'Absent' && {
                        color: theme.colors.mutedText,
                      },
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <Pressable
          style={[
            styles.requestLeaveButton,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => setShowLeaveModal(true)}
        >
          <Text style={[styles.requestLeaveText, { color: theme.colors.text }]}>
            Request Leave
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showLeaveModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
              >
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.card },
                  ]}
                >
                  <View
                    style={[
                      styles.modalHeader,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.modalTitle, { color: theme.colors.text }]}
                    >
                      Request Leave
                    </Text>
                    <Pressable onPress={handleCloseModal}>
                      <X
                        size={24}
                        color={theme.colors.text}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalBodyContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.formGroup}>
                      <Text
                        style={[styles.label, { color: theme.colors.text }]}
                      >
                        Leave Type
                      </Text>
                      <Pressable
                        style={[
                          styles.dropdownButton,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => setShowDropdown(!showDropdown)}
                      >
                        <Text
                          style={[
                            styles.dropdownText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {leaveForm.leaveType
                            ? getLeaveTypeLabel()
                            : 'Select leave type'}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownArrow,
                            { color: theme.colors.mutedText },
                          ]}
                        >
                          ∨
                        </Text>
                      </Pressable>

                      {showDropdown && (
                        <View
                          style={[
                            styles.dropdownMenu,
                            {
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          {leaveTypes.map(type => (
                            <Pressable
                              key={type.value}
                              style={[
                                styles.dropdownItem,
                                { borderBottomColor: theme.colors.border },
                              ]}
                              onPress={() => {
                                setLeaveForm({
                                  ...leaveForm,
                                  leaveType: type.value,
                                });
                                setShowDropdown(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemText,
                                  { color: theme.colors.mutedText },
                                  leaveForm.leaveType === type.value && {
                                    color: theme.colors.primary,
                                  },
                                ]}
                              >
                                {type.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.dateRow}>
                      <View
                        style={[styles.formGroup, { flex: 1, marginRight: 8 }]}
                      >
                        <Text
                          style={[styles.label, { color: theme.colors.text }]}
                        >
                          From
                        </Text>
                        <View
                          style={[
                            styles.dateInputWrapper,
                            {
                              backgroundColor: theme.colors.background,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <TextInput
                            style={[
                              styles.dateInput,
                              { color: theme.colors.text },
                            ]}
                            placeholder="dd/mm/yyyy"
                            placeholderTextColor={theme.colors.mutedText}
                            value={leaveForm.fromDate}
                            onChangeText={text =>
                              setLeaveForm({ ...leaveForm, fromDate: text })
                            }
                          />
                          <Calendar
                            size={18}
                            color={theme.colors.mutedText}
                            strokeWidth={2}
                          />
                        </View>
                      </View>

                      <View
                        style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}
                      >
                        <Text
                          style={[styles.label, { color: theme.colors.text }]}
                        >
                          To
                        </Text>
                        <View
                          style={[
                            styles.dateInputWrapper,
                            {
                              backgroundColor: theme.colors.background,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <TextInput
                            style={[
                              styles.dateInput,
                              { color: theme.colors.text },
                            ]}
                            placeholder="dd/mm/yyyy"
                            placeholderTextColor={theme.colors.mutedText}
                            value={leaveForm.toDate}
                            onChangeText={text =>
                              setLeaveForm({ ...leaveForm, toDate: text })
                            }
                          />
                          <Calendar
                            size={18}
                            color={theme.colors.mutedText}
                            strokeWidth={2}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text
                        style={[styles.label, { color: theme.colors.text }]}
                      >
                        Reason for leave
                      </Text>
                      <TextInput
                        style={[
                          styles.textArea,
                          styles.input,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          },
                        ]}
                        placeholder="Enter reason (optional)"
                        placeholderTextColor={theme.colors.mutedText}
                        value={leaveForm.reason}
                        onChangeText={text =>
                          setLeaveForm({ ...leaveForm, reason: text })
                        }
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </ScrollView>

                  <View
                    style={[
                      styles.modalFooter,
                      { borderTopColor: theme.colors.border },
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.submitButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={handleSubmitLeave}
                    >
                      <Text style={styles.submitButtonText}>
                        Submit Request
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E1',
  },
  calendarTitle: {
    color: '#3C3531',
    fontWeight: '700',
    fontSize: 15,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    color: '#8B7D74',
    fontWeight: '700',
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10,
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 3,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  dayNumber: {
    color: '#4D433E',
    fontSize: 12,
    fontWeight: '700',
  },
  todayCell: {
    backgroundColor: '#FAD9D9',
  },
  presentCell: {
    backgroundColor: '#DDF1EE',
  },
  halfCell: {
    backgroundColor: '#FFE4BC',
  },
  leaveCell: {
    backgroundColor: '#FFD6D6',
  },
  absentCell: {
    backgroundColor: '#F2ECE7',
  },
  presentText: {
    color: '#137B73',
  },
  halfText: {
    color: '#B86100',
  },
  leaveText: {
    color: '#C92A2A',
  },
  absentText: {
    color: '#8B7D74',
  },
  errorText: {
    color: '#E03131',
    marginBottom: 10,
    fontWeight: '600',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F6',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A2A2A',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dropdownButton: {
    backgroundColor: '#F5F5F6',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#2A2A2A',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownArrow: {
    color: '#B59D90',
    fontSize: 14,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 10,
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DE',
  },
  dropdownItemText: {
    color: '#5A514D',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#1CA39A',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputWrapper: {
    backgroundColor: '#F5F5F6',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E3DE',
  },
  submitButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
