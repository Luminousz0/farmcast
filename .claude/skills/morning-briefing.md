---
name: morning-briefing
description: Generate today's daily briefing from GOALS.md, the latest Acta digest, and active project status. Saves output to Acta/daily/YYYY-MM-DD.md. Trigger on "morning briefing", "daily briefing", "what's on today", "what should I focus on today". Also runs as a daily routine at 09:00.
---

# Morning Briefing

Generate a compact, useful daily briefing for Ashwin. Pull from GOALS.md (current focus), the latest Acta weekly digest, and active project CLAUDE.md files. Save to vault. Print a short summary.

## Paths

- **Vault root:** `/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/`
- **GOALS.md:** `{vault}/GOALS.md`
- **Acta weekly digests:** `{vault}/Acta/` (files named `YYYY-WNN.md`)
- **Acta daily output:** `{vault}/Acta/daily/YYYY-MM-DD.md`
- **Active projects:** `/Users/ashwin/AI OS/projects/`

---

## Steps

### Phase 1 — Read context

1. **Read GOALS.md** — extract the "Current Focus" section only. This tells you what phase of life Ashwin is in and his near-term priorities.

2. **Find latest Acta digest** — run:
   ```bash
   ls "/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Acta/" | grep -E '^[0-9]{4}-W' | sort | tail -1
   ```
   Read that file. Extract: the one-line summary (the `>` quote under the title) and any key developments relevant to Ashwin's goals (finance, AI, economics).

3. **Scan active projects** — run:
   ```bash
   ls "/Users/ashwin/AI OS/projects/"
   ```
   For each project folder, read its CLAUDE.md. Note: current phase/session, any open blockers, next task.

4. **Check if today's brief already exists:**
   ```bash
   ls "/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Acta/daily/" 2>/dev/null
   ```
   If today's file already exists, skip writing and just print the existing brief.

---

### Phase 2 — Generate the brief

Today's date: run `date '+%A, %B %-d, %Y'` for the human-readable header.

Compose a brief with this exact structure:

```markdown
---
title: "Daily Brief — [YYYY-MM-DD]"
type: daily-brief
date: [YYYY-MM-DD]
tags:
  - acta/daily
---

# [Weekday, Month Day, Year]

> [One sentence: the most important thing to do or be aware of today]

---

## Priorities

1. **[Priority 1]** — [one sentence: what to do and why today specifically]
2. **[Priority 2]** — [one sentence]
3. **[Priority 3]** — [one sentence]

(Max 3. Only include a priority if it's genuinely actionable today. Don't pad.)

---

## Active Projects

| Project | Phase | Next task |
|---------|-------|-----------|
| [name] | [current phase/session] | [first concrete next step] |

(Only include projects with a clear next task. Skip archived or blocked ones.)

---

## Signal from last week

[1–2 sentences: one insight from the latest Acta digest that connects to Ashwin's goals — finance, AI, health, or geopolitics. Be specific — pull an actual fact, not a vague theme.]

---

## Reminders

[Only include if there's something time-sensitive: a deadline, an appointment, a follow-up due. If nothing, omit this section entirely.]
```

---

### Phase 3 — Save and report

1. Ensure `Acta/daily/` exists:
   ```bash
   mkdir -p "/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Acta/daily"
   ```

2. Write the brief to `Acta/daily/[YYYY-MM-DD].md`.

3. Print to the session:

```
## Morning Briefing — [date]

[The three priorities, as a plain list]

Signal: [the one-liner from Acta]

Saved → Acta/daily/[YYYY-MM-DD].md
```

---

## Rules

- **Priorities must be specific and actionable** — "work on forex backtester" is not a priority. "Write the `Backtester.run()` method in `src/engine.py`" is.
- **Max 3 priorities** — if everything is a priority, nothing is.
- **Signal must cite something real** — a number, a name, an event from the Acta digest. Not a vague theme.
- **If GOALS.md hasn't been updated in >30 days**, flag it: "GOALS.md may be stale — consider updating the Current Focus section."
- **Never invent deadlines** — only include reminders if there's actually something time-sensitive.
- Keep the whole output under 250 words when printing to the session.
