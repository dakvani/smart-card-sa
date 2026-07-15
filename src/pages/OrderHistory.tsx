import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowLeft, ShoppingBag, FileText } from "lucide-react";
import { format } from "date-fns";
import { formatSAR } from "@/lib/currency";

interface OrderItem {
  product: {
    id: string;
    name: string;
    basePrice: number;
    image: string;
    category: string;
  };
  customization: {
    name: string;
    linkedProfileUsername?: string;
  };
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  invoice_number: string | null;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  items: OrderItem[];
  shipping_info: {
    name: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending" },
  processing: { icon: Package, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Processing" },
  shipped: { icon: Truck, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled" },
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("nfc_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse JSON fields properly
      const parsedOrders = (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        shipping_info: typeof order.shipping_info === 'string' ? JSON.parse(order.shipping_info) : order.shipping_info,
      }));
      
      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading orders...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/nfc-products")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold">Order History</h1>
            <p className="text-muted-foreground mt-2">
              Track your NFC product orders and their delivery status.
            </p>
          </motion.div>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any NFC product orders yet.
              </p>
              <Button variant="gradient" onClick={() => navigate("/nfc-products")}>
                Browse NFC Products
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                  >
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{order.invoice_number ?? `Order #${order.order_number}`}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                            {order.payment_method && (
                              <span className="ml-2 text-xs uppercase tracking-wide">
                                • {order.payment_method === "bank_transfer" ? "Bank transfer" : "COD"}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge className={`${statusInfo.color} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <span className="font-bold">{formatSAR(Number(order.total))}</span>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-6 grid md:grid-cols-2 gap-6">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-4">Items</h4>
                            <div className="space-y-3">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.product.image} flex items-center justify-center`}>
                                    <span className="text-lg text-primary-foreground">
                                      {item.product.category === 'card' && '💳'}
                                      {item.product.category === 'sticker' && '🏷️'}
                                      {item.product.category === 'band' && '⌚'}
                                      {item.product.category === 'keychain' && '🔑'}
                                      {item.product.category === 'review' && '⭐'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">{item.product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Qty: {item.quantity} • {formatSAR((item.product.basePrice * item.quantity))}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Info */}
                          <div>
                            <h4 className="font-medium mb-4">Shipping Address</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="text-foreground font-medium">{order.shipping_info.name}</p>
                              <p>{order.shipping_info.address}</p>
                              <p>{order.shipping_info.city}, {order.shipping_info.country}</p>
                              <p>{order.shipping_info.email}</p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatSAR(Number(order.subtotal))}</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{Number(order.shipping_cost) === 0 ? "Free" : `${formatSAR(Number(order.shipping_cost))}`}</span>
                              </div>
                              <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                                <span>Total</span>
                                <span>{formatSAR(Number(order.total))}</span>
                              </div>
                            </div>

                            <Link
                              to={`/invoice/${order.id}`}
                              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-4 h-4" /> View / Download invoice
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
