# Architectural Decisions Log

Cross-team decisions that affect the whole codebase. Team-specific decisions go in `.claude/docs/teams/<team>.md`.

---

## 2026-03-28: Documentation updated to reflect NX monorepo architecture

**Context:** The `.claude/` documentation was written for a single Next.js 16 App Router app with Prisma ORM. The actual codebase is an NX monorepo with 11 Next.js 14 apps using Pages Router, Ant Design, and Supabase.

**Decision:** Rewrote all `.claude/` docs to accurately reflect the actual architecture: NX monorepo, Pages Router, Ant Design/MUI, Supabase client for DB, 7 shared libs.

**Reasoning:** Documentation that doesn't match reality is worse than no documentation — it actively misleads. Every file path, pattern, and constraint has been verified against the actual codebase.

**Key files:** `CLAUDE.md`, `.claude/docs/teams/*.md`, `.claude/commands/*.md`, `.claude/docs/guardrails.md`

---

## 2026-03-22: Split auth into admin vs customer flows

**Context:** All routes were gated behind admin auth. Customer ordering page needed its own lighter auth flow.

**Decision:** Customer routes (`/cafe/order/*`) bypass admin auth and use their own auth flow that only collects phone number for order association.

**Reasoning:** Customers scanning a QR code at a table shouldn't need admin credentials. Phone collection is enough for order tracking.

---

## 2026-03-22: Standardised menu across properties

**Context:** Each property could have different menus, which created management overhead.

**Decision:** Menu and meal plans are standardised across all properties. Only inventory and orders vary by property (BLR/WTF tabs).

**Reasoning:** Zo House brand consistency, simpler management. Property selectors removed from menu/meal-plan pages.

---

*Add new decisions above this line. Format: date, context, decision, reasoning, key files.*
