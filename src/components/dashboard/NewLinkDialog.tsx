import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LINK_TYPES, type LinkType } from "@/lib/link-types";
import { icons } from "lucide-react";
import { BRAND_LOGOS } from "@/lib/brand-logos";


interface NewLinkDialogProps {
  onCreate: (type: LinkType) => void;
  trigger: React.ReactNode;
}

export function NewLinkDialog({ onCreate, trigger }: NewLinkDialogProps) {
  const [open, setOpen] = useState(false);

  const handlePick = (type: LinkType) => {
    setOpen(false);
    onCreate(type);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-base">Add a new link</DialogTitle>
        </DialogHeader>
        <div className="p-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {LINK_TYPES.map((t) => {
              const brandLogo = BRAND_LOGOS[t.value];
              const Icon = (t.icon && (icons as Record<string, React.ComponentType<{ className?: string }>>)[t.icon]) || icons.Link2;
              
              return (
                <button
                  key={t.value}
                  onClick={() => handlePick(t.value)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/50 transition-colors text-center group"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {brandLogo ? (
                      <img src={brandLogo} alt={t.label} className="w-5 h-5 object-contain filter brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className="text-[11px] leading-tight font-medium text-foreground">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
