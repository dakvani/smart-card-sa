## Goal

Produce a comprehensive MVP handbook for **SmartCard** (NFC hardware + SmartLink Bio digital profiles) as a downloadable `.docx` under `/mnt/documents/`. Reader mix: product-facing first, technical deep-dive after.

## Deliverable

- `SmartCard-MVP-Handbook.docx` — single Word document, ~25–35 pages, US Letter, Arial, styled headings, TOC, tables, page numbers.
- Preview via `<presentation-artifact>` tag when done.

## Approach

1. Gather ground truth from the codebase (no assumptions): read `package.json`, `src/App.tsx`, `src/pages/*` (Index, Dashboard, Settings, NFCProducts, AdminDashboard, Marketplace, Learn, PublicProfile, Auth flows), `src/components/admin/*`, `src/components/dashboard/*`, `supabase/functions/*`, `supabase/config.toml`, existing memory files, and the DB schema via `supabase--read_query` on `information_schema` (tables, columns, policies).
2. Generate the DOCX with `docx-js` following the bundled docx skill (Arial default, US Letter 12240×15840, proper heading styles with `outlineLevel`, TOC, tables with dual widths + DXA, page numbers in footer).
3. QA: validate with `validate_document.py`, convert to PDF+JPG via LibreOffice/pdftoppm, visually inspect every page, fix issues, re-render.

## Document Structure

```text
Cover
Table of Contents

Part 1 — Product
  1. Executive Summary
  2. Vision & Value Proposition
  3. Target Users & Personas
  4. Market Positioning & Competitors
  5. MVP Scope (In / Out)
  6. Core User Journeys (Creator, Buyer, Admin, Visitor)
  7. Feature Catalog
     - SmartLink Bio profiles
     - NFC hardware storefront (customizer, cart, guest checkout)
     - Marketplace of templates
     - Analytics
     - Learn / Help center
  8. Pricing & Plans (Free / Pro)
  9. Brand & Design System

Part 2 — Technical Handbook
  10. Architecture Overview (SPA + Lovable Cloud/Supabase)
  11. Tech Stack & Dependencies
  12. Repository Map
  13. Routing & Page Inventory
  14. Component Library Overview
  15. Data Model (tables, columns, relations)
  16. Row-Level Security & Grants (per table)
  17. Database Functions & Triggers
  18. Edge Functions (email queue, order emails, unsubscribe, previews, etc.)
  19. Authentication & Roles (user_roles + has_role pattern, admin portal)
  20. Storage Buckets (avatars, thumbnails, product-photos)
  21. Email System (queue, templates, dispatch cron, unsubscribe)
  22. Integrations (Shopify connector, Lovable AI Gateway)
  23. Accessibility (a11y features, keyboard shortcuts)
  24. Performance (lazy routes, manual chunks, mobile-first)
  25. Admin Dashboard (all tabs, sub-tools)

Part 3 — Operations
  26. Environments & Deployment (Vercel SPA routing)
  27. Secrets & Config
  28. Testing Strategy (Vitest, Playwright e2e specs)
  29. Monitoring & Logging
  30. Security Posture & Known Constraints
  31. Runbooks (email dead-letter, admin escalation, guest orders)

Part 4 — Roadmap
  32. Post-MVP Roadmap
  33. KPIs & Success Metrics
  34. Open Questions & Risks

Appendix
  A. Route table
  B. DB table cheatsheet
  C. Edge function endpoints
  D. Glossary
```

## Style

- Cover page: dark navy banner block, title, subtitle, version, date.
- Headings: Arial bold, black.
- Tables for stack, routes, tables, RLS policies, edge functions, KPIs — using DXA widths, light gray borders, subtle blue header shading (`#D5E8F0`), CLEAR shading only.
- No emojis. No purple/indigo gradient references in the doc chrome (keep the brand mention factual).
- Footer: "SmartCard MVP Handbook — Page X".

## Out of scope

- No changes to app source code.
- No screenshots of the live app (can add in a later revision if wanted).
- No investor pitch deck; this is a written handbook.

## Verification

1. `validate_document.py` returns OK.
2. Convert DOCX → PDF → JPG per page; inspect every page for overflow, clipped tables, black shading bugs, empty pages, TOC alignment.
3. Fix and re-render until a clean pass.
4. Emit `<presentation-artifact path="SmartCard-MVP-Handbook.docx" mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"></presentation-artifact>`.
