# Zagoorr

Zagoorr is a combined CRM for productised service agencies — one system, one client record, from prospect to renewal.

It combines:
- **HubSpot** — CRM, contacts, deals and pipeline
- **Wayfront (formerly SPP / Service Provider Pro)** — storefront, checkout, client portal and billing
- **Asana** — delivery, projects and tasks
- **Zendesk** — support tickets

One client record: Prospect → Lead → Paid order → Intake → Delivery → Support → Renewal.

- **Owner:** Linkoo
- **Builder:** Muse
- **Domain:** zagoorr.com — picked 2026-11-16, appeared available (RDAP 404). Not yet purchased. Trademark clearance not done.
- **Repo:** https://github.com/rankint360/Zagoorr-CRM
- **Status:** Phases 1, 2, 3 and 4 complete and live in Muse.
- **Logo:** Coral-orange loop icon — storefront on top, chat on the right, delivery boxes at the bottom, calendar on the left. Brand colour #FF6B4A. See `assets/zagoorr-logo.webp`.

## What is built so far

### Phase 1 — MVP
Contacts and companies, deals with one pipeline, activity timeline, service catalogue (Digital Marketing, SEO, Link Building), order forms, checkout and invoices, client portal (login, intake, file upload, invoice history), projects auto-created from orders, task templates, delivery board, tickets in one queue linked to client and order, basic automation (paid → project, intake → notify), roles Admin / Team / Client, basic dashboards.

### Phase 2 — Depth
Activity timeline on every contact, Billing tab with draft / sent / paid / overdue invoices, live Reports tab, Client Portal preview, delivery templates, team directory.

Payments stay tracking-only and on hold until build and deploy are final.

### Phase 3 — Scale
Client portal logins, public API tab with API keys, Integrations tab (QuickBooks, Xero, Google/Outlook Calendar, Slack, Teams, Zapier, Make), workflow builder that actually runs, custom fields and custom objects, Teams & roles permission matrix, white-label portal (portal.zagoorr.com), multi-currency and tax on invoices (tracking-only), AI assists (ticket summaries, reply drafts, lead enrichment).

### Phase 4 — Polish and review
Fixed all 19 delete/revoke buttons that used a browser confirm() dialog that did nothing in-app (now in-page two-tap confirms), added success/error toasts, closed loop gaps (deals can be marked Lost, orders can be cancelled, Storefront empty state, contact loading state), raised sub-36px tap targets, updated stale labels. Full loop re-verified, phone/desktop rendering checked.

## Decisions

1. First user: own agency first, then sell to other agencies
2. Build route: Muse will build
3. Payments: on hold until build and deploy are final (Stripe or alternative, provider / currencies / tax regions to be decided then)
4. Services: Digital Marketing, SEO, Link Building — exact details to come from Linkoo
5. Migration: starting fresh — nothing to move

## Files in this repo

- `README.md` — this file
- `docs/combined-crm-plan-outline.md` — outline of the 8-page plan (vision, source mapping, 7 modules, data model, workflows, roadmap, technology, risks, 5 decisions). The full PDF lives in Muse's files; the outline here is the text version.
- `docs/STATUS.md` — current snapshot
- `docs/RECORD_REGISTER.md` — full chronological log R-01 to R-34
- `assets/zagoorr-logo.webp` — chosen logo, coral-orange loop icon

## About the prototype

The Phase 1–4 prototype is a hosted fullstack app built in Muse (slug `combined-crm-phase-1-prototype`). It cannot be exported as a single HTML file, so its server code is not in this repo. This repo is the source of truth for the plan, decisions, and records, and the starting point for the production codebase.

## Coming next

- Buy zagoorr.com, trademark clearance
- Linkoo review — walk a test client through lead-to-cash, order-to-delivery, support-to-renewal
- Service details from Linkoo
- Payments decision, then deploy final — one real service sold, paid, onboarded, delivered, and supported entirely in the system
