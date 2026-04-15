---
name: promptgit
description: Version control, enhance, test, and publish AI prompts using the PromptGit platform
trigger: TRIGGER when: user asks to manage prompts, improve a prompt, run evals, create a skill file, or publish to the marketplace
model: claude-sonnet-4-6
version: 1.0.0
tags: [prompt-engineering, version-control, ai, llm, skills]
---

## Purpose

PromptGit is the backend infrastructure layer for AI prompts. It provides:
- Git-style version control for every prompt change
- AI-powered prompt enhancement (clarity, safety, CoT, few-shot, etc.)
- Eval runner to test prompts against test suites across models
- SKILL.md generation — turn prompts into publishable, reusable skills
- Marketplace to distribute free and paid prompt packs

## When to Use

- When you need to track changes to a prompt over time
- When a prompt needs improvement (clarity, specificity, safety guardrails)
- When you want to A/B test a prompt across GPT-4o vs Claude vs Gemini
- When you want to package prompts as reusable skills for a team or marketplace
- When running CI/CD pipelines that validate prompt quality before production deploys

## When NOT to Use

- For one-off prompt experiments with no intent to track or share
- For non-text AI artifacts (images, audio, embeddings) — use dedicated tools
- As a runtime inference engine — PromptGit stores and versions; your AI provider runs inference

## Core Workflows

### 1. Push a new prompt version
```bash
POST /prompts/:id/versions
{
  "content": "You are a helpful assistant...",
  "commitMsg": "add safety guardrail for PII",
  "variables": [{ "name": "user_name", "required": true }],
  "environment": "DEV"
}
```

### 2. Enhance a prompt with AI
```bash
POST /ai-enhance/:versionId
{
  "type": "CLARITY",          # CLARITY | SPECIFICITY | SAFETY | CHAIN_OF_THOUGHT | FEW_SHOT | FULL_REWRITE
  "model": "claude-sonnet-4-6"
}
# Returns: enhanced content + reasoning + before/after quality scores
# Accept with: POST /ai-enhance/:enhancementId/accept
```

### 3. Diff two versions
```bash
GET /prompts/:id/diff?from=v1.0.0&to=v1.2.0
# Returns: Myers diff with line-level insert/delete/equal hunks
```

### 4. Run evals
```bash
POST /evals/runs
{
  "suiteId": "suite_abc",
  "versionId": "ver_xyz",
  "model": "gpt-4o"
}
# Queued via BullMQ — poll GET /evals/runs/:runId for status
```

### 5. Generate a SKILL.md
```bash
POST /skills/generate/:promptId
# AI generates a structured SKILL.md from your prompt content
```

### 6. Promote to production
```bash
POST /prompts/:id/versions/:versionId/promote
{ "environment": "PRODUCTION" }
```

### 7. Fetch production prompt at runtime (SDK)
```typescript
import { PromptGit } from '@promptgit/sdk';
const client = new PromptGit({ apiKey: process.env.PROMPTGIT_API_KEY });
const prompt = await client.getPrompt('customer-support-agent', { env: 'PRODUCTION' });
const content = prompt.interpolate({ user_name: 'Ahmad', product: 'PromptGit' });
```

## Enhancement Types Reference

| Type | What it does |
|---|---|
| `CLARITY` | Removes ambiguity, plain language, unambiguous instructions |
| `SPECIFICITY` | Adds output format specs, concrete measurable requirements |
| `SAFETY` | Adds content policy guardrails, refusal behavior |
| `STRUCTURE` | Improves markdown formatting, logical sections |
| `VARIABLES` | Extracts hardcoded values into `{variable_name}` placeholders |
| `CHAIN_OF_THOUGHT` | Adds step-by-step reasoning scaffolding |
| `FEW_SHOT` | Generates 2-3 input/output examples inline |
| `FULL_REWRITE` | Complete AI-driven rewrite applying all best practices |

## Prompt Quality Scores

Every version gets scored 0–10 on five axes:

- **Clarity** — how unambiguous the instructions are
- **Specificity** — how concrete and measurable the output spec is
- **Safety** — presence of content guardrails
- **Structure** — formatting quality and logical organization
- **Effectiveness** — predicted task completion quality (weighted composite)

## AI Models Supported

| Provider | Model IDs |
|---|---|
| Anthropic | `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-4-5` |
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `o1-preview` |

## Expected Output

When enhancing a prompt, the API returns:
```json
{
  "id": "enh_abc123",
  "enhancementType": "CLARITY",
  "originalContent": "...",
  "enhancedContent": "...",
  "diff": { "original": [...], "enhanced": [...] },
  "reasoning": "I improved clarity by...",
  "scoresBefore": { "clarity": 4, "specificity": 5, "safety": 6, "structure": 4, "effectiveness": 5, "overall": 4.8 },
  "scoresAfter": { "clarity": 8, "specificity": 7, "safety": 8, "structure": 7, "effectiveness": 7.5, "overall": 7.5 },
  "accepted": null
}
```

## Notes

- Content-addressable hashing prevents duplicate versions (same Git content-hash deduplication)
- Eval runs are async — use BullMQ job IDs to poll for completion
- SKILL.md files follow an emerging convention in AI tooling (similar to Claude Code's skill system)
- The marketplace takes 20% platform fee; creators receive 80% via Lemon Squeezy
- All prompts support `{variable}` syntax for dynamic values at runtime
