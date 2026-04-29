import { useAppSelector } from '../../../app/hooks';
import { Medicine, InventoryFilter } from '../types';

export const useInventory = () => {
  const inventoryState = useAppSelector(state => state.inventory);

  const getFilteredMedicines = (filter: InventoryFilter): Medicine[] => {
    switch (filter) {
      case 'Low Stock':
        return inventoryState.medicines.filter(
          m => m.status === 'Low' || m.status === 'Critical',
        );
      case 'Expiring':
        return inventoryState.medicines.filter(
          m => m.status === 'Expiring' || m.status === 'Expired',
        );
      default:
        return inventoryState.medicines;
    }
  };

  const searchMedicines = (query: string): Medicine[] => {
    const lowerQuery = query.toLowerCase();
    return inventoryState.medicines.filter(
      m =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.genericName.toLowerCase().includes(lowerQuery) ||
        m.barcode.toLowerCase().includes(lowerQuery),
    );
  };

  const getMedicineById = (id: string): Medicine | undefined => {
    return inventoryState.medicines.find(m => m.id === id);
  };

  return {
    ...inventoryState,
    getFilteredMedicines,
    searchMedicines,
    getMedicineById,
  };
};
