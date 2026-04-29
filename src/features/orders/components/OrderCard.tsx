import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'processing'
  | 'ready'
  | 'dispatched'
  | 'delivered';

export type Order = {
  id: string;
  status: OrderStatus;
  customer: string;
  phone?: string;
  source?: string;
  items: { name: string; qty: number }[];
  time: string;
  amount: number;
};

type Props = {
  order: Order;
  onPress: (order: Order) => void;
};

const statusPill = (status: OrderStatus) => {
  switch (status) {
    case 'new':
      return { text: 'pending', bg: '#F7E9C6', color: '#8A6B2A' };
    case 'accepted':
      return { text: 'accepted', bg: '#E8F1FF', color: '#3571C1' };
    case 'processing':
      return { text: 'processing', bg: '#F0E7FF', color: '#6B46C1' };
    case 'ready':
      return { text: 'ready', bg: '#E9F7F0', color: '#2D8F6B' };
    case 'dispatched':
    case 'delivered':
      return {
        text: status === 'dispatched' ? 'dispatched' : 'delivered',
        bg: '#E7F6F0',
        color: '#1E8066',
      };
    default:
      return { text: status, bg: '#EEE', color: '#333' };
  }
};

export const OrderCard = ({ order, onPress }: Props) => {
  const pill = statusPill(order.status);

  return (
    <TouchableOpacity style={styles.orderCard} onPress={() => onPress(order)}>
      <View style={styles.orderLeft}>
        <View style={styles.idRow}>
          <Text style={styles.orderId}>{order.id}</Text>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.statusPillText, { color: pill.color }]}>
              {pill.text}
            </Text>
          </View>
        </View>
        <Text
          style={styles.orderMeta}
        >{`${order.customer} · ${order.items.length} items · ${order.time}`}</Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={styles.amount}>₹{order.amount}</Text>
        <ChevronRight size={14} color="#B7A59A" strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  orderLeft: {
    flex: 1,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    color: '#332E2C',
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  orderMeta: {
    color: '#A7958A',
    fontSize: 10,
    marginTop: 2,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  amount: {
    color: '#3F342D',
    fontWeight: '700',
    fontSize: 12,
  },
});
