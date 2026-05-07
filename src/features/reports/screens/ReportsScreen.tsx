import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../../app/hooks';
import { useReports } from '../hooks/useReports';
import { reportsService } from '../services/reportsService';
import { setLastGeneratedAt } from '../store/reportsSlice';

type PeriodType = 'today' | 'week' | 'month';

const periodToFilter = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
} as const;

const formatCurrency = (value: number) => `Rs ${value.toLocaleString('en-IN')}`;

export const ReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const { lastGeneratedAt } = useReports();
  const dispatch = useAppDispatch();
  const [activePeriod, setActivePeriod] = useState<PeriodType>('today');
  const [reportData, setReportData] = useState<{
    sales: number;
    transactions: number;
    avgTicket: number;
    topProduct: string;
    chartData: number[];
    labels: string[];
    topProducts: Array<{ name: string; amount: number }>;
  }>({
    sales: 0,
    transactions: 0,
    avgTicket: 0,
    topProduct: '-',
    chartData: [],
    labels: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await reportsService.fetchSalesDashboardReport(
          periodToFilter[activePeriod],
        );

        if (!isMounted) {
          return;
        }

        setReportData({
          sales: response.summary.sales,
          transactions: response.summary.transactions,
          avgTicket: response.summary.avg_ticket,
          topProduct: response.summary.top_product,
          chartData: response.weekly_sales.map(item => item.total),
          labels: response.weekly_sales.map(item => item.day),
          topProducts: response.top_products.map(item => ({
            name: item.product,
            amount: item.sales,
          })),
        });

        dispatch(setLastGeneratedAt(new Date().toISOString()));
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load report.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      isMounted = false;
    };
  }, [activePeriod, dispatch]);

  const maxChartValue = useMemo(() => {
    return Math.max(...reportData.chartData, 1);
  }, [reportData.chartData]);

  const normalizedChartData = useMemo(() => {
    return reportData.chartData.map(value => (value / maxChartValue) * 120);
  }, [reportData.chartData, maxChartValue]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Reports</Text>

      {loading ? (
        <ActivityIndicator style={{ marginBottom: 10 }} color="#1CA39A" />
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.periodBar}>
        <Pressable
          onPress={() => setActivePeriod('today')}
          style={[
            styles.periodButton,
            activePeriod === 'today' && styles.periodButtonActive,
          ]}
        >
          <Text
            style={[
              styles.periodText,
              activePeriod === 'today' && styles.periodTextActive,
            ]}
          >
            Today
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActivePeriod('week')}
          style={[
            styles.periodButton,
            activePeriod === 'week' && styles.periodButtonActive,
          ]}
        >
          <Text
            style={[
              styles.periodText,
              activePeriod === 'week' && styles.periodTextActive,
            ]}
          >
            This Week
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActivePeriod('month')}
          style={[
            styles.periodButton,
            activePeriod === 'month' && styles.periodButtonActive,
          ]}
        >
          <Text
            style={[
              styles.periodText,
              activePeriod === 'month' && styles.periodTextActive,
            ]}
          >
            This Month
          </Text>
        </Pressable>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sales</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(reportData.sales)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Transactions</Text>
          <Text style={styles.metricValue}>{reportData.transactions}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Ticket</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(reportData.avgTicket)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Top Product</Text>
          <Text style={styles.metricValueSmall}>{reportData.topProduct}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Sales Trend</Text>
        <View style={styles.chartBarsRow}>
          {normalizedChartData.map((height, index) => {
            return (
              <View key={String(index)} style={styles.barWrap}>
                <View style={[styles.bar, { height }]} />
                <Text style={styles.barLabel}>
                  {reportData.labels[index] || ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.productsCard}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        {reportData.topProducts.map((product, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName}>
              {index + 1} {product.name}
            </Text>
            <Text style={styles.productAmount}>
              {formatCurrency(product.amount)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.lastGenerated}>
        {`Last generated: ${lastGeneratedAt ?? 'Not generated yet'}`}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  periodBar: {
    backgroundColor: '#EFEBE7',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 12,
    gap: 6,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    color: '#9C8175',
    fontWeight: '600',
    fontSize: 12,
  },
  periodTextActive: {
    color: '#453C37',
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#9F877C',
    fontWeight: '600',
    fontSize: 12,
  },
  metricValue: {
    color: '#322F2D',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  metricValueSmall: {
    color: '#322F2D',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#342F2D',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barWrap: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '80%',
    borderRadius: 8,
    backgroundColor: '#1CA39A',
    marginBottom: 6,
  },
  barLabel: {
    color: '#AC9386',
    fontSize: 10,
    fontWeight: '600',
  },
  productsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    color: '#4B403A',
    fontWeight: '600',
    flex: 1,
  },
  productAmount: {
    color: '#4B403A',
    fontWeight: '700',
  },
  lastGenerated: {
    marginTop: 10,
    color: '#A48B7F',
    fontSize: 12,
  },
});
