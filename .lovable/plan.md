
# Linktree-style profile builder rebuild

Replace the current Dashboard/Settings split with a unified `/admin/links` builder modeled on the videos, plus a multi-step onboarding wizard. Keep the existing dark glassmorphism + indigo→pink gradient brand. Migrate all existing data — no destructive changes.

## 1. Information architecture

```text
/onboarding              Wizard (post-signup, only if profile.onboarded = false)
  step 1  Pick username   (reuse use-username-check)
  step 2  Verify email    (OTP — already wired)
  step 3  Pick platforms  (multi-select: IG, X, YT, TikTok, FB, LinkedIn, GitHub, WhatsApp)
  step 4  Upload avatar   (reuse AvatarUpload)
  step 5  "Looking good!" preview → Continue building

/admin/links             3-column builder (Links tab)
/admin/design            Theme + Wallpaper + Footer
/admin/qr                QR customizer
/admin/insights          Analytics (existing AnalyticsCharts wrapped)
/admin/settings          Account, security, plan (existing Settings wrapped)

/u/:username (or current /:username) — public profile, unchanged data shape
```

Old `/dashboard` redirects to `/admin/links`. Old `/settings` redirects to `/admin/settings`.

## 2. Layout — desktop (≥md)

```text
┌──────────┬─────────────────────────────┬──────────────┐
│ Sidebar  │  Center column              │ Live preview │
│          │                             │  (sticky)    │
│ Links    │  Profile header card        │              │
│ Design   │  ┌───────────────────────┐  │ ┌──────────┐ │
│ QR       │  │ + Add                 │  │ │  phone   │ │
│ Insights │  └───────────────────────┘  │ │  mockup  │ │
│ Settings │  Block list (DnD)           │ │          │ │
│          │   • Link block              │ │ realtime │ │
│ ───────  │   • Social row block        │ │ updates  │ │
│ Plan     │   • Header/text block       │ │          │ │
│ Logout   │   • Media block             │ └──────────┘ │
│          │   • Contact block           │  Share btn   │
└──────────┴─────────────────────────────┴──────────────┘
```

## 3. Layout — mobile (<md)

Single column. Live preview becomes a peek strip pinned under the top bar (collapsible). `MobileTabBar` (already exists) navigates between Links / Design / QR / Stats / Settings. Each Add / Edit opens a full-height bottom Drawer with sticky save bar.

## 4. Block model (replaces flat `links`)

New table `profile_blocks` supersedes per-row `links`. Migration copies every existing `links` row into a `profile_blocks` row of `kind='link'` with `data = { title, url, thumbnail_url, scheduled_start, scheduled_end, is_featured, group_id }`. The `links` table stays for now (read-only fallback) and will be deprecated next turn.

```text
profile_blocks
  id, user_id, kind, position, visible, data jsonb, click_count,
  created_at, updated_at

kind ∈ {link, header, text, social_row, media_embed, image,
        contact_whatsapp, contact_email, contact_phone, vcard,
        product_card, shop_link}
```

Why jsonb: each block kind has different fields; this avoids 10 sparse columns. RLS: owner-only write, public read of `visible=true` blocks via the existing public-profile selector pattern.

## 5. Add modal

Categories shown as left rail tabs with a search bar at top:

- **Suggested** — top 4 actions for the user's current state
- **Social** — IG, X, YouTube, TikTok, FB, LinkedIn, GitHub
- **Contact** — WhatsApp, Email, Phone, vCard download
- **Commerce** — Pick from your NFC catalog products, External shop link
- **Media** — YouTube/Spotify embed, Image
- **Text** — Header, Paragraph, Divider

Selecting a card opens an inline form, then "Add to profile" appends a `profile_blocks` row at the end.

## 6. Design tab

- **Theme grid** — 18 preset cards (reuse `ProfileTemplates` data, restyled). Custom theme stays as the first card.
- **Wallpaper** — Fill / Gradient / Blur / Pattern + color picker. Stored in `profiles.wallpaper_style` + `wallpaper_value` (new columns).
- **Footer toggle** — Hide SmartCard footer (Pro-gated, reuse `use-plan`).

## 7. QR tab

Reuse `QRCodeGenerator` but expose: QR color presets + hex, hide-logo toggle, custom logo upload. Save to `profiles.qr_settings jsonb`.

## 8. Live preview

New `<LivePhonePreview />` subscribes to a Zustand store (`useBuilderStore`) holding draft profile + blocks. Builder edits write to the store immediately (optimistic) and debounce-persist to Supabase at 600ms. The public profile route reads from Supabase as today — no behavior change there.

## 9. Migration plan (data)

1. Add `profile_blocks` + new profile columns (`onboarded bool`, `wallpaper_style`, `wallpaper_value`, `qr_settings jsonb`).
2. Backfill: for each `links` row, insert a `profile_blocks` row with `kind='link'`, preserving order via existing `position`.
3. Public profile reads `profile_blocks` first; falls back to `links` if empty (transition safety for one release).

## 10. Files

**New**
- `src/pages/Onboarding.tsx` + `src/components/onboarding/{UsernameStep,OtpStep,PlatformsStep,AvatarStep,PreviewStep}.tsx`
- `src/pages/admin/{Links,Design,QR,Insights,AdminSettings}.tsx` (route shells)
- `src/components/builder/{BuilderShell,Sidebar,LivePhonePreview,AddBlockModal,BlockList}.tsx`
- `src/components/builder/blocks/{LinkBlock,SocialRowBlock,HeaderBlock,TextBlock,MediaBlock,ContactBlock,ProductBlock}.tsx`
- `src/store/builder-store.ts` (Zustand)
- `src/lib/blocks.ts` (kind registry, defaults, migration helper)

**Edited**
- `src/components/AnimatedRoutes.tsx` — new routes, redirects from `/dashboard` and `/settings`
- `src/components/dashboard/MobileTabBar.tsx` — point at new admin routes
- `src/pages/PublicProfile.tsx` — read `profile_blocks`, render via shared block renderers

**Deprecated (kept, not deleted)**
- `src/pages/Dashboard.tsx`, current `SortableLinkItem`, `SocialLinksEditor` — left in tree, no longer routed.

## 11. Out of scope for this turn

- Linktree-style "Earn" / "Audience" tabs
- Stripe-style commerce (we use existing NFC catalog only)
- Drag-from-collection grouping UI (keep current `link_groups` flat)
- Performance pass beyond what falls out naturally
- Removing deprecated files (next turn)

## 12. Risks

- Block model migration is the highest-risk piece. Mitigation: dual-read in PublicProfile, no destructive `links` change this turn.
- Live-preview store + debounced writes can race with autosave on slow networks. Mitigation: per-block version stamp, last-write-wins with toast on conflict.

## 13. Order of execution

1. DB migration (`profile_blocks` + new profile columns + backfill)
2. Builder shell + store + LivePhonePreview
3. Block renderers + AddBlockModal
4. Design tab + QR tab
5. Onboarding wizard
6. PublicProfile dual-read
7. Route swap + redirects + MobileTabBar wiring

This is a multi-message build — I'll start with DB + shell this turn, then block renderers and onboarding next turns.
