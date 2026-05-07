import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePOS } from '../hooks/usePOS';
import { TAB_ROUTES } from '../../../shared/constants/routes';
import { customers, scannedMedicine } from '../constants';
import { POSHeader } from '../components/POSHeader';
import { POSSearchRow } from '../components/POSSearchRow';
import { POSCustomerSection } from '../components/POSCustomerSection';
import { POSCartSection } from '../components/POSCartSection';
import { POSSummaryCard } from '../components/POSSummaryCard';
import { POSScanModal } from '../components/POSScanModal';
import { POSPaymentModal } from '../components/POSPaymentModal';
import { POSInvoiceModal } from '../components/POSInvoiceModal';
import { POSCustomerPickerModal } from '../components/POSCustomerPickerModal';
import { POSPastOrdersModal } from '../components/POSPastOrdersModal';
import { CartItem, Customer, PaymentMethod } from '../types';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';

export const POSScreen = () => {
  const { updateBillTotal } = usePOS();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [showScan, setShowScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountPercent, setDiscountPercent] = useState('0');

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems],
  );
  const gstAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.price * item.qty * item.gst) / 100,
        0,
      ),
    [cartItems],
  );
  const discountValue = useMemo(() => {
    const pct = Number(discountPercent) || 0;
    return (subtotal * pct) / 100;
  }, [discountPercent, subtotal]);
  const total = useMemo(
    () => Math.max(subtotal + gstAmount - discountValue, 0),
    [subtotal, gstAmount, discountValue],
  );

  useEffect(() => {
    updateBillTotal(Number(total.toFixed(2)));
  }, [total, updateBillTotal]);

  useEffect(() => {
    if (!showScan) {
      return;
    }

    setScanProgress(10);
    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(timer);
          setShowScan(false);
          addOrIncrementScannedItem();
          return 100;
        }
        return prev + 17;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [showScan]);

  const addOrIncrementScannedItem = () => {
    setCartItems(prev => {
      const idx = prev.findIndex(item => item.id === scannedMedicine.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, scannedMedicine];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item.id === id
            ? { ...item, qty: Math.max(1, item.qty + delta) }
            : item,
        )
        .filter(item => item.qty > 0),
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch.trim()),
      ),
    [customerSearch],
  );

  const onCompleteSale = () => {
    setShowPayment(false);
    setShowInvoice(true);
  };

  const onCloseInvoice = () => {
    setShowInvoice(false);
    setCartItems([]);
    setDiscountPercent('0');
  };

  const shareInvoice = async (channel?: 'whatsapp') => {
    const message = `Invoice INV-155654 for ${
      selectedCustomer?.name || 'Walk-in'
    } | Total ${formatAmount(total)}`;
    if (channel === 'whatsapp') {
      Alert.alert('WhatsApp', `Prepared message:\n${message}`);
      return;
    }

    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Share', 'Unable to share invoice right now.');
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 6,
          paddingBottom: Math.max(insets.bottom, 14) + 14,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <POSHeader
        itemCount={itemCount}
        onPressHistory={() =>
          navigation.getParent()?.navigate(TAB_ROUTES.ORDERS)
        }
      />
      <POSSearchRow
        searchText={searchText}
        onSearchChange={setSearchText}
        onPressScan={() => setShowScan(true)}
      />
      <POSCustomerSection
        selectedCustomer={selectedCustomer}
        onPressAddCustomer={() => setShowCustomerPicker(true)}
        onPressViewOrders={() => setShowPastOrders(true)}
        onPressRemoveCustomer={() => setSelectedCustomer(null)}
      />
      <POSCartSection
        cartItems={cartItems}
        onUpdateQty={updateQty}
        onRemoveItem={removeItem}
      />
      {cartItems.length > 0 ? (
        <POSSummaryCard
          subtotal={subtotal}
          gstAmount={gstAmount}
          discountPercent={discountPercent}
          onDiscountChange={setDiscountPercent}
          total={total}
          canProceed={true}
          onPressProceed={() => setShowPayment(true)}
        />
      ) : null}

      <POSScanModal
        visible={showScan}
        progress={scanProgress}
        onClose={() => setShowScan(false)}
      />
      <POSPaymentModal
        visible={showPayment}
        total={total}
        selectedCustomer={selectedCustomer}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        subtotal={subtotal}
        gstAmount={gstAmount}
        onClose={() => setShowPayment(false)}
        onCompleteSale={onCompleteSale}
      />
      <POSInvoiceModal
        visible={showInvoice}
        total={total}
        subtotal={subtotal}
        gstAmount={gstAmount}
        selectedCustomer={selectedCustomer}
        paymentMethod={paymentMethod}
        cartItems={cartItems}
        onPressDownload={() => Alert.alert('Download', 'Invoice downloaded')}
        onPressPrint={() => Alert.alert('Print', 'Print initiated')}
        onPressWhatsApp={() => shareInvoice('whatsapp')}
        onPressShare={() => shareInvoice()}
        onPressDone={onCloseInvoice}
      />
      <POSCustomerPickerModal
        visible={showCustomerPicker}
        searchValue={customerSearch}
        onSearchChange={setCustomerSearch}
        customers={filteredCustomers}
        onSelectCustomer={(customer: Customer) => {
          setSelectedCustomer(customer);
          setShowCustomerPicker(false);
        }}
        onClose={() => setShowCustomerPicker(false)}
      />
      <POSPastOrdersModal
        visible={showPastOrders}
        selectedCustomer={selectedCustomer}
        onClose={() => setShowPastOrders(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
});
