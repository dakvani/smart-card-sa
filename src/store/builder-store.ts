import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileBlock, BlockKind } from "@/lib/blocks";
import { getDef } from "@/lib/blocks";
import { toast } from "sonner";

interface ProfileLite {
  id: string;
  user_id: string;
  username: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  theme_gradient: string | null;
  social_links: Record<string, string> | null;
  custom_bg_color: string | null;
  custom_accent_color: string | null;
  wallpaper_style?: string | null;
  wallpaper_value?: string | null;
  qr_settings?: Record<string, any> | null;
  onboarded?: boolean | null;
  plan?: string | null;
}

interface BuilderState {
  userId: string | null;
  profile: ProfileLite | null;
  blocks: ProfileBlock[];
  loading: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  load: (userId: string) => Promise<void>;
  // Profile
  patchProfile: (patch: Partial<ProfileLite>) => void;
  // Blocks
  addBlock: (kind: BlockKind, data?: Record<string, any>) => Promise<void>;
  updateBlock: (id: string, patch: Partial<ProfileBlock>) => void;
  deleteBlock: (id: string) => Promise<void>;
  reorderBlocks: (ids: string[]) => Promise<void>;
  toggleVisible: (id: string) => void;
}

let profileTimer: ReturnType<typeof setTimeout> | null = null;
let blockTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  userId: null,
  profile: null,
  blocks: [],
  loading: true,
  saveStatus: "idle",

  load: async (userId) => {
    set({ loading: true, userId });
    const [{ data: profile }, { data: blocks }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("profile_blocks").select("*").eq("user_id", userId).order("position", { ascending: true }),
    ]);
    set({
      profile: (profile as any) ?? null,
      blocks: ((blocks as any[]) ?? []) as ProfileBlock[],
      loading: false,
    });
  },

  patchProfile: (patch) => {
    const cur = get().profile;
    if (!cur) return;
    const next = { ...cur, ...patch };
    set({ profile: next, saveStatus: "saving" });
    if (profileTimer) clearTimeout(profileTimer);
    profileTimer = setTimeout(async () => {
      const { error } = await supabase
        .from("profiles")
        .update(patch as any)
        .eq("id", next.id);
      if (error) {
        set({ saveStatus: "error" });
        toast.error("Failed to save profile");
      } else {
        set({ saveStatus: "saved" });
      }
    }, 600);
  },

  addBlock: async (kind, data) => {
    const userId = get().userId;
    if (!userId) return;
    const def = getDef(kind);
    const blocks = get().blocks;
    const position = blocks.length;
    const insert = {
      user_id: userId,
      kind,
      position,
      visible: true,
      data: { ...(def?.defaultData ?? {}), ...(data ?? {}) },
    };
    const { data: row, error } = await supabase
      .from("profile_blocks")
      .insert(insert as any)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add block");
      return;
    }
    set({ blocks: [...blocks, row as any] });
    toast.success(`${def?.label ?? "Block"} added`);
  },

  updateBlock: (id, patch) => {
    const blocks = get().blocks.map((b) => (b.id === id ? { ...b, ...patch, data: patch.data ? { ...b.data, ...patch.data } : b.data } : b));
    set({ blocks, saveStatus: "saving" });
    if (blockTimers[id]) clearTimeout(blockTimers[id]);
    blockTimers[id] = setTimeout(async () => {
      const updated = blocks.find((b) => b.id === id);
      if (!updated) return;
      const { error } = await supabase
        .from("profile_blocks")
        .update({ visible: updated.visible, data: updated.data, position: updated.position } as any)
        .eq("id", id);
      if (error) {
        set({ saveStatus: "error" });
        toast.error("Failed to save");
      } else {
        set({ saveStatus: "saved" });
      }
    }, 500);
  },

  deleteBlock: async (id) => {
    const prev = get().blocks;
    set({ blocks: prev.filter((b) => b.id !== id) });
    const { error } = await supabase.from("profile_blocks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      set({ blocks: prev });
    }
  },

  reorderBlocks: async (ids) => {
    const map = new Map(get().blocks.map((b) => [b.id, b]));
    const reordered = ids.map((id, position) => ({ ...(map.get(id) as ProfileBlock), position }));
    set({ blocks: reordered });
    await Promise.all(
      reordered.map((b) =>
        supabase.from("profile_blocks").update({ position: b.position } as any).eq("id", b.id),
      ),
    );
  },

  toggleVisible: (id) => {
    const b = get().blocks.find((x) => x.id === id);
    if (!b) return;
    get().updateBlock(id, { visible: !b.visible } as any);
  },
}));
