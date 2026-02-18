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
  assignedCourierId?: string | null;
  courierAcceptedAt?: string | null;
  items: OrderItem[];
};

export type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  image?: string | null;
  isActive: boolean;
  available: boolean;
  categoryId: string;
  restaurantId: string;
  sortOrder?: number | null;
  stock?: number | null;
  category?: { id: string; name: string; slug: string };
  restaurant?: { id: string; name: string };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Creează instanță axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
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

// Interceptor: doar 401 = neautentificat → logout + redirect. 403 = interzis (ex. nu e curier) → nu delogăm.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isAuthLoginOrRegister =
        requestUrl === '/auth/login' || requestUrl === '/auth/register';
      if (isAuthLoginOrRegister) {
        return Promise.reject(error);
      }
      if (typeof window !== 'undefined') {
        const path = window.location.pathname + window.location.search;
        const safeNext = path.startsWith('/login') ? '/' : path;
        localStorage.removeItem('jester_token');
        localStorage.removeItem('jester_user');
        window.location.href = `/login?next=${encodeURIComponent(safeNext)}`;
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
  
  // Categories (includeProducts=1 pentru catalog cu produse active + isAvailable)
  categories: {
    getAll: (params?: { includeProducts?: "1" }) =>
      apiClient.get<{ categories: Array<{ id: string; name: string; slug: string; products?: Array<{ id: string; name: string; price: string; image?: string | null; isAvailable: boolean; categoryId: string }> }> }>('/categories', { params }),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
  },
  
  // Restaurants
  restaurants: {
    getAll: () => apiClient.get('/restaurants'),
    getById: (id: string) => apiClient.get(`/restaurants/${id}`),
  },
  
  // Orders (comenzi user, auth obligatoriu)
  orders: {
    getMy: (params?: { includeDeleted?: '1'; signal?: AbortSignal }) =>
      apiClient.get<{ orders: Order[] }>('/orders/my', {
        params: params?.includeDeleted ? { includeDeleted: params.includeDeleted } : undefined,
        signal: params?.signal,
      }),
    getById: (id: string) => apiClient.get<{ order: Order }>(`/orders/${id}`),
    updateStatus: (id: string, data: { status?: string; estimatedDeliveryMinutes?: number; internalNotes?: string }) =>
      apiClient.patch<{ order: Order }>(`/orders/${id}/status`, data),
    delete: (id: string) => apiClient.delete(`/orders/${id}`),
  },

  // Admin (protejat: auth + ADMIN_EMAILS în .env)
  admin: {
    getOrders: () => apiClient.get<{ orders: Order[] }>('/admin/orders'),
    getProducts: (params?: { category?: string }) =>
      apiClient.get<{ products: AdminProduct[] }>('/admin/products', { params }),
    updateProduct: (id: string, data: {
      name?: string;
      description?: string | null;
      price?: number;
      image?: string | null;
      categorySlug?: string;
      isActive?: boolean;
      available?: boolean;
      sortOrder?: number | null;
      stock?: number | null;
    }) =>
      apiClient.patch<{ product: AdminProduct }>(`/admin/products/${id}`, data),
    bulkActivate: (categoryId?: string) =>
      apiClient.post<{ success: boolean; count: number }>('/admin/products/bulk-activate', categoryId != null ? { categoryId } : {}),
    bulkDeactivate: (categoryId?: string) =>
      apiClient.post<{ success: boolean; count: number }>('/admin/products/bulk-deactivate', categoryId != null ? { categoryId } : {}),
  },

  // Addresses – autocomplete Sulina + validare (public)
  addresses: {
    search: (q: string) =>
      apiClient.get<{ suggestions: string[] }>('/addresses/search', { params: { q: q || '' } }),
    validate: (address: string) =>
      apiClient.get<{ valid: boolean }>('/addresses/validate', { params: { address: address || '' } }),
  },

  // Courier dashboard (auth + rol COURIER/ADMIN)
  courier: {
    getAvailable: () => apiClient.get<{ orders: Order[] }>('/courier/orders/available'),
    getMine: () => apiClient.get<{ orders: Order[] }>('/courier/orders/mine'),
    getHistory: () => apiClient.get<{ orders: Order[] }>('/courier/orders/history'),
    getRefused: () => apiClient.get<{ orders: (Order & { rejectedAt?: string; refusedReason?: string | null; statusDisplay?: string })[] }>('/courier/orders/refused'),
    getOrder: (id: string) => apiClient.get<{ order: Order }>(`/courier/orders/${id}`),
    accept: (id: string) => apiClient.post<{ order: Order }>(`/courier/orders/${id}/accept`),
    refuse: (id: string, reason?: string) =>
      apiClient.post<{ success: boolean }>(`/courier/orders/${id}/refuse`, reason != null ? { reason } : {}),
    setStatus: (id: string, status: 'ON_THE_WAY' | 'DELIVERED') =>
      apiClient.post<{ order: Order }>(`/courier/orders/${id}/status`, { status }),
  },

  // Cart orders: Checkout + status (admin)
  cartOrders: {
    create: (
      data: {
        orderType?: 'product_order' | 'package_delivery';
        total: number;
        items: Array<{ name: string; price: number; quantity: number; productId?: string }>;
        deliveryAddress: string;
        phone: string;
        name: string;
        notes?: string;
        paymentMethod?: 'CASH_ON_DELIVERY' | 'CARD' | 'cash';
      },
      options?: { idempotencyKey?: string }
    ) =>
      apiClient.post<{ success: boolean; orderId: string }>('/cart-orders', data, {
        headers: options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
      }),
    getAll: () => apiClient.get<{ orders: Order[] }>('/cart-orders'),
    updateStatus: (id: string, data: { status?: string; estimatedDeliveryMinutes?: number; internalNotes?: string }) =>
      apiClient.patch<{ order: Order }>(`/cart-orders/${id}/status`, data),
  },
};

export default apiClient;
