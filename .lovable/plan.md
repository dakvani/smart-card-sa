Features-first batch. Performance work will follow in a dedicated turn.

## 1. Marketing unsubscribe — re-subscribe option

- Extend `/marketing-unsubscribe` so after a successful unsubscribe (or when the link shows "already unsubscribed"), a "Resubscribe" button appears.
- Add `POST /marketing-unsubscribe` action `resubscribe` (or a separate `?action=resubscribe` flag) in the edge function that clears `unsubscribed_at` for that token.
- Show clear states: Success (just unsubscribed) → optional resubscribe; Already unsubscribed → resubscribe; Invalid/expired token → blocking message with no action.
- Token stays single-use-per-state: each click toggles between subscribed and unsubscribed; expired tokens (none today, but reserved for future TTL) keep the invalid message.

## 2. Admin email content editor — app + auth emails

### Data model
New table `email_template_overrides` (one row per template):

```text
template_key       text primary key      e.g. 'welcome', 'signup', 'recovery'
kind               text  ('app' | 'auth')
subject_override   text  nullable
body_intro         text  nullable        rich-text block shown above main content
body_outro         text  nullable        rich-text block shown below main content
cta_label          text  nullable
enabled            boolean default true  when false, fall back to code default
version            int   default 1       bumped on every save (audit trail)
updated_by         uuid  nullable
updated_at         timestamptz
```

Admin-only RLS (`has_role admin`). `service_role` full access for edge functions. Trigger bumps `version` and stamps `updated_by` via `auth.uid()`.

### Templates read overrides at render time
- App templates (`_shared/transactional-email-templates/*.tsx`): `send-transactional-email` loads the override row by `templateName`, passes `subjectOverride`, `bodyIntro`, `bodyOutro`, `ctaLabel` into the React template. Templates render overrides where defined and fall back to defaults otherwise.
- Auth templates (`_shared/email-templates/*.tsx`): `auth-email-hook` does the same lookup keyed by event type (`signup`, `recovery`, `magiclink`, `invite`, `email_change`, `reauthentication`) and threads the overrides into each template before enqueue.
- Logged `template_version` (audit field) recorded in `email_send_log.metadata` so we can trace which override version a given email used.

### Admin UI
New `AdminEmailTemplatesEditor` component on the existing Emails tab:
- List all known templates with kind badge (App / Auth).
- Per template: editable Subject, Intro text, Outro text, optional CTA label, "enabled" toggle, version + last-updated indicator, Preview button that calls the existing `preview-transactional-email` function (extended to accept ad-hoc overrides for live preview).
- Reset-to-default action clears overrides (sets row `enabled=false` or nullifies fields).

Constraint: we do NOT let admins replace the entire HTML body — too easy to break deliverability. Editable surfaces are subject + structured copy blocks, mirroring the welcome footer pattern already in place.

## 3. Mobile-first profile builder redesign

Scope: `src/pages/Dashboard.tsx` and the link/appearance editors used inside it.

Pattern: phone preview becomes the hero on mobile; editing happens in a bottom sheet/drawer that slides up per section, instead of stacked accordions.

- Sticky bottom nav (mobile only) with 4 tabs: Profile, Links, Theme, Share.
- Tapping a tab opens a Drawer (already in `ui/drawer.tsx`) containing only that section's fields. Drawer is full-height, scrollable, with a sticky Save bar.
- Replace dense per-link cards with a compact list row: drag handle, title, switch, edit chevron. Tapping opens an EditLink drawer.
- Live preview (`ProfileShareCard`/`LivePreview`) stays pinned above the drawer (peek view) so users see changes in real time.
- Hide desktop side panels on `<md`; keep current desktop layout untouched at `md+`.
- Bigger tap targets (min 44px), reduced font weight stacking, no horizontal scroll, no nested tab bars.
- Use `useIsMobile()` to swap layout components rather than CSS-hiding heavy desktop subtrees, so mobile doesn't render desktop-only logic.

No changes to data flow / business logic — purely a presentation refactor of Dashboard sub-components.

## 4. Out of scope this turn

- Performance profiling/fixes (#2 of the original list) — separate turn as requested.
- Marketing email sending (we still don't send marketing — only the resubscribe flow itself).
- Editing raw HTML of email bodies.

## Technical notes

- Migration: add `email_template_overrides` + grants + RLS + version-bump trigger; seed rows for all known templates so admin UI has something to render immediately.
- Edge functions touched: `marketing-unsubscribe` (resubscribe action), `send-transactional-email` (load overrides), `auth-email-hook` (load overrides), `preview-transactional-email` (accept ad-hoc overrides for live admin preview).
- Frontend new files: `AdminEmailTemplatesEditor.tsx`, mobile drawer wrappers under `src/components/dashboard/mobile/*`.
- All edge functions redeployed after edits.
