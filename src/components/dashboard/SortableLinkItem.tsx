import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Eye, EyeOff, Trash2, BarChart3, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { LinkThumbnailUpload } from "./LinkThumbnailUpload";
import { LinkScheduler } from "./LinkScheduler";
import { LinkOgPreview } from "./LinkOgPreview";

import { validateUrl } from "@/lib/link-validation";
import { toast } from "@/hooks/use-toast";


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LinkGroup {
  id: string;
  name: string;
}

interface LinkItem {
  id: string;
  user_id: string;
  title: string;
  url: string;
  visible: boolean;
  click_count: number;
  thumbnail_url?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  group_id?: string | null;
  is_featured?: boolean;
}

interface SortableLinkItemProps {
  link: LinkItem;
  onUpdate: (id: string, updates: Partial<LinkItem>) => void;
  onDelete: (id: string) => void;
  groups?: LinkGroup[];
}

export function SortableLinkItem({ link, onUpdate, onDelete, groups = [] }: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`p-4 rounded-xl border transition-all ${
        link.is_featured 
          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
          : "bg-secondary/50 border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
        
        {/* Thumbnail Upload */}
        <LinkThumbnailUpload
          userId={link.user_id}
          linkId={link.id}
          currentThumbnail={link.thumbnail_url || null}
          onUpload={(url) => onUpdate(link.id, { thumbnail_url: url })}
        />

        <div className="flex-1 space-y-3">
          <input
            value={link.title}
            onChange={(e) => onUpdate(link.id, { title: e.target.value })}
            onBlur={(e) => onUpdate(link.id, { title: e.target.value })}
            placeholder="Link Title"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-medium"
          />
          {(() => {
            const urlResult = validateUrl(link.url || "");
            const hasUrl = (link.url || "").trim().length > 0;
            const invalid = hasUrl && !urlResult.valid;
            return (
              <div>
                <div className="relative">
                  <input
                    value={link.url}
                    onChange={(e) => onUpdate(link.id, { url: e.target.value })}
                    onBlur={(e) => {
                      const v = e.target.value;
                      const res = validateUrl(v);
                      if (v.trim() && !res.valid) {
                        toast({ title: "Invalid link URL", description: res.message, variant: "destructive" });
                        return;
                      }
                      onUpdate(link.id, { url: v });
                    }}
                    placeholder="https://..."
                    aria-invalid={invalid}
                    className={`w-full pr-9 px-3 py-2 rounded-lg border bg-background text-sm ${
                      invalid ? "border-destructive focus-visible:ring-destructive" : "border-input"
                    }`}
                  />
                  {hasUrl && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {urlResult.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
                {invalid && urlResult.message && (
                  <p className="text-xs text-destructive mt-1">{urlResult.message}</p>
                )}
                {!invalid && hasUrl && (
                  <LinkOgPreview url={link.url} fallbackTitle={link.title} />
                )}
              </div>

            );
          })()}

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{link.click_count} clicks</span>
            </div>
            <LinkScheduler
              scheduledStart={link.scheduled_start || null}
              scheduledEnd={link.scheduled_end || null}
              onUpdate={(start, end) => onUpdate(link.id, { scheduled_start: start, scheduled_end: end })}
            />
            {groups.length > 0 && (
              <Select
                value={link.group_id || "none"}
                onValueChange={(value) => onUpdate(link.id, { group_id: value === "none" ? null : value })}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <button
          onClick={() => onUpdate(link.id, { is_featured: !link.is_featured })}
          className={`p-2 rounded-lg transition-colors ${
            link.is_featured 
              ? "bg-primary/20 text-primary hover:bg-primary/30" 
              : "hover:bg-secondary text-muted-foreground hover:text-primary"
          }`}
          title={link.is_featured ? "Unpin link" : "Pin to top"}
        >
          <Star className={`w-4 h-4 ${link.is_featured ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={() => onUpdate(link.id, { visible: !link.visible })}
          className="p-2 hover:bg-secondary rounded-lg"
          title={link.visible ? "Hide link" : "Show link"}
        >
          {link.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => onDelete(link.id)}
          className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
