import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { Loader2, TrendingUp, Eye, MousePointer } from "lucide-react";
const DetailedAnalytics = lazy(() =>
  import("./DetailedAnalytics").then((m) => ({ default: m.DetailedAnalytics }))
);

interface AnalyticsChartsProps {
  profileId: string;
  links: Array<{ id: string; title: string; click_count: number }>;
}

interface ViewData {
  date: string;
  views: number;
}

export function AnalyticsCharts({ profileId, links }: AnalyticsChartsProps) {
  const [viewsData, setViewsData] = useState<ViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const startDate = startOfDay(subDays(new Date(), period - 1));
        
        // Fetch views for the period
        const { data: viewsRaw, error } = await supabase
          .from("profile_views")
          .select("viewed_at")
          .eq("profile_id", profileId)
          .gte("viewed_at", startDate.toISOString())
          .order("viewed_at", { ascending: true });

        if (error) throw error;

        // Create date range
        const dateRange = eachDayOfInterval({
          start: startDate,
          end: new Date(),
        });

        // Aggregate views by day
        const viewsByDay = dateRange.map(date => {
          const dateStr = format(date, "yyyy-MM-dd");
          const dayViews = (viewsRaw || []).filter(v => 
            format(new Date(v.viewed_at!), "yyyy-MM-dd") === dateStr
          ).length;
          
          return {
            date: format(date, "MMM d"),
            views: dayViews,
          };
        });

        setViewsData(viewsByDay);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [profileId, period]);

  const totalViews = viewsData.reduce((sum, d) => sum + d.views, 0);
  const totalClicks = links.reduce((sum, l) => sum + (l.click_count || 0), 0);
  const avgViewsPerDay = viewsData.length > 0 ? (totalViews / viewsData.length).toFixed(1) : "0";
  const clickRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  const topLinks = [...links]
    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod(7)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            period === 7 ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setPeriod(30)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            period === 30 ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          Last 30 days
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Total Views</span>
          </div>
          <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MousePointer className="w-4 h-4" />
            <span className="text-xs">Total Clicks</span>
          </div>
          <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Avg Views/Day</span>
          </div>
          <p className="text-2xl font-bold">{avgViewsPerDay}</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MousePointer className="w-4 h-4" />
            <span className="text-xs">Click Rate</span>
          </div>
          <p className="text-2xl font-bold">{clickRate}%</p>
        </div>
      </div>

      {/* Views Chart */}
      <div className="p-4 bg-secondary/30 rounded-xl">
        <h3 className="font-semibold mb-4">Profile Views Over Time</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewsData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#viewsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Links Chart */}
      {topLinks.length > 0 && (
        <div className="p-4 bg-secondary/30 rounded-xl">
          <h3 className="font-semibold mb-4">Top Performing Links</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLinks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  type="category"
                  dataKey="title"
                  width={120}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar 
                  dataKey="click_count" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                  name="Clicks"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Click Analytics — lazy */}
      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-4">Click Analytics</h3>
        <Suspense fallback={<div className="py-6 text-center text-xs text-muted-foreground">Loading details…</div>}>
          <DetailedAnalytics profileId={profileId} period={period} />
        </Suspense>
      </div>
    </div>
  );
}
