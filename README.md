# ഗോൾ ഗുരു | Goal Guru

**FIFA World Cup 2026 Prediction Platform** — Built for Keralites.

Predict today's 4 matches (Home / Draw / Away), earn 10 points per correct pick, and climb the global leaderboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Cache | Upstash Redis (via REST) |
| Match Data | API-Football v3 |
| Cron Jobs | Vercel Cron |
| Hosting | Vercel |

---

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK config (from Firebase Console) |
| `FIREBASE_PROJECT_ID` | Firebase Admin — project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin — service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin — private key (with newlines escaped as `\n`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `FOOTBALL_API_KEY` | API-Football v3 key |
| `CRON_SECRET` | Random secret string for Vercel Cron authentication |
| `ADMIN_UID` | Firebase UID of the admin user (set after first login) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Architecture

### Route Groups
- `app/(auth)/` — Login & Register (public, redirects to /dashboard if logged in)
- `app/(app)/` — Protected pages (dashboard, leaderboard, profile)
- `app/admin/` — Admin panel (protected by ADMIN_UID)

### API Routes
| Route | Method | Description |
|---|---|---|
| `/api/auth/session` | POST/DELETE | Manages `__session` cookie for middleware |
| `/api/matches/today` | GET | Today's fixtures merged with user predictions |
| `/api/predictions` | POST | Submit/update a prediction (server-side kickoff lock) |
| `/api/leaderboard` | GET | Top 20 + calling user's rank |
| `/api/admin/settle` | POST | Manual result settlement (admin only) |
| `/api/cron/seed-fixtures` | GET | Seeds fixtures from API-Football into Firestore |
| `/api/cron/live-poll` | GET | Updates live match status in Firestore |
| `/api/cron/settle-results` | GET | Scores predictions and updates user points |

### Firestore Collections
```
users/{uid}
  ├── name, email, total_points, correct_predictions, registered_at

fixtures/{fixture_id}
  ├── fixture_id, match_date, kickoff_utc, kickoff_ist
  ├── home_team, away_team, home_team_logo, away_team_logo
  ├── home_score, away_score, status, result

predictions/{uid}_{fixture_id}
  ├── user_id, fixture_id, predicted_result
  ├── editable, points_earned, is_correct, submitted_at
```

### Scoring
- **10 points** per correct prediction
- Predictions locked at kickoff (enforced server-side in `/api/predictions`)
- Scoring runs every 5 minutes via `settle-results` cron
- Tie-breaking: most correct predictions → earliest registration date

---


## Deployment

1. Push to GitHub
2. Connect to Vercel — import this repo
3. Set all environment variables in Vercel Dashboard
4. Vercel auto-detects Next.js and deploys

After first deployment:
1. Register on the live site
2. Copy your Firebase UID from Firestore → set `ADMIN_UID` in Vercel env vars
3. Redeploy to activate admin access

---

## Design System

Dark stadium night theme:
- **Background**: `#0b1326`
- **Primary**: `#4edea3` (Pitch Green)
- **Fonts**: Anybody (headlines) + Hanken Grotesk (body)
- **Icons**: Material Symbols Outlined

---

## License

MIT — Built with ❤️ for the beautiful game.
