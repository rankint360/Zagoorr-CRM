# Zagoorr — Record Register

**Project:** Zagoorr (formerly Combined CRM) — one system combining HubSpot, Wayfront (formerly SPP / Service Provider Pro), Asana, and Zendesk
**Owner:** Linkoo
**Builder:** Muse
**Created:** 2026-11-16
**Last updated:** 2026-11-16 05:56 PST (America/Los_Angeles)
**Current status snapshot:** See `STATUS.md` in this same folder.

This register is the chronological source of truth. Every step — past and planned — is recorded here with its date, outcome, and evidence. Update it when a step starts, finishes, or changes.

## Previous steps — completed

### R-01 — Onboarding
- **Date:** 2026-10-22
- **Step:** App setup and onboarding.
- **Outcome:** Complete. User goes by Linkoo. Assistant named Muse.
- **Evidence:** Main chat, 2026-10-22.

### R-02 — Research: HubSpot CRM
- **Date:** 2026-11-16
- **Step:** Linkoo asked: "What is HubSpot CRM and which are its competitors?"
- **Outcome:** Complete. Answered: HubSpot is a customer platform built around one shared contact database, with Marketing, Sales, Service, Content, and Operations Hubs, free core CRM. Competitors listed: Salesforce, Zoho CRM, Pipedrive, Freshsales, monday CRM, Attio, Close, Microsoft Dynamics 365, ActiveCampaign, Marketo.

### R-03 — Research: SPP / Wayfront
- **Date:** 2026-11-16
- **Step:** Linkoo asked: "What is SPP.IO CRM / WayFront.com?"
- **Outcome:** Complete. Answered: Wayfront (formerly Service Provider Pro / SPP.co) is a client portal and billing platform for productised service agencies. Rebranded from SPP.co to Wayfront in February 2026, domain wayfront.com. Founded 2014, operated by Client Solutions Ltd. Covers client portal, checkout, invoices, intake, orders, projects, support, CRM, and reporting on the same client record. Not a general-purpose CRM.

### R-04 — Idea: Combined CRM
- **Date:** 2026-11-16
- **Step:** Linkoo asked: "Can we build a combined CRM, combining features from 'HubSpot CRM' and 'spp.co/Wayfront.com' in our one CRM?"
- **Outcome:** Complete. Answer: Yes. HubSpot is strong on the front end (sales/marketing), Wayfront is strong on delivery (storefront/portal/billing). Combined on one client record: Prospect → Lead → Paid order → Intake → Delivery → Support → Renewal.

### R-05 — Roles: Asana and Zendesk
- **Date:** 2026-11-16
- **Step:** Linkoo asked: "What is the role of Asana and Zendesk in it?"
- **Outcome:** Complete. Answer: Asana = delivery (tasks, SOPs, assignees, due dates after a client pays). Zendesk = support (helpdesk, tickets, client messages after delivery). In the combined CRM both become built-in modules — Projects and Support — on the same client record, not separate tools.

### R-06 — Confirmation of scope
- **Date:** 2026-11-16
- **Step:** Linkoo asked: "It means we will build our CRM combing features from HubSpot, Wayfront, Asana, Zendesk etc.?"
- **Outcome:** Complete. Confirmed: Yes. One CRM taking HubSpot for sales + marketing, Wayfront for storefront / portal + billing, Asana for delivery / projects, Zendesk for support, all on the same client record.

### R-07 — Choice: Plan first
- **Date:** 2026-11-16
- **Step:** Linkoo chose "Make a plan first" over "Build a working prototype" (offered as options).
- **Outcome:** Complete. Plan to be built before prototype.

### R-08 — Plan built
- **Date:** 2026-11-16
- **Step:** Build the Combined CRM Plan.
- **Outcome:** Complete. 8-page PDF delivered.
- **Artifact:** `Combined CRM Plan`, slug `combined-crm-plan`
- **Location:** `~/workspace/your_files/combined-crm-plan/combined-crm-plan.pdf`
- **Contents:** Page 1 vision; Page 2 source mapping; Page 3 architecture — 7 modules; Page 4 core data model; Page 5 key workflows; Page 6 roadmap (Phase 1 MVP, Phase 2 Depth, Phase 3 Scale); Page 7 technology & roles; Page 8 risks & 5 decisions needed before detailed design.
- **Assumptions in plan:** Timelines phased rather than dated; first target user is a productised service agency.

