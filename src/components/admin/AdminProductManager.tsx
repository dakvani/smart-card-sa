import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Upload, Package, RefreshCw, Image as ImageIcon } from "lucide-react";
import { formatSAR } from "@/lib/currency";

interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  photo_url: string | null;
  gradient: string;
  stock_quantity: number;
  is_active: boolean;
  position: number;
}

const CATEGORIES = ["card", "sticker", "band", "keychain", "review"];
const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-teal-500 to-cyan-600",
  "from-orange-500 to-amber-600",
  "from-green-500 to-emerald-600",
  "from-pink-500 to-rose-600",
];

const emptyProduct: Omit<CatalogProduct, "id"> = {
  slug: "",
  name: "",
  description: "",
  category: "card",
  base_price: 0,
  photo_url: null,
  gradient: "from-violet-500 to-purple-600",
  stock_quantity: 0,
  is_active: true,
  position: 0,
};

export function AdminProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [form, setForm] = useState<Omit<CatalogProduct, "id">>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("nfc_catalog_products")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProducts((data || []) as CatalogProduct[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyProduct, position: products.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (p: CatalogProduct) => {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-photos")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-photos").getPublicUrl(path);
      setForm((f) => ({ ...f, photo_url: pub.publicUrl }));
      toast({ title: "Photo uploaded" });
    } catch (e) {
      const err = e as Error;
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.slug || !form.name) {
      toast({ title: "Missing fields", description: "Slug and name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("nfc_catalog_products")
          .update(form)
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Product updated" });
      } else {
        const { error } = await supabase
          .from("nfc_catalog_products")
          .insert(form);
        if (error) throw error;
        toast({ title: "Product created" });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      const err = e as Error;
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("nfc_catalog_products").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      await load();
    }
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Catalog
            </CardTitle>
            <CardDescription>{products.length} products • Manage items, photos, prices, and stock</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products yet. Click "New Product" to add one.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className={`w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br ${p.gradient} flex items-center justify-center shrink-0`}>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-primary-foreground/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{p.name}</p>
                    <Badge variant="outline" className="text-xs capitalize">{p.category}</Badge>
                    {!p.is_active && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.slug} • Stock: {p.stock_quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatSAR(Number(p.base_price))}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
            <DialogDescription>All fields are editable. Photo, price, stock, and visibility update the storefront instantly.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Photo */}
            <div>
              <Label>Photograph</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className={`w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br ${form.gradient} flex items-center justify-center shrink-0`}>
                  {form.photo_url ? (
                    <img src={form.photo_url} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-primary-foreground/70" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="product-photo"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  />
                  <Button asChild variant="outline" size="sm" disabled={uploading}>
                    <label htmlFor="product-photo" className="cursor-pointer">
                      {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {form.photo_url ? "Replace photo" : "Upload photo"}
                    </label>
                  </Button>
                  {form.photo_url && (
                    <Button variant="ghost" size="sm" className="ml-2 text-destructive" onClick={() => setForm({ ...form, photo_url: null })}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1" placeholder="smartcard-nfc-card" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gradient (fallback)</Label>
                <Select value={form.gradient} onValueChange={(v) => setForm({ ...form, gradient: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADIENTS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (USD)</Label>
                <Input type="number" step="0.01" min="0" value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Stock qty</Label>
                <Input type="number" min="0" value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Position</Label>
                <Input type="number" value={form.position}
                  onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Visible on storefront</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. It will be removed from the storefront immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
