import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
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
import { Building2, ChevronRight, Receipt, UserPlus, Users, Warehouse } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { STACK_ROUTES, TAB_ROUTES } from '../../../shared/constants/routes';
import { ActivePosSettings, CartItem, CartItemAPI, Customer, CustomerLoyaltyInfo, Medicine, PaymentMethod, CreatePosInvoiceResponse, CheckoutPreviewResponse } from '../types';
import { posService } from '../services/posService';
import { makeLineId } from '../utils';
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
import { CustomerFormModal } from '../../settings/components/CustomerFormModal';
import { POSPastOrdersModal } from '../components/POSPastOrdersModal';
import { POSItemDetailsModal } from '../components/POSItemDetailsModal';
import { POSStackParamList } from '../../../navigation/types';

const SCREEN_BOTTOM_PADDING = 30;

export const POSScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<POSStackParamList>>();
  const route =
    useRoute<RouteProp<POSStackParamList, typeof STACK_ROUTES.POS_HOME>>();

  // Which company/warehouse/tax template this session is billing under --
  // fetched once on mount, independent of any cart or customer, matching
  // the web POS's own header badge. Needs to be unmissable at a
  // multi-company pharmacy chain, not something a cashier has to notice
  // in passing.
  const [activePosSettings, setActivePosSettings] = useState<ActivePosSettings | null>(null);

  useEffect(() => {
    posService
      .getActivePosSettings()
      .then(setActivePosSettings)
      .catch(err => console.warn('Failed to load active POS settings:', err));
  }, []);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerList, setCustomerList] = useState<Customer[]>([]);

  const [showScan, setShowScan] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showOnlinePayment, setShowOnlinePayment] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
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

  // Server-computed totals (subtotal/tax/discount/grand total) -- the same
  // source of truth the web POS uses. Naive client math below only covers
  // the brief window before the cart has a cart_name / first preview.
  const [livePreview, setLivePreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Sent as client_seq on every save so the backend can drop a stale,
  // out-of-order save instead of letting it overwrite a newer one.
  const clientSeqRef = useRef(0);
  // Guards against an in-flight checkout_preview response landing after a
  // newer one and overwriting fresher totals with a stale result.
  const previewRequestIdRef = useRef(0);

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
  // Naive fallback for the brief window before the cart has a cart_name and
  // livePreview hasn't loaded yet -- intentionally ignores discount, since
  // there's no server total yet to reflect it correctly.
  const naiveSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems],
  );
  const naiveGstAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.price * item.qty * (item.gst || 0)) / 100,
        0,
      ),
    [cartItems],
  );

  // `subtotal` is the pre-discount raw sum from checkout_preview -- NOT the
  // same as ERPNext's `net_total`, which already has any discount (auto or
  // manual) baked into it by the time it reaches this response.
  const subtotal = livePreview ? livePreview.subtotal || 0 : naiveSubtotal;
  const gstAmount = livePreview ? livePreview.taxes || 0 : naiveGstAmount;
  const discountDeduction = livePreview
    ? livePreview.discount_amount || 0
    : (() => {
        const val = Number(discountValue) || 0;
        return discountType === 'Percentage' ? (naiveSubtotal * val) / 100 : val;
      })();
  const loyaltyDeduction = livePreview
    ? livePreview.loyalty_redemption_value || 0
    : redeemLoyalty && loyaltyInfo
    ? loyaltyInfo.redemption_value || 0
    : 0;
  const total = livePreview
    ? livePreview.rounded_total || livePreview.grand_total || 0
    : Math.max(naiveSubtotal + naiveGstAmount - discountDeduction - loyaltyDeduction, 0);

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

  // Debounced auto-save cart to Frappe/ERPNext backend (500ms debounce),
  // chained straight into a checkout_preview refresh -- mirrors the web
  // POS's usePOSCart.js pattern so the displayed subtotal/tax/total always
  // reflect what's actually persisted, not a client-side guess.
  useEffect(() => {
    if (!selectedCustomer || selectedCustomer.id === 'Walk-in' || cartItems.length === 0) {
      setLivePreview(null);
      return;
    }

    const saveAndPreview = async () => {
      const saveSeq = ++clientSeqRef.current;
      let nextCartName = cartName;
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
          client_seq: saveSeq,
        });

        // A newer edit already started its own save while this one was in
        // flight -- that newer save (and its own preview refresh) is the
        // source of truth now.
        if (saveSeq !== clientSeqRef.current) return;

        if (response?.cart_name) {
          nextCartName = response.cart_name;
          if (!cartName) setCartName(response.cart_name);
        }
      } catch (err) {
        console.warn('Debounced save_cart notice:', err);
        return;
      }

      if (!nextCartName) return;

      const previewSeq = ++previewRequestIdRef.current;
      setIsPreviewLoading(true);
      try {
        const preview = await posService.checkoutPreview({
          cart_name: nextCartName,
          discount_type: discountType,
          discount_value: Number(discountValue) || 0,
          redeem_loyalty: redeemLoyalty ? 1 : 0,
          loyalty_points: redeemLoyalty ? loyaltyInfo?.loyalty_points || 0 : 0,
        });
        if (previewSeq === previewRequestIdRef.current) {
          setLivePreview(preview);
        }
      } catch (err) {
        console.warn('checkout_preview notice:', err);
        if (previewSeq === previewRequestIdRef.current) {
          setLivePreview(null);
        }
      } finally {
        if (previewSeq === previewRequestIdRef.current) {
          setIsPreviewLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      saveAndPreview().catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [
    cartItems,
    selectedCustomer,
    cartName,
    discountType,
    discountValue,
    redeemLoyalty,
    loyaltyInfo,
  ]);

  // Mandatory Customer Selection Gates
  const handleOpenMedicineSearch = () => {
    if (!selectedCustomer) {
      setShowCustomerPicker(true);
      return;
    }

    navigation.navigate(STACK_ROUTES.POS_MEDICINE_LIST);
  };

  const handleOpenScan = () => {
    if (!selectedCustomer) {
      setShowCustomerPicker(true);
      return;
    }

    setShowScan(true);
  };

  // Dashboard's "Scan" quick action deep-links here with autoOpenScan --
  // previously it just navigated to the POS tab with no params, landing on
  // plain POS Billing with the scanner never opening at all. Goes through
  // the same handleOpenScan gate as the in-screen Scan button (customer
  // picker first if none selected yet), rather than forcing the camera
  // open regardless. Clears the param immediately so navigating away and
  // back doesn't reopen the scanner on its own.
  useEffect(() => {
    if (route.params?.autoOpenScan) {
      handleOpenScan();
      navigation.setParams({ autoOpenScan: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.autoOpenScan]);

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
      if (!isDetailsNewItem) {
        // Editing a row already in the cart -- `configuredItem` carries
        // the same line_id it was opened with (POSItemDetailsModal spreads
        // `...item` into what it saves), so just replace that exact row.
        // Matching by item_code/batch here (like the add path below) would
        // be wrong: editing a row's warehouse/batch to now match a
        // DIFFERENT existing row must still only change the one row the
        // cashier opened, never silently merge into another.
        const targetLineId = configuredItem.line_id;
        const idx = targetLineId
          ? prev.findIndex(i => i.line_id === targetLineId)
          : prev.findIndex(
              i => i.id === configuredItem.id || i.item_code === configuredItem.item_code,
            );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = configuredItem;
          return updated;
        }
        return [...prev, { ...configuredItem, line_id: configuredItem.line_id || makeLineId(configuredItem.item_code || configuredItem.id) }];
      }

      // Adding a fresh item -- same line = same item, same warehouse,
      // same batch. Differing in warehouse or batch is a genuinely
      // separate cart line, not a quantity bump on whichever row happens
      // to share the item_code.
      const existingIndex = prev.findIndex(
        i =>
          (i.id === configuredItem.id || i.item_code === configuredItem.item_code) &&
          (i.warehouse || '') === (configuredItem.warehouse || '') &&
          (i.batch_no || i.batch || '') === (configuredItem.batch_no || configuredItem.batch || ''),
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + configuredItem.qty,
          price: configuredItem.price,
          rate: configuredItem.rate,
          warehouse: configuredItem.warehouse,
          exp: configuredItem.exp,
        };
        return updated;
      }

      return [
        ...prev,
        { ...configuredItem, line_id: makeLineId(configuredItem.item_code || configuredItem.id) },
      ];
    });

    setShowItemDetails(false);
    setItemForDetails(null);
  };

  const addItemsFromPastOrder = useCallback((items: CartItem[]) => {
    setCartItems(prev => {
      const updated = [...prev];
      for (const newItem of items) {
        // Same (item, warehouse, batch) identity rule as
        // handleSaveItemDetails -- a past-order line differing in
        // warehouse or batch from anything already in the cart is a
        // distinct line, not a quantity bump on the first row that
        // happens to share its item_code.
        const existingIdx = updated.findIndex(
          item =>
            (item.item_code === newItem.item_code || item.id === newItem.id) &&
            (item.warehouse || '') === (newItem.warehouse || '') &&
            (item.batch_no || item.batch || '') === (newItem.batch_no || newItem.batch || ''),
        );

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            qty: updated[existingIdx].qty + newItem.qty,
          };
        } else {
          updated.push({
            ...newItem,
            line_id: newItem.line_id || makeLineId(newItem.item_code || newItem.id),
          });
        }
      }
      return updated;
    });
  }, []);

  // Matched by line_id, not item_code -- two rows can validly share an
  // item_code (same medicine from a different warehouse/batch), and
  // matching on item_code alone bumped/removed every row that shared it,
  // not just the one the cashier tapped. Falls back to id/item_code only
  // for a row that somehow never got a line_id (shouldn't happen once
  // every add path assigns one, but keeps this from silently no-oping).
  const updateQty = (lineId: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          (item.line_id ? item.line_id === lineId : item.id === lineId || item.item_code === lineId)
            ? { ...item, qty: Math.max(1, item.qty + delta) }
            : item,
        )
        .filter(item => item.qty > 0),
    );
  };

  const removeItem = (lineId: string) => {
    setCartItems(prev =>
      prev.filter(item =>
        item.line_id
          ? item.line_id !== lineId
          : item.id !== lineId && item.item_code !== lineId,
      ),
    );
  };

  const handleSelectCustomer = useCallback(async (customer: Customer) => {
    setShowCustomerPicker(false);
    setShowAddCustomerModal(false);

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
            line_id: makeLineId(item.item_code),
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
            // Without this, hasMissingBatches's `item.has_batch_no && ...`
            // check silently passes every resumed item (falsy short-
            // circuits it), even ones that genuinely need a batch --
            // get_or_assign_cart already returns this flag per item.
            has_batch_no: Boolean(item.has_batch_no),
          }));

          setCartItems(prev => {
            const merged = [...prev];
            for (const apiItem of apiItems) {
              // Same (item, warehouse, batch) identity rule as
              // handleSaveItemDetails -- a local item differing in
              // warehouse/batch from anything the backend returned is a
              // distinct line, not a quantity bump on the first row that
              // happens to share its item_code.
              const existingIdx = merged.findIndex(
                item =>
                  (item.item_code === apiItem.item_code || item.id === apiItem.id) &&
                  (item.warehouse || '') === (apiItem.warehouse || '') &&
                  (item.batch_no || item.batch || '') === (apiItem.batch_no || apiItem.batch || ''),
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
          client_seq: ++clientSeqRef.current,
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
        // The bill-level discount previewed/approved in POSPaymentModal was
        // never actually sent here -- create_pos_invoice reads these same
        // two fields (apply_discount()) to apply it to the real invoice, so
        // without them the approved discount silently didn't make it onto
        // the invoice that gets billed.
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        discount_approval_log: context.discountApprovalLog || undefined,
        rx_override_log: context.rxOverrideLog || undefined,
        margin_override_log: context.marginOverrideLog || undefined,
        prescription: context.prescription || undefined,
        // create_pos_invoice's apply_loyalty() reads redeem_loyalty /
        // loyalty_points -- the same field names checkout_preview uses --
        // not redeem_loyalty_points / loyalty_points_to_redeem, which it
        // never looks at. Previewed loyalty redemption was being silently
        // dropped from the actual invoice.
        redeem_loyalty: redeemLoyalty ? 1 : 0,
        loyalty_points: redeemLoyalty ? loyaltyInfo?.loyalty_points || 0 : undefined,
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

      {activePosSettings?.company ? (
        <View
          style={[
            styles.activeSettingsBanner,
            {
              borderColor: `${theme.colors.primary}33`,
              backgroundColor: `${theme.colors.primary}0D`,
            },
          ]}
        >
          <View style={styles.activeSettingsRow}>
            <Building2 size={13} color={theme.colors.primary} />
            <Text style={[styles.activeSettingsLabel, { color: theme.colors.mutedText }]}>
              Billing as
            </Text>
            <Text style={[styles.activeSettingsValue, { color: theme.colors.primary }]}>
              {activePosSettings.company}
            </Text>
          </View>
          {activePosSettings.warehouse ? (
            <View style={styles.activeSettingsRow}>
              <Warehouse size={13} color={theme.colors.mutedText} />
              <Text style={[styles.activeSettingsValue, { color: theme.colors.text }]}>
                {activePosSettings.warehouse}
              </Text>
            </View>
          ) : null}
          {activePosSettings.taxes_and_charges ? (
            <View style={styles.activeSettingsRow}>
              <Receipt size={13} color={theme.colors.mutedText} />
              <Text style={[styles.activeSettingsValue, { color: theme.colors.text }]}>
                {activePosSettings.taxes_and_charges}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* When Customer is Selected: Show Customer Card, Search & Scan, and Cart */}
      {selectedCustomer ? (
        <>
          <POSCustomerSection
            selectedCustomer={selectedCustomer}
            onPressAddCustomer={() => {
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
              discountAmount={discountDeduction}
              total={total}
              loyaltyPoints={loyaltyInfo?.loyalty_points}
              loyaltyRedemptionValue={loyaltyInfo?.redemption_value}
              redeemLoyalty={redeemLoyalty}
              onToggleRedeemLoyalty={setRedeemLoyalty}
              canProceed={!hasMissingBatches}
              isPreviewLoading={isPreviewLoading}
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
              setShowAddCustomerModal(true);
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
        searchValue={customerSearch}
        onSearchChange={setCustomerSearch}
        customers={filteredCustomers}
        onSelectCustomer={handleSelectCustomer}
        onViewPastOrders={(customer: Customer) => {
          setSelectedCustomer(customer);
          setShowPastOrders(true);
        }}
        onPressAddNewCustomer={() => {
          setShowCustomerPicker(false);
          setShowAddCustomerModal(true);
        }}
        onClose={() => setShowCustomerPicker(false)}
      />
      <CustomerFormModal
        visible={showAddCustomerModal}
        mode="create"
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={result => {
          setShowAddCustomerModal(false);
          handleSelectCustomer({
            id: result.customerName,
            name: result.customerName,
            phone: result.phone,
            loyalty_points: 0,
            loyalty_redemption_value: 0,
          }).catch(error => {
            console.error('Failed to select newly created customer:', error);
          });
          customerService.fetchCustomers().then(data => {
            setCustomerList(
              data.map(c => ({
                id: c.customer_code || '',
                name: c.customer_name || '',
                phone: c.contact?.mobile || '',
                loyalty_points: 0,
                loyalty_redemption_value: 0,
              })),
            );
          }).catch(error => {
            console.error('Failed to reload customer list:', error);
          });
        }}
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
  activeSettingsBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  activeSettingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeSettingsLabel: {
    fontSize: 11,
  },
  activeSettingsValue: {
    fontSize: 11.5,
    fontWeight: '700',
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
