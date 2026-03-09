# AdCreator AI — AI Capabilities Upgrade

## Current State

The app is a full SaaS marketing tool for small businesses with:
- Ad generation (captions with emojis/hashtags in Spanish)
- Ad image display: static pre-generated images mapped by business type (AD_IMAGES map in App.tsx)
- Logo Generator (LogoGeneratorView.tsx): canvas-based renderer with fixed color palettes per style — only changes colors, geometric shapes, and emoji icons; always looks the same for the same style
- Promo Video Generator (PromoVideoView.tsx): simple canvas animation with text, particles, and a platform-colored bar — basic, low visual variety
- Smart prompt: does NOT exist — no prompt generation step before content creation
- All content generation is template-based

## Requested Changes (Diff)

### Add

- Smart prompt generation utility: a function `buildAdPrompt(businessName, businessType, city, promotion)` and `buildLogoPrompt(businessName, businessType, style)` and `buildVideoScenePrompt(businessName, businessType, promoMessage, sceneNumber)` that converts user input into a rich descriptive AI prompt shown as a UI step
- A "Generating AI prompt..." visual step in the ad, logo, and video generation flows
- In ad image generation: replace static template lookup with a canvas-rendered AI-style promo image that uses the smart prompt to visually communicate the product/business — unique per generation using randomized compositions, gradient combos, decorative layers, layout variations
- In logo generation: replace the 4-style fixed canvas with a vastly more varied AI-style canvas system supporting 6 styles (modern, minimal, luxury, bold, tech, vintage) with randomized layout compositions, geometric constructs, letter-based logomarks, unique accent shapes — so each logo looks substantially different even for the same style
- In video generation: replace the single-scene animation with a 4-scene story structure (Scene 1: hook, Scene 2: product highlight, Scene 3: promo message, Scene 4: CTA) with distinct visual themes per scene, animated scene transitions, and scene-specific color palettes

### Modify

- `handleGenerateAd` in App.tsx: replace `setAdImageUrl(AD_IMAGES[fd.businessType])` with a call to a new `generateAdImageOnCanvas(businessName, businessType, city, promotion)` function that renders a unique, AI-styled 1080×1080 promotional image on a canvas and returns a data URL
- `LogoGeneratorView.tsx`: replace `renderLogoToCanvas` with a new `renderAILogoToCanvas` that supports 6 styles with randomized sub-variants so consecutive generations differ substantially; show a "Building AI prompt..." step before generating
- `PromoVideoView.tsx`: upgrade `drawVideoFrame` to a 4-scene story arc with animated transitions between scenes; add a scene indicator UI; show smart prompt in UI before generating

### Remove

- `AD_IMAGES` static map usage for the primary ad image (can keep as fallback for My Ads view where a previously saved imageUrl is a static path)
- Template-only approach in logo/video generators

## Implementation Plan

1. Add smart prompt utilities to a new `src/frontend/src/utils/aiPrompts.ts` file
2. Update `App.tsx`:
   - Add `generateAdImageOnCanvas()` function that builds a rich canvas composition (randomized gradient combos, decorative layers, business icon, business name, promo text overlay, AI badge, watermark) using the smart prompt context
   - Replace the 1200ms static image timeout with the canvas generation call
   - Show a "Generating AI image..." step in the result view while canvas renders
3. Update `LogoGeneratorView.tsx`:
   - Expand styles to 6 (add tech, vintage)
   - Randomize logo compositions (lettermark vs emblem vs wordmark, background geometry, line art vs solid shapes)
   - Add a "Building AI prompt..." animation step before rendering
4. Update `PromoVideoView.tsx`:
   - Implement 4-scene story structure with distinct backgrounds per scene
   - Add animated scene transitions (crossfade, slide)
   - Add scene-indicator dots in the preview UI
   - Show the AI prompt text briefly before generating starts
