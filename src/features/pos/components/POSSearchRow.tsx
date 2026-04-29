import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Camera, Search } from 'lucide-react-native';

type Props = {
  searchText: string;
  onSearchChange: (value: string) => void;
  onPressScan: () => void;
};

export const POSSearchRow = ({ searchText, onSearchChange, onPressScan }: Props) => {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchInput}>
        <Search size={14} color="#8F7E74" strokeWidth={2.5} />
        <TextInput
          placeholder="Search Medicine"
          placeholderTextColor="#B09A8E"
          style={styles.searchText}
          value={searchText}
          onChangeText={onSearchChange}
        />
      </View>
      <Pressable style={styles.scanButton} onPress={onPressScan}>
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
  },
  searchText: {
    color: '#B09A8E',
    fontWeight: '500',
    flex: 1,
    paddingVertical: 8,
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
