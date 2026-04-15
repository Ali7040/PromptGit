# PromptGit — GitHub Issues Backlog

> Copy each issue block below to create GitHub issues.  
> Assign labels and milestones as indicated.  
> Format: `gh issue create --title "..." --body "..." --label "..." --milestone "Phase N"`

---

## PHASE 1 — Core Version Control

---

### Issue 1
**Title:** `feat: scaffold NestJS monorepo with Prisma and global modules`  
**Label:** `enhancement`, `good first issue`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Set up the base NestJS application with:
- `PrismaModule` (global, singleton `PrismaService`)
- `RedisModule` (global, singleton `ioredis` client via `REDIS_CLIENT` injection token)
- `ConfigModule` (global, `.env` loaded via `@nestjs/config`)
- `ThrottlerModule` backed by Redis (100 req/min for free tier)
- `ValidationPipe` globally with `whitelist: true`
- `main.ts` with CORS configured via `WEB_URL` env var

**Acceptance criteria:**
- `pnpm dev` starts the API on `:3000`
- `GET /` returns `{ status: 'ok', version: '0.1.0' }`
- Redis and Postgres connections are validated on startup

---

### Issue 2
**Title:** `feat: implement full Prisma schema — users, workspaces, prompts, versions`  
**Label:** `enhancement`, `database`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Implement the full schema in `apps/api/prisma/schema.prisma` as defined in the repo.  
Run and verify all migrations locally.

Models required for Phase 1:
- `User`, `RefreshToken`
- `Workspace`, `WorkspaceMember`, `ApiKey`
- `Prompt`, `PromptVersion`
- `WorkspaceEvent` (audit log)

**Commands:**
```bash
npx prisma migrate dev --name init
npx prisma db seed       # seed one test user + workspace
npx prisma studio        # verify schema visually
```

**Acceptance criteria:**
- All relations have correct cascade rules
- `PromptVersion` has `contentHash` unique per prompt (content-addressable)
- Seed script creates `admin@promptgit.dev` user with a demo workspace

---

### Issue 3
**Title:** `feat: JWT auth — register, login, refresh tokens, logout`  
**Label:** `enhancement`, `auth`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Implement `AuthModule` with:
- `POST /auth/register` — email + password, returns access + refresh tokens
- `POST /auth/login` — local strategy via `passport-local`
- `POST /auth/refresh` — verify refresh token from httpOnly cookie, issue new pair
- `POST /auth/logout` — delete refresh token from DB
- `JwtStrategy` for `@UseGuards(JwtAuthGuard)` on protected routes
- Passwords hashed with `bcryptjs` (12 rounds)
- Refresh tokens stored in `refresh_tokens` table with expiry

**Acceptance criteria:**
- Access token expires in 15m, refresh token in 7d
- Replay attack: using a consumed refresh token returns 401
- `GET /auth/me` returns current user profile

---

### Issue 4
**Title:** `feat: GitHub OAuth login`  
**Label:** `enhancement`, `auth`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Add GitHub OAuth via `passport-github2`:
- `GET /auth/github` — redirect to GitHub
- `GET /auth/github/callback` — handle callback, create/link user, redirect to web app with tokens
- Link `githubId` to existing account if email matches
- Store `avatarUrl` from GitHub profile

---

### Issue 5
**Title:** `feat: prompts CRUD — create, list, get, delete`  
**Label:** `enhancement`, `prompts`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Implement `PromptsModule`:
- `POST /workspaces/:workspaceId/prompts` — create prompt with name, description, tags
- `GET /workspaces/:workspaceId/prompts` — list all prompts, paginated
- `GET /prompts/:id` — get prompt with latest version
- `DELETE /prompts/:id` — soft delete (add `deletedAt` field)
- Slug auto-generated from name (kebab-case, unique per workspace)

---

