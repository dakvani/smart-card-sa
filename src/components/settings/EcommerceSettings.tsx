import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const ADDR_KEY = (uid: string) => `sc:addresses:${uid}`;
const PAY_KEY = (uid: string) => `sc:payments:${uid}`;
const WALLET_KEY = (uid: string) => `sc:wallet:${uid}`;

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

type EcommerceSection = "orders" | "wallet" | "addresses" | "payments";

export function EcommerceSettings({
  userId,
  section,
}: {
  userId: string;
  section?: EcommerceSection;
}) {
  const show = (s: EcommerceSection) => !section || section === s;
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; currency: string }>({
    balance: 0,
    currency: "SAR",
  });
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Address form
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrDraft, setAddrDraft] = useState<Omit<ShippingAddress, "id" | "isDefault">>({
    label: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    country: "Saudi Arabia",
  });

  // Payment form
  const [payOpen, setPayOpen] = useState(false);
  const [payDraft, setPayDraft] = useState({
    holder: "",
    number: "",
    expiry: "",
  });

  useEffect(() => {
    setAddresses(loadJSON<ShippingAddress[]>(ADDR_KEY(userId), []));
    setPayments(loadJSON<PaymentMethod[]>(PAY_KEY(userId), []));
    setWallet(
      loadJSON(WALLET_KEY(userId), { balance: 0, currency: "SAR" })
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
  const addAddress = () => {
    if (!addrDraft.name || !addrDraft.address || !addrDraft.city) {
      toast.error("Please fill in name, address, and city");
      return;
    }
    const next: ShippingAddress = {
      ...addrDraft,
      id: crypto.randomUUID(),
      isDefault: addresses.length === 0,
    };
    const updated = [...addresses, next];
    setAddresses(updated);
    saveJSON(ADDR_KEY(userId), updated);
    setAddrDraft({
      label: "Home",
      name: "",
      phone: "",
      address: "",
      city: "",
      country: "Saudi Arabia",
    });
    setAddrOpen(false);
    toast.success("Address added");
  };

  const removeAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    saveJSON(ADDR_KEY(userId), updated);
  };

  const setDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    saveJSON(ADDR_KEY(userId), updated);
  };

  // -------- Payments --------
  const addPayment = () => {
    const digits = payDraft.number.replace(/\s/g, "");
    if (digits.length < 12 || !payDraft.holder || !payDraft.expiry) {
      toast.error("Please complete card details");
      return;
    }
    const brand =
      digits.startsWith("4")
        ? "Visa"
        : digits.startsWith("5")
        ? "Mastercard"
        : digits.startsWith("3")
        ? "Amex"
        : "Card";
    const next: PaymentMethod = {
      id: crypto.randomUUID(),
      brand,
      last4: digits.slice(-4),
      holder: payDraft.holder,
      expiry: payDraft.expiry,
      isDefault: payments.length === 0,
    };
    const updated = [...payments, next];
    setPayments(updated);
    saveJSON(PAY_KEY(userId), updated);
    setPayDraft({ holder: "", number: "", expiry: "" });
    setPayOpen(false);
    toast.success("Payment method added");
  };

  const removePayment = (id: string) => {
    const updated = payments.filter((p) => p.id !== id);
    if (updated.length && !updated.some((p) => p.isDefault)) {
      updated[0].isDefault = true;
    }
    setPayments(updated);
    saveJSON(PAY_KEY(userId), updated);
  };

  const setDefaultPayment = (id: string) => {
    const updated = payments.map((p) => ({ ...p, isDefault: p.id === id }));
    setPayments(updated);
    saveJSON(PAY_KEY(userId), updated);
  };

  // -------- Wallet --------
  const addPromoCredit = () => {
    const next = { ...wallet, balance: wallet.balance + 25 };
    setWallet(next);
    saveJSON(WALLET_KEY(userId), next);
    toast.success("Promo credit of SAR 25 added");
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
          <div className="text-center py-8 text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link to="/nfc-products" className="text-primary hover:underline">
              Shop SmartCards
            </Link>
          </div>
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
        <div className="rounded-2xl p-6 gradient-primary text-primary-foreground flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Available balance</p>
            <p className="text-3xl font-bold mt-1">
              {formatSAR(wallet.balance)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={addPromoCredit}
            className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            Redeem promo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Credit can be applied at checkout on your next SmartCard order.
        </p>
      </section>

      {/* Shipping Addresses */}
      <section className="bg-background rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Addresses
          </h2>
          <Button size="sm" variant="outline" onClick={() => setAddrOpen((v) => !v)}>
            <Plus className="w-4 h-4 mr-1" />
            {addrOpen ? "Cancel" : "Add address"}
          </Button>
        </div>

        {addrOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-secondary/40">
            <Input
              placeholder="Label (Home, Office)"
              value={addrDraft.label}
              onChange={(e) => setAddrDraft({ ...addrDraft, label: e.target.value })}
            />
            <Input
              placeholder="Full name"
              value={addrDraft.name}
              onChange={(e) => setAddrDraft({ ...addrDraft, name: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={addrDraft.phone}
              onChange={(e) => setAddrDraft({ ...addrDraft, phone: e.target.value })}
            />
            <Input
              placeholder="City"
              value={addrDraft.city}
              onChange={(e) => setAddrDraft({ ...addrDraft, city: e.target.value })}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Street address"
              value={addrDraft.address}
              onChange={(e) => setAddrDraft({ ...addrDraft, address: e.target.value })}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Country"
              value={addrDraft.country}
              onChange={(e) => setAddrDraft({ ...addrDraft, country: e.target.value })}
            />
            <Button variant="gradient" onClick={addAddress} className="sm:col-span-2">
              Save address
            </Button>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No saved addresses yet.
          </div>
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
                <div className="flex flex-col gap-2">
                  {!a.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultAddress(a.id)}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddress(a.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payment Methods */}
      <section className="bg-background rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </h2>
          <Button size="sm" variant="outline" onClick={() => setPayOpen((v) => !v)}>
            <Plus className="w-4 h-4 mr-1" />
            {payOpen ? "Cancel" : "Add card"}
          </Button>
        </div>

        {payOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-secondary/40">
            <Input
              className="sm:col-span-2"
              placeholder="Cardholder name"
              value={payDraft.holder}
              onChange={(e) => setPayDraft({ ...payDraft, holder: e.target.value })}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Card number"
              inputMode="numeric"
              value={payDraft.number}
              onChange={(e) => setPayDraft({ ...payDraft, number: e.target.value })}
            />
            <Input
              placeholder="MM/YY"
              value={payDraft.expiry}
              onChange={(e) => setPayDraft({ ...payDraft, expiry: e.target.value })}
            />
            <Button variant="gradient" onClick={addPayment}>
              Save card
            </Button>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Demo only — no live payments are processed.
            </p>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No payment methods saved.
          </div>
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
                <div className="flex items-center gap-2">
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
                    size="sm"
                    onClick={() => removePayment(p.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
