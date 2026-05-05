import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import { AddStockModal } from '../components/AddStockModal';
import { RemoveStockModal } from '../components/RemoveStockModal';
import { inventoryService } from '../services/inventoryService';
import { InventoryItem } from '../types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { InventoryStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  InventoryStackParamList,
  typeof STACK_ROUTES.INVENTORY_DETAILS
>;

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in stock':
      return { bg: '#E9F7F0', text: '#2D8F6B' };
    case 'low':
      return { bg: '#FEF3E2', text: '#CD8936' };
    case 'critical':
      return { bg: '#FFE8E8', text: '#D32F2F' };
    case 'expiring soon':
      return { bg: '#FFF3E0', text: '#E65100' };
    case 'expired':
      return { bg: '#FFE0E0', text: '#C62828' };
    default:
      return { bg: '#F5F5F5', text: '#666' };
  }
};

const formatStatusLabel = (status: string) => {
  if (status.toLowerCase() === 'expiring soon') {
    return 'Expiring Soon';
  }

  return status
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

export const InventoryDetailsScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const [selectedItem, setSelectedItem] = useState<InventoryItem>(
    route.params.item,
  );
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showRemoveStockModal, setShowRemoveStockModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedItem(route.params.item);
  }, [route.params.item]);

  const refreshSelectedItem = useCallback(async () => {
    const items = await inventoryService.fetchInventoryItems();
    const nextItem = items.find(
      item =>
        item.medicine_id === route.params.item.medicine_id &&
        item.warehouse === route.params.item.warehouse &&
        item.batch_no === route.params.item.batch_no,
    );

    if (nextItem) {
      setSelectedItem(nextItem);
    }
  }, [route.params.item]);

  const submitStockAdjustment = async (
    quantity: number,
    reason: string,
    type: 'add' | 'remove',
  ) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    if (type === 'remove') {
      quantity = -Math.abs(quantity); // Ensure quantity is negative for removal
    } else {
      quantity = Math.abs(quantity); // Ensure quantity is positive for addition
    }

    try {
      const message = await inventoryService.adjustStock({
        item_code: selectedItem.medicine_id,
        warehouse: selectedItem.warehouse,
        qty: quantity,
        company: selectedItem.company,
        batch_no: selectedItem.batch_no,
        reason,
      });

      Alert.alert('Success', message);
      await refreshSelectedItem();

      if (type === 'add') {
        setShowAddStockModal(false);
      } else {
        setShowRemoveStockModal(false);
      }
    } catch (error) {
      Alert.alert(
        'Unable to update stock',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = getStatusColor(selectedItem.status);

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#2A2A2A" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{selectedItem.name}</Text>
          <Text style={styles.headerSubtitle}>{selectedItem.medicine_id}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.name}>{selectedItem.name}</Text>
              <Text style={styles.meta}>{selectedItem.category}</Text>
              <Text style={styles.meta}>{selectedItem.company}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
            >
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {formatStatusLabel(selectedItem.status)}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Current Stock</Text>
              <Text style={styles.metricValue}>{selectedItem.quantity}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Days Left</Text>
              <Text style={styles.metricValue}>{selectedItem.days_left}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stock & Pricing</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValue}>{selectedItem.warehouse}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Batch No</Text>
            <Text style={styles.detailValue}>{selectedItem.batch_no}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase Price</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(selectedItem.purchase_price)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selling Price</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(selectedItem.selling_price)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock Value</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(selectedItem.stock_value)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reorder Level</Text>
            <Text style={styles.detailValue}>{selectedItem.reorder_level}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expiry Date</Text>
            <Text style={styles.detailValue}>{selectedItem.expiry_date}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Item Summary</Text>
          <Text style={styles.summaryText}>
            Medicine {selectedItem.medicine_id} is stored in{' '}
            {selectedItem.warehouse}. This batch currently has{' '}
            {selectedItem.quantity} units and is marked as{' '}
            {formatStatusLabel(selectedItem.status).toLowerCase()}.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => setShowRemoveStockModal(true)}
        >
          <Minus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => setShowAddStockModal(true)}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.actionButtonText}>Add Stock</Text>
        </TouchableOpacity>
      </View>

      <AddStockModal
        visible={showAddStockModal}
        medicineName={selectedItem.name}
        currentStock={selectedItem.quantity}
        onClose={() => setShowAddStockModal(false)}
        onSubmit={(quantity, reason) => {
          void submitStockAdjustment(quantity, reason, 'add');
        }}
      />

      <RemoveStockModal
        visible={showRemoveStockModal}
        medicineName={selectedItem.name}
        currentStock={selectedItem.quantity}
        onClose={() => setShowRemoveStockModal(false)}
        onSubmit={(quantity, reason) => {
          void submitStockAdjustment(quantity, reason, 'remove');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8E1',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8B7B6F',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE8E1',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTextBlock: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  meta: {
    fontSize: 13,
    color: '#7B6D63',
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FAF7F4',
    borderRadius: 14,
    padding: 14,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8B7B6F',
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
    color: '#1CA39A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE8E1',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8B7B6F',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#2A2A2A',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5E544D',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE8E1',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#1CA39A',
  },
  removeButton: {
    backgroundColor: '#D32F2F',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