### Issue 6
**Title:** `feat: version control engine — push, history, content-addressable deduplication`  
**Label:** `enhancement`, `core`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Implement `VersioningService`:
- `POST /prompts/:id/versions` — push new version
  - Compute SHA-256 hash of content (first 16 chars)
  - Reject if identical hash already exists for this prompt
  - Auto-increment version tag: `v1.0.0 → v1.0.1`
  - Store `parentId` to build the version tree
- `GET /prompts/:id/versions` — list all versions with author + eval count
- `GET /prompts/:id/versions/:tag` — get specific version by tag

**Acceptance criteria:**
- Pushing identical content twice returns `409 Conflict` with the existing version tag
- Version tree is traversable via `parentId`

---

### Issue 7
**Title:** `feat: Myers diff algorithm — line-level visual diff between versions`  
**Label:** `enhancement`, `core`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Implement `DiffService` using an LCS-based diff (same algorithm as Git):
- `GET /prompts/:id/diff?from=v1.0.0&to=v1.0.2`
- Returns: `{ fromVersion, toVersion, lines: [{type: 'insert'|'delete'|'equal', content, lineNumber}], stats: {added, removed, unchanged} }`

This powers the visual diff UI in the React app. The algorithm is already stubbed in `apps/api/src/prompts/diff.service.ts`.

---

### Issue 8
**Title:** `feat: React dashboard — prompt list, version timeline, diff viewer`  
**Label:** `enhancement`, `frontend`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Build the core React frontend (`apps/web`):

Pages:
- `/dashboard` — list prompts in current workspace (cards with name, tag count, last version, last modified)
- `/prompts/:id` — version timeline (commit log style), click to view content
- `/prompts/:id/diff` — side-by-side diff viewer using the diff API

Components:
- `DiffViewer` — renders insert/delete/equal lines with color coding (green/red/gray)
- `VersionTimeline` — vertical commit graph with version tags and commit messages
- `PromptCard` — compact summary card

Tech: React + Vite + Tailwind + React Query for data fetching + Zustand for auth state.

---

### Issue 9
**Title:** `feat: environment promotion — dev → staging → production`  
**Label:** `enhancement`, `prompts`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
- `POST /prompts/:id/versions/:versionId/promote` — `{ environment: "STAGING" | "PRODUCTION" }`
- `GET /prompts/:id/active?env=production` — returns the current production version
- SDK `getPrompt(slug, { env: 'PRODUCTION' })` should resolve to the active production version

---

### Issue 10
**Title:** `chore: GitHub Actions CI — lint, typecheck, test on every PR`  
**Label:** `ci`, `chore`, `phase-1`  
**Milestone:** Phase 1  

**Body:**
Create `.github/workflows/ci.yml`:
- Trigger: `push` to any branch + `pull_request` to `main`
- Jobs:
  1. `lint` — `pnpm lint` across all apps
  2. `typecheck` — `pnpm check-types`
  3. `test` — `pnpm test` with Postgres + Redis services
- Cache `node_modules` and pnpm store

---

## PHASE 2 — Teams, Environments & Billing

---

### Issue 11
**Title:** `feat: workspace member invitations with role-based access control`  
**Label:** `enhancement`, `teams`, `phase-2`  
**Milestone:** Phase 2  

**Body:**
- `POST /workspaces/:id/invite` — send email invite via Resend, store `inviteToken`
- `POST /workspaces/accept-invite/:token` — accept, link user to workspace with role
- `GET /workspaces/:id/members` — list members with roles
- `PATCH /workspaces/:id/members/:userId` — change role (owner/admin only)
- `DELETE /workspaces/:id/members/:userId` — remove member

Roles: `OWNER > ADMIN > EDITOR > VIEWER`  
Guards: `WorkspaceRoleGuard` checks membership + minimum role before each route.

---

### Issue 12
**Title:** `feat: API key management for CI/CD integrations`  
**Label:** `enhancement`, `auth`, `phase-2`  
**Milestone:** Phase 2  

