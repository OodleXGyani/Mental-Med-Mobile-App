import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  medicineName: string;
  currentStock: number;
  onClose: () => void;
  onSubmit: (quantity: number, reason: string) => void;
};

export const RemoveStockModal = ({
  visible,
  medicineName,
  currentStock,
  onClose,
  onSubmit,
}: Props) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!quantity) newErrors.quantity = 'Quantity is required';
    else if (parseInt(quantity) <= 0)
      newErrors.quantity = 'Quantity must be greater than 0';
    else if (parseInt(quantity) > currentStock)
      newErrors.quantity = `Cannot remove more than ${currentStock} units`;

    if (!reason.trim()) newErrors.reason = 'Reason is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(parseInt(quantity), reason.trim());
    setQuantity('');
    setReason('');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Remove Stock – {medicineName}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#2A2A2A" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.stockInfo}>Current Stock: {currentStock}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                placeholderTextColor="#B8A89C"
                keyboardType="number-pad"
                value={quantity}
                onChangeText={value => {
                  setQuantity(value);
                  if (errors.quantity) setErrors({ ...errors, quantity: '' });
                }}
              />
              {errors.quantity && (
                <Text style={styles.error}>{errors.quantity}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Reason * (e.g. Purchase, Damage, Expiry n...)
              </Text>
              <TextInput
                style={[styles.input, styles.reasonInput]}
                placeholder="Enter reason"
                placeholderTextColor="#B8A89C"
                multiline
                maxLength={100}
                value={reason}
                onChangeText={value => {
                  setReason(value);
                  if (errors.reason) setErrors({ ...errors, reason: '' });
                }}
              />
              {errors.reason && (
                <Text style={styles.error}>{errors.reason}</Text>
              )}
              <Text style={styles.charCount}>{reason.length}/100</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setQuantity('');
                setReason('');
                setErrors({});
                onClose();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.removeButtonText}>Remove Stock</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stockInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 14,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4C4B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2A2A2A',
    backgroundColor: '#FAFAF8',
  },
  reasonInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  charCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
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
    paddingVertical: 12,
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
  removeButton: {
    backgroundColor: '#D32F2F',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
