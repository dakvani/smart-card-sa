import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Database, Users, ShoppingBag, Star, Heart, Eye, Mail,
  Link, Palette, Shield, RefreshCw, ChevronRight, BarChart3, Package,
  Clock, Bell, DollarSign, TrendingUp, Activity, LogOut,
  ArrowUpRight, ArrowDownRight, FileText, Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminTableViewer } from "@/components/admin/AdminTableViewer";
import { AdminUserManager } from "@/components/admin/AdminUserManager";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { AdminProductManager } from "@/components/admin/AdminProductManager";
import { useAdminOrderNotifications } from "@/hooks/use-admin-order-notifications";
import { AdminOverviewCharts } from "@/components/admin/AdminOverviewCharts";
import { format } from "date-fns";

interface TableStats {
  name: string;
  count: number;
  icon: React.ElementType;
  description: string;
  color: string;
  tab: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  shipping_info: { name?: string; email?: string };
}

interface RecentUser {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<TableStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { hasNewOrders, notificationCount, clearNotifications } = useAdminOrderNotifications(isAdmin);

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin-login");
        return;
      }

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
      await loadAllData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [
        profilesRes, ordersRes, reviewsRes, wishlistRes, viewsRes,
        subscribersRes, linksRes, templatesRes, rolesRes,
        recentOrdersRes, recentUsersRes, revenueRes, pendingRes
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("nfc_orders").select("id", { count: "exact", head: true }),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }),
        supabase.from("product_wishlist").select("id", { count: "exact", head: true }),
        supabase.from("profile_views").select("id", { count: "exact", head: true }),
        supabase.from("email_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("links").select("id", { count: "exact", head: true }),
        supabase.from("profile_templates").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }),
        supabase.from("nfc_orders").select("id, order_number, status, total, created_at, shipping_info").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, username, avatar_url, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("nfc_orders").select("total"),
        supabase.from("nfc_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setStats([
        { name: "Users", count: profilesRes.count || 0, icon: Users, description: "Total registered users", color: "text-blue-500", tab: "users" },
        { name: "Orders", count: ordersRes.count || 0, icon: ShoppingBag, description: "Total orders placed", color: "text-green-500", tab: "orders" },
        { name: "Reviews", count: reviewsRes.count || 0, icon: Star, description: "Product reviews", color: "text-yellow-500", tab: "tables" },
        { name: "Wishlist", count: wishlistRes.count || 0, icon: Heart, description: "Saved items", color: "text-red-500", tab: "tables" },
        { name: "Views", count: viewsRes.count || 0, icon: Eye, description: "Profile views", color: "text-purple-500", tab: "tables" },
        { name: "Subscribers", count: subscribersRes.count || 0, icon: Mail, description: "Email subscribers", color: "text-cyan-500", tab: "tables" },
        { name: "Links", count: linksRes.count || 0, icon: Link, description: "Active links", color: "text-orange-500", tab: "tables" },
        { name: "Templates", count: templatesRes.count || 0, icon: Palette, description: "Profile templates", color: "text-pink-500", tab: "tables" },
        { name: "Roles", count: rolesRes.count || 0, icon: Shield, description: "Role assignments", color: "text-indigo-500", tab: "users" },
      ]);

      setRecentOrders((recentOrdersRes.data || []).map(o => ({
        ...o,
        shipping_info: typeof o.shipping_info === 'string' ? JSON.parse(o.shipping_info) : o.shipping_info as { name?: string; email?: string },
      })));
      setRecentUsers(recentUsersRes.data || []);

      const revenue = (revenueRes.data || []).reduce((sum, o) => sum + Number(o.total), 0);
      setTotalRevenue(revenue);
      setPendingOrders(pendingRes.count || 0);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    delivered: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate("/admin-login")}>Go to Admin Login</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const totalRecords = stats.reduce((acc, stat) => acc + stat.count, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main id="main-content" className="flex-1 pt-20 pb-10">
        <div className="container px-3 mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground leading-tight">Admin Control Center</h1>
                  <p className="text-xs text-muted-foreground">Full account overview & management</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {hasNewOrders && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => { clearNotifications(); setActiveTab("orders"); }}
                    className="gap-1.5 animate-pulse h-8 text-xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {notificationCount} New
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={loadAllData} disabled={refreshing} className="h-8 text-xs">
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={handleAdminLogout} className="gap-1.5 text-destructive hover:text-destructive h-8 text-xs">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4"
          >
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 cursor-pointer" onClick={() => setActiveTab("orders")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium">Revenue</p>
                          <p className="text-lg font-bold text-foreground leading-tight truncate">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent><p>Click to manage orders</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-sky-500/5 border-blue-500/20 cursor-pointer" onClick={() => setActiveTab("users")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium">Total Users</p>
                          <p className="text-lg font-bold text-foreground leading-tight">{stats.find(s => s.name === "Users")?.count.toLocaleString() || 0}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent><p>Click to manage users</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20 cursor-pointer" onClick={() => setActiveTab("orders")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium">Pending Orders</p>
                          <p className="text-lg font-bold text-foreground leading-tight">{pendingOrders}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-yellow-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent><p>Click to manage orders</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20 cursor-pointer" onClick={() => setActiveTab("tables")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium">Total Records</p>
                          <p className="text-lg font-bold text-foreground leading-tight">{totalRecords.toLocaleString()}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Database className="w-4 h-4 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent><p>Click to manage database</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid h-9">
                <TabsTrigger value="overview" className="gap-1.5 text-xs h-7">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-1.5 text-xs h-7">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Products</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-1.5 text-xs h-7">
                  <Package className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Orders</span>
                </TabsTrigger>
                <TabsTrigger value="tables" className="gap-1.5 text-xs h-7">
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Database</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5 text-xs h-7">
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs h-7">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Stats Grid */}
                <TooltipProvider delayDuration={200}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 + index * 0.03 }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveTab(stat.tab)}>
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-2 rounded-lg bg-muted ${stat.color} shrink-0`}>
                                    <stat.icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-muted-foreground leading-none">{stat.name}</p>
                                    <p className="text-lg font-bold leading-tight">{stat.count.toLocaleString()}</p>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent><p>Click to manage {stat.name.toLowerCase()}</p></TooltipContent>
                        </Tooltip>
                      </motion.div>
                    ))}
                  </div>
                </TooltipProvider>

                {/* Analytics Charts */}
                <AdminOverviewCharts />

                {/* Recent Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Recent Orders */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          Recent Orders
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")} className="gap-1 text-xs h-7">
                          View All <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-1.5">
                      {recentOrders.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No orders yet</p>
                      ) : (
                        recentOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-xs">#{order.order_number}</p>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusColors[order.status] || ''}`}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {order.shipping_info?.name || 'Unknown'} • {format(new Date(order.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                            <span className="font-bold text-xs">${Number(order.total).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Users */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" />
                          Recent Users
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("users")} className="gap-1 text-xs h-7">
                          View All <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-1.5">
                      {recentUsers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No users yet</p>
                      ) : (
                        recentUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-2.5 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{user.username}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Joined {format(new Date(user.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button variant="outline" className="h-auto py-2.5 flex-col gap-1" onClick={() => setActiveTab("orders")}>
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-[11px]">Manage Orders</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-2.5 flex-col gap-1" onClick={() => setActiveTab("users")}>
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-[11px]">Manage Users</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-2.5 flex-col gap-1" onClick={() => setActiveTab("tables")}>
                        <Database className="w-4 h-4 text-primary" />
                        <span className="text-[11px]">View Database</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-2.5 flex-col gap-1" onClick={() => setActiveTab("audit")}>
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-[11px]">Audit Logs</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products">
                <AdminProductManager />
              </TabsContent>

              {/* Orders Tab - Inline */}
              <TabsContent value="orders">
                <AdminOrdersInline />
              </TabsContent>

              <TabsContent value="tables">
                <AdminTableViewer />
              </TabsContent>

              <TabsContent value="users">
                <AdminUserManager />
              </TabsContent>

              <TabsContent value="audit">
                <AuditLogViewer />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Inline Orders Management Component
function AdminOrdersInline() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  interface RecentOrder {
    id: string;
    order_number: string;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
    created_at: string;
    updated_at: string;
    shipping_info: Record<string, string>;
    items: Record<string, unknown>[];
  }

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nfc_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders((data || []).map(o => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
        shipping_info: typeof o.shipping_info === 'string' ? JSON.parse(o.shipping_info) : o.shipping_info,
      })) as RecentOrder[]);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;
    setUpdatingOrder(orderId);
    try {
      const { error } = await supabase
        .from("nfc_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;

      if (["processing", "shipped", "delivered"].includes(newStatus)) {
        try {
          await supabase.functions.invoke("send-order-email", {
            body: {
              to: order.shipping_info?.email,
              orderNumber: order.order_number,
              status: newStatus,
              customerName: order.shipping_info?.name,
            },
          });
        } catch {}
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: "Updated", description: `Order #${order.order_number} → ${newStatus}` });
    } catch {
      toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    delivered: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Management
            </CardTitle>
            <CardDescription>{orders.length} total orders</CardDescription>
          </div>
          <Button variant="outline" onClick={loadOrders} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.shipping_info?.name} • {format(new Date(order.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColors[order.status] || ''}>
                    {order.status}
                  </Badge>
                  <span className="font-bold">${Number(order.total).toFixed(2)}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedOrder === order.id && (
                <div className="border-t p-4 bg-muted/20 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Shipping Info</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="text-foreground font-medium">{order.shipping_info?.name}</p>
                        <p>{order.shipping_info?.email}</p>
                        <p>{order.shipping_info?.address}</p>
                        <p>{order.shipping_info?.city}, {order.shipping_info?.country}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map(status => (
                          <Button
                            key={status}
                            variant={order.status === status ? "default" : "outline"}
                            size="sm"
                            className="text-xs capitalize"
                            disabled={updatingOrder === order.id}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, status); }}
                          >
                            {updatingOrder === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : status}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-muted-foreground">Subtotal: ${Number(order.subtotal).toFixed(2)}</span>
                    <span className="text-muted-foreground">Shipping: {Number(order.shipping_cost) === 0 ? "Free" : `$${Number(order.shipping_cost).toFixed(2)}`}</span>
                    <span className="font-bold">Total: ${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
