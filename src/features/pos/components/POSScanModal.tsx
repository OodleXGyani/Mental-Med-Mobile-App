import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  progress: number;
  onClose: () => void;
};

export const POSScanModal = ({ visible, progress, onClose }: Props) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.scanModalBody}>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <X size={16} color="#FFFFFF" />
          </Pressable>
          <View style={styles.scanFrame}>
            <View style={styles.scanLine} />
          </View>
          <Text style={styles.scanHint}>Point camera at barcode...</Text>
          <Text style={styles.scanProgress}>{`Scanning ${Math.min(progress, 100)}%`}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanModalBody: {
    alignItems: 'center',
    width: '82%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  scanFrame: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2BB8B0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scanLine: {
    height: 2,
    backgroundColor: '#2BD6D1',
    shadowColor: '#2BD6D1',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scanHint: {
    marginTop: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scanProgress: {
    marginTop: 4,
    color: '#D7D8DA',
    fontSize: 12,
  },
});
