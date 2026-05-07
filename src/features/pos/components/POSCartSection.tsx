import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react-native';
import { CartItem } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  cartItems: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
};

export const POSCartSection = ({
  cartItems,
  onUpdateQty,
  onRemoveItem,
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
      {cartItems.map(item => {
        const itemSubtotal = item.price * item.qty;
        return (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.itemHeader}>
              <View>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemMeta, { color: theme.colors.mutedText }]}
                >{`Batch: ${item.batch} · Exp: ${item.exp} · GST: ${item.gst}%`}</Text>
              </View>
              <Pressable onPress={() => onRemoveItem(item.id)}>
                <X size={14} color={theme.colors.danger} />
              </Pressable>
            </View>
            <View style={styles.itemBottom}>
              <View style={styles.qtyControls}>
                <Pressable
                  style={[styles.qtyBtn, { borderColor: theme.colors.border }]}
                  onPress={() => onUpdateQty(item.id, -1)}
                >
                  <Minus size={12} color={theme.colors.mutedText} />
                </Pressable>
                <Text style={[styles.qtyText, { color: theme.colors.text }]}>
                  {item.qty}
                </Text>
                <Pressable
                  style={[styles.qtyBtn, { borderColor: theme.colors.border }]}
                  onPress={() => onUpdateQty(item.id, 1)}
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
                >{`Rs ${item.price} x ${item.qty}`}</Text>
                <Text
                  style={[styles.itemPrice, { color: theme.colors.text }]}
                >{`Rs ${itemSubtotal.toFixed(2)}`}</Text>
              </View>
            </View>
          </View>
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
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    color: '#3D322C',
    fontSize: 12,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#A59084',
    fontSize: 9.5,
    marginTop: 2,
  },
  itemBottom: {
    marginTop: 8,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: '#DFD8D2',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#534640',
    fontWeight: '700',
    fontSize: 12,
  },
  itemPriceWrap: {
    alignItems: 'flex-end',
  },
  itemPriceMeta: {
    color: '#A79489',
    fontSize: 10,
  },
  itemPrice: {
    color: '#433832',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    marginTop: 90,
    alignItems: 'center',
    marginBottom: 50,
  },
  emptyTitle: {
    color: '#8B7064',
    fontWeight: '700',
    fontSize: 17,
    marginTop: 10,
  },
  emptySub: {
    color: '#B79D90',
    marginTop: 4,
    fontWeight: '500',
    fontSize: 12,
  },
});
