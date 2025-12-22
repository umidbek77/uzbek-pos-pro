import { create } from 'zustand';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  vatRate: number;
  discount: number;
}

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  cashback_balance: number;
  loyalty_tier: string;
}

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discountPercent: number;
  discountAmount: number;
  useCashback: boolean;
  cashbackAmount: number;
  notes: string;
  
  // Computed
  subtotal: () => number;
  totalDiscount: () => number;
  vatAmount: () => number;
  total: () => number;
  itemCount: () => number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemDiscount: (itemId: string, discount: number) => void;
  removeItem: (itemId: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscountPercent: (percent: number) => void;
  setDiscountAmount: (amount: number) => void;
  setUseCashback: (use: boolean) => void;
  setCashbackAmount: (amount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getCartData: () => object;
  restoreCart: (data: object) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discountPercent: 0,
  discountAmount: 0,
  useCashback: false,
  cashbackAmount: 0,
  notes: '',
  
  subtotal: () => {
    return get().items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + itemTotal - item.discount;
    }, 0);
  },
  
  totalDiscount: () => {
    const state = get();
    const itemDiscounts = state.items.reduce((sum, item) => sum + item.discount, 0);
    const subtotal = state.subtotal();
    const percentDiscount = (subtotal * state.discountPercent) / 100;
    return itemDiscounts + percentDiscount + state.discountAmount;
  },
  
  vatAmount: () => {
    const state = get();
    return state.items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice * item.quantity) - item.discount;
      return sum + (itemTotal * item.vatRate) / 100;
    }, 0);
  },
  
  total: () => {
    const state = get();
    const subtotal = state.subtotal();
    const percentDiscount = (subtotal * state.discountPercent) / 100;
    const cashback = state.useCashback ? state.cashbackAmount : 0;
    return subtotal - percentDiscount - state.discountAmount - cashback + state.vatAmount();
  },
  
  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  
  addItem: (item) => {
    const existingIndex = get().items.findIndex(
      i => i.productId === item.productId && i.variantId === item.variantId
    );
    
    if (existingIndex >= 0) {
      const items = [...get().items];
      items[existingIndex].quantity += item.quantity;
      set({ items });
    } else {
      set({ items: [...get().items, { ...item, id: crypto.randomUUID() }] });
    }
  },
  
  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set({
      items: get().items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    });
  },
  
  updateItemDiscount: (itemId, discount) => {
    set({
      items: get().items.map(item =>
        item.id === itemId ? { ...item, discount } : item
      ),
    });
  },
  
  removeItem: (itemId) => {
    set({ items: get().items.filter(item => item.id !== itemId) });
  },
  
  setCustomer: (customer) => {
    set({ customer });
    if (!customer) {
      set({ useCashback: false, cashbackAmount: 0 });
    }
  },
  
  setDiscountPercent: (percent) => set({ discountPercent: percent }),
  setDiscountAmount: (amount) => set({ discountAmount: amount }),
  setUseCashback: (use) => set({ useCashback: use }),
  setCashbackAmount: (amount) => set({ cashbackAmount: amount }),
  setNotes: (notes) => set({ notes }),
  
  clearCart: () => set({
    items: [],
    customer: null,
    discountPercent: 0,
    discountAmount: 0,
    useCashback: false,
    cashbackAmount: 0,
    notes: '',
  }),
  
  getCartData: () => ({
    items: get().items,
    customer: get().customer,
    discountPercent: get().discountPercent,
    discountAmount: get().discountAmount,
    useCashback: get().useCashback,
    cashbackAmount: get().cashbackAmount,
    notes: get().notes,
  }),
  
  restoreCart: (data: any) => {
    set({
      items: data.items || [],
      customer: data.customer || null,
      discountPercent: data.discountPercent || 0,
      discountAmount: data.discountAmount || 0,
      useCashback: data.useCashback || false,
      cashbackAmount: data.cashbackAmount || 0,
      notes: data.notes || '',
    });
  },
}));