**Body:**
- `POST /workspaces/:id/api-keys` — generate scoped key, return plaintext once
- `GET /workspaces/:id/api-keys` — list keys (prefix only, never full key)
- `DELETE /workspaces/:id/api-keys/:keyId` — revoke key
- Store `SHA-256(key)` in DB, verify on each request via `ApiKeyStrategy`
- Scopes: `read`, `write`, `deploy`

---

### Issue 13
**Title:** `feat: Lemon Squeezy billing — Free and Pro plans`  
**Label:** `enhancement`, `billing`, `phase-2`  
**Milestone:** Phase 2  

**Body:**
Integrate Lemon Squeezy for SaaS billing:
- Redirect to Lemon Squeezy checkout on plan upgrade
- `POST /billing/webhook` — handle `order_created`, `subscription_updated`, `subscription_cancelled`
- Update `user.plan` in DB on webhook receipt
- `BillingGuard` — rejects Pro features if user is on FREE plan
- Plan limits: FREE = 3 prompts, 10 versions/prompt; PRO = unlimited

---

### Issue 14
**Title:** `feat: audit log — workspace event timeline`  
**Label:** `enhancement`, `teams`, `phase-2`  
**Milestone:** Phase 2  

**Body:**
- Record all meaningful actions to `workspace_events`: prompt created, version pushed, member invited, version promoted, eval run started
- `GET /workspaces/:id/events` — paginated timeline, filterable by `action`
- UI: `AuditLog` component on workspace settings page showing actor, action, resource, timestamp

---

## PHASE 3 — AI Enhancement Engine

---

### Issue 15
**Title:** `feat: AI prompt enhancement engine with accept/reject flow`  
**Label:** `enhancement`, `ai`, `phase-3`  
**Milestone:** Phase 3  

**Body:**
Core differentiator. Implement `AiEnhanceModule`:

- `POST /ai-enhance/:versionId` — run enhancement, return diff + reasoning + before/after scores
  - Types: `CLARITY`, `SPECIFICITY`, `SAFETY`, `STRUCTURE`, `VARIABLES`, `CHAIN_OF_THOUGHT`, `FEW_SHOT`, `FULL_REWRITE`
  - Supported models: `claude-sonnet-4-6`, `claude-opus-4-6`, `gpt-4o`
- `POST /ai-enhance/:enhancementId/accept` — creates a new version from enhanced content
- `POST /ai-enhance/:enhancementId/reject` — mark as rejected (no new version created)
- `GET /ai-enhance/:versionId/history` — list all enhancement attempts for a version

The service is stubbed in `apps/api/src/ai-enhance/ai-enhance.service.ts`.

**UI requirements:**
- Split view: original left, enhanced right
- Quality score delta badges (e.g., Clarity 4→8 +4)
- Accept/Reject buttons
- Reasoning panel (expandable)

---

### Issue 16
**Title:** `feat: heuristic prompt scorer — quality scores without API calls`  
**Label:** `enhancement`, `ai`, `phase-3`  
**Milestone:** Phase 3  

**Body:**
Implement `PromptScorerService` (stubbed in `prompt-scorer.service.ts`):
- Score: clarity, specificity, safety, structure, effectiveness (each 0–10)
- Heuristics only — no AI API calls, runs in <1ms
- Used to show before/after delta on every enhancement
- Add endpoint: `POST /ai-enhance/score` — score any prompt content instantly

---

### Issue 17
**Title:** `feat: eval runner — async test suite execution via BullMQ`  
**Label:** `enhancement`, `evals`, `phase-3`  
**Milestone:** Phase 3  

**Body:**
Implement `EvalsModule` with BullMQ:
- `POST /evals/runs` — enqueue eval job, return `{ runId, status: 'PENDING' }`
- `EvalRunnerProcessor` — dequeues jobs, runs each test case, scores output
- Scoring types: `EXACT_MATCH`, `CONTAINS`, `REGEX`, `LLM_JUDGE` (calls Claude to score), `SEMANTIC_SIMILARITY`
- `GET /evals/runs/:id` — poll run status + results
- `GET /prompts/:id/evals` — list all runs for a prompt, with accuracy trend data

