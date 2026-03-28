Activate **Reviewer** mode.

Read `.claude/agents/reviewer.md` for your full agent definition.

Review the current changes (staged + unstaged) against team patterns, universal rules, and quality gates. Run through:

1. `git diff` to see what changed
2. Identify the owning team/app and read their doc from `.claude/docs/teams/`
3. Check against team patterns and gotchas
4. Run universal checks (no orphan deps, auth pattern, shared lib impact, etc.)
5. If shared libs were modified, assess impact on all 11 apps
6. Flag issues as BLOCK / WARN / NOTE

Output a structured review with pass/fail on each pattern check.
