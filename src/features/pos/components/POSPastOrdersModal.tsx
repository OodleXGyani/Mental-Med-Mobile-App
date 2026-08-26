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
import type { CustomerInvoice } from '../../settings/types';

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

    loadInvoices();
  }, [visible, selectedCustomer]);

  const handleAddItemsFromInvoice = (invoice: CustomerInvoice) => {
    if (!onAddItemsToCart || !invoice.items) {
      return;
    }

    // Convert invoice items to CartItem format
    const cartItems: CartItem[] = (invoice.items || [])
      .filter(item => typeof item !== 'string')
      .map((item, idx) => {
        const invoiceItem = item as any;
        return {
          id: `${invoice.invoice_id || 'invoice'}-${idx}`,
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
      id: `${invoice.invoice_id || 'invoice'}-${
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
    const total = item.amount || 0;
    const invoiceId = item.invoice_id || 'Invoice';
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
          <View style={styles.pastOrderInfo}>
            <Text style={[styles.pastOrderId, { color: theme.colors.text }]}>
              {invoiceId}
            </Text>
            <Text
              style={[styles.pastOrderMeta, { color: theme.colors.mutedText }]}
            >
              {`${item.posting_date || ''} • ${itemCount} ${
                itemCount === 1 ? 'item' : 'items'
              }`}
            </Text>
          </View>
          <View style={styles.pastOrderRight}>
            <Text
              style={[styles.pastOrderAmount, { color: theme.colors.text }]}
            >
              {formatAmount(total)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}20` },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status || 'Paid'}
              </Text>
            </View>
          </View>
        </View>

        {/* List of items */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsContainer}>
            <Text style={[styles.itemsTitle, { color: theme.colors.mutedText }]}>
              Items:
            </Text>
            {item.items.map((orderItem, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text
                  style={[styles.itemBullet, { color: theme.colors.mutedText }]}
                >
                  •
                </Text>
                <Text
                  style={[styles.itemText, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {getItemDisplayName(orderItem)}
                </Text>
                <Pressable
                  style={styles.addSingleItemBtn}
                  onPress={() => handleAddSingleItem(item, orderItem)}
                >
                  <Plus size={12} color={theme.colors.primary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add all items button */}
        {onAddItemsToCart && item.items && item.items.length > 0 && (
          <Pressable
            style={[
              styles.addAllBtn,
              {
                borderColor: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}10`,
              },
            ]}
            onPress={() => handleAddItemsFromInvoice(item)}
          >
            <Plus size={14} color={theme.colors.primary} />
            <Text style={[styles.addAllText, { color: theme.colors.primary }]}>
              Add All Items to Cart
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdrop}>
        <View
          style={[styles.modalSheet, { backgroundColor: theme.colors.card }]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                Past Orders
              </Text>
              {selectedCustomer && (
                <Text
                  style={[
                    styles.sheetSubtitle,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  {selectedCustomer.name}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={16} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
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
              <Pressable
                style={[
                  styles.retryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  if (selectedCustomer) {
                    customerService
                      .fetchCustomerInvoices(selectedCustomer.id, 1, 50)
                      .then(data => setInvoices(data))
                      .catch(err =>
                        setError(
                          err instanceof Error
                            ? err.message
                            : 'Failed to load past orders',
                        ),
                      )
                      .finally(() => setLoading(false));
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
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
                `${item.invoice_id || 'invoice'}-${index}`
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  pastOrderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  pastOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pastOrderInfo: {
    flex: 1,
  },
  pastOrderId: {
    fontSize: 13,
    fontWeight: '700',
  },
  pastOrderMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  pastOrderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pastOrderAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    gap: 6,
  },
  itemBullet: {
    fontSize: 10,
  },
  itemText: {
    fontSize: 11,
    flex: 1,
  },
  addSingleItemBtn: {
    padding: 4,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  addAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});