**UI:** Pass/fail table per test case, accuracy % chart over version history.

---

### Issue 18
**Title:** `feat: SKILL.md generator — create structured skill files from prompts`  
**Label:** `enhancement`, `skills`, `phase-3`  
**Milestone:** Phase 3  

**Body:**
Implement `SkillsModule`:
- `POST /skills/generate/:promptId` — use Claude to auto-generate a `SKILL.md` from prompt content
- `POST /skills` — create a skill manually
- `GET /skills` — list your skills
- `PATCH /skills/:id` — edit skill (name, description, trigger, content)
- `POST /skills/:id/publish` — make public (shows on skills marketplace)
- `GET /skills/:id/download` — returns raw SKILL.md text for copy/import

A SKILL.md defines: name, description, trigger conditions, usage examples, expected output, notes.  
Generator stubbed in `apps/api/src/skills/skill-generator.service.ts`.

**UI:** Markdown editor with live preview, copy-to-clipboard button, publish toggle.

---

## PHASE 4 — Marketplace

---

### Issue 19
**Title:** `feat: marketplace — browse and search prompt packs`  
**Label:** `enhancement`, `marketplace`, `phase-4`  
**Milestone:** Phase 4  

**Body:**
- `GET /marketplace/packs` — browse packs with filters: `category`, `price` (free/paid), `sort` (downloads/rating/newest)
- `GET /marketplace/packs/:id` — pack detail with items preview, reviews, creator bio
- Category pages: `ai-coding`, `business-automation`, `marketing-copywriting`, `data-analysis`
- SEO: each pack gets a server-rendered public page at `/marketplace/:slug`

---

### Issue 20
**Title:** `feat: pack creation and publishing flow for creators`  
**Label:** `enhancement`, `marketplace`, `phase-4`  
**Milestone:** Phase 4  

**Body:**
- `POST /marketplace/packs` — create pack (name, description, price, category, items)
- `POST /marketplace/packs/:id/publish` — submit for review, then goes live
- `GET /marketplace/creator/packs` — creator's own pack list with sales data
- Creator dashboard: total revenue, pending payout, per-pack download counts
- Require `CreatorProfile` with connected Lemon Squeezy payout account before publishing

---

### Issue 21
**Title:** `feat: pack purchase flow — Lemon Squeezy checkout + workspace unlock`  
**Label:** `enhancement`, `marketplace`, `billing`, `phase-4`  
**Milestone:** Phase 4  

**Body:**
- `POST /marketplace/packs/:id/purchase` — create Lemon Squeezy checkout session, return URL
- `POST /billing/marketplace-webhook` — handle purchase webhook, record `PackPurchase`, unlock pack in buyer's workspace
- 20% platform fee, 80% creator payout — calculated on webhook receipt
- `GET /marketplace/purchases` — buyer's list of owned packs

---

### Issue 22
**Title:** `feat: pack ratings and reviews`  
**Label:** `enhancement`, `marketplace`, `phase-4`  
**Milestone:** Phase 4  

**Body:**
- `POST /marketplace/packs/:id/reviews` — submit 1-5 star rating + optional comment (verified purchasers only)
- `GET /marketplace/packs/:id/reviews` — paginated review list
- `Pack.avgRating` and `Pack.reviewCount` updated via DB trigger or after-hook
- Prevent duplicate reviews: one per user per pack

---

### Issue 23
**Title:** `feat: fork prompt — copy any public prompt into your workspace`  
**Label:** `enhancement`, `marketplace`, `phase-4`  
**Milestone:** Phase 4  

**Body:**
- `POST /prompts/:id/fork` — deep-copy prompt + all versions into caller's workspace
- Preserve `originPromptId` reference for attribution
- UI: "Fork" button on any public prompt or marketplace pack item page

---

## PHASE 5 — Scale & Polish

---

