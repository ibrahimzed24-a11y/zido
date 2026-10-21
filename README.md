# Zido

**Meet Zido, your new AI best friend.**

Zido is an AI companion for macOS: a "digital shadow" that lives in the Mac notch, sees the screen, draws on-screen guidance and runs agentic tasks (GitHub, Vercel) for the user. This repository holds the whole SaaS:

| Part | Stack | Folder |
| --- | --- | --- |
| Landing page + dashboard + API | Next.js (App Router), Tailwind CSS, Lucide-react | `app/`, `components/` |
| Database | Prisma + PostgreSQL | `prisma/schema.prisma` |
| AI | Claude 3.5 Sonnet (Anthropic Messages API, vision + tool use) | `lib/claude.ts` |
| Billing | Stripe Checkout + webhooks | `app/api/stripe/` |
| Agents | GitHub API, Vercel API | `lib/tools/` |
| Mac app | Swift, SwiftUI, AppKit | `macos/` |

## How it works: Grab → Say Hello → Get it Done

1. **Grab**: the Notch UI (`macos/Sources/Zido/NotchWindow.swift`) expands on hover. `ScreenCapture` grabs the main display with `CGWindowListCreateImage`; Zido's own windows use `sharingType = .none`, so it never captures itself.
2. **Say Hello**: the app sends the screenshot and the question to `POST /api/zido/vision` with its device key. The route builds a system prompt with the user's `PROFILE.md` and `VOLATILE.md`, calls Claude with the image and, on Pro/Max, the agent tools.
3. **Get it Done**: Claude answers with `[RECT: x, y, w, h, label]` tags. The server strips them into `rects`; the Mac app draws them in a click-through overlay window at the `.screenSaver` level. The user can press "Click … for me", which posts a `CGEvent` click (Accessibility permission required). Agent tools run server-side:
   - `github_create_repo`: creates a repository (private by default)
   - `github_write_file`: creates or updates a file and commits it
   - `vercel_deploy`: starts a production deployment from a GitHub repo

Every agent task is logged in `AgentTask`; the dashboard shows **Agent Tasks Completed** and **Time Saved**.

## Memory

- `PROFILE.md`: lasting facts. Claude adds `[REMEMBER: fact]`; the server merges them without duplicates (`lib/memory.ts`).
- `VOLATILE.md`: rolling recent context, capped at 40 entries.

Both are stored on the user row and shown in Settings; the Mac app keeps local copies in `~/Library/Application Support/Zido/`.

## Security

- Integration tokens (GitHub OAuth token, Vercel token) are encrypted with AES-256-GCM (`lib/crypto.ts`) before they reach the database.
- Sessions are HMAC-signed cookies; the Mac app uses a device key stored only as a SHA-256 hash on the server and in the Keychain on the Mac.
- Stripe webhooks are signature-verified and idempotent (`StripeEvent`).
- No secrets are committed. Copy `.env.example` to `.env.local` and fill it in.

## Pricing

Free, Pro (**Recommended**) and Max are defined in `lib/plans.ts` (shown prices: $0, $20, $100 per month; edit them there). **Max is the default plan** (`DEFAULT_PLAN`, and `@default(MAX)` on `User.plan`) and has no usage limits: a `null` limit means unlimited. Accounts without an active paid subscription fall back to Max. Paid plans map to Stripe prices via `STRIPE_PRICE_PRO` and `STRIPE_PRICE_MAX`.

## Dashboard

`/dashboard` with Dashboard, Conversations, My Agents and Settings.

## Setup

```bash
cp .env.example .env.local   # fill in every value
npm install
npx prisma db push
npm run dev
```

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Any PostgreSQL database (Neon, Supabase, RDS…) |
| `APP_URL` | Public URL of the app, e.g. `https://zido.vercel.app` |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ZIDO_MODEL` | Defaults to `claude-3-5-sonnet-20241022`; set a newer Claude model if that one is no longer served |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub → Settings → Developer settings → OAuth Apps. Callback: `APP_URL/api/auth/github/callback` |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_PRICE_PRO`, `STRIPE_PRICE_MAX` | Recurring prices for the Pro and Max products |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint `APP_URL/api/stripe/webhook` with `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` |

Vercel tokens are not an env var: each user pastes their own in Settings and it is stored encrypted.

### Mac app

```bash
cd macos
swift build && swift test
./scripts/bundle.sh   # builds Zido.app with Info.plist
open Zido.app
```

`Info.plist` carries `NSCameraUsageDescription` and `NSMicrophoneUsageDescription`. Grant Screen Recording and Accessibility from the app's Settings window. Create a device key in the web dashboard (Settings → Your Mac) and paste it into the app.

Note: `CGWindowListCreateImage` is deprecated since macOS 14. The package targets macOS 13 so it still builds; migrate `ScreenCapture` to ScreenCaptureKit before targeting macOS 15 only.

## Checks

```bash
npm run typecheck
npm test
cd macos && swift test
```

GitHub Actions (`.github/workflows/ci.yml`) runs the type check and tests for the web app on Ubuntu and `swift build` + `swift test` for the Mac app on macOS.
