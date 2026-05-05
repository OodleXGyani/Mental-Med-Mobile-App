import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { customerService } from '../services/customerService';
import { CustomerDetails } from '../types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { SettingsStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  typeof STACK_ROUTES.CUSTOMER_DETAILS
>;

const formatCurrency = (value: number | null | undefined) => {
  const numberValue = Number(value ?? 0);
  return `Rs ${numberValue.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
};

const getStatusColor = (value: string | null | undefined) => {
  const status = (value || 'active').toLowerCase();

  if (status.includes('active')) {
    return { bg: '#E9F7F0', text: '#2D8F6B' };
  }

  return { bg: '#F5F5F5', text: '#666666' };
};

export const CustomerDetailsScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const nextDetails = await customerService.fetchCustomerDetails(
        route.params.customerCode,
      );
      setDetails(nextDetails);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load customer details.',
      );
    } finally {
      setLoading(false);
    }
  }, [route.params.customerCode]);

  useFocusEffect(
    useCallback(() => {
      void loadDetails();
    }, [loadDetails]),
  );

  const statusColor = getStatusColor('Active');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [invoices, setInvoices] = useState<
    import('../types').CustomerInvoice[]
  >([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const loadInvoices = useCallback(
    async (page = 1) => {
      setInvoicesLoading(true);
      try {
        const data = await customerService.fetchCustomerInvoices(
          route.params.customerCode,
          page,
          10,
        );
        setInvoices(data);
      } catch (err) {
        // fail silently — keep UI simple
      } finally {
        setInvoicesLoading(false);
      }
    },
    [route.params.customerCode],
  );

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#2A2A2A" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Customer Details</Text>
          <Text style={styles.headerSubtitle}>{route.params.customerCode}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 18 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#1CA39A" />
            <Text style={styles.stateText}>Loading customer details...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Unable to load details</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadDetails()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : details ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.name}>{details.customer_name}</Text>
                  <Text style={styles.meta}>{details.customer_id}</Text>
                  <Text style={styles.meta}>{details.customer_type}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusColor.text }]}
                  >
                    Active
                  </Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Credit Limit</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(details.credit_limit)}
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Customer Type</Text>
                  <Text style={styles.metricValueSmall}>
                    {details.customer_type}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Contact Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Person</Text>
                <Text style={styles.detailValue}>
                  {details.contact_person || '—'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{details.phone || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{details.email || '—'}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{details.address || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City</Text>
                <Text style={styles.detailValue}>{details.city || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State</Text>
                <Text style={styles.detailValue}>{details.state || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pincode</Text>
                <Text style={styles.detailValue}>{details.pincode || '—'}</Text>
              </View>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => {
                  setShowHistoryModal(true);
                  void loadInvoices();
                }}
              >
                <Text style={styles.historyButtonText}>
                  View Purchase History
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Text style={styles.modalBack}>{'←'}</Text>
              </TouchableOpacity>
              <Text
                style={styles.modalTitleMain}
              >{`${details?.customer_name}'s Purchases`}</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {invoicesLoading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator size="large" color="#1CA39A" />
              </View>
            ) : (
              <FlatList
                data={invoices}
                keyExtractor={item => item.invoice_id}
                style={styles.modalList}
                contentContainerStyle={[
                  styles.invoicesList,
                  { paddingBottom: Math.max(insets.bottom, 16) },
                ]}
                ListEmptyComponent={() => (
                  <View style={[styles.stateBox, { paddingVertical: 24 }]}>
                    <Text style={styles.stateTitle}>No purchases found</Text>
                    <Text style={styles.stateText}>
                      This customer has no invoices.
                    </Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <View style={styles.invoiceCard}>
                    <View style={styles.invoiceHeaderRow}>
                      <View>
                        <Text style={styles.invoiceId}>{item.invoice_id}</Text>
                        <Text style={styles.invoiceDate}>
                          {item.posting_date}
                        </Text>
                      </View>
                      <Text style={styles.invoiceAmount}>₹{item.amount}</Text>
                    </View>
                    <View style={styles.invoiceItems}>
                      {item.items.map((it, idx) => (
                        <Text key={idx} style={styles.invoiceItemText}>
                          {it}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#1CA39A',
  },
  metricValueSmall: {
    marginTop: 6,
    fontSize: 16,
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
  stateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFE8E1',
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  stateText: {
    color: '#8B7B6F',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyButton: {
    marginTop: 14,
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '85%',
    paddingBottom: 24,
    paddingTop: 8,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8E1',
  },
  modalBack: { fontSize: 20, color: '#2A2A2A' },
  modalClose: { fontSize: 20, color: '#2A2A2A' },
  modalTitleMain: { fontSize: 18, fontWeight: '800', color: '#2A2A2A' },
  invoicesList: { paddingHorizontal: 16, paddingVertical: 12 },
  modalList: { flex: 1, paddingTop: 8 },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 14,
    marginBottom: 12,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceId: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  invoiceDate: { fontSize: 12, color: '#8B7B6F', marginTop: 4 },
  invoiceAmount: { fontSize: 16, fontWeight: '800', color: '#1CA39A' },
  invoiceItems: { borderTopWidth: 1, borderTopColor: '#F1EFEF', paddingTop: 8 },
  invoiceItemText: { color: '#7B6D63', fontSize: 13, marginBottom: 6 },
});