### R-09 — Decision 1: First user
- **Date:** 2026-11-16
- **Step:** Go through the 5 decisions from the plan, page 8.
- **Outcome:** Complete. Answer: Own agency first, then sell to other agencies.

### R-10 — Decision 2: Build route
- **Date:** 2026-11-16
- **Step:** Decision 2 from the plan.
- **Outcome:** Complete. Answer: Muse will build.

### R-11 — Decision 3: Payments
- **Date:** 2026-11-16
- **Step:** Decision 3 from the plan.
- **Outcome:** Complete. Answer: Provider, currencies, and tax regions for day one — Stripe or any alternative, keep hold until build and deploy is final. No live payments in prototype.

### R-12 — Decision 4: Services
- **Date:** 2026-11-16
- **Step:** Decision 4 from the plan.
- **Outcome:** Complete. Answer: Digital Marketing, SEO, Link Building. Linkoo will give exact service details after build is complete.

### R-13 — Decision 5: Migration
- **Date:** 2026-11-16
- **Step:** Decision 5 from the plan. Linkoo asked for clarification: "Migration — did not understand your concerns?"
- **Outcome:** Complete. Explained: migration = what data moves from current tools, what is deliberately left behind. Answer: Starting fresh — nothing to move. No data to import.

### R-14 — Choice: Start Phase 1 prototype
- **Date:** 2026-11-16
- **Step:** After all 5 decisions, Linkoo chose "Start the Phase 1 prototype" over "Show me the Phase 1 spec first".
- **Outcome:** Complete. Prototype build started.

### R-15 — Phase 1 prototype built
- **Date:** 2026-11-16
- **Step:** Build Phase 1 prototype.
- **Outcome:** Complete and live.
- **Artifact:** Combined CRM - Phase 1 Prototype, slug `combined-crm-phase-1-prototype`
- **Scope delivered:** Contacts + Deal Pipeline (HubSpot), Storefront with Digital Marketing, SEO, Link Building + Orders with intake (Wayfront/SPP), Projects & Tasks (Asana), Support tickets (Zendesk), all on one client record. Full loop verified: add contact → create deal → mark Won to create order → intake → delivery project → raise ticket, all visible on that contact's unified record.
- **Data:** Starts fresh, 0 contacts / deals / orders / projects / tickets at seed, 3 services seeded. Services editable.
- **Payments:** On hold, per Decision 3.
- **Verification:** Builder audit passed, no fix-before-attesting items.

### R-16 — Choice: Build Phase 2
- **Date:** 2026-11-16
- **Step:** Linkoo said: "Build phase 2"
- **Outcome:** Complete (request accepted). Phase 2 edit started on the Phase 1 prototype.

### R-17 — Record Register and STATUS.md built
- **Date:** 2026-11-16
- **Step:** Linkoo said: "Build a Record Register and STATUS.md and record all previous and coming steps in them."
- **Outcome:** Complete. This file and `STATUS.md` created in `~/workspace/combined-crm/`.
- **Files:**
  - `~/workspace/combined-crm/RECORD_REGISTER.md` (this file)
  - `~/workspace/combined-crm/STATUS.md`

## Previous steps — completed (continued)

### R-18 — Phase 2 build
- **Date:** 2026-11-16
- **Step:** Build Phase 2 — Depth.
- **Status:** Complete.
- **Delivered:** Activity timeline on every contact; Billing tab with draft/sent/paid/overdue invoices; live Reports tab; Client Portal preview; delivery templates; team directory. Payments tracking-only and on hold, client portal logins staged for Phase 3.
- **Verification:** Builder verified via actions — test contact, call activity, team member, template with 2 tasks, project and $1,500 invoice, reports computed correctly. Test rows only in sandbox DB; production still starts fresh.
- **Open:** Final rendering check at phone and desktop widths.

