import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Medicine } from '../types';

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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      gst: parseInt(form.gst) || 12,
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
    });
    setErrors({});
  };

  return (
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
                onChangeText={value => setForm({ ...form, genericName: value })}
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
              {errors.batch && <Text style={styles.error}>{errors.batch}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expiry Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-12-31"
                placeholderTextColor="#B8A89C"
                value={form.expiryDate}
                onChangeText={value => {
                  setForm({ ...form, expiryDate: value });
                  if (errors.expiryDate)
                    setErrors({ ...errors, expiryDate: '' });
                }}
              />
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
                    if (errors.quantity) setErrors({ ...errors, quantity: '' });
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

            <View style={styles.rowGroup}>
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

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>GST %</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  placeholderTextColor="#B8A89C"
                  keyboardType="number-pad"
                  value={form.gst}
                  onChangeText={value => setForm({ ...form, gst: value })}
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
});
