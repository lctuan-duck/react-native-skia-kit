// ===== Mock Data for Example App =====

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageColor: string; // placeholder color for the product image
  soldOut?: boolean;
}

export interface Category {
  id: string;
  label: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

// ===== Categories =====
export const categories: Category[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'trasua', label: 'Trà sữa' },
  { id: 'nuocep', label: 'Nước ép' },
];

// ===== Products =====
export const products: Product[] = [
  { id: '1', name: 'Cafe cappuccino', price: 55000, category: 'cafe', imageColor: '#8B6914' },
  { id: '2', name: 'Cafe expresso', price: 55000, category: 'cafe', imageColor: '#5C3D1A' },
  { id: '3', name: 'Cơm tấm sườn', price: 45000, category: 'all', imageColor: '#D4A03C', soldOut: true },
  { id: '4', name: 'Cafe muối', price: 40000, category: 'cafe', imageColor: '#7B5B3A' },
  { id: '5', name: 'Trà sữa trân châu', price: 35000, category: 'trasua', imageColor: '#C89E6D' },
  { id: '6', name: 'Nước ép cam', price: 30000, category: 'nuocep', imageColor: '#FF8C00' },
];

// ===== Quick Actions (Home Screen) =====
export const quickActions: QuickAction[] = [
  { id: '1', label: 'Lịch sử\norder', icon: 'search', color: '#1A73E8', bgColor: '#E8F0FE' },
  { id: '2', label: 'Lịch làm\nviệc', icon: 'edit', color: '#F97316', bgColor: '#FFF3E0' },
  { id: '3', label: 'Đăng ký\nlàm việc', icon: 'check', color: '#DC2626', bgColor: '#FEE2E2' },
  { id: '4', label: 'Tạo thu\nchi', icon: 'star', color: '#16A34A', bgColor: '#DCFCE7' },
  { id: '5', label: 'Order\nhàng hóa', icon: 'send', color: '#16A34A', bgColor: '#DCFCE7' },
  { id: '6', label: 'Kỳ lương', icon: 'lock', color: '#1A73E8', bgColor: '#E8F0FE' },
  { id: '7', label: 'Đăng ký\nnghỉ', icon: 'plus', color: '#7C3AED', bgColor: '#F3E8FF' },
  { id: '8', label: 'Tất cả', icon: 'more', color: '#6B7280', bgColor: '#F3F4F6' },
];

// ===== Helpers =====
export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + ' đ';
}
