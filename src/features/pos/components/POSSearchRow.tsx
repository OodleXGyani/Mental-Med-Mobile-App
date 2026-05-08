import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Search } from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  onPressMedicineSearch: () => void;
  onPressScan: () => void;
};

export const POSSearchRow = ({ onPressMedicineSearch, onPressScan }: Props) => {
  const theme = useAppTheme();

  return (
    <View style={styles.searchRow}>
      <Pressable
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={onPressMedicineSearch}
      >
        <Search size={14} color={theme.colors.mutedText} strokeWidth={2.5} />
        <Text style={[styles.searchText, { color: theme.colors.mutedText }]}>
          Search Medicine
        </Text>
      </Pressable>
      <Pressable
        style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
        onPress={onPressScan}
      >
        <Camera size={14} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={styles.scanText}>Scan</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchText: {
    color: '#B09A8E',
    fontWeight: '500',
    flex: 1,
    fontSize: 12.5,
  },
  scanButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  scanText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
});
