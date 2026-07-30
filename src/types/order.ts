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
  /** Id of the selected `ShippingMethod` (`types/shipping.ts`) at the moment of checkout. */
  shippingMethodId: string;
  /**
   * Name of the selected shipping method, snapshotted at checkout time -
   * same reasoning as `OrderLine.name` below: an admin editing/removing a
   * method later shouldn't change what an already-placed order's receipt
   * shows.
   */
  shippingMethodName: string;
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
