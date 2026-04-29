import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, Plus, Minus } from 'lucide-react-native';
import { Medicine } from '../types';

type Props = {
  visible: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onAddStock: (medicine: Medicine) => void;
  onRemoveStock: (medicine: Medicine) => void;
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

const getDaysToExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.floor(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

export const MedicineDetailModal = ({
  visible,
  medicine,
  onClose,
  onAddStock,
  onRemoveStock,
}: Props) => {
  const [activeTab, setActiveTab] = useState<'In Stock' | 'Valid' | 'OTC'>(
    'In Stock',
  );

  if (!medicine) return null;

  const statusColor = getStatusColor(medicine.status);
  const daysToExpiry = getDaysToExpiry(medicine.expiryDate);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <ChevronLeft size={24} color="#2A2A2A" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>{medicine.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <View style={styles.titleLeft}>
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

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(['In Stock', 'Valid', 'OTC'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stock & Pricing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock & Pricing</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Current Stock</Text>
                <Text style={styles.rowValue}>{medicine.quantity} units</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Reorder Level</Text>
                <Text style={styles.rowValue}>
                  {medicine.minQuantity} units
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>MRP</Text>
                <Text style={styles.rowValue}>₹{medicine.mrp}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Purchase Rate</Text>
                <Text style={styles.rowValue}>₹{medicine.purchaseRate}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Margin</Text>
                <Text style={styles.rowValue}>
                  {medicine.margin.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>GST</Text>
                <Text style={styles.rowValue}>{medicine.gst}%</Text>
              </View>
            </View>
          </View>

          {/* Batch & Expiry Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batch & Expiry</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Batch No</Text>
                <Text style={styles.rowValue}>{medicine.batch}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Expiry Date</Text>
                <Text style={styles.rowValue}>{medicine.expiryDate}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Days to Expiry</Text>
                <Text
                  style={[
                    styles.rowValue,
                    { color: daysToExpiry < 30 ? '#D32F2F' : '#2A2A2A' },
                  ]}
                >
                  {daysToExpiry} days
                </Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Rack Location</Text>
                <Text style={styles.rowValue}>{medicine.rackLocation}</Text>
              </View>
            </View>
          </View>

          {/* Barcode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Barcode</Text>
            <Text style={styles.barcodeValue}>{medicine.barcode}</Text>
          </View>
        </ScrollView>

        {/* Stock Actions Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => onRemoveStock(medicine)}
          >
            <Minus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => onAddStock(medicine)}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Add Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleLeft: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  genericName: {
    fontSize: 12,
    color: '#8B7B6F',
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1CA39A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7B6F',
  },
  tabTextActive: {
    color: '#1CA39A',
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  rowItem: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 11,
    color: '#8B7B6F',
    fontWeight: '600',
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  barcodeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1CA39A',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: '#1CA39A',
  },
  removeButton: {
    backgroundColor: '#D32F2F',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
