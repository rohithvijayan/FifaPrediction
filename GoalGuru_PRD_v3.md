**⚽  ഗോൾ ഗുരു**

**Goal Guru**

World Cup 2026 Prediction Platform

*Product Requirements Document  ·  MVP  ·  v3.0*

| Field | Detail |
| :---- | :---- |
| Product | ഗോൾ ഗുരു (Goal Guru) |
| Version | 3.0 — MVP (Final Stack) |
| Tournament | FIFA World Cup 2026  ·  June 11 – July 19, 2026 |
| Framework | Next.js 14 (App Router, TypeScript) |
| Auth | Firebase Auth |
| Database | Firestore |
| Cache | Upstash Redis (serverless, HTTP-based) |
| External API | API-Football v3  ·  Free tier (100 req/day) |
| Hosting | Vercel (Hobby — free) |
| Scheduled Jobs | Vercel Cron Jobs |
| Repo | Single monorepo |
| Status | Draft — Ready for development |

# **1\. Product Overview**

Goal Guru is a lightweight, mobile-first football prediction platform built for the FIFA World Cup 2026\. It targets the millions of Keralites for whom every World Cup is a month-long festival — people who have an opinion on every match but have never had a simple, local-flavoured place to put it on record.

The concept is deliberately simple: every day during the group stage, four World Cup matches are played. A registered user picks the winner (or draw) for each of those four matches before kickoff. Every correct call earns 10 points. A live leaderboard shows where you stand against everyone else, updated after each match ends.

No complicated rules. No scoreline guessing. No leagues to join. Just four matches, four picks, and a leaderboard.

# **2\. Goals & Non-Goals**

## **2.1  MVP Goals**

* User registration and login via Firebase Auth

* Daily prediction card showing exactly 4 group-stage matches

* Three-way prediction: Home Win / Draw / Away Win per match

* Hard lock on predictions at each match's kickoff time

* 10 points per correct prediction, 0 for wrong or missed

* Live leaderboard — global, updated after every match result

* API-Football integration with Upstash Redis cache to stay within 100 req/day

* Fully hosted on Vercel free tier — zero infra cost

## **2.2  Non-Goals (Post-MVP)**

* Knockout stage predictions

* Private friend leagues

* Correct scoreline bonus

* Push / WhatsApp notifications

* Malayalam UI / i18n

* Social sharing cards

* Prize or reward management

* Native mobile app

# **3\. User Stories**

| ID | As a... | I want to... | So that... |
| :---- | :---- | :---- | :---- |
| US-01 | New visitor | Register with name \+ email \+ password | I can join the competition |
| US-02 | Returning user | Log in and land directly on today's matches | I can predict without friction |
| US-03 | Logged-in user | See today's 4 matches with teams, time (IST), and prediction status | I know exactly what to do |
| US-04 | Logged-in user | Tap a button to pick Home Win / Draw / Away Win per match | My prediction is saved instantly |
| US-05 | Logged-in user | See my prediction locked once a match kicks off | I know no changes are possible |
| US-06 | Logged-in user | See green / red result feedback after a match ends | I know if I got it right |
| US-07 | Logged-in user | See my total points on my profile | I can track my progress |
| US-08 | Any user | View the live global leaderboard | I see my rank vs everyone else |
| US-09 | Admin | Trigger manual score settlement for a fixture | Results are correct even if cron is late |
| US-10 | System (cron) | Cache API-Football responses in Upstash Redis | We never breach the 100 req/day limit |

# **4\. User Flow**

The entire product experience is designed around a single daily loop. Every interaction either feeds into making a prediction or checking the leaderboard.

## **4.1  Onboarding Flow (First-time user)**

| 1 | Land on Home Page Sees tournament banner, today's match count, and a leaderboard preview. One CTA: 'Start Predicting →' |
| :---: | :---- |

▼

| 2 | Register Name · Email · Password. Firebase Auth creates the account. No email verification in MVP — straight in. |
| :---: | :---- |

▼

| 3 | Redirect to Dashboard After successful register, user lands on /dashboard. Today's 4 match cards are already loaded. |
| :---: | :---- |

