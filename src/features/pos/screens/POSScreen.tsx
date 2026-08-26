import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronRight, UserPlus, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STACK_ROUTES, TAB_ROUTES } from '../../../shared/constants/routes';
import { CartItem, CartItemAPI, Customer, CustomerLoyaltyInfo, Medicine, PaymentMethod, CreatePosInvoiceResponse } from '../types';
import { posService } from '../services/posService';
import { customerService } from '../../settings/services/customerService';
import { useAppTheme } from '../../../shared/theme';
import { POSHeader } from '../components/POSHeader';
import { POSSearchRow } from '../components/POSSearchRow';
import { POSCustomerSection } from '../components/POSCustomerSection';
import { POSCartSection } from '../components/POSCartSection';
import { POSSummaryCard } from '../components/POSSummaryCard';
import { POSScanModal } from '../components/POSScanModal';
import { POSPaymentModal, CompletedSaleContext } from '../components/POSPaymentModal';
import { POSInvoiceModal } from '../components/POSInvoiceModal';
import { POSOnlinePaymentModal } from '../components/POSOnlinePaymentModal';
import { POSCustomerPickerModal } from '../components/POSCustomerPickerModal';
import { POSPastOrdersModal } from '../components/POSPastOrdersModal';
import { POSItemDetailsModal } from '../components/POSItemDetailsModal';
import { POSStackParamList } from '../../../navigation/types';

const SCREEN_BOTTOM_PADDING = 30;

