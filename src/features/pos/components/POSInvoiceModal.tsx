import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  CheckCircle2,
  Download,
  MessageCircle,
  Printer,
  Share2,
  Store,
  User,
  CreditCard,
  Calendar,
  Layers,
  X,
} from 'lucide-react-native';
import { CartItem, Customer, PaymentMethod } from '../types';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  visible: boolean;
  invoiceName: string | null;
  paymentLink?: string | null;
  total: number;
  subtotal: number;
  gstAmount: number;
  selectedCustomer: Customer | null;
  paymentMethod: PaymentMethod;
  cartItems: CartItem[];
  onPressDownload: () => void;
  onPressPrint: () => void;
  onPressWhatsApp: () => void;
  onPressShare: () => void;
  onPressPaymentLink?: (link: string) => void;
  onPressDone: () => void;
};

export const POSInvoiceModal = ({
  visible,
  invoiceName,
  paymentLink,
  total,
  subtotal,
  gstAmount,
  selectedCustomer,
  paymentMethod,
  cartItems,
  onPressDownload,
  onPressPrint,
  onPressWhatsApp,
  onPressShare,
  onPressPaymentLink,
  onPressDone,
}: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const completedAt = useMemo(
    () =>
      visible
        ? new Date().toLocaleString(undefined, {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '',
    [visible],
  );

  const bottomPadding = Math.max(insets.bottom, 20) + 12;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[
            styles.invoiceSheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.successIconBadge}>
                <CheckCircle2 size={22} color="#059669" strokeWidth={2.5} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                  Sale Completed!
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.colors.mutedText }]}>
                  {`Invoice #${invoiceName || '—'} • `}
                  <Text style={[{ color: theme.colors.primary }, styles.bold700]}>
                    {formatAmount(total)}
                  </Text>
                </Text>
              </View>
            </View>
            <Pressable onPress={onPressDone} hitSlop={8}>
              <X size={20} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Pharmacy Brand & Receipt Info Card */}
            <View
              style={[
                styles.brandCard,
                theme.dark ? styles.brandCardDark : styles.brandCardLight,
                {
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.brandTitleRow}>
                <Store size={18} color={theme.colors.primary} />
                <Text style={[styles.pharmacyName, { color: theme.colors.text }]}>
                  MedPlus Pharmacy
                </Text>
              </View>
              <Text style={[styles.pharmacyAddress, { color: theme.colors.mutedText }]}>
                Plot No. 45, Jubilee Hills, Hyderabad - 500033
              </Text>
              <Text style={[styles.pharmacyMeta, { color: theme.colors.mutedText }]}>
                Ph: +91 98765 43210 | GSTIN: 36AABCU9603R1ZJ
              </Text>

              {/* Tag Badges Grid */}
              <View style={styles.receiptBadgesWrap}>
                <View
                  style={[
                    styles.metaBadge,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <User size={12} color={theme.colors.primary} />
                  <Text
                    style={[styles.metaBadgeText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedCustomer?.name || 'Walk-in Customer'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metaBadge,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <CreditCard size={12} color={theme.colors.primary} />
                  <Text style={[styles.metaBadgeText, { color: theme.colors.text }]}>
                    {paymentMethod.toUpperCase()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metaBadge,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Calendar size={12} color={theme.colors.mutedText} />
                  <Text style={[styles.metaBadgeText, { color: theme.colors.mutedText }]}>
                    {completedAt}
                  </Text>
                </View>
              </View>
            </View>

            {/* Online Payment Link Card (when paymentLink exists) */}
            {paymentLink ? (
              <View
                style={[
                  styles.paymentLinkCard,
                  {
                    backgroundColor: `${theme.colors.primary}12`,
                    borderColor: `${theme.colors.primary}40`,
                  },
                ]}
              >
                <View style={styles.paymentLinkHeader}>
                  <CreditCard size={16} color={theme.colors.primary} />
                  <Text style={[styles.paymentLinkTitle, { color: theme.colors.primary }]}>
                    Razorpay Online Payment Link
                  </Text>
                </View>
                <Text
                  style={[styles.paymentLinkUrl, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {paymentLink}
                </Text>
                <Pressable
                  style={[styles.openLinkBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => onPressPaymentLink?.(paymentLink)}
                >
                  <Text style={styles.openLinkBtnText}>Open / Pay Now</Text>
                </Pressable>
              </View>
            ) : null}

            {/* 2. Purchased Items Breakdown Card */}
            <View
              style={[
                styles.sectionCard,
                theme.dark ? styles.sectionCardDark : styles.sectionCardLight,
                {
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <Layers size={16} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Purchased Items ({cartItems.length})
                </Text>
              </View>

              {/* Table Header */}
              <View
                style={[
                  styles.itemTableHeader,
                  theme.dark ? styles.itemTableHeaderDark : styles.itemTableHeaderLight,
                  {
                    borderBottomColor: theme.colors.border,
                  },
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
                <Text style={[styles.thText, styles.thAmount, { color: theme.colors.mutedText }]}>
                  Amount
                </Text>
              </View>

              {/* Item Rows */}
              {cartItems.map((item, idx) => {
                const itemRate = item.rate ?? item.price ?? 0;
                const itemLineTotal = itemRate * item.qty;
                const isLast = idx === cartItems.length - 1;

                return (
                  <View
                    key={`inv-item-${item.id}-${idx}`}
                    style={[
                      styles.itemTableRow,
                      !isLast && [
                        styles.itemTableRowBorder,
                        { borderBottomColor: theme.colors.border },
                      ],
                    ]}
                  >
                    <View style={styles.thMedicine}>
                      <Text
                        style={[styles.itemName, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.itemSubtext, { color: theme.colors.mutedText }]}>
                        {item.item_code || item.id}
                        {item.batch || item.batch_no
                          ? ` • Batch: ${item.batch || item.batch_no}`
                          : ''}
                      </Text>
                    </View>

                    <Text style={[styles.itemValue, styles.thQty, { color: theme.colors.text }]}>
                      {item.qty}
                    </Text>

                    <Text style={[styles.itemValue, styles.thRate, { color: theme.colors.text }]}>
                      {formatAmount(itemRate)}
                    </Text>

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

            {/* 3. Summary & Totals Breakdown Card */}
            <View
              style={[
                styles.sectionCard,
                theme.dark ? styles.sectionCardDark : styles.sectionCardLight,
                {
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: theme.colors.mutedText }]}>
                  Subtotal
                </Text>
                <Text style={[styles.calcValue, { color: theme.colors.text }]}>
                  {formatAmount(subtotal)}
                </Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: theme.colors.mutedText }]}>
                  GST Tax
                </Text>
                <Text style={[styles.calcValue, { color: theme.colors.text }]}>
                  {formatAmount(gstAmount)}
                </Text>
              </View>

              {/* Highlighted Rounded Total Banner */}
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
                  TOTAL PAID
                </Text>
                <Text style={[styles.roundedTotalValue, { color: theme.colors.primary }]}>
                  {formatAmount(total)}
                </Text>
              </View>
            </View>

            {/* 4. Action Buttons Grid */}
            <View style={styles.actionGrid}>
              <Pressable
                style={[
                  styles.actionGridBtn,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
                onPress={onPressDownload}
              >
                <Download size={16} color={theme.colors.text} />
                <Text style={[styles.actionGridBtnText, { color: theme.colors.text }]}>
                  Download
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionGridBtn,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
                onPress={onPressPrint}
              >
                <Printer size={16} color={theme.colors.text} />
                <Text style={[styles.actionGridBtnText, { color: theme.colors.text }]}>
                  Print
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionGridBtn, styles.actionWhatsAppBtn]}
                onPress={onPressWhatsApp}
              >
                <MessageCircle size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnWhiteText}>WhatsApp</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionGridBtn,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.card,
                  },
                ]}
                onPress={onPressShare}
              >
                <Share2 size={16} color={theme.colors.text} />
                <Text style={[styles.actionGridBtnText, { color: theme.colors.text }]}>
                  Share
                </Text>
              </Pressable>
            </View>

            {/* 5. Primary Done / Start New Sale Button */}
            <Pressable
              style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
              onPress={onPressDone}
            >
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.doneBtnText}>Start New Sale</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  invoiceSheet: {
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
    gap: 10,
  },
  successIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  brandCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pharmacyName: {
    fontSize: 15,
    fontWeight: '800',
  },
  pharmacyAddress: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  pharmacyMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  receiptBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentLinkCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  paymentLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  paymentLinkUrl: {
    fontSize: 12,
    fontFamily: 'Courier',
  },
  openLinkBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openLinkBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
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
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  thMedicine: {
    flex: 2.4,
  },
  thQty: {
    flex: 0.7,
    textAlign: 'center',
  },
  thRate: {
    flex: 1.1,
    textAlign: 'right',
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
    fontSize: 12.5,
    fontWeight: '700',
  },
  itemSubtext: {
    fontSize: 10.5,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
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
    marginTop: 4,
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
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionGridBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionWhatsAppBtn: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  actionGridBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnWhiteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
  bold700: {
    fontWeight: '700',
  },
  brandCardDark: {
    backgroundColor: '#0F172A',
  },
  brandCardLight: {
    backgroundColor: '#F8FAFC',
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
});