## **4.2  Daily Prediction Flow (Returning user)**

| 1 | Open App → Auto-login Firebase Auth persists session. User lands directly on /dashboard — no login screen unless session expired. |
| :---: | :---- |

▼

| 2 | View Today's Match Cards 4 cards sorted by kickoff time (IST). Each shows: Home Team · Away Team · Kickoff time · Prediction status. |
| :---: | :---- |

▼

| 3 | Tap a Prediction User taps \[Home\] \[Draw\] or \[Away\] on each card. Selection saved to Firestore instantly — no Submit button. |
| :---: | :---- |

▼

| 4 | Change Mind (before kickoff) User can tap a different option freely. New pick overwrites old one right up until kickoff. |
| :---: | :---- |

▼

| 5 | Match Kicks Off — Card Locks At kickoff time, buttons disable. Lock icon appears. Prediction is frozen. |
| :---: | :---- |

▼

| 6 | Match Ends — Result Appears After full-time: correct pick → green highlight \+ '+10 pts'. Wrong → red highlight \+ '0 pts'. |
| :---: | :---- |

▼

| 7 | Points Update \+ Leaderboard Moves user.total\_points updated in Firestore. User taps 'Leaderboard' to see new rank. |
| :---: | :---- |

## **4.3  Leaderboard Flow**

| 1 | Tap 'Leaderboard' in nav User opens /leaderboard. Top 20 users load, ordered by total\_points DESC. |
| :---: | :---- |

▼

| 2 | See Top 20 \+ Own Rank Own row always visible at bottom, highlighted, even if outside top 20\. |
| :---: | :---- |

▼

| 3 | Leaderboard Auto-refreshes Polls every 30 seconds during active match hours. |
| :---: | :---- |

## **4.4  Screen Map**

| Screen | Route | Who Sees It | Primary Action |
| :---- | :---- | :---- | :---- |
| Home / Landing | / | Logged-out visitors | Register or Login CTA |
| Register | /register | New users | Create account |
| Login | /login | Returning users | Sign in |
| Dashboard | /dashboard | Logged-in users | View \+ submit today's predictions |
| Leaderboard | /leaderboard | All logged-in users | View global rankings |
| Profile | /profile | Logged-in user | Total points, prediction history |
| Admin | /admin | Admin only | Manually trigger result settlement |

## **4.5  Match Card States**

| State | Trigger | Visual | User Action |
| :---- | :---- | :---- | :---- |
| OPEN — no pick | Before kickoff, no prediction made | \[Home\] \[Draw\] \[Away\] — three equal buttons | Tap to pick |
| OPEN — picked | Before kickoff, prediction saved | Selected button highlighted in red | Tap another to change |
| LOCKED | Kickoff time reached | Buttons disabled, lock icon, selection frozen | None — read only |
| SETTLED | Full-time result received | Correct → green \+ '+10 pts'  ·  Wrong → red \+ '0 pts' | None — read only |

# **5\. Functional Requirements**

## **5.1  Authentication**

* Firebase Auth — email \+ password registration and login

* Session persisted via Firebase client SDK

* Server-side API routes verify Firebase ID token via Admin SDK

* Logged-out users on protected routes redirected to /login

* No email verification in MVP — account active immediately

## **5.2  Match Feed**

* Dashboard always shows today's group-stage fixtures (max 4\)

* Fixtures seeded into Firestore daily by FixtureSeedCron at 06:30 IST

* Each fixture stores: fixture\_id, home\_team, away\_team, kickoff\_utc, kickoff\_ist, status, result

* Cards sorted by kickoff time ascending

* On days with fewer than 4 matches, all available matches are shown

## **5.3  Prediction Submission**

* User taps one of three options: Home Win (H) / Draw (D) / Away Win (A)

* Selection saved immediately to Firestore — no Submit button needed

* User can change selection freely until kickoff\_utc is reached

* Lock enforced server-side in /api/predictions — client trust never assumed

* User who never picks scores 0 for that fixture — no penalty

## **5.4  Scoring Rules**

**Simple rule: 1 correct prediction \= 10 points. No partial credit. No bonuses in MVP.**

