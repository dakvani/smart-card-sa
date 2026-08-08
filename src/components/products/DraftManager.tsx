import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DesignCustomization, NFCProduct, nfcProducts, defaultCustomization } from "./types";
import { Save, FolderOpen, Trash2, Edit, Plus } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Json } from "@/integrations/supabase/types";

// Support both old and new customization formats for backward compatibility
interface DraftCustomization {
  front?: { backgroundColor?: string };
  backgroundColor?: string;
  [key: string]: any;
}

interface Draft {
  id: string;
  product_id: string;
  product_name: string;
  customization: DraftCustomization;
  name: string | null;
  created_at: string;
  updated_at: string;
}

interface DraftManagerProps {
  currentProduct: NFCProduct | null;
  currentCustomization: DesignCustomization;
  onLoadDraft: (product: NFCProduct, customization: DesignCustomization) => void;
  userId: string | null;
}

export function DraftManager({
  currentProduct,
  currentCustomization,
  onLoadDraft,
  userId,
}: DraftManagerProps) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadDrafts();
    }
  }, [userId]);

  const loadDrafts = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nfc_product_drafts")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      const parsedDrafts = (data || []).map(draft => ({
        ...draft,
        customization: (typeof draft.customization === 'string' 
          ? JSON.parse(draft.customization) 
          : draft.customization) as unknown as DesignCustomization,
      }));
      
      setDrafts(parsedDrafts);
    } catch (error) {
      console.error("Error loading drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!userId || !currentProduct) {
      toast({
        title: "Cannot save draft",
        description: "Please select a product and log in to save drafts.",
        variant: "destructive",
      });
      return;
    }

    try {
      const draftData = {
        user_id: userId,
        product_id: currentProduct.id,
        product_name: currentProduct.name,
        customization: currentCustomization as unknown as Json,
        name: draftName || `${currentProduct.name} - ${format(new Date(), "MMM d, yyyy")}`,
      };

      if (editingDraftId) {
        const { error } = await supabase
          .from("nfc_product_drafts")
          .update(draftData)
          .eq("id", editingDraftId);

        if (error) throw error;
        
        toast({
          title: "Draft updated",
          description: "Your design has been updated.",
        });
      } else {
        const { error } = await supabase
          .from("nfc_product_drafts")
          .insert(draftData);

        if (error) throw error;
        
        toast({
          title: "Draft saved",
          description: "Your design has been saved for later.",
        });
      }

      setSaveDialogOpen(false);
      setDraftName("");
      setEditingDraftId(null);
      loadDrafts();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert old draft format to new format
  const migrateCustomization = (custom: DraftCustomization): DesignCustomization => {
    if (custom.front) {
      return custom as unknown as DesignCustomization;
    }
    // Old format - migrate to new
    return {
      front: {
        backgroundColor: custom.backgroundColor || '#1a1a2e',
        textColor: custom.textColor || '#ffffff',
        accentColor: custom.accentColor || '#6366f1',
        name: custom.name || '',
        title: custom.title || '',
        logoUrl: custom.logoUrl || null,
        customArtworkUrl: custom.customArtworkUrl || null,
        pattern: 'none',
        borderStyle: 'none',
        icon: null,
        showQRCode: false,
      },
      back: { ...defaultCustomization.back },
      activeSide: 'front',
      canvaDesignUrl: custom.canvaDesignUrl || null,
      templateId: custom.templateId || null,
      linkedProfileId: custom.linkedProfileId || null,
      linkedProfileUsername: custom.linkedProfileUsername || null,
      inputMethod: custom.inputMethod || 'template',
      industry: custom.industry || null,
      isDoubleSided: custom.isDoubleSided || false,
      printReadyFileUrl: custom.printReadyFileUrl || null,
      designMetadata: custom.designMetadata || null,
    };
  };

  const handleLoadDraft = (draft: Draft) => {
    const product = nfcProducts.find((p) => p.id === draft.product_id);
    if (product) {
      onLoadDraft(product, migrateCustomization(draft.customization));
      setLoadDialogOpen(false);
      toast({
        title: "Draft loaded",
        description: `Loaded "${draft.name || 'Untitled Draft'}"`,
      });
    }
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraftId(draft.id);
    setDraftName(draft.name || "");
    
    const product = nfcProducts.find((p) => p.id === draft.product_id);
    if (product) {
      onLoadDraft(product, migrateCustomization(draft.customization));
    }
    
    setLoadDialogOpen(false);
    setSaveDialogOpen(true);
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from("nfc_product_drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;
      
      setDrafts(drafts.filter((d) => d.id !== draftId));
      toast({
        title: "Draft deleted",
        description: "Your draft has been removed.",
      });
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast({
        title: "Error",
        description: "Failed to delete draft.",
        variant: "destructive",
      });
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {/* Save Draft Button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!currentProduct}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDraftId ? "Update Draft" : "Save Draft"}</DialogTitle>
            <DialogDescription>
              Save your current design to continue later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="draftName">Draft Name</Label>
              <Input
                id="draftName"
                placeholder="My awesome design..."
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setSaveDialogOpen(false);
                setEditingDraftId(null);
                setDraftName("");
              }}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleSaveDraft}>
                {editingDraftId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Draft Button */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Draft
            {drafts.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {drafts.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Your Saved Drafts</DialogTitle>
            <DialogDescription>
              Load a previously saved design to continue editing.
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No saved drafts yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start designing and save your work!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {drafts.map((draft) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-xl"
                      style={{ backgroundColor: draft.customization.front?.backgroundColor || draft.customization.backgroundColor || '#1a1a2e' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {draft.name || "Untitled Draft"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {draft.product_name} • {format(new Date(draft.updated_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleLoadDraft(draft)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditDraft(draft)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDraft(draft.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
