const domain = process.env.EXPO_PUBLIC_DOMAIN;
const API_BASE = domain ? `https://${domain}/api` : "/api";

export interface Product {
  _id: string;
  id_ref: string | number;
  name: string;
  price: number;
  category: string;
  img: string;
  type: "standard" | "birthday";
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  orderId: string;
  status: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  created_at: string;
  payment_confirmed: boolean;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function trackOrder(orderId: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/track/${orderId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function placeOrder(data: {
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  total: number;
}): Promise<{ orderId: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
