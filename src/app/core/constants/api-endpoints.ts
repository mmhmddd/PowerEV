// src/app/core/constants/api-endpoints.ts
import { environment } from '../../environment/environment';

const API_BASE = environment.apiUrl;

export const ApiEndpoints = {
  // Authentication Endpoints
  auth: {
    login: `${API_BASE}/auth/login`,
    forgotPassword: `${API_BASE}/auth/forgot-password`,
    resetPassword: (resetToken: string) => `${API_BASE}/auth/reset-password/${resetToken}`,
    getMe: `${API_BASE}/auth/me`
  },

  // User Endpoints
  users: {
    getAll: `${API_BASE}/users`,
    getById: (id: string) => `${API_BASE}/users/${id}`,
    create: `${API_BASE}/users`,
    update: (id: string) => `${API_BASE}/users/${id}`,
    delete: (id: string) => `${API_BASE}/users/${id}`,
    updatePassword: (id: string) => `${API_BASE}/users/${id}/password`
  },

  // Adapter Endpoints
  adapters: {
    getAll: `${API_BASE}/adapters`,
    getById: (id: string) => `${API_BASE}/adapters/${id}`,
    create: `${API_BASE}/adapters`,
    update: (id: string) => `${API_BASE}/adapters/${id}`,
    delete: (id: string) => `${API_BASE}/adapters/${id}`
  },

  // Box Endpoints
  boxes: {
    getAll: `${API_BASE}/boxes`,
    getById: (id: string) => `${API_BASE}/boxes/${id}`,
    create: `${API_BASE}/boxes`,
    update: (id: string) => `${API_BASE}/boxes/${id}`,
    delete: (id: string) => `${API_BASE}/boxes/${id}`
  },

  // Breaker Endpoints
  breakers: {
    getAll: `${API_BASE}/breakers`,
    getById: (id: string) => `${API_BASE}/breakers/${id}`,
    create: `${API_BASE}/breakers`,
    update: (id: string) => `${API_BASE}/breakers/${id}`,
    delete: (id: string) => `${API_BASE}/breakers/${id}`
  },

  // Cable Endpoints
  cables: {
    getAll: `${API_BASE}/cables`,
    getById: (id: string) => `${API_BASE}/cables/${id}`,
    create: `${API_BASE}/cables`,
    update: (id: string) => `${API_BASE}/cables/${id}`,
    delete: (id: string) => `${API_BASE}/cables/${id}`
  },

  // Charger Endpoints
  chargers: {
    getAll: `${API_BASE}/chargers`,
    getById: (id: string) => `${API_BASE}/chargers/${id}`,
    create: `${API_BASE}/chargers`,
    update: (id: string) => `${API_BASE}/chargers/${id}`,
    delete: (id: string) => `${API_BASE}/chargers/${id}`
  },

  // Plug Endpoints
  plugs: {
    getAll: `${API_BASE}/plugs`,
    getById: (id: string) => `${API_BASE}/plugs/${id}`,
    create: `${API_BASE}/plugs`,
    update: (id: string) => `${API_BASE}/plugs/${id}`,
    delete: (id: string) => `${API_BASE}/plugs/${id}`
  },

  // Station Endpoints
  stations: {
    getAll: `${API_BASE}/stations`,
    getById: (id: string) => `${API_BASE}/stations/${id}`,
    create: `${API_BASE}/stations`,
    update: (id: string) => `${API_BASE}/stations/${id}`,
    delete: (id: string) => `${API_BASE}/stations/${id}`
  },

  // Wire Endpoints
  wires: {
    getAll: `${API_BASE}/wires`,
    getById: (id: string) => `${API_BASE}/wires/${id}`,
    create: `${API_BASE}/wires`,
    update: (id: string) => `${API_BASE}/wires/${id}`,
    delete: (id: string) => `${API_BASE}/wires/${id}`
  },

  // Other Products Endpoints
  others: {
    getAll: `${API_BASE}/others`,
    getById: (id: string) => `${API_BASE}/others/${id}`,
    create: `${API_BASE}/others`,
    update: (id: string) => `${API_BASE}/others/${id}`,
    delete: (id: string) => `${API_BASE}/others/${id}`
  },

  // Cart Endpoints
  cart: {
    get: (sessionId: string) => `${API_BASE}/cart/${sessionId}`,
    addItem: (sessionId: string) => `${API_BASE}/cart/${sessionId}/add`,
    updateItem: (sessionId: string) => `${API_BASE}/cart/${sessionId}/update`,
    removeItem: (sessionId: string, productId: string, productType: string) =>
      `${API_BASE}/cart/${sessionId}/remove/${productId}/${productType}`,
    clear: (sessionId: string) => `${API_BASE}/cart/${sessionId}/clear`
  },

  // Order Endpoints
  orders: {
    create: `${API_BASE}/orders`,
    getAll: `${API_BASE}/orders`,
    getById: (id: string) => `${API_BASE}/orders/${id}`,
    getMyOrders: `${API_BASE}/orders/user/my-orders`,
    trackByOrderNumber: (orderNumber: string) => `${API_BASE}/orders/track/${orderNumber}`,
    updateStatus: (id: string) => `${API_BASE}/orders/${id}/status`,
    updatePaymentStatus: (id: string) => `${API_BASE}/orders/${id}/payment-status`,
    update: (id: string) => `${API_BASE}/orders/${id}`,
    delete: (id: string) => `${API_BASE}/orders/${id}`
  }
};

// Product Types Enum (for consistency across the app)
export enum ProductType {
  ADAPTER = 'adapter',
  BOX = 'box',
  BREAKER = 'breaker',
  CABLE = 'cable',
  CHARGER = 'charger',
  PLUG = 'plug',
  STATION = 'station',
  WIRE = 'wire',
  OTHER = 'other'
}

// Helper function to get product endpoints by type
export function getProductEndpoints(productType: ProductType) {
  const endpointsMap = {
    [ProductType.ADAPTER]: ApiEndpoints.adapters,
    [ProductType.BOX]: ApiEndpoints.boxes,
    [ProductType.BREAKER]: ApiEndpoints.breakers,
    [ProductType.CABLE]: ApiEndpoints.cables,
    [ProductType.CHARGER]: ApiEndpoints.chargers,
    [ProductType.PLUG]: ApiEndpoints.plugs,
    [ProductType.STATION]: ApiEndpoints.stations,
    [ProductType.WIRE]: ApiEndpoints.wires,
    [ProductType.OTHER]: ApiEndpoints.others
  };

  return endpointsMap[productType];
}
