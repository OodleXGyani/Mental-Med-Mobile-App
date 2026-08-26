import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  Printer,
  Share2,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../authentication/hooks/useAuth';
import { ordersService } from '../../orders/services/ordersService';
import type { CustomerInvoice, SalesInvoiceDetails } from '../../orders/types';
import { useAppTheme } from '../../../shared/theme';

const PAGE_SIZE = 10;

const formatAmount = (amount: number) =>
  `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const formatInvoiceDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || 'N/A';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

const buildInvoiceMessage = (invoice: SalesInvoiceDetails) => {
  const items = invoice.items
    .map(
      item => `${item.item_name} x${item.qty} - ${formatAmount(item.amount)}`,
    )
    .join('\n');

  return [
    `Invoice ${invoice.name}`,
    `Customer: ${invoice.customer_name || invoice.customer}`,
    `Date: ${formatInvoiceDate(invoice.posting_date)}`,
    `Status: ${invoice.status}`,
    `Items:\n${items || 'No items'}`,
    `Total: ${formatAmount(invoice.grand_total)}`,
    `Outstanding: ${formatAmount(invoice.outstanding_amount)}`,
  ].join('\n');
};

export const OrderHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CustomerInvoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] =
    useState<SalesInvoiceDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestId = useRef(0);
  const { signOut } = useAuth();

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'unpaid') {
      return '#E0A848';
    }

    if (normalizedStatus === 'return') {
      return '#E03131';
    }

    return '#1CA39A';
  };

  const getStatusLabel = (status: string) => {
    return status;
  };

  useEffect(() => {
    let isMounted = true;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ordersService.fetchCustomerInvoices({
          page,
          limit: PAGE_SIZE,
          search: searchText.trim(),
        });

        if (!isMounted) {
          return;
        }

        setItems(response.data);
        setTotalPages(Math.max(response.pagination.total_pages || 1, 1));
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load order history.';

        if (message === 'AUTH_SESSION_EXPIRED') {
          await signOut();
          return;
        }

        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInvoices();

    return () => {
      isMounted = false;
    };
  }, [page, searchText, signOut]);

  const openInvoiceDetails = async (invoiceName: string) => {
    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;

    try {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedInvoice(null);

      const details = await ordersService.fetchSalesInvoiceDetails(invoiceName);

      if (detailRequestId.current !== requestId) {
        return;
      }

      setSelectedInvoice(details);
    } catch (caughtError) {
      if (detailRequestId.current !== requestId) {
        return;
      }

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load invoice details.';

      if (message === 'AUTH_SESSION_EXPIRED') {
        await signOut();
        return;
      }

      setDetailError(message);
    } finally {
      if (detailRequestId.current === requestId) {
        setDetailLoading(false);
      }
    }
  };

  const closeInvoiceDetails = () => {
    detailRequestId.current += 1;
    setSelectedInvoice(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const shareInvoice = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      await Share.share({
        message: buildInvoiceMessage(selectedInvoice),
        title: selectedInvoice.name,
      });
    } catch {
      Alert.alert('Share', 'Unable to share invoice right now.');
    }
  };

  const shareInvoiceOnWhatsApp = async () => {
    if (!selectedInvoice) {
      return;
    }

    const message = buildInvoiceMessage(selectedInvoice);
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }

      await Share.share({ message });
    } catch {
      Alert.alert('WhatsApp', 'Unable to open WhatsApp right now.');
    }
  };

  const downloadInvoice = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      await Share.share({
        message: buildInvoiceMessage(selectedInvoice),
        title: `${selectedInvoice.name} details`,
      });
    } catch {
      Alert.alert('Download', 'Unable to prepare invoice download right now.');
    }
  };

  const printInvoice = () => {
    if (!selectedInvoice) {
      return;
    }

    Alert.alert('Print', `Invoice ${selectedInvoice.name} is ready to print.`);
  };

  const isDetailModalVisible =
    detailLoading || Boolean(detailError) || Boolean(selectedInvoice);

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + 8,
            paddingBottom: Math.max(insets.bottom, 14) + 18,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate(STACK_ROUTES.SETTINGS_HOME)}
            hitSlop={8}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Order History
          </Text>
          <View style={styles.backButton} />
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            placeholder="Search by invoice, customer, company..."
            placeholderTextColor={theme.colors.mutedText}
            value={searchText}
            onChangeText={text => {
              setSearchText(text);
              setPage(1);
            }}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.primary}
          />
        ) : null}
        {error ? (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {error}
          </Text>
        ) : null}

        {items.length > 0 ? (
          items.map(order => (
            <Pressable
              key={order.invoice_id || order.name}
              onPress={() => openInvoiceDetails(order.invoice_id || order.name || '')}
              style={[
                styles.orderCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderMeta}>
                  <Text style={[styles.orderId, { color: theme.colors.text }]}>
                    {order.invoice_id || order.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.orderAmount, { color: theme.colors.primary }]}
                >
                  {formatAmount(order.amount ?? 0)}
                </Text>
              </View>

              <View style={styles.orderDetails}>
                <Text
                  style={[styles.customerName, { color: theme.colors.text }]}
                >
                  {order.company}
                </Text>
                <Text
                  style={[
                    styles.customerPhone,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  {order.items.join(', ')}
                </Text>
                <Text
                  style={[styles.orderTime, { color: theme.colors.mutedText }]}
                >
                  {formatDate(order.posting_date)}
                </Text>
              </View>

              <View
                style={[
                  styles.orderFooter,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <View style={styles.viewButton}>
                  <Text
                    style={[
                      styles.viewButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    View Details
                  </Text>
                  <ChevronRight
                    size={16}
                    color={theme.colors.primary}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              No orders found
            </Text>
          </View>
        )}

        <View style={styles.paginationRow}>
          <Pressable
            onPress={() => setPage(current => Math.max(current - 1, 1))}
            disabled={page === 1}
            style={[
              styles.pageButton,
              { backgroundColor: theme.colors.primary },
              page === 1 && (theme.dark ? styles.pageButtonDisabledDark : styles.pageButtonDisabledLight),
            ]}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </Pressable>

          <Text style={[styles.pageLabel, { color: theme.colors.mutedText }]}>
            Page {page} of {totalPages}
          </Text>

          <Pressable
            onPress={() =>
              setPage(current => Math.min(current + 1, totalPages))
            }
            disabled={page >= totalPages}
            style={[
              styles.pageButton,
              { backgroundColor: theme.colors.primary },
              page >= totalPages && (theme.dark ? styles.pageButtonDisabledDark : styles.pageButtonDisabledLight),
            ]}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={isDetailModalVisible}
        animationType="fade"
        onRequestClose={closeInvoiceDetails}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.invoiceModal,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              style={styles.closeButton}
              onPress={closeInvoiceDetails}
              hitSlop={10}
            >
              <X size={22} color={theme.colors.mutedText} />
            </Pressable>

            {detailLoading ? (
              <View style={styles.modalState}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text
                  style={[styles.modalStateText, { color: theme.colors.text }]}
                >
                  Loading invoice details...
                </Text>
              </View>
            ) : null}

            {!detailLoading && detailError ? (
              <View style={styles.modalState}>
                <Text
                  style={[
                    styles.modalStateText,
                    { color: theme.colors.danger },
                  ]}
                >
                  {detailError}
                </Text>
              </View>
            ) : null}

            {!detailLoading && selectedInvoice ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {selectedInvoice.name}
                </Text>

                <View
                  style={[
                    styles.pharmacyBox,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Text
                    style={[styles.pharmacyName, { color: theme.colors.text }]}
                  >
                    MedPlus Pharmacy
                  </Text>
                  <Text
                    style={[
                      styles.pharmacyText,
                      { color: theme.colors.mutedText },
                    ]}
                  >
                    {selectedInvoice.company}
                  </Text>
                  <Text
                    style={[
                      styles.pharmacyText,
                      { color: theme.colors.mutedText },
                    ]}
                  >
                    Price List: {selectedInvoice.selling_price_list}
                  </Text>
                </View>

                <View style={styles.invoiceInfo}>
                  <Text style={[styles.infoLine, { color: theme.colors.text }]}>
                    <Text style={styles.infoLabel}>Customer: </Text>
                    {selectedInvoice.customer_name || selectedInvoice.customer}
                  </Text>
                  <Text style={[styles.infoLine, { color: theme.colors.text }]}>
                    <Text style={styles.infoLabel}>Date: </Text>
                    {formatInvoiceDate(selectedInvoice.posting_date)}
                  </Text>
                  <Text style={[styles.infoLine, { color: theme.colors.text }]}>
                    <Text style={styles.infoLabel}>Due Date: </Text>
                    {formatInvoiceDate(selectedInvoice.due_date)}
                  </Text>
                  <Text style={[styles.infoLine, { color: theme.colors.text }]}>
                    <Text style={styles.infoLabel}>Status: </Text>
                    {selectedInvoice.status}
                  </Text>
                </View>

                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Items:
                </Text>

                <View style={styles.invoiceItemsWrap}>
                  {selectedInvoice.items.map(item => (
                    <View
                      key={`${item.item_code}-${item.warehouse}`}
                      style={[
                        styles.invoiceItemRow,
                        { borderBottomColor: theme.colors.border },
                      ]}
                    >
                      <View style={styles.invoiceItemInfo}>
                        <Text
                          style={[
                            styles.invoiceItemName,
                            { color: theme.colors.text },
                          ]}
                        >
                          {item.item_name}
                        </Text>
                        <Text
                          style={[
                            styles.invoiceItemMeta,
                            { color: theme.colors.mutedText },
                          ]}
                        >
                          {item.item_code} | {item.warehouse}
                        </Text>
                        <Text
                          style={[
                            styles.invoiceItemMeta,
                            { color: theme.colors.mutedText },
                          ]}
                        >
                          Rate: {formatAmount(item.rate)} / {item.uom}
                        </Text>
                      </View>
                      <View style={styles.invoiceItemTotal}>
                        <Text
                          style={[
                            styles.invoiceItemQty,
                            { color: theme.colors.text },
                          ]}
                        >
                          x{item.qty}
                        </Text>
                        <Text
                          style={[
                            styles.invoiceItemAmount,
                            { color: theme.colors.text },
                          ]}
                        >
                          {formatAmount(item.amount)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View
                  style={[
                    styles.invoiceSummary,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      Subtotal
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {formatAmount(selectedInvoice.net_total)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      GST
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {formatAmount(selectedInvoice.total_taxes_and_charges)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      Outstanding
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {formatAmount(selectedInvoice.outstanding_amount)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.totalLabel, { color: theme.colors.text }]}
                    >
                      Total
                    </Text>
                    <Text
                      style={[
                        styles.totalValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {formatAmount(selectedInvoice.grand_total)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.actionBtnLight,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.card,
                      },
                    ]}
                    onPress={downloadInvoice}
                  >
                    <Download size={18} color={theme.colors.mutedText} />
                    <Text
                      style={[
                        styles.actionBtnLightText,
                        { color: theme.colors.text },
                      ]}
                    >
                      Download
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtnLight,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.card,
                      },
                    ]}
                    onPress={printInvoice}
                  >
                    <Printer size={18} color={theme.colors.mutedText} />
                    <Text
                      style={[
                        styles.actionBtnLightText,
                        { color: theme.colors.text },
                      ]}
                    >
                      Print
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionBtnWhatsApp}
                    onPress={shareInvoiceOnWhatsApp}
                  >
                    <Phone size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>WhatsApp</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtnShare,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={shareInvoice}
                  >
                    <Share2 size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#252628',
    marginBottom: 0,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    color: '#3B3735',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  loader: {
    marginBottom: 10,
  },
  errorText: {
    color: '#E03131',
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 12,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1CA39A',
  },
  orderDetails: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312F2E',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A98F81',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B59D90',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1CA39A',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#A68F82',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pageButtonDisabled: {
    backgroundColor: '#C7D5D3',
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pageLabel: {
    color: '#6E645E',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  invoiceModal: {
    borderWidth: 1,
    borderRadius: 6,
    maxHeight: '84%',
    padding: 18,
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 1,
  },
  modalState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 170,
    gap: 12,
  },
  modalStateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 34,
  },
  pharmacyBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 22,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 5,
  },
  pharmacyText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  invoiceInfo: {
    marginBottom: 18,
  },
  infoLine: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 9,
  },
  infoLabel: {
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  invoiceItemsWrap: {
    marginBottom: 14,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  invoiceItemInfo: {
    flex: 1,
  },
  invoiceItemName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  invoiceItemMeta: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  invoiceItemTotal: {
    alignItems: 'flex-end',
  },
  invoiceItemQty: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  invoiceItemAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  invoiceSummary: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 19,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtnLight: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnLightText: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtnWhatsApp: {
    flex: 1,
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#22A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnShare: {
    flex: 1,
    minHeight: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pageButtonDisabledLight: {
    backgroundColor: '#C7D5D3',
  },
  pageButtonDisabledDark: {
    backgroundColor: '#2F3A39',
  },
});
