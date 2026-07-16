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
  const customization = productOverride
    ? { ...defaultCustomization }
    : { ...liveCustomization };

  return { product, customization, quantity: 1 };
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
    // Basic shape guard — must have product + customization + numeric qty.
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
