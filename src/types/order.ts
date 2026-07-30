export type PaymentMethod = "cod" | "gcash" | "card";

export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

/** A line as it was at the moment the order was placed - a snapshot, not a
 * live join, since the catalog could change after the order is placed. */
export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderNumber: string;
  /** ISO date string. */
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shipping: CheckoutFormData;
}
