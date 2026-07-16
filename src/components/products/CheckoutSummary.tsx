import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CartItem } from "./types";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, ArrowLeft, Banknote, Landmark, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutAuth } from "./CheckoutAuth";
import { formatSAR } from "@/lib/currency";

export type PaymentMethod = "cod" | "bank_transfer";

interface CheckoutSummaryProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onEditItem?: (index: number) => void;
  onBack: () => void;
  onPlaceOrder?: (
    shippingInfo: {
      name: string;
      email: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
    },
    isGuest?: boolean,
    paymentMethod?: PaymentMethod,
  ) => void;
}

export function CheckoutSummary({ cart, onUpdateQuantity, onRemoveItem, onEditItem, onBack, onPlaceOrder }: CheckoutSummaryProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (user?.email) {
        setShippingInfo(prev => prev.email ? prev : { ...prev, email: user.email as string });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user?.email) {
        setShippingInfo(prev => prev.email ? prev : { ...prev, email: session.user.email as string });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in or create an account to place your order.",
        variant: "destructive",
      });
      return;
    }
    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address) {
      toast({
        title: "Missing information",
        description: "Please fill in all required shipping details.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    if (onPlaceOrder) {
      await onPlaceOrder(shippingInfo, false, paymentMethod);
    } else {
      toast({
        title: "Checkout initiated",
        description: "Payment integration coming soon! Your order has been saved.",
      });
    }

    setIsSubmitting(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    toast({
      title: "Success!",
      description: "You can now complete your order.",
    });
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground mb-6">
          Select a product and customize it to get started.
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Cart Items */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Your Cart ({cart.length})</h3>
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {cart.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border"
              >
                {/* Product Preview */}
                <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${item.product.image} flex items-center justify-center`}>
                  <span className="text-2xl text-primary-foreground">
                    {item.product.category === 'card' && '💳'}
                    {item.product.category === 'sticker' && '🏷️'}
                    {item.product.category === 'band' && '⌚'}
                    {item.product.category === 'keychain' && '🔑'}
                    {item.product.category === 'review' && '⭐'}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{item.product.name}</h4>

                  {/* Compact customization preview — colors, name, linked profile.
                      Lets the shopper verify their design before placing the order. */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1" title="Front design colors">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border"
                        style={{ backgroundColor: item.customization.front.backgroundColor }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border"
                        style={{ backgroundColor: item.customization.front.textColor }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border"
                        style={{ backgroundColor: item.customization.front.accentColor }}
                      />
                    </span>
                    {item.customization.front.name && (
                      <span className="truncate">👤 {item.customization.front.name}</span>
                    )}
                    {item.customization.front.title && (
                      <span className="truncate">💼 {item.customization.front.title}</span>
                    )}
                    {item.customization.linkedProfileUsername && (
                      <span className="truncate">🔗 @{item.customization.linkedProfileUsername}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    {onEditItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => onEditItem(index)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Price & Remove */}
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatSAR((item.product.basePrice * item.quantity))}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive mt-2"
                    onClick={() => onRemoveItem(index)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Show Auth Form for guests — account required */}
        {!isAuthenticated && (
          <div className="mt-8">
            <CheckoutAuth onAuthSuccess={handleAuthSuccess} />
          </div>
        )}
      </div>

      {/* Checkout Form - Show for authenticated users or guest checkout */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {isAuthenticated ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Shipping Details</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={shippingInfo.postalCode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Payment method */}
            <div className="mb-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Payment method</h4>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label
                  htmlFor="pm-cod"
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
                  }`}
                >
                  <RadioGroupItem id="pm-cod" value="cod" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Banknote className="w-4 h-4" /> Cash on Delivery
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Pay in cash when your order arrives.</p>
                  </div>
                </label>
                <label
                  htmlFor="pm-bank"
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
                  }`}
                >
                  <RadioGroupItem id="pm-bank" value="bank_transfer" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Landmark className="w-4 h-4" /> Bank Transfer
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">We'll email you bank details after ordering.</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Separator className="my-6" />
          </>
        ) : (
          <div className="text-center py-8 mb-6">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-2">Account required</h3>
            <p className="text-sm text-muted-foreground">
              Please sign in or create an account on the left to complete your purchase. This keeps your order details, contact information and history secure.
            </p>
          </div>
        )}

        {/* Order Summary - Always visible */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Summary</h4>
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatSAR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `${formatSAR(shipping)}`}</span>
          </div>
          {subtotal < 50 && (
            <p className="text-xs text-muted-foreground">
              Add {formatSAR((50 - subtotal))} more for free shipping!
            </p>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatSAR(total)}</span>
          </div>
        </div>

        <Button
          variant="gradient"
          className="w-full mt-6"
          onClick={handleCheckout}
          disabled={isSubmitting || !isAuthenticated}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {!isAuthenticated ? "Sign in to place order" : isSubmitting ? "Processing..." : "Place Order"}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          🔒 Secure checkout • 30-day money back guarantee
        </p>
      </div>
    </div>
  );
}
