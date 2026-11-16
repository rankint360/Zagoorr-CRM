# Zagoorr — STATUS

**Project:** Zagoorr (formerly Combined CRM) — one system combining HubSpot, Wayfront (formerly SPP / Service Provider Pro), Asana, and Zendesk
**Owner:** Linkoo
**Builder:** Muse
**Last updated:** 2026-11-16 08:37 PST (America/Los_Angeles)
**Record Register:** `RECORD_REGISTER.md` in this same folder — full chronological log of previous and coming steps.

## Current status

**Phase 4 complete. Logo chosen and in the app and repo. Pushing Phase 3 + 4 docs now.**

- Plan: complete
- 5 decisions: complete
- Phase 1 prototype: complete and live, pushed to GitHub
- Phase 2: complete and live, pushed to GitHub
- Phase 3: complete and live
- Phase 4: complete and live
- Logo: chosen 2026-11-16 — coral-orange loop icon, storefront on top, chat on the right, delivery boxes at the bottom, calendar on the left. Brand colour #FF6B4A. In the app header, portal header, and white-label preview. In the repo at assets/zagoorr-logo.webp (commits 44228ea, 9257d91).
- Name: Zagoorr, zagoorr.com — picked 2026-11-16, domain not yet purchased, trademark not cleared
- GitHub: https://github.com/rankint360/Zagoorr-CRM — includes plan PDF, README, STATUS, Record Register, and assets/zagoorr-logo.webp. Phase 3 + 4 docs push in progress.

## Name

- **Name:** Zagoorr
- **Domain:** zagoorr.com
- **Picked:** 2026-11-16, by Linkoo
- **Domain check:** Appeared available via Verisign RDAP (404) on 2026-11-16 13:35 UTC. Final availability only at registrar checkout.
- **Rejected names:** Clienterr.com (confusion with Clienter), Serypro.com (confusion with Serpro). Clientoor.com and Clientlyo.com also appeared available as alternatives.
- **Not yet done:** Buy/register zagoorr.com, trademark clearance.

## What is built so far

### Plan — complete, 2026-11-16
- **File:** `Combined CRM Plan` — 8 pages, PDF
- **Location:** `~/workspace/your_files/combined-crm-plan/combined-crm-plan.pdf`
- Covers: vision (one client record: Prospect → Lead → Paid order → Intake → Delivery → Support → Renewal), source mapping from each product, 7 modules, core data model, 3 workflows (lead-to-cash, order-to-delivery, support-to-renewal), phased roadmap, technology / roles, risks, and the 5 decisions.

### Phase 1 prototype — complete and live, 2026-11-16
- **Artifact:** Combined CRM - Phase 1 Prototype
- **Slug:** `combined-crm-phase-1-prototype`
- **Scope (MVP):** Contacts, Companies, Deals with one pipeline, activity timeline; service catalogue, order forms, checkout and invoices (payments on hold — test/mock only, no real charges); client portal (login, intake, file upload, invoice history); projects auto-created from orders, task templates, delivery board; tickets in one queue linked to client and order; basic automation (paid → project, intake → notify); roles Admin / Team / Client; basic dashboards (pipeline, revenue, open projects, open tickets).
- **Services seeded:** Digital Marketing, SEO, Link Building — editable, exact details to come from Linkoo later.
- **Data:** Starts fresh, no imported data.
- **Verified:** Builder audit passed. Contacts, deals, orders, projects, services, tasks, tickets linked to one contact; dashboard empty-state counts correct.

## Decisions — all 5 complete, 2026-11-16

| # | Decision | Answer |
|---|---|---|
| 1 | First user | Own agency first, then sell to other agencies |
| 2 | Build route | Muse will build |
| 3 | Payments | On hold until build and deploy are final. Stripe or alternative, provider / currencies / tax regions to be decided then. No live payments in prototype. |
| 4 | Services | Digital Marketing, SEO, Link Building. Linkoo will give exact service details after build is complete. |
| 5 | Migration | Starting fresh — nothing to move. No data to import from other tools. |

## Phase 2 — complete, 2026-11-16

**Goal:** Depth — make it pleasant and efficient at volume.

Delivered on top of the Phase 1 prototype:
- Activity timeline on every contact (calls, emails, meetings, notes)
- Billing tab with invoices as draft / sent / paid / overdue, with outstanding, overdue and paid totals
- Live Reports tab (pipeline funnel, win rate, won revenue, delivery task completion, support resolution)
- Client Portal preview (orders with progress, delivery progress, invoices, raise-a-ticket form)
- Delivery templates (save SOP checklists, apply to a project in one tap)
- Team directory for assigning tasks

Payments remain tracking-only and on hold, per Decision 3. Client portal logins are staged for Phase 3.

Open from Phase 2 delivery: final rendering check at phone and desktop widths — closed in Phase 4, exit audit covered phone/desktop rendering.

## Phase 3 — complete, 2026-11-16

Delivered: client portal logins, public API tab with API keys, Integrations tab (QuickBooks, Xero, Google/Outlook Calendar, Slack, Teams, Zapier, Make), workflow builder that actually runs, custom fields and custom objects, Teams & roles permission matrix, white-label portal (portal.zagoorr.com), multi-currency and tax on invoices (tracking-only), AI assists (ticket summaries, reply drafts, lead enrichment). Payments stayed on hold.

## Phase 4 — complete, 2026-11-16

Polish and review, chosen by Linkoo over go-live. Fixed a real bug: all 19 delete/revoke buttons used a browser confirm() dialog that did nothing in-app — now in-page two-tap confirms. Added success/error toasts, closed loop gaps (deals can be marked Lost, orders can be cancelled, Storefront empty state, contact loading state), raised sub-36px tap targets, updated stale Phase 3 labels. Full loop re-verified end-to-end.

## Logo — chosen, 2026-11-16

Coral-orange loop icon, storefront on top, chat on the right, delivery boxes at the bottom, calendar on the left. Brand colour #FF6B4A. In the app header, portal header, and white-label preview. In the repo at assets/zagoorr-logo.webp. Other variants made the same day: teal-blue full logo, coral, violet, emerald, and rose icons.

## Coming steps

1. **Push Phase 3 + 4 docs and logo record to GitHub** — in progress 2026-11-16: updated README, STATUS.md, Record Register to rankint360/Zagoorr-CRM.
2. **Buy zagoorr.com** — register the domain, and do trademark clearance before launch.
3. **Linkoo review** — walk a test client through lead-to-cash, order-to-delivery, and support-to-renewal.
4. **Service details** — Linkoo to provide exact Digital Marketing, SEO, and Link Building package details after build is complete; update the service catalogue.
5. **Payments decision** — choose provider (Stripe or alternative), currencies, and tax regions before deploy final.
6. **Deploy final** — commit to production build with the Phase 1 exit test as definition of done: one real service sold, paid, onboarded, delivered, and supported entirely in the system.

## Open items / holds

- **Payments:** On hold until build and deploy are final — Decision 3.
- **Service details:** Pending from Linkoo after build is complete — Decision 4.
- **Domain:** zagoorr.com not yet purchased. Trademark not cleared.
- **GitHub repo:** rankint360/Zagoorr-CRM, verified and in use. Prototype is a hosted fullstack app in Muse and cannot be exported as a single .html file, so the repo holds the plan, records, README, and logo — not the prototype server code.

## How to update this file

Update this file whenever a phase finishes, a decision changes, or a new artifact is delivered. Keep the Record Register as the chronological source of truth; keep this file as the current snapshot.
