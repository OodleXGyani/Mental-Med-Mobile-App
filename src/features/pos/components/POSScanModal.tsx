import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Barcode, Search, X } from 'lucide-react-native';
import CameraKit, { Camera, CameraType } from 'react-native-camera-kit';
import { useAppTheme } from '../../../shared/theme';
import { posService } from '../services/posService';
import { Medicine } from '../types';

type Props = {
  visible: boolean;
  onMedicineScanned: (medicine: Medicine) => void;
  onClose: () => void;
};

type PermissionState = 'unknown' | 'granted' | 'denied';

// Previously this modal had no camera integration at all -- just a static
// decorative frame graphic with no <Camera> component, so no camera
// permission (however correctly granted at the OS level) had anything to
// attach to. Rebuilt on the same react-native-camera-kit setup already
// working in the Inventory feature's BarcodeScannerModal, wired to POS's
// own barcode-lookup endpoint. The manual entry field is kept as a second
// input path -- a wired/USB HID barcode scanner types into whatever text
// field has focus, so it still works as a physical-scanner fallback
// alongside the live camera.
export const POSScanModal = ({ visible, onMedicineScanned, onClose }: Props) => {
  const theme = useAppTheme();
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  const checkPermission = useCallback(async () => {
    try {
      const granted = await CameraKit.requestDeviceCameraAuthorization();
      setPermission(granted ? 'granted' : 'denied');
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    scannedRef.current = false;
    setError(null);
    setBarcodeInput('');
    setIsScanning(false);
    void checkPermission();
  }, [checkPermission, visible]);

  const handleLookupBarcode = async (barcodeToSearch?: string) => {
    const code = (barcodeToSearch || barcodeInput).trim();
    if (!code || scannedRef.current) return;

    scannedRef.current = true;
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
        scannedRef.current = false;
        setError('Barcode not linked to any medicine in inventory.');
      }
    } catch (err) {
      scannedRef.current = false;
      setError(err instanceof Error ? err.message : 'Barcode scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const renderCamera = () => {
    if (permission !== 'granted') {
      const canRequest = permission === 'unknown';
      return (
        <View style={styles.permissionBox}>
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            Camera access needed
          </Text>
          <Text style={[styles.permissionText, { color: theme.colors.mutedText }]}>
            Allow camera permission to scan medicine barcodes.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={canRequest ? checkPermission : () => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>
              {canRequest ? 'Allow Camera' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraWrap}>
        <Camera
          style={styles.camera}
          cameraType={CameraType.Back}
          scanBarcode={visible && !isScanning}
          showFrame={false}
          onReadCode={(event: { nativeEvent: { codeStringValue: string } }) => {
            const value = event.nativeEvent.codeStringValue;
            if (value) void handleLookupBarcode(value);
          }}
        />
        <View pointerEvents="none" style={[styles.scanFrame, { borderColor: theme.colors.primary }]} />
        {isScanning ? (
          <View style={styles.cameraLoadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
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

          {renderCamera()}

          <Text style={[styles.scanHint, { color: theme.colors.mutedText }]}>
            Point camera or USB scanner at barcode
          </Text>

          {/* Manual Barcode Input Fallback -- also the target field for a
              wired/USB HID barcode scanner. */}
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
  cameraWrap: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: 'absolute',
    top: '18%',
    left: '15%',
    right: '15%',
    height: '64%',
    borderWidth: 2,
    borderRadius: 14,
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  permissionBox: {
    width: '100%',
    minHeight: 220,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(120, 120, 120, 0.08)',
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  permissionText: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  permissionButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  permissionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
