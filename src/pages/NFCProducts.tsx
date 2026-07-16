import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { DesignCustomizer } from "@/components/products/DesignCustomizer";
import { LivePreview } from "@/components/products/LivePreview";
import { CheckoutSummary } from "@/components/products/CheckoutSummary";
import { DraftManager } from "@/components/products/DraftManager";
import { CostComparisonCalculator } from "@/components/products/CostComparisonCalculator";
import { nfcProducts as fallbackProducts, defaultCustomization, CartItem, DesignCustomization, NFCProduct } from "@/components/products/types";
import { buildCartItem, loadPersistedCart, persistCart, loadRemoteCart, saveRemoteCart, mergeCarts } from "@/components/products/cart-helpers";
import { ArrowRight, ShoppingCart, ArrowLeft, Wifi, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Json } from "@/integrations/supabase/types";
import { SEO } from "@/components/SEO";


type Step = 'select' | 'customize' | 'checkout';

export default function NFCProducts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select');
  const [selectedProduct, setSelectedProduct] = useState<NFCProduct | null>(null);
  const [customization, setCustomization] = useState<DesignCustomization>(defaultCustomization);
  const [cart, setCart] = useState<CartItem[]>(() => loadPersistedCart());
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<NFCProduct[]>(fallbackProducts);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("nfc_catalog_products")
        .select("id,slug,name,description,base_price,gradient,photo_url,category,position,is_active")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (!error && data && data.length > 0) {
        const fallbackBySlug = new Map(fallbackProducts.map((p) => [p.id, p]));
        const mapped: NFCProduct[] = data.map((r) => ({
          id: r.slug,
          name: r.name,
          description: r.description,
          basePrice: Number(r.base_price),
          image: r.gradient,
          photo: r.photo_url || fallbackBySlug.get(r.slug)?.photo,
          category: (r.category as NFCProduct["category"]) || "card",
        }));
        setProducts(mapped);
      }
      setLoadingProducts(false);
    };
    load();
  }, []);

  useEffect(() => {
    // Get initial user, and if they're already signed in, hydrate remote cart.
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user?.id) {
        const remote = await loadRemoteCart(supabase, user.id);
        setCart((local) => {
          const merged = mergeCarts(local, remote);
          // Push merged back so both devices converge to the same state.
          void saveRemoteCart(supabase, user.id, merged);
          return merged;
        });
      }
    });

    // Listen for auth state changes (e.g., after login redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);

      if (event === 'SIGNED_IN' && uid) {
        // Merge whatever the shopper built while signed out with their DB cart
        // so their cart follows them across devices.
        void (async () => {
          const remote = await loadRemoteCart(supabase, uid);
          setCart((local) => {
            const merged = mergeCarts(local, remote);
            void saveRemoteCart(supabase, uid, merged);
            return merged;
          });
        })();

        if (step === 'checkout' && cart.length > 0) {
          toast({
            title: "Logged in successfully!",
            description: "You can now complete your order.",
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [step, cart.length, toast]);

  const handleProductSelect = (product: NFCProduct) => {
    setSelectedProduct(product);
    setCustomization(defaultCustomization);
  };

  const handleContinueToCustomize = () => {
    if (!selectedProduct) {
      toast({
        title: "Select a product",
        description: "Please select an NFC product to customize.",
        variant: "destructive",
      });
      return;
    }
    setStep('customize');
  };

  // Keep the cart in sync with localStorage (guest resume) AND — when signed
  // in — with the DB so the customer can continue on another device.
  useEffect(() => {
    persistCart(cart);
    if (userId) void saveRemoteCart(supabase, userId, cart);
  }, [cart, userId]);

  const handleAddToCart = (productOverride?: NFCProduct) => {
    const product = productOverride ?? selectedProduct;
    if (!product) return;

    // Delegates to a pure helper so the "preserve live customization" rule
    // is regression-tested independently of the page (see cart-helpers.test.ts).
    const item = buildCartItem(product, customization, productOverride);
    setCart((prev) => [...prev, item]);

    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleQuickBuy = (product: NFCProduct) => {
    setCart([
      {
        product,
        customization: { ...defaultCustomization },
        quantity: 1,
      },
    ]);
    setSelectedProduct(product);
    setStep('checkout');
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0 && selectedProduct) {
      setCart([{
        product: selectedProduct,
        customization: { ...customization },
        quantity: 1,
      }]);
    }
    setStep('checkout');
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Edit a cart line item: jump back to the customizer preloaded with this
  // item's design. Removing the line item keeps quantities correct — the
  // shopper will re-add it once they save their edits.
  const handleEditItem = (index: number) => {
    const item = cart[index];
    if (!item) return;
    setSelectedProduct(item.product);
    setCustomization(
      typeof structuredClone === "function"
        ? structuredClone(item.customization)
        : JSON.parse(JSON.stringify(item.customization)),
    );
    setCart(cart.filter((_, i) => i !== index));
    setStep('customize');
    toast({
      title: "Editing item",
      description: "Make your changes and add it back to the cart.",
    });
  };

  const handleBack = () => {
    if (step === 'customize') {
      setStep('select');
    } else if (step === 'checkout') {
      setStep('customize');
    }
  };

  const handleLoadDraft = (product: NFCProduct, draftCustomization: DesignCustomization) => {
    setSelectedProduct(product);
    setCustomization(draftCustomization);
    setStep('customize');
  };

  const handlePlaceOrder = async (shippingInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  }, isGuest?: boolean, paymentMethod: "cod" | "bank_transfer" = "cod") => {
    let orderUserId: string | null = userId;

    if (!isGuest) {
      // Re-verify auth for signed-in checkout only
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Store cart in session storage so it persists after login
        sessionStorage.setItem('nfc_cart', JSON.stringify(cart));
        sessionStorage.setItem('nfc_shipping', JSON.stringify(shippingInfo));

        toast({
          title: "Please log in to continue",
          description: "You'll be redirected back to complete your order after logging in.",
        });
        navigate("/auth", { state: { returnTo: '/nfc-products', step: 'checkout' } });
        return;
      }
      orderUserId = user.id;
    } else {
      orderUserId = null;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    const orderNumber = `NFC-${Date.now().toString(36).toUpperCase()}`;

    try {
      const { data: inserted, error } = await supabase.from("nfc_orders").insert({
        user_id: orderUserId,
        order_number: orderNumber,
        status: "processing",
        payment_method: paymentMethod,
        payment_status: "unpaid",
        items: cart.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            basePrice: item.product.basePrice,
            image: item.product.image,
            category: item.product.category,
          },
          customization: {
            front: {
              name: item.customization.front.name,
              title: item.customization.front.title,
              backgroundColor: item.customization.front.backgroundColor,
              textColor: item.customization.front.textColor,
              accentColor: item.customization.front.accentColor,
            },
            back: {
              name: item.customization.back.name,
              title: item.customization.back.title,
              backgroundColor: item.customization.back.backgroundColor,
              textColor: item.customization.back.textColor,
              accentColor: item.customization.back.accentColor,
            },
            linkedProfileUsername: item.customization.linkedProfileUsername,
          },
          quantity: item.quantity,
        })) as unknown as Json,
        shipping_info: shippingInfo as unknown as Json,
        subtotal,
        shipping_cost: shipping,
        total,
      }).select("id, invoice_number").maybeSingle();

      if (error) throw error;

      // Send order confirmation email
      try {
        await supabase.functions.invoke("send-order-email", {
          body: {
            to: shippingInfo.email,
            orderNumber,
            status: "processing",
            customerName: shippingInfo.name,
          },
        });
      } catch (emailError) {
        console.log("Email notification (test mode):", emailError);
      }

      toast({
        title: "Order placed!",
        description: `Order ${inserted?.invoice_number ?? orderNumber} has been submitted. Check your email for confirmation.`,
      });

      setCart([]);
      setStep('select');
      setSelectedProduct(null);
      setCustomization(defaultCustomization);

      if (!isGuest && inserted?.id) {
        navigate(`/invoice/${inserted.id}`);
      } else if (!isGuest) {
        navigate("/order-history");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="SmartCard NFC Products — Programmable Cards, Tags & Stickers"
        description="Shop premium NFC business cards, tags, and stickers. Customize the design, link to your SmartLink profile, and ship worldwide. One tap shares everything."
        path="/nfc-products"
        type="product"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "SmartCard NFC Products",
          url: "https://smartcardsa.shop/nfc-products",
          description: "Programmable NFC cards, tags, and stickers paired with SmartLink profiles.",
        }}
      />
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full mb-6"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-5 h-5" />
              <span className="text-sm font-semibold">NFC Technology</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Share your profile with a <br />
              <span className="gradient-text">single tap</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Custom NFC products that link directly to your SmartCard profile. 
              Design your own and start networking smarter.
            </p>
          </motion.div>

          {/* Draft Manager & Order History */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <DraftManager
              currentProduct={selectedProduct}
              currentCustomization={customization}
              onLoadDraft={handleLoadDraft}
              userId={userId}
            />
            {userId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/order-history")}
              >
                <History className="w-4 h-4 mr-2" />
                Order History
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {['select', 'customize', 'checkout'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : (step === 'customize' && s === 'select') || (step === 'checkout' && (s === 'select' || s === 'customize'))
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium capitalize ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                  {s}
                </span>
                {index < 2 && (
                  <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Cart indicator */}
          {cart.length > 0 && step !== 'checkout' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-24 right-4 z-50"
            >
              <Button
                onClick={() => setStep('checkout')}
                variant="gradient"
                className="shadow-lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
              </Button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Product Selection */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-10">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex flex-col"
                    >
                      <div className="[&_h3]:!text-sm [&_h3]:!leading-tight [&_.p-5]:!p-3 [&_.text-2xl]:!text-base [&_.text-sm]:!text-[11px] [&_.text-xs]:!text-[10px] [&_.mb-4]:!mb-2 [&_.mb-2]:!mb-1 [&_.pt-3]:!pt-2 [&_.rounded-3xl]:!rounded-2xl">
                        <ProductCard
                          product={product}
                          isSelected={selectedProduct?.id === product.id}
                          onSelect={() => handleProductSelect(product)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="gradient"
                          className="h-9 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickBuy(product);
                          }}
                        >
                          Buy now
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={handleContinueToCustomize}
                    disabled={!selectedProduct}
                  >
                    Customize selected
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <CostComparisonCalculator />
              </motion.div>
            )}

            {/* Step 2: Customization */}
            {step === 'customize' && selectedProduct && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Customizer Panel */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <DesignCustomizer
                      product={selectedProduct}
                      customization={customization}
                      onChange={setCustomization}
                    />
                  </div>

                  {/* Live Preview */}
                  <div className="lg:sticky lg:top-24 h-fit">
                    <LivePreview
                      product={selectedProduct}
                      customization={customization}
                    />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAddToCart()}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="gradient"
                        className="flex-1"
                        onClick={handleProceedToCheckout}
                      >
                        Checkout
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Checkout */}
            {step === 'checkout' && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CheckoutSummary
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onEditItem={handleEditItem}
                  onBack={handleBack}
                  onPlaceOrder={handlePlaceOrder}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
