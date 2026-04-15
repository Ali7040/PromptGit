# PromptGit — Claude Code Context

## What this project is

PromptGit is a monorepo platform for AI prompt version control, enhancement, and distribution.
Think GitHub + npm for prompts — with a backend AI enhancement engine as the core differentiator.

## Monorepo structure

```
apps/api/     — NestJS backend (primary focus)
apps/web/     — React + Vite frontend
packages/sdk-js/  — TypeScript SDK for runtime prompt fetching
packages/cli/     — Python CLI (pip install promptgit)
```

## Package manager

**pnpm** with workspaces. Always use `pnpm` not `npm` or `yarn`.

```bash
pnpm install              # install all
pnpm dev                  # start all apps (via turbo)
cd apps/api && pnpm dev   # start API only
```

## Key commands

```bash
# Database
cd apps/api
npx prisma migrate dev --name <migration-name>
npx prisma studio
npx prisma db seed

# Start infra (Postgres + Redis)
docker-compose up -d postgres redis

# CI checks
pnpm lint && pnpm check-types && pnpm test
```

## Architecture decisions

- **NestJS modules** — each domain is a standalone module. Never import services directly; use the module's exports.
- **Global modules** — `PrismaModule`, `RedisModule`, `ConfigModule`, `StorageModule` are global; don't import them in every module.
- **AI model abstraction** — all AI calls go through `ModelAdapterFactory`. Never import Anthropic/OpenAI SDK directly outside `apps/api/src/ai-enhance/adapters/`.
- **Async evals** — eval runs are always queued via BullMQ. Never run them synchronously in a request handler.
- **Content-addressable versions** — SHA-256 hash of content prevents duplicate versions, same as Git objects.
- **Heuristic scorer** — `PromptScorerService` scores prompts without API calls (fast, in-process).

## Environment

Copy `apps/api/.env.example` to `apps/api/.env` before running.
The two critical keys for AI features: `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`.

## Database

PostgreSQL via Prisma. Schema: `apps/api/prisma/schema.prisma`.
Never edit schema without running `npx prisma migrate dev` immediately after.

## Feature flags by plan

- FREE: 3 prompts, 10 versions/prompt, 10 eval runs/day
- PRO: unlimited prompts/versions, 500 eval runs/day, playground, team workspace
- BUSINESS: SSO, org-level billing, priority support

## Unique features (not in README docs)

- `PromptScorerService` — heuristic quality scores (clarity/specificity/safety/structure/effectiveness)
- `AiEnhanceService` — 8 enhancement types with accept/reject flow, creates new version on accept
- `SkillGeneratorService` — generates SKILL.md from any prompt using Claude
- `DiffService` — Myers LCS diff algorithm (same as Git), used for visual diff UI
- `VersioningService.interpolate()` — resolves `{variable}` placeholders at runtime
