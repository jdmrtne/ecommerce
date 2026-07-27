/**
 * Phase 25 - Backend Integration. Barrel for the whole `lib/api/` client
 * layer - see `client.ts` for the Supabase singleton and the backend
 * decision, `types.ts` for the row/model contracts, and each module for
 * its function group. Nothing here is wired into any component yet.
 */
export * from "@/lib/api/client";
export * from "@/lib/api/types";
export * from "@/lib/api/auth";
export * from "@/lib/api/products";
export * from "@/lib/api/categories";
export * from "@/lib/api/orders";
