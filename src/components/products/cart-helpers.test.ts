import { describe, it, expect, beforeEach } from "vitest";
import {
  buildCartItem,
  loadPersistedCart,
  persistCart,
  CART_STORAGE_KEY,
} from "./cart-helpers";
import {
  defaultCustomization,
  nfcProducts,
  type DesignCustomization,
  type NFCProduct,
} from "./types";

const product: NFCProduct = nfcProducts[0];
const otherProduct: NFCProduct = nfcProducts[1];

function makeCustomized(overrides: Partial<DesignCustomization> = {}): DesignCustomization {
  return {
    ...defaultCustomization,
    front: {
      ...defaultCustomization.front,
      name: "Ada Lovelace",
      title: "Founder",
      backgroundColor: "#ff00aa",
      accentColor: "#00ffcc",
    },
    back: {
      ...defaultCustomization.back,
      name: "Ada Lovelace",
      backgroundColor: "#112233",
    },
    linkedProfileUsername: "ada",
    ...overrides,
  };
}

describe("buildCartItem (Add to Cart regression)", () => {
  it("preserves the live customization when adding from the customize step (no override)", () => {
    const live = makeCustomized();
    const item = buildCartItem(product, live);

    // The item MUST carry the shopper's edited values, not defaults.
    expect(item.customization.front.name).toBe("Ada Lovelace");
    expect(item.customization.front.title).toBe("Founder");
    expect(item.customization.front.backgroundColor).toBe("#ff00aa");
    expect(item.customization.front.accentColor).toBe("#00ffcc");
    expect(item.customization.back.backgroundColor).toBe("#112233");
    expect(item.customization.linkedProfileUsername).toBe("ada");

    // Guardrail: this test fails if handleAddToCart is ever regressed to
    // spread defaultCustomization instead of the live state.
    expect(item.customization).not.toEqual(defaultCustomization);
    expect(item.customization.front.name).not.toBe(defaultCustomization.front.name);
  });

  it("falls back to defaults when adding directly from a product listing (productOverride supplied)", () => {
    const live = makeCustomized();
    const item = buildCartItem(product, live, otherProduct);

    expect(item.product.id).toBe(otherProduct.id);
    expect(item.customization).toEqual(defaultCustomization);
  });

  it("keeps each cart line item's own customization when multiple designed cards are added", () => {
    const cart = [
      buildCartItem(product, makeCustomized({ linkedProfileUsername: "ada" })),
      buildCartItem(otherProduct, makeCustomized({
        linkedProfileUsername: "grace",
        front: {
          ...defaultCustomization.front,
          name: "Grace Hopper",
          title: "Rear Admiral",
          backgroundColor: "#001122",
          accentColor: "#ffcc00",
        },
      })),
      buildCartItem(product, makeCustomized({
        linkedProfileUsername: "linus",
        front: {
          ...defaultCustomization.front,
          name: "Linus Torvalds",
          title: "Maintainer",
          backgroundColor: "#00aa55",
          accentColor: "#ffffff",
        },
      })),
    ];

    // Every line item retains its own name, colors, and linked profile.
    expect(cart[0].customization.linkedProfileUsername).toBe("ada");
    expect(cart[0].customization.front.name).toBe("Ada Lovelace");

    expect(cart[1].product.id).toBe(otherProduct.id);
    expect(cart[1].customization.linkedProfileUsername).toBe("grace");
    expect(cart[1].customization.front.name).toBe("Grace Hopper");
    expect(cart[1].customization.front.backgroundColor).toBe("#001122");

    expect(cart[2].customization.linkedProfileUsername).toBe("linus");
    expect(cart[2].customization.front.name).toBe("Linus Torvalds");
    expect(cart[2].customization.front.backgroundColor).toBe("#00aa55");

    // Sanity: they are not aliased to each other or to defaults.
    expect(cart[0].customization.front.name).not.toBe(cart[1].customization.front.name);
    expect(cart[1].customization.front.name).not.toBe(cart[2].customization.front.name);
    cart.forEach((i) => expect(i.customization).not.toEqual(defaultCustomization));
  });

  it("does not alias the live customization object (mutations after add do not leak into the cart)", () => {
    const live = makeCustomized();
    const item = buildCartItem(product, live);

    // Simulate the shopper editing the customizer again after adding to cart.
    live.front.name = "MUTATED";

    expect(item.customization.front.name).toBe("Ada Lovelace");
  });
});

describe("cart persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a multi-item cart through localStorage", () => {
    const cart = [
      buildCartItem(product, makeCustomized({ linkedProfileUsername: "ada" })),
      buildCartItem(otherProduct, makeCustomized({ linkedProfileUsername: "grace" })),
    ];
    persistCart(cart);

    const restored = loadPersistedCart();
    expect(restored).toHaveLength(2);
    expect(restored[0].customization.linkedProfileUsername).toBe("ada");
    expect(restored[1].customization.linkedProfileUsername).toBe("grace");
    expect(restored[0].product.id).toBe(product.id);
    expect(restored[1].product.id).toBe(otherProduct.id);
  });

  it("clears storage when the cart is emptied", () => {
    persistCart([buildCartItem(product, makeCustomized())]);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).not.toBeNull();
    persistCart([]);
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it("returns an empty array when storage is empty or malformed", () => {
    expect(loadPersistedCart()).toEqual([]);
    window.localStorage.setItem(CART_STORAGE_KEY, "not json");
    expect(loadPersistedCart()).toEqual([]);
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ not: "array" }));
    expect(loadPersistedCart()).toEqual([]);
  });
});
