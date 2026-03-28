Session complete. Save what happened so the next session starts smarter.

You have access to a SQLite database at `.claude/memory.db` that persists across all Claude Code sessions. This is the **shared brain** — anyone on the team can `/remember` and anyone can recall.

## Step 1: Replay the session

Look back through the entire conversation. Extract:

1. **Who** — Who was working? (check memory or ask if unclear)
2. **Summary** — 1-2 sentence overview of the session
3. **What was done** — Concrete list of changes made (files created/modified, features built, bugs fixed)
4. **User intent** — What the user actually wanted (not just what they said — what they meant)
5. **Direction** — Where the user is heading next. What's the bigger picture? What would they likely ask for in the next session?
6. **Key decisions** — Any non-obvious choices made and why
7. **Files touched** — Comma-separated list of key files modified
8. **Team** — Which team(s) were involved (cafe-ops, sales-growth, infra-platform, zo-token, social-content, cross-team)
9. **App** — Which app(s) were modified (pms, admin, dashboard, website, etc.)
10. **Citizens affected** — Which citizen subsets this work serves (Founders, Builders, Operators, Residents, Community)
11. **$Zo flow impact** — Did this touch value exchange? (food credits, bounties, payments, reputation) — or "none"
12. **Tags** — Comma-separated keywords for searchability (e.g., "cafe,menu,bugfix,realtime")

## Step 2: Save to the database

Insert into the SQLite DB using the Bash tool:

```bash
sqlite3 .claude/memory.db "INSERT INTO sessions (who, team, app, summary, what_was_done, user_intent, direction, key_decisions, files_touched, citizens_affected, zo_flow_impact, tags) VALUES (
  '<who>',
  '<team>',
  '<app>',
  '<summary>',
  '<what_was_done>',
  '<user_intent>',
  '<direction>',
  '<key_decisions>',
  '<files_touched>',
  '<citizens_affected>',
  '<zo_flow_impact>',
  '<tags>'
);"
```

IMPORTANT:
- Escape single quotes in values by doubling them (`'` -> `''`)
- Keep each field concise — this is a summary, not a transcript
- `what_was_done` should be a bulleted list (use `\n- ` for line breaks)
- `direction` is the most important field — it tells the next session what to expect

## Step 3: Verify the save

Run:
```bash
sqlite3 .claude/memory.db "SELECT id, timestamp, summary FROM sessions ORDER BY id DESC LIMIT 1;"
```

Confirm the entry was saved and show the user the summary.

## Step 4: Also run /learn

After saving to the DB, also run the `/learn` workflow to update team docs. The DB captures **what happened and where we're going**. The team docs capture **patterns and gotchas learned**.

## Recalling past sessions

When you need context from past sessions, query the DB:

```bash
# Recent sessions
sqlite3 -header -column .claude/memory.db "SELECT id, timestamp, who, team, summary FROM sessions ORDER BY id DESC LIMIT 10;"

# Sessions for a specific team
sqlite3 -header -column .claude/memory.db "SELECT * FROM sessions WHERE team LIKE '%cafe%' ORDER BY id DESC LIMIT 5;"

# Search by tag
sqlite3 -header -column .claude/memory.db "SELECT * FROM sessions WHERE tags LIKE '%bounty%' ORDER BY id DESC;"

# What was the user's last direction?
sqlite3 -header -column .claude/memory.db "SELECT direction FROM sessions ORDER BY id DESC LIMIT 1;"

# Full session detail
sqlite3 -header -column .claude/memory.db "SELECT * FROM sessions WHERE id = <id>;"
```

## At the start of any new session

When starting a new conversation, if the user seems to be continuing prior work, proactively check:
```bash
sqlite3 -header -column .claude/memory.db "SELECT id, timestamp, who, summary, direction FROM sessions ORDER BY id DESC LIMIT 3;"
```

This gives you context on what was happening recently and where things were heading.

## Rules

- Always save. Even if the session was small — a 1-line summary is better than nothing.
- Be honest about what was done vs. what was planned but not completed.
- The `direction` field is for the NEXT session. Write it like a handoff note to a teammate.
- Don't store secrets, passwords, or sensitive data in the DB.
- Tags should be lowercase, comma-separated, and useful for search.
