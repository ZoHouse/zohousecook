# Passport Creator Social Loop - Product Flow Draft

**Date:** 2026-04-06  
**Author:** Samurai + Codex  
**Status:** Brainstorm draft

---

## One-line idea

A user discovers Passport through another creator's Instagram story, taps an affiliate link, completes a lightweight identity-first onboarding flow, gets a Passport and avatar, lands inside a Fortnite-style citizen dashboard, and is then prompted to share their own affiliate link so the loop repeats.

---

## Why this flow matters

The product should not feel like a normal signup funnel.

It should feel like:
- social discovery first
- identity creation second
- instant payoff third
- earning loop immediately after

The user should feel:
- "I got invited by a real person"
- "I now have a public identity in Zo World"
- "I can start sharing this and earning right away"

---

## Core loop

1. A creator posts an Instagram story.
2. A viewer taps the creator's affiliate link.
3. The viewer lands on a public Passport campaign page tied to that creator.
4. The viewer signs up or logs in.
5. If the viewer is new, onboarding starts.
6. The viewer creates their handle, identity, and avatar.
7. Passport is generated.
8. The user lands on their Passport page and citizen dashboard.
9. The user gets their own affiliate link and creator campaign CTA.
10. The user shares their own story/link.
11. The next user enters through that link.

That is the social loop.

---

## Product promise

Passport is not just signup.

Passport is:
- your public identity
- your avatar
- your first citizen dashboard
- your creator entry point
- your earning link

The loop should communicate that Zo World is something you join through people, not something you browse passively.

---

## Main user paths

### Path A: New user

The user has no account and no Passport.

Flow:
1. Click story affiliate link
2. Land on campaign page
3. Sign up
4. Complete onboarding
5. Generate Passport
6. Land on Passport page
7. See creator CTA and share link

This is the main path.

### Path B: Existing user, logged out

The user already has an account but is not logged in.

Flow:
1. Click story affiliate link
2. Land on campaign page
3. Log in
4. If onboarding incomplete, resume missing steps
5. If onboarding complete, land directly on Passport page with creator CTA

### Path C: Existing user, logged in, onboarding incomplete

The user is already known to the system but does not yet have a complete Passport.

Flow:
1. Click story affiliate link
2. Go straight to missing onboarding steps
3. Generate Passport
4. Land on Passport page with creator CTA

### Path D: Existing user, fully onboarded

The user already has Passport.

Flow:
1. Click story affiliate link
2. Land directly on Passport or dashboard
3. See creator campaign panel and share CTA

---

## Desired screen sequence

### 1. Instagram Story

Purpose:
- create curiosity
- create social proof
- make the CTA feel personal

Possible CTA language:
- Claim your Passport
- Join my creator link
- Enter Zo World
- Start earning with Passport

Expected action:
- user taps creator affiliate link

### 2. Creator Campaign Landing Page

Purpose:
- explain what the user is about to get
- show that they came through a creator
- reduce drop-off before signup

Must communicate:
- you were invited by a creator
- Passport gives you a public identity
- you will create your own handle and avatar
- you will get your own creator link after onboarding

Primary CTA:
- Start your Passport

Secondary CTA:
- Log in

Notes:
- this page should feel campaign-like, not like a generic auth wall
- inviter identity should be visible if available

### 3. Auth Gate

Purpose:
- get the user into the system with the least friction possible

Preferred path:
- mobile OTP

Fallback:
- email OTP

Important:
- the original affiliate context must survive auth
- after login, the user should continue the same journey

### 4. Onboarding Step: Nickname / Handle

Purpose:
- create public identity first

Input:
- nickname or `.zo` style handle

Outcome:
- this becomes the user's public Passport identity

Why this comes first:
- it gives the user a sense of ownership early
- it makes the rest of the flow feel like character creation, not form filling

### 5. Onboarding Step: Location

Purpose:
- capture current city or current location context

Use:
- local discovery
- nearby people/plans
- future neighborhood/community features

Notes:
- this can be device location permission or manual entry
- this is different from hometown

### 6. Onboarding Step: Hometown

Purpose:
- capture the user's home identity marker

Use:
- Passport profile
- social identity
- city-based sorting and future community features

Important:
- current location and hometown should be treated as separate concepts

### 7. Onboarding Step: Body Type Selection

Purpose:
- start character creation

Input:
- body type / base avatar form

Outcome:
- unlock avatar generation

This step should feel playful and game-like, not administrative.

### 8. Onboarding Step: Avatar Creation

Purpose:
- give the user instant payoff

Flow:
- body type selected
- avatar generated
- Passport visual identity becomes real

