import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { customerService } from '../../settings/services/customerService';
import { Customer, CartItem } from '../types';
import { useAppTheme } from '../../../shared/theme';
import type { CustomerInvoice } from '../../orders/types';

type Props = {
  visible: boolean;
  selectedCustomer: Customer | null;
  onClose: () => void;
  onAddItemsToCart?: (items: CartItem[]) => void;
};

const formatAmount = (amount: number) =>
  `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

export const POSPastOrdersModal = ({
  visible,
  selectedCustomer,
  onClose,
  onAddItemsToCart,
}: Props) => {
  const theme = useAppTheme();
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !selectedCustomer) {
      return;
    }

    const loadInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await customerService.fetchCustomerInvoices(
          selectedCustomer.id,
          1,
          50,
        );
        setInvoices(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load past orders',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInvoices();
  }, [visible, selectedCustomer]);

  const handleAddItemsFromInvoice = (invoice: CustomerInvoice) => {
    if (!onAddItemsToCart || !invoice.items) {
      return;
    }

    // Convert invoice items to CartItem format
    const cartItems: CartItem[] = (invoice.items || []).map((item, idx) => ({
      id: `${invoice.name}-${idx}`,
      name: item.item_name || item.item_code || 'Unknown',
      batch: item.batch || '',
      exp: item.expiry_date || '',
      gst: item.gst_rate || 0,
      price: item.rate || 0,
      qty: Math.max(1, Math.floor(item.qty || 1)),
      item_code: item.item_code,
      rate: item.rate,
    }));

    onAddItemsToCart(cartItems);
  };

  const renderInvoiceItem = ({ item }: { item: CustomerInvoice }) => {
    const itemCount = (item.items || []).length;
    const total = item.grand_total || 0;

    return (
      <View
        style={[
          styles.pastOrderCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.pastOrderHeader}>
          <View>
            <Text style={[styles.pastOrderId, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.pastOrderDate, { color: theme.colors.mutedText }]}
            >
              {item.posting_date}
            </Text>
          </View>
          {onAddItemsToCart && (
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleAddItemsFromInvoice(item)}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.itemCountText, { color: theme.colors.mutedText }]}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </Text>

        {(item.items || []).slice(0, 2).map((orderItem, idx) => (
          <Text
            key={`${item.name}-item-${idx}`}
            style={[styles.pastOrderItem, { color: theme.colors.mutedText }]}
            numberOfLines={1}
          >
            • {orderItem.item_name}
          </Text>
        ))}

        {itemCount > 2 && (
          <Text
            style={[styles.moreItemsText, { color: theme.colors.mutedText }]}
          >
            +{itemCount - 2} more
          </Text>
        )}

        <Text style={[styles.pastOrderAmount, { color: theme.colors.text }]}>
          {formatAmount(total)}
        </Text>
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[styles.bottomSheet, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
              {`${selectedCustomer?.name || 'Customer'} - Past Orders`}
            </Text>
            <Pressable onPress={onClose}>
              <X size={16} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={[styles.loadingText, { color: theme.colors.mutedText }]}
              >
                Loading past orders...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.errorText, { color: theme.colors.text }]}>
                {error}
              </Text>
            </View>
          ) : invoices.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text
                style={[styles.emptyText, { color: theme.colors.mutedText }]}
              >
                No past orders found
              </Text>
            </View>
          ) : (
            <FlatList
              data={invoices}
              renderItem={renderInvoiceItem}
              keyExtractor={(item, index) =>
                `${item.name || 'invoice'}-${index}`
              }
              scrollEnabled={true}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.listContent}
            />
          )}
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
    fontSize: 16,
    flex: 1,
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
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  pastOrderId: {
    color: '#564A43',
    fontSize: 12,
    fontWeight: '700',
  },
  pastOrderDate: {
    color: '#B59F93',
    fontSize: 10,
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  itemCountText: {
    fontSize: 10,
    marginBottom: 4,
  },
  pastOrderItem: {
    color: '#5E5148',
    fontSize: 11,
    marginBottom: 2,
  },
  moreItemsText: {
    color: '#B59F93',
    fontSize: 10,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  pastOrderAmount: {
    color: '#4A3E37',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  listContent: {
    paddingVertical: 4,
  },
});
