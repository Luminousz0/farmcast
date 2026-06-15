---
name: week-review
description: Generate a weekly review — what was done, what was learned, what to carry into next week. Reads this week's Acta news-pulse, daily briefs, and active project activity. Saves to Acta/reviews/YYYY-WNN.md. Trigger on "week review", "weekly review", "wrap up the week", "what did I do this week". Also runs as a Sunday evening routine at 20:00.
---

# Week Review

Generate a tight weekly review for Ashwin. Pull from: this week's news-pulse digest, daily briefs from the past 7 days, and active project CLAUDE.md status. Write a structured review and save it to the vault.

## Paths

- **Vault root:** `/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/`
- **Acta (weekly digests):** `{vault}/Acta/`
- **Acta (daily briefs):** `{vault}/Acta/daily/`
- **Acta (weekly reviews):** `{vault}/Acta/reviews/`
- **Active projects:** `/Users/ashwin/AI OS/projects/`

---

## Steps

### Phase 1 — Get the week number

Run:
```bash
date '+%Y-W%V'   # ISO week, e.g. 2026-W24
date '+%Y-%m-%d' # today
```

Check if this week's review already exists at `Acta/reviews/[YYYY-WNN].md`. If it does, print it and ask if Ashwin wants to update it.

### Phase 2 — Read context

1. **News-pulse digest** — find this week's Acta file:
   ```bash
   ls "{vault}/Acta/" | grep "^[0-9]\{4\}-W" | sort | tail -1
   ```
   Read it. Extract: the one-line `>` thesis and 1–2 key developments most relevant to Ashwin's goals.

2. **Daily briefs from this week** — list `Acta/daily/` and read any `.md` files from the past 7 days. Extract priorities and what recurred across days.

3. **Active project status** — for each folder in `AI OS/projects/`, read CLAUDE.md. Note: current session/phase, what was completed, what's next.

4. **GOALS.md current focus** — read the "Current Focus" section. Note the stated near-term priorities.

### Phase 3 — Write the review

```markdown
---
title: "Week Review — [YYYY-WNN]"
type: week-review
date: [YYYY-MM-DD — Sunday of this week]
week: "[YYYY-WNN]"
tags:
  - acta/review
  - format/review
---

# Week Review — [YYYY-WNN]

> [One sentence: the honest characterization of this week — what actually happened vs. what was planned]

---

## What got done

[Bullet list: specific things accomplished this week across projects and life. Reference actual project names, tasks, sessions. Keep each bullet under 15 words.]

---

## What didn't get done (and why)

[Bullet list: things that were planned but didn't happen. Be honest — was it deprioritized, blocked, or just dropped? One line per item.]
(If everything got done, write "Nothing notable — strong execution week.")

---

## Key insight from the week

[1 insight that actually landed this week — from the news-pulse, from work, from a conversation, from reading. Specific and real, not vague.]

---

## Carry into next week

1. **[Priority 1]** — [one sentence: what and why it matters now]
2. **[Priority 2]** — [same]
3. **[Priority 3]** — [same]

(Max 3. These become Monday's context.)

---

## Signal from news

[1–2 sentences from this week's news-pulse most relevant to finance, AI, or life decisions. Pull a real fact or name.]
```

---

### Phase 4 — Save and report

1. Write to `Acta/reviews/[YYYY-WNN].md`.
2. Print to the session:

```
## Week Review — [YYYY-WNN]

What got done: [N items]
Key insight: [one-liner]

Carry into next week:
1. [priority]
2. [priority]
3. [priority]

Saved → Acta/reviews/[YYYY-WNN].md
```

---

## Rules

- **"What got done" must be specific** — not "worked on forex project" but "wrote Backtester.run() and backtest loop in engine.py"
- **The insight must be real** — something that actually shifted Ashwin's thinking, not a restatement of something obvious
- **Carry-forwards must be new or elevated** — don't just copy last week's priorities unless they explicitly weren't done
- **Honest > flattering** — if the week was scattered, say so. The review is for Ashwin, not for show.
- Keep the whole review under 400 words.
