import { Instagram, Twitter, Youtube, Facebook, Linkedin, Github, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { validateSocialHandle } from "@/lib/link-validation";
import { toast } from "@/hooks/use-toast";

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

interface SocialLinksEditorProps {
  socialLinks: SocialLinks;
  onChange: (links: SocialLinks) => void;
  onBlur: () => void;
}

const socialPlatforms = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "username" },
  { key: "twitter", label: "Twitter/X", icon: Twitter, placeholder: "username" },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "channel" },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "username" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "username" },
  { key: "github", label: "GitHub", icon: Github, placeholder: "username" },
  { key: "website", label: "Website", icon: Globe, placeholder: "https://..." },
] as const;

export function SocialLinksEditor({ socialLinks, onChange, onBlur }: SocialLinksEditorProps) {
  const handleChange = (key: string, value: string) => {
    onChange({ ...socialLinks, [key]: value });
  };

  const results = useMemo(() => {
    const map: Record<string, { valid: boolean; message?: string }> = {};
    for (const { key } of socialPlatforms) {
      map[key] = validateSocialHandle(key, (socialLinks as Record<string, string>)[key] || "");
    }
    return map;
  }, [socialLinks]);

  const handleBlur = () => {
    const firstInvalid = socialPlatforms.find(({ key }) => !results[key].valid);
    if (firstInvalid) {
      toast({
        title: `Invalid ${firstInvalid.label} link`,
        description: results[firstInvalid.key].message,
        variant: "destructive",
      });
      return;
    }
    onBlur();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Social Media Links</label>
      <div className="space-y-2">
        {socialPlatforms.map(({ key, label, icon: Icon, placeholder }) => {
          const value = (socialLinks as Record<string, string>)[key] || "";
          const result = results[key];
          const hasValue = value.trim().length > 0;
          return (
            <div key={key}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="relative flex-1">
                  <input
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    aria-invalid={hasValue && !result.valid}
                    aria-label={`${label} link`}
                    className={`w-full pr-9 px-3 py-2 rounded-lg border bg-background text-sm transition-colors ${
                      hasValue && !result.valid
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-input"
                    }`}
                  />
                  {hasValue && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {result.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
              </div>
              {hasValue && !result.valid && result.message && (
                <p className="text-xs text-destructive mt-1 ml-13 pl-13" style={{ marginLeft: 52 }}>
                  {result.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        These icons will appear at the bottom of your profile. Invalid entries won't be saved.
      </p>
    </div>
  );
}

export { socialPlatforms };
