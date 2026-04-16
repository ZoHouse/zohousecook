# Passport Avatar Frame — Figma Component Export

**Source:** Figma `Zo Passport` > Frame `Avaatr` (node 1869:4954)
**URL:** https://www.figma.com/design/dXdJu50v7xLL594ntZCKdx/Zo-Passport?node-id=1869-4954
**Exported:** 2026-04-16
**Purpose:** Reference for building the passport locked/unlocked view in `apps/dashboard`

---

## Frame Overview

- **Dimensions:** 360x796 (mobile viewport)
- **Background:** `#111111`
- Contains two side-by-side variations of the passport view (unlocked + locked)

---

## Components

### 1. Avatar Cluster (Group 2105)

Three overlapping circular avatars stacked horizontally.

```
- Size: 24x24 each
- Border: 2px rgba(255,255,255,0.44)
- Border-radius: 100px (circle)
- Fill: profile photo (IMAGE)
- Overlap: staggered x positions to create pile effect
```

### 2. Tab Bar (STays / Pass / TRIPS)

Horizontal tab navigation across the top of the passport section.

```
- Font: Akira Expanded, weight 800, ~20.86px
- Line-height: ~1.1em
- Letter-spacing: 1%
- Active tab ("Pass"): fill #F4F2F2
- Inactive tabs ("STays", "TRIPS"): fill #FFFFFF, opacity 0.5
- Y position: 755
```

### 3. World Map Section (Group 2122 / 2123)

Large SVG world map as the main visual backdrop of the passport.

```
- Gradient overlay: linear-gradient(169deg, #F4F2F2 0%, #8E8D8D 100%)
- Blurred rectangle behind: blur(120px), border-radius 16px, fill #202020, opacity 0.89
- Container: ~507x524
- Offset: x=-78 (bleeds left of viewport for immersive feel)
```

### 4. "14 Travellers Around" Card

Floating card on the map showing nearby travellers.

```
- Dimensions: 160x36
- Position: bottom-right of map area
- Background: linear-gradient(157deg, #343434 3%, #424141 14%, #202020 52%, #303030 100%)
- Border: 3px linear-gradient(180deg, rgba(70,70,70,0.8) 0%, rgba(172,172,172,0.2) 100%)
- Border-radius: 16px
- Text: "14 Travellers around", Rubik 400, 9px, white, centered
- Layout: flex column, justify-end, padding 7.5px 12px 9px

Traveller Thumbnails (4 stacked circles):
  - Sizes: 17px, 22px, 19px, 25px (varied for depth)
  - Each: circular, image fill, opacity 0.9, drop shadow
  - Border colors per avatar:
    - #2C67F6 (blue)
    - #2C67F6 (blue)
    - #00BEA9 (teal)
    - #BA2553 (magenta)
```

### 5. Sidebar Navigation (vertical, right edge)

Vertical icon+label nav anchored to the right of the map.

```
- Layout: flex column, gap 12px, vertically centered
- Position: right edge of frame (x=377)

Items:
| Item           | Opacity | Icon Component    |
|----------------|---------|-------------------|
| Lobby          | 1.0     | wifi (312:4868)   |
| Dailies        | 0.3     | laundry + Map     |
| Badges         | 0.3     | Shield (312:4857) |
| Next Milestone | 0.4     | custom SVG        |

Label style: Rubik 500, ~9px, #F5F5F5, centered
Icon size: 24x24
Item width: ~44px
```

### 6. Passport Tag (#234)

Green-bordered pill showing passport number.

```
- Layout: row, gap 8px, padding 8px 16px 8px 8px
- Dimensions: 90x28 (inner), 333x45 (outer container)
- Background: #202020
- Border: 2px linear-gradient(138deg, #A7D921 0%, #DCFF80 4%, #3C4B14 55%, #587312 76%, #89B020 95%)
- Border-radius: 100px (pill)
- Avatar: 30x30 circle, 2px border rgba(255,255,255,0.16), 512px border-radius
- Text: "#234", Rubik 400, 14px, #FFFFFF, 1% letter-spacing
```

### 7. $Zo Token Badge (1298)

Dark pill showing token count.

```
- Layout: row, gap 8px, padding 8px
- Dimensions: 87x29
- Background: #202020
- Border: 2px, same green gradient as passport tag
- Border-radius: 100px
- Token image: 30x29 circle
- Text: "1298", Rubik 400, 14px, #FFFFFF
- Position: x=26, y=29
```

### 8. Role Cards (Earn / Create / Quest / Host)

Four cards in a horizontal row showing available roles.

```
- Dimensions: 72-73 x 108 each
- Layout: flex column, center, gap 4px, padding 8px 0
- Background: #202020
- Border-radius: 8px
- Position: y=578, spaced across viewport width

Each card contains:
  - Image: ~53x41 (role illustration)
  - Title: Rubik 500, 16px, #FFFFFF, centered, line-height 0.9375em
  - CTA: "Apply", Rubik 400, 10px, rgba(255,255,255,0.44), 2% letter-spacing

Horizontal positions:
  - Quest: x=20
  - Earn: x=103
  - Create: x=185
  - Host: x=268
```

### 9. Section Titles

Three text labels (appear below map, likely scroll-reveal content).

```
- Texts: "Build a Node", "Creators Hub", "Artist/Passionate"
- Font: Rubik 500, 20px, line-height 1.5em
- Width: 283px
- Fill: #111111 (matches background — hidden in this frame, visible on scroll?)
- Y positions: 1997, 2062, 2127 (far below viewport — scroll content)
```

