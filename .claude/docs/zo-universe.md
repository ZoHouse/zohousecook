# The Zo Universe — A Set Theory Model

## The Universal Set: Zo

Zo is the universe. Everything inside it — people, tools, transactions, experiments — exists as part of one interconnected system. Think of it like a mathematical set where every element has relationships to every other element.

```
Zo = { Citizens, Tools, $Zo, Properties, Experiments }
```

## Citizens (Subsets of Zo)

Every person in Zo is a **citizen**. Citizens are grouped into subsets based on their role — but a person can belong to multiple subsets simultaneously.

| Subset | Who | What they do | Example |
|--------|-----|-------------|---------|
| **Founders** | People who started Zo House | Set the vision, allocate resources, run the program | Sai |
| **Builders** | Engineers, designers, creators in residence | Build tools, ship features, run experiments | Developers working on Cook |
| **Operators** | Staff who run daily operations | Cook food, manage spaces, handle check-ins | Kitchen staff, housekeeping |
| **Residents** | People living/working at Zo House | Use the tools, participate in experiments | Members, guests |
| **Community** | Broader Zo ecosystem | Attend events, hold $Zo, contribute remotely | Token holders, event attendees |

**Key insight:** Every tool we build serves one or more citizen subsets and connects them to other subsets. A cafe app doesn't just "manage orders" — it connects Operators (cooks) with Residents (people who eat) through a shared interface, and $Zo traces that exchange.

## Tools (Apps as Instruments)

Each app in the monorepo is a **tool** — an instrument that enables interactions between citizen subsets.

| Tool | Connects | Interaction |
|------|----------|-------------|
| **PMS/Cafe** (`apps/pms/`) | Operators (cooks) <-> Residents (diners) | Food ordering, meal plans, kitchen operations |
| **Admin** (`apps/admin/`) | Founders/Operators <-> Residents/Community | Lead management, bookings, events, house ops |
| **Dashboard** (`apps/dashboard/`) | Founders <-> Builders/Community | Metrics, analytics, leaderboards, reputation |
| **Website** (`apps/website/`) | Community <-> Zo (the system) | Public face, web3, wallet connections |
| **Earn** (bounties) | Founders <-> Builders | Bounty creation, completion, $Zo payouts |
| **Zo-ops** (`apps/zo-ops/`) | Operators <-> Founders | Daily operations dashboard |
| **Payment** (`apps/payment/`) | Any subset <-> Any subset | Payment processing between citizens |
| **Web-checkin** (`apps/web-checkin/`) | Residents <-> Operators | Arrival/check-in process |

### The Tool Design Principle

When building or modifying any tool, always ask:

1. **Which citizen subsets does this connect?** (e.g., Builders <-> Founders)
2. **What value flows between them?** (e.g., bounty completion <-> $Zo payout)
3. **Is the $Zo trace clear?** (Can we track the value exchange?)
4. **Does this create a surface for future tools?** (Can another tool plug into this interaction?)

## $Zo — The Value Trace

$Zo (Zo dollars) is the unit of account that traces value flowing between citizen subsets. Every meaningful interaction in the Zo universe should have a $Zo trace — either explicit (actual token transfer) or implicit (reputation, contribution tracking).

### How $Zo Flows

```
Founders --[post bounty]--> Bounty Board --[claim + complete]--> Builders --[$Zo payout]--> Builder wallet
Residents --[order food]--> Cafe --[food credits]--> $Zo deduction
Builders --[ship feature]--> Zo system --[reputation + $Zo]--> Leaderboard
Community --[attend event]--> Events --[participation]--> Reputation score
```

### $Zo Design Rules

1. **Every cross-subset interaction should be $Zo-traceable.** If a Founder creates work and a Builder completes it, the $Zo flow should be recorded.
2. **$Zo is not just currency — it's a signal.** Token balance, transaction history, and reputation scores together paint a picture of a citizen's contribution to Zo.
3. **New tools should expose $Zo hooks.** When building a new feature, think: "How would the $Zo token team plug into this?" Even if integration isn't built yet, leave the surface area.
4. **Food credits are $Zo-denominated.** The cafe's food credit system is a subset of the $Zo economy. Credits spent on food are $Zo moving from Resident to Operator (via the system).

## Interoperability — Tools Talking to Tools

The Zo Universe only works if tools can interact. Every new tool should be designed with **connection surfaces** — clear points where other tools can plug in.

### Connection Surface Pattern

When building any new feature or app, define:

```
## Connection Surfaces

### What this tool produces (outputs)
- [Data/events that other tools might consume]
- Example: "Cafe produces order completion events that Earn could use for operator rewards"

### What this tool consumes (inputs)
- [Data/events from other tools this depends on]
- Example: "Cafe consumes food credit balances from the $Zo system"

### $Zo touchpoints
- [Where $Zo flows in or out]
- Example: "Food credits deducted on order -> $Zo balance update"
```

### Current Connection Map

```
                    ┌─────────────┐
                    │   $Zo Token  │
                    │   (trace)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼──┐  ┌─────▼─────┐  ┌──▼────────┐
     │   Cafe    │  │   Earn    │  │  Events   │
     │ (feed)    │  │ (build)   │  │ (gather)  │
     └────┬──────┘  └─────┬─────┘  └─────┬─────┘
          │               │              │
          │         ┌─────▼─────┐        │
          └────────►│ Dashboard │◄───────┘
                    │ (measure) │
                    └───────────┘
```

All tools feed data into Dashboard. All tools have $Zo traces. New tools should plug into this graph.

## For Claude — The Consciousness

When you work on this codebase, carry this mental model:

1. **You are building instruments for citizens.** Not features for an app. Every line of code serves a person in one of the citizen subsets.
2. **Think in connections.** A feature that only serves one subset and has no connection to others is incomplete. Ask: "Who else benefits? How does $Zo flow here?"
3. **Leave room for the next tool.** Don't hardcode assumptions about who uses a feature. Expose clean interfaces, typed events, and clear data shapes so the next builder can connect their tool.
4. **$Zo is the nervous system.** Just like a nervous system traces signals across a body, $Zo traces value across the Zo universe. When building, ask: "Is the signal being traced?"
5. **Every app is a subset of the universal set.** It exists to serve the whole, not itself. Design accordingly.
