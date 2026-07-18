import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Menu, X, LayoutDashboard, Home, Settings, LogOut, ChevronDown, Shield, CreditCard, Link2, Store, Mail, BookOpen, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
// ThemeToggle removed from public navigation — site appearance is admin-controlled.
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";
import { PlanStatusBadge } from "@/components/PlanStatusBadge";
import { PlanWelcomeDialog } from "@/components/dashboard/PlanWelcomeDialog";
import { usePlan } from "@/hooks/use-plan";

const navLinks = [
  { name: "SmartCard Products", href: "/nfc-products", icon: CreditCard },
  { name: "SmartLink Bio", href: "/smartlink-bio", icon: Link2 },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Contact Us", href: "/contact", icon: Mail },
  { name: "Learn", href: "/learn", icon: BookOpen },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 60], [0.75, 0.96]);
  const headerScale = useTransform(scrollY, [0, 120], [1, 0.96]);
  const headerBlur = useTransform(scrollY, [0, 60], [18, 36]);
  const headerBackdrop = useTransform(headerBlur, (v) => `blur(${v}px) saturate(180%)`);

  // Hide header when scrolling down past a threshold; reveal on scroll up.
  // Stays visible while the mobile menu is open or near the top.
  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    const delta = latest - prev;
    if (mobileOpen || latest < 80) {
      setHidden(false);
      return;
    }
    if (delta > 4) setHidden(true);
    else if (delta < -4) setHidden(false);
  });


  // Check auth state and get user info
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      setUserEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      if (user) {
        fetchUserProfile(user.id);
        checkAdminRole(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setAvatarUrl(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const getUserInitials = () => {
    if (!userEmail) return "U";
    return userEmail.charAt(0).toUpperCase();
  };

  const { plan, loading: planLoading } = usePlan(userId ?? undefined);

  // Track scroll position for styling only — header stays visible.
  // A plain scroll listener is more reliable across environments (and
  // testable) than framer-motion's useMotionValueEvent.
  useEffect(() => {
    const update = () => {
      setHasScrolled((window.scrollY ?? window.pageYOffset ?? 0) > 20);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Outside-click + Esc to close the mobile menu
  useEffect(() => {
    if (!mobileOpen) return;

    const handlePointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (mobileMenuRef.current?.contains(target)) return;
      if (mobileToggleRef.current?.contains(target)) return;
      setMobileOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.6 }}
      style={{ scale: headerScale }}
      className="fixed top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 z-50 origin-top will-change-transform"
      role="banner"
    >
      {isAuthenticated && userId && (
        <PlanWelcomeDialog userId={userId} plan={plan} loading={planLoading} />
      )}
      <motion.div 
        className={`absolute inset-0 rounded-2xl sm:rounded-full bg-background/80 border border-border/50 transition-all duration-500 ${
          hasScrolled
            ? "shadow-[0_24px_80px_-16px_rgba(0,0,0,0.6),0_0_0_1px_hsl(var(--primary)/0.25),0_0_60px_-12px_hsl(var(--primary)/0.3)] border-primary/30"
            : "shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)]"
        }`}
        style={{ opacity: headerOpacity, backdropFilter: headerBackdrop, WebkitBackdropFilter: headerBackdrop as any }}
        aria-hidden="true"
      />
      {/* Animated shimmer line on scroll */}
      <motion.div
        className="absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full pointer-events-none"
        animate={{ opacity: hasScrolled ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        aria-hidden="true"
      />
      <nav 
        className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between relative z-10"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
          aria-label="SmartCard - Go to homepage"
        >
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-primary"
          >
            <SmartCardLogo className="w-7 h-7" />
          </motion.div>
          <span className="font-bold text-xl tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
            Smart<span className="text-primary">Card</span>
          </span>
          {isAuthenticated && (
            <PlanStatusBadge userId={userId ?? undefined} className="hidden sm:inline-flex ml-1" />
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1" role="menubar">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              role="none"
            >
              <Link
                to={link.href}
                role="menuitem"
                aria-current={location.pathname === link.href ? "page" : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  location.pathname === link.href
                    ? "bg-accent/80 text-accent-foreground backdrop-blur-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                {link.name}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Auth Buttons & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {location.pathname !== "/" && (
                <Link to="/" aria-label="Go to homepage">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Home className="w-4 h-4 mr-1" />
                    Home
                  </Button>
                </Link>
              )}
              <Link to="/dashboard" aria-label="Go to dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <LayoutDashboard className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl || undefined} alt="Your account profile picture" />

                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border z-50">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login" aria-label="Log in to your account">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" aria-label="Sign up for a free account">
                <Button variant="gradient" size="sm" className="shadow-glow">
                  Sign up free
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          
          <button
            ref={mobileToggleRef}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu — compact, minimalist dropdown list */}
      {mobileOpen && (
        <motion.div
          ref={mobileMenuRef}
          id="mobile-menu"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="lg:hidden absolute right-3 sm:right-6 mt-2 w-60 origin-top-right rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          role="menu"
          aria-label="Mobile navigation menu"
        >
          {/* Signed-in user header */}
          {isAuthenticated && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-border/60">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl || undefined} alt="Your profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate leading-none">{userEmail}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-1">Signed in</p>
              </div>
            </div>
          )}

          {/* Primary nav */}
          <ul className="py-1" role="none">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.href;
              return (
                <li key={link.name} role="none">
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/85 hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{link.name}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Account section */}
          <div className="border-t border-border/60 py-1" role="group" aria-label="Account">
            {isAuthenticated ? (
              <>
                {location.pathname !== "/" && (
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/85 hover:bg-accent/60 hover:text-foreground transition-colors"
                  >
                    <Home className="w-4 h-4 shrink-0 text-muted-foreground" /> Home
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/85 hover:bg-accent/60 hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-muted-foreground" /> Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Shield className="w-4 h-4 shrink-0" /> Admin Panel
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/85 hover:bg-accent/60 hover:text-foreground transition-colors"
                >
                  <Settings className="w-4 h-4 shrink-0 text-muted-foreground" /> Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/85 hover:bg-accent/60 hover:text-foreground transition-colors"
                >
                  <LogIn className="w-4 h-4 shrink-0 text-muted-foreground" /> Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 mx-2 my-1 px-3 py-2 rounded-lg text-[13px] font-semibold gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Sign up free
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
