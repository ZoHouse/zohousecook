# Zo House — The Vision

## What We're Building

Zo House is a **Human Acceleration Program**. We believe the best way to improve human life is to gather builders in one place, run experiments, measure what works, and ship the results to the world.

We're not a coworking space. We're not a cafe. We're a living laboratory where builders eat, work, create, and experiment together — and the infrastructure they use every day is itself an experiment.

## The Zo Universe — Set Theory Model

Zo is a **universal set**. Everything inside it — people, tools, transactions, experiments — exists as part of one interconnected system. See `.claude/docs/zo-universe.md` for the full model.

### Citizens (Subsets of Zo)

Every person in Zo is a **citizen** belonging to one or more subsets:

- **Founders** — Set the vision, allocate resources, run the program
- **Builders** — Engineers, designers, creators who build tools and ship features
- **Operators** — Staff who run daily operations (cooks, housekeeping, front desk)
- **Residents** — People living/working at Zo House (members, guests)
- **Community** — Broader ecosystem (token holders, event attendees, remote contributors)

### Tools (Apps as Instruments Connecting Citizens)

Each app is a **tool** that creates connections between citizen subsets:

- **PMS/Cafe** — Operators <-> Residents (food ordering, kitchen, meal plans)
- **Admin** — Founders/Operators <-> Residents/Community (bookings, events, management)
- **Dashboard** — Founders <-> Builders/Community (metrics, leaderboards, reputation)
- **Website** — Community <-> Zo (public face, web3, wallet connections)
- **Earn/Bounties** — Founders <-> Builders ($Zo payouts for completed work)

### $Zo — The Nervous System

$Zo (Zo dollars) traces value flowing between citizen subsets. Every meaningful interaction should have a $Zo trace:
- Food credits spent = $Zo flowing from Resident to Operator
- Bounty completed = $Zo flowing from Founder to Builder
- Event attended = reputation signal in the $Zo economy
- Feature shipped = contribution tracked in the $Zo system

**$Zo is not just currency — it's the signal that makes the Zo Universe observable.**

## The Properties

- **BLRxZo** — Koramangala, Bangalore. The original.
- **WTFxZo** — Whitefield, Bangalore. The expansion.

Each property is a node in the network. Same menu, same culture, same systems — but adapted to its local community.

## Zo House Cook

Cook is the nerve center — an NX monorepo of 11 micro-apps that power every operational system:

- **PMS** (`apps/pms/`) feeds the builders. Standardised menu, real-time kitchen, QR ordering, food credits. Food is infrastructure. Connects Operators to Residents.
- **Admin** (`apps/admin/`) manages the house. Trips, bookings, events, partners, user management — the largest app with 29 major sections. Connects Founders/Operators to everyone.
- **Dashboard** (`apps/dashboard/`) tracks founder metrics. Analytics, leaderboards, reputation. Connects Founders to Builders/Community.
- **Website** (`apps/website/`) tells the world. Public site, web3 integration, wallet connections. Connects Community to Zo.
- **Shared Libs** (`libs/`) tie it all together. Auth, UI components, utilities, type definitions, assets. The infrastructure layer serving all subsets.

Plus 6 supporting apps: zo-ops, payment, web-checkin, comic, meme, pg.

## Principles

### Ship, Measure, Iterate
Every feature is an experiment. Ship the smallest version that tests the hypothesis. Measure whether it worked. Iterate or kill. Don't build for 3 months in silence.

### Builders Build
Everyone at Zo House is a builder. The tools we make should reflect that — functional, minimal, no hand-holding. Respect the user's intelligence.

### One System, Many Properties
The systems are standardised. Menu is the same everywhere. Processes are the same everywhere. Only the local details (inventory, orders, staff) vary by property. This is how we scale.

### Revenue is Oxygen
Zo House Cook drives revenue. Cafe orders, memberships, events — every team's work connects back to keeping the lights on and the experiments running. Don't build features disconnected from revenue or member experience.

### Community > Individual
Decisions should favour what makes the community better, not what's easiest to implement. If a feature makes one person's life easier but creates friction for the community, rethink it.

### Tools Connect Citizens
Every app is a bridge between citizen subsets. A feature that only serves one subset without connecting to others is incomplete. Ask: "Who else benefits? How does $Zo flow here?"

### $Zo Traces Everything
Every cross-subset interaction should be traceable through $Zo. If value moves — money, time, reputation, contribution — the system should know about it. Build with traceability in mind.

## The Teams

Five teams operate through Cook. Each owns a vertical and serves specific citizen connections:

1. **Cafe Ops** — Feeds the house. Operators <-> Residents. (`apps/pms/`)
2. **Sales & Growth** — Fills the house. Founders/Operators <-> Community. (`apps/admin/`)
3. **Infra & Platform** — Keeps it running. Serves all subsets. (`libs/*`)
4. **$Zo Token & Community** — Aligns incentives. Traces value across all subsets. (`apps/dashboard/`, `apps/website/`)
5. **Social & Content** — Tells the story. Community <-> World.

Each team has a doc in `.claude/docs/teams/` that captures their ownership, patterns, and accumulated knowledge. These docs grow smarter with every Claude Code session.

## For Claude Code

When you work in this codebase, you're not writing code for a client. You're building instruments for citizens in a human acceleration program. Every feature should ask:

1. **Which citizens does this serve?** (identify the subsets)
2. **What connection does this create or strengthen?** (subset <-> subset)
3. **Is the $Zo trace clear?** (can we track the value exchange?)
4. **Does this leave room for the next tool?** (connection surfaces for future builders)
5. **Is this the simplest thing that works?**
6. **Can we measure whether it's working?**

If you can't answer yes to at least 3 of these, reconsider.
