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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X, Calendar, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react-native';
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
  halfDay: boolean;
}

type LeaveDateField = 'fromDate' | 'toDate';

const toDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getMonthRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    fromDate: toDateValue(start),
    toDate: toDateValue(end),
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

  const parts = value.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(parsed);
    }
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

const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${mins} ${ampm}`;
  }
  return timeStr;
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

interface CalendarDayItem {
  date: string | null;
  dayNumber: number | null;
  status: string | null;
  inTime: string | null;
  outTime: string | null;
  workingHours: number;
  isToday: boolean;
  isFuture: boolean;
  isWeekend: boolean;
}

const generateCalendarDays = (
  attendanceData: Array<{
    attendance_date: string;
    status: string;
    in_time: string | null;
    out_time: string | null;
    working_hours: number;
  }>,
  calendarDate: Date,
): CalendarDayItem[] => {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday

  const todayStr = toDateValue(new Date());
  const todayDate = new Date();
  todayDate.setHours(23, 59, 59, 999);

  // Quick lookup map
  const attendanceMap = new Map(
    (Array.isArray(attendanceData) ? attendanceData : []).map(day => [
      day.attendance_date,
      day,
    ]),
  );

  const calendarDays: CalendarDayItem[] = [];

  // Add empty filler cells before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push({
      date: null,
      dayNumber: null,
      status: null,
      inTime: null,
      outTime: null,
      workingHours: 0,
      isToday: false,
      isFuture: false,
      isWeekend: false,
    });
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dateString = toDateValue(dayDate);
    const attendance = attendanceMap.get(dateString);
    const isToday = dateString === todayStr;
    const isFuture = dayDate > todayDate;
    const isWeekend = dayDate.getDay() === 0;

    let status = attendance?.status || null;
    if (!status && !isFuture) {
      status = isWeekend ? 'Holiday' : 'Absent';
    }

    calendarDays.push({
      date: dateString,
      dayNumber: day,
      status,
      inTime: attendance?.in_time || null,
      outTime: attendance?.out_time || null,
      workingHours: attendance?.working_hours || 0,
      isToday,
      isFuture,
      isWeekend,
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
    halfDay: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const [activeCalendarDate, setActiveCalendarDate] = useState<Date>(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(() => toDateValue(new Date()));

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(activeCalendarDate),
    [activeCalendarDate],
  );
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      activeCalendarDate.getFullYear() === now.getFullYear() &&
      activeCalendarDate.getMonth() === now.getMonth()
    );
  }, [activeCalendarDate]);

  const pickerMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(pickerMonth),
    [pickerMonth],
  );

  const selectedDayDetail = useMemo(() => {
    if (!selectedCalendarDay) return null;
    const found = attendanceCalendar.find(
      item => item.attendance_date === selectedCalendarDay,
    );
    if (found) {
      return {
        date: found.attendance_date,
        status: found.status || 'Present',
        in_time: found.in_time,
        out_time: found.out_time,
        working_hours: found.working_hours || 0,
      };
    }

    const parts = selectedCalendarDay.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dayDate = new Date(y, m, d);
      const isWeekend = dayDate.getDay() === 0;
      const isFuture = dayDate > new Date();

      return {
        date: selectedCalendarDay,
        status: isFuture ? 'Upcoming' : isWeekend ? 'Holiday' : 'Absent',
        in_time: null,
        out_time: null,
        working_hours: 0,
      };
    }
    return null;
  }, [attendanceCalendar, selectedCalendarDay]);

  const loadAttendance = useCallback(
    async (isRefresh = false, targetDate = activeCalendarDate) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage('');

      try {
        let currentEmp = employeeId;
        try {
          const profile = await profileService.fetchUserProfile();
          setEmployeeName(profile.full_name || profile.employee_name || 'Employee');
          setCompany(profile.company || '');
          setCheckinStatus(profile.checkin_status ?? 'OUT');
          if (profile.employee) {
            currentEmp = profile.employee;
            setEmployeeId(profile.employee);
          }
        } catch {
          // Graceful fallback if profile is delayed
        }

        const range = getMonthRange(targetDate);

        if (currentEmp) {
          const [summary, calendar] = await Promise.all([
            attendanceService.fetchAttendanceSummary(
              range.fromDate,
              range.toDate,
              currentEmp,
            ),
            attendanceService.fetchAttendanceByDate(
              range.fromDate,
              range.toDate,
              currentEmp,
            ),
          ]);

          setAttendanceSummary({
            present: summary?.summary?.Present ?? 0,
            halfDay: summary?.summary?.['Half Day'] ?? 0,
            leave: summary?.summary?.Leave ?? 0,
          });
          setAttendanceCalendar(Array.isArray(calendar) ? calendar : []);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load attendance.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCalendarDate, employeeId],
  );

  useEffect(() => {
    loadAttendance(false, activeCalendarDate);
  }, [activeCalendarDate, loadAttendance]);

  const loadLeaveTypes = useCallback(async () => {
    setLeaveTypesLoading(true);
    setLeaveTypesError('');
    setLeaveTypes([]);
    setLeaveForm(current => ({ ...current, leaveType: '' }));

    try {
      const nextLeaveTypes = await attendanceService.fetchLeaveTypeDropdown(
        employeeId || undefined,
      );
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
    loadLeaveTypes();
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
        'Please select a leave type and enter From/To dates.',
      );
      return;
    }

    if (fromDate > toDate) {
      Alert.alert(
        'Invalid Date Range',
        'The "From" date cannot be after the "To" date.',
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
        half_day: leaveForm.halfDay ? 1 : 0,
      });

      Alert.alert('Success', 'Leave request submitted successfully.');
      setLeaveForm({
        leaveType: '',
        fromDate: '',
        toDate: '',
        reason: '',
        halfDay: false,
      });
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
    setLeaveForm({
      leaveType: '',
      fromDate: '',
      toDate: '',
      reason: '',
      halfDay: false,
    });
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

      Alert.alert(
        'Success',
        `Attendance marked as ${
          nextLogType === 'IN' ? 'Checked IN' : 'Checked OUT'
        } successfully.`,
      );
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
  }, [checkinStatus, employeeId, loadAttendance, submitting]);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              loadAttendance(true);
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
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
          <View style={styles.headerSpacer} />
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
            style={styles.loadingIndicator}
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

        {/* Modern Interactive Calendar Card */}
        <View
          style={[
            styles.calendarContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Calendar Navigation Header */}
          <View
            style={[
              styles.calendarNavHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.calendarNavTitleRow}>
              <Calendar size={18} color={theme.colors.primary} strokeWidth={2.2} />
              <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>
                {monthLabel}
              </Text>
              {!isCurrentMonth ? (
                <Pressable
                  style={[
                    styles.todayJumpPill,
                    theme.dark ? styles.todayJumpPillDark : styles.todayJumpPillLight,
                    { borderColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    const now = new Date();
                    setActiveCalendarDate(now);
                    setSelectedCalendarDay(toDateValue(now));
                  }}
                >
                  <Text style={[styles.todayJumpText, { color: theme.colors.primary }]}>
                    Today
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.calendarNavArrows}>
              <Pressable
                style={[
                  styles.navArrowBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setActiveCalendarDate(
                    prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  );
                }}
                hitSlop={8}
              >
                <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                style={[
                  styles.navArrowBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setActiveCalendarDate(
                    prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  );
                }}
                hitSlop={8}
              >
                <ChevronRight size={18} color={theme.colors.text} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Weekday Row */}
          <View style={styles.dayHeaderRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <View key={day} style={styles.dayHeader}>
                <Text
                  style={[
                    styles.dayHeaderText,
                    index === 0
                      ? [styles.sundayHeaderText, { color: theme.colors.danger }]
                      : { color: theme.colors.mutedText },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays(attendanceCalendar, activeCalendarDate).map((dayItem, index) => {
              if (dayItem.date === null || dayItem.dayNumber === null) {
                return (
                  <View key={`empty-${index}`} style={styles.dayCellWrapper}>
                    <View style={styles.emptyDayCell} />
                  </View>
                );
              }

              const isSelected = selectedCalendarDay === dayItem.date;
              const isPresent = dayItem.status === 'Present';
              const isHalfDay = dayItem.status === 'Half Day';
              const isLeave = dayItem.status === 'Leave' || dayItem.status === 'On Leave';
              const isAbsent = !dayItem.isFuture && !isPresent && !isHalfDay && !isLeave && !dayItem.isWeekend;

              return (
                <View key={dayItem.date} style={styles.dayCellWrapper}>
                  <Pressable
                    style={[
                      styles.dayCell,
                      { backgroundColor: theme.colors.background },
                      // Status Backgrounds
                      isPresent && (theme.dark ? styles.cellPresentDark : styles.cellPresentLight),
                      isHalfDay && (theme.dark ? styles.cellHalfDark : styles.cellHalfLight),
                      isLeave && (theme.dark ? styles.cellLeaveDark : styles.cellLeaveLight),
                      isAbsent && (theme.dark ? styles.cellAbsentDark : styles.cellAbsentLight),
                      // Today Ring
                      dayItem.isToday && [styles.cellTodayRing, { borderColor: theme.colors.primary }],
                      // Selected Ring
                      isSelected && [styles.cellSelectedRing, { borderColor: theme.colors.text }],
                    ]}
                    onPress={() => setSelectedCalendarDay(dayItem.date!)}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: theme.colors.text },
                        isPresent && [styles.dayNumberBold, { color: theme.colors.success }],
                        isHalfDay && [styles.dayNumberBold, { color: theme.colors.warning }],
                        isLeave && [styles.dayNumberBold, { color: theme.colors.danger }],
                        dayItem.isFuture && [styles.dayNumberFuture, { color: theme.colors.mutedText }],
                        dayItem.isToday && styles.dayNumberToday,
                      ]}
                    >
                      {dayItem.dayNumber}
                    </Text>

                    {/* Micro Status Dot */}
                    <View style={styles.dayMicroDotContainer}>
                      {isPresent ? <View style={[styles.dayMicroDot, { backgroundColor: theme.colors.success }]} /> : null}
                      {isHalfDay ? <View style={[styles.dayMicroDot, { backgroundColor: theme.colors.warning }]} /> : null}
                      {isLeave ? <View style={[styles.dayMicroDot, { backgroundColor: theme.colors.danger }]} /> : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Attendance Legend Bar */}
          <View style={[styles.calendarLegendBar, { borderTopColor: theme.colors.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Half Day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
              <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Leave</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, theme.dark ? styles.legendDotAbsentDark : styles.legendDotAbsentLight]} />
              <Text style={[styles.legendText, { color: theme.colors.mutedText }]}>Absent/Off</Text>
            </View>
          </View>

          {/* Selected Day Info Chip / Drawer */}
          {selectedDayDetail ? (
            <View
              style={[
                styles.selectedDayCard,
                theme.dark ? styles.selectedDayCardDark : styles.selectedDayCardLight,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View style={styles.selectedDayHeader}>
                <View style={styles.selectedDayHeaderLeft}>
                  <Clock size={15} color={theme.colors.primary} strokeWidth={2.2} />
                  <Text style={[styles.selectedDayDate, { color: theme.colors.text }]}>
                    {formatDisplayDate(selectedDayDetail.date)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.selectedDayBadge,
                    selectedDayDetail.status === 'Present' && (theme.dark ? styles.cellPresentDark : styles.cellPresentLight),
                    selectedDayDetail.status === 'Half Day' && (theme.dark ? styles.cellHalfDark : styles.cellHalfLight),
                    (selectedDayDetail.status === 'Leave' || selectedDayDetail.status === 'On Leave') && (theme.dark ? styles.cellLeaveDark : styles.cellLeaveLight),
                    selectedDayDetail.status === 'Absent' && (theme.dark ? styles.cellAbsentDark : styles.cellAbsentLight),
                  ]}
                >
                  <Text
                    style={[
                      styles.selectedDayBadgeText,
                      selectedDayDetail.status === 'Present' && { color: theme.colors.success },
                      selectedDayDetail.status === 'Half Day' && { color: theme.colors.warning },
                      (selectedDayDetail.status === 'Leave' || selectedDayDetail.status === 'On Leave') && { color: theme.colors.danger },
                      selectedDayDetail.status === 'Absent' && { color: theme.colors.mutedText },
                    ]}
                  >
                    {selectedDayDetail.status}
                  </Text>
                </View>
              </View>

              <View style={styles.selectedDayDetailsRow}>
                <View style={styles.selectedDayDetailItem}>
                  <Text style={[styles.detailItemLabel, { color: theme.colors.mutedText }]}>In Time</Text>
                  <Text style={[styles.detailItemValue, { color: theme.colors.text }]}>
                    {formatTime(selectedDayDetail.in_time)}
                  </Text>
                </View>
                <View style={[styles.selectedDayDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.selectedDayDetailItem}>
                  <Text style={[styles.detailItemLabel, { color: theme.colors.mutedText }]}>Out Time</Text>
                  <Text style={[styles.detailItemValue, { color: theme.colors.text }]}>
                    {formatTime(selectedDayDetail.out_time)}
                  </Text>
                </View>
                <View style={[styles.selectedDayDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.selectedDayDetailItem}>
                  <Text style={[styles.detailItemLabel, { color: theme.colors.mutedText }]}>Working Hrs</Text>
                  <Text style={[styles.detailItemValue, { color: theme.colors.text }]}>
                    {selectedDayDetail.working_hours > 0 ? `${selectedDayDetail.working_hours} hrs` : '--'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
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
                  <View style={[styles.formGroup, styles.fromGroupWrapper]}>
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

                  <View style={[styles.formGroup, styles.toGroupWrapper]}>
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
                                { color: theme.colors.text },
                                isSelected && styles.datePickerDayTextSelected,
                                !date && styles.datePickerDayTextHidden,
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

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() =>
                    setLeaveForm(prev => ({ ...prev, halfDay: !prev.halfDay }))
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: leaveForm.halfDay
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                      leaveForm.halfDay && [
                        styles.checkboxSelected,
                        { backgroundColor: theme.colors.primary },
                      ],
                    ]}
                  >
                    {leaveForm.halfDay ? (
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text
                    style={[styles.checkboxLabel, { color: theme.colors.text }]}
                  >
                    Half Day Leave
                  </Text>
                </Pressable>

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
                    (leaveSubmitting || leaveTypesLoading) && styles.buttonDisabledOpacity,
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  calendarNavTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  todayJumpPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayJumpPillDark: {
    backgroundColor: '#163330',
  },
  todayJumpPillLight: {
    backgroundColor: '#E6F7F2',
  },
  todayJumpText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calendarNavArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    fontWeight: '700',
    fontSize: 11.5,
  },
  sundayHeaderText: {
    fontWeight: '800',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  dayCellWrapper: {
    width: '14.285%',
    padding: 3,
  },
  dayCell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  emptyDayCell: {
    aspectRatio: 1,
    backgroundColor: 'transparent',
  },
  cellPresentDark: {
    backgroundColor: '#163330',
  },
  cellPresentLight: {
    backgroundColor: '#E6F7F2',
  },
  cellHalfDark: {
    backgroundColor: '#382914',
  },
  cellHalfLight: {
    backgroundColor: '#FFF4E5',
  },
  cellLeaveDark: {
    backgroundColor: '#381919',
  },
  cellLeaveLight: {
    backgroundColor: '#FEECEC',
  },
  cellAbsentDark: {
    backgroundColor: '#26211D',
  },
  cellAbsentLight: {
    backgroundColor: '#F2ECE7',
  },
  cellTodayRing: {
    borderWidth: 1.5,
  },
  cellSelectedRing: {
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  dayNumberBold: {
    fontWeight: '800',
  },
  dayNumberToday: {
    fontWeight: '900',
  },
  dayNumberFuture: {
    opacity: 0.5,
  },
  dayMicroDotContainer: {
    position: 'absolute',
    bottom: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dayMicroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarLegendBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotAbsentDark: {
    backgroundColor: '#4A403A',
  },
  legendDotAbsentLight: {
    backgroundColor: '#CCC3BD',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedDayCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  selectedDayCardDark: {
    backgroundColor: '#1E1B18',
  },
  selectedDayCardLight: {
    backgroundColor: '#F9F7F5',
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedDayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedDayDate: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  selectedDayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedDayBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  selectedDayDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  selectedDayDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailItemLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailItemValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedDayDivider: {
    width: 1,
    height: 22,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  datePickerCard: {
    width: '100%',
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
  headerSpacer: {
    width: 24,
  },
  loadingIndicator: {
    marginBottom: 12,
  },
  fromGroupWrapper: {
    flex: 1,
    marginRight: 8,
  },
  toGroupWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  datePickerDayTextSelected: {
    color: '#FFFFFF',
  },
  datePickerDayTextHidden: {
    color: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#1CA39A',
  },
  buttonDisabledOpacity: {
    opacity: 0.7,
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
