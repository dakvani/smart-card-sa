import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Loader2, Check, Palette, Briefcase, Camera, Sparkles, Lock,
  Stethoscope, Home, Trophy, Music, UtensilsCrossed, Dumbbell,
  Code, Star, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  theme_name: string;
  theme_gradient: string;
  gradient_direction: string;
  is_premium: boolean;
  animation_type: string | null;
}

interface ProfileTemplatesProps {
  onApply: (updates: {
    theme_name: string;
    theme_gradient: string;
    gradient_direction: string;
    custom_bg_color: null;
    custom_accent_color: null;
    animation_type: string | null;
  }) => void;
  currentThemeName: string;
  isPro?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  creator: Camera,
  business: Briefcase,
  portfolio: Palette,
  doctor: Stethoscope,
  realtor: Home,
  coach: Trophy,
  musician: Music,
  restaurant: UtensilsCrossed,
  fitness: Dumbbell,
  photographer: Camera,
  developer: Code,
  influencer: Star,
  educator: GraduationCap,
};

const categoryLabels: Record<string, string> = {
  creator: "Creator",
  business: "Business",
  portfolio: "Portfolio",
  doctor: "Doctor",
  realtor: "Realtor",
  coach: "Coach",
  musician: "Musician",
  restaurant: "Restaurant",
  fitness: "Fitness",
  photographer: "Photographer",
  developer: "Developer",
  influencer: "Influencer",
  educator: "Educator",
};

const animationLabels: Record<string, string> = {
  pulse: "✨ Pulse",
  particles: "⭐ Particles",
  wave: "🌊 Wave",
  "gradient-shift": "🌈 Shift",
  glow: "💫 Glow",
  orbs: "🔮 Orbs",
  shimmer: "✦ Shimmer",
  neon: "💡 Neon",
};

export function ProfileTemplates({ onApply, currentThemeName }: ProfileTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_templates")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Failed to load templates:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (template: Template) => {
    setApplying(template.id);
    try {
      onApply({
        theme_name: template.theme_name,
        theme_gradient: template.theme_gradient,
        gradient_direction: template.gradient_direction || "to-b",
        custom_bg_color: null,
        custom_accent_color: null,
        animation_type: template.animation_type,
      });
      toast.success(`Applied "${template.name}" template!`);
    } finally {
      setTimeout(() => setApplying(null), 500);
    }
  };

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Profile Templates</h3>
        <p className="text-sm text-muted-foreground">
          Apply a pre-designed theme to your profile with one click
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const Icon = categoryIcons[cat] || Palette;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {cat !== "all" && <Icon className="w-4 h-4" />}
              {cat === "all" ? "All" : categoryLabels[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredTemplates.map(template => {
          const isActive = template.theme_name === currentThemeName;
          const Icon = categoryIcons[template.category] || Palette;
          
          return (
            <div
              key={template.id}
              className={`relative rounded-xl border overflow-hidden transition-all ${
                isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              }`}
            >
              {/* Preview */}
              <div 
                className={`h-24 bg-gradient-${template.gradient_direction} ${template.theme_gradient} relative overflow-hidden`}
              >
                {template.animation_type && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
                <div className="h-full w-full flex items-center justify-center relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur" />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      {template.animation_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {animationLabels[template.animation_type] || "Animated"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isActive ? "outline" : "gradient"}
                    onClick={() => applyTemplate(template)}
                    disabled={applying === template.id}
                    className="shrink-0"
                  >
                    {applying === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      <>
                        <Check className="w-4 h-4" />
                        Applied
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              </div>

              {template.is_premium && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-500/90 text-yellow-900 text-[10px] font-bold uppercase">
                  Pro
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
