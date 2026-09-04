import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Minus, Plus, ShoppingCart, X } from 'lucide-react-native';
import { CartItem } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  cartItems: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onPressItem?: (item: CartItem) => void;
};

export const POSCartSection = ({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onPressItem,
}: Props) => {
  const theme = useAppTheme();

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <ShoppingCart size={40} color={theme.colors.border} strokeWidth={2} />
        <Text style={[styles.emptyTitle, { color: theme.colors.mutedText }]}>
          Cart is empty
        </Text>
        <Text style={[styles.emptySub, { color: theme.colors.mutedText }]}>
          Search or scan to add medicines
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.itemsListWrap}>
      {cartItems.map((item, idx) => {
        const itemSubtotal = item.price * item.qty;
        const currentBatch = item.batch_no || item.batch;
        const hasMissingBatch = item.has_batch_no && !currentBatch;
        const lineId = item.line_id || item.id;

        return (
          <Pressable
            key={item.line_id || `cart-item-${item.id}-${currentBatch || 'nobatch'}-${idx}`}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
              hasMissingBatch && styles.itemCardMissingBatch,
            ]}
            onPress={() => onPressItem && onPressItem(item)}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleArea}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <View style={styles.tagsRow}>
                  {currentBatch ? (
                    <View style={[styles.badgePill, { backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}40` }]}>
                      <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                        Batch: {currentBatch}
                      </Text>
                    </View>
                  ) : item.has_batch_no ? (
                    <View style={[styles.badgePill, styles.badgeWarning]}>
                      <AlertCircle size={10} color="#B45309" />
                      <Text style={[styles.badgeText, styles.badgeWarningText]}>
                        Tap to select batch
                      </Text>
                    </View>
                  ) : null}
                  {item.warehouse ? (
                    <View style={[styles.badgePill, styles.warehouseBadge, { borderColor: theme.colors.border }]}>
                      <Text style={[styles.badgeText, { color: theme.colors.mutedText }]}>
                        {item.warehouse}
                      </Text>
                    </View>
                  ) : null}
                  {item.exp ? (
                    <Text style={[styles.itemMeta, { color: theme.colors.mutedText }]}>
                      Exp: {item.exp}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                onPress={() => onRemoveItem(lineId)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <X size={16} color={theme.colors.danger} />
              </Pressable>
            </View>

            <View style={styles.itemBottom}>
              <View style={styles.qtyControls}>
                <Pressable
                  style={[styles.qtyBtn, { borderColor: theme.colors.border }]}
                  onPress={() => onUpdateQty(lineId, -1)}
                >
                  <Minus size={12} color={theme.colors.mutedText} />
                </Pressable>
                <Text style={[styles.qtyText, { color: theme.colors.text }]}>
                  {item.qty}
                </Text>
                <Pressable
                  style={[styles.qtyBtn, { borderColor: theme.colors.border }]}
                  onPress={() => onUpdateQty(lineId, 1)}
                >
                  <Plus size={12} color={theme.colors.mutedText} />
                </Pressable>
              </View>

              <View style={styles.itemPriceWrap}>
                <Text
                  style={[
                    styles.itemPriceMeta,
                    { color: theme.colors.mutedText },
                  ]}
                >{`₹${item.price} x ${item.qty} (GST ${item.gst || 0}%)`}</Text>
                <Text
                  style={[styles.itemPrice, { color: theme.colors.text }]}>
                  {`₹${itemSubtotal.toFixed(2)}`}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  itemsListWrap: {
    marginTop: 10,
    marginBottom: 10,
  },
  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  itemCardMissingBatch: {
    borderColor: '#F59E0B',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleArea: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  badgeWarningText: {
    color: '#B45309',
  },
  warehouseBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 10.5,
  },
  removeBtn: {
    padding: 2,
  },
  itemBottom: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontWeight: '700',
    fontSize: 13,
    minWidth: 18,
    textAlign: 'center',
  },
  itemPriceWrap: {
    alignItems: 'flex-end',
  },
  itemPriceMeta: {
    fontSize: 10.5,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
});
