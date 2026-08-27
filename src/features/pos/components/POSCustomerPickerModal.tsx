import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { History, Search, User, UserPlus, X } from 'lucide-react-native';
import { Customer } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  visible: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onViewPastOrders?: (customer: Customer) => void;
  onPressAddNewCustomer: () => void;
  onClose: () => void;
};

export const POSCustomerPickerModal = ({
  visible,
  searchValue,
  onSearchChange,
  customers,
  onSelectCustomer,
  onViewPastOrders,
  onPressAddNewCustomer,
  onClose,
}: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdropBottom}>
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.headerTitleRow}>
                <User size={20} color={theme.colors.primary} />
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                  Customer Management
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color={theme.colors.mutedText} />
              </Pressable>
            </View>

            {/* Segmented Tab Controls */}
            <View
              style={[
                styles.tabContainer,
                theme.dark ? styles.tabContainerDark : styles.tabContainerLight,
              ]}
            >
              <Pressable
                style={[
                  styles.tabButton,
                  styles.tabButtonActive,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Search
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.tabText,
                    styles.tabTextActive,
                    { color: theme.colors.text },
                  ]}
                >
                  Search Customer
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabButton}
                onPress={onPressAddNewCustomer}
              >
                <UserPlus
                  size={14}
                  color={theme.colors.mutedText}
                />
                <Text
                  style={[
                    styles.tabText,
                    styles.tabTextInactive,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  Add New Customer
                </Text>
              </Pressable>
            </View>

            {/* Customer Search & List */}
            <View style={styles.tabContent}>
              <TextInput
                style={[
                  styles.customerSearchInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                placeholder="Search customer by name or phone..."
                placeholderTextColor={theme.colors.mutedText}
                value={searchValue}
                onChangeText={onSearchChange}
              />

              <ScrollView
                style={styles.customerList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {customers.length === 0 ? (
                  <View style={styles.emptyListWrap}>
                    <Text
                      style={[
                        styles.emptyListText,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      No customers found matching search
                    </Text>
                    <Pressable
                      style={[
                        styles.switchToAddBtn,
                        { borderColor: theme.colors.primary },
                      ]}
                      onPress={onPressAddNewCustomer}
                    >
                      <UserPlus size={13} color={theme.colors.primary} />
                      <Text
                        style={[
                          styles.switchToAddBtnText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        + Create New Customer
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  customers.map((customer, index) => (
                    <View
                      key={`cust-${
                        customer.id || customer.phone || 'c'
                      }-${index}`}
                      style={[
                        styles.customerListItem,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                        },
                      ]}
                    >
                      <Pressable
                        style={styles.customerListContent}
                        onPress={() => {
                          onSelectCustomer(customer);
                          onClose();
                        }}
                      >
                        <View style={styles.customerListLeft}>
                          <View
                            style={[
                              styles.customerAvatar,
                              theme.dark ? styles.avatarDark : styles.avatarLight,
                            ]}
                          >
                            <User size={14} color={theme.colors.primary} />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.customerListName,
                                { color: theme.colors.text },
                              ]}
                            >
                              {customer.name}
                            </Text>
                            <Text
                              style={[
                                styles.customerListPhone,
                                { color: theme.colors.mutedText },
                              ]}
                            >
                              {customer.phone || 'No phone'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                      {onViewPastOrders && (
                        <Pressable
                          style={styles.pastOrdersButton}
                          onPress={() => onViewPastOrders(customer)}
                        >
                          <History
                            size={16}
                            color={theme.colors.primary}
                            strokeWidth={2}
                          />
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    marginBottom: 14,
  },
  tabContainerLight: {
    backgroundColor: '#F1F5F9',
  },
  tabContainerDark: {
    backgroundColor: '#1E293B',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12.5,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabTextInactive: {
    fontWeight: '500',
  },
  avatarLight: {
    backgroundColor: '#ECF8F6',
  },
  avatarDark: {
    backgroundColor: '#163330',
  },
  tabContent: {
    flexShrink: 1,
  },
  customerSearchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  customerList: {
    maxHeight: 260,
  },
  emptyListWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyListText: {
    fontSize: 12.5,
  },
  switchToAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchToAddBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  customerListItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerListContent: {
    flex: 1,
  },
  customerListLeft: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  customerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerListName: {
    fontSize: 13,
    fontWeight: '700',
  },
  customerListPhone: {
    fontSize: 11,
    marginTop: 1,
  },
  pastOrdersButton: {
    padding: 8,
    borderRadius: 6,
  },
});
