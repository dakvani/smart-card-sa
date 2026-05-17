import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/hooks/use-audit-log";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  Plus,
  Pencil,
  Save,
  X,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { exportToCSV } from "@/lib/csv-export";

type TableName = "profiles" | "nfc_orders" | "product_reviews" | "product_wishlist" | 
                 "profile_views" | "email_subscribers" | "links" | "link_groups" | 
                 "link_clicks" | "profile_templates" | "user_roles" | "user_theme_presets" | "nfc_product_drafts";

interface TableInfo {
  name: TableName;
  label: string;
  description: string;
  canDelete: boolean;
  canCreate: boolean;
  canEdit: boolean;
  editableFields: string[];
}

const TABLES: TableInfo[] = [
  { name: "profiles", label: "Profiles", description: "User profile data", canDelete: false, canCreate: false, canEdit: true, editableFields: ["username", "title", "bio", "theme_name", "theme_gradient"] },
  { name: "nfc_orders", label: "NFC Orders", description: "Product orders", canDelete: true, canCreate: false, canEdit: true, editableFields: ["status"] },
  { name: "product_reviews", label: "Product Reviews", description: "User reviews", canDelete: true, canCreate: false, canEdit: true, editableFields: ["title", "content", "rating"] },
  { name: "product_wishlist", label: "Wishlist", description: "Saved products", canDelete: true, canCreate: false, canEdit: false, editableFields: [] },
  { name: "profile_views", label: "Profile Views", description: "View analytics", canDelete: true, canCreate: false, canEdit: false, editableFields: [] },
  { name: "email_subscribers", label: "Email Subscribers", description: "Newsletter signups", canDelete: true, canCreate: true, canEdit: true, editableFields: ["email"] },
  { name: "links", label: "Links", description: "User links", canDelete: true, canCreate: true, canEdit: true, editableFields: ["title", "url", "visible", "position", "is_featured"] },
  { name: "link_groups", label: "Link Groups", description: "Link categories", canDelete: true, canCreate: true, canEdit: true, editableFields: ["name", "position", "is_collapsed"] },
  { name: "link_clicks", label: "Link Clicks", description: "Click analytics", canDelete: true, canCreate: false, canEdit: false, editableFields: [] },
  { name: "profile_templates", label: "Templates", description: "Profile templates", canDelete: false, canCreate: true, canEdit: true, editableFields: ["name", "theme_name", "theme_gradient", "category", "description", "is_premium"] },
  { name: "user_roles", label: "User Roles", description: "Role assignments", canDelete: true, canCreate: true, canEdit: true, editableFields: ["role"] },
  { name: "user_theme_presets", label: "Theme Presets", description: "Custom themes", canDelete: true, canCreate: false, canEdit: true, editableFields: ["name", "theme_name", "theme_gradient"] },
  { name: "nfc_product_drafts", label: "Product Drafts", description: "Design drafts", canDelete: true, canCreate: false, canEdit: true, editableFields: ["name", "product_name"] },
];

interface FieldConfig {
  name: string;
  type: "text" | "textarea" | "number" | "boolean" | "select";
  label: string;
  options?: string[];
  required?: boolean;
}

const getFieldConfigs = (tableName: TableName): FieldConfig[] => {
  switch (tableName) {
    case "profiles":
      return [
        { name: "username", type: "text", label: "Username", required: true },
        { name: "title", type: "text", label: "Title" },
        { name: "bio", type: "textarea", label: "Bio" },
        { name: "theme_name", type: "text", label: "Theme Name" },
        { name: "theme_gradient", type: "text", label: "Theme Gradient" },
      ];
    case "nfc_orders":
      return [
        { name: "status", type: "select", label: "Status", options: ["pending", "processing", "shipped", "delivered", "cancelled"], required: true },
      ];
    case "product_reviews":
      return [
        { name: "title", type: "text", label: "Title" },
        { name: "content", type: "textarea", label: "Content" },
        { name: "rating", type: "number", label: "Rating (1-5)", required: true },
      ];
    case "email_subscribers":
      return [
        { name: "email", type: "text", label: "Email", required: true },
        { name: "profile_id", type: "text", label: "Profile ID", required: true },
      ];
    case "links":
      return [
        { name: "title", type: "text", label: "Title", required: true },
        { name: "url", type: "text", label: "URL" },
        { name: "visible", type: "boolean", label: "Visible" },
        { name: "position", type: "number", label: "Position" },
        { name: "is_featured", type: "boolean", label: "Featured" },
        { name: "user_id", type: "text", label: "User ID", required: true },
      ];
    case "link_groups":
      return [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "position", type: "number", label: "Position" },
        { name: "is_collapsed", type: "boolean", label: "Collapsed" },
        { name: "user_id", type: "text", label: "User ID", required: true },
      ];
    case "profile_templates":
      return [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "theme_name", type: "text", label: "Theme Name", required: true },
        { name: "theme_gradient", type: "text", label: "Theme Gradient", required: true },
        { name: "category", type: "select", label: "Category", options: ["minimal", "creative", "professional", "vibrant"], required: true },
        { name: "description", type: "textarea", label: "Description" },
        { name: "is_premium", type: "boolean", label: "Premium" },
      ];
    case "user_roles":
      return [
        { name: "user_id", type: "text", label: "User ID", required: true },
        { name: "role", type: "select", label: "Role", options: ["admin", "moderator", "user"], required: true },
      ];
    default:
      return [];
  }
};

