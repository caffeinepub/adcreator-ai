# AdCreator AI

## Current State

The app has a `PhotoAdView` component accessible from the landing page via "Generar Anuncio desde Foto". It includes a file input with `capture="environment"` (which forces the camera on most mobile browsers), a drag-and-drop zone, a category auto-detector based on filename, and ad generation using existing `generateAd()` logic. The result shows the uploaded image as an ad layout with a watermark overlay, an Instagram preview card, a generated caption, hashtag chips, and action buttons (save, share, download, regenerate).

## Requested Changes (Diff)

### Add
- A second upload button explicitly labeled "Elegir desde Galería" that opens the native photo library (using `<input type="file" accept="image/*">` WITHOUT the `capture` attribute) — this is the key change for gallery access on mobile.
- A clear two-option UI in the upload zone: one button for "Cámara" (with `capture="environment"`) and one for "Galería" (no capture attribute), so users on mobile can choose their source explicitly.
- Smooth step indicator or status messages during "analyzing" to make the process feel like real AI analysis (steps: uploading → analyzing → generating caption → done).
- On the result screen, show a clear "Instagram-style preview" with the user's uploaded photo as the background of the post, with the business name and generated caption overlaid on it — this creates the feel of a "promotional ad layout using the uploaded photo."

### Modify
- The existing file `<input>` with `capture="environment"` should become the "Cámara" button's dedicated input.
- Add a separate `<input>` without `capture` for the "Galería" button.
- The upload zone currently only shows a single "Elegir Foto" button — change it to show two clearly distinct buttons side by side: 📷 Cámara and 🖼️ Galería.
- The generating/loading state messages should cycle through steps: "Analizando imagen...", "Detectando producto...", "Generando caption...", "¡Listo!" to simulate AI analysis flow.
- Remove `capture="environment"` from the "Galería" input so iOS Safari opens the photo picker (not the camera).

### Remove
- Nothing removed; only improvements to existing `PhotoAdView`.

## Implementation Plan

1. In `PhotoAdView`, add a second `useRef<HTMLInputElement>` for the gallery input.
2. Add two separate `<input type="file">` elements: one with `capture="environment"` (camera), one without `capture` (gallery).
3. Replace the single "Elegir Foto" button in the drop zone with two side-by-side buttons: "📷 Cámara" (triggers camera input) and "🖼️ Galería" (triggers gallery input).
4. Add animated step messages during the `isGenerating` state that cycle through analysis steps with a brief delay between each.
5. In the result section, update the "Tu Foto como Anuncio" block to show the uploaded photo with an ad overlay (business name badge + caption text overlay on the image) to simulate a professional ad layout.
6. Ensure all new interactive elements have proper `data-ocid` markers.
7. Validate with typecheck and build.
