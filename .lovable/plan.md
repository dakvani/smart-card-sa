## Confirmed issue

`src/pages/NFCProducts.tsx` `handlePlaceOrder` ignores the `isGuestCheckout` flag from `CheckoutSummary` and always calls `supabase.auth.getUser()`, redirecting guests to `/auth`. Even if we bypass that check, the `nfc_orders` table's RLS INSERT policy requires `auth.uid() = user_id`, so a guest insert from the browser would still be rejected. Both layers must change together for guest checkout to actually work.

## Changes

### 1. Frontend — respect the guest flag
In `src/pages/NFCProducts.tsx`:
- Update `handlePlaceOrder` signature to accept the second `isGuest?: boolean` argument that `CheckoutSummary` already passes.
- When `isGuest` is true: skip the `getUser()` check and the `/auth` redirect; do not set `user_id` on the insert; do not navigate to `/order-history` afterward (guests can't view it under current RLS) — instead show the "Order placed" toast and reset the cart on the current page.
- When `isGuest` is false: keep the existing authenticated flow unchanged.

### 2. Backend — allow guest inserts safely
New migration:
- `ALTER TABLE public.nfc_orders ALTER COLUMN user_id DROP NOT NULL;` (only if currently NOT NULL; verify first).
- Add RLS policy `"Guests can create orders"` for role `anon` with `WITH CHECK (user_id IS NULL)` so anonymous sessions can insert guest orders but cannot claim another user's `user_id`.
- Keep the existing authenticated INSERT policy (`auth.uid() = user_id`) so signed-in users still attach their `user_id`.
- `GRANT INSERT ON public.nfc_orders TO anon;` (SELECT stays denied for anon, so guests cannot read back any orders — matches current behavior).

### 3. Order confirmation email
`send-order-email` is already invoked after insert with the shipper's email; no change needed. That is the guest's confirmation.

## Out of scope
- No guest order-history page. Guests get the toast + email only.
- No schema changes beyond `user_id` nullability and the one new policy/grant.

## Verification
- Type-check passes.
- Manual: as a signed-out user, complete Continue as Guest → Place Order; expect success toast, cart cleared, no redirect to `/login`, and a confirmation email dispatched. As a signed-in user, order still lands in `/order-history`.
