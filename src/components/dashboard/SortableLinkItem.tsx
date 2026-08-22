import * as React from "react";
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
  Search,
} from "lucide-react";
import { LinkThumbnailUpload } from "./LinkThumbnailUpload";
import { LinkScheduler } from "./LinkScheduler";
import { LinkOgPreview } from "./LinkOgPreview";

import { validateUrl } from "@/lib/link-validation";
import { toast } from "@/hooks/use-toast";
import { icons } from "lucide-react";
import {
  LINK_TYPES,
  getLinkTypeDef,
  detectLinkType,
  extractHandle,
  buildUrl,
  splitPhone,
  formatLocalPhone,
  COUNTRY_CODES,
  type LinkType,
} from "@/lib/link-types";
import { BRAND_LOGOS } from "@/lib/brand-logos";

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
  const [countrySearch, setCountrySearch] = React.useState("");
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
  const mobileMaxH = compact ? "max-h-[210px]" : "max-h-[260px]";
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

        {/* Thumbnail — auto-shows platform icon, tap to upload a custom one */}
        <div className="shrink-0">
          {(() => {
            const t = detectLinkType(link.url || "", link.title);
            const def = getLinkTypeDef(t);
            const brandLogo = BRAND_LOGOS[t];
            const Ico =
              (def.icon &&
                (icons as Record<string, React.ComponentType<{ className?: string }>>)[def.icon]) ||
              icons.Link2;
            const fallback =
              t !== "custom" ? (
                brandLogo ? (
                  <img src={brandLogo} alt={def.label} className="w-5 h-5 object-contain" />
                ) : (
                  <Ico className="w-5 h-5" />
                )
              ) : null;
            return (
              <LinkThumbnailUpload
                userId={link.user_id}
                linkId={link.id}
                currentThumbnail={link.thumbnail_url || null}
                onUpload={(url) => onUpdate(link.id, { thumbnail_url: url })}
                fallbackIcon={fallback}
              />
            );
          })()}
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
            const currentType: LinkType = detectLinkType(link.url || "", link.title);
            const typeDef = getLinkTypeDef(currentType);
            const urlResult = validateUrl(link.url || "");
            const hasUrl = (link.url || "").trim().length > 0;
            const invalid = hasUrl && !urlResult.valid;
            const TypeIcon =
              (typeDef.icon &&
                (icons as Record<string, React.ComponentType<{ className?: string }>>)[typeDef.icon]) ||
              icons.Link2;

            // Phone & WhatsApp get a dedicated country-code + local number editor.
            if (currentType === "phone" || currentType === "whatsapp") {
              const { dial, local } = splitPhone(link.url || "");
              
              const commit = (nextDial: string, nextLocal: string) => {
                const digits = nextLocal.replace(/\D/g, "");
                if (!digits && !nextDial) {
                  onUpdate(link.id, { url: "" });
                  return;
                }
                
                const dialDigits = nextDial.replace(/^\+/, "");
                if (currentType === "whatsapp") {
                  onUpdate(link.id, { url: `https://wa.me/${dialDigits}${digits}` });
                } else {
                  onUpdate(link.id, { url: `tel:+${dialDigits}${digits}` });
                }
              };

              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="shrink-0 flex items-center gap-1 px-2 rounded-lg border border-input bg-background text-[11px] text-muted-foreground">
                      <TypeIcon className="w-3 h-3 text-primary" />
                      <span>
                        {currentType === "whatsapp" ? "WhatsApp" : typeDef.label.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Select
                      value={dial || "none"}
                      onValueChange={(v) => commit(v === "none" ? "" : v, local)}
                    >
                      <SelectTrigger
                        className={`h-8 w-[92px] ${inputText} px-2 shrink-0 border-r-0 rounded-r-none focus:ring-0`}
                        aria-label="Country code"
                      >
                        <SelectValue placeholder="Code">
                          {dial || <span className="text-muted-foreground">Code</span>}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-80 w-64 p-0">
                        <div className="flex items-center border-b px-3 py-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                          <SelectItem value="none" className="cursor-pointer text-muted-foreground">
                            None
                          </SelectItem>
                          {COUNTRY_CODES.filter(c => 
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
                            c.dial.includes(countrySearch)
                          ).map((c) => (
                            <SelectItem key={c.code + c.dial} value={c.dial} className="cursor-pointer">
                              <span className="tabular-nums font-medium mr-2">{c.dial}</span>
                              <span className="text-muted-foreground truncate">{c.name}</span>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <input
                      defaultValue={formatLocalPhone(local)}
                      onBlur={(e) => commit(dial, e.target.value)}
                      placeholder={
                        currentType === "whatsapp"
                          ? "WhatsApp number"
                          : "555 123 4567"
                      }
                      inputMode="tel"
                      className={`flex-1 min-w-0 px-2.5 ${inputPadY} rounded-l-none border-l-0 rounded-lg border border-input bg-background ${inputText} tabular-nums focus-visible:ring-1`}
                    />
                  </div>
                </div>
              );
            }

            // Everything else: single input, prefixed with a small type badge.
            const isSocialOrContact =
              currentType !== "custom" && currentType !== "website";
            const displayValue = isSocialOrContact
              ? extractHandle(currentType, link.url || "")
              : link.url || "";
            const commit = (raw: string) => {
              const nextUrl = isSocialOrContact
                ? buildUrl(currentType, raw)
                : raw;
              onUpdate(link.id, { url: nextUrl });
            };
            return (
              <div className="space-y-1">
                <div className="relative flex items-stretch">
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 rounded-l-lg border border-r-0 border-input bg-secondary/60 text-[11px] text-muted-foreground`}
                    aria-hidden="true"
                    title={typeDef.label}
                  >
                    <TypeIcon className="w-3.5 h-3.5 text-primary" />
                  </span>
                  <input
                    value={displayValue}
                    onChange={(e) => commit(e.target.value)}
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
                    inputMode={currentType === "email" ? "email" : "url"}
                    aria-invalid={invalid}
                    className={`flex-1 min-w-0 pr-8 px-2.5 ${inputPadY} rounded-r-lg border bg-background ${inputText} ${
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
                {!invalid &&
                  hasUrl &&
                  !compact &&
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
