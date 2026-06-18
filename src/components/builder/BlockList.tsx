import { useEffect, useRef, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical, Eye, EyeOff, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import { getDef, SOCIAL_ICONS, type ProfileBlock } from "@/lib/blocks";

export function BlockList() {
  const blocks = useBuilderStore((s) => s.blocks);
  const reorder = useBuilderStore((s) => s.reorderBlocks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIdx, newIdx).map((b) => b.id);
    void reorder(next);
  };

  if (blocks.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <div className="text-sm font-medium">Nothing here yet</div>
        <div className="text-xs text-muted-foreground mt-1">Tap “+ Add” to add your first block.</div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.map((b) => <SortableBlockRow key={b.id} block={b} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableBlockRow({ block }: { block: ProfileBlock }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [open, setOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const update = useBuilderStore((s) => s.updateBlock);
  const remove = useBuilderStore((s) => s.deleteBlock);
  const toggle = useBuilderStore((s) => s.toggleVisible);
  const def = getDef(block.kind);
  const Icon = def?.icon ?? GripVertical;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = editorRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
      el?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const summary = describe(block);

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-secondary/40">
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-1" aria-label="Reorder">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <button onClick={() => setOpen((v) => !v)} className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium truncate">{summary.title}</div>
          {summary.subtitle && <div className="text-xs text-muted-foreground truncate">{summary.subtitle}</div>}
        </button>
        <button onClick={() => toggle(block.id)} className="p-2 rounded hover:bg-muted" title={block.visible ? "Hide" : "Show"}>
          {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button onClick={() => setOpen((v) => !v)} className="p-2 rounded hover:bg-muted" aria-label="Edit">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={() => void remove(block.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive" aria-label="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div ref={editorRef} className="px-3 pb-3 border-t border-border/60 pt-3">
          <BlockEditor block={block} onChange={(data) => update(block.id, { data } as any)} />
        </div>
      )}
    </div>
  );
}

function describe(b: ProfileBlock): { title: string; subtitle?: string } {
  const d = b.data || {};
  const def = getDef(b.kind);
  const label = def?.label ?? b.kind;
  switch (b.kind) {
    case "link": return { title: "Link", subtitle: d.title || d.url || "Add a link" };
    case "header": return { title: "Header", subtitle: d.text || "Add heading text" };
    case "text": return { title: "Paragraph", subtitle: d.text || "Add some text" };
    case "divider": return { title: "Divider" };
    case "social_row": {
      const filled = Object.entries(d).filter(([_, v]) => v).map(([k]) => k);
      return { title: "Social", subtitle: filled.length ? filled.join(", ") : "Add your handles" };
    }
    case "media_embed": return { title: "Embed", subtitle: d.title || d.url || "Paste a URL" };
    case "image": return { title: "Image", subtitle: d.caption || d.url || "Add an image" };
    case "contact_whatsapp": return { title: "WhatsApp", subtitle: d.phone || "Add a number" };
    case "contact_email": return { title: "Email", subtitle: d.email || "Add an email" };
    case "contact_phone": return { title: "Phone", subtitle: d.phone || "Add a number" };
    case "vcard": return { title: "Contact", subtitle: d.name || d.phone || d.email || "Add contact details" };
    case "product_card": return { title: "NFC Product", subtitle: d.title || d.product_id || "Pick a product" };
    case "shop_link": return { title: "Shop link", subtitle: d.title || d.url || "Paste a URL" };
    default: return { title: label };
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-3 py-2 rounded-lg border border-input bg-background text-sm ${props.className ?? ""}`} />;
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full px-3 py-2 rounded-lg border border-input bg-background text-sm min-h-[80px] ${props.className ?? ""}`} />;
}

function BlockEditor({ block, onChange }: { block: ProfileBlock; onChange: (data: Record<string, any>) => void }) {
  const d = block.data || {};
  const set = (patch: Record<string, any>) => onChange(patch);
  switch (block.kind) {
    case "link":
    case "shop_link":
      return (
        <div className="space-y-2">
          <Field label="Title"><Input value={d.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="URL"><Input value={d.url ?? ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://..." /></Field>
        </div>
      );
    case "header":
      return <Field label="Heading text"><Input value={d.text ?? ""} onChange={(e) => set({ text: e.target.value })} /></Field>;
    case "text":
      return <Field label="Paragraph"><TextArea value={d.text ?? ""} onChange={(e) => set({ text: e.target.value })} /></Field>;
    case "divider":
      return <div className="text-xs text-muted-foreground">No options.</div>;
    case "social_row":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.keys(SOCIAL_ICONS).map((k) => (
            <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
              <Input value={d[k] ?? ""} onChange={(e) => set({ [k]: e.target.value })} placeholder={k === "website" ? "https://..." : "username"} />
            </Field>
          ))}
        </div>
      );
    case "contact_whatsapp":
      return (
        <div className="space-y-2">
          <Field label="Phone (with country code)"><Input value={d.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+1234567890" /></Field>
          <Field label="Prefilled message"><Input value={d.message ?? ""} onChange={(e) => set({ message: e.target.value })} /></Field>
        </div>
      );
    case "contact_email":
      return (
        <div className="space-y-2">
          <Field label="Email"><Input value={d.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Subject"><Input value={d.subject ?? ""} onChange={(e) => set({ subject: e.target.value })} /></Field>
        </div>
      );
    case "contact_phone":
      return <Field label="Phone"><Input value={d.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} /></Field>;
    case "vcard":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="Name"><Input value={d.name ?? ""} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Company"><Input value={d.company ?? ""} onChange={(e) => set({ company: e.target.value })} /></Field>
          <Field label="Phone"><Input value={d.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={d.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></Field>
        </div>
      );
    case "media_embed":
      return (
        <div className="space-y-2">
          <Field label="Title"><Input value={d.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="YouTube / Spotify URL"><Input value={d.url ?? ""} onChange={(e) => set({ url: e.target.value })} /></Field>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <Field label="Image URL"><Input value={d.url ?? ""} onChange={(e) => set({ url: e.target.value })} /></Field>
          <Field label="Caption"><Input value={d.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} /></Field>
        </div>
      );
    case "product_card":
      return (
        <div className="space-y-2">
          <Field label="Title"><Input value={d.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Product ID (from your catalog)"><Input value={d.product_id ?? ""} onChange={(e) => set({ product_id: e.target.value })} /></Field>
        </div>
      );
    default:
      return null;
  }
}
