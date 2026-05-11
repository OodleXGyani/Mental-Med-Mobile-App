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
    const cartItems: CartItem[] = (invoice.items || [])
      .filter(item => typeof item !== 'string') // Filter out string items
      .map((item, idx) => {
        // item is an InvoiceItem object
        const invoiceItem = item as any;
        return {
          id: `${invoice.name || invoice.invoice_id || 'invoice'}-${idx}`,
          name: invoiceItem.item_name || invoiceItem.item_code || 'Unknown',
          batch: invoiceItem.batch || '',
          exp: invoiceItem.expiry_date || '',
          gst: invoiceItem.gst_rate || 0,
          price: invoiceItem.rate || 0,
          qty: Math.max(1, Math.floor(invoiceItem.qty || 1)),
          item_code: invoiceItem.item_code,
          rate: invoiceItem.rate,
        };
      });

    if (cartItems.length > 0) {
      onAddItemsToCart(cartItems);
    }
  };

  const handleAddSingleItem = (
    invoice: CustomerInvoice,
    orderItem: string | any,
  ) => {
    if (!onAddItemsToCart) return;

    const invoiceItem =
      typeof orderItem === 'string' ? { item_name: orderItem } : orderItem;

    const cartItem: CartItem = {
      id: `${invoice.name || invoice.invoice_id || 'invoice'}-${
        invoiceItem.item_code || invoiceItem.item_name || 'item'
      }`,
      name:
        invoiceItem.item_name ||
        invoiceItem.item_code ||
        (typeof orderItem === 'string' ? orderItem : 'Unknown'),
      batch: invoiceItem.batch || '',
      exp: invoiceItem.expiry_date || '',
      gst: invoiceItem.gst_rate || 0,
      price: invoiceItem.rate || 0,
      qty: Math.max(1, Math.floor(invoiceItem.qty || 1)),
      item_code: invoiceItem.item_code,
      rate: invoiceItem.rate,
    };

    onAddItemsToCart([cartItem]);
    // Close modal to return to POS card with selected customer
    onClose();
  };

  const getItemDisplayName = (item: string | any): string => {
    if (typeof item === 'string') {
      return item;
    }
    return item.item_name || item.item_code || 'Unknown Item';
  };

  const renderInvoiceItem = ({ item }: { item: CustomerInvoice }) => {
    const itemCount = (item.items || []).length;
    const total = item.amount || item.grand_total || 0;
    const invoiceId = item.name || item.invoice_id || 'Invoice';
    const statusColor = item.status === 'Overdue' ? '#E74C3C' : '#27AE60';

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
          <View style={{ flex: 1 }}>
            <Text style={[styles.pastOrderId, { color: theme.colors.text }]}>
              {invoiceId}
            </Text>
            <View style={styles.dateStatusRow}>
              <Text
                style={[
                  styles.pastOrderDate,
                  { color: theme.colors.mutedText },
                ]}
              >
                {item.posting_date}
              </Text>
              <Text style={[styles.statusBadge, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>
          </View>
          {/* Removed invoice-level add button; per-item add buttons remain */}
        </View>

        <Text style={[styles.itemCountText, { color: theme.colors.mutedText }]}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </Text>

        <View style={styles.itemsList}>
          {(item.items || []).slice(0, 2).map((orderItem, idx) => (
            <View
              key={`${invoiceId}-item-${idx}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={[
                  styles.pastOrderItem,
                  { color: theme.colors.mutedText, flex: 1 },
                ]}
                numberOfLines={1}
              >
                • {getItemDisplayName(orderItem)}
              </Text>
              <Pressable
                style={[
                  styles.addButton,
                  { marginLeft: 8, backgroundColor: theme.colors.primary },
                ]}
                onPress={() => handleAddSingleItem(item, orderItem)}
              >
                <Plus size={12} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>
          ))}

          {itemCount > 2 && (
            <Text
              style={[styles.moreItemsText, { color: theme.colors.mutedText }]}
            >
              +{itemCount - 2} more
            </Text>
          )}
        </View>

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
  dateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
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
  itemsList: {
    marginVertical: 4,
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
