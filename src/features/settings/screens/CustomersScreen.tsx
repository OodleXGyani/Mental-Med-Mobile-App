import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const customers = [
  { id: '1', name: 'Ramesh Kumar', phone: '9876543210', amount: 'Rs 4580' },
  { id: '2', name: 'Priya Sharma', phone: '9876543211', amount: 'Rs 2340' },
  { id: '3', name: 'Suresh Patel', phone: '9876543212', amount: 'Rs 1250' },
  { id: '4', name: 'Anita Gupta', phone: '9876543213', amount: 'Rs 890' },
];

export const CustomersScreen = () => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Customers</Text>
        <View style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </View>
      </View>

      <View style={styles.searchInput}>
        <Text style={styles.searchText}>Search by name or phone...</Text>
      </View>

      {customers.map(customer => (
        <View style={styles.customerRow} key={customer.id}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerMeta}>{customer.phone}</Text>
          </View>
          <Text style={styles.amountText}>{customer.amount}</Text>
        </View>
      ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  addButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchText: {
    color: '#B59D90',
    fontSize: 14,
    fontWeight: '500',
  },
  customerRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F4F3',
  },
  avatarText: {
    color: '#1CA39A',
    fontWeight: '800',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  customerName: {
    color: '#312F2E',
    fontSize: 15,
    fontWeight: '700',
  },
  customerMeta: {
    color: '#A98F81',
    fontSize: 12,
    marginTop: 2,
  },
  amountText: {
    color: '#1CA39A',
    fontWeight: '700',
  },
});
