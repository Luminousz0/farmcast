---
name: session-handoff
description: Summarize the current session so context can be cleanly transferred to a fresh session. Use when ending a long session, switching tasks, or when context is getting full. Trigger on "handoff", "session summary", "wrap up this session", "summarize what we did", "I need to start fresh". Run this before /clear or /compact.
---

# Session Handoff

Generate a tight, paste-ready summary of this session that can be dropped into a fresh conversation without losing continuity.

---

## Steps

1. **Review the conversation history** — scan back through everything done in this session.

2. **Produce the handoff brief** in this exact format:

```
## Session Handoff — [date + brief topic]

### What we accomplished
- [bullet: specific thing done, with file paths where relevant]
- [bullet: ...]

### Files created or edited
- `path/to/file.md` — [what it is / what changed]
- ...

### Open decisions / unresolved questions
- [anything that was discussed but not concluded]
- ...

### Next steps (in priority order)
1. [Most important next action]
2. ...

### Context to carry forward
[1–3 sentences: what Claude needs to know to continue intelligently — current focus, active constraints, anything non-obvious]
```

3. **After outputting the brief**, say:
> Copy the brief above, run `/clear`, paste it at the start of your next session. The new session will have full continuity with zero wasted context.

---

## Rules
- Be specific — "wrote note on X" not "did some writing"
- Include actual file paths for anything created or edited
- Next steps must be actionable, not vague
- Keep the whole brief under 300 words — it's a handoff, not a report
- Do NOT include the session's full conversation — just the distilled state

---

## Feedback Loop

After producing the handoff brief, ask:
1. *"Is this handoff complete — anything missing that you'd want in the next session's first message?"*
2. Update the template or section order based on feedback.
3. If a section is consistently skipped or irrelevant, cut it.

The skill improves with every run. It is never finished.
