import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  itemCount: number;
  onPressHistory: () => void;
};

export const POSHeader = ({ itemCount, onPressHistory }: Props) => {
  const theme = useAppTheme();

  return (
    <View style={styles.headerRow}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        POS Billing
      </Text>
      <View style={styles.headerRight}>
        <Pressable onPress={onPressHistory}>
          <View style={styles.historyWrap}>
            <Clock3 size={12} color={theme.colors.mutedText} />
            <Text style={[styles.history, { color: theme.colors.mutedText }]}>
              History
            </Text>
          </View>
        </Pressable>
        <View
          style={[
            styles.itemsPill,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[styles.itemsPillText, { color: theme.colors.mutedText }]}
          >
            {`${itemCount} items`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  history: {
    color: '#7D6A5F',
    fontWeight: '600',
    fontSize: 12,
  },
  itemsPill: {
    backgroundColor: '#EFEBE7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemsPillText: {
    color: '#5E534D',
    fontSize: 11,
    fontWeight: '700',
  },
});
