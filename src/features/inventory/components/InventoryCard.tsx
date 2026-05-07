import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, BarChart3 } from 'lucide-react-native';
import { InventoryItem } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  item: InventoryItem;
  onPress: (item: InventoryItem) => void;
  onBarcodeScan: (item: InventoryItem) => void;
};

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

export const InventoryCard = ({ item, onPress, onBarcodeScan }: Props) => {
  const theme = useAppTheme();
  const statusColor = getStatusColor(item.status);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={[styles.medicineName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.genericName, { color: theme.colors.mutedText }]}
            >
              {item.medicine_id}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {formatStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.metaText, { color: theme.colors.mutedText }]}>
        {item.category} · {item.company}
      </Text>

      <View style={styles.footer}>
        <View style={styles.quantitySection}>
          <Text style={[styles.qtyLabel, { color: theme.colors.mutedText }]}>
            Qty:{' '}
          </Text>
          <Text style={[styles.qtyValue, { color: theme.colors.text }]}>
            {item.quantity}
          </Text>
        </View>
        <Text style={[styles.price, { color: theme.colors.primary }]}>
          ₹{item.stock_value.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.barcodeButton}
          onPress={() => onBarcodeScan(item)}
          hitSlop={8}
        >
          <BarChart3 size={16} color={theme.colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <ChevronRight
          size={16}
          color={theme.colors.mutedText}
          strokeWidth={2}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContent: {
    flex: 1,
  },
  medicineName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  genericName: {
    fontSize: 11,
    color: '#8B7B6F',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 9.5,
    color: '#9E8B7E',
    marginBottom: 8,
    lineHeight: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  qtyLabel: {
    fontSize: 10,
    color: '#8B7B6F',
    fontWeight: '600',
  },
  qtyValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  price: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1CA39A',
    marginLeft: 8,
  },
  barcodeButton: {
    marginLeft: 'auto',
    marginRight: 8,
    padding: 4,
  },
});
