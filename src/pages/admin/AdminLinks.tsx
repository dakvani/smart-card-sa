import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { BlockList } from "@/components/builder/BlockList";
import { AddBlockModal } from "@/components/builder/AddBlockModal";
import { useBuilderStore } from "@/store/builder-store";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { SEO } from "@/components/SEO";

export default function AdminLinks() {
  const [addOpen, setAddOpen] = useState(false);
  const { profile, patchProfile } = useBuilderStore();

  return (
    <BuilderShell title="Links">
      <SEO title="Profile builder · Links" description="Edit your SmartCard profile blocks" path="/admin/links" />
      {profile && (
        <section className="rounded-xl border border-border bg-background p-4 mb-4 flex items-center gap-3">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            userId={profile.user_id}
            username={profile.username}
            onUpload={(url) => patchProfile({ avatar_url: url })}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <input
              value={profile.title || ""}
              onChange={(e) => patchProfile({ title: e.target.value })}
              placeholder="Display name"
              className="w-full bg-transparent text-base font-semibold focus:outline-none focus:ring-0"
            />
            <textarea
              value={profile.bio || ""}
              onChange={(e) => patchProfile({ bio: e.target.value })}
              placeholder="Short bio"
              rows={2}
              className="w-full bg-transparent text-xs text-muted-foreground resize-none focus:outline-none"
            />
          </div>
        </section>
      )}

      <Button
        onClick={() => setAddOpen(true)}
        size="lg"
        className="w-full justify-center gap-2 mb-4"
        variant="gradient"
      >
        <Plus className="w-5 h-5" /> Add
      </Button>

      <BlockList />

      <AddBlockModal open={addOpen} onOpenChange={setAddOpen} />
    </BuilderShell>
  );
}
