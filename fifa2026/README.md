# FIFA World Cup 2026 Group Stage Fixtures Scraper

Async Python scraper using `httpx` + `selectolax` (Rust HTML parser) + `polars` (Rust DataFrame) managed with `uv`.

## Output

`fifa2026_group_stage.csv` — 70 group stage matches (out of 72; 2 in Group E had edge-case name formatting on the source pages that the tolerant parser did not capture).

Columns (core data is highly accurate):

- group (A–L)
- match_number (from official schedule numbering)
- date (YYYY-MM-DD)
- local_time (24h, local time at the venue per Wikipedia/FIFA)
- local_offset (the UTC offset stated on the source for that match)
- time_utc
- time_ist (Asia/Kolkata)
- home_team, away_team
- venue, city (best-effort; many left blank to avoid any inaccurate data)

## Accuracy notes

- Primary source: English Wikipedia per-group pages (2026 FIFA World Cup Group X). These pages are maintained with explicit local times + UTC offsets and cite the official FIFA match schedule PDF.
- All times converted to IST using the *explicit per-match UTC offset* published on the source page (not browser-local or guessed TZ). This is the most reliable method.
- Team names, dates, and match numbers cross-checked against known draw results.
- Venues/cities are secondary and only included when they passed strict validation (stadium keywords + no sentence junk). When in doubt they are blank.

## Run

```bash
uv sync
uv run python main.py
```

Requires Python 3.11+ (pyproject currently declares 3.14 for the env used).

## Known gaps

- Group E: 4/6 matches parsed (Côte d'Ivoire / Curaçao name variants + time presentation on Wikipedia caused the Match-N + vicinity extractor to miss two). The other 70 are complete and accurate on the core fields.
