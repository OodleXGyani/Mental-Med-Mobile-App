import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReports } from '../hooks/useReports';

export const ReportsScreen = () => {
  const { lastGeneratedAt } = useReports();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reports</Text>

      <View style={styles.periodBar}>
        <Text style={styles.activePeriod}>Today</Text>
        <Text style={styles.period}>This Week</Text>
        <Text style={styles.period}>This Month</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sales</Text>
          <Text style={styles.metricValue}>Rs 12,450</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Transactions</Text>
          <Text style={styles.metricValue}>24</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Ticket</Text>
          <Text style={styles.metricValue}>Rs 519</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Top Product</Text>
          <Text style={styles.metricValueSmall}>Paracetamol</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Weekly Sales</Text>
        <View style={styles.chartBarsRow}>
          {[24, 18, 27, 22, 30, 16, 20].map((height, index) => (
            <View key={String(index)} style={styles.barWrap}>
              <View style={[styles.bar, { height }]} />
              <Text style={styles.barLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.productsCard}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        <View style={styles.productRow}>
          <Text style={styles.productName}>1  Paracetamol 500mg</Text>
          <Text style={styles.productAmount}>Rs 2125</Text>
        </View>
        <View style={styles.productRow}>
          <Text style={styles.productName}>2  Amoxicillin 250mg</Text>
          <Text style={styles.productAmount}>Rs 3570</Text>
        </View>
        <View style={styles.productRow}>
          <Text style={styles.productName}>3  Cetirizine 10mg</Text>
          <Text style={styles.productAmount}>Rs 1320</Text>
        </View>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  activePeriod: {
    color: '#453C37',
    fontWeight: '700',
    fontSize: 12,
  },
  period: {
    color: '#9C8175',
    fontWeight: '600',
    fontSize: 12,
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
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  metricValueSmall: {
    color: '#322F2D',
    fontSize: 16,
    fontWeight: '800',
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
  },
  barWrap: {
    alignItems: 'center',
    width: '13%',
  },
  bar: {
    width: 16,
    borderRadius: 8,
    backgroundColor: '#1CA39A',
    marginBottom: 6,
  },
  barLabel: {
    color: '#AC9386',
    fontSize: 11,
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
