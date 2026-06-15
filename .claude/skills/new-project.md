---
name: new-project
description: Bootstrap a new project in AI OS with the full project framework — folder structure, CLAUDE.md, and project memory. Use when starting any new project. Trigger on "new project", "start a project", "set up a project", "bootstrap", "create project". Always run this BEFORE writing any code.
---

# New Project Framework

Bootstrap a new Ashwin-standard project in `AI OS/projects/`. This is the mandatory starting point for every project — structure first, code second.

---

## Steps

### Phase 1 — Gather intent

Ask Ashwin (if not already provided):
1. **Project name** — short kebab-case slug (e.g., `forex-backtester`)
2. **What it does** — one sentence
3. **Why he's building it** — personal context, motivation, or goal
4. **Tech stack** — languages, frameworks, key libraries
5. **Rough scope** — how many phases/sessions does this feel like?

Do not proceed until you have at least name, purpose, and tech stack.

---

### Phase 2 — Create folder structure

Create the project at `AI OS/projects/[project-name]/`:

```
projects/[project-name]/
├── CLAUDE.md              ← project context (written in Phase 3)
├── src/                   ← all source code
├── data/                  ← input data, CSVs, fixtures (if relevant)
├── tests/                 ← test files
└── [project-specific]/    ← any additional folders that make sense for the tech stack
```

Add tech-stack-appropriate subdirectories (e.g., `src/components/` for React, `src/strategies/` for a backtester). Do not create empty placeholder files — just the directories.

---

### Phase 3 — Write CLAUDE.md

Write `projects/[project-name]/CLAUDE.md` with this exact structure:

```markdown
# [Project Name]

[One paragraph: what this is, why Ashwin is building it, personal context. No corporate tone.]

---

## Folder Structure

[Annotated tree of the actual folders just created, with a one-line note on each]

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| [e.g., Language] | [e.g., Python 3.12] | [e.g., reason for choice] |
| ...   | ...    | ...   |

---

## Core Rules

[3–6 non-negotiable constraints specific to this project — things that must always be true]
- [e.g., "Never hardcode API keys — use .env"]
- [e.g., "Every strategy must have a test before it goes in src/"]

---

## Project Plan

### Phase 1 — [Phase name]
Goal: [One sentence — what Phase 1 achieves]

**Session 1: [Session name]**
- [ ] [Concrete task 1]
- [ ] [Concrete task 2]
- [ ] [Concrete task 3]
- [ ] [Concrete task 4]

**Session 2: [Session name]**
- [ ] ...

### Phase 2 — [Phase name]
Goal: [One sentence]

**Session 3: [Session name]**
- [ ] ...

[Continue until the full project scope is covered. Sessions should take ~1–2 hours each.]

---

## Session Checklist

**At the start of every session:**
1. Read this CLAUDE.md — find which session you're on
2. `ls` the project root — see what already exists
3. Run the project (if runnable) to confirm last session's work still holds

**At the end of every session:**
1. Code runs without errors
2. Mark completed tasks with [x] in the plan above
3. Commit to git: `git add -A && git commit -m "[session N]: [what was done]"`
4. Note any open decisions or blockers in the CLAUDE.md or a `notes.md`
```

Fill in all sections with real content based on what Ashwin told you in Phase 1. The plan must be specific — not "set up project" but "create `src/engine.py` with `Backtester` class skeleton".

---

### Phase 4 — Save project memory

Save a new project memory in `~/.claude/projects/-Users-ashwin-AI-OS/memory/` using the standard memory format:

```markdown
---
name: project-[project-name]
description: [Project name] — [what it is, one line]
metadata:
  type: project
---

**[Project name]** — [one sentence what it does]

**Why:** [Ashwin's personal motivation]

**Location:** `AI OS/projects/[project-name]/`

**Tech stack:** [comma-separated]

**Current phase:** Phase 1, Session 1

**How to apply:** When Ashwin mentions this project, read `projects/[project-name]/CLAUDE.md` before doing anything.
```

Then add a pointer line to `~/.claude/projects/-Users-ashwin-AI-OS/memory/MEMORY.md`.

---

### Phase 5 — Copy skills into the new project

Create `.claude/skills/` inside the new project folder and copy every skill from `AI OS/.claude/skills/` into it:

```bash
mkdir -p "AI OS/projects/[project-name]/.claude/skills"
cp AI OS/.claude/skills/*.md "AI OS/projects/[project-name]/.claude/skills/"
```

This ensures `/session-handoff`, `/new-project`, `/auto-dream`, and any other workspace skills work when the project is opened as a standalone folder in Claude Code.

---

### Phase 6 — Confirm and hand off

Output a confirmation block:

```
## Project bootstrapped: [Project Name]

Folders created:
- projects/[project-name]/src/
- projects/[project-name]/tests/
- [any others]

Files written:
- projects/[project-name]/CLAUDE.md
- memory/project-[project-name].md (added to MEMORY.md)

Ready to start: Session 1 — [session name]
First task: [the very first checkbox in the plan]
```

Then ask: *"Does the plan look right, or do you want to adjust any sessions before we start coding?"*

---

## Rules

- Always write CLAUDE.md before touching src/ — no exceptions
- Sessions must be sized for ~1–2 hours, not "do the whole phase"
- Core rules in CLAUDE.md must be project-specific — not generic boilerplate
- Personal context in the opening paragraph is required — not optional
- Do not initialize git — Ashwin does that manually or asks explicitly
