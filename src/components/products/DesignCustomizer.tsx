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

  const handleFlipSide = () => {
    onChange({
      ...customization,
      activeSide: activeSide === 'front' ? 'back' : 'front',
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
    
    toast({
      title: "Image uploaded",
      description: "Your image has been added to the design.",
    });
  };

  const handleCanvaImport = () => {
    if (!canvaUrl) {
      toast({
        title: "Enter Canva URL",
        description: "Please paste your Canva design share link.",
        variant: "destructive",
      });
      return;
    }
    
    onChange({ ...customization, canvaDesignUrl: canvaUrl });
    toast({
      title: "Canva design imported",
      description: "Your Canva design has been linked to this product.",
    });
  };

  const loadUserProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, title')
          .eq('user_id', user.id);
        
        if (profilesData) {
          setProfiles(profilesData);
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleLinkProfile = (profileId: string, username: string) => {
    onChange({
      ...customization,
      linkedProfileId: profileId,
      linkedProfileUsername: username,
    });
    toast({
      title: "Profile linked",
      description: `Your NFC product will link to @${username}`,
    });
  };

  const isFullCustomization = product.id === 'smartcard-nfc-card' || product.id === 'smartcard-review-card';
  const showEditor = true;

  return (
    <div className="space-y-6">
      {/* Header with Preview Toggle */}
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
          className="gap-2 bg-background/50 border-border/50 hover:bg-muted/40 transition-all active:scale-95 shadow-sm rounded-full px-4"
        >
          {showPreview ? <RotateCw className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{showPreview ? "Back to Edit" : "Preview Design"}</span>
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showPreview ? (
          <motion.div
            key="preview-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full"
          >
            <LivePreview product={product} customization={customization} />
          </motion.div>
        ) : (
          <motion.div
            key="editor-mode-custom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stage 1: Design Input Methods */}
            <div className="flex bg-muted/20 p-1 rounded-2xl border border-border/40 shadow-inner">
              <button
                type="button"
                onClick={() => onChange({ ...customization, inputMethod: 'template' })}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-[14px] font-bold transition-all duration-300 ${
                  customization.inputMethod === 'template'
                    ? 'bg-foreground text-background shadow-lg scale-[1.01]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Palette className="w-4 h-4" />
                <div className="text-left leading-tight">
                  <div className="text-xs">Smart Templates</div>
                  <div className="text-[9px] opacity-60 font-medium">Professional Layouts</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...customization, inputMethod: 'upload' })}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-[14px] font-bold transition-all duration-300 ${
                  customization.inputMethod === 'upload'
                    ? 'bg-foreground text-background shadow-lg scale-[1.01]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <FileUp className="w-4 h-4" />
                <div className="text-left leading-tight">
                  <div className="text-xs">Custom Upload</div>
                  <div className="text-[9px] opacity-60 font-medium">Ready-to-Print Files</div>
                </div>
              </button>
            </div>


            {showEditor && (
              <AnimatePresence mode="wait">
                {customization.inputMethod === 'upload' ? (
                  <motion.div
                    key="upload-flow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 p-5 bg-card rounded-2xl border border-border"
                  >
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Technical Specifications</span>
                  </div>
                  <ul className="text-[11px] space-y-1.5 text-muted-foreground list-disc pl-4 mb-4">
                    <li>Resolution: Minimum 300 DPI</li>
                    <li>Color Mode: CMYK preferred</li>
                    <li>Formats: PDF, AI, high-res PNG/JPG</li>
                    <li>Dimensions: 85.6mm x 54mm + 3mm bleed margin</li>
                  </ul>
                  
                  <Label>Upload Complete Design</Label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                    <div className="text-center p-4">
                      <FileUp className="w-10 h-10 mx-auto text-primary mb-2" />
                      <span className="text-sm font-medium block">Select Design File</span>
                      <span className="text-[10px] text-muted-foreground mt-1 block">PDF, AI, or High-Res Image</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.ai,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange({ 
                            ...customization, 
                            printReadyFileUrl: URL.createObjectURL(file),
                            designMetadata: {
                              dpi: 300,
                              colorMode: 'CMYK',
                              dimensions: '85.6x54mm',
                              bleed: '3mm'
                            }
                          });
                          toast({ title: "Design Uploaded", description: "Your print-ready file has been received." });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {customization.printReadyFileUrl && (
                    <Badge variant="secondary" className="w-full justify-center py-1">
                      ✓ File Received: Design will be routed to production
                    </Badge>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="template-flow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Stage 2: Template Refinement */}
                  {/* Stage 2: Template Selection with Filter/Search */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Grid3X3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search templates..." 
                          className="pl-10 h-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {['All', 'Real Estate', 'Tech', 'Creative', 'Healthcare', 'Corporate', 'Food'].map((ind) => (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => onChange({ ...customization, industry: ind === 'All' ? null : ind })}
                            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${
                              (!customization.industry && ind === 'All') || customization.industry === ind 
                                ? 'bg-foreground text-background shadow-md' 
                                : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50'
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>



                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-lg font-bold text-primary">Customization & Layout</h3>
                    {supportsTwoSides && (
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">Double Sided?</span>
                         <Switch 
                           checked={customization.isDoubleSided}
                           onCheckedChange={(val) => onChange({ ...customization, isDoubleSided: val })}
                         />
                      </div>
                    )}
                  </div>

                  {customization.isDoubleSided && (
                    <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
                      <button
                        type="button"
                        onClick={() => onChange({ ...customization, activeSide: 'front' })}
                        className={`flex-1 py-2 px-4 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                          activeSide === 'front'
                            ? 'bg-muted-foreground/20 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Front Side
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange({ ...customization, activeSide: 'back' })}
                        className={`flex-1 py-2 px-4 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                          activeSide === 'back'
                            ? 'bg-muted-foreground/20 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Back Side
                      </button>
                    </div>
                  )}


                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSide}
                      initial={{ opacity: 0, x: activeSide === 'front' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: activeSide === 'front' ? 20 : -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Tabs defaultValue={isFullCustomization ? "text" : "link"} className="w-full">
                        <TabsList className={`grid w-full h-12 bg-muted/30 p-1 ${isFullCustomization ? 'grid-cols-6' : 'grid-cols-3'}`}>
                          {isFullCustomization && (
                            <>
                              <TabsTrigger value="text" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                                <User className="w-4 h-4" />
                              </TabsTrigger>
                              <TabsTrigger value="templates" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                                <Palette className="w-4 h-4" />
                              </TabsTrigger>
                              <TabsTrigger value="colors" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                                <Sparkles className="w-4 h-4" />
                              </TabsTrigger>
                              <TabsTrigger value="elements" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                                <Grid3X3 className="w-4 h-4" />
                              </TabsTrigger>
                            </>
                          )}
                          <TabsTrigger value="upload" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                            <Upload className="w-4 h-4" />
                          </TabsTrigger>
                          <TabsTrigger value="link" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                            <Link className="w-4 h-4" />
                          </TabsTrigger>
                          {!isFullCustomization && (
                            <TabsTrigger value="info" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">
                              <Info className="w-4 h-4" />
                            </TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="text" className="space-y-4 mt-4">
                          <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Information</h4>
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground">Full Name</Label>
                                <Input 
                                  value={currentSide.name}
                                  onChange={(e) => updateSide('name', e.target.value)}
                                  placeholder="John Doe"
                                  className="h-9 bg-background/50"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground">Job Title</Label>
                                <Input 
                                  value={currentSide.title}
                                  onChange={(e) => updateSide('title', e.target.value)}
                                  placeholder="Software Engineer"
                                  className="h-9 bg-background/50"
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="templates" className="space-y-4 mt-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Select a Template</Label>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            {designTemplates
                              .filter(t => {
                                const matchesIndustry = !customization.industry || (t as any).category === customization.industry;
                                const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
                                return matchesIndustry && matchesSearch;
                              })
                              .map((template) => (
                              <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template.id)}
                                className={`group relative aspect-[1.58/1] overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                  customization.templateId === template.id
                                    ? "border-primary ring-2 ring-primary/50"
                                    : "border-transparent hover:border-primary/30"
                                }`}
                              >
                                <div 
                                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                  style={{ 
                                    backgroundImage: `url(${(template as any).image})`,
                                    backgroundColor: template.colors.bg 
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px] p-2">
                                  <div className="bg-primary text-white p-2 rounded-full mb-2">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                  <span className="text-white text-[10px] font-bold uppercase tracking-widest text-center">Use {template.name}</span>
                                </div>
                                
                                {customization.templateId === template.id && (
                                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-lg z-10">
                                    <Sparkles className="w-3 h-3" />
                                  </div>
                                )}
                                
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                  <p className="text-[10px] font-bold text-white truncate">{template.name}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="colors" className="space-y-4 mt-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="bgColor">Background</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  id="bgColor"
                                  type="color"
                                  value={currentSide.backgroundColor}
                                  onChange={(e) => updateSide("backgroundColor", e.target.value)}
                                  className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                  value={currentSide.backgroundColor}
                                  onChange={(e) => updateSide("backgroundColor", e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="textColor">Text</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  id="textColor"
                                  type="color"
                                  value={currentSide.textColor}
                                  onChange={(e) => updateSide("textColor", e.target.value)}
                                  className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                  value={currentSide.textColor}
                                  onChange={(e) => updateSide("textColor", e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="accentColor">Accent</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  id="accentColor"
                                  type="color"
                                  value={currentSide.accentColor}
                                  onChange={(e) => updateSide("accentColor", e.target.value)}
                                  className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                  value={currentSide.accentColor}
                                  onChange={(e) => updateSide("accentColor", e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>


                        <TabsContent value="elements" className="space-y-6 mt-4">
                          <div>
                            <Label className="mb-3 block">Background Pattern</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {patternOptions.map((pattern) => (
                                <button
                                  key={pattern.id}
                                  onClick={() => updateSide("pattern", pattern.id)}
                                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                                    currentSide.pattern === pattern.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <span className="text-xs font-medium">{pattern.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="mb-3 block">Border Style</Label>
                            <div className="grid grid-cols-5 gap-2">
                              {borderOptions.map((border) => (
                                <button
                                  key={border.id}
                                  onClick={() => updateSide("borderStyle", border.id)}
                                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                                    currentSide.borderStyle === border.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <span className="text-xs font-medium">{border.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="mb-3 block">Add Icon</Label>
                            <div className="grid grid-cols-5 gap-2">
                              {iconOptions.map((icon) => (
                                <button
                                  key={icon.id || 'none'}
                                  onClick={() => updateSide("icon", icon.id)}
                                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                                    currentSide.icon === icon.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <span className="text-xl">{icon.icon}</span>
                                  <span className="text-xs block mt-1">{icon.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                            <div className="flex items-center gap-3">
                              <QrCode className="w-5 h-5 text-primary" />
                              <div>
                                <Label>Add QR Code</Label>
                                <p className="text-xs text-muted-foreground">Links to your profile</p>
                              </div>
                            </div>
                            <Switch
                              checked={currentSide.showQRCode}
                              onCheckedChange={(checked) => updateSide("showQRCode", checked)}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="upload" className="space-y-4 mt-4">
                          <div>
                            <Label>Upload Logo</Label>
                            <div className="mt-2">
                              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                <div className="text-center">
                                  <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground mt-1 block">
                                    Click to upload logo
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'logoUrl')}
                                  className="hidden"
                                />
                              </label>
                              {currentSide.logoUrl && (
                                <p className="text-sm text-green-600 mt-2">✓ Logo uploaded</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Upload Custom Artwork</Label>
                            <div className="mt-2">
                              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                <div className="text-center">
                                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground mt-1 block">
                                    Click to upload artwork
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'customArtworkUrl')}
                                  className="hidden"
                                />
                              </label>
                              {currentSide.customArtworkUrl && (
                                <p className="text-sm text-green-600 mt-2">✓ Artwork uploaded</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Import from Canva</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="Paste Canva design URL..."
                                value={canvaUrl}
                                onChange={(e) => setCanvaUrl(e.target.value)}
                              />
                              <Button onClick={handleCanvaImport} variant="outline">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Import
                              </Button>
                            </div>
                            {customization.canvaDesignUrl && (
                              <p className="text-sm text-green-600 mt-2">✓ Canva design linked</p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="link" className="space-y-4 mt-4">
                          <div>
                            <Label>Link Your SmartCard Profile</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">
                              Connect this NFC product to your existing SmartCard profile.
                            </p>
                            
                            {customization.linkedProfileUsername ? (
                              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-primary">@{customization.linkedProfileUsername}</p>
                                    <p className="text-xs text-muted-foreground">Linked successfully</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleLinkProfile('', '')}>
                                  Change
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Button 
                                  className="w-full" 
                                  variant="outline" 
                                  onClick={loadUserProfiles}
                                  disabled={loadingProfiles}
                                >
                                  {loadingProfiles ? "Loading..." : "Find My Profiles"}
                                </Button>
                                
                                {profiles.length > 0 && (
                                  <div className="grid gap-2">
                                    {profiles.map(p => (
                                      <button
                                        key={p.id}
                                        onClick={() => handleLinkProfile(p.id, p.username)}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
                                      >
                                        <div>
                                          <p className="font-medium">@{p.username}</p>
                                          <p className="text-xs text-muted-foreground">{p.title || 'No title'}</p>
                                        </div>
                                        <Link className="w-4 h-4 text-muted-foreground" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        {!isFullCustomization && (
                          <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Product Info</h4>
                              <p className="text-xs text-muted-foreground">
                                This product features the standard SmartCard design. You can upload your logo and link your profile above.
                              </p>
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// Syntax fix verification.




