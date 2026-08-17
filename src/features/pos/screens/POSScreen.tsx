import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePOS } from '../hooks/usePOS';
import { TAB_ROUTES, STACK_ROUTES } from '../../../shared/constants/routes';
import { SCREEN_BOTTOM_PADDING } from '../../../shared/constants/layout';
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
import {
  CartItem,
  Customer,
  PaymentMethod,
  Medicine,
  CartItemAPI,
} from '../types';
import { formatAmount } from '../utils';
import { posService } from '../services/posService';
import { customerService } from '../../settings/services/customerService';
import { useAppTheme } from '../../../shared/theme';

export const POSScreen = () => {
  const { updateBillTotal } = usePOS();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerList, setCustomerList] = useState<Customer[]>([]);

  const [showScan, setShowScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountPercent, setDiscountPercent] = useState('0');

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customerService.fetchCustomers();
      // Map customer service response to Customer type
      setCustomerList(
        data.map(c => ({
          id: c.customer_code || '',
          name: c.customer_name || '',
          phone: c.contact?.mobile || '',
        })),
      );
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  // Load customers when screen is focused
  useFocusEffect(
    useCallback(() => {
      void loadCustomers();
    }, [loadCustomers]),
  );

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

  // Scan effect (Dummy scanner animation)
  useEffect(() => {
    if (!showScan) {
      return;
    }

    setScanProgress(10);
    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(timer);
          // Removed the dummy auto-adding of Omeprazole here!
          // addOrIncrementScannedItem();
          
          setShowScan(false);
          return 100;
        }
        return prev + 17;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [showScan]);

  // Save cart whenever items change
  useEffect(() => {
    if (cartItems.length === 0 || !selectedCustomer) {
      return;
    }

    const saveCurrentCart = async () => {
      try {
        const itemsToSave = cartItems.map(item => ({
          item_code: item.item_code || item.id,
          qty: item.qty,
          rate: item.price,
        }));

        await posService.saveCart({
          customer: selectedCustomer.id,
          items: itemsToSave,
        });
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    };

    // Debounce the save operation
    const timer = setTimeout(() => {
      void saveCurrentCart();
    }, 1000);

    return () => clearTimeout(timer);
  }, [cartItems, selectedCustomer]);

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

  const addMedicineToCart = useCallback((medicine: Medicine) => {
    setCartItems(prev => {
      // Check if medicine already exists in cart
      const existingIdx = prev.findIndex(
        item => item.item_code === medicine.item_code,
      );

      if (existingIdx >= 0) {
        // Increment quantity if exists
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + 1,
        };
        return updated;
      }

      // Add new medicine
      return [
        ...prev,
        {
          id: medicine.item_code,
          name: medicine.item_name || '',
          batch: medicine.batch || '',
          exp: medicine.expiry_date || '',
          gst: medicine.gst || 0,
          price: medicine.rate || 0,
          qty: 1,
          item_code: medicine.item_code,
          rate: medicine.rate,
        },
      ];
    });
  }, []);

  const addItemsFromPastOrder = useCallback((items: CartItem[]) => {
    setCartItems(prev => {
      const updated = [...prev];

      for (const newItem of items) {
        const existingIdx = updated.findIndex(
          item =>
            item.item_code === newItem.item_code || item.id === newItem.id,
        );

        if (existingIdx >= 0) {
          // Increment quantity
          updated[existingIdx] = {
            ...updated[existingIdx],
            qty: updated[existingIdx].qty + newItem.qty,
          };
        } else {
          // Add new item
          updated.push(newItem);
        }
      }

      return updated;
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item.id === id || item.item_code === id
            ? { ...item, qty: Math.max(1, item.qty + delta) }
            : item,
        )
        .filter(item => item.qty > 0),
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev =>
      prev.filter(item => item.id !== id && item.item_code !== id),
    );
  };

  const handleSelectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerPicker(false);

    // Fetch or assign cart for the selected customer
    try {
      const cartResponse = await posService.getOrAssignCart({
        customer: customer.id,
        cart_name: '',
      });

      // Merge existing items with API cart items
      if (cartResponse.items && cartResponse.items.length > 0) {
        const apiItems = cartResponse.items.map((item: CartItemAPI) => ({
          id: item.item_code,
          name: item.item_name,
          batch: item.batch || '',
          exp: '',
          gst: 0,
          price: item.rate,
          qty: Math.max(1, Math.floor(item.quantity)),
          item_code: item.item_code,
          rate: item.rate,
        }));

        // Merge with existing cart items
        setCartItems(prev => {
          const merged = [...prev];
          for (const apiItem of apiItems) {
            const existingIdx = merged.findIndex(
              item =>
                item.item_code === apiItem.item_code || item.id === apiItem.id,
            );

            if (existingIdx >= 0) {
              // Update quantity
              merged[existingIdx] = {
                ...merged[existingIdx],
                qty: merged[existingIdx].qty + apiItem.qty,
              };
            } else {
              // Add new item
              merged.push(apiItem);
            }
          }
          return merged;
        });
      }
    } catch (error) {
      console.error('Failed to get or assign cart:', error);
      // Continue without cart data if API fails
    }
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customerList.filter(
        c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch.trim()),
      ),
    [customerSearch, customerList],
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
          paddingBottom: Math.max(insets.bottom, 10) + SCREEN_BOTTOM_PADDING,
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
        onPressMedicineSearch={() =>
          navigation.navigate(STACK_ROUTES.POS_MEDICINE_LIST, {
            onMedicineSelected: addMedicineToCart,
          })
        }
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
        onSelectCustomer={handleSelectCustomer}
        onViewPastOrders={(customer: Customer) => {
          setSelectedCustomer(customer);
          setShowPastOrders(true);
        }}
        onClose={() => setShowCustomerPicker(false)}
      />
      <POSPastOrdersModal
        visible={showPastOrders}
        selectedCustomer={selectedCustomer}
        onAddItemsToCart={addItemsFromPastOrder}
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
