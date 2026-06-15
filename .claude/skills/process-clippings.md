---
name: process-clippings
description: Scan Codex/Bibliotheca for raw web clips tagged "clippings" and process them into polished Athenaeum study notes. Trigger on "process clippings", "process clips", "/process-clippings". Optional arg: filter by keyword (e.g. "nate herk", "economics", a folder name) to narrow which clips to process.
---

# Process Clippings — Bibliotheca → Athenaeum

Transform raw Obsidian Web Clipper dumps into polished, structured study notes.

## Vault Paths

- **Bibliotheca** (raw clips): `/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Codex/Bibliotheca/`
- **Athenaeum** (processed notes): `/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Codex/Athenaeum/`

## Phase 1 — Find Unprocessed Clips

Run this Python to find all raw clips not yet processed:

```python
import os, re

BIBLIO = "/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Codex/Bibliotheca/"
ATHENA = "/Users/ashwin/Library/Mobile Documents/iCloud~md~obsidian/Documents/luminous/Codex/Athenaeum/"

# Collect all Athenaeum note titles (stem only, lowercased)
athena_titles = set()
for root, dirs, files in os.walk(ATHENA):
    for f in files:
        if f.endswith('.md'):
            athena_titles.add(os.path.splitext(f)[0].lower())

# Collect Bibliotheca clips tagged "clippings"
unprocessed = []
for fname in os.listdir(BIBLIO):
    if not fname.endswith('.md'):
        continue
    fpath = os.path.join(BIBLIO, fname)
    with open(fpath, 'r', encoding='utf-8') as fh:
        content = fh.read(2000)
    if 'clippings' not in content:
        continue
    stem = os.path.splitext(fname)[0].lower()
    if not any(stem in t or t in stem for t in athena_titles):
        unprocessed.append(fname)

print('\n'.join(sorted(unprocessed)))
```

If the user provided a filter keyword, additionally filter `unprocessed` by checking if the keyword appears in the filename (case-insensitive). Announce how many clips were found and which ones will be processed.

## Phase 2 — Determine Athenaeum Subfolder

For each clip, pick the correct Athenaeum subfolder based on content:

| Content type | Default target |
|---|---|
| AI, Claude Code, automation, LLMs, software | `Entrepreneurship/AI & Technology/` |
| Business, startups, SaaS, entrepreneurship | `Entrepreneurship/Strategy/` |
| Economics, markets, finance, investing | `Economics/` |
| Psychology, behavior, cognition | `Psychology/` |
| History, philosophy | `History/` or `Philosophy/` |
| Biology, science, nature | `Biology/` or `Science/` |

When in doubt, read the first 500 chars of the clip and use the author + description to decide.

## Phase 3 — Process Each Clip (Spawn Sub-Agent)

For each clip to process, spawn a sub-agent with this exact instruction:

---
**Sub-agent prompt:**

Read the raw clip at: `[full path to Bibliotheca file]`

Use `python3 -c "with open('[path]','r') as f: print(f.read())"` to read it (avoids permission issues with special chars in filename).

Then write a polished study note to: `[full path to Athenaeum target folder]/[cleaned title].md`

**Output format (follow exactly):**

```
---
title: "[clean title — use em dashes (—) not hyphens, smart punctuation]"
type: video-note
source: "[YouTube URL from clip frontmatter]"
date: [published date from clip frontmatter, format YYYY-MM-DD]
tags:
  - topic/[category]
  - format/video
  - status/refined
author: "[author name, plain string]"
---

# [Same as title]

> [One thesis sentence: the single most important claim the video makes. Must be specific — no vague "covers X" phrases.]

---

## Overview

[2–3 paragraph summary of the video's core argument and structure. What problem it addresses, what the central claim is, and how the video builds its case. Written as if for someone who hasn't seen it.]

---

## [Section heading — name this after the video's main topic cluster]

[Detailed notes on the main content. Use tables, numbered lists, or nested bullets where the video uses structured comparisons or step-by-step logic. Aim for 300–600 words per major section. Pull exact numbers, thresholds, and named concepts from the transcript.]

[Add 1–3 more ## sections as the content demands. Name them after what's actually discussed, not generic labels like "Points" or "Notes".]

---

## Key Insights

1. **[Bold label]** — [one-sentence insight grounded in a specific fact, number, or comparison from the video]
2. **[Bold label]** — [same]
3. **[Bold label]** — [same]
4. **[Bold label]** — [same]
5. **[Bold label]** — [same]
[6. optional] **[Bold label]** — [same]
[7. optional] **[Bold label]** — [same]

---

## Connections

- [[Codex/Athenaeum/[Category]/[Subcategory]/[Topic]]] — [one sentence explaining the connection, specific to this video's content]
- [[Codex/Athenaeum/[Category]/[Subcategory]/[Topic]]] — [same]
- [[Codex/Athenaeum/[Category]/[Subcategory]/[Topic]]] — [same]
- [[Codex/Athenaeum/[Category]/[Subcategory]/[Topic]]] — [same]

(Use real Athenaeum paths where you know them. For speculative links, use the most plausible path. Never invent a link to a Bibliotheca path.)

---

## Source
- [[Codex/Bibliotheca/[exact filename without .md]|[Video title]]]
```

Write the file using:
```python
python3 -c "
content = '''[the processed note content]'''
with open('[target path]', 'w', encoding='utf-8') as f:
    f.write(content)
print('Written.')
"
```

Report back: filename written, target folder, and one sentence on the thesis of the note.

---

## Phase 4 — Report

After all sub-agents complete, return a summary:

```
## Process Clippings — Done

Processed: N clips
Skipped (already in Athenaeum): N

Written:
- [note title] → Athenaeum/[subfolder]/[filename].md
- ...

Errors (if any):
- [filename] — [reason]
```

## Rules

- **Never overwrite** an existing Athenaeum file without warning. If a file with that name already exists, skip it and note it in the report.
- **Quality over speed**: if a clip has almost no transcript content (under 200 words of actual content), note it in the report as "thin source — skipped" rather than writing a half-empty note.
- **Title cleanup**: strip trailing emoji, fix hyphen-to-em-dash, apply smart quotes in filenames. Use standard ASCII em dash (—) in the title frontmatter and filename.
- **Tags**: `topic/` tag must match the Athenaeum folder: `ai-technology`, `economics`, `psychology`, `history`, `philosophy`, `biology`, `science`.
- **Author**: plain string, not a wikilink. Strip the `[[...]]` wrapper from Bibliotheca's author field.
- One sub-agent per clip — do not process all clips in one agent call (context blows up).
