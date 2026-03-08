# AdCreator AI

## Current State

- Full-stack app with Motoko backend + React/TypeScript frontend.
- User authentication via Internet Identity (Google + Email).
- Ad generation form: business name, type, city, promo, tone, platform, caption length.
- "My Ads" section: backend-stored per-user ads with copy, download, delete.
- Photo Ad feature: upload a photo and generate an ad from it.
- Admin Dashboard: analytics, users table, platform/business-type charts.
- Per-user profiles stored in backend.
- No freemium limits, no feedback system.

## Requested Changes (Diff)

### Add

1. **Freemium daily ad limit (backend)**
   - Track per-user daily ad generation count with a timestamp.
   - Max 3 ads per 24-hour window for all users (no paid tier yet — just the cap).
   - New query: `getDailyAdUsage()` → returns `{ count: Nat; limit: Nat; resetAt: Int }`.
   - `saveAd` increments the counter; a new `checkAndIncrementDailyUsage()` shared function validates and increments atomically (traps if limit reached).

2. **Feedback system (backend)**
   - New type: `Feedback { id: Nat; userEmail: Text; message: Text; submittedAt: Int; userName: Text }`.
   - `submitFeedback(email: Text, message: Text)` — any authenticated user can submit; stores in a global feedback store.
   - `getAllFeedback()` — admin-only query returning all feedback entries sorted by newest first.

3. **Freemium limit UI (frontend)**
   - In `handleGenerateAd`, call `getDailyAdUsage()` before generating. If count >= limit, show a friendly modal/alert:
     "You've reached the free daily limit of 3 ads. Upgrade to AdCreator AI Pro for unlimited ads."
   - Show a subtle usage counter in the form header: "X/3 ads used today".
   - The limit banner should be dismissible and friendly.

4. **"Send Feedback" button + form (frontend)**
   - Add a "Send Feedback" button in the `UserAvatarChip` dropdown menu (visible on all views).
   - When tapped, open a modal with:
     - Email field (pre-filled with user info if available).
     - Message textarea (suggestions / problems / general feedback).
     - Submit button.
   - On success, show a toast "¡Gracias por tu feedback!".

5. **Admin feedback section (frontend)**
   - In `AdminDashboardView`, add a new section below the Users table: "Feedback de Usuarios".
   - Shows a list of all submitted feedback entries with: user name, email, message (truncated), and date.
   - Admin calls `getAllFeedback()` to load the list.
   - Each entry is expandable to show the full message.

### Modify

- `saveAd` backend: call `checkAndIncrementDailyUsage` before saving the ad.
- `UserAvatarChip`: add "Send Feedback" item to the dropdown.
- `AdminDashboardView`: add feedback section query and UI.
- `backend.d.ts`: add new function signatures for feedback + daily usage.

### Remove

- Nothing removed.

## Implementation Plan

1. Update `main.mo`:
   - Add daily usage tracking map `userDailyAdCounts: Map<Principal, {count: Nat; dayTimestamp: Int}>`.
   - Add `checkAndIncrementDailyUsage(caller)` private func (resets if 24h elapsed, traps if >=3).
   - Add `getDailyAdUsage()` public query.
   - Call `checkAndIncrementDailyUsage` inside `saveAd`.
   - Add `Feedback` type and `feedbackStore: Array<Feedback>` (global list).
   - Add `submitFeedback(email, message)` — auth check, store entry.
   - Add `getAllFeedback()` — admin-only query.

2. Regenerate `backend.d.ts` with new types/functions.

3. Frontend — freemium limit:
   - Add `useDailyAdUsage` hook that queries `getDailyAdUsage()`.
   - In `FormView`, display usage counter near submit button.
   - In `handleGenerateAd` (App.tsx), check limit before generating; show limit modal if reached.

4. Frontend — feedback:
   - Add `FeedbackModal` component.
   - Update `UserAvatarChip` to accept `onFeedback` prop and show "Send Feedback" menu item.
   - Wire up mutation to `submitFeedback`.
   - In `AdminDashboardView`, add `getAllFeedback` query and feedback list section.
