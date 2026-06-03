import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { Loader2, TrendingUp, DollarSign, Users, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
  users: number;
}

export function AdminOverviewCharts() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(30);

  useEffect(() => {
    loadChartData();
  }, [period]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), period - 1));
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

      const [ordersRes, usersRes] = await Promise.all([
        supabase
          .from("nfc_orders")
          .select("total, created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true }),
      ]);

      const orders = ordersRes.data || [];
      const users = usersRes.data || [];

      const chartData = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayOrders = orders.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === dateStr);
        const dayUsers = users.filter(u => u.created_at && format(new Date(u.created_at), "yyyy-MM-dd") === dateStr);

        return {
          date: format(date, "MMM d"),
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          orders: dayOrders.length,
          users: dayUsers.length,
        };
      });

      setData(chartData);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const totalUsers = data.reduce((s, d) => s + d.users, 0);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trends & Analytics
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod(7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === 7 ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setPeriod(30)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === 30 ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            30 days
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs">Revenue ({period}d)</span>
          </div>
          <p className="text-lg font-bold">SAR {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="text-xs">Orders ({period}d)</span>
          </div>
          <p className="text-lg font-bold">{totalOrders}</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">New Users ({period}d)</span>
          </div>
          <p className="text-lg font-bold">{totalUsers}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickFormatter={v => `SAR ${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`SAR ${value.toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders & Users Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#usersGrad)" name="New Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