### Issue 24
**Title:** `feat: Meilisearch full-text search across prompts and packs`  
**Label:** `enhancement`, `search`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
- Integrate Meilisearch (add to docker-compose)
- Index: prompts (name, description, tags, content preview), packs (name, description, category)
- `GET /search?q=customer+support` — returns mixed results ranked by relevance
- Re-index on create/update via NestJS lifecycle hooks

---

### Issue 25
**Title:** `feat: real-time eval run progress via Server-Sent Events`  
**Label:** `enhancement`, `evals`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
- `GET /evals/runs/:id/stream` — SSE endpoint that pushes per-test-case results as they complete
- Frontend subscribes via `EventSource` and updates the results table in real-time
- No polling required

---

### Issue 26
**Title:** `feat: VS Code extension — view and push prompts from editor`  
**Label:** `enhancement`, `integrations`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
Build a VS Code extension in `packages/vscode-extension`:
- Tree view of workspace prompts in the sidebar
- Open any version in a read-only editor tab
- "Push current file as new version" command
- Status bar: shows current active environment for selected prompt

---

### Issue 27
**Title:** `feat: GitHub Actions integration — validate prompt quality in CI`  
**Label:** `enhancement`, `ci`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
Publish `promptgit/eval-action` to GitHub Marketplace:
- Input: `api_key`, `suite_id`, `version_tag`, `min_accuracy` (default: 0.8)
- Runs eval suite against the specified version
- Fails the CI step if accuracy < `min_accuracy`
- Posts eval summary as a PR comment

---

### Issue 28
**Title:** `feat: public creator profile pages — /u/:username`  
**Label:** `enhancement`, `marketplace`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
- `GET /u/:username` — public profile with: avatar, bio, published packs, total downloads, avg rating
- SEO meta tags for creator discoverability
- "Follow creator" (bookmark for now, notifications later)

---

### Issue 29
**Title:** `feat: inline prompt commenting — discuss specific lines of a version`  
**Label:** `enhancement`, `collaboration`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
Similar to GitHub PR review comments:
- `POST /prompts/:id/versions/:versionId/comments` — attach comment to a line range
- `GET /prompts/:id/versions/:versionId/comments` — list comments
- Resolve/unresolve thread
- UI: comment threads anchored to diff viewer lines

---

### Issue 30
**Title:** `chore: production monitoring — Sentry + Pino structured logging`  
**Label:** `chore`, `monitoring`, `phase-5`  
**Milestone:** Phase 5  

**Body:**
- Integrate Sentry SDK in NestJS (`@sentry/nestjs`) — capture unhandled exceptions
- Replace all `console.log` with Pino logger (via `nestjs-pino`)
- Log format: JSON in production, pretty-print in development
- Add request ID to every log line via `AsyncLocalStorage`
- Sentry release tracking tied to git commit SHA (`COMMIT_SHA` env var in CI)

---

## BUGS / TECH DEBT

---

### Issue 31
**Title:** `bug: version tag collision when concurrent pushes happen simultaneously`  
**Label:** `bug`, `core`  

**Body:**
If two users push to the same prompt at exactly the same time, both might read the same "latest version" and generate the same next tag, causing a unique constraint violation.

**Fix:** Use a PostgreSQL advisory lock or serializable transaction when computing the next version tag in `VersioningService.push()`.

---

### Issue 32
**Title:** `chore: add Prisma schema validation to CI — prevent broken migrations`  
**Label:** `chore`, `ci`  

**Body:**
Add a CI step that runs `npx prisma validate` and `npx prisma migrate diff --exit-code` to catch any schema drift between the schema file and the current migration history before merging to main.

---

### Issue 33
**Title:** `chore: rate limit eval runs per workspace to prevent API abuse`  
**Label:** `chore`, `evals`  

**Body:**
Eval runs call external AI APIs (OpenAI, Anthropic) which cost money. Add:
- Free plan: 10 eval runs/day per workspace
- Pro plan: 500 eval runs/day
- Guard in `EvalsService` that checks Redis counter before enqueuing
- Return `429 Too Many Requests` with `Retry-After` header when limit hit

---
