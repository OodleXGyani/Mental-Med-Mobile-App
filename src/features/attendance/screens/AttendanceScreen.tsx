import React, { useState } from 'react';
import {
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
import { useAttendance } from '../hooks/useAttendance';

const monthDays = [
  'S',
  'M',
  'T',
  'W',
  'T',
  'F',
  'S',
  ' ',
  ' ',
  ' ',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  ' ',
  ' ',
];

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

export const AttendanceScreen = () => {
  const insets = useSafeAreaInsets();
  const { presentCount } = useAttendance();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [leaveForm, setLeaveForm] = useState<LeaveForm>({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });

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

  return (
    <>
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
        <Text style={styles.title}>Attendance</Text>

        <View style={styles.checkInCard}>
          <Text style={styles.dateText}>Wednesday, 29 April</Text>
          <View style={styles.checkInButton}>
            <Text style={styles.checkInText}>→ Check In</Text>
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
            <View
              key={String(index)}
              style={[styles.dayCell, day === '29' && styles.todayCell]}
            >
              <Text style={[styles.dayText, day === '29' && styles.todayText]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.requestLeaveButton}
          onPress={() => setShowLeaveModal(true)}
        >
          <Text style={styles.requestLeaveText}>Request Leave</Text>
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
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Request Leave</Text>
                    <Pressable onPress={handleCloseModal}>
                      <X size={24} color="#2A2A2A" strokeWidth={2.5} />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalBodyContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Leave Type</Text>
                      <Pressable
                        style={styles.dropdownButton}
                        onPress={() => setShowDropdown(!showDropdown)}
                      >
                        <Text style={styles.dropdownText}>
                          {leaveForm.leaveType
                            ? getLeaveTypeLabel()
                            : 'Select leave type'}
                        </Text>
                        <Text style={styles.dropdownArrow}>∨</Text>
                      </Pressable>

                      {showDropdown && (
                        <View style={styles.dropdownMenu}>
                          {leaveTypes.map(type => (
                            <Pressable
                              key={type.value}
                              style={styles.dropdownItem}
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
                                  leaveForm.leaveType === type.value &&
                                    styles.dropdownItemTextActive,
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
                        <Text style={styles.label}>From</Text>
                        <View style={styles.dateInputWrapper}>
                          <TextInput
                            style={styles.dateInput}
                            placeholder="dd/mm/yyyy"
                            placeholderTextColor="#B59D90"
                            value={leaveForm.fromDate}
                            onChangeText={text =>
                              setLeaveForm({ ...leaveForm, fromDate: text })
                            }
                          />
                          <Calendar size={18} color="#B59D90" strokeWidth={2} />
                        </View>
                      </View>

                      <View
                        style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}
                      >
                        <Text style={styles.label}>To</Text>
                        <View style={styles.dateInputWrapper}>
                          <TextInput
                            style={styles.dateInput}
                            placeholder="dd/mm/yyyy"
                            placeholderTextColor="#B59D90"
                            value={leaveForm.toDate}
                            onChangeText={text =>
                              setLeaveForm({ ...leaveForm, toDate: text })
                            }
                          />
                          <Calendar size={18} color="#B59D90" strokeWidth={2} />
                        </View>
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Reason for leave</Text>
                      <TextInput
                        style={[styles.textArea, styles.input]}
                        placeholder="Enter reason (optional)"
                        placeholderTextColor="#B59D90"
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

                  <View style={styles.modalFooter}>
                    <Pressable
                      style={styles.submitButton}
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
