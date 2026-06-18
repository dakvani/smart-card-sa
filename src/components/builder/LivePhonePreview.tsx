import { useBuilderStore } from "@/store/builder-store";
import { SOCIAL_ICONS } from "@/lib/blocks";
import { ExternalLink as LinkIcon, MessageCircle, Mail, Phone, Contact as ContactIcon } from "lucide-react";

/**
 * Live phone-shaped preview of the current builder state.
 * Reads directly from the builder store so updates are realtime.
 */
export function LivePhonePreview({ compact = false }: { compact?: boolean }) {
  const { profile, blocks } = useBuilderStore();
  if (!profile) return null;
  const visible = blocks.filter((b) => b.visible);
  const gradient = profile.theme_gradient || "from-indigo-900 via-purple-900 to-pink-900";

  return (
    <div
      style={{ aspectRatio: "9 / 19.5" }}
      className={`mx-auto rounded-[2.25rem] border border-border/40 bg-background shadow-elevated overflow-hidden w-full ${
        compact ? "max-w-[220px]" : "max-w-[300px]"
      }`}
    >
      <div className={`h-full w-full overflow-y-auto bg-gradient-to-br ${gradient} p-5`}>
        <div className="flex flex-col items-center text-center text-white">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/40" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/10 ring-2 ring-white/30" />
          )}
          <div className="mt-3 font-semibold text-lg leading-tight">{profile.title || `@${profile.username}`}</div>
          {profile.bio && <div className="mt-1 text-xs text-white/80 max-w-[220px]">{profile.bio}</div>}
        </div>

        <div className="mt-5 space-y-2.5">
          {visible.map((b) => (
            <PreviewBlock key={b.id} kind={b.kind} data={b.data} />
          ))}
          {visible.length === 0 && (
            <div className="text-center text-white/60 text-xs py-12">Add your first block to see it here</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ kind, data }: { kind: string; data: Record<string, any> }) {
  if (kind === "header") return <div className="text-white font-semibold text-sm pt-2">{data.text}</div>;
  if (kind === "text") return <div className="text-white/80 text-xs leading-relaxed">{data.text}</div>;
  if (kind === "divider") return <div className="h-px bg-white/20 my-2" />;
  if (kind === "image") return data.url ? <img src={data.url} alt="" className="w-full rounded-xl" /> : null;
  if (kind === "social_row") {
    const entries = Object.entries(data || {}).filter(([_, v]) => v);
    return (
      <div className="flex justify-center gap-2 flex-wrap">
        {entries.map(([k]) => {
          const Icon = (SOCIAL_ICONS as any)[k] ?? LinkIcon;
          return (
            <span key={k} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </span>
          );
        })}
      </div>
    );
  }
  if (kind === "media_embed" || kind === "shop_link" || kind === "link" || kind === "product_card") {
    return (
      <button className="w-full rounded-xl bg-white/95 text-foreground py-2.5 px-4 text-sm font-medium shadow-sm">
        {data.title || data.url || "Link"}
      </button>
    );
  }
  if (kind === "contact_whatsapp") return <PreviewPill icon={MessageCircle} label="WhatsApp" />;
  if (kind === "contact_email") return <PreviewPill icon={Mail} label="Email" />;
  if (kind === "contact_phone") return <PreviewPill icon={Phone} label="Phone" />;
  if (kind === "vcard") return <PreviewPill icon={ContactIcon} label="Save Contact" />;
  return null;
}

function PreviewPill({ label, icon: Icon }: { label: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <button className="w-full rounded-xl bg-white/15 text-white py-2.5 px-4 text-sm font-medium border border-white/25 flex items-center justify-center gap-2">
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
}
