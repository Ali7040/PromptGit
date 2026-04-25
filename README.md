<div align="center">

# Promptgit

**Git for your AI prompts — version control, collaboration, and a marketplace for prompt engineers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/Ali7040/PromptGit?style=social)](https://github.com/Ali7040/PromptGit/)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da)](https://discord.gg/yourinvite)

[Website](https://promptgit.dev) · [Documentation](https://docs.promptgit.dev) · [Marketplace](https://promptgit.dev/marketplace) · [Discord](https://discord.gg/ePzKHM22kY) · [Report Bug](https://github.com/Ali7040/promptgit/issues)

</div>

---

## What is PromptGit?

PromptGit is an **open-source developer tool** that brings software engineering discipline to AI prompt management. Think of it as GitHub + npm — but built entirely for prompts and AI workflows.

Teams using AI today store prompts in Notion docs, Slack messages, or plain text files. When a prompt breaks, nobody knows what changed. When two people improve the same prompt, one person's work gets lost. PromptGit solves this with a proper version control system, team collaboration layer, eval runner, and a public marketplace where creators can share and sell prompt packs.

```bash
# Install the CLI
pip install promptGit

# Push your first prompt
promptGit push ./my-prompt.md --name "customer-support-agent" --env staging

# See what changed between versions
promptGit diff v1.2.0 v1.3.0

# Pull a prompt pack from the marketplace
promptGit install @community/code-reviewer
```

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Roadmap & Phases](#roadmap--phases)
- [Marketplace](#marketplace)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [Self-Hosting](#self-hosting)
- [License](#license)

---

## Features

### Core (Free & Open Source)
- **Version control** — every prompt change is tracked with a content-addressable hash, full diff view, and commit messages
- **CLI** — `push`, `pull`, `diff`, `tag`, `deploy` — works like Git, feels familiar in seconds
- **Visual diff UI** — side-by-side prompt comparison with character-level change highlighting
- **Environment tagging** — promote prompts through `dev → staging → production` just like code
- **Variable system** — define `{variables}` in prompts and manage them per-environment
- **SDK** — official Python and JavaScript/TypeScript clients for runtime prompt fetching

### Team (Cloud / Pro)
- **Team workspaces** — invite members, assign roles (Admin, Editor, Viewer)
- **Prompt playground** — test any prompt version against any model directly in the browser
- **Eval runner** — run a prompt against a test suite of inputs and score it automatically
- **GitHub Actions integration** — validate and deploy prompts as part of your CI/CD pipeline
- **Slack & webhook notifications** — get alerted when a prompt is changed or promoted to production
- **Audit log** — full history of who changed what and when

### Marketplace
- **Free community prompts** — open prompts anyone can download and use instantly
- **Premium prompt packs** — creators publish curated packs; platform takes 20% revenue share
- **4 featured categories** — AI coding assistants, business automation, marketing & copywriting, data analysis & research
- **Fork & improve** — fork any public prompt into your workspace and iterate on it
- **Ratings & reviews** — community-driven quality signal on every prompt

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│   React Web App   │   CLI (Python)   │   SDK (JS / Python)  │
└───────────┬───────────────┬──────────────────┬──────────────┘
            │               │                  │
            ▼               ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS API Server                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ Version Engine│  │ Auth & Teams │  │  Eval Runner      │ │
│  │ hash + diff  │  │ orgs, roles  │  │  A/B test prompts │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  Marketplace │  │  Analytics   │  │  Webhooks         │ │
│  │  packs, pay  │  │  usage, stats│  │  GitHub, Slack    │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
└───────────┬───────────────────────────────────┬─────────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│     PostgreSQL        │           │        Redis           │
│  prompts, versions    │           │  sessions, rate limit  │
│  users, orgs, evals   │           │  job queues, cache     │
│  marketplace, sales   │           │  real-time pub/sub     │
└───────────────────────┘           └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│   Object Storage      │
│   (S3 / Cloudflare R2)│
│   eval results, blobs │
└───────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Backend** | [NestJS](https://nestjs.com/) (TypeScript) | Modular, enterprise-grade, built-in DI and guards |
| **Frontend** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) | Fast dev experience, huge ecosystem |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational integrity for versions, orgs, billing |
| **Cache / Queue** | [Redis](https://redis.io/) | Rate limiting, session store, BullMQ job queues |
| **ORM** | [Prisma](https://www.prisma.io/) | Type-safe DB access, easy migrations |
| **Auth** | JWT + Refresh tokens + OAuth (GitHub, Google) | Developer-friendly login options |
| **Object Storage** | [Cloudflare R2](https://www.cloudflare.com/r2/) | S3-compatible, zero egress fees |
| **Payments** | [Lemon Squeezy](https://www.lemonsqueezy.com/) | Global payments, handles VAT/tax, great for international founders |
| **Email** | [Resend](https://resend.com/) | Developer-first transactional email, generous free tier |
| **CLI** | Python ([Typer](https://typer.tiangolo.com/)) | Most AI engineers use Python; familiar tooling |
| **JS SDK** | TypeScript | For Node.js / Next.js runtime prompt fetching |
| **Queue** | [BullMQ](https://bullmq.io/) (on Redis) | Eval runs, email delivery, webhook dispatching |
| **Deployment** | [Railway](https://railway.app/) or [Render](https://render.com/) | Zero-config deploys, free tier to start |
| **CI/CD** | GitHub Actions | Automated tests, lint, deploy on merge |
| **Monitoring** | [Sentry](https://sentry.io/) + [Pino](https://getpino.io/) logging | Error tracking + structured logs |

> **Why NestJS over Express?** NestJS gives you modules, guards, interceptors, and dependency injection out of the box — critical for a product that will have auth, billing, webhooks, and background jobs running together. It scales cleanly from solo project to team codebase.

> **Missing piece — Full-text search:** As the marketplace grows, you'll need fast prompt search. Add [Meilisearch](https://www.meilisearch.com/) (open source, self-hostable) once you have 500+ prompts. It has a generous free tier and can be added in Phase 3 without changing your schema.

> **Missing piece — Rate limiting:** Use NestJS's built-in `ThrottlerModule` backed by Redis for API rate limiting from day one. Free users get 100 API calls/min, Pro users get 1000/min.

---

## Project Structure

```
promptGit/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/                 # JWT, OAuth, guards
│   │   │   ├── prompts/              # Prompt CRUD, versioning engine
│   │   │   ├── teams/                # Workspaces, members, roles
│   │   │   ├── marketplace/          # Packs, purchases, creator payouts
│   │   │   ├── evals/                # Eval runner, test suites, scoring
│   │   │   ├── webhooks/             # GitHub, Slack outgoing webhooks
│   │   │   ├── analytics/            # Usage stats, download counts
│   │   │   ├── billing/              # Lemon Squeezy integration
│   │   │   ├── storage/              # R2 / S3 object storage service
│   │   │   └── common/               # Guards, interceptors, pipes, utils
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Full DB schema
│   │   │   └── migrations/
│   │   └── test/
│   │
│   └── web/                          # React frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── dashboard/        # Prompt list, workspace home
│       │   │   ├── prompt/           # Version history, diff view, playground
│       │   │   ├── marketplace/      # Browse, search, purchase packs
│       │   │   ├── settings/         # Team, billing, API keys
│       │   │   └── auth/             # Login, signup, OAuth
│       │   ├── components/
│       │   │   ├── diff-viewer/      # Core diff rendering component
│       │   │   ├── playground/       # Live prompt testing UI
│       │   │   └── eval-chart/       # Eval results visualisation
│       │   ├── hooks/
│       │   ├── api/                  # Typed API client (fetch wrapper)
│       │   └── store/                # Zustand global state
│       └── public/
│
├── packages/
│   ├── cli/                          # Python CLI (pip install promptGit)
│   │   ├── promptGit/
│   │   │   ├── commands/             # push, pull, diff, tag, install
│   │   │   └── client.py             # HTTP client for the API
│   │   └── pyproject.toml
│   │
│   └── sdk-js/                       # JavaScript / TypeScript SDK
│       ├── src/
│       │   └── index.ts              # getPrompt(), listVersions(), etc.
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, typecheck on PR
│       └── deploy.yml                # Deploy to Railway on main merge
│
├── docker-compose.yml                # Local dev: postgres + redis + api + web
├── docker-compose.prod.yml           # Production compose override
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Git

### Local development (5 minutes)

**1. Clone the repo**

```bash
git clone https://github.com/yourusername/promptGit.git
cd promptGit
```

**2. Start infrastructure (Postgres + Redis)**

```bash
docker-compose up -d postgres redis
```

**3. Set up the API**

```bash
cd apps/api
cp .env.example .env          # fill in your values (see Environment Variables)
npm install
npx prisma migrate dev        # runs all migrations
npx prisma db seed            # seeds demo data
npm run start:dev             # starts on http://localhost:3000
```

**4. Set up the web app**

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev                   # starts on http://localhost:5173
```

**5. Install the CLI**

```bash
cd packages/cli
pip install -e .              # installs in editable mode
promptGit login               # authenticate with your local instance
```

You should now have the full stack running locally. Visit `http://localhost:5173` to see the dashboard.

### Docker (full stack)

```bash
docker-compose up             # starts everything: api, web, postgres, redis
```

---

## Roadmap & Phases

### Phase 1 — Core Version Control *(Weeks 1–4)*

The foundation. Everything else builds on this.

- [ ] NestJS project scaffold with modules, guards, Prisma
- [ ] PostgreSQL schema: `users`, `workspaces`, `prompts`, `prompt_versions`
- [ ] JWT auth with email/password + GitHub OAuth
- [ ] `POST /prompts` — create a prompt
- [ ] `POST /prompts/:id/versions` — push a new version (stores content hash)
- [ ] `GET /prompts/:id/versions` — list version history
- [ ] `GET /prompts/:id/diff?from=v1&to=v2` — line-level diff between versions
- [ ] Python CLI — `push`, `pull`, `diff`, `log` commands
- [ ] React dashboard — prompt list, version timeline, diff viewer
- [ ] Redis — session store + API rate limiting via `ThrottlerModule`
- [ ] GitHub Actions CI — lint + test on every PR
- [ ] Docker Compose for local dev

**Milestone:** A developer can `pip install promptGit`, push a prompt, and see its full version history in the browser. Self-hostable from day one.

---

### Phase 2 — Teams & Environments *(Weeks 5–8)*

Turn a solo tool into a team product — this is where the SaaS billing starts.

- [ ] `workspaces` and `workspace_members` with roles (`owner`, `admin`, `editor`, `viewer`)
- [ ] Invite by email with token-based acceptance flow
- [ ] Environment system — `dev`, `staging`, `production` tags per version
- [ ] `POST /prompts/:id/promote` — promote a version to an environment
- [ ] API key management — generate scoped keys for CI/CD use
- [ ] Prompt playground — test any version against GPT-4 / Claude / Gemini in the browser
- [ ] Lemon Squeezy billing integration — Free and Pro plans
- [ ] Stripe webhook listener for subscription lifecycle events
- [ ] Billing guards on NestJS routes (check plan limits)
- [ ] Resend email — invites, password reset, billing receipts
- [ ] Audit log — `workspace_events` table, UI timeline

**Milestone:** Teams can collaborate on prompts, promote them to production, and pay for a Pro plan. Revenue starts here.

---

### Phase 3 — Eval Runner *(Weeks 9–11)*

The killer feature that justifies the Pro price point.

- [ ] `test_suites` table — a named collection of `{input, expected_output}` pairs
- [ ] `eval_runs` table — records each run: version, test suite, model, scores
- [ ] BullMQ job queue (on Redis) — async eval execution so UI doesn't block
- [ ] Eval scoring — exact match, contains, LLM-as-judge (call GPT to score)
- [ ] Eval results UI — pass/fail per test case, accuracy % over versions chart
- [ ] `promptgit eval run --suite my-suite --version v1.3` CLI command
- [ ] GitHub Actions integration — `uses: promptgit/eval-action@v1` step
- [ ] R2 / S3 storage — save full eval result JSON for download
- [ ] Meilisearch — add full-text search across prompts and versions

**Milestone:** A team can set up a test suite, run evals automatically on every prompt change via CI, and track accuracy over time on a chart.

---

### Phase 4 — Marketplace *(Weeks 12–16)*

The growth engine and second revenue stream.

- [ ] `packs` table — name, description, price, category, creator, prompt list
- [ ] `pack_purchases` table — buyer, pack, amount, payout status
- [ ] Creator onboarding — connect Lemon Squeezy payout account
- [ ] Marketplace browse page — category filters, sort by downloads / rating / newest
- [ ] Individual pack page — prompt previews, creator bio, reviews
- [ ] Purchase flow — Lemon Squeezy checkout → webhook → unlock pack in buyer's workspace
- [ ] Creator dashboard — sales count, revenue, payout history
- [ ] 20% platform revenue share — calculated and recorded on each sale
- [ ] Free prompt pages — public SEO-optimised pages for every free prompt
- [ ] Ratings & reviews — `pack_reviews` table, 1–5 stars + comment
- [ ] `promptgit install @creator/pack-name` CLI command
- [ ] Fork to workspace — copy any public prompt into your private workspace
- [ ] Sitemap generation — auto-generate sitemap for all public prompt pages (SEO)
- [ ] **Seed with your own 4 packs** — one per category, published at launch

**Categories at launch:**
- `AI coding assistants` — code reviewer, full-stack dev pack, Cursor/Copilot mega pack
- `Business automation` — meeting summariser, customer support agent, ops bundle
- `Marketing & copywriting` — LinkedIn writer, cold email kit, content marketing OS
- `Data analysis & research` — CSV insight extractor, research assistant, analyst pro bundle

**Milestone:** The marketplace is live, your own 4 packs are published and making sales, and third-party creators can sign up and earn.

---

### Phase 5 — Scale & Polish *(Week 17+)*

Stability, growth, and community.

- [ ] VS Code extension — view and push prompts from inside the editor
- [ ] Prompt commenting — inline comments on specific lines of a prompt version
- [ ] Organisations — nested teams under a parent org with centralised billing
- [ ] SSO / SAML — for Business plan enterprise customers
- [ ] Prompt templates — parameterised packs that buyers can customise on install
- [ ] Usage analytics — per-prompt call volume, latency, cost (for SDK users)
- [ ] Public profile pages — `/u/creator-name` with their published packs and reputation
- [ ] Pino structured logging + Sentry error tracking in production
- [ ] Docs site — built with [Docusaurus](https://docusaurus.io/) at `docs.promptgit.dev`
- [ ] OpenAPI spec — auto-generated from NestJS decorators, published at `/api/docs`
- [ ] Community Discord — launch with a #prompt-showcase channel

---

## Marketplace

promptgit Marketplace is a public registry of free and premium prompt packs built by the community.

### For users

```bash
# Browse and install any free pack
promptgit install @community/code-reviewer

# Purchase and install a premium pack
promptgit install @ali/full-stack-dev-pack    # prompts to pay if needed

# List installed packs
promptgit packs list

# Use a prompt from an installed pack
promptgit run code-reviewer --var "code=$(cat my_file.py)"
```

### For creators

1. Create an account at [promptgit.dev](https://promptgit.dev)
2. Connect your Lemon Squeezy payout account in Settings → Payouts
3. Create a pack with at least 3 prompts
4. Set a price (or make it free)
5. Publish — your pack gets its own SEO-optimised page immediately

**Revenue share:** Creators keep **80%** of every sale. Payouts are processed monthly with a $20 minimum threshold.

### Categories

| Category | Target audience | Avg pack price |
|---|---|---|
| AI coding assistants | Developers, indie hackers | $9–14 |
| Business automation | Teams, operations managers | $19–29 |
| Marketing & copywriting | Marketers, founders, agencies | $12–24 |
| Data analysis & research | Data analysts, researchers | $15–22 |

---

## API Reference

Full interactive API docs are available at `/api/docs` (Swagger UI, auto-generated from NestJS decorators).

### Quick reference

```
POST   /auth/register              Create account
POST   /auth/login                 Get JWT token
POST   /auth/refresh               Refresh access token

GET    /prompts                    List prompts in workspace
POST   /prompts                    Create a new prompt
GET    /prompts/:id                Get prompt with latest version
DELETE /prompts/:id                Delete a prompt

POST   /prompts/:id/versions       Push a new version
GET    /prompts/:id/versions       List all versions
GET    /prompts/:id/diff           Diff two versions (?from=v1&to=v2)
POST   /prompts/:id/promote        Promote version to environment

GET    /marketplace/packs          Browse marketplace packs
GET    /marketplace/packs/:id      Get pack detail
POST   /marketplace/packs/:id/buy  Purchase a pack

POST   /evals/runs                 Start an eval run (async, queued)
GET    /evals/runs/:id             Get eval run result

GET    /workspaces                 List workspaces
POST   /workspaces                 Create workspace
POST   /workspaces/:id/invite      Invite member by email
```

### SDK usage (JavaScript)

```typescript
import { promptgit } from '@promptgit/sdk';

const client = new promptgit({ apiKey: process.env.promptgit_API_KEY });

// Fetch the production version of a prompt at runtime
const prompt = await client.getPrompt('customer-support-agent', { env: 'production' });

// Use it with any AI SDK
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'system', content: prompt.interpolate({ user_name: 'Ahmad' }) }],
});
```

### SDK usage (Python)

```python
from promptgit import promptgit

client = promptgit(api_key=os.environ["promptgit_API_KEY"])

prompt = client.get_prompt("ticket-classifier", env="production")
result = prompt.interpolate(ticket_text="My payment failed")
```

---

## Environment Variables

### API (`apps/api/.env`)

```env
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/promptgit

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GITHUB_CLIENT_ID=your-github-oauth-app-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Object storage (Cloudflare R2 or AWS S3)
STORAGE_ENDPOINT=https://your-account.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=promptgit-uploads
STORAGE_PUBLIC_URL=https://cdn.promptgit.dev

# Payments (Lemon Squeezy)
LEMONSQUEEZY_API_KEY=your-lemon-squeezy-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-signing-secret
LEMONSQUEEZY_STORE_ID=12345

# Email (Resend)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@promptgit.dev

# AI models (for eval runner and playground)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Search (Meilisearch — Phase 3+)
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=your-master-key

# Monitoring (optional)
SENTRY_DSN=https://your-sentry-dsn
```

### Web (`apps/web/.env.local`)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_URL=http://localhost:5173
```

---

## Contributing

Contributions are what make open source thrive. All contributions — bug reports, feature suggestions, documentation, and code — are welcome.

### How to contribute

1. Fork the repo
2. Create a feature branch — `git checkout -b feat/your-feature-name`
3. Make your changes and write tests where applicable
4. Run the test suite — `npm run test` (API) and `npm run test` (web)
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — `feat: add eval scoring by LLM judge`
6. Push to your fork and open a Pull Request

### Good first issues

Look for issues tagged [`good first issue`](https://github.com/yourusername/promptgit/labels/good%20first%20issue) — these are intentionally scoped to be approachable for new contributors.

### Development guidelines

- All API endpoints must have NestJS Swagger decorators (`@ApiOperation`, `@ApiResponse`)
- All new Prisma models must have a corresponding migration — never edit the schema without running `npx prisma migrate dev`
- Use [Pino](https://getpino.io/) for logging, never `console.log` in production code
- Tests live next to the code they test — `prompts.service.spec.ts` alongside `prompts.service.ts`
- Keep PRs focused — one feature or fix per PR

### Commit message format

```
feat: add marketplace pack rating system
fix: correct diff algorithm for multiline variable blocks
docs: update self-hosting guide for Railway
chore: upgrade Prisma to 5.14
```

---

## Self-Hosting

promptgit is fully self-hostable. You own your data.

### Deploy with Railway (recommended — free to start)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/promptgit)

1. Click the button above
2. Set your environment variables in the Railway dashboard
3. Railway auto-provisions Postgres and Redis for you
4. Your instance is live in ~3 minutes

### Deploy with Docker

```bash
# Clone the repo
git clone https://github.com/yourusername/promptgit.git
cd promptgit

# Copy and fill in production environment variables
cp apps/api/.env.example apps/api/.env.production

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Run DB migrations
docker-compose exec api npx prisma migrate deploy
```

### Manual deployment checklist

- [ ] Postgres 15+ instance (managed: Supabase, Neon, RDS)
- [ ] Redis 7+ instance (managed: Upstash, Redis Cloud)
- [ ] Object storage bucket (Cloudflare R2 recommended — free egress)
- [ ] Resend account for transactional email
- [ ] Lemon Squeezy account (if enabling marketplace payments)
- [ ] `JWT_SECRET` set to a cryptographically random 64-character string
- [ ] HTTPS configured (Railway and Render handle this automatically)

---

## License

promptgit is licensed under the [MIT License](LICENSE).

The core version control engine, CLI, and SDKs are and will always remain free and open source. The cloud-hosted SaaS and marketplace are commercial products built on top of this open-source foundation.

---

<div align="center">

Built by [Ali Haider](https://github.com/ali7040) ·

If promptgit saves you time, please give it a ⭐ — it helps more developers find the project.

</div>