| Scenario | Points |
| :---- | :---- |
| Correct result (H/D/A matches FT outcome) | **\+10 pts** |
| Wrong result predicted | 0 pts |
| No prediction submitted before kickoff | 0 pts |
| Match voided / abandoned | 0 pts — prediction nullified |

* Points settled by ResultSettleCron after fixture status changes to FT

* user.total\_points updated atomically in Firestore after each settlement

## **5.5  Live Leaderboard**

* Global leaderboard: all users ordered by total\_points DESC

* Ties broken by: (1) most correct predictions, (2) earliest registration

* Top 20 displayed with rank, name, total points, today's points

* User's own row always shown and highlighted regardless of rank

* Page polls every 30 seconds during active match hours

# **6\. Firestore Data Model**

Firestore is used exclusively as the application database — for users, fixtures, and predictions. It is not used as a cache.

## **6.1  /users/{uid}**

| Field | Type | Notes |
| :---- | :---- | :---- |
| uid | string | Firebase Auth UID — document ID |
| name | string | Display name |
| email | string |  |
| total\_points | number | Denormalized — updated after each settlement |
| correct\_predictions | number | Tie-breaker field |
| registered\_at | timestamp | Second tie-breaker |

## **6.2  /fixtures/{fixtureId}**

| Field | Type | Notes |
| :---- | :---- | :---- |
| fixture\_id | number | API-Football fixture ID — document ID |
| match\_date | string | YYYY-MM-DD — indexed for daily query |
| kickoff\_utc | timestamp | UTC — used for server-side lock enforcement |
| kickoff\_ist | string | Display string e.g. '9:30 PM IST' |
| home\_team | string |  |
| away\_team | string |  |
| home\_score | number | null | Null until FT |
| away\_score | number | null | Null until FT |
| status | string | NS | LIVE | FT | VOID |
| result | string | null | H | D | A — null until FT |

## **6.3  /predictions/{uid}\_{fixtureId}**

| Field | Type | Notes |
| :---- | :---- | :---- |
| user\_id | string | Firebase UID |
| fixture\_id | number | API-Football fixture ID |
| predicted\_result | string | H | D | A |
| editable | boolean | true until kickoff\_utc, then false |
| points\_earned | number | 0 until settled, then 0 or 10 |
| is\_correct | boolean | null | null until settled |
| submitted\_at | timestamp | Last write time |

**Document ID pattern {uid}\_{fixtureId} enables a direct get() lookup — no query needed, no extra Firestore read cost.**

# **7\. Cache Layer — Upstash Redis**

## **7.1  Why Upstash**

Vercel serverless functions are stateless — in-memory caches are wiped on every cold start, meaning the same API-Football endpoint could be called repeatedly across different function invocations. Upstash Redis is a serverless, HTTP-based Redis that persists across function instances, making it the correct solution for this environment.

**Upstash free tier: 10,000 requests/day, 256MB storage. Zero cost. Setup: 2 environment variables.**

## **7.2  What Gets Cached**

| Cache Key Pattern | Content | TTL | Rationale |
| :---- | :---- | :---- | :---- |
| fixtures:date:{YYYY-MM-DD} | Full fixture list for a given date | 24h (1440 min) | Changes only once per day after seeding |
| fixture:id:{fixtureId}:live | Live status \+ score for one match | 5 min | Polled during active match window |
| fixture:id:{fixtureId}:ft | Final result for a settled match | 6h | Immutable once FT — long TTL safe |
| api:daily:count:{YYYY-MM-DD} | Running count of API-Football calls today | 24h | Guards the 100 req/day free limit |

## **7.3  Cache Utility — getWithCache()**

A single shared utility handles all API-Football calls. Nothing in the app calls the external API directly.

| Step | Action |
| :---- | :---- |
| 1 | Check Upstash Redis for key |
| 2 | Cache hit → return cached value immediately, no API call |
| 3 | Cache miss → check daily counter. If counter \>= 95, log warning and skip the call |
| 4 | Call API-Football, write response to Redis with appropriate TTL |
| 5 | Increment daily counter key (INCR with 24h TTL) |
| 6 | Return fresh data |

