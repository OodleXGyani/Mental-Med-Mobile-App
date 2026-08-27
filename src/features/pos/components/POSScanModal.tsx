import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
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
import { Camera, CameraType } from 'react-native-camera-kit';
import {
  checkCameraPermission,
  requestCameraPermission,
} from '../../../shared/utils/cameraPermissions';
import { useAppTheme } from '../../../shared/theme';
import { posService } from '../services/posService';
import { Medicine } from '../types';

type Props = {
  visible: boolean;
  onMedicineScanned: (medicine: Medicine) => void;
  onClose: () => void;
};

type PermissionState = 'unknown' | 'granted' | 'denied';

export const POSScanModal = ({ visible, onMedicineScanned, onClose }: Props) => {
  const theme = useAppTheme();
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  const checkPermission = useCallback(async (requestIfMissing = false) => {
    try {
      const isGranted = await checkCameraPermission();
      if (isGranted) {
        setPermission('granted');
        return;
      }

      if (requestIfMissing) {
        const result = await requestCameraPermission();
        setPermission(result === 'granted' ? 'granted' : 'denied');
      } else {
        setPermission('denied');
      }
    } catch {
      setPermission('denied');
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const result = await requestCameraPermission();
      if (result === 'granted') {
        setPermission('granted');
      } else {
        setPermission('denied');
        Linking.openSettings().catch(err => {
          console.warn('Unable to open app settings:', err);
        });
      }
    } catch {
      setPermission('denied');
    }
  };

  useEffect(() => {
    if (!visible) return;
    scannedRef.current = false;
    setError(null);
    setBarcodeInput('');
    setIsScanning(false);
    checkPermission(true).catch(err => {
      console.warn('Check permission error:', err);
    });
  }, [checkPermission, visible]);

  useEffect(() => {
    if (!visible) return;
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkPermission(false).catch(err => {
          console.warn('Check permission error:', err);
        });
      }
    });
    return () => subscription.remove();
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
      return (
        <View style={styles.permissionBox}>
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            Camera access needed
          </Text>
          <Text style={[styles.permissionText, { color: theme.colors.mutedText }]}>
            Allow camera permission to scan medicine barcodes.
          </Text>
          <View style={styles.permissionActions}>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRequestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permissionButtonSecondary, { borderColor: theme.colors.border }]}
              onPress={() => {
                Linking.openSettings().catch(err => {
                  console.warn('Unable to open settings:', err);
                });
              }}
            >
              <Text style={[styles.permissionButtonSecondaryText, { color: theme.colors.text }]}>
                Open Settings
              </Text>
            </TouchableOpacity>
          </View>
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
            if (value) {
              handleLookupBarcode(value).catch(err => {
                console.warn('Barcode lookup error:', err);
              });
            }
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
  permissionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  permissionButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  permissionButtonSecondary: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
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
