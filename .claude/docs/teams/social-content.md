# Social & Content Team

## Mission

Tell the Zo House story. Builders should be visible — their work, their experiments, their community. Coordinate content across platforms with a single calendar, so nothing falls through the cracks.

## Ownership

### Status

Social features are the least developed area of the monorepo. The specific app location and component structure need to be identified and documented as features are built.

## Patterns to Follow

- **Pages Router** — consistent with all other apps in the monorepo.
- **Ant Design UI** — use antd components for consistency.
- **Supabase for data** — social accounts and content stored via Supabase.
- **Calendar-first** — everything organized by scheduled date. Week view is default.
- **Multi-platform support** — posts can target multiple platforms with platform-specific formatting.

## Known Gaps

- Content calendar implementation status unclear.
- Platform connection setup needs documentation.
- Post scheduling workflow needs documentation.
- No auto-publishing — posts must be manually published.
- No analytics per post.
- No AI content generation.

## Watch Out For

- OAuth tokens expire per platform — each has different refresh logic.
- Platform-specific character limits: Twitter (280), LinkedIn (3000), Instagram (2200), TikTok (2200).

## Decisions

(None recorded yet — add decisions as they're made)

---

*Update this doc when you learn something new about the social system. Use `/learn` to trigger a review.*
