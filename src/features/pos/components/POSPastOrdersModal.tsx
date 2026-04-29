import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Customer } from '../types';

type Props = {
  visible: boolean;
  selectedCustomer: Customer | null;
  onClose: () => void;
};

export const POSPastOrdersModal = ({ visible, selectedCustomer, onClose }: Props) => {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{`${selectedCustomer?.name || 'Customer'} - Past Orders`}</Text>
            <Pressable onPress={onClose}>
              <X size={16} color="#6E635C" />
            </Pressable>
          </View>

          <View style={styles.pastOrderCard}>
            <View style={styles.pastOrderHeader}>
              <Text style={styles.pastOrderId}>INV-2025-001</Text>
              <Text style={styles.pastOrderDate}>2026-04-10</Text>
            </View>
            <Text style={styles.pastOrderItem}>Paracetamol 500mg</Text>
            <Text style={styles.pastOrderItem}>Cetirizine 10mg</Text>
            <Text style={styles.pastOrderAmount}>Rs 123.20</Text>
          </View>

          <View style={styles.pastOrderCard}>
            <View style={styles.pastOrderHeader}>
              <Text style={styles.pastOrderId}>INV-2025-005</Text>
              <Text style={styles.pastOrderDate}>2026-03-28</Text>
            </View>
            <Text style={styles.pastOrderItem}>Amoxicillin 250mg</Text>
            <Text style={styles.pastOrderAmount}>Rs 95.20</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 14,
    maxHeight: '74%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    color: '#403631',
    fontWeight: '800',
    fontSize: 20,
  },
  pastOrderCard: {
    borderWidth: 1,
    borderColor: '#E5DFDA',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  pastOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  pastOrderId: {
    color: '#564A43',
    fontSize: 11,
    fontWeight: '700',
  },
  pastOrderDate: {
    color: '#B59F93',
    fontSize: 10,
  },
  pastOrderItem: {
    color: '#5E5148',
    fontSize: 11,
    marginBottom: 4,
  },
  pastOrderAmount: {
    color: '#4A3E37',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
  },
});
