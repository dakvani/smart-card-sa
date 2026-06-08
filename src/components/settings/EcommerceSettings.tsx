import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MapPin,
  CreditCard,
  Wallet,
  ShoppingBag,
  Plus,
  Trash2,
  Star,
  ArrowRight,
  Loader2,
  Pencil,
  PackageOpen,
  Inbox,
} from "lucide-react";
import { formatSAR } from "@/lib/currency";

interface ShippingAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface WalletState {
  balance: number;
  currency: string;
  pending: number;
  history: { id: string; type: "topup" | "adjust" | "promo"; amount: number; note: string; at: string }[];
}

const ADDR_KEY = (uid: string) => `sc:addresses:${uid}`;
const PAY_KEY = (uid: string) => `sc:payments:${uid}`;
const WALLET_KEY = (uid: string) => `sc:wallet:${uid}`;

const WALLET_MIN = 10;
const WALLET_MAX = 5000;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

type AddressForm = {
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
  name: z.string().trim().min(2, "Full name is required").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^[+\d\s-]{6,20}$/.test(v), "Enter a valid phone number"),
  address: z.string().trim().min(4, "Street address is required").max(200),
  city: z.string().trim().min(2, "City is required").max(80),
  country: z.string().trim().min(2, "Country is required").max(80),
});

const paymentSchema = z.object({
  holder: z.string().trim().min(2, "Cardholder name is required").max(80),
  number: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{12,19}$/, "Card number must be 12-19 digits"),
    ),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
});
type PaymentForm = { holder: string; number: string; expiry: string };

const topupSchema = z
  .object({
    amount: z.coerce
      .number({ invalid_type_error: "Enter a number" })
      .min(WALLET_MIN, `Minimum ${formatSAR(WALLET_MIN)}`)
      .max(WALLET_MAX, `Maximum ${formatSAR(WALLET_MAX)}`),
    note: z.string().trim().max(120).optional(),
  });

type Section = "orders" | "wallet" | "addresses" | "payments";