export const POSScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<POSStackParamList>>();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerList, setCustomerList] = useState<Customer[]>([]);

  const [showScan, setShowScan] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showOnlinePayment, setShowOnlinePayment] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<'search' | 'add'>('search');
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Item Details Modal (Warehouse / Batch picker)
  const [itemForDetails, setItemForDetails] = useState<CartItem | null>(null);
  const [isDetailsNewItem, setIsDetailsNewItem] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Amount'>('Percentage');
  const [discountValue, setDiscountValue] = useState('0');

  // Customer Loyalty State
  const [loyaltyInfo, setLoyaltyInfo] = useState<CustomerLoyaltyInfo | null>(null);
  const [redeemLoyalty, setRedeemLoyalty] = useState(false);

  // The Eph POS Cart backing this bill
  const [cartName, setCartName] = useState<string | null>(null);
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const [completedInvoice, setCompletedInvoice] =
    useState<CreatePosInvoiceResponse | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customerService.fetchCustomers();
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

  useFocusEffect(
    useCallback(() => {
      loadCustomers().catch(err => console.error(err));
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
        (sum, item) => sum + (item.price * item.qty * (item.gst || 0)) / 100,
        0,
      ),
    [cartItems],
  );
  const discountDeduction = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === 'Percentage') {
      return (subtotal * val) / 100;
    }
    return val;
  }, [discountType, discountValue, subtotal]);

  const loyaltyDeduction = useMemo(() => {
    if (!redeemLoyalty || !loyaltyInfo) return 0;
    return loyaltyInfo.redemption_value || 0;
  }, [redeemLoyalty, loyaltyInfo]);

  const total = useMemo(
    () => Math.max(subtotal + gstAmount - discountDeduction - loyaltyDeduction, 0),
    [subtotal, gstAmount, discountDeduction, loyaltyDeduction],
  );

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customerList;
    return customerList.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)),
    );
  }, [customerList, customerSearch]);

  const hasMissingBatches = useMemo(() => {
    return cartItems.some(
      item => item.has_batch_no && !(item.batch_no || item.batch),
    );
  }, [cartItems]);

  // Debounced auto-save cart to Frappe/ERPNext backend (500ms debounce)
  useEffect(() => {
    if (!selectedCustomer || cartItems.length === 0) {
      return;
    }

    const saveCurrentCart = async () => {
      try {
        const itemsToSave = cartItems.map(item => ({
          item_code: item.item_code || item.id,
          qty: item.qty,
          quantity: item.qty,
          rate: item.price,
          warehouse: item.warehouse || undefined,
          batch_no: item.batch_no || item.batch || undefined,
          discount_type: item.discount_type || undefined,
          discount_value: item.discount_value || undefined,
        }));

        const response = await posService.saveCart({
          customer: selectedCustomer.id,
          cart_name: cartName || undefined,
          items: itemsToSave,
        });

        if (response?.cart_name && !cartName) {
          setCartName(response.cart_name);
        }
      } catch (err) {
        console.warn('Debounced save_cart notice:', err);
      }
    };

    const timer = setTimeout(() => {
      saveCurrentCart().catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [cartItems, selectedCustomer, cartName]);

  // Mandatory Customer Selection Gates
  const handleOpenMedicineSearch = () => {
    if (!selectedCustomer) {
      setCustomerModalTab('search');
      setShowCustomerPicker(true);
      return;
    }

    navigation.navigate(STACK_ROUTES.POS_MEDICINE_LIST);
  };

  const handleOpenScan = () => {
    if (!selectedCustomer) {
      setCustomerModalTab('search');
      setShowCustomerPicker(true);
      return;
    }

    setShowScan(true);
  };

  // Pre-Cart Item Details Trigger: Opens Warehouse & Batch Modal FIRST
  const handleSelectMedicineForDetails = useCallback(
    (medicine: Medicine | CartItem) => {
      const itemCode =
        'item_code' in medicine && medicine.item_code
          ? medicine.item_code
          : 'id' in medicine
          ? (medicine as CartItem).id
          : '';
      const itemName =
        'item_name' in medicine && medicine.item_name
          ? medicine.item_name
          : 'name' in medicine
          ? (medicine as CartItem).name
          : '';

      const existingItem = cartItems.find(
        i => i.id === itemCode || i.item_code === itemCode,
      );

      if (existingItem) {
        setIsDetailsNewItem(false);
        setItemForDetails(existingItem);
      } else {
        setIsDetailsNewItem(true);
        const batch = 'batch' in medicine ? medicine.batch || '' : '';
        const exp =
          'expiry_date' in medicine
            ? medicine.expiry_date || ''
            : 'exp' in medicine
            ? (medicine as CartItem).exp || ''
            : '';
        const rate =
          'rate' in medicine
            ? medicine.rate || 0
            : 'price' in medicine
            ? (medicine as CartItem).price || 0
            : 0;
        const gst = 'gst' in medicine ? medicine.gst || 0 : 0;
        const warehouse = 'warehouse' in medicine ? medicine.warehouse || '' : '';
        const has_batch_no =
          'has_batch_no' in medicine
            ? (medicine as Medicine).has_batch_no ?? true
            : (medicine as CartItem).has_batch_no ?? true;

        setItemForDetails({
          id: itemCode,
          name: itemName,
          batch,
          batch_no: batch,
          exp,
          gst,
          price: rate,
          qty: 1,
          item_code: itemCode,
          rate,
          warehouse,
          has_batch_no,
        });
      }
      setShowItemDetails(true);
    },
    [cartItems],
  );

  // Listen for selected medicine returned from MedicineListScreen via event
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'POS_MEDICINE_SELECTED',
      (medicine: Medicine) => {
        handleSelectMedicineForDetails(medicine);
      },
    );
    return () => subscription.remove();
  }, [handleSelectMedicineForDetails]);

  // In-Cart Edit Item Details
  const handleOpenItemDetails = (item: CartItem) => {
    setIsDetailsNewItem(false);
    setItemForDetails(item);
    setShowItemDetails(true);
  };

  // Commit item after warehouse and batch have been confirmed in Modal
  const handleSaveItemDetails = (configuredItem: CartItem) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        i =>
          (i.id === configuredItem.id ||
            i.item_code === configuredItem.item_code) &&
          (i.batch_no === configuredItem.batch_no ||
            i.batch === configuredItem.batch),
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        if (isDetailsNewItem) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: updated[existingIndex].qty + configuredItem.qty,
            price: configuredItem.price,
            rate: configuredItem.rate,
            warehouse: configuredItem.warehouse,
            exp: configuredItem.exp,
          };
        } else {
          updated[existingIndex] = configuredItem;
        }
        return updated;
      } else {
        return [...prev, configuredItem];
      }
    });

    setShowItemDetails(false);
    setItemForDetails(null);
  };

  const addItemsFromPastOrder = useCallback((items: CartItem[]) => {
    setCartItems(prev => {
      const updated = [...prev];
      for (const newItem of items) {
        const existingIdx = updated.findIndex(
          item =>
            item.item_code === newItem.item_code || item.id === newItem.id,
        );

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            qty: updated[existingIdx].qty + newItem.qty,
          };
        } else {
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
    setShowCustomerPicker(false);

    // 1. Fetch Loyalty Info
    let customerWithLoyalty = { ...customer };
    if (customer.id !== 'Walk-in') {
      try {
        const loyalty = await posService.getCustomerLoyaltyInfo(customer.id);
        setLoyaltyInfo(loyalty);
        customerWithLoyalty.loyalty_points = loyalty.loyalty_points;
        customerWithLoyalty.loyalty_redemption_value = loyalty.redemption_value;
      } catch (err) {
        console.warn('Customer loyalty info not available:', err);
        setLoyaltyInfo(null);
      }
    } else {
      setLoyaltyInfo(null);
    }
    setSelectedCustomer(customerWithLoyalty);

    // 2. Fetch or assign cart for customer
    if (customer.id !== 'Walk-in') {
      try {
        const cartResponse = await posService.getOrAssignCart({
          customer: customer.id,
        });
        if (cartResponse?.cart_name) {
          setCartName(cartResponse.cart_name);
        }

        if (cartResponse?.items && cartResponse.items.length > 0) {
          const apiItems = cartResponse.items.map((item: CartItemAPI) => ({
            id: item.item_code,
            name: item.item_name,
            batch: item.batch_no || '',
            batch_no: item.batch_no || '',
            exp: '',
            gst: 0,
            price: item.rate,
            qty: Math.max(1, Math.floor(item.quantity)),
            item_code: item.item_code,
            rate: item.rate,
            warehouse: item.warehouse || '',
          }));

          setCartItems(prev => {
            const merged = [...prev];
            for (const apiItem of apiItems) {
              const existingIdx = merged.findIndex(
                item =>
                  item.item_code === apiItem.item_code ||
                  item.id === apiItem.id,
              );

              if (existingIdx >= 0) {
                merged[existingIdx] = {
                  ...merged[existingIdx],
                  qty: merged[existingIdx].qty + apiItem.qty,
                };
              } else {
                merged.push(apiItem);
              }
            }
            return merged;
          });
        }
      } catch (error) {
        console.error('Failed to get or assign cart:', error);
      }
    }
  }, []);

  const handleProceedToPayment = async () => {
    if (hasMissingBatches) {
      Alert.alert(
        'Batch Selection Required',
        'One or more medicines in your cart require a batch number. Tap the item to select a batch before proceeding.',
      );
      return;
    }

    // Force immediate cart save to ERP backend before opening preview
    if (selectedCustomer && selectedCustomer.id !== 'Walk-in' && cartItems.length > 0) {
      try {
        const itemsToSave = cartItems.map(item => ({
          item_code: item.item_code || item.id,
          qty: item.qty,
          quantity: item.qty,
          rate: item.price,
          warehouse: item.warehouse || undefined,
          batch_no: item.batch_no || item.batch || undefined,
          discount_type: item.discount_type || undefined,
          discount_value: item.discount_value || undefined,
        }));
        const saved = await posService.saveCart({
          customer: selectedCustomer.id,
          cart_name: cartName || undefined,
          items: itemsToSave,
        });
        if (saved?.cart_name) {
          setCartName(saved.cart_name);
        }
      } catch (err) {
        console.warn('Forced save cart before preview error:', err);
      }
    }

    setShowPayment(true);
  };

  const onCompleteSale = async (context: CompletedSaleContext) => {
    if (!selectedCustomer) return;
    setIsCompletingSale(true);

    try {
      const itemsPayload = cartItems.map(item => ({
        item_code: item.item_code || item.id,
        qty: item.qty,
        rate: item.price || item.rate || 0,
        warehouse: item.warehouse || undefined,
        batch_no: item.batch_no || item.batch || undefined,
        discount_type: item.discount_type || undefined,
        discount_value: item.discount_value || undefined,
      }));

      const isOnline = paymentMethod === 'Online';
      const paymentsPayload = isOnline
        ? []
        : [{ mode: paymentMethod, amount: context.grandTotal || total }];

      const invoiceResult = await posService.createPosInvoice({
        customer: selectedCustomer.id,
        payment_mode: isOnline ? 'Online' : 'Cash',
        payments: paymentsPayload,
        cart_name: cartName || undefined,
        items: itemsPayload,
        discount_approval_log: context.discountApprovalLog || undefined,
        rx_override_log: context.rxOverrideLog || undefined,
        margin_override_log: context.marginOverrideLog || undefined,
        prescription: context.prescription || undefined,
        redeem_loyalty_points: redeemLoyalty,
        loyalty_points_to_redeem: redeemLoyalty
          ? loyaltyInfo?.loyalty_points
          : undefined,
      });

      setShowPayment(false);
      setCompletedInvoice(invoiceResult);
      if (isOnline && invoiceResult.payment_link) {
        setShowOnlinePayment(true);
      } else {
        setShowInvoice(true);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err || 'Failed to create invoice.');
      if (msg.toLowerCase().includes('authentication failed') || msg.toLowerCase().includes('razorpay')) {
        Alert.alert(
          'Online Payment Gateway Error',
          'The backend Razorpay API credentials on ERPNext failed authentication. Please use "Cash" mode or configure valid Razorpay API keys in backend settings.',
        );
      } else {
        Alert.alert('Invoice Error', msg);
      }
    } finally {
      setIsCompletingSale(false);
    }
  };

  const onCloseInvoice = () => {
    setShowInvoice(false);
    setCompletedInvoice(null);
    setCartItems([]);
    setSelectedCustomer(null);
    setLoyaltyInfo(null);
    setRedeemLoyalty(false);
    setCartName(null);
    setDiscountValue('0');
    setDiscountType('Percentage');
  };

  const generateReceiptText = (
    invoice: CreatePosInvoiceResponse | null = completedInvoice,
  ) => {
    const invoiceId = invoice?.invoice ?? `INV-${Date.now().toString().slice(-6)}`;
    const customerName = selectedCustomer?.name || 'Walk-in Customer';
    const customerPhone = selectedCustomer?.phone || '';
    const dateStr = new Date().toLocaleString(undefined, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const line = '--------------------------------';
    const itemLines = cartItems
      .map(
        i =>
          `${i.name}\n  Qty: ${i.qty} x ₹${(i.rate ?? i.price ?? 0).toFixed(2)} = ₹${(
            (i.rate ?? i.price ?? 0) * i.qty
          ).toFixed(2)}${i.batch || i.batch_no ? ` (Batch: ${i.batch || i.batch_no})` : ''}`,
      )
      .join('\n');

    return [
      '================================',
      '       MEDPLUS PHARMACY         ',
      '   Plot 45, Jubilee Hills, Hyd  ',
      '    GSTIN: 36AABCU9603R1ZJ      ',
      '================================',
      `Invoice : ${invoiceId}`,
      `Date    : ${dateStr}`,
      `Customer: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`,
      `Payment : ${paymentMethod.toUpperCase()}`,
      line,
      'ITEMS:',
      itemLines,
      line,
      `Subtotal: ₹${subtotal.toFixed(2)}`,
      `GST Tax : ₹${gstAmount.toFixed(2)}`,
      `TOTAL   : ₹${(invoice?.grand_total ?? total).toFixed(2)}`,
      '================================',
      '   Thank you for your visit!    ',
      '================================',
    ].join('\n');
  };

  const downloadInvoice = async (invoice: CreatePosInvoiceResponse | null = completedInvoice) => {
    const receiptText = generateReceiptText(invoice);
    try {
      await Share.share({
        title: `Invoice - ${invoice?.invoice ?? 'Receipt'}`,
        message: receiptText,
      });
    } catch {
      Alert.alert('Download', 'Unable to export receipt right now.');
    }
  };

  const openInvoicePrintView = async (
    invoice: CreatePosInvoiceResponse | null = completedInvoice,
  ) => {
    const receiptText = generateReceiptText(invoice);
    try {
      await Share.share({
        title: `Print Receipt - ${invoice?.invoice ?? 'Receipt'}`,
        message: receiptText,
      });
    } catch {
      Alert.alert('Print', 'Unable to initiate print.');
    }
  };

  const shareInvoice = async (target?: 'whatsapp') => {
    const invoice = completedInvoice;
    const receiptText = generateReceiptText(invoice);

    if (target === 'whatsapp') {
      const cleanPhone = (selectedCustomer?.phone || '').replace(/[^0-9]/g, '');
      const waUrl = cleanPhone
        ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(receiptText)}`
        : `whatsapp://send?text=${encodeURIComponent(receiptText)}`;
      try {
        const canOpen = await Linking.canOpenURL(waUrl);
        if (canOpen) {
          await Linking.openURL(waUrl);
          return;
        }
      } catch {
        /* fallback to system share */
      }
    }

    try {
      await Share.share({
        title: `Invoice - ${invoice?.invoice ?? 'Receipt'}`,
        message: receiptText,
      });
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

      {/* When Customer is Selected: Show Customer Card, Search & Scan, and Cart */}
      {selectedCustomer ? (
        <>
          <POSCustomerSection
            selectedCustomer={selectedCustomer}
            onPressAddCustomer={() => {
              setCustomerModalTab('search');
              setShowCustomerPicker(true);
            }}
            onPressViewOrders={() => setShowPastOrders(true)}
            onPressRemoveCustomer={() => {
              setSelectedCustomer(null);
              setLoyaltyInfo(null);
              setRedeemLoyalty(false);
              setCartItems([]);
              setCartName(null);
            }}
          />

          <POSSearchRow
            onPressMedicineSearch={handleOpenMedicineSearch}
            onPressScan={handleOpenScan}
          />

          <POSCartSection
            cartItems={cartItems}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onPressItem={handleOpenItemDetails}
          />

          {cartItems.length > 0 ? (
            <POSSummaryCard
              subtotal={subtotal}
              gstAmount={gstAmount}
              discountType={discountType}
              onDiscountTypeChange={setDiscountType}
              discountValue={discountValue}
              onDiscountValueChange={setDiscountValue}
              total={total}
              loyaltyPoints={loyaltyInfo?.loyalty_points}
              loyaltyRedemptionValue={loyaltyInfo?.redemption_value}
              redeemLoyalty={redeemLoyalty}
              onToggleRedeemLoyalty={setRedeemLoyalty}
              canProceed={!hasMissingBatches}
              onPressProceed={handleProceedToPayment}
            />
          ) : null}
        </>
      ) : (
        /* When No Customer Selected: Sleek, non-redundant customer selection portal */
        <View style={styles.startSaleContainer}>
          <View style={styles.portalHeaderWrap}>
            <Text style={[styles.portalHeading, { color: theme.colors.text }]}>
              Start New Sale
            </Text>
            <Text style={[styles.portalSubheading, { color: theme.colors.mutedText }]}>
              Select an existing customer or register a new customer to start billing
            </Text>
          </View>

          {/* Option 1: Existing Customer */}
          <Pressable
            style={[
              styles.portalOptionCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => {
              setCustomerModalTab('search');
              setShowCustomerPicker(true);
            }}
          >
            <View
              style={[
                styles.portalOptionIconWrap,
                { backgroundColor: `${theme.colors.primary}18` },
              ]}
            >
              <Users size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.portalOptionTextWrap}>
              <Text
                style={[styles.portalOptionTitle, { color: theme.colors.text }]}
              >
                Select Existing Customer
              </Text>
              <Text
                style={[
                  styles.portalOptionDesc,
                  { color: theme.colors.mutedText },
                ]}
              >
                Search by name or phone to load loyalty points
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.mutedText} />
          </Pressable>

          {/* Option 2: Add New Customer */}
          <Pressable
            style={[
              styles.portalOptionCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => {
              setCustomerModalTab('add');
              setShowCustomerPicker(true);
            }}
          >
            <View
              style={[
                styles.portalOptionIconWrap,
                {
                  backgroundColor: `${theme.colors.primary}18`,
                },
              ]}
            >
              <UserPlus size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.portalOptionTextWrap}>
              <Text
                style={[styles.portalOptionTitle, { color: theme.colors.text }]}
              >
                Add New Customer
              </Text>
              <Text
                style={[
                  styles.portalOptionDesc,
                  { color: theme.colors.mutedText },
                ]}
              >
                Create a new profile with name, phone, email & address
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.mutedText} />
          </Pressable>
        </View>
      )}

      <POSScanModal
        visible={showScan}
        onMedicineScanned={handleSelectMedicineForDetails}
        onClose={() => setShowScan(false)}
      />
      <POSPaymentModal
        visible={showPayment}
        cartName={cartName}
        selectedCustomer={selectedCustomer}
        cartItems={cartItems}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        discountType={discountType}
        discountValue={discountValue}
        redeemLoyalty={redeemLoyalty}
        loyaltyPoints={redeemLoyalty ? loyaltyInfo?.loyalty_points : undefined}
        isSubmitting={isCompletingSale}
        onClose={() => setShowPayment(false)}
        onCompleteSale={onCompleteSale}
      />
      <POSInvoiceModal
        visible={showInvoice}
        invoiceName={completedInvoice?.invoice ?? null}
        paymentLink={completedInvoice?.payment_link ?? null}
        total={completedInvoice?.grand_total ?? total}
        subtotal={subtotal}
        gstAmount={gstAmount}
        selectedCustomer={selectedCustomer}
        paymentMethod={paymentMethod}
        cartItems={cartItems}
        onPressDownload={() => downloadInvoice()}
        onPressPrint={() => openInvoicePrintView()}
        onPressWhatsApp={() => shareInvoice('whatsapp')}
        onPressShare={() => shareInvoice()}
        onPressPaymentLink={() => setShowOnlinePayment(true)}
        onPressDone={onCloseInvoice}
      />
      <POSOnlinePaymentModal
        visible={showOnlinePayment}
        paymentUrl={completedInvoice?.payment_link ?? null}
        invoiceId={completedInvoice?.invoice ?? null}
        amount={completedInvoice?.grand_total ?? total}
        customerName={selectedCustomer?.name}
        customerPhone={selectedCustomer?.phone}
        onPaymentSuccess={() => {
          setShowOnlinePayment(false);
          setShowInvoice(true);
        }}
        onClose={() => {
          setShowOnlinePayment(false);
          setShowInvoice(true);
        }}
      />
      <POSCustomerPickerModal
        visible={showCustomerPicker}
        initialTab={customerModalTab}
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
      <POSItemDetailsModal
        visible={showItemDetails}
        item={itemForDetails}
        isNewItem={isDetailsNewItem}
        onClose={() => {
          setShowItemDetails(false);
          setItemForDetails(null);
        }}
        onSave={handleSaveItemDetails}
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
  startSaleContainer: {
    paddingTop: 16,
    gap: 12,
  },
  portalHeaderWrap: {
    marginBottom: 8,
  },
  portalHeading: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  portalSubheading: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  portalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  portalOptionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalOptionTextWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portalOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  fastBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fastBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  portalOptionDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
});
