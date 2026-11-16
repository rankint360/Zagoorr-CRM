# Zagoorr — STATUS

**Project:** Zagoorr (formerly Combined CRM) — one system combining HubSpot, Wayfront (formerly SPP / Service Provider Pro), Asana, and Zendesk
**Owner:** Linkoo
**Builder:** Muse
**Last updated:** 2026-11-16 06:02 PST (America/Los_Angeles)
**Record Register:** `RECORD_REGISTER.md` in this same folder — full chronological log of previous and coming steps.

## Current status

**Phase 2 complete. Name picked: Zagoorr. Repo chosen, pushing everything.**

- Plan: complete
- 5 decisions: complete
- Phase 1 prototype: complete and live
- Phase 2: complete and live
- Name: Zagoorr, zagoorr.com — picked 2026-11-16, domain not yet purchased, trademark not cleared
- GitHub: https://github.com/rankint360/Zagoorr-CRM — verified 2026-11-16, public, main branch, was empty at verification
- Phase 3: not started

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

Open from Phase 2 delivery: final rendering check at phone and desktop widths.

## Coming steps

1. **Push everything to GitHub** — complete 2026-11-16: README, plan outline, STATUS.md, Record Register pushed to rankint360/Zagoorr-CRM, commit 0ec4b3e1a.
2. **Buy zagoorr.com** — register the domain, and do trademark clearance before launch.
3. **Linkoo review of Phase 2** — walk a test client through lead-to-cash, order-to-delivery, and support-to-renewal.
4. **Service details** — Linkoo to provide exact Digital Marketing, SEO, and Link Building package details after build is complete; update the service catalogue.
5. **Phase 3 — Scale (not started):** Public API and integrations (accounting, calendar, chat, Zapier / Make-style connectors); advanced workflow builder, custom objects, multi-team permissions; white-label portal (own domain, branding), multi-currency and tax handling; AI assists where they earn it (ticket summaries, reply drafts, lead enrichment).
6. **Payments decision** — choose provider (Stripe or alternative), currencies, and tax regions before deploy final.
7. **Deploy final** — commit to production build with the Phase 1 exit test as definition of done: one real service sold, paid, onboarded, delivered, and supported entirely in the system.

## Open items / holds

- **Payments:** On hold until build and deploy are final — Decision 3.
- **Service details:** Pending from Linkoo after build is complete — Decision 4.
- **Domain:** zagoorr.com not yet purchased. Trademark not cleared.
- **GitHub repo:** rankint360/Zagoorr-CRM, verified and in use. Prototype is a hosted fullstack app in Muse and cannot be exported as a single .html file, so the repo holds the plan, records, and README — not the prototype server code.
- **Phase 2 rendering:** Final check at phone and desktop widths still open.

## How to update this file

Update this file whenever a phase finishes, a decision changes, or a new artifact is delivered. Keep the Record Register as the chronological source of truth; keep this file as the current snapshot.
