import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Calculator,
  Check,
  FileWarning,
  Info,
  KeyRound,
  Layers,
  Receipt,
  ShieldX,
  User,
  X,
} from 'lucide-react-native';
import { Customer, PaymentMethod, CheckoutPreviewResponse, CartItem } from '../types';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';
import { posService } from '../services/posService';
import { SearchableDropdown, DropdownOption } from '../../../shared/components/SearchableDropdown';

// Manager Approval Log.override_reason is a fixed Select field on the
// backend doctype -- these must match its options exactly (same list the
// web POS's CheckoutPreviewModal uses).
const RX_OVERRIDE_REASON_OPTIONS: DropdownOption[] = [
  { value: 'Emergency', description: 'Emergency' },
  { value: 'Verbal Consent', description: 'Verbal Consent' },
  { value: 'Doctor On Call', description: 'Doctor On Call' },
  { value: 'Special Case', description: 'Special Case' },
  { value: 'Customer Retention', description: 'Customer Retention' },
  { value: 'Price Match', description: 'Price Match' },
];

export type CompletedSaleContext = {
  grandTotal: number;
  discountApprovalLog: string;
  rxOverrideLog: string;
  marginOverrideLog: string;
  prescription: string;
};

type Props = {
  visible: boolean;
  cartName: string | null;
  selectedCustomer: Customer | null;
  cartItems?: CartItem[];
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  discountType?: 'Percentage' | 'Amount';
  discountValue?: string;
  discountPercent?: string;
  redeemLoyalty?: boolean;
  loyaltyPoints?: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onCompleteSale: (context: CompletedSaleContext) => void;
};

