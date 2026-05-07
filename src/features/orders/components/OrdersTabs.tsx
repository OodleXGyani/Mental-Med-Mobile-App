import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../../shared/theme';

export type TabType = 'New' | 'Active' | 'Ready' | 'Done';

type Props = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: {
    cNew: number;
    cActive: number;
    cReady: number;
    cDone: number;
  };
};

export const OrdersTabs = ({ activeTab, onTabChange, counts }: Props) => {
  const theme = useAppTheme();
  const tabs: TabType[] = ['New', 'Active', 'Ready', 'Done'];
  const tabCounts = {
    New: counts.cNew,
    Active: counts.cActive,
    Ready: counts.cReady,
    Done: counts.cDone,
  };

  return (
    <View style={[styles.tabsRow, { borderBottomColor: theme.colors.border }]}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => onTabChange(tab)}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.mutedText },
              activeTab === tab && {
                color: theme.colors.primary,
                fontWeight: '700',
              },
            ]}
          >
            {tab} ({tabCounts[tab]})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E8066',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A7958A',
  },
  tabTextActive: {
    color: '#1E8066',
    fontWeight: '700',
  },
});