export function EcommerceSettings({
  userId,
  section,
}: {
  userId: string;
  section?: Section;
}) {
  const show = (s: Section) => !section || section === s;

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    currency: "SAR",
    pending: 0,
    history: [],
  });
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Dialog state
  const [addrDialog, setAddrDialog] = useState<{ open: boolean; editing: ShippingAddress | null }>({
    open: false,
    editing: null,
  });
  const [payDialog, setPayDialog] = useState<{ open: boolean; editing: PaymentMethod | null }>({
    open: false,
    editing: null,
  });
  const [topupDialog, setTopupDialog] = useState(false);

  useEffect(() => {
    setAddresses(loadJSON<ShippingAddress[]>(ADDR_KEY(userId), []));
    setPayments(loadJSON<PaymentMethod[]>(PAY_KEY(userId), []));
    setWallet(
      loadJSON<WalletState>(WALLET_KEY(userId), {
        balance: 0,
        currency: "SAR",
        pending: 0,
        history: [],
      }),
    );
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("nfc_orders")
      .select("id, order_number, status, total, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (!error && data) setOrders(data as RecentOrder[]);
    setOrdersLoading(false);
  };

  // -------- Addresses --------
  const upsertAddress = (form: AddressForm, editingId: string | null) => {
    let updated: ShippingAddress[];
    if (editingId) {
      updated = addresses.map((a) => (a.id === editingId ? { ...a, ...form } : a));
    } else {
      updated = [
        ...addresses,
        { ...form, id: crypto.randomUUID(), isDefault: addresses.length === 0 },
      ];
    }
    setAddresses(updated);
    saveJSON(ADDR_KEY(userId), updated);
    toast.success(editingId ? "Address updated" : "Address added");
    setAddrDialog({ open: false, editing: null });
  };

  const removeAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length && !updated.some((a) => a.isDefault)) updated[0].isDefault = true;
    setAddresses(updated);
    saveJSON(ADDR_KEY(userId), updated);
    toast.success("Address removed");
  };

  const setDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    saveJSON(ADDR_KEY(userId), updated);
  };

  // -------- Payments --------
  const upsertPayment = (form: PaymentForm, editingId: string | null) => {
    const digits = form.number;
    const brand = digits.startsWith("4")
      ? "Visa"
      : digits.startsWith("5")
      ? "Mastercard"
      : digits.startsWith("3")
      ? "Amex"
      : "Card";
    let updated: PaymentMethod[];
    if (editingId) {
      updated = payments.map((p) =>
        p.id === editingId
          ? { ...p, holder: form.holder, expiry: form.expiry, last4: digits.slice(-4), brand }
          : p,
      );
    } else {
      updated = [
        ...payments,
        {
          id: crypto.randomUUID(),
          brand,
          last4: digits.slice(-4),
          holder: form.holder,
          expiry: form.expiry,
          isDefault: payments.length === 0,
        },
      ];
    }
    setPayments(updated);
    saveJSON(PAY_KEY(userId), updated);
    toast.success(editingId ? "Card updated" : "Card added");
    setPayDialog({ open: false, editing: null });
  };

  const removePayment = (id: string) => {
    const updated = payments.filter((p) => p.id !== id);
    if (updated.length && !updated.some((p) => p.isDefault)) updated[0].isDefault = true;
    setPayments(updated);
    saveJSON(PAY_KEY(userId), updated);
    toast.success("Card removed");
  };

  const setDefaultPayment = (id: string) => {
    const updated = payments.map((p) => ({ ...p, isDefault: p.id === id }));
    setPayments(updated);
    saveJSON(PAY_KEY(userId), updated);
  };

  // -------- Wallet --------
  const addPromoCredit = () => {
    const entry = {
      id: crypto.randomUUID(),
      type: "promo" as const,
      amount: 25,
      note: "Welcome promo",
      at: new Date().toISOString(),
    };
    const next: WalletState = {
      ...wallet,
      balance: wallet.balance + 25,
      history: [entry, ...wallet.history].slice(0, 20),
    };
    setWallet(next);
    saveJSON(WALLET_KEY(userId), next);
    toast.success("Promo credit of SAR 25 added");
  };

  const requestTopUp = (amount: number, note: string) => {
    const entry = {
      id: crypto.randomUUID(),
      type: "topup" as const,
      amount,
      note: note || "Top-up request",
      at: new Date().toISOString(),
    };
    const next: WalletState = {
      ...wallet,
      pending: wallet.pending + amount,
      history: [entry, ...wallet.history].slice(0, 20),
    };
    setWallet(next);
    saveJSON(WALLET_KEY(userId), next);
    toast.success(`Top-up request submitted for ${formatSAR(amount)}`);
    setTopupDialog(false);
  };

  return (
    <div className="space-y-8">
      {/* Order History */}
      {show("orders") && (
        <section className="bg-background rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Order History
            </h2>
            <Link to="/order-history">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No orders yet"
              description="When you order a SmartCard, your recent purchases will appear here."
              action={
                <Link to="/nfc-products">
                  <Button variant="gradient" size="sm">
                    Shop SmartCards
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColor[o.status] ?? ""}>
                      {o.status}
                    </Badge>
                    <span className="font-semibold text-sm">{formatSAR(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Wallet Credit */}
      {show("wallet") && (
        <section className="bg-background rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Credit
          </h2>
          <div className="rounded-2xl p-6 gradient-primary text-primary-foreground">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm opacity-80">Available balance</p>
                <p className="text-3xl font-bold mt-1">{formatSAR(wallet.balance)}</p>
                {wallet.pending > 0 && (
                  <p className="text-xs opacity-80 mt-2">
                    Pending top-up: {formatSAR(wallet.pending)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTopupDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Request top-up
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addPromoCredit}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                >
                  Redeem promo
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Top-up requests between {formatSAR(WALLET_MIN)} and {formatSAR(WALLET_MAX)} per
            request. Credit is applied at checkout on your next SmartCard order.
          </p>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Recent activity</h3>
            {wallet.history.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No activity yet"
                description="Your top-ups, adjustments, and promos will show up here."
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {wallet.history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between gap-3 p-3 bg-secondary/30 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium capitalize">{h.type}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {h.note} · {new Date(h.at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold">{formatSAR(h.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Shipping Addresses */}
      {show("addresses") && (
        <section className="bg-background rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Addresses
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddrDialog({ open: true, editing: null })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add address
            </Button>
          </div>

          {addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No saved addresses"
              description="Add a shipping address to speed up checkout on your next order."
              action={
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => setAddrDialog({ open: true, editing: null })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add your first address
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {addresses.map((a) => (
                <li
                  key={a.id}
                  className="p-4 rounded-xl bg-secondary/40 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{a.label}</span>
                      {a.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{a.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.address}, {a.city}, {a.country}
                    </p>
                    {a.phone && (
                      <p className="text-xs text-muted-foreground">{a.phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {!a.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultAddress(a.id)}
                      >
                        Set default
                      </Button>
                    )}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAddrDialog({ open: true, editing: a })}
                        aria-label="Edit address"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAddress(a.id)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <AddressDialog
            open={addrDialog.open}
            editing={addrDialog.editing}
            onClose={() => setAddrDialog({ open: false, editing: null })}
            onSubmit={upsertAddress}
          />
        </section>
      )}

      {/* Payment Methods */}
      {show("payments") && (
        <section className="bg-background rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPayDialog({ open: true, editing: null })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add card
            </Button>
          </div>

          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment methods"
              description="Save a card for faster checkout. Demo only — no live payments are processed."
              action={
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => setPayDialog({ open: true, editing: null })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add a card
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="p-4 rounded-xl bg-secondary/40 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-8 rounded-md bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-semibold">
                      {p.brand}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        •••• •••• •••• {p.last4}
                        {p.isDefault && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Default
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.holder} · Exp {p.expiry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!p.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultPayment(p.id)}
                      >
                        Set default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPayDialog({ open: true, editing: p })}
                      aria-label="Edit card"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePayment(p.id)}
                      className="text-destructive hover:text-destructive"
                      aria-label="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <PaymentDialog
            open={payDialog.open}
            editing={payDialog.editing}
            onClose={() => setPayDialog({ open: false, editing: null })}
            onSubmit={upsertPayment}
          />
        </section>
      )}

      <TopUpDialog
        open={topupDialog}
        onClose={() => setTopupDialog(false)}
        onSubmit={requestTopUp}
      />
    </div>
  );
}

/* -------------------- Subcomponents -------------------- */

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-border bg-secondary/20">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function AddressDialog({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: ShippingAddress | null;
  onClose: () => void;
  onSubmit: (form: AddressForm, editingId: string | null) => void;
}) {
  const initial: AddressForm = useMemo(
    () => ({
      label: editing?.label ?? "Home",
      name: editing?.name ?? "",
      phone: editing?.phone ?? "",
      address: editing?.address ?? "",
      city: editing?.city ?? "",
      country: editing?.country ?? "Saudi Arabia",
    }),
    [editing],
  );
  const [form, setForm] = useState<AddressForm>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const update = <K extends keyof AddressForm>(k: K, v: AddressForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const next: Partial<Record<keyof AddressForm, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof AddressForm;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    onSubmit(result.data as AddressForm, editing?.id ?? null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit address" : "Add shipping address"}</DialogTitle>
          <DialogDescription>
            We use this address to ship your SmartCards. You can update it anytime.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="addr-label">Label</Label>
            <Input
              id="addr-label"
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="Home, Office…"
            />
            <FieldError message={errors.label} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addr-name">Full name</Label>
            <Input
              id="addr-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="addr-phone">Phone</Label>
            <Input
              id="addr-phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+966…"
            />
            <FieldError message={errors.phone} />
          </div>
          <div>
            <Label htmlFor="addr-city">City</Label>
            <Input
              id="addr-city"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
            <FieldError message={errors.city} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addr-street">Street address</Label>
            <Input
              id="addr-street"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
            <FieldError message={errors.address} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addr-country">Country</Label>
            <Input
              id="addr-country"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
            <FieldError message={errors.country} />
          </div>
          <DialogFooter className="sm:col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              {editing ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: PaymentMethod | null;
  onClose: () => void;
  onSubmit: (form: PaymentForm, editingId: string | null) => void;
}) {
  const initial = useMemo(
    () => ({
      holder: editing?.holder ?? "",
      number: editing ? `•••• •••• •••• ${editing.last4}` : "",
      expiry: editing?.expiry ?? "",
    }),
    [editing],
  );
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentForm, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const formatExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // when editing, allow keeping the masked card number — require user to re-enter
    const parseInput = {
      holder: form.holder,
      number: form.number.includes("•") ? "" : form.number,
      expiry: form.expiry,
    };
    const result = paymentSchema.safeParse(parseInput);
    if (!result.success) {
      const next: Partial<Record<keyof PaymentForm, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PaymentForm;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    onSubmit(result.data as PaymentForm, editing?.id ?? null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit card" : "Add payment method"}</DialogTitle>
          <DialogDescription>
            Demo only — no live payments are processed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="pay-holder">Cardholder name</Label>
            <Input
              id="pay-holder"
              value={form.holder}
              onChange={(e) => setForm((f) => ({ ...f, holder: e.target.value }))}
            />
            <FieldError message={errors.holder} />
          </div>
          <div>
            <Label htmlFor="pay-number">Card number</Label>
            <Input
              id="pay-number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              placeholder="1234 5678 9012 3456"
            />
            <FieldError message={errors.number} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pay-expiry">Expiry (MM/YY)</Label>
              <Input
                id="pay-expiry"
                value={form.expiry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) }))
                }
                placeholder="MM/YY"
                maxLength={5}
              />
              <FieldError message={errors.expiry} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              {editing ? "Save changes" : "Add card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopUpDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
      setError(undefined);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = topupSchema.safeParse({ amount, note });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid amount");
      return;
    }
    onSubmit(result.data.amount, result.data.note ?? "");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request wallet top-up</DialogTitle>
          <DialogDescription>
            Submit a top-up request between {formatSAR(WALLET_MIN)} and {formatSAR(WALLET_MAX)}.
            Our team will confirm the credit shortly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="topup-amount">Amount (SAR)</Label>
            <Input
              id="topup-amount"
              type="number"
              inputMode="decimal"
              min={WALLET_MIN}
              max={WALLET_MAX}
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="e.g. 100"
            />
            <FieldError message={error} />
          </div>
          <div>
            <Label htmlFor="topup-note">Note (optional)</Label>
            <Input
              id="topup-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for top-up"
              maxLength={120}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
