import { lazy, Suspense } from "react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { useBuilderStore } from "@/store/builder-store";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";

const AnalyticsCharts = lazy(() =>
  import("@/components/dashboard/AnalyticsCharts").then((m) => ({ default: m.AnalyticsCharts })),
);

export default function AdminInsights() {
  const { profile, blocks } = useBuilderStore();
  if (!profile) return null;
  const links = blocks
    .filter((b) => b.kind === "link" || b.kind === "shop_link")
    .map((b) => ({ id: b.id, title: (b.data?.title as string) || "Link", click_count: b.click_count }));

  return (
    <BuilderShell title="Insights" hidePreview>
      <SEO title="Profile builder · Insights" description="Profile analytics" path="/admin/insights" />
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
        <AnalyticsCharts profileId={profile.id} links={links} />
      </Suspense>
    </BuilderShell>
  );
}
