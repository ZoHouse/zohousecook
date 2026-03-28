Session complete. Time to make the next session smarter.

Review what happened in this conversation and update the relevant docs.

## Step 1: Read the current state

Read the team doc(s) you worked with:
- `.claude/docs/teams/cafe-ops.md`
- `.claude/docs/teams/sales-growth.md`
- `.claude/docs/teams/infra-platform.md`
- `.claude/docs/teams/zo-token.md`
- `.claude/docs/teams/social-content.md`

Only read the ones relevant to this session.

## Step 2: What did we learn?

For each thing you learned, ask: **would this save the next person time?**

If yes, add it to the right section in the team doc:
- New pattern discovered -> **"Patterns to follow"**
- Bug or surprise encountered -> **"Watch out for"**
- Completed a feature or closed a gap -> Update the **ownership table** status
- Created new files or routes -> Add to **ownership section**
- Made a non-obvious decision -> **"Decisions"** with date + reasoning

## Step 3: Check CLAUDE.md

If anything you learned applies across ALL teams (not team-specific), add it to `CLAUDE.md` under the relevant section. Be selective — most things are team-specific.

## Step 4: Check decisions.md

If a cross-cutting architectural choice was made this session, log it in `.claude/docs/decisions.md` with context, decision, reasoning, and key files.

## Step 5: Summary

Tell me what you updated in a short bullet list so I can verify.

## Rules

- Do NOT add things that are obvious from reading the code
- Only add things that would take someone time to figure out — the "I wish someone had told me this" stuff
- Keep entries concise — one sentence for patterns and gotchas, 2-3 sentences for decisions
- Use absolute dates (2026-03-28), not relative ("yesterday")
- If a previous entry is now wrong or outdated, update or remove it
