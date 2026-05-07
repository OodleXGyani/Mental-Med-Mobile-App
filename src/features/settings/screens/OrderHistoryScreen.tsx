import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../authentication/hooks/useAuth';
import { ordersService } from '../../orders/services/ordersService';
import type { CustomerInvoice } from '../../orders/types';
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

export const OrderHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CustomerInvoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
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
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Order History
      </Text>

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
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : null}
      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : null}

      {items.length > 0 ? (
        items.map(order => (
          <Pressable
            key={order.invoice_id}
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
                  {order.invoice_id}
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
              <Text style={[styles.orderAmount, { color: theme.colors.primary }]}>
                {formatAmount(order.amount)}
              </Text>
            </View>

            <View style={styles.orderDetails}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {order.company}
              </Text>
              <Text
                style={[styles.customerPhone, { color: theme.colors.mutedText }]}
              >
                {order.items.join(', ')}
              </Text>
              <Text style={[styles.orderTime, { color: theme.colors.mutedText }]}>
                {formatDate(order.posting_date)}
              </Text>
            </View>

            <View
              style={[
                styles.orderFooter,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Pressable style={styles.viewButton}>
                <Text
                  style={[styles.viewButtonText, { color: theme.colors.primary }]}
                >
                  View Details
                </Text>
                <ChevronRight
                  size={16}
                  color={theme.colors.primary}
                  strokeWidth={2.5}
                />
              </Pressable>
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
            page === 1 && {
              backgroundColor: theme.dark ? '#2F3A39' : '#C7D5D3',
            },
          ]}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </Pressable>

        <Text style={[styles.pageLabel, { color: theme.colors.mutedText }]}>
          Page {page} of {totalPages}
        </Text>

        <Pressable
          onPress={() => setPage(current => Math.min(current + 1, totalPages))}
          disabled={page >= totalPages}
          style={[
            styles.pageButton,
            { backgroundColor: theme.colors.primary },
            page >= totalPages && {
              backgroundColor: theme.dark ? '#2F3A39' : '#C7D5D3',
            },
          ]}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#252628',
    marginBottom: 12,
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
});
