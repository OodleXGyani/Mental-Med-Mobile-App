import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, BarChart3 } from 'lucide-react-native';
import { Medicine } from '../types';

type Props = {
  medicine: Medicine;
  onPress: (medicine: Medicine) => void;
  onBarcodeScan: (medicine: Medicine) => void;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Stock':
      return { bg: '#E9F7F0', text: '#2D8F6B' };
    case 'Low':
      return { bg: '#FEF3E2', text: '#CD8936' };
    case 'Critical':
      return { bg: '#FFE8E8', text: '#D32F2F' };
    case 'Expiring':
      return { bg: '#FFF3E0', text: '#E65100' };
    case 'Expired':
      return { bg: '#FFE0E0', text: '#C62828' };
    default:
      return { bg: '#F5F5F5', text: '#666' };
  }
};

export const InventoryCard = ({ medicine, onPress, onBarcodeScan }: Props) => {
  const statusColor = getStatusColor(medicine.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(medicine)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={styles.medicineName}>{medicine.name}</Text>
            <Text style={styles.genericName}>{medicine.genericName}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {medicine.status}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.metaText}>
        Batch: {medicine.batch} Exp: {medicine.expiryDate} Rack:{' '}
        {medicine.rackLocation}
      </Text>

      <View style={styles.footer}>
        <View style={styles.quantitySection}>
          <Text style={styles.qtyLabel}>Qty: </Text>
          <Text style={styles.qtyValue}>{medicine.quantity}</Text>
        </View>
        <Text style={styles.price}>₹{medicine.mrp}</Text>
        <TouchableOpacity
          style={styles.barcodeButton}
          onPress={() => onBarcodeScan(medicine)}
          hitSlop={8}
        >
          <BarChart3 size={16} color="#1CA39A" strokeWidth={2} />
        </TouchableOpacity>
        <ChevronRight size={16} color="#B7A59A" strokeWidth={2} />
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
