import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DesignCustomization, designTemplates, NFCProduct, patternOptions, borderOptions, iconOptions, SideCustomization } from "./types";
import { Upload, Link, Palette, Image, ExternalLink, User, RotateCw, QrCode, Grid3X3, Square, Sparkles, FileUp, Settings2, Info, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LivePreview } from "./LivePreview";

interface DesignCustomizerProps {
  product: NFCProduct;
  customization: DesignCustomization;
  onChange: (customization: DesignCustomization) => void;
}

export function DesignCustomizer({ product, customization, onChange }: DesignCustomizerProps) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Array<{ id: string; username: string; title: string | null }>>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [canvaUrl, setCanvaUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const supportsTwoSides = product.category === 'card' || product.category === 'keychain';
  const activeSide = customization.activeSide;
  const currentSide = customization[activeSide];

  const updateSide = (field: keyof SideCustomization, value: any) => {
    onChange({
      ...customization,
      [activeSide]: { ...currentSide, [field]: value },
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = designTemplates.find((t) => t.id === templateId);
    if (template) {
      onChange({
        ...customization,
        templateId,
        [activeSide]: {
          ...currentSide,
          backgroundColor: template.colors.bg,
          textColor: template.colors.text,
          accentColor: template.colors.accent,
        },
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'customArtworkUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    updateSide(field, objectUrl);
    toast({ title: "Image uploaded", description: "Your image has been added to the design." });
  };

  const handleCanvaImport = () => {
    if (!canvaUrl) {
      toast({ title: "Enter Canva URL", description: "Please paste your Canva design share link.", variant: "destructive" });
      return;
    }
    onChange({ ...customization, canvaDesignUrl: canvaUrl });
    toast({ title: "Canva design imported", description: "Your Canva design has been linked." });
  };

  const loadUserProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('id, username, title').eq('user_id', user.id);
        if (data) setProfiles(data);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleLinkProfile = (profileId: string, username: string) => {
    onChange({ ...customization, linkedProfileId: profileId, linkedProfileUsername: username });
    toast({ title: "Profile linked", description: `Linked to @${username}` });
  };

  const isFullCustomization = product.id === 'smartcard-nfc-card' || product.id === 'smartcard-review-card';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Design Customization</h2>
          <p className="text-sm text-muted-foreground">Pick a ready-made layout to edit or upload your custom design</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2 rounded-full px-4"
        >
          {showPreview ? <RotateCw className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{showPreview ? "Back to Edit" : "Preview Design"}</span>
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showPreview ? (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LivePreview product={product} customization={customization} />
          </motion.div>
        ) : (
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex bg-muted/20 p-1 rounded-2xl border border-border/40">
              <button
                type="button"
                onClick={() => onChange({ ...customization, inputMethod: 'template' })}
                className={`flex-1 py-3.5 rounded-[14px] font-bold transition-all ${customization.inputMethod === 'template' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                Smart Templates
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...customization, inputMethod: 'upload' })}
                className={`flex-1 py-3.5 rounded-[14px] font-bold transition-all ${customization.inputMethod === 'upload' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                Custom Upload
              </button>
            </div>

            <AnimatePresence mode="wait">
              {customization.inputMethod === 'upload' ? (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 p-5 bg-card rounded-2xl border border-border">
                  <Label>Upload Complete Design</Label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                    <FileUp className="w-10 h-10 text-primary mb-2" />
                    <span className="text-sm font-medium">Select Design File</span>
                    <input
                      type="file"
                      accept=".pdf,.ai,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange({ ...customization, printReadyFileUrl: URL.createObjectURL(file) });
                          toast({ title: "Design Uploaded" });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </motion.div>
              ) : (
                <motion.div key="templates-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
                  </div>

                  {supportsTwoSides && (
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                      <Label>Double Sided Design</Label>
                      <Switch checked={customization.isDoubleSided} onCheckedChange={(val) => onChange({ ...customization, isDoubleSided: val })} />
                    </div>
                  )}

                  {customization.isDoubleSided && (
                    <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
                      <button type="button" onClick={() => onChange({ ...customization, activeSide: 'front' })} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeSide === 'front' ? 'bg-muted-foreground/20' : 'text-muted-foreground'}`}>Front Side</button>
                      <button type="button" onClick={() => onChange({ ...customization, activeSide: 'back' })} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeSide === 'back' ? 'bg-muted-foreground/20' : 'text-muted-foreground'}`}>Back Side</button>
                    </div>
                  )}

                  <Tabs defaultValue={isFullCustomization ? "text" : "link"} className="w-full">
                    <TabsList className={`grid w-full h-12 bg-muted/30 p-1 ${isFullCustomization ? 'grid-cols-6' : 'grid-cols-2'}`}>
                      {isFullCustomization && (
                        <>
                          <TabsTrigger value="text"><User className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="templates"><Palette className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="colors"><Sparkles className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="elements"><Grid3X3 className="w-4 h-4" /></TabsTrigger>
                        </>
                      )}
                      <TabsTrigger value="upload"><Upload className="w-4 h-4" /></TabsTrigger>
                      <TabsTrigger value="link"><Link className="w-4 h-4" /></TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-4 mt-4">
                      <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                        <Label>Full Name</Label>
                        <Input value={currentSide.name} onChange={(e) => updateSide('name', e.target.value)} placeholder="John Doe" />
                        <Label>Job Title</Label>
                        <Input value={currentSide.title} onChange={(e) => updateSide('title', e.target.value)} placeholder="Software Engineer" />
                      </div>
                    </TabsContent>

                    <TabsContent value="templates" className="grid grid-cols-2 gap-3 mt-4">
                      {designTemplates
                        .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template.id)}
                            className={`group relative aspect-[1.58/1] overflow-hidden rounded-xl border-2 transition-all ${customization.templateId === template.id ? "border-primary" : "border-transparent"}`}
                          >
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundColor: template.colors.bg }} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-[10px] font-bold">Use Template</span>
                            </div>
                          </button>
                        ))}
                    </TabsContent>

                    <TabsContent value="colors" className="grid grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Background</Label>
                        <Input type="color" value={currentSide.backgroundColor} onChange={(e) => updateSide("backgroundColor", e.target.value)} className="h-10 p-1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Text</Label>
                        <Input type="color" value={currentSide.textColor} onChange={(e) => updateSide("textColor", e.target.value)} className="h-10 p-1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Accent</Label>
                        <Input type="color" value={currentSide.accentColor} onChange={(e) => updateSide("accentColor", e.target.value)} className="h-10 p-1" />
                      </div>
                    </TabsContent>

                    <TabsContent value="elements" className="space-y-6 mt-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div className="flex items-center gap-3">
                          <QrCode className="w-5 h-5 text-primary" />
                          <Label>Show QR Code</Label>
                        </div>
                        <Switch checked={currentSide.showQRCode} onCheckedChange={(checked) => updateSide("showQRCode", checked)} />
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Upload Logo</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                        {currentSide.logoUrl && <p className="text-xs text-green-600">✓ Logo uploaded</p>}
                      </div>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4 mt-4">
                      <Label>Connect SmartCard Profile</Label>
                      {customization.linkedProfileUsername ? (
                        <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                          <span className="font-semibold">@{customization.linkedProfileUsername}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleLinkProfile('', '')}>Change</Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Button className="w-full" variant="outline" onClick={loadUserProfiles} disabled={loadingProfiles}>
                            {loadingProfiles ? "Loading..." : "Find My Profiles"}
                          </Button>
                          {profiles.length > 0 && (
                            <div className="grid gap-2">
                              {profiles.map(p => (
                                <button key={p.id} onClick={() => handleLinkProfile(p.id, p.username)} className="p-3 rounded-lg border text-left hover:border-primary">
                                  @{p.username}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