**The daily counter key acts as a hard circuit breaker — the app will never silently exceed the API limit.**

## **7.4  Setup (2 env vars, that's it)**

* UPSTASH\_REDIS\_REST\_URL — from Upstash dashboard after creating a free database

* UPSTASH\_REDIS\_REST\_TOKEN — from Upstash dashboard

* Install: npm install @upstash/redis

* Usage: import { Redis } from '@upstash/redis' — then redis.get / redis.set / redis.incr

# **8\. API-Football Integration**

## **8.1  Endpoints Used**

| Endpoint | Purpose | Frequency |
| :---- | :---- | :---- |
| GET /fixtures?league=1\&season=2026\&date=YYYY-MM-DD | Seed today's \+ tomorrow's fixtures into Firestore | 2 calls/day |
| GET /fixtures?id={fixture\_id} | Fetch live status \+ score for one match | 1 per live match per 10 min poll |
| GET /fixtures?live=1 | Check if any WC match is currently in progress | 1 per 10 min during active hours |

## **8.2  Daily Request Budget**

| Activity | Calls | Notes |
| :---- | :---- | :---- |
| Seed today's fixtures | 1 | FixtureSeedCron at 06:30 IST |
| Seed tomorrow's fixtures | 1 | Same cron run — pre-fetch |
| Live check (/fixtures?live=1) | 18 | Every 10 min across \~3hr active window |
| Per-fixture result fetch (4 matches × 3 polls) | 12 | Only triggered when live=true |
| Buffer / retries | 8 | Safety margin |
| **Total (worst case)** | **\~40 calls/day** | 60 calls of headroom remaining |

## **8.3  Vercel Cron Jobs**

**Vercel Hobby (free with credit card) supports cron jobs. The \*/5 and \*/10 schedules require Hobby tier. Client-side polling is the fallback if needed.**

| Job | Route | Schedule (UTC) | Action |
| :---- | :---- | :---- | :---- |
| FixtureSeedCron | /api/cron/seed-fixtures | 0 1 \* \* \*  (01:00 UTC \= 06:30 IST) | Fetch today \+ tomorrow from API-Football (via cache) → seed Firestore |
| LivePollCron | /api/cron/live-poll | \*/10 \* \* \* \* | Check live matches → update fixture status in Firestore |
| ResultSettleCron | /api/cron/settle-results | \*/5 \* \* \* \* | Detect FT fixtures → run scoring engine → update user.total\_points |

# **9\. Next.js Project Structure**

| Path | Purpose |
| :---- | :---- |
| app/(auth)/login/page.tsx | Login screen |
| app/(auth)/register/page.tsx | Registration screen |
| app/(app)/dashboard/page.tsx | Today's matches \+ prediction cards |
| app/(app)/leaderboard/page.tsx | Live global leaderboard |
| app/(app)/profile/page.tsx | User stats — total points, history |
| app/admin/page.tsx | Admin: manual result settlement |
| app/api/predictions/route.ts | POST — submit or update a prediction |
| app/api/leaderboard/route.ts | GET — paginated global standings |
| app/api/admin/settle/route.ts | POST — admin-only score settlement |
| app/api/cron/seed-fixtures/route.ts | Cron — daily fixture seed |
| app/api/cron/live-poll/route.ts | Cron — live match status poll |
| app/api/cron/settle-results/route.ts | Cron — post-FT score settlement |
| lib/firebase/admin.ts | Firebase Admin SDK singleton (server-side only) |
| lib/firebase/client.ts | Firebase client SDK (browser) |
| lib/cache.ts | getWithCache() — Upstash Redis wrapper \+ daily counter |
| lib/api-football.ts | API-Football fetch functions |
| lib/scoring.ts | settleFixture() — pure scoring logic |
| components/MatchCard.tsx | Match card with 4-state prediction buttons |
| components/LeaderboardTable.tsx | Ranked table with sticky own-row |
| vercel.json | Cron schedule definitions |

# **10\. API Route Design**

