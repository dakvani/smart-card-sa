import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/hooks/use-audit-log";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  User,
  Crown,
  RefreshCw,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles {
  id: string;
  user_id: string;
  username: string;
  title: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  plan: string;
}

const PLAN_OPTIONS = ["free", "starter", "pro"] as const;
const planColors: Record<string, string> = {
  free: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  starter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pro: "bg-primary/15 text-primary border-primary/30",
};

const roleIcons: Record<AppRole, React.ElementType> = {
  admin: Crown,
  moderator: ShieldCheck,
  user: User,
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  moderator: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const PAGE_SIZE = 25;

export function AdminUserManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addRoleDialog, setAddRoleDialog] = useState<{ userId: string; username: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [removeRoleConfirm, setRemoveRoleConfirm] = useState<{ userId: string; role: AppRole; username: string } | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRoleDialog, setBulkRoleDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState<AppRole>("user");

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get paginated profiles (now also fetches plan)
      const { data: profiles, error: profilesError, count } = await supabase
        .from("profiles")
        .select("id, user_id, username, title, avatar_url, created_at, plan", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      if (profilesError) throw profilesError;

      // Get all roles for these users
      const userIds = (profiles || []).map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile: any) => ({
        ...profile,
        plan: profile.plan || "free",
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!addRoleDialog) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: addRoleDialog.userId,
          role: selectedRole,
        });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Role exists", description: "This user already has this role.", variant: "destructive" });
          return;
        }
        throw error;
      }

      await logAdminAction({
        action: "CREATE",
        tableName: "user_roles",
        recordId: addRoleDialog.userId,
        newValues: { user_id: addRoleDialog.userId, role: selectedRole },
      });

      setUsers(users.map(user =>
        user.user_id === addRoleDialog.userId
          ? { ...user, roles: [...user.roles, selectedRole] }
          : user
      ));

      toast({ title: "Role added", description: `${selectedRole} role added to ${addRoleDialog.username}.` });
      setAddRoleDialog(null);
    } catch (error) {
      console.error("Error adding role:", error);
      toast({ title: "Error", description: "Failed to add role.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!removeRoleConfirm) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", removeRoleConfirm.userId)
        .eq("role", removeRoleConfirm.role);

      if (error) throw error;

      await logAdminAction({
        action: "DELETE",
        tableName: "user_roles",
        recordId: removeRoleConfirm.userId,
        oldValues: { user_id: removeRoleConfirm.userId, role: removeRoleConfirm.role },
      });

      setUsers(users.map(user =>
        user.user_id === removeRoleConfirm.userId
          ? { ...user, roles: user.roles.filter(r => r !== removeRoleConfirm.role) }
          : user
      ));

      toast({ title: "Role removed", description: `${removeRoleConfirm.role} role removed from ${removeRoleConfirm.username}.` });
      setRemoveRoleConfirm(null);
    } catch (error) {
      console.error("Error removing role:", error);
      toast({ title: "Error", description: "Failed to remove role.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAddRole = async () => {
    if (selectedIds.size === 0) return;

    setSaving(true);
    try {
      const userIds = Array.from(selectedIds);
      const inserts = userIds.map(userId => ({
        user_id: userId,
        role: bulkRole,
      }));

      const { error } = await supabase
        .from("user_roles")
        .upsert(inserts, { onConflict: "user_id,role" });

      if (error) throw error;

      await logAdminAction({
        action: "BULK_UPDATE",
        tableName: "user_roles",
        recordId: userIds.join(","),
        newValues: { role: bulkRole, user_count: userIds.length },
      });

      // Reload to get fresh data
      await loadUsers();
      setSelectedIds(new Set());
      toast({ title: "Roles updated", description: `${bulkRole} role added to ${userIds.length} users.` });
      setBulkRoleDialog(false);
    } catch (error) {
      console.error("Error bulk adding roles:", error);
      toast({ title: "Error", description: "Failed to add roles.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.user_id)));
    }
  };

  const toggleSelectRow = (userId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button onClick={() => setBulkRoleDialog(true)} className="gap-1">
                <Plus className="w-4 h-4" />
                Bulk Add Role ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`border rounded-lg p-4 bg-card ${selectedIds.has(user.user_id) ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Checkbox
                      checked={selectedIds.has(user.user_id)}
                      onCheckedChange={() => toggleSelectRow(user.user_id)}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {user.roles.length === 0 ? (
                      <Badge variant="outline" className="text-muted-foreground">No roles</Badge>
                    ) : (
                      user.roles.map(role => {
                        const Icon = roleIcons[role];
                        return (
                          <Badge
                            key={role}
                            variant="outline"
                            className={`${roleColors[role]} cursor-pointer hover:opacity-80`}
                            onClick={() => setRemoveRoleConfirm({ userId: user.user_id, role, username: user.username })}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {role}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddRoleDialog({ userId: user.user_id, username: user.username })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Role
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === users.length && users.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`border-b ${selectedIds.has(user.user_id) ? "bg-primary/5" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(user.user_id)}
                            onCheckedChange={() => toggleSelectRow(user.user_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{user.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-muted-foreground">No roles</Badge>
                            ) : (
                              user.roles.map(role => {
                                const Icon = roleIcons[role];
                                return (
                                  <Badge
                                    key={role}
                                    variant="outline"
                                    className={`${roleColors[role]} cursor-pointer hover:opacity-80`}
                                    onClick={() => setRemoveRoleConfirm({ userId: user.user_id, role, username: user.username })}
                                  >
                                    <Icon className="w-3 h-3 mr-1" />
                                    {role}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddRoleDialog({ userId: user.user_id, username: user.username })}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Role
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} users
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages || 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Add Role Dialog */}
      <Dialog open={!!addRoleDialog} onOpenChange={() => setAddRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Add a role to {addRoleDialog?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Moderator
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialog(null)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Role Dialog */}
      <Dialog open={bulkRoleDialog} onOpenChange={setBulkRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role to {selectedIds.size} Users</DialogTitle>
            <DialogDescription>
              This will add the selected role to all selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Moderator
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkAddRole} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Role to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Confirmation */}
      <AlertDialog open={!!removeRoleConfirm} onOpenChange={() => setRemoveRoleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the {removeRoleConfirm?.role} role from {removeRoleConfirm?.username}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
