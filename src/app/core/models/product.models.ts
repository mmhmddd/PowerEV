// src/app/core/models/product.models.ts

// ============= IMAGE & OFFER TYPES =============
export interface ImageObject {
  url: string;
  alt?: string;
  publicId?: string;
}

export interface Offer {
  enabled: boolean;
  discountPercentage: number;
}

// ============= BASE API RESPONSE =============
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data?: User | User[];
  user?: User;
  users?: User[];
}

export interface UserWithSelection extends User {
  selected?: boolean;
}

// ============= ADAPTER =============
export interface Adapter {
  _id: string;
  name: string;
  price: number;
  type?: string;
  brand?: string;
  stock: number;
  efficiency?: number;
  voltage?: number;
  current?: number;
  description?: string;
  images: ImageObject[];
  createdAt?: string;
  updatedAt?: string;
}

// Backend returns { success, count, adapters } not { success, data }
export interface AdaptersResponse {
  success: boolean;
  count: number;
  adapters: Adapter[];
}

export interface AdapterResponse {
  success: boolean;
  adapter: Adapter;
}

// ============= BOX =============
export interface Box {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  description?: string;
  images: ImageObject[];
  size?: string;
  quantity?: number;
  offer?: Offer;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoxesResponse {
  success: boolean;
  count: number;
  boxes: Box[];
}

export interface BoxResponse {
  success: boolean;
  box: Box;
}

// ============= BREAKER =============
export interface Breaker {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  description?: string;
  images: ImageObject[];
  quantity?: number;
  offer?: Offer;
  ampere?: number;
  voltage?: number;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BreakersResponse {
  success: boolean;
  count: number;
  breakers: Breaker[];
}

export interface BreakerResponse {
  success: boolean;
  breaker: Breaker;
}

// ============= CABLE =============
export interface Cable {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  type?: string;
  brand?: string;
  connectorFrom?: string;
  connectorTo?: string;
  stock: number;
  voltage?: number;
  current?: number;
  phase?: string;
  cableLength?: number;
  wireGauge?: string;
  offer?: Offer;
  description?: string;
  images: ImageObject[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CablesResponse {
  success: boolean;
  count: number;
  cables: Cable[];
}

export interface CableResponse {
  success: boolean;
  cable: Cable;
}

// ============= CHARGER =============
export interface Charger {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  voltage?: number;
  amperage?: number;
  brand?: string;
  stock: number;
  offer?: Offer;
  connectorType?: string;
  phase?: string;
  efficiency?: number;
  description?: string;
  images: ImageObject[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChargersResponse {
  success: boolean;
  count: number;
  chargers: Charger[];
}

export interface ChargerResponse {
  success: boolean;
  charger: Charger;
}

// ============= OTHER =============
export interface Other {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  description?: string;
  images: ImageObject[];
  category?: string;
  type?: string;
  offer?: Offer;
  createdAt?: string;
  updatedAt?: string;
}

export interface OthersResponse {
  success: boolean;
  count: number;
  others: Other[];
}

export interface OtherResponse {
  success: boolean;
  other: Other;
}

// ============= PLUG =============
export interface Plug {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  type?: string;
  voltage?: number;
  current?: number;
  description?: string;
  images: ImageObject[];
  offer?: Offer;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlugsResponse {
  success: boolean;
  count: number;
  plugs: Plug[];
}

export interface PlugResponse {
  success: boolean;
  plug: Plug;
}

// ============= STATION =============
export interface Station {
  stockStatus: string;
  _id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  brand?: string;
  power?: number;
  voltage?: number;
  amperage?: number;
  connectorType?: string;
  phase?: string;
  efficiency?: number;
  offer?: Offer;
  description?: string;
  images: ImageObject[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StationsResponse {
  success: boolean;
  count: number;
  stations: Station[];
}

export interface StationResponse {
  success: boolean;
  station: Station;
}

// ============= WIRE =============
export interface Wire {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  wireGauge?: string;
  material?: string;
  length?: number;
  type?: string;
  offer?: Offer;
  description?: string;
  images: ImageObject[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WiresResponse {
  success: boolean;
  count: number;
  wires: Wire[];
}

export interface WireResponse {
  success: boolean;
  wire: Wire;
}

// ============= CART TYPES =============
export interface CartItem {
  productId: string;
  productType: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

export interface Cart {
  _id: string;
  sessionId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CartResponse = ApiResponse<Cart>;

// ============= ORDER TYPES =============
export interface OrderItem {
  productId: string;
  productType: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'instapay' | 'vodafonecash';
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: Order;
}

export interface OrdersResponse {
  success: boolean;
  message?: string;
  count?: number;
  data: Order[];
}
