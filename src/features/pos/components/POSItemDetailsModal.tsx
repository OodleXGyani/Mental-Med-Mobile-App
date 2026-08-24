import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Minus,
  Pill,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react-native';
import { CartItem, WarehouseOption, BatchOption, ItemDetailsResponse } from '../types';
import { posService } from '../services/posService';
import { useAppTheme } from '../../../shared/theme';
import { formatAmount } from '../utils';

type Props = {
  visible: boolean;
  item: CartItem | null;
  isNewItem?: boolean;
  onClose: () => void;
  onSave: (updatedItem: CartItem) => void;
};

export const POSItemDetailsModal = ({
  visible,
  item,
  isNewItem = false,
  onClose,
  onSave,
}: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState('');

  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [itemDetails, setItemDetails] = useState<ItemDetailsResponse | null>(null);

  const [qty, setQty] = useState<number>(1);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Amount' | 'None'>('None');
  const [discountValue, setDiscountValue] = useState<string>('0');

  useEffect(() => {
    if (!visible || !item) {
      return;
    }

    setQty(Math.max(1, Math.floor(item.qty || 1)));
    setSelectedWarehouse(item.warehouse || '');
    setSelectedBatch(item.batch_no || item.batch || '');
    setWarehouseDropdownOpen(false);
    setBatchDropdownOpen(false);
    setWarehouseSearch('');
    setBatchSearch('');
    setDiscountType(
      item.discount_type === 'Percentage' || item.discount_type === 'Amount'
        ? item.discount_type
        : 'None',
    );
    setDiscountValue(item.discount_value ? String(item.discount_value) : '0');

    const itemCode = item.item_code || item.id;

    // 1. Fetch Warehouses
    setLoadingWarehouses(true);
    posService
      .getItemWarehouses(itemCode)
      .then(whList => {
        setWarehouses(whList);
        const positiveWh = whList.find(w => w.actual_qty > 0);
        const defaultWh =
          item.warehouse || (positiveWh ? positiveWh.warehouse : whList[0]?.warehouse || '');
        setSelectedWarehouse(defaultWh);
      })
      .catch(err => {
        console.warn('Could not load warehouses:', err);
      })
      .finally(() => {
        setLoadingWarehouses(false);
      });
  }, [visible, item]);

  // 2. Fetch Batches whenever selectedWarehouse changes
  useEffect(() => {
    if (!visible || !item || !selectedWarehouse) {
      return;
    }

    const itemCode = item.item_code || item.id;
    setLoadingBatches(true);
    posService
      .getItemBatches(itemCode, selectedWarehouse)
      .then(batchList => {
        setBatches(batchList);
        if (batchList.length > 0) {
          const match = batchList.find(
            b => b.batch_no === (item.batch_no || item.batch),
          );
          setSelectedBatch(match ? match.batch_no : batchList[0].batch_no);
        } else {
          setSelectedBatch('');
        }
      })
      .catch(err => {
        console.warn('Could not load batches:', err);
        setBatches([]);
      })
      .finally(() => {
        setLoadingBatches(false);
      });
  }, [visible, item, selectedWarehouse]);

  // 3. Fetch Details whenever Warehouse or Batch changes
  useEffect(() => {
    if (!visible || !item || !selectedWarehouse) {
      return;
    }

    const itemCode = item.item_code || item.id;
    const isValidBatch = batches.length > 0 && batches.some(b => b.batch_no === selectedBatch);
    const batchToSend = isValidBatch ? selectedBatch : undefined;

    setLoadingDetails(true);
    posService
      .getItemDetails(itemCode, selectedWarehouse, batchToSend)
      .then(details => {
        setItemDetails(details);
      })
      .catch(err => {
        console.warn('Could not load live details:', err);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  }, [visible, item, selectedWarehouse, selectedBatch, batches]);

  // Filtered Warehouses
  const filteredWarehouses = useMemo(() => {
    const q = warehouseSearch.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter(w => w.warehouse.toLowerCase().includes(q));
  }, [warehouses, warehouseSearch]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter(
      b =>
        b.batch_no.toLowerCase().includes(q) ||
        (b.expiry_date && b.expiry_date.toLowerCase().includes(q)),
    );
  }, [batches, batchSearch]);

  const unitRate = itemDetails?.rate ?? (item?.price || item?.rate || 0);
  const mrp = itemDetails?.mrp ?? item?.mrp ?? 0;
  const uom = itemDetails?.uom ?? item?.uom ?? 'Strip';
  const warehouseStock = itemDetails?.actual_qty ?? 0;
  const batchQty = itemDetails?.batch_qty ?? 0;
  const isRx = itemDetails?.prescription_required ?? item?.prescription_required ?? false;
  const convFactor = itemDetails?.conversion_factor ?? item?.conversion_factor ?? 1;

  // Calculate effective price after item-level discount
  const numDiscount = Number(discountValue) || 0;
  let discountedUnitRate = unitRate;
  if (discountType === 'Percentage' && numDiscount > 0) {
    discountedUnitRate = Math.max(0, unitRate - (unitRate * numDiscount) / 100);
  } else if (discountType === 'Amount' && numDiscount > 0) {
    discountedUnitRate = Math.max(0, unitRate - numDiscount);
  }

  const totalAmount = discountedUnitRate * qty;

  const handleApply = () => {
    if (!item) return;

    const updated: CartItem = {
      ...item,
      warehouse: selectedWarehouse,
      batch: selectedBatch,
      batch_no: selectedBatch,
      exp: itemDetails?.expiry_date || item.exp,
      price: discountedUnitRate,
      rate: unitRate,
      mrp: mrp > 0 ? mrp : undefined,
      uom,
      qty,
      discount_type: discountType !== 'None' ? discountType : undefined,
      discount_value: numDiscount > 0 ? numDiscount : undefined,
      prescription_required: isRx,
      conversion_factor: convFactor,
    };

    onSave(updated);
    onClose();
  };

  const isBatchRequired = item?.has_batch_no ?? true;
  const isMissingRequiredBatch = isBatchRequired && batches.length > 0 && !selectedBatch;

  if (!item) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          {/* Header (Configure Cart Item) */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <SlidersHorizontal size={18} color={theme.colors.primary} />
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                Configure Cart Item
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Medicine Header Banner (Icon + Name + Code + UOM) */}
            <View
              style={[
                styles.itemHeaderCard,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.pillIconWrap,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <Pill size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.itemHeaderInfo}>
                <Text
                  style={[styles.medicineName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={styles.codeUomRow}>
                  <Text
                    style={[styles.codeText, { color: theme.colors.mutedText }]}
                  >
                    Code: {item.item_code || item.id}
                  </Text>
                  <View
                    style={[
                      styles.uomBadge,
                      {
                        backgroundColor: `${theme.colors.primary}12`,
                        borderColor: `${theme.colors.primary}35`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.uomText, { color: theme.colors.primary }]}
                    >
                      UOM: {uom}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 6-Stat Information Grid */}
            <View
              style={[
                styles.statsGridCard,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Row 1: Warehouse Stock, Batch Quantity, Rate */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text
                    style={[styles.statLabel, { color: theme.colors.mutedText }]}
                  >
                    Warehouse Stock
                  </Text>
                  <View style={styles.dotValueRow}>
                    <View
                      style={[
                        styles.stockDot,
                        {
                          backgroundColor:
                            warehouseStock > 0 ? '#10B981' : '#EF4444',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: warehouseStock > 0 ? '#10B981' : '#EF4444',
                        },
                      ]}
                    >
                      {warehouseStock} {uom}
                    </Text>
                  </View>
                </View>

                <View style={styles.statCol}>
                  <Text
                    style={[styles.statLabel, { color: theme.colors.mutedText }]}
                  >
                    Batch Quantity
                  </Text>
                  <Text
                    style={[styles.statValue, { color: theme.colors.text }]}
                  >
                    {batchQty > 0 ? batchQty : '—'}
                  </Text>
                </View>

                <View style={styles.statCol}>
                  <Text
                    style={[styles.statLabel, { color: theme.colors.mutedText }]}
                  >
                    Rate (per unit)
                  </Text>
                  <Text
                    style={[
                      styles.statValueBold,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {formatAmount(unitRate)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.gridDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* Row 2: MRP, Prescription Required, Conversion Factor */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text
                    style={[styles.statLabel, { color: theme.colors.mutedText }]}
                  >
                    MRP
                  </Text>
                  <Text
                    style={[styles.statValue, { color: theme.colors.text }]}
                  >
                    {mrp > 0 ? formatAmount(mrp) : '—'}
                  </Text>
                </View>

                <View style={styles.statCol}>
                  <Text
                    style={[styles.statLabel, { color: theme.colors.mutedText }]}
                  >
                    Prescription
                  </Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isRx ? '#EF4444' : theme.colors.text },
                    ]}
                  >
                    {isRx ? 'Required (Rx)' : 'No'}
                  </Text>
                </View>

                <View style={styles.statCol}>
                  <Text
                    style={[styles.statLabel, { color: theme.colors.mutedText }]}
                  >
                    Conversion Factor
                  </Text>
                  <Text
                    style={[styles.statValue, { color: theme.colors.text }]}
                  >
                    {convFactor}
                  </Text>
                </View>
              </View>
            </View>

            {/* 1. SELECT WAREHOUSE (Searchable Dropdown) */}
            <View style={styles.dropdownSection}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Select Warehouse <Text style={styles.reqStar}>*</Text>
              </Text>

              {/* Trigger Input */}
              <Pressable
                style={[
                  styles.dropdownTrigger,
                  {
                    borderColor: warehouseDropdownOpen
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                onPress={() => {
                  setWarehouseDropdownOpen(prev => !prev);
                  setBatchDropdownOpen(false);
                }}
              >
                <View style={styles.triggerLeft}>
                  <Building2 size={16} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.triggerText,
                      {
                        color: selectedWarehouse
                          ? theme.colors.text
                          : theme.colors.mutedText,
                        fontWeight: selectedWarehouse ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedWarehouse || 'Select warehouse...'}
                  </Text>
                </View>
                {warehouseDropdownOpen ? (
                  <ChevronUp size={18} color={theme.colors.primary} />
                ) : (
                  <ChevronDown size={18} color={theme.colors.mutedText} />
                )}
              </Pressable>

              {/* Dropdown Menu with Search Field */}
              {warehouseDropdownOpen && (
                <View
                  style={[
                    styles.dropdownMenuCard,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                >
                  {/* Search Field */}
                  <View
                    style={[
                      styles.dropdownSearchRow,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <Search size={14} color={theme.colors.mutedText} />
                    <TextInput
                      style={[
                        styles.dropdownSearchInput,
                        { color: theme.colors.text },
                      ]}
                      placeholder="Search warehouse..."
                      placeholderTextColor={theme.colors.mutedText}
                      value={warehouseSearch}
                      onChangeText={setWarehouseSearch}
                      autoFocus
                    />
                    {warehouseSearch ? (
                      <Pressable
                        onPress={() => setWarehouseSearch('')}
                        hitSlop={8}
                      >
                        <X size={14} color={theme.colors.mutedText} />
                      </Pressable>
                    ) : null}
                  </View>

                  {/* List */}
                  {loadingWarehouses ? (
                    <ActivityIndicator
                      color={theme.colors.primary}
                      style={{ paddingVertical: 12 }}
                    />
                  ) : filteredWarehouses.length === 0 ? (
                    <Text
                      style={[
                        styles.emptyDropdownText,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      No warehouses found
                    </Text>
                  ) : (
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                    >
                      {filteredWarehouses.map((wh, idx) => {
                        const isSelected = selectedWarehouse === wh.warehouse;
                        return (
                          <Pressable
                            key={`wh-opt-${wh.warehouse}-${idx}`}
                            style={[
                              styles.dropdownItemRow,
                              isSelected && {
                                backgroundColor: `${theme.colors.primary}12`,
                              },
                            ]}
                            onPress={() => {
                              setSelectedWarehouse(wh.warehouse);
                              setWarehouseDropdownOpen(false);
                              setWarehouseSearch('');
                            }}
                          >
                            <View style={styles.dropdownItemInfo}>
                              <Text
                                style={[
                                  styles.dropdownItemTitle,
                                  {
                                    color: isSelected
                                      ? theme.colors.primary
                                      : theme.colors.text,
                                    fontWeight: isSelected ? '700' : '600',
                                  },
                                ]}
                              >
                                {wh.warehouse || 'Default Warehouse'}
                              </Text>
                              <Text
                                style={[
                                  styles.dropdownItemSub,
                                  { color: theme.colors.mutedText },
                                ]}
                              >
                                Stock: {wh.actual_qty} {uom}
                              </Text>
                            </View>
                            {isSelected && (
                              <Check size={16} color={theme.colors.primary} />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            {/* 2. SELECT BATCH NUMBER (Searchable Dropdown) */}
            <View style={styles.dropdownSection}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Select Batch Number <Text style={styles.reqStar}>*</Text>
              </Text>

              {/* Trigger Input */}
              <Pressable
                style={[
                  styles.dropdownTrigger,
                  {
                    borderColor: batchDropdownOpen
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                onPress={() => {
                  setBatchDropdownOpen(prev => !prev);
                  setWarehouseDropdownOpen(false);
                }}
              >
                <View style={styles.triggerLeft}>
                  <Layers size={16} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.triggerText,
                      {
                        color: selectedBatch
                          ? theme.colors.text
                          : theme.colors.mutedText,
                        fontWeight: selectedBatch ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedBatch || (batches.length === 0 ? 'No batches available' : 'Select batch...')}
                  </Text>
                </View>
                {batchDropdownOpen ? (
                  <ChevronUp size={18} color={theme.colors.primary} />
                ) : (
                  <ChevronDown size={18} color={theme.colors.mutedText} />
                )}
              </Pressable>

              {/* Dropdown Menu with Search Field */}
              {batchDropdownOpen && (
                <View
                  style={[
                    styles.dropdownMenuCard,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                >
                  {/* Search Field */}
                  <View
                    style={[
                      styles.dropdownSearchRow,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <Search size={14} color={theme.colors.mutedText} />
                    <TextInput
                      style={[
                        styles.dropdownSearchInput,
                        { color: theme.colors.text },
                      ]}
                      placeholder="Search batch number..."
                      placeholderTextColor={theme.colors.mutedText}
                      value={batchSearch}
                      onChangeText={setBatchSearch}
                      autoFocus
                    />
                    {batchSearch ? (
                      <Pressable
                        onPress={() => setBatchSearch('')}
                        hitSlop={8}
                      >
                        <X size={14} color={theme.colors.mutedText} />
                      </Pressable>
                    ) : null}
                  </View>

                  {/* List */}
                  {loadingBatches ? (
                    <ActivityIndicator
                      color={theme.colors.primary}
                      style={{ paddingVertical: 12 }}
                    />
                  ) : filteredBatches.length === 0 ? (
                    <Text
                      style={[
                        styles.emptyDropdownText,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      No batches found
                    </Text>
                  ) : (
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                    >
                      {filteredBatches.map((b, idx) => {
                        const isSelected = selectedBatch === b.batch_no;
                        return (
                          <Pressable
                            key={`batch-opt-${b.batch_no}-${idx}`}
                            style={[
                              styles.dropdownItemRow,
                              isSelected && {
                                backgroundColor: `${theme.colors.primary}12`,
                              },
                            ]}
                            onPress={() => {
                              setSelectedBatch(b.batch_no);
                              setBatchDropdownOpen(false);
                              setBatchSearch('');
                            }}
                          >
                            <View style={styles.dropdownItemInfo}>
                              <Text
                                style={[
                                  styles.dropdownItemTitle,
                                  {
                                    color: isSelected
                                      ? theme.colors.primary
                                      : theme.colors.text,
                                    fontWeight: isSelected ? '700' : '600',
                                  },
                                ]}
                              >
                                {b.batch_no || 'Batch'}
                              </Text>
                              <Text
                                style={[
                                  styles.dropdownItemSub,
                                  { color: theme.colors.mutedText },
                                ]}
                              >
                                Available: {b.actual_qty} {uom} • Exp:{' '}
                                {b.expiry_date || 'N/A'}
                              </Text>
                            </View>
                            {isSelected && (
                              <Check size={16} color={theme.colors.primary} />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            {/* Item Discount Section */}
            <View
              style={[
                styles.discountSectionCard,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.pricingRefNote, { color: theme.colors.mutedText }]}
              >
                Selling Price: {formatAmount(unitRate)} • MRP:{' '}
                {mrp > 0 ? formatAmount(mrp) : 'N/A'}
              </Text>

              <View style={styles.discountRow}>
                <View style={styles.discountCol}>
                  <Text
                    style={[
                      styles.fieldLabelSmall,
                      { color: theme.colors.text },
                    ]}
                  >
                    Item Discount Type
                  </Text>
                  <View style={styles.typeSelectorRow}>
                    {(['None', 'Percentage', 'Amount'] as const).map(t => (
                      <Pressable
                        key={t}
                        style={[
                          styles.typePill,
                          {
                            borderColor:
                              discountType === t
                                ? theme.colors.primary
                                : theme.colors.border,
                            backgroundColor:
                              discountType === t
                                ? `${theme.colors.primary}18`
                                : theme.colors.card,
                          },
                        ]}
                        onPress={() => setDiscountType(t)}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            {
                              color:
                                discountType === t
                                  ? theme.colors.primary
                                  : theme.colors.mutedText,
                              fontWeight:
                                discountType === t ? '700' : '500',
                            },
                          ]}
                        >
                          {t === 'None' ? 'None' : t === 'Percentage' ? '% Pct' : '₹ Amt'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {discountType !== 'None' && (
                  <View style={styles.discountValCol}>
                    <Text
                      style={[
                        styles.fieldLabelSmall,
                        { color: theme.colors.text },
                      ]}
                    >
                      Discount Value
                    </Text>
                    <View
                      style={[
                        styles.inputWithIcon,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                        },
                      ]}
                    >
                      <Tag size={13} color={theme.colors.mutedText} />
                      <TextInput
                        style={[
                          styles.discountInput,
                          { color: theme.colors.text },
                        ]}
                        keyboardType="numeric"
                        value={discountValue}
                        onChangeText={setDiscountValue}
                        placeholder="0"
                        placeholderTextColor={theme.colors.mutedText}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Quantity Stepper */}
            <View
              style={[
                styles.qtyCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <View>
                <Text style={[styles.qtyLabel, { color: theme.colors.text }]}>
                  Quantity ({uom})
                </Text>
                <Text
                  style={[
                    styles.qtySub,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  Unit Rate: {formatAmount(discountedUnitRate)}
                </Text>
              </View>
              <View style={styles.stepperWrap}>
                <Pressable
                  style={[
                    styles.stepBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  onPress={() => setQty(prev => Math.max(1, prev - 1))}
                >
                  <Minus size={15} color={theme.colors.text} />
                </Pressable>
                <Text
                  style={[styles.qtyDisplay, { color: theme.colors.text }]}
                >
                  {qty}
                </Text>
                <Pressable
                  style={[
                    styles.stepBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    },
                  ]}
                  onPress={() => setQty(prev => prev + 1)}
                >
                  <Plus size={15} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer (Cancel + Apply Changes) */}
          <View style={styles.footerWrap}>
            <Pressable
              style={[
                styles.cancelButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.cancelButtonText, { color: theme.colors.text }]}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              disabled={isMissingRequiredBatch}
              style={[
                styles.applyButton,
                {
                  backgroundColor: isMissingRequiredBatch
                    ? theme.colors.border
                    : theme.colors.primary,
                },
              ]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>
                {isMissingRequiredBatch
                  ? 'Please Select a Batch'
                  : isNewItem
                  ? `Add to Cart • ${formatAmount(totalAmount)}`
                  : `Apply Changes • ${formatAmount(totalAmount)}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    paddingVertical: 12,
    gap: 12,
  },
  itemHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  pillIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemHeaderInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '800',
  },
  codeUomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  codeText: {
    fontSize: 11.5,
  },
  uomBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  uomText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statsGridCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 3,
  },
  dotValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statValueBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  gridDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  dropdownSection: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  reqStar: {
    color: '#EF4444',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  triggerText: {
    fontSize: 13.5,
    flex: 1,
  },
  dropdownMenuCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 8,
    marginTop: 4,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12.5,
    paddingVertical: 2,
  },
  dropdownScroll: {
    maxHeight: 160,
  },
  emptyDropdownText: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 12,
    fontStyle: 'italic',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 13,
  },
  dropdownItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  discountSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  pricingRefNote: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  discountRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  discountCol: {
    flex: 1,
  },
  discountValCol: {
    width: 100,
  },
  fieldLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 11,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 6,
    height: 36,
  },
  discountInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
  },
  qtyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  qtyLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  qtySub: {
    fontSize: 11,
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDisplay: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  footerWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