export const POSPaymentModal = ({
  visible,
  cartName,
  selectedCustomer,
  cartItems = [],
  paymentMethod,
  setPaymentMethod,
  discountType = 'Percentage',
  discountValue,
  discountPercent,
  redeemLoyalty = false,
  loyaltyPoints,
  isSubmitting = false,
  onClose,
  onCompleteSale,
}: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);

  const [managerOptions, setManagerOptions] = useState<DropdownOption[]>([]);

  // Cash Amount Input State (defaults to rounded total)
  const [cashTendered, setCashTendered] = useState('');

  // Discount approval
  const [discountApprovalLog, setDiscountApprovalLog] = useState('');
  const [discountManagerUser, setDiscountManagerUser] = useState('');
  const [discountManagerPin, setDiscountManagerPin] = useState('');
  const [isRequestingDiscountOverride, setIsRequestingDiscountOverride] = useState(false);
  const [isSubmittingDiscountOverride, setIsSubmittingDiscountOverride] = useState(false);

  // Prescription override
  const [rxApprovalLog, setRxApprovalLog] = useState('');
  const [rxOverrideLog, setRxOverrideLog] = useState('');
  const [rxManagerUser, setRxManagerUser] = useState('');
  const [rxManagerPin, setRxManagerPin] = useState('');
  const [rxOverrideReason, setRxOverrideReason] = useState('');
  const [isRequestingRxOverride, setIsRequestingRxOverride] = useState(false);
  const [isSubmittingRxOverride, setIsSubmittingRxOverride] = useState(false);

  // Margin override
  const [marginApprovalLog, setMarginApprovalLog] = useState('');
  const [marginOverrideLog, setMarginOverrideLog] = useState('');
  const [marginManagerUser, setMarginManagerUser] = useState('');
  const [marginManagerPin, setMarginManagerPin] = useState('');
  const [marginRemarks, setMarginRemarks] = useState('Approved by manager');
  const [isRequestingMarginOverride, setIsRequestingMarginOverride] = useState(false);
  const [isSubmittingMarginOverride, setIsSubmittingMarginOverride] = useState(false);

  // Reset everything and fetch a fresh preview whenever the sheet opens.
  useEffect(() => {
    if (!visible || !cartName) {
      return;
    }

    setPreview(null);
    setPreviewError(null);
    setCashTendered('');
    setDiscountApprovalLog('');
    setDiscountManagerUser('');
    setDiscountManagerPin('');
    setRxApprovalLog('');
    setRxOverrideLog('');
    setRxManagerUser('');
    setRxManagerPin('');
    setRxOverrideReason('');
    setMarginApprovalLog('');
    setMarginOverrideLog('');
    setMarginManagerUser('');
    setMarginManagerPin('');
    setMarginRemarks('Approved by manager');

    const valToUse = Number(discountValue ?? discountPercent) || 0;

    let cancelled = false;
    setIsLoadingPreview(true);
    posService
      .checkoutPreview({
        cart_name: cartName,
        discount_value: valToUse,
        discount_type: discountType,
        redeem_loyalty: redeemLoyalty ? 1 : 0,
        loyalty_points: redeemLoyalty ? loyaltyPoints || 0 : 0,
      })
      .then(result => {
        if (!cancelled) {
          setPreview(result);
          const finalTotal = result?.rounded_total ?? result?.grand_total ?? 0;
          setCashTendered(finalTotal > 0 ? String(finalTotal) : '');
        }
      })
      .catch(err => {
        if (!cancelled) {
          setPreviewError(
            err instanceof Error ? err.message : 'Unable to load checkout preview.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPreview(false);
      });

    posService
      .getManagerUsers()
      .then(users => {
        if (!cancelled) {
          setManagerOptions(users.map(u => ({ value: u.value, description: u.label })));
        }
      })
      .catch(() => {
        /* non-fatal -- manager pickers just show empty */
      });

    return () => {
      cancelled = true;
    };
  }, [visible, cartName, discountType, discountValue, discountPercent, redeemLoyalty, loyaltyPoints]);

  const prescriptionCheck = preview?.prescription_check;
  const prescriptionRequired = !!prescriptionCheck?.prescription_required;
  const prescriptionOnFile = !!prescriptionCheck?.prescription_found;
  const prescriptionSatisfied = !prescriptionRequired || prescriptionOnFile || !!rxOverrideLog;

  const marginCheck = preview?.margin_check;
  const marginViolations = marginCheck?.violations || [];
  const marginBlocked = !!marginCheck?.blocked;
  const marginNeedsOverride = !!marginCheck?.requires_override;
  const marginSatisfied = !marginNeedsOverride || !!marginOverrideLog;
  const marginWarnOnly = marginViolations.length > 0 && !marginBlocked && !marginNeedsOverride;

  const discountApprovalNeeded = !!preview?.discount_approval_needed;
  const discountSatisfied = !discountApprovalNeeded || !!discountApprovalLog;

  const canComplete =
    !isLoadingPreview &&
    !previewError &&
    !!preview &&
    discountSatisfied &&
    prescriptionSatisfied &&
    !marginBlocked &&
    marginSatisfied &&
    !isSubmitting;

  const handleRequestDiscountOverride = async () => {
    if (!cartName) return;
    setIsRequestingDiscountOverride(true);
    try {
      const valToUse = Number(discountValue ?? discountPercent) || 0;
      const result = await posService.requestApproval({
        approval_type: 'Discount Override',
        cart_name: cartName,
        discount_requested: valToUse,
        discount_type: discountType,
        role_limit: preview?.role_limit ?? 0,
        remarks: `Discount ${discountType} above role limit`,
      });
      setDiscountApprovalLog(result.approval_log);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to request override');
    } finally {
      setIsRequestingDiscountOverride(false);
    }
  };

  const handleSubmitDiscountOverride = async () => {
    if (!discountApprovalLog || !discountManagerUser || !discountManagerPin) return;
    setIsSubmittingDiscountOverride(true);
    try {
      const result = await posService.submitApproval({
        approval_log: discountApprovalLog,
        manager_user: discountManagerUser,
        pin: discountManagerPin,
      });
      if (result.success === false) {
        setPreviewError(result.message || 'Incorrect PIN. Please try again.');
        return;
      }
      setDiscountManagerPin('');
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to submit approval');
    } finally {
      setIsSubmittingDiscountOverride(false);
    }
  };

  const handleRequestRxOverride = async () => {
    if (!cartName || !rxOverrideReason) return;
    setIsRequestingRxOverride(true);
    try {
      const result = await posService.requestApproval({
        approval_type: 'Prescription Override',
        cart_name: cartName,
        item_code: prescriptionCheck?.restricted_items?.[0] || '',
        override_reason: rxOverrideReason,
        remarks: rxOverrideReason,
      });
      setRxApprovalLog(result.approval_log);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to request override');
    } finally {
      setIsRequestingRxOverride(false);
    }
  };

  const handleSubmitRxOverride = async () => {
    if (!rxApprovalLog || !rxManagerUser || !rxManagerPin) return;
    setIsSubmittingRxOverride(true);
    try {
      const result = await posService.submitApproval({
        approval_log: rxApprovalLog,
        manager_user: rxManagerUser,
        pin: rxManagerPin,
      });
      if (result.success === false) {
        setPreviewError(result.message || 'Incorrect PIN. Please try again.');
        return;
      }
      setRxOverrideLog(result.approval_log || rxApprovalLog);
      setRxManagerPin('');
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to submit approval');
    } finally {
      setIsSubmittingRxOverride(false);
    }
  };

  const handleRequestMarginOverride = async () => {
    if (!cartName) return;
    setIsRequestingMarginOverride(true);
    try {
      const worst = marginViolations.find(v => v.enforcement_action === 'Require Admin Override');
      const result = await posService.requestApproval({
        approval_type: 'Margin Override',
        cart_name: cartName,
        item_code: (worst?.item_code as string) || '',
        remarks: marginRemarks,
      });
      setMarginApprovalLog(result.approval_log);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to request override');
    } finally {
      setIsRequestingMarginOverride(false);
    }
  };

  const handleSubmitMarginOverride = async () => {
    if (!marginApprovalLog || !marginManagerUser || !marginManagerPin) return;
    setIsSubmittingMarginOverride(true);
    try {
      const result = await posService.submitApproval({
        approval_log: marginApprovalLog,
        manager_user: marginManagerUser,
        pin: marginManagerPin,
      });
      if (result.success === false) {
        setPreviewError(result.message || 'Incorrect PIN. Please try again.');
        return;
      }
      setMarginOverrideLog(result.approval_log || marginApprovalLog);
      setMarginManagerPin('');
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to submit approval');
    } finally {
      setIsSubmittingMarginOverride(false);
    }
  };

  const handleComplete = () => {
    if (!canComplete || !preview) return;
    onCompleteSale({
      grandTotal: preview.rounded_total || preview.grand_total,
      discountApprovalLog,
      rxOverrideLog,
      marginOverrideLog,
      prescription: prescriptionOnFile ? prescriptionCheck?.prescription || '' : '',
    });
  };

  const netTotal = preview?.net_total ?? 0;
  const discountAmount = preview?.discount_amount ?? 0;
  const taxes = preview?.taxes ?? 0;
  const grandTotal = preview?.grand_total ?? 0;
  const roundedTotal = preview?.rounded_total ?? grandTotal;
  const cashAmountNum = Number(cashTendered) || 0;
  const changeToReturn = cashAmountNum > roundedTotal ? cashAmountNum - roundedTotal : 0;
  const bottomPadding = Math.max(insets.bottom, 20) + 12;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {/* Header - Matching Web POS Checkout Preview */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <Receipt size={20} color={theme.colors.primary} />
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                Checkout Preview
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          {isLoadingPreview ? (
            <View style={styles.previewLoading}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={[styles.previewLoadingText, { color: theme.colors.mutedText }]}>
                Calculating totals & checking compliance...
              </Text>
            </View>
          ) : previewError && !preview ? (
            <View style={styles.previewLoading}>
              <Text style={styles.errorText}>{previewError}</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Customer Tag */}
              {selectedCustomer && (
                <View
                  style={[
                    styles.customerTag,
                    theme.dark ? styles.customerTagDark : styles.customerTagLight,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <User size={14} color={theme.colors.primary} />
                  <Text style={[styles.customerTagText, { color: theme.colors.text }]}>
                    Customer: <Text style={styles.bold700}>{selectedCustomer.name}</Text>
                    {selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}
                  </Text>
                </View>
              )}

              {/* 1. Invoice Cart Items (Matching Web POS left column) */}
              <View
                style={[
                  styles.sectionCard,
                  theme.dark ? styles.sectionCardDark : styles.sectionCardLight,
                  { borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Layers size={16} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Invoice Cart Items ({cartItems.length})
                  </Text>
                </View>

                {/* Table Header */}
                <View
                  style={[
                    styles.itemTableHeader,
                    theme.dark ? styles.itemTableHeaderDark : styles.itemTableHeaderLight,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <Text style={[styles.thText, styles.thMedicine, { color: theme.colors.mutedText }]}>
                    Medicine
                  </Text>
                  <Text style={[styles.thText, styles.thQty, { color: theme.colors.mutedText }]}>
                    Qty
                  </Text>
                  <Text style={[styles.thText, styles.thRate, { color: theme.colors.mutedText }]}>
                    Rate
                  </Text>
                  <Text style={[styles.thText, styles.thDisc, { color: theme.colors.mutedText }]}>
                    Disc
                  </Text>
                  <Text style={[styles.thText, styles.thAmount, { color: theme.colors.mutedText }]}>
                    Amount
                  </Text>
                </View>

                {/* Item Rows */}
                {cartItems.map((cartItem, idx) => {
                  const itemRate = cartItem.rate ?? cartItem.price ?? 0;
                  const itemLineTotal = itemRate * cartItem.qty;
                  const hasItemDiscount = Boolean(cartItem.discount_value && cartItem.discount_value > 0);
                  const isLast = idx === cartItems.length - 1;

                  return (
                    <View
                      key={`preview-item-${cartItem.id}-${idx}`}
                      style={[
                        styles.itemTableRow,
                        !isLast && [styles.itemTableRowBorder, { borderBottomColor: theme.colors.border }],
                      ]}
                    >
                      <View style={styles.thMedicine}>
                        <Text
                          style={[styles.itemName, { color: theme.colors.text }]}
                          numberOfLines={1}
                        >
                          {cartItem.name}
                        </Text>
                        <Text style={[styles.itemSubtext, { color: theme.colors.mutedText }]}>
                          {cartItem.item_code || cartItem.id}
                          {cartItem.batch || cartItem.batch_no
                            ? ` • Batch: ${cartItem.batch || cartItem.batch_no}`
                            : ''}
                        </Text>
                      </View>

                      <Text style={[styles.itemValue, styles.thQty, { color: theme.colors.text }]}>
                        {cartItem.qty}
                      </Text>

                      <Text style={[styles.itemValue, styles.thRate, { color: theme.colors.text }]}>
                        {formatAmount(itemRate)}
                      </Text>

                      <View style={[styles.thDisc, styles.discAlign]}>
                        {hasItemDiscount ? (
                          <View style={styles.discBadge}>
                            <Text style={styles.discBadgeText}>
                              {cartItem.discount_type === 'Percentage'
                                ? `-${cartItem.discount_value}%`
                                : `-${formatAmount(cartItem.discount_value || 0)}`}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.itemValue, { color: theme.colors.mutedText }]}>—</Text>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.itemValue,
                          styles.thAmount,
                          { color: theme.colors.text },
                          styles.bold700,
                        ]}
                      >
                        {formatAmount(itemLineTotal)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* 2. Summary & Calculations (Matching Web POS right column) */}
              <View
                style={[
                  styles.sectionCard,
                  theme.dark ? styles.sectionCardDark : styles.sectionCardLight,
                  { borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Calculator size={16} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Summary & Calculations
                  </Text>
                </View>

                {/* Payment Mode Selector - EXACT 2 OPTIONS: Cash & Online */}
                <View style={styles.paymentModeBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.mutedText }]}>
                    Payment Mode
                  </Text>
                  <View style={styles.methodRow}>
                    {(['Cash', 'Online'] as const).map(method => (
                      <Pressable
                        key={method}
                        style={[
                          styles.methodPill,
                          {
                            borderColor:
                              paymentMethod === method
                                ? theme.colors.primary
                                : theme.colors.border,
                            backgroundColor:
                              paymentMethod === method
                                ? theme.colors.primary
                                : theme.colors.card,
                          },
                        ]}
                        onPress={() => setPaymentMethod(method)}
                      >
                        <Text
                          style={[
                            styles.methodText,
                            paymentMethod === method
                              ? styles.methodTextActive
                              : { color: theme.colors.text },
                          ]}
                        >
                          {method}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Cash Amount Field when Cash is Selected */}
                  {paymentMethod === 'Cash' ? (
                    <View style={styles.cashAmountBlock}>
                      <Text style={[styles.fieldSubLabel, { color: theme.colors.mutedText }]}>
                        Cash Amount
                      </Text>
                      <TextInput
                        style={[
                          styles.paymentInput,
                          {
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                        placeholder="Defaults to rounded total"
                        value={cashTendered}
                        onChangeText={setCashTendered}
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.mutedText}
                      />
                      <Text style={[styles.helperNote, { color: theme.colors.mutedText }]}>
                        Defaults to rounded total
                      </Text>

                      {/* Return to Customer (Change calculation) */}
                      {changeToReturn > 0 && (
                        <View
                          style={[
                            styles.changeReturnRow,
                            {
                              backgroundColor: `${theme.colors.primary}10`,
                              borderColor: `${theme.colors.primary}30`,
                            },
                          ]}
                        >
                          <Text style={[styles.changeReturnLabel, { color: theme.colors.text }]}>
                            Return to customer
                          </Text>
                          <Text style={[styles.changeReturnValue, styles.changeReturnValueSuccess]}>
                            {formatAmount(changeToReturn)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.onlineInfoBox,
                        {
                          backgroundColor: `${theme.colors.primary}12`,
                          borderColor: `${theme.colors.primary}30`,
                        },
                      ]}
                    >
                      <Info size={14} color={theme.colors.primary} />
                      <Text style={[styles.onlineInfoText, { color: theme.colors.primary }]}>
                        Generates a Razorpay payment link. Completed upon online settlement.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Calculation Breakdown Lines */}
                <View style={[styles.calcBreakdown, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: theme.colors.mutedText }]}>
                      Net Total
                    </Text>
                    <Text style={[styles.calcValue, { color: theme.colors.text }]}>
                      {formatAmount(netTotal)}
                    </Text>
                  </View>

                  {discountAmount > 0 && (
                    <View style={styles.calcRow}>
                      <Text style={[styles.calcLabel, styles.calcLabelDiscount]}>
                        Cart Discount ({discountType})
                      </Text>
                      <Text style={[styles.calcValue, styles.calcValueDiscount]}>
                        -{formatAmount(discountAmount)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: theme.colors.mutedText }]}>
                      Taxes
                    </Text>
                    <Text style={[styles.calcValue, { color: theme.colors.text }]}>
                      {formatAmount(taxes)}
                    </Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: theme.colors.text }, styles.bold700]}>
                      Grand Total
                    </Text>
                    <Text style={[styles.calcValue, { color: theme.colors.text }, styles.bold700]}>
                      {formatAmount(grandTotal)}
                    </Text>
                  </View>

                  {/* Highlighted Rounded Total Box (Matching Web POS) */}
                  <View
                    style={[
                      styles.roundedTotalBox,
                      {
                        backgroundColor: `${theme.colors.primary}14`,
                        borderColor: `${theme.colors.primary}40`,
                      },
                    ]}
                  >
                    <Text style={[styles.roundedTotalLabel, { color: theme.colors.primary }]}>
                      ROUNDED TOTAL
                    </Text>
                    <Text style={[styles.roundedTotalValue, { color: theme.colors.primary }]}>
                      {formatAmount(roundedTotal)}
                    </Text>
                  </View>
                </View>
              </View>

              {previewError && (
                <Text style={[styles.errorText, styles.inlineError]}>{previewError}</Text>
              )}

              {/* Compliance & Approval Gates */}
              {discountApprovalNeeded && (
                <View style={[styles.gatePanel, styles.gatePanelAmber]}>
                  <View style={styles.gateHeaderRow}>
                    <AlertTriangle size={16} color="#B45309" />
                    <Text style={[styles.gateTitle, styles.gateTitleAmber]}>
                      Discount Above Role Limit
                    </Text>
                  </View>
                  <Text style={[styles.gateBody, styles.gateBodyAmber]}>
                    {`This discount exceeds your role's limit${
                      preview?.role_limit != null ? ` of ${preview.role_limit}%` : ''
                    } -- a manager needs to approve it.`}
                  </Text>
                  {discountApprovalLog ? (
                    <View style={styles.approvedRow}>
                      <Check size={14} color="#047857" />
                      <Text style={styles.approvedText}>
                        {`Override Approved: ${discountApprovalLog}`}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        style={[styles.requestBtn, styles.requestBtnAmber]}
                        onPress={handleRequestDiscountOverride}
                        disabled={isRequestingDiscountOverride}
                      >
                        {isRequestingDiscountOverride ? (
                          <ActivityIndicator size="small" color="#B45309" />
                        ) : (
                          <Text style={[styles.requestBtnText, styles.requestBtnTextAmber]}>
                            Request Override
                          </Text>
                        )}
                      </Pressable>
                      <ManagerApprovalFields
                        managerOptions={managerOptions}
                        isLoadingManagers={false}
                        managerUser={discountManagerUser}
                        onManagerChange={setDiscountManagerUser}
                        pin={discountManagerPin}
                        onPinChange={setDiscountManagerPin}
                        onApprove={handleSubmitDiscountOverride}
                        isSubmitting={isSubmittingDiscountOverride}
                        theme={theme}
                      />
                    </>
                  )}
                </View>
              )}

              {prescriptionRequired && (
                <View style={[styles.gatePanel, styles.gatePanelSky]}>
                  <View style={styles.gateHeaderRow}>
                    <FileWarning size={16} color="#0369A1" />
                    <Text style={[styles.gateTitle, styles.gateTitleSky]}>
                      Prescription Required
                    </Text>
                  </View>
                  <Text style={[styles.gateBody, styles.gateBodySky]}>
                    {`Restricted (Schedule H/H1/X) medicines in this bill: ${(
                      prescriptionCheck?.restricted_items || []
                    ).join(', ')}`}
                  </Text>
                  {prescriptionOnFile ? (
                    <View style={styles.approvedRow}>
                      <Check size={14} color="#047857" />
                      <Text style={styles.approvedText}>
                        {`Valid prescription on file: ${prescriptionCheck?.prescription}`}
                      </Text>
                    </View>
                  ) : rxOverrideLog ? (
                    <View style={styles.approvedRow}>
                      <Check size={14} color="#047857" />
                      <Text style={styles.approvedText}>
                        {`Override Approved: ${rxOverrideLog}`}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.gateBody, styles.gateBodySky]}>
                        No active prescription found. Request a manager override below.
                      </Text>
                      <SearchableDropdown
                        label="Override Reason"
                        value={rxOverrideReason}
                        placeholder="Select a reason..."
                        options={RX_OVERRIDE_REASON_OPTIONS}
                        loading={false}
                        onSelect={opt => setRxOverrideReason(opt.value)}
                      />
                      {rxApprovalLog ? null : (
                        <Pressable
                          style={[styles.requestBtn, styles.requestBtnSky]}
                          onPress={handleRequestRxOverride}
                          disabled={isRequestingRxOverride || !rxOverrideReason}
                        >
                          {isRequestingRxOverride ? (
                            <ActivityIndicator size="small" color="#0369A1" />
                          ) : (
                            <Text style={[styles.requestBtnText, styles.requestBtnTextSky]}>
                              Request Override
                            </Text>
                          )}
                        </Pressable>
                      )}
                      {rxApprovalLog && (
                        <ManagerApprovalFields
                          managerOptions={managerOptions}
                          isLoadingManagers={false}
                          managerUser={rxManagerUser}
                          onManagerChange={setRxManagerUser}
                          pin={rxManagerPin}
                          onPinChange={setRxManagerPin}
                          onApprove={handleSubmitRxOverride}
                          isSubmitting={isSubmittingRxOverride}
                          theme={theme}
                        />
                      )}
                    </>
                  )}
                </View>
              )}

              {marginViolations.length > 0 && (
                <View
                  style={[
                    styles.gatePanel,
                    marginBlocked
                      ? styles.gatePanelRed
                      : marginNeedsOverride
                        ? styles.gatePanelAmber
                        : styles.gatePanelSky,
                  ]}
                >
                  <View style={styles.gateHeaderRow}>
                    {marginBlocked ? (
                      <ShieldX size={16} color="#B91C1C" />
                    ) : marginNeedsOverride ? (
                      <KeyRound size={16} color="#B45309" />
                    ) : (
                      <Info size={16} color="#0369A1" />
                    )}
                    <Text
                      style={[
                        styles.gateTitle,
                        marginBlocked
                          ? styles.gateTitleRed
                          : marginNeedsOverride
                            ? styles.gateTitleAmber
                            : styles.gateTitleSky,
                      ]}
                    >
                      {marginBlocked
                        ? 'Margin Protection - Blocked'
                        : marginNeedsOverride
                          ? 'Margin Protection - Approval Required'
                          : 'Margin Protection - Warning'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.gateBody,
                      marginBlocked
                        ? styles.gateBodyRed
                        : marginNeedsOverride
                          ? styles.gateBodyAmber
                          : styles.gateBodySky,
                    ]}
                  >
                    {`${marginViolations.map(v => v.item_code).join(', ')} ${
                      marginBlocked
                        ? 'cannot be sold below the minimum allowed margin.'
                        : marginNeedsOverride
                          ? 'priced below the minimum margin -- request manager override.'
                          : 'priced below the recommended margin.'
                    }`}
                  </Text>

                  {!marginBlocked && !marginWarnOnly && (
                    marginOverrideLog ? (
                      <View style={styles.approvedRow}>
                        <Check size={14} color="#047857" />
                        <Text style={styles.approvedText}>
                          {`Override Approved: ${marginOverrideLog}`}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <TextInput
                          style={[
                            styles.paymentInput,
                            {
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                              backgroundColor: theme.colors.background,
                            },
                            styles.marginTop8,
                          ]}
                          placeholder="Override remarks"
                          value={marginRemarks}
                          onChangeText={setMarginRemarks}
                          placeholderTextColor={theme.colors.mutedText}
                        />
                        {marginApprovalLog ? null : (
                          <Pressable
                            style={[styles.requestBtn, styles.requestBtnAmber, styles.marginTop8]}
                            onPress={handleRequestMarginOverride}
                            disabled={isRequestingMarginOverride}
                          >
                            {isRequestingMarginOverride ? (
                              <ActivityIndicator size="small" color="#B45309" />
                            ) : (
                              <Text style={[styles.requestBtnText, styles.requestBtnTextAmber]}>
                                Request Override
                              </Text>
                            )}
                          </Pressable>
                        )}
                        {marginApprovalLog && (
                          <ManagerApprovalFields
                            managerOptions={managerOptions}
                            isLoadingManagers={false}
                            managerUser={marginManagerUser}
                            onManagerChange={setMarginManagerUser}
                            pin={marginManagerPin}
                            onPinChange={setMarginManagerPin}
                            onApprove={handleSubmitMarginOverride}
                            isSubmitting={isSubmittingMarginOverride}
                            theme={theme}
                          />
                        )}
                      </>
                    )
                  )}
                </View>
              )}

              {/* Action Buttons: Cancel & Edit + Complete Checkout (Matching Web POS) */}
              <View style={styles.footerActions}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>
                    Cancel & Edit
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.completeBtn,
                    { backgroundColor: theme.colors.primary },
                    (!canComplete || isSubmitting) && styles.completeBtnDisabled,
                  ]}
                  onPress={handleComplete}
                  disabled={!canComplete || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.completeBtnText}>Complete Checkout</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Shared manager-picker + PIN + approve row, reused by all three gates.
const ManagerApprovalFields = ({
  managerOptions,
  isLoadingManagers,
  managerUser,
  onManagerChange,
  pin,
  onPinChange,
  onApprove,
  isSubmitting,
  theme,
}: {
  managerOptions: DropdownOption[];
  isLoadingManagers: boolean;
  managerUser: string;
  onManagerChange: (value: string) => void;
  pin: string;
  onPinChange: (value: string) => void;
  onApprove: () => void;
  isSubmitting: boolean;
  theme: ReturnType<typeof useAppTheme>;
}) => (
  <View style={styles.approvalFieldsWrap}>
    <SearchableDropdown
      label="Manager"
      value={managerUser}
      placeholder="Select manager"
      options={managerOptions}
      loading={isLoadingManagers}
      onSelect={opt => onManagerChange(opt.value)}
    />
    <TextInput
      style={[
        styles.paymentInput,
        styles.pinInput,
        {
          borderColor: theme.colors.border,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
        },
      ]}
      placeholder="PIN"
      value={pin}
      onChangeText={onPinChange}
      secureTextEntry
      keyboardType="number-pad"
      placeholderTextColor={theme.colors.mutedText}
    />
    <Pressable
      style={[styles.approveBtn, { backgroundColor: theme.colors.primary }]}
      onPress={onApprove}
      disabled={isSubmitting || !managerUser || !pin}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.approveBtnText}>Approve</Text>
      )}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  modalBackdropBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '92%',
  },
  scrollContent: {
    paddingBottom: 12,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontWeight: '800',
    fontSize: 19,
  },
  previewLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  previewLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: '600',
  },
  inlineError: {
    marginVertical: 6,
  },
  customerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  customerTagText: {
    fontSize: 13,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  thMedicine: {
    flex: 2.2,
  },
  thQty: {
    flex: 0.7,
    textAlign: 'center',
  },
  thRate: {
    flex: 1,
    textAlign: 'right',
  },
  thDisc: {
    flex: 1,
    textAlign: 'center',
  },
  thAmount: {
    flex: 1.2,
    textAlign: 'right',
  },
  itemTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  discBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discBadgeText: {
    color: '#D97706',
    fontSize: 10.5,
    fontWeight: '700',
  },
  paymentModeBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontWeight: '700',
    fontSize: 12,
  },
  fieldSubLabel: {
    fontWeight: '600',
    fontSize: 11.5,
    marginBottom: 4,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodPill: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    fontWeight: '700',
    fontSize: 13,
  },
  cashAmountBlock: {
    marginTop: 4,
  },
  paymentInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  helperNote: {
    fontSize: 11,
    marginTop: 3,
    fontStyle: 'italic',
  },
  changeReturnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  changeReturnLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeReturnValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  onlineInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  onlineInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  calcBreakdown: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  roundedTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  roundedTotalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roundedTotalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  gatePanel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  gatePanelAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  gatePanelSky: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  gatePanelRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  gateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gateTitle: {
    fontWeight: '800',
    fontSize: 13,
  },
  gateBody: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  approvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  approvedText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  requestBtn: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  requestBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  approvalFieldsWrap: {
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  pinInput: {
    flex: undefined,
  },
  approveBtn: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  completeBtn: {
    flex: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeBtnDisabled: {
    opacity: 0.6,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  customerTagDark: {
    backgroundColor: '#1E293B',
  },
  customerTagLight: {
    backgroundColor: '#F1F5F9',
  },
  bold700: {
    fontWeight: '700',
  },
  sectionCardDark: {
    backgroundColor: '#0F172A',
  },
  sectionCardLight: {
    backgroundColor: '#FAFAFA',
  },
  itemTableHeaderDark: {
    backgroundColor: '#1E293B',
  },
  itemTableHeaderLight: {
    backgroundColor: '#F1F5F9',
  },
  itemTableRowBorder: {
    borderBottomWidth: 1,
  },
  discAlign: {
    alignItems: 'center',
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  changeReturnValueSuccess: {
    color: '#059669',
  },
  calcLabelDiscount: {
    color: '#D97706',
  },
  calcValueDiscount: {
    color: '#D97706',
    fontWeight: '700',
  },
  gateTitleAmber: {
    color: '#92400E',
  },
  gateBodyAmber: {
    color: '#92400E',
  },
  requestBtnAmber: {
    borderColor: '#B45309',
  },
  requestBtnTextAmber: {
    color: '#B45309',
  },
  gateTitleSky: {
    color: '#0C4A6E',
  },
  gateBodySky: {
    color: '#075985',
  },
  requestBtnSky: {
    borderColor: '#0369A1',
    marginTop: 8,
  },
  requestBtnTextSky: {
    color: '#0369A1',
  },
  gateTitleRed: {
    color: '#991B1B',
  },
  gateBodyRed: {
    color: '#991B1B',
  },
  marginTop8: {
    marginTop: 8,
  },
});
