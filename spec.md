# AdCreator AI

## Current State

The app is a full-stack SaaS tool for small businesses to generate social media ads. It has:

- Auth via Internet Identity (login/logout)
- Ad generation form (business name, type, city, promotion, tone, platform)
- AI image generation per business type (static assets 1080x1080)
- My Ads dashboard (saved per user via backend)
- Freemium: 3 ads/day limit for free users
- Pro subscription: simulated upgrade, stored in localStorage, removes daily limits
- Admin dashboard with analytics and feedback management
- Photo Ad feature: upload a photo, AI detects category, generates caption
- Pro badge shown in header for upgraded users

## Requested Changes (Diff)

### Add

1. **AI Logo Generator** (`logo` view)
   - Form: business name, business type (same list), logo style (modern, luxury, minimal, bold)
   - Canvas-based logo generation in the browser (no external API needed): renders business name + icon + style-based colors on a 1080x1080 canvas
   - Free users: 3 logos/day limit tracked in localStorage (key: `adcreator_logo_usage_<principalId>`)
   - After limit: show upgrade message "You've reached the free daily limit of 3 logos. Upgrade to AdCreator AI Pro for unlimited logo generation."
   - Actions: preview logo, download (PNG), save to gallery, share
   - Pro users: unlimited

2. **AI Promo Video Generator** (`video` view)
   - Form: business name, promotional message, target platform (Instagram Reels, TikTok, Facebook Reels)
   - Video generated client-side using Canvas API + requestAnimationFrame animation loop recorded via MediaRecorder API (WebM) — vertical 9:16 format (540x960)
   - Animated elements: dynamic background, animated text (business name + promo message), platform badge
   - Free users: 1 free video trial, tracked in localStorage (key: `adcreator_video_usage_<principalId>`)
   - After trial: show upgrade message "Video generation is a premium feature. Upgrade to AdCreator AI Pro to create unlimited promotional videos for your business."
   - Actions: preview video (inline), download (WebM), share to Instagram/Facebook/TikTok
   - Pro users: unlimited

3. **Updated Pro Plan**
   - Pro now covers: unlimited ads + unlimited AI images + unlimited AI logos + unlimited AI promo videos
   - Updated upgrade screen to list all 4 benefits
   - Updated landing page to show all 4 features
   - Pro badge already exists, keep it

### Modify

- `LandingView`: add two new CTA buttons — "Generate Logo with AI" and "Generate Promo Video" — below existing buttons
- `App.tsx`: add `logo` and `video` to the `View` type; add state for logo/video usage; route to new views
- `UpgradeScreen` (in FormView): update benefits list to include logos and videos
- `proStorage.ts`: add helpers for logo usage and video usage (daily count with 24h window)

### Remove

Nothing removed.

## Implementation Plan

1. Extend `proStorage.ts` with `getLogoUsage / incrementLogoUsage / getVideoUsage / incrementVideoUsage` helpers that track daily counts in localStorage with 24h reset
2. Create `LogoGeneratorView` component: form → canvas render → preview → download/share actions; freemium gate after 3/day
3. Create `PromoVideoView` component: form → canvas animation recorded via MediaRecorder → inline video preview → download/share; freemium gate after 1 free video
4. Update `View` type and routing in `App.tsx` to include `logo` and `video` views
5. Add landing page buttons for the two new features
6. Update `UpgradeScreen` benefits to list all 4 Pro perks
