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
      <DialogContent className="max-w-[500px] p-0 gap-0 bg-[#1A1B1E] border-none text-white shadow-2xl">
        <DialogHeader className="p-4 border-b border-white/5">
          <DialogTitle className="text-base font-semibold">Add a new link</DialogTitle>
        </DialogHeader>
        <div className="p-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-4 gap-3">
            {LINK_TYPES.map((t) => {
              const brandLogo = BRAND_LOGOS[t.value];
              const Icon = (t.icon && (icons as Record<string, React.ComponentType<{ className?: string }>>)[t.icon]) || icons.Link2;
              
              return (
                <button
                  key={t.value}
                  onClick={() => handlePick(t.value)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-[#2C2D31] hover:bg-[#3A3B40] transition-all duration-200 text-center group border-none"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-200 overflow-hidden">
                    {brandLogo ? (
                      <img src={brandLogo} alt={t.label} className="w-7 h-7 object-contain" />
                    ) : (
                      <Icon className="w-6 h-6 text-white/70" />
                    )}
                  </div>
                  <span className="text-[11px] leading-tight font-medium text-white/80 group-hover:text-white transition-colors">
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
