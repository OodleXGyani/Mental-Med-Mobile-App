import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertTriangle, Check, FileWarning, Info, KeyRound, ShieldX, X } from 'lucide-react-native';
import { Customer, PaymentMethod, CheckoutPreviewResponse } from '../types';
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
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  discountPercent: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onCompleteSale: (context: CompletedSaleContext) => void;
};

export const POSPaymentModal = ({
  visible,
  cartName,
  selectedCustomer,
  paymentMethod,
  setPaymentMethod,
  discountPercent,
  isSubmitting = false,
  onClose,
  onCompleteSale,
}: Props) => {
  const theme = useAppTheme();

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);

  const [managerOptions, setManagerOptions] = useState<DropdownOption[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

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

    let cancelled = false;
    setIsLoadingPreview(true);
    posService
      .checkoutPreview({
        cart_name: cartName,
        discount_value: Number(discountPercent) || 0,
        discount_type: 'Percentage',
      })
      .then(result => {
        if (!cancelled) setPreview(result);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cartName]);

  const prescriptionCheck = preview?.prescription_check;
  const prescriptionRequired = !!prescriptionCheck?.prescription_required;
  const prescriptionOnFile = !!prescriptionCheck?.prescription_found;
  const prescriptionSatisfied = prescriptionOnFile || !!rxOverrideLog;

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
      const result = await posService.requestApproval({
        approval_type: 'Discount Override',
        cart_name: cartName,
        discount_requested: Number(discountPercent) || 0,
        role_limit: preview?.role_limit ?? 0,
        remarks: 'Discount above role limit',
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
      // discountApprovalLog is already the approved log name -- discountSatisfied
      // just needs it to be non-empty, which it already is.
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

  const total = preview?.rounded_total ?? preview?.grand_total ?? 0;
  const netTotal = preview?.net_total ?? 0;
  const taxes = preview?.taxes ?? 0;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[styles.bottomSheet, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
              {isLoadingPreview ? 'Payment' : `Payment - ${formatAmount(total)}`}
            </Text>
            <Pressable onPress={onClose}>
              <X size={16} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          {isLoadingPreview ? (
            <View style={styles.previewLoading}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[styles.previewLoadingText, { color: theme.colors.mutedText }]}>
                Calculating totals...
              </Text>
            </View>
          ) : previewError && !preview ? (
            <View style={styles.previewLoading}>
              <Text style={styles.errorText}>{previewError}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: theme.colors.mutedText }]}>
                Customer
              </Text>
              <View style={styles.paymentCustomerRow}>
                <TextInput
                  style={[
                    styles.paymentInput,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="Name"
                  value={selectedCustomer?.name || ''}
                  placeholderTextColor={theme.colors.mutedText}
                  editable={false}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.colors.mutedText }]}>
                Payment Method
              </Text>
              <View style={styles.methodRow}>
                {(['Cash', 'UPI', 'Card'] as const).map(method => (
                  <Pressable
                    key={method}
                    style={[
                      styles.methodPill,
                      { borderColor: theme.colors.border },
                      paymentMethod === method && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        { color: theme.colors.mutedText },
                        paymentMethod === method && styles.methodTextActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {previewError && (
                <Text style={[styles.errorText, styles.inlineError]}>{previewError}</Text>
              )}

              {discountApprovalNeeded && (
                <View style={[styles.gatePanel, styles.gatePanelAmber]}>
                  <View style={styles.gateHeaderRow}>
                    <AlertTriangle size={16} color="#B45309" />
                    <Text style={[styles.gateTitle, { color: '#92400E' }]}>
                      Discount Above Role Limit
                    </Text>
                  </View>
                  <Text style={[styles.gateBody, { color: '#92400E' }]}>
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
                        style={[styles.requestBtn, { borderColor: '#B45309' }]}
                        onPress={handleRequestDiscountOverride}
                        disabled={isRequestingDiscountOverride}
                      >
                        {isRequestingDiscountOverride ? (
                          <ActivityIndicator size="small" color="#B45309" />
                        ) : (
                          <Text style={[styles.requestBtnText, { color: '#B45309' }]}>
                            Request Override
                          </Text>
                        )}
                      </Pressable>
                      <ManagerApprovalFields
                        managerOptions={managerOptions}
                        isLoadingManagers={isLoadingManagers}
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
                    <Text style={[styles.gateTitle, { color: '#0C4A6E' }]}>
                      Prescription Required
                    </Text>
                  </View>
                  <Text style={[styles.gateBody, { color: '#075985' }]}>
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
                      <Text style={[styles.gateBody, { color: '#075985' }]}>
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
                          style={[styles.requestBtn, { borderColor: '#0369A1', marginTop: 8 }]}
                          onPress={handleRequestRxOverride}
                          disabled={isRequestingRxOverride || !rxOverrideReason}
                        >
                          {isRequestingRxOverride ? (
                            <ActivityIndicator size="small" color="#0369A1" />
                          ) : (
                            <Text style={[styles.requestBtnText, { color: '#0369A1' }]}>
                              Request Override
                            </Text>
                          )}
                        </Pressable>
                      )}
                      {rxApprovalLog && (
                        <ManagerApprovalFields
                          managerOptions={managerOptions}
                          isLoadingManagers={isLoadingManagers}
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
                        {
                          color: marginBlocked
                            ? '#991B1B'
                            : marginNeedsOverride
                              ? '#92400E'
                              : '#0C4A6E',
                        },
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
                      {
                        color: marginBlocked
                          ? '#991B1B'
                          : marginNeedsOverride
                            ? '#92400E'
                            : '#075985',
                      },
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
                              marginTop: 8,
                            },
                          ]}
                          placeholder="Override remarks"
                          value={marginRemarks}
                          onChangeText={setMarginRemarks}
                          placeholderTextColor={theme.colors.mutedText}
                        />
                        {marginApprovalLog ? null : (
                          <Pressable
                            style={[styles.requestBtn, { borderColor: '#B45309', marginTop: 8 }]}
                            onPress={handleRequestMarginOverride}
                            disabled={isRequestingMarginOverride}
                          >
                            {isRequestingMarginOverride ? (
                              <ActivityIndicator size="small" color="#B45309" />
                            ) : (
                              <Text style={[styles.requestBtnText, { color: '#B45309' }]}>
                                Request Override
                              </Text>
                            )}
                          </Pressable>
                        )}
                        {marginApprovalLog && (
                          <ManagerApprovalFields
                            managerOptions={managerOptions}
                            isLoadingManagers={isLoadingManagers}
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

              <View
                style={[styles.breakdownBox, { borderColor: theme.colors.border }]}
              >
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: theme.colors.mutedText }]}
                  >
                    Subtotal
                  </Text>
                  <Text
                    style={[styles.summaryValueNeutral, { color: theme.colors.text }]}
                  >
                    {formatAmount(netTotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: theme.colors.mutedText }]}
                  >
                    Tax
                  </Text>
                  <Text
                    style={[styles.summaryValueNeutral, { color: theme.colors.text }]}
                  >
                    {formatAmount(taxes)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.summaryRow,
                    styles.totalRow,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                    Total
                  </Text>
                  <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                    {formatAmount(total)}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[
                  styles.completeBtn,
                  { backgroundColor: theme.colors.primary },
                  (!canComplete || isSubmitting) && styles.completeBtnDisabled,
                ]}
                onPress={handleComplete}
                disabled={!canComplete}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.completeBtnText}>Complete Sale</Text>
                )}
              </Pressable>
            </>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 14,
    maxHeight: '86%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    color: '#403631',
    fontWeight: '800',
    fontSize: 20,
  },
  previewLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  previewLoadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: '600',
  },
  inlineError: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#5B4E47',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  paymentCustomerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paymentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E3DDD7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#4A3E37',
    fontSize: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  methodPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0DAD4',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  methodText: {
    color: '#6D5F57',
    fontWeight: '700',
    fontSize: 12,
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  gatePanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  breakdownBox: {
    borderWidth: 1,
    borderColor: '#ECE6E1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#8E7A6F',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryValueNeutral: {
    color: '#5B4E47',
    fontWeight: '700',
    fontSize: 12,
  },
  totalRow: {
    borderTopColor: '#ECE7E2',
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },
  totalLabel: {
    color: '#3F3430',
    fontWeight: '800',
    fontSize: 16,
  },
  totalValue: {
    color: '#1CA39A',
    fontWeight: '800',
    fontSize: 18,
  },
  completeBtn: {
    backgroundColor: '#2CA798',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  completeBtnDisabled: {
    opacity: 0.6,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
