import React from 'react';
import {
  ActivityIndicator,
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
import { orderActionFlow } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onAccept: (order: Order) => void;
  onReject: (order: Order) => void;
  isLoading?: boolean;
};

export const OrderDetailModal = ({
  order,
  visible,
  onClose,
  onAccept,
  onReject,
  isLoading = false,
}: Props) => {
  const theme = useAppTheme();
  if (!order) return null;

  const actionItems = orderActionFlow[order.status] ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {order.id}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color={theme.colors.mutedText} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
              <Text style={{ fontWeight: '800' }}>Customer:</Text>{' '}
              {order.customer}
            </Text>
            {order.phone ? (
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                <Text style={{ fontWeight: '800' }}>Phone:</Text> {order.phone}
              </Text>
            ) : null}
            {order.source ? (
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                <Text style={{ fontWeight: '800' }}>Source:</Text>{' '}
                {order.source}
              </Text>
            ) : null}

            <Text
              style={[
                styles.modalSectionTitle,
                { marginTop: 10, color: theme.colors.text },
              ]}
            >
              Items:
            </Text>
            {order.items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                  {it.name}
                </Text>
                <Text
                  style={[styles.itemQty, { color: theme.colors.mutedText }]}
                >
                  ×{it.qty}
                </Text>
              </View>
            ))}

            <View
              style={[styles.totalRow, { borderTopColor: theme.colors.border }]}
            >
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                Total
              </Text>
              <Text
                style={[styles.totalAmount, { color: theme.colors.primary }]}
              >
                ₹{order.amount}
              </Text>
            </View>

            {/* action buttons depending on status */}
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text
                  style={[styles.loadingText, { color: theme.colors.primary }]}
                >
                  Updating order...
                </Text>
              </View>
            ) : actionItems.length === 0 ? null : actionItems.length === 2 ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => onReject(order)}
                >
                  <Text
                    style={[styles.actionButtonText, styles.rejectButtonText]}
                  >
                    {actionItems[1].actionInput}
                  </Text>
                  {/* <Text style={styles.actionStateText}>
                    Requires {actionItems[1].requiredCurrentState}
                  </Text> */}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => onAccept(order)}
                >
                  <Text style={styles.actionButtonText}>
                    {actionItems[0].actionInput}
                  </Text>
                  {/* <Text style={styles.actionStateText}>
                    Requires {actionItems[0].requiredCurrentState}
                  </Text> */}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => onAccept(order)}
              >
                <Text style={styles.actionButtonText}>
                  {actionItems[0].actionInput}
                </Text>
                {/* <Text style={styles.actionStateText}>
                  Requires {actionItems[0].requiredCurrentState}
                </Text> */}
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
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#1E8066',
    fontWeight: '600',
  },
  actionStateText: {
    marginTop: 4,
    fontSize: 11,
    color: '#EAF5F1',
    fontWeight: '500',
  },
});
