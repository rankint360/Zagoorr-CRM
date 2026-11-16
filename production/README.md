# Zagoorr — Production Codebase v1

Zagoorr is a combined CRM for productised service agencies — one system, one
client record, from prospect to renewal. It combines HubSpot (CRM), Wayfront /
SPP (storefront, portal, billing), Asana (delivery), and Zendesk (support).

This repo is the production codebase: a Next.js (App Router, TypeScript)
monorepo with npm workspaces + Turborepo. It is the v1 foundation built from
the Phase 1–4 prototype spec, the Admin spec, and the homepage spec. It is
**not** the Muse prototype — that lives in Muse and its server code was never
exported. This repo is the deployable code.

## Domain map (approved by Linkoo)

One codebase, routed by hostname — not four separate apps.

| Host | App | What it is |
| --- | --- | --- |
| `zagoorr.com` | `apps/web` | Landing / marketing homepage (static) |
| `app.zagoorr.com` | `apps/app` | Agency SaaS — the CRM workspace |
| `admin.zagoorr.com` | `apps/admin` | Platform admin — Zagoorr staff only |
| `portal.zagoorr.com` | `apps/portal` | Client portal entry |
| `<agency>.portal.zagoorr.com` | `apps/portal` | An agency's portal (default) |
| `portal.<agency-domain>` (CNAME) | `apps/portal` | An agency's portal on its own domain |

Custom portals: an agency's clients log in at `<agency>.portal.zagoorr.com`
with email + access code and see only their own orders, delivery, invoices,
and tickets, under the agency's logo and brand colour. An agency can add a
CNAME (`portal.acmeagency.com` → `portal.zagoorr.com`) in Settings → Portal;
the portal app resolves custom domains from the `Agency.portalDomain` field.

## Repo layout

```
apps/
  web/      Landing homepage (zagoorr.com) — static, no DB
  app/      Agency SaaS (app.zagoorr.com) — Phases 1–4
  admin/    Platform admin (admin.zagoorr.com) — PLATFORM_ADMIN only
  portal/   Client portal (portal.zagoorr.com) — CLIENT role only
packages/
  ui/       Shared design system: coral #FF6B4A, navy #0F1B2D, Logo,
            Button, Card, Badge, EmptyState, TwoTapConfirm
  db/       Prisma schema + client (Postgres)
  auth/     Roles, sessions, portal access codes, API keys, tenant helpers
```

### What each app covers

- **apps/web** — Hero with agency signup form, social-proof band (stats and
  testimonials are labelled placeholders — swap for real Zagoorr stories),
  interactive 8-module product tour (CRM, Order forms, Client portal,
  Onboarding, Project management, Messaging, Subscriptions, Reporting),
  chaos-to-clarity section, 5-step workflow, services (Digital Marketing,
  SEO, Link Building), CTA + footer.
- **apps/app** — Dashboard, Contacts (+ activity timeline), Deals pipeline
  (Won auto-creates Order + Project; Lost supported), Orders (cancel),
  Projects + tasks + delivery templates, Tickets (AI summary shown only as
  a labelled draft), Billing (invoices draft/sent/paid/overdue, multi-currency
  + tax, tracking only), Reports, Client Portal preview + portal logins,
  Settings (white-label, API keys, integrations, workflows, custom fields,
  team directory). API routes for contacts, deals, orders, projects, tickets,
  invoices, portal accounts, API keys, workflows — all tenant-scoped.
- **apps/admin** — Platform overview, Agencies (tenant control, plans, seats,
  activate/suspend/cancel), Users, Plans & billing (tracking only), Portals &
  domains, Integrations, Feature flags, Audit trail, Platform settings
  (domains, public signups, maintenance mode).
- **apps/portal** — Email + access-code login, own orders with delivery
  progress, own invoices (view-only), own tickets (raise + list), intake
  form. Every query is filtered by `agencyId` **and** `contactId`.

### Subdomain / tenant routing

- **Portal (`apps/portal/middleware.ts` + `lib/tenant.ts`)**: middleware
  extracts the subdomain from `<agency>.portal.zagoorr.com` into the
  `x-zagoorr-agency` request header; `resolveAgencyFromHost()` then resolves
  subdomain → agency slug, else custom CNAME (`Agency.portalDomain == host`),
  else null. (The DB lookup lives in `lib/tenant.ts`, not middleware, because
  middleware runs on the Edge runtime and cannot use Prisma.) Every page and
  API route also checks the session's `agencyId` matches the resolved agency.
- **Agency app (`apps/app/middleware.ts`)**: redirects `admin.*` and
  `portal.*` hosts to the right app URL.
