# AdCreator AI

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Home screen with a prominent "Create Ad" call-to-action button
- Ad creation form with three fields: type of business, city, and promotion
- Result screen that displays generated marketing text with emojis and hashtags
- Copy-to-clipboard button on the result screen
- Share button (Web Share API) on the result screen
- Navigation between screens (home → form → result → home)

### Modify
N/A

### Remove
N/A

## Implementation Plan

**Backend**
- `generateAd(businessType: Text, city: Text, promotion: Text) : async Text`
  - Returns a marketing text string with emojis and relevant hashtags based on the inputs

**Frontend**
- Three views managed by local state: `home`, `form`, `result`
- Home view: app logo/title, tagline, "Create Ad" primary button
- Form view: controlled inputs for business type, city, promotion; "Generate" submit button; back navigation
- Result view: display generated ad text in a styled card; "Copy" button; "Share" button; "Create Another" button
- Mobile-first layout, dark theme with blue accents
