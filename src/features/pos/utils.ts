export const formatAmount = (value: number) => `Rs ${value.toFixed(2)}`;

// Stable per-cart-row identity, separate from a row's `id`/`item_code`.
// `item_code` answers "which medicine"; `line_id` answers "which specific
// cart row" -- needed once two rows are allowed to share an item_code
// (same medicine added from two different warehouses/batches). Every
// handler that must act on exactly one row, not every row sharing an
// item_code, matches on this instead of `id`.
let lineIdCounter = 0;
export const makeLineId = (itemCode?: string) => {
  lineIdCounter += 1;
  return `${itemCode || 'item'}_${Date.now()}_${lineIdCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};
