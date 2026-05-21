import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Medicine } from '../types';
import {
  SearchableDropdown,
  DropdownOption,
} from '../../../shared/components/SearchableDropdown';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

const toDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (medicine: Omit<Medicine, 'id' | 'status'>) => void;
};

export const QuickAddMedicineModal = ({
  visible,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState({
    name: '',
    genericName: '',
    barcode: '',
    batch: '',
    expiryDate: '',
    rackLocation: '',
    quantity: '',
    minQuantity: '',
    mrp: '',
    purchaseRate: '',
    margin: '',
    gst: '',
    hsnSacCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hsnOptions, setHsnOptions] = useState<DropdownOption[]>([]);
  const [hsnLoading, setHsnLoading] = useState(false);
  const [gstOptions, setGstOptions] = useState<DropdownOption[]>([]);
  const [gstLoading, setGstLoading] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [expiryPickerMonth, setExpiryPickerMonth] = useState(() => new Date());

  useEffect(() => {
    if (visible) {
      loadDropdownOptions();
    }
  }, [visible]);

  const loadDropdownOptions = async () => {
    await Promise.all([loadHsnOptions(), loadGstOptions()]);
  };

  const loadHsnOptions = useCallback(async () => {
    setHsnLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}api/method/frappe.desk.search.search_link?doctype=GST+HSN+Code&txt=&filters=%7B%7D`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
      );
      const data = await response.json();
      if (data.message && Array.isArray(data.message)) {
        setHsnOptions(
          data.message.map((item: any) => ({
            value: item.value,
            description: item.description,
          })),
        );
      }
    } catch (error) {
      console.error('Failed to load HSN options:', error);
      setHsnOptions([]);
    } finally {
      setHsnLoading(false);
    }
  }, []);

  const loadGstOptions = useCallback(async () => {
    setGstLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}api/method/frappe.desk.search.search_link?doctype=Item+Tax+Template&txt=&filters=%7B%7D`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
      );
      const data = await response.json();
      if (data.message && Array.isArray(data.message)) {
        setGstOptions(
          data.message.map((item: any) => ({
            value: item.value,
            description: item.description,
          })),
        );
      }
    } catch (error) {
      console.error('Failed to load GST options:', error);
      setGstOptions([]);
    } finally {
      setGstLoading(false);
    }
  }, []);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Medicine name is required';
    if (!form.batch.trim()) newErrors.batch = 'Batch no is required';
    if (!form.expiryDate.trim())
      newErrors.expiryDate = 'Expiry date is required';
    if (!form.rackLocation.trim())
      newErrors.rackLocation = 'Rack location is required';
    if (!form.quantity) newErrors.quantity = 'Quantity is required';
    if (!form.mrp) newErrors.mrp = 'MRP is required';
    if (!form.purchaseRate)
      newErrors.purchaseRate = 'Purchase rate is required';
    if (!form.hsnSacCode) newErrors.hsnSacCode = 'HSN/SAC Code is required';
    if (!form.gst) newErrors.gst = 'GST is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const medicine: Omit<Medicine, 'id' | 'status'> = {
      name: form.name.trim(),
      genericName: form.genericName.trim(),
      barcode: form.barcode.trim(),
      batch: form.batch.trim(),
      expiryDate: form.expiryDate.trim(),
      rackLocation: form.rackLocation.trim(),
      quantity: parseInt(form.quantity),
      minQuantity: parseInt(form.minQuantity) || 20,
      mrp: parseInt(form.mrp),
      purchaseRate: parseInt(form.purchaseRate),
      margin: parseFloat(form.margin) || 0,
      gst: form.gst,
      hsnSacCode: form.hsnSacCode,
    };

    onSubmit(medicine);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setForm({
      name: '',
      genericName: '',
      barcode: '',
      batch: '',
      expiryDate: '',
      rackLocation: '',
      quantity: '',
      minQuantity: '',
      mrp: '',
      purchaseRate: '',
      margin: '',
      gst: '',
      hsnSacCode: '',
    });
    setErrors({});
    setShowExpiryDatePicker(false);
    setExpiryPickerMonth(new Date());
  };

  const handleOpenExpiryDatePicker = () => {
    const parsedDate = form.expiryDate
      ? new Date(`${form.expiryDate}T00:00:00`)
      : null;

    setExpiryPickerMonth(
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate
        : new Date(),
    );
    setShowExpiryDatePicker(true);
    if (errors.expiryDate) {
      setErrors({ ...errors, expiryDate: '' });
    }
  };

  const handleSelectExpiryDate = (date: Date) => {
    setForm({ ...form, expiryDate: toDateValue(date) });
    setShowExpiryDatePicker(false);
  };

  const handleChangeExpiryMonth = (direction: -1 | 1) => {
    setExpiryPickerMonth(
      current =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  const expiryPickerMonthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(expiryPickerMonth);

  const expiryPickerDays = getPickerDays(expiryPickerMonth);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Quick Add Medicine</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#2A2A2A" strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Medicine Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter medicine name"
                  placeholderTextColor="#B8A89C"
                  value={form.name}
                  onChangeText={value => {
                    setForm({ ...form, name: value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
                {errors.name && <Text style={styles.error}>{errors.name}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Generic Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter generic name"
                  placeholderTextColor="#B8A89C"
                  value={form.genericName}
                  onChangeText={value =>
                    setForm({ ...form, genericName: value })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Barcode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter or scan barcode"
                  placeholderTextColor="#B8A89C"
                  value={form.barcode}
                  onChangeText={value => setForm({ ...form, barcode: value })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Batch No *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. B2025-001"
                  placeholderTextColor="#B8A89C"
                  value={form.batch}
                  onChangeText={value => {
                    setForm({ ...form, batch: value });
                    if (errors.batch) setErrors({ ...errors, batch: '' });
                  }}
                />
                {errors.batch && (
                  <Text style={styles.error}>{errors.batch}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiry Date (YYYY-MM-DD) *</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={handleOpenExpiryDatePicker}
                >
                  <Text
                    style={[
                      styles.dateInputText,
                      !form.expiryDate ? styles.datePlaceholder : null,
                    ]}
                  >
                    {form.expiryDate
                      ? formatDisplayDate(form.expiryDate)
                      : 'Select expiry date'}
                  </Text>
                  <Calendar size={18} color="#A98F81" strokeWidth={2} />
                </Pressable>
                {errors.expiryDate && (
                  <Text style={styles.error}>{errors.expiryDate}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rack Location *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. A1-01"
                  placeholderTextColor="#B8A89C"
                  value={form.rackLocation}
                  onChangeText={value => {
                    setForm({ ...form, rackLocation: value });
                    if (errors.rackLocation)
                      setErrors({ ...errors, rackLocation: '' });
                  }}
                />
                {errors.rackLocation && (
                  <Text style={styles.error}>{errors.rackLocation}</Text>
                )}
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#B8A89C"
                    keyboardType="number-pad"
                    value={form.quantity}
                    onChangeText={value => {
                      setForm({ ...form, quantity: value });
                      if (errors.quantity)
                        setErrors({ ...errors, quantity: '' });
                    }}
                  />
                  {errors.quantity && (
                    <Text style={styles.error}>{errors.quantity}</Text>
                  )}
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Min Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="20"
                    placeholderTextColor="#B8A89C"
                    keyboardType="number-pad"
                    value={form.minQuantity}
                    onChangeText={value =>
                      setForm({ ...form, minQuantity: value })
                    }
                  />
                </View>
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>MRP *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#B8A89C"
                    keyboardType="number-pad"
                    value={form.mrp}
                    onChangeText={value => {
                      setForm({ ...form, mrp: value });
                      if (errors.mrp) setErrors({ ...errors, mrp: '' });
                    }}
                  />
                  {errors.mrp && <Text style={styles.error}>{errors.mrp}</Text>}
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Purchase Rate *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#B8A89C"
                    keyboardType="number-pad"
                    value={form.purchaseRate}
                    onChangeText={value => {
                      setForm({ ...form, purchaseRate: value });
                      if (errors.purchaseRate)
                        setErrors({ ...errors, purchaseRate: '' });
                    }}
                  />
                  {errors.purchaseRate && (
                    <Text style={styles.error}>{errors.purchaseRate}</Text>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <SearchableDropdown
                  label="HSN/SAC Code *"
                  value={form.hsnSacCode}
                  placeholder="Select HSN/SAC Code"
                  options={hsnOptions}
                  loading={hsnLoading}
                  error={errors.hsnSacCode}
                  onSelect={option => {
                    setForm({ ...form, hsnSacCode: option.value });
                    if (errors.hsnSacCode)
                      setErrors({ ...errors, hsnSacCode: '' });
                  }}
                  onClearError={() => {
                    if (errors.hsnSacCode)
                      setErrors({ ...errors, hsnSacCode: '' });
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <SearchableDropdown
                  label="GST *"
                  value={form.gst}
                  placeholder="Select GST"
                  options={gstOptions}
                  loading={gstLoading}
                  error={errors.gst}
                  onSelect={option => {
                    setForm({ ...form, gst: option.value });
                    if (errors.gst) setErrors({ ...errors, gst: '' });
                  }}
                  onClearError={() => {
                    if (errors.gst) setErrors({ ...errors, gst: '' });
                  }}
                />
              </View>

              <View style={styles.rowGroupLast}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Margin %</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#B8A89C"
                    keyboardType="decimal-pad"
                    value={form.margin}
                    onChangeText={value => setForm({ ...form, margin: value })}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExpiryDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpiryDatePicker(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowExpiryDatePicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerModal}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Expiry Date</Text>
                  <Pressable
                    onPress={() => setShowExpiryDatePicker(false)}
                    hitSlop={8}
                  >
                    <X size={20} color="#2A2A2A" strokeWidth={2.5} />
                  </Pressable>
                </View>

                <View style={styles.monthSwitcher}>
                  <Pressable
                    style={styles.monthNavButton}
                    onPress={() => handleChangeExpiryMonth(-1)}
                  >
                    <ChevronLeft size={18} color="#2A2A2A" strokeWidth={2.2} />
                  </Pressable>
                  <Text style={styles.monthLabel}>
                    {expiryPickerMonthLabel}
                  </Text>
                  <Pressable
                    style={styles.monthNavButton}
                    onPress={() => handleChangeExpiryMonth(1)}
                  >
                    <ChevronRight size={18} color="#2A2A2A" strokeWidth={2.2} />
                  </Pressable>
                </View>

                <View style={styles.weekdayRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    day => (
                      <Text key={day} style={styles.weekdayText}>
                        {day}
                      </Text>
                    ),
                  )}
                </View>

                <View style={styles.daysGrid}>
                  {expiryPickerDays.map((day, index) => {
                    if (!day) {
                      return (
                        <View key={`blank-${index}`} style={styles.dayCell} />
                      );
                    }

                    const dateValue = toDateValue(day);
                    const isSelected = form.expiryDate === dateValue;

                    return (
                      <Pressable
                        key={dateValue}
                        style={[
                          styles.dayCell,
                          isSelected ? styles.dayCellSelected : null,
                        ]}
                        onPress={() => handleSelectExpiryDate(day)}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            isSelected ? styles.dayCellTextSelected : null,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: '85%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },
  formGroup: {
    marginBottom: 16,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rowGroupLast: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4C4B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: '#2A2A2A',
    backgroundColor: '#FAFAF8',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D4C4B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: 13,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  datePlaceholder: {
    color: '#B8A89C',
    fontWeight: '400',
  },
  error: {
    fontSize: 11,
    color: '#E74C3C',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#1CA39A',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F1EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayText: {
    width: '14.2%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#8F7D72',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayCellSelected: {
    backgroundColor: '#1CA39A',
  },
  dayCellText: {
    fontSize: 13,
    color: '#2A2A2A',
    fontWeight: '600',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
  },
});
