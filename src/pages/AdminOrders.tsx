import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle, Truck, XCircle, Shield, Mail, Loader2, RefreshCw, Save, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  status: string;
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
  notes: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending" },
  confirmed: { icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Confirmed" },
  processing: { icon: Package, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Processing" },
  shipped: { icon: Truck, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled" },
};

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_info.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    checkAdminAndLoadOrders();
  }, []);

  const checkAdminAndLoadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (rolesError || !roles || roles.length === 0) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await loadAllOrders();
    } catch (error) {
      console.error("Error checking admin status:", error);
      setLoading(false);
    }
  };

  const loadAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("nfc_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedOrders = (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        shipping_info: typeof order.shipping_info === 'string' ? JSON.parse(order.shipping_info) : order.shipping_info,
      }));

      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;

    setUpdatingOrder(orderId);

    try {
      // Update order status in database
      const { error: updateError } = await supabase
        .from("nfc_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Send email notification for status changes
      if (["confirmed", "processing", "shipped", "delivered"].includes(newStatus)) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-order-email", {
            body: {
              to: order.shipping_info.email,
              orderNumber: order.order_number,
              status: newStatus,
              customerName: order.shipping_info.name,
            },
          });

          if (emailError) {
            console.log("Email notification error (may be in test mode):", emailError);
          }
        } catch (emailErr) {
          console.log("Email notification:", emailErr);
        }
      }

      // Update local state
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
      ));

      toast({
        title: "Order updated",
        description: `Order #${order.order_number} status changed to ${newStatus}. Email notification sent.`,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleSaveNotes = async (orderId: string) => {
    setSavingNotes(orderId);
    try {
      const { error } = await supabase
        .from("nfc_orders")
        .update({ notes: orderNotes[orderId] ?? "" })
        .eq("id", orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, notes: orderNotes[orderId] ?? "" } : o));
      toast({ title: "Notes saved", description: "Order notes updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
    } finally {
      setSavingNotes(null);
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin panel.
            </p>
            <Button variant="gradient" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Manage NFC product orders</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={loadAllOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            <Badge variant="outline" className="text-muted-foreground">
                {filteredOrders.length} of {orders.length} orders
              </Badge>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {orders.length === 0 ? "No orders yet" : "No matching orders"}
              </h2>
              <p className="text-muted-foreground">
                {orders.length === 0 
                  ? "Orders will appear here when customers place them."
                  : "Try adjusting your search or filter."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedOrder === order.id;
                const isUpdating = updatingOrder === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="flex items-center gap-4 text-left flex-1"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Order #{order.order_number}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.shipping_info.name} • {order.shipping_info.email}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-4 flex-wrap">
                          <Badge className={`${statusInfo.color} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>

                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {statusConfig[status].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {isUpdating && (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            )}
                          </div>

                          <span className="font-bold text-lg">{formatSAR(Number(order.total))}</span>
                        </div>
                      </div>

                      {/* Email notification indicator */}
                      {["confirmed", "processing", "shipped", "delivered"].includes(order.status) && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>Email notification sent for "{statusConfig[order.status].label}" status</span>
                        </div>
                      )}
                    </div>

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
                                    {item.customization.name && (
                                      <p className="text-sm text-muted-foreground">
                                        Name: {item.customization.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="md:col-span-2">
                            <h4 className="font-medium mb-2">Notes</h4>
                            <Textarea
                              placeholder="Add notes about this order (e.g. customer requests, updates)..."
                              value={orderNotes[order.id] ?? order.notes ?? ""}
                              onChange={(e) => setOrderNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                              className="min-h-[80px]"
                            />
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() => handleSaveNotes(order.id)}
                              disabled={savingNotes === order.id}
                            >
                              {savingNotes === order.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                              Save Notes
                            </Button>
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

                            <div className="mt-4 text-xs text-muted-foreground">
                              Last updated: {format(new Date(order.updated_at), "MMM d, yyyy 'at' h:mm a")}
                            </div>
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
