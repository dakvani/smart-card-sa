import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Home, User, ShoppingBag, Settings, ArrowUp, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

const quickActions = [
  { icon: Home, label: "Home", href: "/" },
  { icon: User, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag, label: "Products", href: "/nfc-products" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      {/* Scroll to top */}
      {showScrollTop && !open && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top of page"
          className="absolute bottom-16 right-0 w-12 h-12 rounded-full glass-heavy border border-border/30 flex items-center justify-center shadow-elevated text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close quick actions menu" : "Open quick actions menu"}
          className="w-14 h-14 rounded-full gradient-primary shadow-glow flex items-center justify-center text-primary-foreground active:scale-95 transition-transform"
        >
          {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Plus className="w-6 h-6" aria-hidden="true" />}
        </button>

        <DrawerContent className="pb-[max(env(safe-area-inset-bottom),1rem)] px-4 rounded-t-2xl">
          <DrawerTitle className="sr-only">Quick navigation</DrawerTitle>
          <div className="pt-3 pb-1">
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const active = location.pathname === action.href;
                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{action.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
