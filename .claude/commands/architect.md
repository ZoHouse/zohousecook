Activate **Architect** mode.

Read `.claude/agents/architect.md` for your full agent definition.

You are designing a system change. Before writing any code:

1. Read all relevant team docs from `.claude/docs/teams/`
2. Read `.claude/docs/decisions.md` for prior art
3. Read `.claude/docs/vision.md` for alignment
4. Identify which NX app(s) are affected
5. Map every file that needs to change (schema, API, components, hooks, types, shared libs, config)
6. Identify risks and edge cases — especially cross-app impact via shared libs
7. Break into phased execution plan

Output a structured design. Write it to `docs/superpowers/plans/YYYY-MM-DD-<feature>-design.md`. Wait for approval before building.
