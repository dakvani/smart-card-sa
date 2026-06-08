import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  User as UserIcon,
  ShoppingBag,
  Wallet,
  MapPin,
  CreditCard,
  ShieldAlert,
  ChevronRight,
  Phone,
  Camera,
  Pencil,
  Check,
  X as XIcon,
} from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EcommerceSettings } from "@/components/settings/EcommerceSettings";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { cn } from "@/lib/utils";

type SectionId =
  | "account"
  | "email"
  | "password"
  | "orders"
  | "wallet"
  | "addresses"
  | "payments"
  | "danger";

const NAV: {
  id: SectionId;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { id: "account", label: "Account", group: "Profile", icon: UserIcon, description: "Your personal details & avatar" },
  { id: "email", label: "Contact", group: "Profile", icon: Phone, description: "Email address & mobile number" },
  { id: "password", label: "Password", group: "Profile", icon: Lock, description: "Change your password" },
  { id: "orders", label: "Orders", group: "Shop", icon: ShoppingBag, description: "Recent purchases" },
  { id: "wallet", label: "Wallet", group: "Shop", icon: Wallet, description: "Credit & promos" },
  { id: "addresses", label: "Addresses", group: "Shop", icon: MapPin, description: "Shipping addresses" },
  { id: "payments", label: "Payments", group: "Shop", icon: CreditCard, description: "Saved cards" },
  { id: "danger", label: "Danger Zone", group: "Account", icon: ShieldAlert, description: "Delete your account" },
];

const VALID_SECTIONS: SectionId[] = [
  "account",
  "email",
  "password",
  "orders",
  "wallet",
  "addresses",
  "payments",
  "danger",
];

function sectionFromHash(hash: string): SectionId {
  const id = hash.replace(/^#/, "") as SectionId;
  return VALID_SECTIONS.includes(id) ? id : "account";
}

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActiveState] = useState<SectionId>(() => sectionFromHash(location.hash));

  const setActive = (id: SectionId) => {
    setActiveState(id);
    if (location.hash !== `#${id}`) {
      navigate(`${location.pathname}#${id}`, { replace: false });
    }
  };

  // keep state in sync with hash (back/forward navigation, direct refresh)
  useEffect(() => {
    const next = sectionFromHash(location.hash);
    setActiveState((prev) => (prev === next ? prev : next));
  }, [location.hash]);


  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [resendingVerification, setResendingVerification] = useState(false);
  const [lastResent, setLastResent] = useState<Date | null>(null);

  // Profile holder details
  const [profileId, setProfileId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const isEmailVerified = user?.email_confirmed_at != null;

  const handleResendVerification = async () => {
    if (!user?.email) return;
    if (lastResent && Date.now() - lastResent.getTime() < 60000) {
      const remaining = Math.ceil((60000 - (Date.now() - lastResent.getTime())) / 1000);
      toast.error(`Please wait ${remaining} seconds before resending`);
      return;
    }
    setResendingVerification(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      setLastResent(new Date());
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to your new address.");
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Current password is incorrect");
        setUpdatingPassword(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  const activeItem = NAV.find((n) => n.id === active)!;
  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl">SmartCard</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile hero */}
          <div className="bg-background rounded-2xl border border-border p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
              {(user.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold truncate">Settings</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <AlertCircle className="w-4 h-4" /> Unverified
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Side nav */}
            <aside className="bg-background rounded-2xl border border-border p-3 lg:sticky lg:top-24 self-start">
              <nav className="space-y-4">
                {groups.map((g) => (
                  <div key={g}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                      {g}
                    </p>
                    <ul className="space-y-0.5">
                      {NAV.filter((n) => n.group === g).map((n) => {
                        const Icon = n.icon;
                        const isActive = n.id === active;
                        const isDanger = n.id === "danger";
                        return (
                          <li key={n.id}>
                            <button
                              onClick={() => setActive(n.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                                isActive
                                  ? isDanger
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-secondary text-foreground font-medium"
                                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                              )}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="flex-1 text-left">{n.label}</span>
                              {isActive && <ChevronRight className="w-4 h-4" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <main>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="px-1">
                    <h2 className="text-xl font-semibold">{activeItem.label}</h2>
                    <p className="text-sm text-muted-foreground">{activeItem.description}</p>
                  </div>

                  {active === "account" && (
                    <div className="bg-background rounded-2xl border border-border p-6 space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3 min-w-0">
                          {isEmailVerified ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{user.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {isEmailVerified
                                ? `Verified on ${new Date(user.email_confirmed_at!).toLocaleDateString()}`
                                : "Email not verified"}
                            </p>
                          </div>
                        </div>
                        {!isEmailVerified && (
                          <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={resendingVerification}>
                            {resendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            <span className="ml-2">Resend</span>
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">Account ID</p>
                          <p className="font-mono text-xs truncate">{user.id.slice(0, 8)}…</p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">Created</p>
                          <p>{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">Last Sign In</p>
                          <p className="text-xs">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {active === "email" && (
                    <div className="bg-background rounded-2xl border border-border p-6">
                      <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">New Email Address</label>
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="newemail@example.com"
                            className="h-12"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          A confirmation email will be sent to both your current and new addresses.
                        </p>
                        <Button type="submit" variant="gradient" disabled={updatingEmail || !newEmail}>
                          {updatingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Sending…
                            </>
                          ) : (
                            "Update Email"
                          )}
                        </Button>
                      </form>
                    </div>
                  )}

                  {active === "password" && (
                    <div className="bg-background rounded-2xl border border-border p-6">
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Current Password</label>
                          <div className="relative">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              className="h-12 pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">New Password</label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="h-12 pr-12"
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12"
                            minLength={6}
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="gradient"
                          disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                        >
                          {updatingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Updating…
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </form>
                    </div>
                  )}

                  {active === "orders" && <EcommerceSettings userId={user.id} section="orders" />}
                  {active === "wallet" && <EcommerceSettings userId={user.id} section="wallet" />}
                  {active === "addresses" && <EcommerceSettings userId={user.id} section="addresses" />}
                  {active === "payments" && <EcommerceSettings userId={user.id} section="payments" />}

                  {active === "danger" && <DeleteAccountSection userId={user.id} navigate={navigate} />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DeleteAccountSection({ userId, navigate }: { userId: string; navigate: (path: string) => void }) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setDeleting(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (profileData) {
        await supabase.from("link_clicks").delete().eq("profile_id", profileData.id);
        await supabase.from("profile_views").delete().eq("profile_id", profileData.id);
        await supabase.from("email_subscribers").delete().eq("profile_id", profileData.id);
      }
      await supabase.from("links").delete().eq("user_id", userId);
      await supabase.from("link_groups").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);
      await supabase.auth.signOut();
      toast.success("Your account data has been deleted.");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setDeleting(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="bg-background rounded-2xl border border-destructive/30 p-6">
      <p className="text-sm text-muted-foreground mb-4">
        Once you delete your account, there is no going back. All your data including your profile, links, analytics, and
        subscribers will be permanently deleted.
      </p>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <span className="block">
                This action cannot be undone. This will permanently delete your account and remove all associated data from
                our servers.
              </span>
              <span className="block space-y-2">
                <span className="block font-medium text-foreground">
                  Type <span className="font-mono bg-secondary px-2 py-1 rounded">DELETE</span> to confirm:
                </span>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="font-mono"
                />
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmation !== "DELETE" || deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                "Delete my account"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
