import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';
import { formatAmount } from '../utils';
import { posService } from '../services/posService';

type Props = {
  visible: boolean;
  paymentUrl: string | null;
  invoiceId: string | null;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  onPaymentSuccess: () => void;
  onClose: () => void;
};

export const POSOnlinePaymentModal = ({
  visible,
  paymentUrl,
  invoiceId,
  amount,
  customerName,
  customerPhone,
  onPaymentSuccess,
  onClose,
}: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isVerifying, setIsVerifying] = useState(false);

  if (!visible || !paymentUrl) {
    return null;
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    paymentUrl,
  )}`;

  const handleCheckStatus = async () => {
    if (!invoiceId) return;
    setIsVerifying(true);
    try {
      const res = await posService.verifyPaymentLinkStatus(invoiceId);
      if (
        res.status === 'Paid' ||
        res.status === 'COMPLETED' ||
        res.status === 'SUCCESS' ||
        res.status === 'Settled'
      ) {
        Alert.alert('Payment Verified!', 'The payment has been confirmed as PAID.', [
          { text: 'OK', onPress: onPaymentSuccess },
        ]);
      } else {
        Alert.alert(
          'Payment Status',
          `Current payment status: ${res.status || 'Pending'}. If the customer just paid, please wait a few seconds and check again.`,
        );
      }
    } catch {
      Alert.alert(
        'Status Check',
        'Could not verify status right now. Please ask customer to confirm payment.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenLink = () => {
    if (!paymentUrl) return;
    Linking.canOpenURL(paymentUrl).then(can => {
      if (can) {
        Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Error', 'Unable to open payment link.');
      }
    });
  };

  const handleWhatsApp = async () => {
    if (!paymentUrl) return;
    const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
    const message = `Hello ${
      customerName || 'Customer'
    },\nPlease complete your payment of ${formatAmount(amount)} for MedPlus Pharmacy invoice #${
      invoiceId || ''
    } using this secure link:\n${paymentUrl}`;

    const waUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) {
        await Linking.openURL(waUrl);
        return;
      }
    } catch {
      /* fallback */
    }

    try {
      await Share.share({
        title: `Payment Link for Invoice #${invoiceId || ''}`,
        message,
      });
    } catch {
      /* ignore */
    }
  };

  const handleShareLink = async () => {
    if (!paymentUrl) return;
    try {
      await Share.share({
        title: `Payment Link for Invoice #${invoiceId || ''}`,
        message: `Please complete your payment of ${formatAmount(amount)} for MedPlus Pharmacy invoice #${
          invoiceId || ''
        }:\n${paymentUrl}`,
      });
    } catch {
      /* ignore */
    }
  };

  const bottomPadding = Math.max(insets.bottom, 20) + 12;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.secureIconBadge}>
                <ShieldCheck size={20} color="#059669" strokeWidth={2.5} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                  Online Payment
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.colors.mutedText }]}>
                  {`Invoice #${invoiceId || '—'} • `}
                  <Text style={[styles.priceHighlight, { color: theme.colors.primary }]}>
                    {formatAmount(amount)}
                  </Text>
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Dynamic QR Code Card for In-Person Scanning */}
            <View
              style={[
                styles.qrCard,
                theme.dark ? styles.qrCardDark : styles.qrCardLight,
                {
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.qrHeaderRow}>
                <QrCode size={16} color={theme.colors.primary} />
                <Text style={[styles.qrCardTitle, { color: theme.colors.text }]}>
                  Scan to Pay (UPI / GPay / PhonePe)
                </Text>
              </View>

              <View style={styles.qrImageWrap}>
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.qrHelpText, { color: theme.colors.mutedText }]}>
                Ask customer to scan using any UPI App (Google Pay, PhonePe, Paytm)
              </Text>
            </View>

            {/* 2. Direct Payment Link Card */}
            <View
              style={[
                styles.linkCard,
                theme.dark ? styles.linkCardDark : styles.linkCardLight,
                {
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.linkLabel, { color: theme.colors.mutedText }]}>
                Payment Link
              </Text>
              <Text
                style={[styles.linkUrlText, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {paymentUrl}
              </Text>

              <View style={styles.linkActionRow}>
                <Pressable
                  style={[
                    styles.linkActionBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  onPress={handleOpenLink}
                >
                  <ExternalLink size={14} color={theme.colors.primary} />
                  <Text style={[styles.linkActionBtnText, { color: theme.colors.primary }]}>
                    Open Page
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.linkActionBtn, styles.whatsappBtn]}
                  onPress={handleWhatsApp}
                >
                  <MessageCircle size={14} color="#FFFFFF" />
                  <Text style={[styles.linkActionBtnText, styles.whatsappBtnText]}>
                    WhatsApp
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.linkActionBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  onPress={handleShareLink}
                >
                  <Share2 size={14} color={theme.colors.text} />
                  <Text style={[styles.linkActionBtnText, { color: theme.colors.text }]}>
                    Share
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 3. Action Buttons */}
            <View style={styles.bottomActionRow}>
              <Pressable
                style={[
                  styles.verifyBtn,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}12`,
                  },
                ]}
                onPress={handleCheckStatus}
                disabled={Boolean(isVerifying)}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <RefreshCw size={16} color={theme.colors.primary} />
                )}
                <Text style={[styles.verifyBtnText, { color: theme.colors.primary }]}>
                  {isVerifying ? 'Checking...' : 'Check Status'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
                onPress={onClose}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.doneBtnText}>View Receipt</Text>
              </Pressable>
            </View>
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
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '92%',
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
  secureIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontWeight: '800',
    fontSize: 17,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  priceHighlight: {
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 12,
    gap: 12,
  },
  qrCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  qrCardLight: {
    backgroundColor: '#F8FAFC',
  },
  qrCardDark: {
    backgroundColor: '#0F172A',
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  qrImageWrap: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrHelpText: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  linkCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  linkCardLight: {
    backgroundColor: '#FAFAFA',
  },
  linkCardDark: {
    backgroundColor: '#0F172A',
  },
  linkLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  linkUrlText: {
    fontSize: 12,
    fontFamily: 'Courier',
  },
  linkActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  linkActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  whatsappBtn: {
    borderColor: '#25D366',
    backgroundColor: '#25D366',
  },
  whatsappBtnText: {
    color: '#FFFFFF',
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  verifyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
