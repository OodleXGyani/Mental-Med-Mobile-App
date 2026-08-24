import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X, Calendar, ChevronLeft } from 'lucide-react-native';
import {
  attendanceService,
  type LeaveTypeOption,
} from '../services/attendanceService';
import { profileService } from '../../settings/services/profileService';
import { useAppTheme } from '../../../shared/theme';
import { SCREEN_BOTTOM_PADDING } from '../../../shared/constants/layout';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { SettingsStackParamList } from '../../../navigation/types';
import { requestCurrentCoordinates } from '../../../shared/utils/location';

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  typeof STACK_ROUTES.ATTENDANCE_HOME
>;

interface LeaveForm {
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

type LeaveDateField = 'fromDate' | 'toDate';

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const toDateString = (value: Date) => value.toISOString().split('T')[0];

  return {
    fromDate: toDateString(start),
    toDate: toDateString(end),
  };
};

const normalizeLeaveDate = (value: string) => {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return '';
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const formatDisplayDate = (value: string) => {
  if (!value) {
    return '';
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const toDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getPickerDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstDay; index++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
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

export const AttendanceScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [leaveTypesError, setLeaveTypesError] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [activeDateField, setActiveDateField] = useState<LeaveDateField | null>(
    null,
  );
  const [pickerMonth, setPickerMonth] = useState(() => new Date());
  const [leaveForm, setLeaveForm] = useState<LeaveForm>({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeName, setEmployeeName] = useState('Employee');
  const [employeeId, setEmployeeId] = useState('');
  const [company, setCompany] = useState('');
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
  const pickerMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(pickerMonth),
    [pickerMonth],
  );

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const profile = await profileService.fetchUserProfile();
      setEmployeeName(profile.full_name || profile.employee_name);
      setCompany(profile.company || '');
      setCheckinStatus(profile.checkin_status ?? 'OUT');

      // No hardcoded fallback here on purpose -- silently substituting
      // some other employee's real ID would write check-ins/leave/summary
      // data against the wrong HR record. Surface it as an error instead.
      if (!profile.employee) {
        setEmployeeId('');
        setAttendanceSummary({ present: 0, halfDay: 0, leave: 0 });
        setAttendanceCalendar([]);
        setErrorMessage(
          'No employee record is linked to your account. Contact your admin to link one before using Attendance.',
        );
        return;
      }
      setEmployeeId(profile.employee);

      const [summary, calendar] = await Promise.all([
        attendanceService.fetchAttendanceSummary(
          monthRange.fromDate,
          monthRange.toDate,
          profile.employee,
        ),
        attendanceService.fetchAttendanceByDate(
          monthRange.fromDate,
          monthRange.toDate,
          profile.employee,
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

  const loadLeaveTypes = useCallback(async () => {
    setLeaveTypesLoading(true);
    setLeaveTypesError('');
    setLeaveTypes([]);
    setLeaveForm(current => ({ ...current, leaveType: '' }));

    try {
      const nextLeaveTypes = await attendanceService.fetchLeaveTypeDropdown(employeeId);
      setLeaveTypes(nextLeaveTypes);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load leave types.';
      setLeaveTypes([]);
      setLeaveTypesError(message);
      Alert.alert('Unable to load leave types', message);
    } finally {
      setLeaveTypesLoading(false);
    }
  }, [employeeId]);

  const handleOpenLeaveModal = () => {
    setShowLeaveModal(true);
    setShowDropdown(false);
    setActiveDateField(null);
    void loadLeaveTypes();
  };

  const handleSubmitLeave = async () => {
    if (leaveSubmitting) {
      return;
    }

    const fromDate = normalizeLeaveDate(leaveForm.fromDate);
    const toDate = normalizeLeaveDate(leaveForm.toDate);

    if (!leaveForm.leaveType || !fromDate || !toDate) {
      Alert.alert(
        'Missing leave details',
        'Please select a leave type and enter From/To dates as yyyy-mm-dd or dd/mm/yyyy.',
      );
      return;
    }

    if (!employeeId) {
      Alert.alert(
        'No employee record',
        'No employee record is linked to your account. Contact your admin.',
      );
      return;
    }

    setLeaveSubmitting(true);

    try {
      await attendanceService.createLeaveRequest({
        employee: employeeId,
        leave_type: leaveForm.leaveType,
        from_date: fromDate,
        to_date: toDate,
        company,
        description: leaveForm.reason.trim(),
        half_day: 0,
      });

      Alert.alert('Success', 'Leave request submitted.');
      setLeaveForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
      setShowLeaveModal(false);
      setShowDropdown(false);
      await loadAttendance();
    } catch (error) {
      Alert.alert(
        'Unable to submit leave request',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (leaveSubmitting) {
      return;
    }

    setShowLeaveModal(false);
    setShowDropdown(false);
    setActiveDateField(null);
    setLeaveTypesError('');
    setLeaveForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
  };

  const getLeaveTypeLabel = () => {
    const selected = leaveTypes.find(t => t.value === leaveForm.leaveType);
    return selected ? selected.label : 'Leave Type';
  };

  const handleOpenDatePicker = (field: LeaveDateField) => {
    const currentValue = leaveForm[field];
    const parsedDate = currentValue
      ? new Date(`${currentValue}T00:00:00`)
      : null;

    setPickerMonth(
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate
        : new Date(),
    );
    setActiveDateField(field);
  };

  const handleSelectDate = (date: Date) => {
    if (!activeDateField) {
      return;
    }

    setLeaveForm(current => ({
      ...current,
      [activeDateField]: toDateValue(date),
    }));
    setActiveDateField(null);
  };

  const handleChangePickerMonth = (direction: -1 | 1) => {
    setPickerMonth(
      current =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  const handleCheckin = useCallback(async () => {
    if (submitting) {
      return;
    }

    if (!employeeId) {
      Alert.alert(
        'No employee record',
        'No employee record is linked to your account. Contact your admin.',
      );
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
            paddingBottom: Math.max(insets.bottom, 10) + SCREEN_BOTTOM_PADDING,
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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Attendance
          </Text>
          <View style={{ width: 24 }} />
        </View>

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
          onPress={handleOpenLeaveModal}
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
        <View style={styles.modalOverlay}>
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
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Request Leave
                </Text>
                <Pressable onPress={handleCloseModal}>
                  <X size={24} color={theme.colors.text} strokeWidth={2.5} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
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
                    onPress={() => {
                      if (!leaveTypesLoading && leaveTypes.length > 0) {
                        setShowDropdown(!showDropdown);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: theme.colors.text },
                      ]}
                    >
                      {leaveForm.leaveType
                        ? getLeaveTypeLabel()
                        : leaveTypesLoading
                        ? 'Loading leave types...'
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

                  {leaveTypesError ? (
                    <Text
                      style={[styles.errorText, { color: theme.colors.danger }]}
                    >
                      {leaveTypesError}
                    </Text>
                  ) : null}

                  {!leaveTypesLoading &&
                  !leaveTypesError &&
                  leaveTypes.length === 0 ? (
                    <Text
                      style={[
                        styles.errorText,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      No leave types available.
                    </Text>
                  ) : null}

                  {showDropdown && leaveTypes.length > 0 && (
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
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      From
                    </Text>
                    <Pressable
                      style={[
                        styles.dateInputWrapper,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => handleOpenDatePicker('fromDate')}
                    >
                      <Text
                        style={[
                          styles.dateInput,
                          {
                            color: leaveForm.fromDate
                              ? theme.colors.text
                              : theme.colors.mutedText,
                          },
                        ]}
                      >
                        {formatDisplayDate(leaveForm.fromDate) || 'Select date'}
                      </Text>
                      <Calendar
                        size={18}
                        color={theme.colors.mutedText}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>

                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      To
                    </Text>
                    <Pressable
                      style={[
                        styles.dateInputWrapper,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => handleOpenDatePicker('toDate')}
                    >
                      <Text
                        style={[
                          styles.dateInput,
                          {
                            color: leaveForm.toDate
                              ? theme.colors.text
                              : theme.colors.mutedText,
                          },
                        ]}
                      >
                        {formatDisplayDate(leaveForm.toDate) || 'Select date'}
                      </Text>
                      <Calendar
                        size={18}
                        color={theme.colors.mutedText}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>
                </View>

                {activeDateField ? (
                  <View
                    style={[
                      styles.datePickerCard,
                      styles.inlineDatePickerCard,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.datePickerHeader}>
                      <Pressable
                        style={styles.monthButton}
                        onPress={() => handleChangePickerMonth(-1)}
                      >
                        <Text
                          style={[
                            styles.monthButtonText,
                            { color: theme.colors.text },
                          ]}
                        >
                          ‹
                        </Text>
                      </Pressable>
                      <Text
                        style={[
                          styles.datePickerTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        {pickerMonthLabel}
                      </Text>
                      <Pressable
                        style={styles.monthButton}
                        onPress={() => handleChangePickerMonth(1)}
                      >
                        <Text
                          style={[
                            styles.monthButtonText,
                            { color: theme.colors.text },
                          ]}
                        >
                          ›
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.datePickerWeekRow}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <Text
                          key={`${day}-${index}`}
                          style={[
                            styles.datePickerWeekDay,
                            { color: theme.colors.mutedText },
                          ]}
                        >
                          {day}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.datePickerGrid}>
                      {getPickerDays(pickerMonth).map((date, index) => {
                        const value = date ? toDateValue(date) : '';
                        const isSelected = value === leaveForm[activeDateField];

                        return (
                          <Pressable
                            key={`${value}-${index}`}
                            style={[
                              styles.datePickerDay,
                              isSelected && {
                                backgroundColor: theme.colors.primary,
                              },
                            ]}
                            disabled={!date}
                            onPress={() => {
                              if (date) {
                                handleSelectDate(date);
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.datePickerDayText,
                                {
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : theme.colors.text,
                                },
                                !date && { color: 'transparent' },
                              ]}
                            >
                              {date?.getDate() ?? ''}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
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
                    (leaveSubmitting || leaveTypesLoading) && {
                      opacity: 0.7,
                    },
                  ]}
                  onPress={handleSubmitLeave}
                  disabled={leaveSubmitting || leaveTypesLoading}
                >
                  {leaveSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 0,
    flex: 1,
    textAlign: 'center',
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  inlineDatePickerCard: {
    maxWidth: '100%',
    marginBottom: 16,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 30,
    fontWeight: '700',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  datePickerWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  datePickerWeekDay: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  datePickerDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  datePickerDayText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
