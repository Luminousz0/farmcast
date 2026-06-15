---
name: auto-dream
description: Consolidate, prune, and refresh all Claude Code memory files. Removes stale project entries, merges near-duplicate feedback, updates the MEMORY.md index. Trigger on "auto dream", "clean memory", "memory maintenance", "prune memories", "refresh memory". Also runs as a weekly routine (Thursdays 08:00).
---

# AutoDream — Memory Consolidation

Maintain the health of all Claude Code memory directories. Memory files accumulate, go stale, and drift into conflict over time. This skill finds every memory directory, reads its contents, and performs conservative consolidation: prune what's clearly dead, merge what's clearly duplicate, update what's clearly outdated.

## Steps

### Phase 1 — Discover all memory directories

Run: `find ~/.claude/projects -name "MEMORY.md" -maxdepth 3`

For each MEMORY.md found, note the parent directory. These are the projects to maintain.

### Phase 2 — For each memory directory

1. **Read MEMORY.md** — get the index of all memory files.
2. **Read each memory file** — note the `type:` frontmatter field:
   - `user` — facts about Ashwin (role, preferences, background)
   - `feedback` — behavioral guidance (what to do/avoid)
   - `project` — current work state (decays fast — verify against reality)
   - `reference` — pointers to external systems

### Phase 3 — Assess and act

For each file, apply these rules:

**User memories:**
- Check if the facts are still current (e.g., exam status, university start date).
- If outdated, update the body. Don't delete the file — update it.
- If near-duplicate with another user memory, merge into the richer one and delete the duplicate.

**Feedback memories:**
- Check for contradictions between feedback files (Rule A says X, Rule B says ¬X).
- If contradicted: keep the more recent or more specific rule, remove or merge the other.
- Never delete feedback that hasn't been superseded — even old patterns may still apply.

**Project memories:**
- These expire fastest. Any project memory older than 60 days should be flagged.
- For flagged entries: check if the project state is still accurate by reading relevant files if available.
- If the project is complete, paused, or no longer relevant, update the status or remove the file.
- Mark stale entries with `status: stale` in frontmatter rather than deleting immediately.

**Reference memories:**
- Verify the external system still exists as described (e.g., check if a path or tool still exists).
- Update descriptions that no longer match current reality.

### Phase 4 — Rebuild MEMORY.md index

After processing all files:
1. Re-read every file that still exists in the directory.
2. Rewrite MEMORY.md to reflect current state — accurate one-line hooks, no dead links.
3. Entries that were deleted should be removed from the index.

### Phase 5 — Report

Return a structured summary to the main session:

```
## AutoDream — Memory Maintenance Complete

Directories processed: N
Files reviewed: N

Changes made:
- Updated: [file] — [what changed]
- Merged: [file A] into [file B] — [reason]
- Marked stale: [file] — [reason]
- Deleted: [file] — [reason]

No changes needed: [file list]

Flags for Ashwin:
- [anything that needs human judgment — contradictions too subtle to resolve, project state unclear, etc.]
```

## Rules

- **Conservative**: when in doubt, do nothing and flag it. This skill maintains, it does not rewrite.
- **Never delete without reason**: a file is only deleted if it's clearly a duplicate of a better file or explicitly obsolete.
- **Never alter feedback memories' core rule**: only update the Why/How sections, never change what the rule says unless it directly contradicts a more recent rule.
- **MEMORY.md is an index, not a memory**: keep each entry one line, under ~150 characters.
- **English only**.
- Return only the summary block to the main session — do not dump full file contents.