| Method | Route | Auth | Description |
| :---- | :---- | :---- | :---- |
| POST | /api/predictions | Firebase token | Submit or update prediction. Rejected if past kickoff\_utc. |
| GET | /api/leaderboard | Firebase token | Top 20 users \+ calling user's rank |
| GET | /api/matches/today | Firebase token | Today's fixtures with calling user's prediction state |
| POST | /api/admin/settle | Admin token | Manually settle a specific fixture\_id |
| GET | /api/cron/seed-fixtures | Cron secret | Seed fixtures for today \+ tomorrow |
| GET | /api/cron/live-poll | Cron secret | Poll live status, update Firestore |
| GET | /api/cron/settle-results | Cron secret | Settle FT fixtures, update points |

# **11\. Final Tech Stack**

| Layer | Technology | Cost |
| :---- | :---- | :---- |
| Framework | Next.js 14 — App Router, TypeScript | Free |
| Auth | Firebase Auth | Free (Spark plan) |
| Database | Firestore | Free (Spark plan — 1GB storage, 50k reads/day) |
| Cache | Upstash Redis — serverless, HTTP-based | Free (10k req/day) |
| External API | API-Football v3 — fixture \+ live scores | Free (100 req/day) |
| Hosting | Vercel Hobby | Free |
| Cron Jobs | Vercel Cron (Hobby tier) | Free |
| **Total infra cost** | **₹0 / month** | Entirely on free tiers |

# **12\. Non-Functional Requirements**

| Requirement | Target |
| :---- | :---- |
| Dashboard load time | \< 2s on 4G mobile |
| Prediction save latency | \< 500ms (Firestore direct write) |
| Cache lookup latency | \< 20ms (Upstash HTTP Redis) |
| Leaderboard refresh | Every 30s during active match hours |
| API-Football calls | ≤ 100/day (Upstash counter \+ circuit breaker at 95\) |
| Points settled after FT | Within 10 min of full-time |
| Concurrent users (MVP) | 500 simultaneous |
| Total infra cost | ₹0 — all free tiers |

# **13\. Build Milestones**

| Week | Milestone | Deliverables |
| :---- | :---- | :---- |
| Week 1 | Foundation | Next.js scaffold, Firebase Auth (register/login/session), Firestore setup, route protection middleware |
| Week 2 | Match Feed \+ Cache | Upstash Redis setup, getWithCache() utility, API-Football integration, FixtureSeedCron, /dashboard match cards (read-only) |
| Week 3 | Predictions | Prediction submission API, real-time Firestore save, kickoff lock (server-side), card state transitions in UI |
| Week 4 | Scoring \+ Leaderboard | ResultSettleCron, scoring engine, total\_points update, /leaderboard with 30s polling |
| Week 5 | Polish \+ Deploy | Profile page, admin settle route, mobile UI polish, Vercel deploy, E2E smoke test |

# **14\. Risks & Mitigations**

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| API-Football 100/day limit exceeded | High | Upstash Redis cache \+ daily counter with hard stop at 95 calls |
| API returns delayed FT status | Medium | Admin /api/admin/settle endpoint as instant manual fallback |
| Vercel cron not firing on free tier | Medium | Client-side setInterval polling from dashboard as backup for live scores |
| Firestore leaderboard slow at scale | Medium | Denormalized total\_points on user doc — single orderBy, no aggregation query |
| User bypasses client lock via direct API call | High | Server-side kickoff\_utc check in /api/predictions — never trust client |
| Match rescheduled post-prediction | Low | VOID status — all predictions nullified, 0 pts, clearly communicated in UI |
| Upstash free tier exhausted (10k req/day) | Low | Unlikely — cache hits dominate. Upgrade to Upstash Pay-as-you-go ($0.20/100k req) if needed |

# **15\. Out of Scope for MVP**

* Knockout stage prediction format — Phase 2

* Correct scoreline bonus — Phase 2

* Private friend leagues — Phase 2

* Push / WhatsApp / Telegram notifications — Phase 2

* Malayalam language UI — Phase 2

* Social sharing card generation — Phase 2

* Prize / reward management — Phase 3

* Native iOS / Android app — Phase 3

*ഗോൾ ഗുരു  ·  MVP PRD v3.0  ·  Next.js \+ Firebase \+ Upstash \+ Vercel  ·  ⚽*