const PAGE_SIZE = 25;

export function AdminTableViewer() {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<TableName>("profiles");
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ table: TableName; id: string } | null>(null);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    loadTableData();
  }, [selectedTable]);

  useEffect(() => {
    loadTableData();
  }, [currentPage, sortColumn, sortDirection]);

  const loadTableData = async () => {
    setLoading(true);
    try {
      let query = supabase.from(selectedTable).select("*", { count: "exact" });
      
      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === "asc" });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: result, error, count } = await query
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      if (error) throw error;
      setData(result || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading table data:", error);
      toast({
        title: "Error",
        description: `Failed to load data from ${selectedTable}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const recordToDelete = data.find(row => row.id === deleteConfirm.id);
      
      const { error } = await supabase
        .from(deleteConfirm.table)
        .delete()
        .eq("id", deleteConfirm.id);

      if (error) throw error;

      await logAdminAction({
        action: "DELETE",
        tableName: deleteConfirm.table,
        recordId: deleteConfirm.id,
        oldValues: recordToDelete as Record<string, unknown>,
      });

      setData(data.filter(row => row.id !== deleteConfirm.id));
      setTotalCount(prev => prev - 1);
      toast({ title: "Deleted", description: "Record deleted successfully." });
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      const idsToDelete = Array.from(selectedIds);
      const recordsToDelete = data.filter(row => selectedIds.has(String(row.id)));
      
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      await logAdminAction({
        action: "BULK_DELETE",
        tableName: selectedTable,
        recordId: idsToDelete.join(","),
        oldValues: { deleted_records: recordsToDelete },
      });

      setData(data.filter(row => !selectedIds.has(String(row.id))));
      setTotalCount(prev => prev - selectedIds.size);
      setSelectedIds(new Set());
      toast({ title: "Deleted", description: `${idsToDelete.length} records deleted successfully.` });
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast({ title: "Error", description: "Failed to delete records.", variant: "destructive" });
    } finally {
      setBulkDeleteConfirm(false);
    }
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingRow(row);
    const tableInfo = TABLES.find(t => t.name === selectedTable);
    const initialFormData: Record<string, unknown> = {};
    tableInfo?.editableFields.forEach(field => {
      initialFormData[field] = row[field];
    });
    setFormData(initialFormData);
  };

  const handleCreate = () => {
    setFormData({});
    setCreateDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    setSaving(true);

    try {
      const { error } = await (supabase
        .from(selectedTable) as any)
        .update(formData)
        .eq("id", editingRow.id as string);

      if (error) throw error;

      await logAdminAction({
        action: "UPDATE",
        tableName: selectedTable,
        recordId: String(editingRow.id),
        oldValues: editingRow,
        newValues: formData,
      });

      setData(data.map(row => 
        row.id === editingRow.id ? { ...row, ...formData } : row
      ));
      toast({ title: "Updated", description: "Record updated successfully." });
      setEditingRow(null);
      setFormData({});
    } catch (error) {
      console.error("Error updating record:", error);
      toast({ title: "Error", description: "Failed to update record.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCreate = async () => {
    setSaving(true);

    try {
      const { data: newRecord, error } = await supabase
        .from(selectedTable)
        .insert(formData as never)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        action: "CREATE",
        tableName: selectedTable,
        recordId: String((newRecord as Record<string, unknown>).id),
        newValues: newRecord as Record<string, unknown>,
      });

      setData([newRecord as Record<string, unknown>, ...data]);
      setTotalCount(prev => prev + 1);
      toast({ title: "Created", description: "Record created successfully." });
      setCreateDialogOpen(false);
      setFormData({});
    } catch (error) {
      console.error("Error creating record:", error);
      toast({ title: "Error", description: "Failed to create record.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(row => String(row.id))));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportCSV = async () => {
    try {
      // Fetch all data for export (not just current page)
      const { data: allData, error } = await supabase
        .from(selectedTable)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const timestamp = new Date().toISOString().split('T')[0];
      exportToCSV(allData || [], `${selectedTable}_${timestamp}`);
      
      toast({
        title: "Export Complete",
        description: `Exported ${allData?.length || 0} records to CSV`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data to CSV",
        variant: "destructive",
      });
    }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const currentTableInfo = TABLES.find(t => t.name === selectedTable);
  const fieldConfigs = getFieldConfigs(selectedTable);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value).substring(0, 50) + "...";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const strValue = String(value);
    return strValue.length > 50 ? strValue.substring(0, 50) + "..." : strValue;
  };

  const renderFormField = (config: FieldConfig, isCreate: boolean = false) => {
    const value = formData[config.name];
    const onChange = (newValue: unknown) => {
      setFormData(prev => ({ ...prev, [config.name]: newValue }));
    };

    if (!isCreate && !currentTableInfo?.editableFields.includes(config.name)) {
      return null;
    }

    switch (config.type) {
      case "textarea":
        return (
          <div key={config.name} className="space-y-2">
            <Label htmlFor={config.name}>{config.label}</Label>
            <Textarea
              id={config.name}
              value={String(value || "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder={config.label}
            />
          </div>
        );
      case "number":
        return (
          <div key={config.name} className="space-y-2">
            <Label htmlFor={config.name}>{config.label}</Label>
            <Input
              id={config.name}
              type="number"
              value={String(value || "")}
              onChange={(e) => onChange(parseInt(e.target.value) || 0)}
              placeholder={config.label}
            />
          </div>
        );
      case "boolean":
        return (
          <div key={config.name} className="flex items-center justify-between">
            <Label htmlFor={config.name}>{config.label}</Label>
            <Switch
              id={config.name}
              checked={Boolean(value)}
              onCheckedChange={onChange}
            />
          </div>
        );
      case "select":
        return (
          <div key={config.name} className="space-y-2">
            <Label htmlFor={config.name}>{config.label}</Label>
            <Select value={String(value || "")} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${config.label}`} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return (
          <div key={config.name} className="space-y-2">
            <Label htmlFor={config.name}>{config.label}</Label>
            <Input
              id={config.name}
              value={String(value || "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder={config.label}
            />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>View and manage database records</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedTable} onValueChange={(v) => setSelectedTable(v as TableName)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map(table => (
                  <SelectItem key={table.name} value={table.name}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-wrap">
              {currentTableInfo?.canCreate && (
                <Button onClick={handleCreate} className="gap-1">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              )}
              {selectedIds.size > 0 && currentTableInfo?.canDelete && (
                <Button variant="destructive" onClick={() => setBulkDeleteConfirm(true)} className="gap-1">
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleExportCSV} disabled={loading || data.length === 0} title="Export to CSV">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={loadTableData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No records found
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {filteredData.map((row, index) => (
                <motion.div
                  key={String(row.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`border rounded-lg p-4 bg-card ${selectedIds.has(String(row.id)) ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {currentTableInfo?.canDelete && (
                      <Checkbox
                        checked={selectedIds.has(String(row.id))}
                        onCheckedChange={() => toggleSelectRow(String(row.id))}
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      {columns.slice(0, 4).map(column => (
                        <div key={column} className="flex justify-between items-start gap-2">
                          <span className="text-xs text-muted-foreground capitalize">
                            {column.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm font-mono text-right truncate max-w-[60%]">
                            {formatCellValue(row[column])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRow(row)} className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {currentTableInfo?.canEdit && currentTableInfo.editableFields.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => handleEdit(row)} className="flex-1">
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {currentTableInfo?.canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm({ table: selectedTable, id: String(row.id) })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {currentTableInfo?.canDelete && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.size === data.length && data.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
                      {columns.slice(0, 6).map(column => (
                        <TableHead
                          key={column}
                          className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                          onClick={() => handleSort(column)}
                        >
                          <div className="flex items-center gap-1">
                            {column.replace(/_/g, " ")}
                            {sortColumn === column && (
                              sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredData.map((row, index) => (
                        <motion.tr
                          key={String(row.id)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`border-b ${selectedIds.has(String(row.id)) ? "bg-primary/5" : ""}`}
                        >
                          {currentTableInfo?.canDelete && (
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(String(row.id))}
                                onCheckedChange={() => toggleSelectRow(String(row.id))}
                              />
                            </TableCell>
                          )}
                          {columns.slice(0, 6).map(column => (
                            <TableCell key={column} className="font-mono text-sm">
                              {formatCellValue(row[column])}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedRow(row)} title="View">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {currentTableInfo?.canEdit && currentTableInfo.editableFields.length > 0 && (
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              {currentTableInfo?.canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirm({ table: selectedTable, id: String(row.id) })}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
                </span>
                {currentTableInfo?.canEdit && <Badge variant="secondary">Editable</Badge>}
                {currentTableInfo?.canCreate && <Badge variant="secondary">Can Create</Badge>}
              </div>
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

      {/* View Record Dialog */}
      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>Full record data from {selectedTable}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(selectedRow, null, 2)}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRow(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => { setEditingRow(null); setFormData({}); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>Update the record in {selectedTable}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {fieldConfigs.filter(f => currentTableInfo?.editableFields.includes(f.name)).map(config => renderFormField(config, false))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditingRow(null); setFormData({}); }}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Record Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Record</DialogTitle>
            <DialogDescription>Add a new record to {selectedTable}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {fieldConfigs.map(config => renderFormField(config, true))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setFormData({}); }}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Record
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete {selectedIds.size} Records
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} records? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
