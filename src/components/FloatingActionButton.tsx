import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Plus, 
  X, 
  Home, 
  User, 
  ShoppingBag, 
  Settings, 
  ArrowUp 
} from "lucide-react";

const quickActions = [
  { icon: Home, label: "Home", href: "/" },
  { icon: User, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag, label: "Products", href: "/nfc-products" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  // Show scroll to top after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <AnimatePresence>
        {/* Quick action menu */}
        {isOpen && (
          <motion.div
            id="quick-actions-menu"
            role="menu"
            aria-label="Quick navigation actions"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={action.href}
                  onClick={() => setIsOpen(false)}
                  aria-label={`Navigate to ${action.label}`}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full glass-heavy border border-border/30 shadow-elevated ${
                    location.pathname === action.href
                      ? "text-primary"
                      : "text-foreground/80"
                  }`}
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  <action.icon className="w-5 h-5" aria-hidden="true" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && !isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            aria-label="Scroll to top of page"
            className="absolute bottom-16 right-0 w-12 h-12 rounded-full glass-heavy border border-border/30 flex items-center justify-center shadow-elevated text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowUp className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
        aria-controls="quick-actions-menu"
        className="w-14 h-14 rounded-full gradient-primary shadow-glow flex items-center justify-center text-primary-foreground"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Plus className="w-6 h-6" aria-hidden="true" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
