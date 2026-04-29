import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Order } from './OrderCard';

type Props = {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onAccept: (order: Order) => void;
  onReject: (order: Order) => void;
};

export const OrderDetailModal = ({
  order,
  visible,
  onClose,
  onAccept,
  onReject,
}: Props) => {
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{order.id}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color="#3B2E2B" strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalLabel}>
              <Text style={{ fontWeight: '800' }}>Customer:</Text>{' '}
              {order.customer}
            </Text>
            {order.phone ? (
              <Text style={styles.modalLabel}>
                <Text style={{ fontWeight: '800' }}>Phone:</Text> {order.phone}
              </Text>
            ) : null}
            {order.source ? (
              <Text style={styles.modalLabel}>
                <Text style={{ fontWeight: '800' }}>Source:</Text>{' '}
                {order.source}
              </Text>
            ) : null}

            <Text style={[styles.modalSectionTitle, { marginTop: 10 }]}>
              Items:
            </Text>
            {order.items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>{it.name}</Text>
                <Text style={styles.itemQty}>×{it.qty}</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{order.amount}</Text>
            </View>

            {/* action buttons depending on status */}
            {order.status === 'new' ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => onReject(order)}
                >
                  <Text
                    style={[styles.actionButtonText, styles.rejectButtonText]}
                  >
                    Reject
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onAccept(order)}
                >
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onAccept(order)}
              >
                <Text style={styles.actionButtonText}>
                  {order.status === 'accepted' && 'Start Processing'}
                  {order.status === 'processing' && 'Mark Ready'}
                  {order.status === 'ready' && 'Dispatch'}
                  {order.status === 'dispatched' && 'Mark Delivered'}
                  {order.status === 'delivered' && 'Ok'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#252628',
  },
  modalBody: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 12,
    color: '#3B2E2B',
    lineHeight: 16,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#252628',
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },
  itemText: {
    fontSize: 11,
    color: '#3B2E2B',
    flex: 1,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A7A6F',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#252628',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E8066',
  },
  actionButton: {
    backgroundColor: '#1E8066',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  rejectButtonText: {
    color: '#FFFFFF',
  },
});
