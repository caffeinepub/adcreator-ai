# AdCreator AI

## Current State
The app is a mobile-first Spanish ad generator with a dark blue/navy theme. It has three views: Home, Form, and Result. The header uses a small Sparkles icon + text "AdCreator AI" as the brand mark in the nav. The home screen has a hero image and a basic brand title. Color tokens are already dark with electric blue primary (oklch 0.62 0.22 240). Fonts: Sora (display) and Outfit (body).

## Requested Changes (Diff)

### Add
- A real logo mark: use the generated image `/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png` as the app logo icon, displayed in the header and home screen hero section
- A prominent branded logo lockup on the home screen (logo icon + "AdCreator" wordmark + "AI" badge) replacing or augmenting the current text title
- More vivid blue-to-purple gradient brand color feel: deepen the purple presence in the design tokens and gradients (body background, hero ambient glows, primary gradient)
- Logo appears in header nav across all three views (Home, Form, Result)

### Modify
- Update CSS tokens in `index.css` to add stronger purple accent: shift some ambient glows toward a richer purple-blue spectrum (hue ~270-290 range) to contrast the blue primary
- Enhance the `text-gradient` utility to go from bright cyan through blue to vivid purple (more saturated, wider arc)
- Home screen hero: replace the current Sparkles icon + text in the overlaid title with the actual logo image + bold wordmark for a premium SaaS feel
- Header in all views: replace the `w-7 h-7 rounded-lg bg-primary/20` sparkles box with the actual logo image (small, ~24px tall, square)
- Add a subtle gradient glow behind the logo on the home screen for depth
- Body background: slightly intensify the top radial gradient from blue and add a second purple radial in bottom-right corner for richer depth

### Remove
- Nothing removed, only enhanced

## Implementation Plan
1. Update `index.css`:
   - Intensify body background gradient: stronger blue top + add vivid purple bottom-right radial
   - Enhance `text-gradient` to span cyan → blue → purple with higher chroma
   - Add a new `.logo-glow` utility: soft radial glow behind the logo mark
2. Update `App.tsx`:
   - In all three view headers (HomeView, FormView, ResultView), replace the sparkles icon placeholder with `<img src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png" className="w-6 h-6 object-contain" alt="AdCreator AI logo" />`
   - In HomeView: update the hero section title area — add a prominent logo display above or integrated with the "AdCreator AI" text; show logo icon (~48px) + gradient wordmark below
   - Ensure `data-ocid` markers are preserved throughout