### 10. Profile Photo

Rounded rectangle showing a portrait.

```
- Dimensions: 133x87
- Border-radius: 24px
- Fill: cropped image (STRETCH mode with crop transform)
- Position: x=12, y=92 (top-left of map area)
```

### 11. Private Card (Locked Profile Preview)

The locked/visitor view of a passport — shows limited info.

```
- Dimensions: 181x236
- Position: x=89, y=181 (centered in frame)
- Background: linear-gradient(180deg, #292929 0%, #000000 100%)
- Border-radius: 24px
- Effects:
  - backdrop-filter: blur(120px)
  - box-shadow: 0px 4px 4px rgba(0,0,0,0.25)
  - inner glow: inset 0px 1.93px 7.71px rgba(255,255,255,0.25)

Contents:
  - Avatar: 128x128, border-radius 12px, image fill
  - Name: "Bosse.zo", Syne 700, 24px, #FFFFFF, line-height 1.2em
  - Subtitle: "Citizen of Zo World", Rubik 400, 14px, rgba(255,255,255,0.55), 1% tracking
  - Name+subtitle container: column layout, hug content
```

### 12. Progress Bar (XP/Milestone)

Thin gradient line indicating progress.

```
- Dimensions: ~113x2.78
- Fill gradient: linear-gradient(62deg, #D9D9D9 0%, #737373 96%)
- Position: y=447 (between map and role cards)
- Blurred shadow underneath: blur(20px), #757575
- Inner track: ~40x0.78 fill #1F1F1F with blur(8px)
```

---

## Typography System

| Style Name     | Font Family     | Weight | Size   | Line Height | Tracking | Usage                    |
|----------------|-----------------|--------|--------|-------------|----------|--------------------------|
| Section Title  | Rubik           | 500    | 20px   | 1.5em       | —        | Section headers          |
| Tab Label      | Akira Expanded  | 800    | ~21px  | 1.1em       | 1%       | Tab navigation           |
| Username       | Syne            | 700    | 24px   | 1.2em       | —        | Profile name             |
| Subtitle       | Rubik           | 400    | 14px   | 1.5em       | 1%       | Bio, passport number     |
| Small/CTA      | Rubik           | 400    | 10px   | 1.4em       | 2%       | Apply buttons            |
| Card Title     | Rubik           | 500    | 16px   | 0.9375em    | —        | Role card titles         |
| Nav Label      | Rubik           | 500    | ~9px   | 1.5em       | —        | Sidebar nav labels       |
| Micro Text     | Rubik           | 400    | ~9px   | 1.5em       | 1%       | Traveller count          |

---

## Color Palette

| Token          | Value                                              | Usage                        |
|----------------|----------------------------------------------------|------------------------------|
| bg-primary     | `#111111`                                          | Page background              |
| bg-card        | `#202020`                                          | Cards, tags, pills           |
| bg-private     | `linear-gradient(180deg, #292929, #000)`           | Locked profile card          |
| text-primary   | `#FFFFFF`                                          | Main text                    |
| text-secondary | `rgba(255,255,255,0.55)`                           | Subtitles                    |
| text-muted     | `rgba(255,255,255,0.44)`                           | CTAs, avatar borders         |
| text-dimmed    | `#FFFFFF` at 50% opacity                           | Inactive tabs                |
| accent-green   | gradient `#A7D921 → #DCFF80 → #3C4B14 → #89B020`  | Passport/token pill borders  |
| accent-blue    | `#2C67F6`                                          | Traveller avatar border      |
| accent-teal    | `#00BEA9`                                          | Traveller avatar border      |
| accent-magenta | `#BA2553`                                          | Traveller avatar border      |
| surface-light  | `#D9D9D9`                                          | Avatar placeholder           |
| surface-glass  | `linear-gradient(157deg, #343434..#303030)`        | Glass card background        |
| border-glass   | `linear-gradient(180deg, rgba(70,70,70,0.8)..)`   | Glass card border            |

---

## Key Design Tokens for Implementation

```tsx
// Background
const BG_PRIMARY = '#111111';
const BG_CARD = '#202020';

// Gradients
const GRADIENT_PRIVATE_CARD = 'linear-gradient(180deg, #292929 0%, #000000 100%)';
const GRADIENT_MAP = 'linear-gradient(169deg, #F4F2F2 0%, #8E8D8D 100%)';
const GRADIENT_GLASS_BG = 'linear-gradient(157deg, #343434 3%, #424141 14%, #202020 52%, #303030 100%)';
const GRADIENT_GLASS_BORDER = 'linear-gradient(180deg, rgba(70,70,70,0.8) 0%, rgba(172,172,172,0.2) 100%)';
const GRADIENT_PASSPORT_BORDER = 'linear-gradient(138deg, #A7D921 0%, #DCFF80 4%, #3C4B14 55%, #587312 76%, #89B020 95%)';
const GRADIENT_PROGRESS = 'linear-gradient(62deg, #D9D9D9 0%, #737373 96%)';

// Text
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_MUTED = 'rgba(255,255,255,0.44)';

// Accent (traveller borders)
const ACCENT_BLUE = '#2C67F6';
const ACCENT_TEAL = '#00BEA9';
const ACCENT_MAGENTA = '#BA2553';
```
