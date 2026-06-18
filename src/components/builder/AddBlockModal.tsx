import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BLOCK_DEFS, CATEGORY_LABELS, type BlockCategory, type BlockKind } from "@/lib/blocks";
import { useBuilderStore } from "@/store/builder-store";
import { Search } from "lucide-react";

interface AddBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ORDER: BlockCategory[] = ["social", "contact", "commerce", "media", "text"];

export function AddBlockModal({ open, onOpenChange }: AddBlockModalProps) {
  const [category, setCategory] = useState<BlockCategory>("social");
  const [query, setQuery] = useState("");
  const addBlock = useBuilderStore((s) => s.addBlock);

  const filtered = BLOCK_DEFS.filter((d) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    }
    return d.category === category;
  });

  const onPick = async (kind: BlockKind) => {
    await addBlock(kind);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Add to your profile</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste a link or search blocks"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-[140px_1fr] min-h-[360px] border-t border-border">
          <aside className="border-r border-border p-2 bg-muted/30">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setQuery(""); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  category === c && !query ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </aside>
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.kind}
                    onClick={() => onPick(d.kind)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-colors min-h-[64px]"
                  >
                    <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{d.label}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{d.description}</div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-12">
                  No matches.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
