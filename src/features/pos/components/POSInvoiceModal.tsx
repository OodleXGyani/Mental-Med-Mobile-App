import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Download, Phone, Printer, Share2 } from 'lucide-react-native';
import { CartItem, Customer, PaymentMethod } from '../types';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  visible: boolean;
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
  onPressDone: () => void;
};

export const POSInvoiceModal = ({
  visible,
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
  onPressDone,
}: Props) => {
  const theme = useAppTheme();

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[styles.invoiceSheet, { backgroundColor: theme.colors.card }]}
        >
          <View
            style={[styles.saleDoneCard, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.saleDoneTitle, { color: theme.colors.text }]}>
              Sale completed!
            </Text>
            <Text
              style={[styles.saleDoneMeta, { color: theme.colors.mutedText }]}
            >
              {`Invoice INV-155654 - ${formatAmount(total)}`}
            </Text>
          </View>

          <View
            style={[
              styles.invoiceHeaderBox,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[styles.pharmacyName, { color: theme.colors.text }]}>
              MedPlus Pharmacy
            </Text>
            <Text
              style={[
                styles.pharmacyAddress,
                { color: theme.colors.mutedText },
              ]}
            >
              Plot No. 45, Jubilee Hills, Hyderabad - 500033
            </Text>
            <Text
              style={[
                styles.pharmacyAddress,
                { color: theme.colors.mutedText },
              ]}
            >
              Ph: +91 98765 43210 | GSTIN: 36AABCU9603R1ZJ
            </Text>
          </View>

          <Text
            style={[styles.invoiceLine, { color: theme.colors.text }]}
          >{`Customer: ${selectedCustomer?.name || 'Walk-in'}`}</Text>
          <Text style={[styles.invoiceLine, { color: theme.colors.text }]}>
            Date: 24/4/2026, 3:52 pm
          </Text>
          <Text
            style={[styles.invoiceLine, { color: theme.colors.text }]}
          >{`Payment: ${paymentMethod.toUpperCase()}`}</Text>

          <View style={styles.invoiceItemsWrap}>
            {cartItems.map(item => (
              <View style={styles.invoiceItemRow} key={item.id}>
                <View>
                  <Text
                    style={[
                      styles.invoiceItemName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.invoiceItemMeta,
                      { color: theme.colors.mutedText },
                    ]}
                  >{`Batch: ${item.batch}`}</Text>
                </View>
                <Text
                  style={[
                    styles.invoiceItemPrice,
                    { color: theme.colors.text },
                  ]}
                >
                  {formatAmount(item.price * item.qty)}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.invoiceSummaryBorder,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.mutedText }]}
              >
                Subtotal
              </Text>
              <Text
                style={[
                  styles.summaryValueNeutral,
                  { color: theme.colors.text },
                ]}
              >
                {formatAmount(subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.mutedText }]}
              >
                GST
              </Text>
              <Text
                style={[
                  styles.summaryValueNeutral,
                  { color: theme.colors.text },
                ]}
              >
                {formatAmount(gstAmount)}
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
              <Text
                style={[styles.totalValue, { color: theme.colors.primary }]}
              >
                {formatAmount(total)}
              </Text>
            </View>
          </View>

          <View style={styles.invoiceActionRow}>
            <Pressable
              style={[
                styles.actionBtnLight,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
              onPress={onPressDownload}
            >
              <Download size={14} color={theme.colors.mutedText} />
              <Text
                style={[
                  styles.actionBtnLightText,
                  { color: theme.colors.mutedText },
                ]}
              >
                Download
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionBtnLight,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
              onPress={onPressPrint}
            >
              <Printer size={14} color={theme.colors.mutedText} />
              <Text
                style={[
                  styles.actionBtnLightText,
                  { color: theme.colors.mutedText },
                ]}
              >
                Print
              </Text>
            </Pressable>
          </View>
          <View style={styles.invoiceActionRow}>
            <Pressable style={styles.actionBtnGreen} onPress={onPressWhatsApp}>
              <Phone size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnGreenText}>WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionBtnTeal,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={onPressShare}
            >
              <Share2 size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnGreenText}>Share</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.closeInvoiceBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onPressDone}
          >
            <Check size={14} color="#FFFFFF" />
            <Text style={styles.closeInvoiceBtnText}>Done</Text>
          </Pressable>
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
  invoiceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 12,
    maxHeight: '84%',
  },
  saleDoneCard: {
    borderWidth: 1,
    borderColor: '#E2E0DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  saleDoneTitle: {
    color: '#39302B',
    fontSize: 13,
    fontWeight: '800',
  },
  saleDoneMeta: {
    marginTop: 2,
    color: '#7C6E65',
    fontSize: 11,
    fontWeight: '600',
  },
  invoiceHeaderBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 9,
    padding: 10,
    marginBottom: 10,
  },
  pharmacyName: {
    color: '#3E3631',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  pharmacyAddress: {
    color: '#8A7E76',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  invoiceLine: {
    color: '#4B4038',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 3,
  },
  invoiceItemsWrap: {
    marginTop: 8,
    marginBottom: 8,
    gap: 5,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceItemName: {
    color: '#423731',
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceItemMeta: {
    color: '#9F9288',
    fontSize: 9.5,
    marginTop: 1,
  },
  invoiceItemPrice: {
    color: '#423731',
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceSummaryBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ECE6E1',
    paddingTop: 8,
    marginBottom: 8,
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
  invoiceActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionBtnLight: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD6D1',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  actionBtnLightText: {
    color: '#6C6059',
    fontWeight: '700',
    fontSize: 12,
  },
  actionBtnGreen: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#22A34A',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
  },
  actionBtnTeal: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#2CA798',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
  },
  actionBtnGreenText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  closeInvoiceBtn: {
    marginTop: 2,
    borderRadius: 8,
    backgroundColor: '#2CA798',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeInvoiceBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
