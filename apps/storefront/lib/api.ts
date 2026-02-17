import axios from 'axios';

export type OrderItem = { id: string; orderId: string; name: string; price: string; quantity: number };
export type Address = {
  id: string;
  userId: string;
  label: string;
  street: string;
  number?: string | null;
  details?: string | null;
  city: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
  createdAt: string;
};
export type CreateAddressInput = {
  label: 'Home' | 'Work' | 'Other';
  street: string;
  number?: string;
  details?: string;
  city: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
};
export type UpdateAddressInput = Partial<CreateAddressInput> & { isDefault?: boolean };
export type Order = {
  id: string;
  orderType?: "product_order" | "package_delivery";
  status: string;
  total: string;
  estimatedDeliveryMinutes?: number | null;
  internalNotes?: string | null;
  paymentMethod?: string;
  deliveryAddress?: string;
  phone?: string;
  name?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Creează instanță axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pentru adăugare token în headers
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jester_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pentru gestionare erori
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid sau expirat → redirect cu ?next= pentru revenire după login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jester_token');
        localStorage.removeItem('jester_user');
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; name: string; phone?: string }) =>
      apiClient.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    me: () => apiClient.get('/auth/me'),
  },

  // Profile + Addresses (auth required)
  me: {
    getProfile: () => apiClient.get<{ user: { id: string; email: string; name: string; phone?: string | null } }>('/me'),
    updateProfile: (data: { name?: string; phone?: string | null }) =>
      apiClient.patch<{ user: { id: string; email: string; name: string; phone?: string | null } }>('/me', data),
    getAddresses: () =>
      apiClient.get<{ addresses: Address[] }>('/me/addresses'),
    createAddress: (data: CreateAddressInput) =>
      apiClient.post<{ address: Address }>('/me/addresses', data),
    updateAddress: (id: string, data: UpdateAddressInput) =>
      apiClient.patch<{ address: Address }>(`/me/addresses/${id}`, data),
    deleteAddress: (id: string) => apiClient.delete(`/me/addresses/${id}`),
  },
  
  // Products
  products: {
    getAll: (params?: { category?: string; restaurant?: string; page?: number; limit?: number }) =>
      apiClient.get('/products', { params }),
    getById: (id: string) => apiClient.get(`/products/${id}`),
  },
  
  // Categories
  categories: {
    getAll: () => apiClient.get('/categories'),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
  },
  
  // Restaurants
  restaurants: {
    getAll: () => apiClient.get('/restaurants'),
    getById: (id: string) => apiClient.get(`/restaurants/${id}`),
  },
  
  // Orders (comenzi user, auth obligatoriu)
  orders: {
    getMy: (params?: { includeDeleted?: '1' }) =>
      apiClient.get<{ orders: Order[] }>('/orders/my', { params }),
    getById: (id: string) => apiClient.get<{ order: Order }>(`/orders/${id}`),
    updateStatus: (id: string, data: { status?: string; estimatedDeliveryMinutes?: number; internalNotes?: string }) =>
      apiClient.patch<{ order: Order }>(`/orders/${id}/status`, data),
    delete: (id: string) => apiClient.delete(`/orders/${id}`),
  },

  // Admin (protejat: auth + ADMIN_EMAILS în .env)
  admin: {
    getOrders: () => apiClient.get<{ orders: Order[] }>('/admin/orders'),
  },

  // Addresses – autocomplete Sulina + validare (public)
  addresses: {
    search: (q: string) =>
      apiClient.get<{ suggestions: string[] }>('/addresses/search', { params: { q: q || '' } }),
    validate: (address: string) =>
      apiClient.get<{ valid: boolean }>('/addresses/validate', { params: { address: address || '' } }),
  },

  // Cart orders: Checkout + status (admin)
  cartOrders: {
    create: (data: {
      orderType?: 'product_order' | 'package_delivery';
      total: number;
      items: Array<{ name: string; price: number; quantity: number }>;
      deliveryAddress: string;
      phone: string;
      name: string;
      notes?: string;
      paymentMethod?: 'CASH_ON_DELIVERY' | 'CARD' | 'cash';
    }) => apiClient.post<{ success: boolean; orderId: string }>('/cart-orders', data),
    getAll: () => apiClient.get<{ orders: Order[] }>('/cart-orders'),
    updateStatus: (id: string, data: { status?: string; estimatedDeliveryMinutes?: number; internalNotes?: string }) =>
      apiClient.patch<{ order: Order }>(`/cart-orders/${id}/status`, data),
  },
};

export default apiClient;
