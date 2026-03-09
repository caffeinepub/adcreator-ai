/* ═══════════════════════════════════════════════════════════
   AI PROMPT BUILDER UTILITIES
   Generates rich, descriptive prompts for ad, logo, and video generation
═══════════════════════════════════════════════════════════ */

const BUSINESS_DESCRIPTORS: Record<string, string> = {
  gym: "fitness and gym center",
  retail: "retail shop",
  cafe: "coffee shop and café",
  salon: "beauty and hair salon",
  restaurant: "restaurant and food establishment",
  barberShop: "barbershop and men's grooming",
  clothingStore: "fashion and clothing boutique",
  carDealer: "car dealership and automotive",
  pharmacy: "pharmacy and health store",
  electronicsStore: "electronics and tech store",
  bakery: "artisan bakery and pastry shop",
};

const AD_STYLE_DESCRIPTORS: Record<string, string[]> = {
  gym: [
    "energetic fitness photography",
    "dynamic motion blur",
    "bold typography",
    "neon lighting accents",
  ],
  cafe: [
    "warm coffee shop aesthetics",
    "cozy lifestyle photography",
    "steam rising from cups",
    "morning golden hour lighting",
  ],
  restaurant: [
    "professional food photography",
    "vibrant lighting",
    "overhead flat lay composition",
    "mouth-watering close-ups",
  ],
  barberShop: [
    "sharp masculine aesthetics",
    "clean barbershop photography",
    "dramatic side lighting",
    "vintage meets modern design",
  ],
  salon: [
    "elegant beauty photography",
    "soft bokeh lighting",
    "glamorous hair transformations",
    "pastel luxury tones",
  ],
  clothingStore: [
    "fashion editorial photography",
    "lifestyle modeling shots",
    "vibrant color palette",
    "urban street style",
  ],
  carDealer: [
    "automotive studio photography",
    "dramatic low angle shots",
    "metallic reflections",
    "luxury vehicle showcasing",
  ],
  pharmacy: [
    "clean health and wellness photography",
    "bright clinical aesthetics",
    "trust and care visual language",
    "soft green and white palette",
  ],
  electronicsStore: [
    "tech product photography",
    "neon glow effects",
    "futuristic minimalist design",
    "dark mode tech aesthetics",
  ],
  bakery: [
    "artisan food photography",
    "warm rustic tones",
    "freshly baked close-ups",
    "handcrafted premium aesthetics",
  ],
  retail: [
    "lifestyle product photography",
    "vibrant retail displays",
    "bold promotional graphics",
    "modern shopping aesthetics",
  ],
};

const LOGO_STYLE_DESCRIPTORS: Record<string, string> = {
  modern:
    "clean geometric shapes, bold sans-serif typography, gradient color scheme, contemporary flat design",
  luxury:
    "elegant gold and dark color palette, fine serif typography, ornamental details, premium brand mark",
  minimal:
    "ultra-minimal design, generous whitespace, thin line elements, refined single-color palette",
  bold: "high contrast design, impactful typography, strong geometric forms, energetic color blocking",
  tech: "circuit board inspired patterns, electric cyan accents, dark futuristic background, monospace technical font",
  vintage:
    "retro badge design, warm amber and sepia tones, ornamental borders, classic serif letterforms",
};

const SCENE_THEMES: Record<
  number,
  {
    en: string;
    concept: string;
    visual: string;
  }
> = {
  1: {
    en: "attention-grabbing hook",
    concept: "Bold question or statement that stops the scroll",
    visual:
      "vibrant energy burst, dramatic background, bold white headline text",
  },
  2: {
    en: "product and service highlight",
    concept: "Showcasing the best of what the business offers",
    visual:
      "product showcase lighting, warm inviting atmosphere, feature highlights",
  },
  3: {
    en: "promotional offer reveal",
    concept: "The irresistible deal or promotion announcement",
    visual:
      "deal reveal animation style, urgency-driven design, bright CTA colors",
  },
  4: {
    en: "call to action",
    concept: "Drive the viewer to take immediate action",
    visual:
      "clean directional composition, action button feel, trust-building elements",
  },
};

/**
 * Builds a rich smart prompt for ad image generation
 */
export function buildAdPrompt(
  businessName: string,
  businessType: string,
  city: string,
  promotion: string,
): string {
  const bizDesc =
    BUSINESS_DESCRIPTORS[businessType] ?? `${businessType} business`;
  const styleDesc = AD_STYLE_DESCRIPTORS[businessType] ?? [
    "professional marketing photography",
    "vibrant colors",
    "modern layout",
  ];
  const randomStyles = styleDesc
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .join(", ");

  const name = businessName.trim() || "this business";
  const cityPart = city.trim() ? ` in ${city.trim()}` : "";
  const promoPart = promotion.trim()
    ? `, promotion: ${promotion.trim()}`
    : ", special offer";

  return `Professional Instagram advertisement for ${name}${cityPart}, a ${bizDesc}${promoPart}, ${randomStyles}, modern marketing design, social media style, square 1:1 format, ultra-high quality, photorealistic`;
}

/**
 * Builds a rich smart prompt for logo generation
 */
export function buildLogoPrompt(
  businessName: string,
  businessType: string,
  style: string,
): string {
  const bizDesc =
    BUSINESS_DESCRIPTORS[businessType] ?? `${businessType} business`;
  const styleDesc =
    LOGO_STYLE_DESCRIPTORS[style] ?? "professional modern logo design";
  const name = businessName.trim() || "Business";

  return `${style.charAt(0).toUpperCase() + style.slice(1)} professional brand logo for "${name}", a ${bizDesc} — ${styleDesc}, vector-quality logo mark, suitable for business branding and social media, square format`;
}

/**
 * Builds a smart prompt for a specific video scene (1-4)
 */
export function buildVideoScenePrompt(
  businessName: string,
  businessType: string,
  promoMessage: string,
  scene: number,
): string {
  const bizDesc =
    BUSINESS_DESCRIPTORS[businessType] ?? `${businessType} business`;
  const sceneTheme = SCENE_THEMES[scene] ?? SCENE_THEMES[1];
  const name = businessName.trim() || "this business";
  const promo = promoMessage.trim() || "special promotional offer";

  return `Scene ${scene} — ${sceneTheme.en.toUpperCase()}: ${name} (${bizDesc}), ${sceneTheme.concept}, featuring "${promo}", ${sceneTheme.visual}, vertical 9:16 format, Instagram Reels style`;
}

/**
 * Generates an array of 4 scene prompts for a complete promo video
 */
export function buildVideoSceneBreakdown(
  businessName: string,
  businessType: string,
  promoMessage: string,
): string[] {
  return [1, 2, 3, 4].map((scene) =>
    buildVideoScenePrompt(businessName, businessType, promoMessage, scene),
  );
}
