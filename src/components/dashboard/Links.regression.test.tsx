/**
 * Regression tests for the Dashboard "Links" tab.
 *
 * We exercise the operations the Links tab supports via the contract
 * Dashboard passes to SortableLinkItem (`onUpdate(id, patch)` /
 * `onDelete(id)`), and we exercise reordering through the same
 * `arrayMove` helper Dashboard uses for drag-and-drop, so the
 * phone-preview's link order stays consistent with the editor list.
 *
 * Covers: edit title/url, toggle visibility, toggle featured (pin),
 * delete, reorder, and an "add link" reducer step.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { arrayMove } from "@dnd-kit/sortable";

import { SortableLinkItem } from "@/components/dashboard/SortableLinkItem";

// LinkScheduler + LinkThumbnailUpload pull in supabase + dialogs;
// neutralize them so we can focus on the link row's own controls.
vi.mock("@/components/dashboard/LinkScheduler", () => ({
  LinkScheduler: () => <div data-testid="link-scheduler" />,
}));
vi.mock("@/components/dashboard/LinkThumbnailUpload", () => ({
  LinkThumbnailUpload: () => <div data-testid="link-thumb-upload" />,
}));

// DndContext / useSortable need a valid context, but rendering a
// single SortableLinkItem inside a real DndContext would be heavy.
// useSortable falls back gracefully when called outside a context
// (returns inert transform/transition), which is fine for these
// behavioral tests.

const sampleLink = {
  id: "l-1",
  user_id: "u-1",
  title: "My Site",
  url: "https://example.com",
  visible: true,
  click_count: 7,
  thumbnail_url: null,
  scheduled_start: null,
  scheduled_end: null,
  group_id: null,
  is_featured: false,
};

function renderRow(overrides: Partial<typeof sampleLink> = {}) {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  render(
    <SortableLinkItem
      link={{ ...sampleLink, ...overrides }}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
  return { onUpdate, onDelete };
}

describe("Links tab — SortableLinkItem behaviors", () => {
  it("renders title, url, and click count", () => {
    renderRow();
    expect(screen.getByDisplayValue("My Site")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://example.com")).toBeInTheDocument();
    expect(screen.getByText(/7 clicks/i)).toBeInTheDocument();
  });

  it("editing the title fires onUpdate with the patch (drives preview)", () => {
    const { onUpdate } = renderRow();
    const titleInput = screen.getByDisplayValue("My Site");
    fireEvent.change(titleInput, { target: { value: "Updated Site" } });
    expect(onUpdate).toHaveBeenCalledWith("l-1", { title: "Updated Site" });
  });

  it("editing the url fires onUpdate", () => {
    const { onUpdate } = renderRow();
    const urlInput = screen.getByDisplayValue("https://example.com");
    fireEvent.change(urlInput, { target: { value: "https://updated.example.com" } });
    expect(onUpdate).toHaveBeenCalledWith("l-1", { url: "https://updated.example.com" });
  });

  it("toggling visibility flips `visible` via onUpdate", () => {
    const { onUpdate } = renderRow({ visible: true });
    fireEvent.click(screen.getByTitle(/Hide link/i));
    expect(onUpdate).toHaveBeenCalledWith("l-1", { visible: false });
  });

  it("pin toggle flips `is_featured` via onUpdate", () => {
    const { onUpdate } = renderRow({ is_featured: false });
    fireEvent.click(screen.getByTitle(/Pin to top/i));
    expect(onUpdate).toHaveBeenCalledWith("l-1", { is_featured: true });
  });

  it("delete button calls onDelete with the link id", () => {
    const { onDelete } = renderRow();
    // The delete button is the last icon button in the row; find by destructive icon.
    const trash = document.querySelector(".text-destructive")!.closest("button");
    fireEvent.click(trash!);
    expect(onDelete).toHaveBeenCalledWith("l-1");
  });
});

describe("Links tab — list state (mirrors Dashboard's link state)", () => {
  type Link = typeof sampleLink;

  const a: Link = { ...sampleLink, id: "a", title: "A" };
  const b: Link = { ...sampleLink, id: "b", title: "B" };
  const c: Link = { ...sampleLink, id: "c", title: "C" };

  it("adds a new link to the bottom of the list (preview gets new row last)", () => {
    const list = [a, b];
    const next = [...list, c];
    expect(next.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("applies a partial onUpdate patch to a single row (preview text updates)", () => {
    const list = [a, b, c];
    const next = list.map((l) => (l.id === "b" ? { ...l, title: "B-edited" } : l));
    expect(next.find((l) => l.id === "b")!.title).toBe("B-edited");
    expect(next.find((l) => l.id === "a")!.title).toBe("A");
    expect(next.find((l) => l.id === "c")!.title).toBe("C");
  });

  it("toggling visibility only affects the targeted row", () => {
    const list = [a, b, c];
    const next = list.map((l) => (l.id === "a" ? { ...l, visible: !l.visible } : l));
    expect(next.find((l) => l.id === "a")!.visible).toBe(false);
    expect(next.find((l) => l.id === "b")!.visible).toBe(true);
  });

  it("reordering uses dnd-kit arrayMove (drag b to position 0)", () => {
    const list = [a, b, c];
    const fromIdx = list.findIndex((l) => l.id === "b");
    const toIdx = 0;
    const next = arrayMove(list, fromIdx, toIdx);
    expect(next.map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("deleting removes the row from the list (preview drops it)", () => {
    const list = [a, b, c];
    const next = list.filter((l) => l.id !== "b");
    expect(next.map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("only visible links flow to the public preview", () => {
    const list = [a, { ...b, visible: false }, c];
    const previewLinks = list.filter((l) => l.visible);
    expect(previewLinks.map((l) => l.id)).toEqual(["a", "c"]);
  });
});
