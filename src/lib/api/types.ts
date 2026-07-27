import type { Product, ProductVariant, Category, CraftCategory } from "@/types/product";
import type { Order, OrderLine, CheckoutFormData } from "@/types/order";
import type { AuthUser } from "@/context/AuthContext";
import type { UserRole } from "@/lib/userStore";

/**
 * Phase 25 - Backend Integration. Table row shapes (`supabase/schema.sql`)
 * and the map functions between them and this app's existing camelCase
 * model types (`types/product.ts`, `types/order.ts`, `context/AuthContext.ts`).
 * Every `lib/api/*` module maps at its boundary, so nothing "above" the
 * API layer (components, the eventual replacement for `productsStore.ts`
 * etc.) ever sees a raw snake_case row.
 */

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  tag: "New" | "Limited" | null;
  created_at: string;
  sales_rank: number | null;
  description: string;
  details: string[] | null;
  images: string[] | null;
  variants: ProductVariant[] | null;
  stock: number | null;
  tags: string[] | null;
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    rating: row.rating,
    tag: row.tag ?? undefined,
    createdAt: row.created_at,
    salesRank: row.sales_rank ?? undefined,
    description: row.description,
    details: row.details ?? undefined,
    images: row.images ?? undefined,
    variants: row.variants ?? undefined,
    stock: row.stock ?? undefined,
    tags: row.tags ?? undefined,
  };
}

export function toProductRow(product: Product): ProductRow {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    tag: product.tag ?? null,
    created_at: product.createdAt,
    sales_rank: product.salesRank ?? null,
    description: product.description,
    details: product.details ?? null,
    images: product.images ?? null,
    variants: product.variants ?? null,
    stock: product.stock ?? null,
    tags: product.tags ?? null,
  };
}

export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  description: string;
  image: string | null;
  icon: string;
  tone: "primary" | "accent";
  featured: boolean | null;
  item_count: number;
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id as CraftCategory,
    slug: row.slug,
    label: row.label,
    description: row.description,
    image: row.image ?? undefined,
    icon: row.icon,
    tone: row.tone,
    featured: row.featured ?? undefined,
    itemCount: row.item_count,
  };
}

export function toCategoryRow(category: Category): CategoryRow {
  return {
    id: category.id,
    slug: category.slug,
    label: category.label,
    description: category.description,
    image: category.image ?? null,
    icon: category.icon,
    tone: category.tone,
    featured: category.featured ?? null,
    item_count: category.itemCount,
  };
}

export interface OrderRow {
  order_number: string;
  user_email: string;
  placed_at: string;
  lines: OrderLine[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping: CheckoutFormData;
}

export function mapOrderRow(row: OrderRow): Order {
  return {
    orderNumber: row.order_number,
    placedAt: row.placed_at,
    lines: row.lines,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    shipping: row.shipping,
  };
}

export function toOrderRow(email: string, order: Order): OrderRow {
  return {
    order_number: order.orderNumber,
    user_email: email.toLowerCase(),
    placed_at: order.placedAt,
    lines: order.lines,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total: order.total,
    shipping: order.shipping,
  };
}

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function mapProfileRow(row: ProfileRow): AuthUser {
  return { name: row.name, email: row.email, role: row.role };
}