### R-19 — Phase 2 verification and delivery
- **Date:** 2026-11-16
- **Step:** Verify Phase 2 workflows and reporting; deliver updated prototype to Linkoo.
- **Status:** Complete. Delivered 2026-11-16 05:06 PST.

### R-25 — GitHub OAuth
- **Date:** 2026-11-16
- **Step:** GitHub OAuth authorization succeeded.
- **Status:** Complete for OAuth. App installation and repository access not yet verified. User was given the install link to select repositories; repo not yet decided.

### R-26 — Naming: deep screening
- **Date:** 2026-11-16
- **Step:** Linkoo asked to name the CRM before deciding a repo, with a fresh available .com. Then asked to deep-screen Clienterr.com, Zagoorr.com, Serypro.com, or suggest more branded names.
- **Status:** Complete. All three appeared available via Verisign RDAP 404 on 2026-11-16. Clienterr rejected for confusion with Clienter; Serypro rejected for confusion with Serpro. 22 more coined names checked, most taken; Clientoor.com and Clientlyo.com also appeared available.

### R-27 — Name picked: Zagoorr
- **Date:** 2026-11-16
- **Step:** Linkoo picked Zagoorr.com.
- **Status:** Complete. Name is Zagoorr, domain zagoorr.com. Domain not yet purchased, trademark not cleared.

## Coming steps — planned

### R-20 — Linkoo review of Phase 2
- **Step:** Linkoo walks a test client through lead-to-cash, order-to-delivery, and support-to-renewal in the prototype.
- **Status:** Planned. Any step that forces the user out of the system is a v1 bug, per the plan's success test.

### R-28 — Decide repo for Zagoorr
- **Step:** Pick/create the GitHub repo for Zagoorr, after verifying GitHub App installation / repo access.
- **Status:** Planned, next step.

### R-21 — Service details
- **Step:** Linkoo provides exact Digital Marketing, SEO, and Link Building package details after build is complete.
- **Status:** Planned, pending from Linkoo (Decision 4). Update the service catalogue when received.

### R-22 — Phase 3: Scale
- **Step:** Build Phase 3, per plan page 6.
- **Scope:**
  - Public API and integrations (accounting, calendar, chat, Zapier / Make-style connectors)
  - Advanced workflow builder, custom objects, multi-team permissions
  - White-label portal (own domain, branding), multi-currency and tax handling
  - AI assists where they earn it: ticket summaries, reply drafts, lead enrichment
- **Status:** Not started.

### R-23 — Payments decision
- **Step:** Choose payments provider (Stripe or alternative), currencies, and tax regions before deploy final.
- **Status:** On hold until build and deploy are final, per Decision 3.

### R-24 — Deploy final
- **Step:** Commit to production build.
- **Definition of done (Phase 1 exit test):** One real service sold, paid, onboarded, delivered, and supported entirely in the system.
- **Status:** Planned, after Phase 2 review and payments decision.

### R-29 — Repo chosen: rankint360/Zagoorr-CRM
- **Date:** 2026-11-16
- **Step:** Linkoo chose to use existing repo https://github.com/rankint360/Zagoorr-CRM.
- **Status:** Complete. Verified via GitHub search: found, public, owner rankint360, default branch main, 0 stars/forks/issues, created 2026-11-16. Repo was empty (409 Git Repository is empty on list commits).

### R-30 — Push everything to GitHub
- **Date:** 2026-11-16
- **Step:** Linkoo said: "push it there everything"
- **Status:** Complete. Pushed README.md, docs/STATUS.md, docs/RECORD_REGISTER.md, docs/combined-crm-plan-outline.md to rankint360/Zagoorr-CRM, branch main, commit 0ec4b3e1ad3d654db7a3afcc6063d0c24863a86b, verified by re-reading README, STATUS and Record Register from GitHub. Prototype is a hosted fullstack app and cannot be exported to a single .html file, so its server code is not in the push — the repo documents the prototype instead. Plan PDF binary was not pushed via the text-file API; outline is in the repo.

## How to use this register

- Add a new R-number for every new step, in order.
- Change a step's Status from Planned → In Progress → Complete, with date and outcome.
- If a decision changes, do not rewrite history — add a new entry noting what changed, when, and why, and update `STATUS.md`.
