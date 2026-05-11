import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, X, Search } from 'lucide-react-native';

export type DropdownOption = {
  value: string;
  description: string;
};

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: DropdownOption[];
  loading: boolean;
  error?: string;
  onSelect: (option: DropdownOption) => void;
  onClearError?: () => void;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
};

export const SearchableDropdown = ({
  label,
  value,
  placeholder,
  options,
  loading,
  error,
  onSelect,
  onClearError,
  borderColor = '#D4C4B8',
  backgroundColor = '#FAFAF8',
  textColor = '#2A2A2A',
}: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.description : placeholder;

  const filteredOptions = options.filter(
    opt =>
      opt.value.toLowerCase().includes(searchText.toLowerCase()) ||
      opt.description.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleSelect = (option: DropdownOption) => {
    onSelect(option);
    setSearchText('');
    setShowModal(false);
  };

  const handleOpenModal = () => {
    if (onClearError) onClearError();
    setShowModal(true);
  };

  return (
    <View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <Pressable
        style={[styles.inputContainer, { borderColor, backgroundColor }]}
        onPress={handleOpenModal}
      >
        <Text
          style={[
            styles.inputText,
            {
              color: value ? textColor : '#B8A89C',
            },
          ]}
        >
          {displayText}
        </Text>
        <ChevronDown size={18} color={textColor} strokeWidth={2} />
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={8}>
                <X size={20} color="#2A2A2A" strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Search size={18} color="#B8A89C" strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${label.toLowerCase()}...`}
                placeholderTextColor="#B8A89C"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText ? (
                <Pressable onPress={() => setSearchText('')}>
                  <X size={18} color="#B8A89C" strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1CA39A" />
              </View>
            ) : filteredOptions.length > 0 ? (
              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
              >
                {filteredOptions.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.value}-${index}`}
                    style={[
                      styles.optionItem,
                      value === option.value && styles.selectedOption,
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <View>
                      <Text
                        style={[
                          styles.optionValue,
                          value === option.value && styles.selectedText,
                        ]}
                      >
                        {option.value}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          value === option.value && styles.selectedDescription,
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No {label.toLowerCase()} found
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D4C4B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAF8',
  },
  inputText: {
    fontSize: 13,
    color: '#2A2A2A',
    flex: 1,
  },
  error: {
    fontSize: 11,
    color: '#E74C3C',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAFAF8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4C4B8',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2A2A2A',
    paddingVertical: 10,
  },
  optionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#E8F5F2',
    borderColor: '#1CA39A',
  },
  optionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  selectedText: {
    color: '#1CA39A',
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    color: '#999',
  },
  selectedDescription: {
    color: '#1CA39A',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