Important:
- this is the emotional payoff moment
- the user should feel "I now exist in Zo World"

### 9. Passport Generated Screen

Purpose:
- mark the transition from onboarding into the world

Must show:
- avatar
- handle
- Passport created state
- lightweight initial stats

Stats can begin simple:
- XP
- citizen level
- location / hometown
- creator status

Even if real stats are not yet populated, the screen should not feel empty.

### 10. Passport Landing Page

Purpose:
- land the user inside the product, not on a dead-end confirmation page

The Passport page should combine:
- Fortnite-style avatar editor
- Passport identity card
- citizen dashboard
- creator campaign entry

Suggested layout:
- top: Passport identity, handle, XP, level
- center: full-body avatar editor
- side or below: creator campaign card, stats, next actions

The first landing should feel like:
"Your character is live. Now do something with it."

### 11. Creator Campaign Join State

Purpose:
- move the user from identity creation into earning behavior

Primary CTA options:
- Join Creator Campaign
- Connect Instagram
- Get your affiliate link

This is where the product shifts from:
- "create your identity"
to
- "activate your earning loop"

### 12. Share Link / Social Loop Restart

Purpose:
- close the loop back to Instagram

User should be able to:
- copy affiliate link
- share to Instagram story
- invite others into Passport

This is the key loop-completion moment:
- the newly onboarded user becomes the next inviter

---

## Recommended MVP order

For MVP, the flow should be:

1. Story click
2. Creator landing page
3. Auth
4. Nickname
5. Current location
6. Hometown
7. Body type
8. Avatar generation
9. Passport generated reveal
10. Passport page
11. Creator campaign CTA
12. Copy/share affiliate link

This order keeps:
- identity first
- context second
- visual payoff third
- earning fourth

---

## Why this order works

### Nickname first

The user starts by becoming someone.

### Location and hometown before avatar

The user places themselves in the world before styling themselves inside it.

### Avatar before dashboard

The user receives a visual reward before being asked to do more.

### Dashboard before creator sharing

The user first sees what they now own, then gets asked to propagate it.

---

## Passport landing experience

The first Passport landing should answer four questions immediately:

### 1. Who am I here?

Show:
- handle
- avatar
- Passport identity

### 2. What do I have now?

Show:
- Passport created
- citizen dashboard
- initial XP / level / status

### 3. What can I do next?

Show:
- edit avatar
- complete profile
- connect Instagram
- join creator campaign

### 4. How do I spread this?

Show:
- affiliate link
- copy CTA
- share CTA

---

## Data captured in this flow

At the product level, this flow likely needs to capture:

- inviter handle or referral code
- signup source = Instagram story / creator link
- auth identity
- nickname / handle
- current location
- hometown
- body type
- generated avatar
- Passport created timestamp
- creator campaign joined state
- Instagram connected state
- shareable affiliate link

---

## What should feel instant

The user should get immediate visible reward after onboarding:

- a handle
- an avatar
- a Passport
- a stats card
- a creator action

Without that, the flow risks feeling like setup without payoff.

---

## What should be deferred

These do not need to block MVP:

- deep monetization settings
- full creator dashboard
- quest system complexity
- detailed leaderboards
- referral analytics
- social proof beyond basic inviter context
- advanced avatar wardrobe/editor depth

MVP should prove the loop, not the full economy.

---

## Key product questions to settle

1. Is the share link tied to a handle, a user ID, or a separate referral code?
2. Should current location be optional while hometown is mandatory?
3. Does Instagram connection happen before the user gets their affiliate link, or after?
4. Is "Join Creator Campaign" a toggle/state change, or is everyone onboarded automatically into it?
5. Should the Passport landing open directly into the avatar editor, or land on the Passport card first with an "Edit Avatar" CTA?
6. What exact stats should be shown on day zero so the page feels alive?
7. Should returning users who already have Passport still see the inviter attribution, or should they bypass it entirely?
8. What is the earning event for the inviter: click, signup, completed Passport, or creator activation?

---

## Recommended framing

The narrative should be:

"You were invited into Zo World by a creator.  
Claim your Passport.  
Build your identity.  
Enter the citizen dashboard.  
Get your own link.  
Invite the next person."

That is the cleanest version of the loop.

---

## Relationship to existing specs

This doc is the product-flow layer above:

- `docs/superpowers/specs/2026-04-01-instagram-connect-design.md`
- `docs/superpowers/specs/2026-04-05-zozozo-onboarding-design.md`

Those specs describe implementation slices.

This doc describes the overall user journey we want those slices to serve.

