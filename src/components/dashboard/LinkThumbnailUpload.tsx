import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface LinkThumbnailUploadProps {
  userId: string;
  linkId: string;
  currentThumbnail: string | null;
  onUpload: (url: string | null) => void;
  /** Optional auto-icon shown when no thumbnail is set. Tapping still opens the file picker. */
  fallbackIcon?: React.ReactNode;
}

export function LinkThumbnailUpload({ userId, linkId, currentThumbnail, onUpload, fallbackIcon }: LinkThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 1 * 1024 * 1024) {
        toast.error("Image must be less than 1MB");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${linkId}.${fileExt}`;

      // Delete old thumbnail if exists
      if (currentThumbnail) {
        const oldPath = currentThumbnail.split("/thumbnails/")[1];
        if (oldPath) {
          await supabase.storage.from("thumbnails").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success("Thumbnail uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!currentThumbnail) return;
    
    try {
      const oldPath = currentThumbnail.split("/thumbnails/")[1];
      if (oldPath) {
        await supabase.storage.from("thumbnails").remove([oldPath]);
      }
      onUpload(null);
      toast.success("Thumbnail removed");
    } catch (error) {
      toast.error("Failed to remove thumbnail");
    }
  };

  return (
    <div className="flex-shrink-0">
      {currentThumbnail ? (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden group">
          <img src={currentThumbnail} alt="" className="w-full h-full object-cover" />
          <button
            onClick={handleRemove}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
