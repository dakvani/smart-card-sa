import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
  Star,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { LinkThumbnailUpload } from "./LinkThumbnailUpload";
import { LinkScheduler } from "./LinkScheduler";
import { LinkOgPreview } from "./LinkOgPreview";

import { validateUrl } from "@/lib/link-validation";
import { toast } from "@/hooks/use-toast";
import {
  LINK_TYPES,
  detectLinkType,
  extractHandle,
  buildUrl,
  type LinkType,
} from "@/lib/link-types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  /** Compact mode shrinks padding & hides OG preview to keep cards dense. */
  compact?: boolean;
}

export function SortableLinkItem({
  link,
  onUpdate,
  onDelete,
  groups = [],
  compact = false,
}: SortableLinkItemProps) {
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

  // Strict min/max height caps keep each card at a Linktree-like density on mobile.
  const containerPad = compact ? "p-2" : "p-2.5 sm:p-4";
  const mobileMinH = "min-h-[64px]";
  const mobileMaxH = compact ? "max-h-[168px]" : "max-h-[224px]";
  const inputPadY = compact ? "py-1" : "py-1.5 sm:py-2";
  const inputText = compact ? "text-[12px] sm:text-sm" : "text-[13px] sm:text-sm";
  const gapY = compact ? "space-y-1" : "space-y-1.5 sm:space-y-2";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      data-testid="sortable-link-item"
      data-compact={compact ? "1" : "0"}
      className={`${containerPad} rounded-xl border transition-all overflow-hidden ${mobileMinH} ${mobileMaxH} sm:max-h-none ${
        link.is_featured
          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
          : "bg-secondary/50 border-border"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3 h-full">
        <button
          {...attributes}
          {...listeners}
          className="mt-1.5 sm:mt-2 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </button>

        {/* Thumbnail */}
        <div className="shrink-0">
          <LinkThumbnailUpload
            userId={link.user_id}
            linkId={link.id}
            currentThumbnail={link.thumbnail_url || null}
            onUpload={(url) => onUpdate(link.id, { thumbnail_url: url })}
          />
        </div>

        <div className={`flex-1 min-w-0 ${gapY}`}>
          <input
            value={link.title}
            onChange={(e) => onUpdate(link.id, { title: e.target.value })}
            onBlur={(e) => onUpdate(link.id, { title: e.target.value })}
            placeholder="Link Title"
            className={`w-full px-2.5 ${inputPadY} rounded-lg border border-input bg-background ${inputText} font-medium`}
          />
          {(() => {
            const currentType: LinkType = detectLinkType(link.url || "");
            const typeDef =
              LINK_TYPES.find((t) => t.value === currentType) ?? LINK_TYPES[0];
            const handleValue = extractHandle(currentType, link.url || "");
            const urlResult = validateUrl(link.url || "");
            const hasUrl = (link.url || "").trim().length > 0;
            const invalid = hasUrl && !urlResult.valid;
            const isSocialOrContact = currentType !== "custom";

            return (
              <div className="space-y-1.5">
                <Select
                  value={currentType}
                  onValueChange={(next) => {
                    const nextType = next as LinkType;
                    // Convert current handle into the new type's URL shape.
                    const rebuilt = buildUrl(nextType, handleValue);
                    onUpdate(link.id, { url: rebuilt });
                  }}
                >
                  <SelectTrigger
                    className={`h-7 w-full ${inputText} px-2`}
                    aria-label="Link type"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {LINK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <input
                    value={isSocialOrContact ? handleValue : link.url}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const nextUrl = isSocialOrContact
                        ? buildUrl(currentType, raw)
                        : raw;
                      onUpdate(link.id, { url: nextUrl });
                    }}
                    onBlur={(e) => {
                      const raw = e.target.value;
                      const nextUrl = isSocialOrContact
                        ? buildUrl(currentType, raw)
                        : raw;
                      const res = validateUrl(nextUrl);
                      if (nextUrl.trim() && !res.valid) {
                        toast({
                          title: "Invalid link",
                          description: res.message,
                          variant: "destructive",
                        });
                        return;
                      }
                      onUpdate(link.id, { url: nextUrl });
                    }}
                    placeholder={typeDef.placeholder}
                    inputMode={
                      currentType === "phone" || currentType === "whatsapp"
                        ? "tel"
                        : currentType === "email"
                        ? "email"
                        : "url"
                    }
                    aria-invalid={invalid}
                    className={`w-full pr-8 px-2.5 ${inputPadY} rounded-lg border bg-background ${inputText} ${
                      invalid
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-input"
                    }`}
                  />
                  {hasUrl && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      {urlResult.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
                {invalid && urlResult.message && (
                  <p className="text-[11px] text-destructive mt-1">
                    {urlResult.message}
                  </p>
                )}
                {typeDef.hint && !invalid && (
                  <p className="text-[10px] text-muted-foreground">
                    {typeDef.hint}
                  </p>
                )}
                {/* OG preview: skipped for tel:/mailto:, hidden on mobile & compact */}
                {!invalid &&
                  hasUrl &&
                  !compact &&
                  currentType !== "phone" &&
                  currentType !== "email" && (
                    <div className="hidden sm:block">
                      <LinkOgPreview url={link.url} fallbackTitle={link.title} />
                    </div>
                  )}
              </div>
            );
          })()}

          {!compact ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>{link.click_count} clicks</span>
              </div>
              {/* Scheduler & group select hidden on mobile — available in overflow menu / non-compact desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <LinkScheduler
                  scheduledStart={link.scheduled_start || null}
                  scheduledEnd={link.scheduled_end || null}
                  onUpdate={(start, end) =>
                    onUpdate(link.id, {
                      scheduled_start: start,
                      scheduled_end: end,
                    })
                  }
                />
                {groups.length > 0 && (
                  <Select
                    value={link.group_id || "none"}
                    onValueChange={(value) =>
                      onUpdate(link.id, {
                        group_id: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs px-2">
                      <SelectValue placeholder="No group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <BarChart3 className="w-3 h-3" />
              <span className="tabular-nums">{link.click_count}</span>
              {!link.visible && <span className="text-amber-400">• hidden</span>}
              {link.is_featured && <span className="text-primary">• pinned</span>}
            </div>
          )}
        </div>

        {/* Actions — single overflow menu on mobile, inline row on desktop */}
        <div className="shrink-0">
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                  aria-label="Link actions"
                  title="Link actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() =>
                    onUpdate(link.id, { is_featured: !link.is_featured })
                  }
                >
                  <Star
                    className={`w-4 h-4 mr-2 ${
                      link.is_featured ? "fill-current text-primary" : ""
                    }`}
                  />
                  {link.is_featured ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdate(link.id, { visible: !link.visible })}
                >
                  {link.visible ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {link.visible ? "Hide" : "Show"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(link.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden sm:flex items-center gap-0">
            <button
              onClick={() =>
                onUpdate(link.id, { is_featured: !link.is_featured })
              }
              className={`p-2 rounded-lg transition-colors ${
                link.is_featured
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "hover:bg-secondary text-muted-foreground hover:text-primary"
              }`}
              title={link.is_featured ? "Unpin link" : "Pin to top"}
            >
              <Star
                className={`w-4 h-4 ${link.is_featured ? "fill-current" : ""}`}
              />
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
              title="Delete link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
