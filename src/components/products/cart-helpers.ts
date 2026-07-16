import {
  CartItem,
  DesignCustomization,
  NFCProduct,
  defaultCustomization,
} from "./types";

/**
 * Build the CartItem to push when the user clicks "Add to Cart".
 *
 * Rules:
 * - If a `productOverride` is supplied (adding directly from a product listing
 *   card), the shopper has NOT edited the customizer yet — use defaults.
 * - Otherwise the click came from the customize step and MUST preserve the
 *   live `customization` state so colors, name, title, and linked profile
 *   are carried through to checkout and the invoice.
 *
 * Kept as a pure function so it can be regression-tested without mounting
 * the whole NFCProducts page.
 */
export function buildCartItem(
  product: NFCProduct,
  liveCustomization: DesignCustomization,
  productOverride?: NFCProduct,
): CartItem {
  const resolvedProduct = productOverride ?? product;
  const source = productOverride ? defaultCustomization : liveCustomization;
  // Deep-clone so later edits to the live customizer state never leak into
  // the cart line item (each item captures a snapshot of its own design).
  const customization: DesignCustomization =
    typeof structuredClone === "function"
      ? structuredClone(source)
      : JSON.parse(JSON.stringify(source));

  return { product: resolvedProduct, customization, quantity: 1 };
}

// ---------- Cart persistence (localStorage) ----------

export const CART_STORAGE_KEY = "nfc_cart_v1";

export function loadPersistedCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === "object" &&
        !!item.product &&
        !!item.customization &&
        typeof item.quantity === "number",
    );
  } catch {
    return [];
  }
}

export function persistCart(cart: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (cart.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  } catch {
    // Storage full / disabled — silently ignore.
  }
}

// ---------- Cart persistence (Supabase, cross-device) ----------

/**
 * Merge a locally-persisted cart with a remote (DB) cart into a single list.
 * Items are deduped by (product.id + JSON(customization)) so re-adding the
 * same design on another device just bumps quantity instead of duplicating.
 */
export function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const key = (i: CartItem) =>
    `${i.product.id}::${JSON.stringify(i.customization)}`;
  const map = new Map<string, CartItem>();
  for (const item of [...remote, ...local]) {
    const k = key(item);
    const existing = map.get(k);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(k, { ...item, quantity: item.quantity });
    }
  }
  return Array.from(map.values());
}

// Loose type: any Supabase-like client. Full generic typing would drag the
// generated Database type through this helper and blow up type instantiation.
type CartSupabase = { from: (t: string) => any };

export async function loadRemoteCart(
  supabase: CartSupabase,
  userId: string,
): Promise<CartItem[]> {
  try {
    const { data, error } = await supabase
      .from("user_carts")
      .select("items")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return [];
    const items = (data as { items: unknown }).items;
    if (!Array.isArray(items)) return [];
    return items.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === "object" &&
        !!(item as CartItem).product &&
        !!(item as CartItem).customization &&
        typeof (item as CartItem).quantity === "number",
    );
  } catch {
    return [];
  }
}

export async function saveRemoteCart(
  supabase: CartSupabase,
  userId: string,
  cart: CartItem[],
): Promise<void> {
  try {
    if (cart.length === 0) {
      await supabase.from("user_carts").delete().eq("user_id", userId);
      return;
    }
    await supabase
      .from("user_carts")
      .upsert(
        { user_id: userId, items: cart as unknown },
        { onConflict: "user_id" },
      );
  } catch {
    // Non-fatal; local cart is still persisted.
  }
}
