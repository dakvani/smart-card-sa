import { lazy, Suspense } from "react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";

const Settings = lazy(() => import("@/pages/Settings"));

export default function AdminSettings() {
  return (
    <BuilderShell title="Settings" hidePreview>
      <SEO title="Profile builder · Settings" description="Account settings" path="/admin/settings" />
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
        <div className="-mx-4 md:-mx-6">
          <Settings />
        </div>
      </Suspense>
    </BuilderShell>
  );
}
