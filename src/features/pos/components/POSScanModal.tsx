import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Barcode, Search, X } from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';
import { posService } from '../services/posService';
import { Medicine } from '../types';

type Props = {
  visible: boolean;
  onMedicineScanned: (medicine: Medicine) => void;
  onClose: () => void;
};

export const POSScanModal = ({ visible, onMedicineScanned, onClose }: Props) => {
  const theme = useAppTheme();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookupBarcode = async (barcodeToSearch?: string) => {
    const code = (barcodeToSearch || barcodeInput).trim();
    if (!code) return;

    setIsScanning(true);
    setError(null);
    try {
      const res = await posService.scanBarcode(code);
      if (res && res.item_code) {
        onMedicineScanned({
          item_code: res.item_code,
          item_name: res.item_name || res.item_code,
          batch: res.batch_no || '',
          quantity: 1,
          rate: 0,
        });
        setBarcodeInput('');
        onClose();
      } else {
        setError('Barcode not linked to any medicine in inventory.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.scanModalBody, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Barcode size={20} color={theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Barcode Scanner (F3)
              </Text>
            </View>
            <Pressable style={styles.modalClose} onPress={onClose} hitSlop={8}>
              <X size={18} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          <View style={styles.scanFrameWrap}>
            <View style={[styles.scanFrame, { borderColor: theme.colors.primary }]}>
              <View style={[styles.scanLine, { backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.scanHint, { color: theme.colors.mutedText }]}>
              Point camera or USB scanner at barcode
            </Text>
          </View>

          {/* Manual Barcode Input Fallback */}
          <View style={styles.manualRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Enter barcode or SKU..."
              placeholderTextColor={theme.colors.mutedText}
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              onSubmitEditing={() => handleLookupBarcode()}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <Pressable
              style={[styles.searchBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleLookupBarcode()}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Search size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scanModalBody: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    padding: 4,
  },
  scanFrameWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  scanFrame: {
    width: 180,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scanLine: {
    height: 3,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  scanHint: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 14,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
