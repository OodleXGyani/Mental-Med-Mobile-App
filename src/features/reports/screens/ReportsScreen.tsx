import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReports } from '../hooks/useReports';

type PeriodType = 'today' | 'week' | 'month';

const reportData = {
  today: {
    sales: 12450,
    transactions: 24,
    avgTicket: 519,
    topProduct: 'Paracetamol 500mg',
    chartData: [12, 24, 18, 22, 16, 20],
  },
  week: {
    sales: 87320,
    transactions: 156,
    avgTicket: 559,
    topProduct: 'Paracetamol 500mg',
    chartData: [24, 18, 27, 22, 30, 16, 20],
  },
  month: {
    sales: 345680,
    transactions: 634,
    avgTicket: 545,
    topProduct: 'Amoxicillin 250mg',
    chartData: [18, 22, 26, 20, 28, 32, 24],
  },
};

const topProducts = {
  today: [
    { name: 'Paracetamol 500mg', amount: 2125 },
    { name: 'Amoxicillin 250mg', amount: 3570 },
    { name: 'Cetirizine 10mg', amount: 1320 },
  ],
  week: [
    { name: 'Paracetamol 500mg', amount: 15250 },
    { name: 'Amoxicillin 250mg', amount: 22450 },
    { name: 'Cetirizine 10mg', amount: 8920 },
  ],
  month: [
    { name: 'Amoxicillin 250mg', amount: 89350 },
    { name: 'Paracetamol 500mg', amount: 76200 },
    { name: 'Cetirizine 10mg', amount: 42180 },
  ],
};

export const ReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const { lastGeneratedAt } = useReports();
  const [activePeriod, setActivePeriod] = useState<PeriodType>('today');

  const data = reportData[activePeriod];
  const products = topProducts[activePeriod];

  const maxChartValue = useMemo(() => {
    return Math.max(...data.chartData);
  }, [data.chartData]);

  const normalizedChartData = useMemo(() => {
    return data.chartData.map(value => (value / maxChartValue) * 120);
  }, [data.chartData, maxChartValue]);

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
            Rs {data.sales.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Transactions</Text>
          <Text style={styles.metricValue}>{data.transactions}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Ticket</Text>
          <Text style={styles.metricValue}>Rs {data.avgTicket}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Top Product</Text>
          <Text style={styles.metricValueSmall}>{data.topProduct}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>
          {activePeriod === 'today'
            ? 'Hourly Sales'
            : activePeriod === 'week'
            ? 'Daily Sales'
            : 'Weekly Sales'}
        </Text>
        <View style={styles.chartBarsRow}>
          {normalizedChartData.map((height, index) => {
            const labels =
              activePeriod === 'today'
                ? ['12AM', '6AM', '12PM', '6PM', '10PM', '12AM']
                : activePeriod === 'week'
                ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                : ['W1', 'W2', 'W3', 'W4', 'W5'];

            return (
              <View key={String(index)} style={styles.barWrap}>
                <View style={[styles.bar, { height }]} />
                <Text style={styles.barLabel}>{labels[index] || ''}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.productsCard}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        {products.map((product, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName}>
              {index + 1} {product.name}
            </Text>
            <Text style={styles.productAmount}>
              Rs {product.amount.toLocaleString('en-IN')}
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
