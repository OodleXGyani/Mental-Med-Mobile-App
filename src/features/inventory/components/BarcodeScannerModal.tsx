import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import {
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  CodeScanner,
  type Barcode,
} from 'react-native-vision-camera-barcode-scanner';
import { BarcodeScannedItem } from '../types';
import { inventoryService } from '../services/inventoryService';

type Props = {
  visible: boolean;
  company?: string;
  onClose: () => void;
  onScannedItem: (item: BarcodeScannedItem) => void;
};

export const BarcodeScannerModal = ({
  visible,
  company,
  onClose,
  onScannedItem,
}: Props) => {
  const device = useCameraDevice('back');
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    scannedRef.current = false;
    setError('');
    setLoading(false);

    if (!hasPermission && canRequestPermission) {
      void requestPermission();
    }
  }, [canRequestPermission, hasPermission, requestPermission, visible]);

  const submitBarcode = useCallback(
    async (barcode: string) => {
      const trimmedBarcode = barcode.trim();

      if (!trimmedBarcode || scannedRef.current) {
        return;
      }

      scannedRef.current = true;
      setLoading(true);
      setError('');

      try {
        const result = await inventoryService.scanBarcode(
          trimmedBarcode,
          company,
        );
        onScannedItem(result);
        onClose();
      } catch (err) {
        scannedRef.current = false;
        setError(err instanceof Error ? err.message : 'Failed to scan barcode');
      } finally {
        setLoading(false);
      }
    },
    [company, onClose, onScannedItem],
  );

  const handleBarcodeScanned = useCallback(
    (barcodes: Barcode[]) => {
      const barcodeValue = barcodes.find(
        barcode => barcode.rawValue || barcode.displayValue,
      );
      const value = barcodeValue?.rawValue ?? barcodeValue?.displayValue;

      if (value) {
        void submitBarcode(value);
      }
    },
    [submitBarcode],
  );

  const handleClose = () => {
    scannedRef.current = false;
    setError('');
    setLoading(false);
    onClose();
  };

  const renderScannerContent = () => {
    if (!hasPermission) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Camera access needed</Text>
          <Text style={styles.stateText}>
            Allow camera permission to scan medicine barcodes.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={
              canRequestPermission
                ? requestPermission
                : () => Linking.openSettings()
            }
          >
            <Text style={styles.primaryButtonText}>
              {canRequestPermission ? 'Allow Camera' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!device) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>No back camera found</Text>
          <Text style={styles.stateText}>
            Barcode scanning needs a back camera on this device.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CodeScanner
          style={styles.scanner}
          isActive={visible && !loading}
          barcodeFormats={['all-formats']}
          onBarcodeScanned={handleBarcodeScanned}
          onError={scannerError => setError(scannerError.message)}
        />
        <View pointerEvents="none" style={styles.scanFrame}>
          <View style={[styles.frameCorner, styles.frameCornerTopLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
        </View>
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            Point the back camera at a barcode
          </Text>
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>Fetching item details...</Text>
          </View>
        )}
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Barcode</Text>
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            style={styles.closeButton}
          >
            <X size={22} color="#2A2A2A" strokeWidth={2.5} />
          </Pressable>
        </View>

        {renderScannerContent()}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F6',
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scanner: {
    flex: 1,
  },
  scanFrame: {
    position: 'absolute',
    top: '32%',
    left: 42,
    right: 42,
    height: 190,
  },
  frameCorner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderColor: '#1CA39A',
  },
  frameCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  hintBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  loadingText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#7B6D63',
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1CA39A',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  errorText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '700',
    textAlign: 'center',
  },
});
