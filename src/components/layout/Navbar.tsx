import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Menu, X, LayoutDashboard, Home, Settings, Package, LogOut, ChevronDown, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  { name: "SmartCard Products", href: "/nfc-products" },
  { name: "SmartLink Bio", href: "/smartlink-bio" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Contact Us", href: "/contact" },
  { name: "Learn", href: "/learn" },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 60], [0.75, 0.96]);
  const headerScale = useTransform(scrollY, [0, 120], [1, 0.96]);
  const headerY = useTransform(scrollY, [0, 120], [0, 4]);
  const headerBlur = useTransform(scrollY, [0, 60], [18, 36]);
  const headerBackdrop = useTransform(headerBlur, (v) => `blur(${v}px) saturate(180%)`);

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

  // Track scroll position for styling only — header stays visible
  useMotionValueEvent(scrollY, "change", (currentScrollY) => {
    setHasScrolled(currentScrollY > 20);
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
      style={{ scale: headerScale, y: headerY }}
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
          <ThemeToggle />
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
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
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
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/order-history" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Order History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=settings" className="cursor-pointer">
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
          <ThemeToggle />
          <button
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden mt-2 glass-heavy rounded-2xl ring-1 ring-border/30 shadow-2xl overflow-hidden"
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                role="none"
              >
                <Link
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  role="menuitem"
                  aria-current={location.pathname === link.href ? "page" : undefined}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === link.href
                      ? "bg-accent/80 text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            <div className="pt-4 flex flex-col gap-2" role="group" aria-label="Authentication options">
              {isAuthenticated ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-accent/30 rounded-lg mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userEmail}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>
                  
                  {location.pathname !== "/" && (
                    <Link to="/" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full border-border/50" aria-label="Go to homepage">
                        <Home className="w-4 h-4 mr-2" />
                        Home
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-border/50" aria-label="Go to dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/order-history" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-border/50" aria-label="View order history">
                      <Package className="w-4 h-4 mr-2" />
                      Order History
                    </Button>
                  </Link>
                  <Link to="/dashboard?tab=settings" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-border/50" aria-label="Go to settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-border/50" aria-label="Log in to your account">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    <Button variant="gradient" className="w-full shadow-glow" aria-label="Sign up for a free account">
                      Sign up free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