- **Admin (`apps/admin/middleware.ts`)**: requires a `PLATFORM_ADMIN`
  session for every route except `/login`.
- **Data isolation**: every tenant-scoped query uses `tenantWhere(agencyId)`
  from `@zagoorr/auth`. Portal queries add `contactId` as well.

## Payments — ON HOLD (Decision 3)

Billing is **tracking only**. Invoices and subscriptions record amounts and
status; there is no Stripe integration, no payment provider, and no payment
keys anywhere in this repo. Do not add live payments until the payments
decision is made (provider, currencies, tax regions).

## Production data

Production starts fresh. The only seed data is the three services —
Digital Marketing, SEO, Link Building — defined in
`packages/db/src/index.ts` (`DEFAULT_SERVICES`), to be seeded per new agency.
No demo agencies, contacts, deals, or invoices are seeded.

## Getting started (local)

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL + SESSION_SECRET
npm run db:generate          # generate the Prisma client
npm run db:push              # create tables in your Postgres DB
npm run dev                  # all apps (web :3000, app :3001, portal :3002, admin :3003)
```

Per-app: `npm run dev --workspace=zagoorr-app` etc.

## Deployment (Vercel — recommended)

1. **Buy the domain** — `zagoorr.com` (not yet purchased at v1).
2. **Database** — create a Postgres database (Neon or Supabase) and set
   `DATABASE_URL` in Vercel.
3. **Create four Vercel projects** from this one repo, one per app, each with
   its Root Directory set to the app folder:
   - `apps/web` → domain `zagoorr.com` (+ `www.zagoorr.com`)
   - `apps/app` → domain `app.zagoorr.com`
   - `apps/admin` → domain `admin.zagoorr.com`
   - `apps/portal` → domains `portal.zagoorr.com` **and the wildcard
     `*.portal.zagoorr.com`** (Vercel → Domains → add `*.portal.zagoorr.com`;
     add a DNS wildcard `*.portal` CNAME/A record at your registrar pointing
     at Vercel). Custom CNAME domains per agency are added in the Admin app
     (Portals & domains) and verified there; each custom domain also needs to
     be added to the portal Vercel project (or via the Vercel API) before it
     resolves.
4. **Environment variables** (per project): `DATABASE_URL`, `SESSION_SECRET`,
   `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PORTAL_URL`,
   `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_SITE_URL`. Never commit real values.
5. **Deploy** — push to `main`; Vercel builds each project. Run
   `prisma db push` (or `prisma migrate deploy` once migrations exist)
   against the production database before first use.
6. **DNS** — at the registrar: `zagoorr.com` + `www`, `app`, `admin`,
   `portal`, and `*.portal` all point at Vercel (A/CNAME as Vercel shows).
   SSL is automatic on Vercel, including wildcard.

### Alternatives

- **Cloudflare Pages + Workers** — cheaper, good wildcard/custom-domain
  support, more setup.
- **Railway / Render** — traditional server hosting if you prefer a single
  long-running server over serverless.

## Stubs left deliberately in v1 (and why)

- **Signup API (`apps/web`)** — validates and returns `{ok:true}` only; no
  DB write or welcome email until the backend is wired up.
- **AI assists** — ticket summaries / reply drafts are derived only from the
  ticket's own text and labelled "AI draft — review before sending". No AI
  provider is called and no API key is required.
- **Integrations** — toggles record connection state only. OAuth flows for
  QuickBooks, Xero, Slack, etc. are not implemented.
- **Portal custom domains** — "Mark verified" records a manual check;
  automated DNS/CNAME verification is a follow-up.
- **Auth hardening** — sessions are the base64url cookie scheme in
  `packages/auth`; real SSO, signed sessions, login rate limiting/lockout,
  and failed-login auditing are follow-ups. Passwords use the shared
  `hashSecret` (SHA-256, salted) — upgrade to bcrypt/argon2 in hardening.
- **Plans API (admin)** — GET only; plans are seeded (STARTER/GROWTH/SCALE),
  no plan editor yet.
- **MRR (admin)** — PAID invoices in the last 30 days, summed as minor
  units; proper multi-currency reporting is a follow-up.
- **Intake file uploads (portal)** — text links only; no file-upload endpoint
  yet. Ticket reply sending is not wired up (draft is copyable text).
- **No seed data** — see "Production data" above.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | All apps in dev (Turbo) |
| `npm run build` | Build all apps |
| `npm run typecheck` | Typecheck all apps |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push the Prisma schema to the DB |
| `npm run db:migrate` | Create a Prisma migration (dev) |
