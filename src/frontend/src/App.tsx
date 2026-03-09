import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  Building2,
  Camera,
  CheckCheck,
  Copy,
  Download,
  Heart,
  ImageIcon,
  Layers,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Ad, DailyUsageStats } from "./backend";
import { UserRole } from "./backend";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { FeedbackModal } from "./components/FeedbackModal";
import { LogoGeneratorView } from "./components/LogoGeneratorView";
import { PromoVideoView } from "./components/PromoVideoView";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { buildAdPrompt } from "./utils/aiPrompts";
import {
  getLogoUsage,
  getVideoUsage,
  incrementLogoUsage,
  incrementVideoUsage,
  isUserPro,
  markUserAsPro,
} from "./utils/proStorage";

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */

type AdTone = "profesional" | "urgente" | "divertido" | "promocion";
type View =
  | "landing"
  | "home"
  | "form"
  | "result"
  | "myads"
  | "photo_ad"
  | "admin"
  | "logo"
  | "video";
type Platform = "instagram" | "facebook" | "tiktok";
type CaptionLength = "short" | "long";

interface FormData {
  businessName: string;
  businessType: string;
  city: string;
  promotion: string;
  discount: string;
  whatsapp: string;
  tone: AdTone;
  platform: Platform;
  captionLength: CaptionLength;
}

interface AdVersions {
  short: string;
  long: string;
}

interface SavedAd {
  id: string;
  businessName: string;
  imageUrl: string | null;
  captionShort: string;
  captionLong: string;
  platform: Platform;
  savedAt: number;
}

/* ═══════════════════════════════════════
   LOCALSTORAGE HELPERS
═══════════════════════════════════════ */

function loadSavedAds(): SavedAd[] {
  try {
    return JSON.parse(localStorage.getItem("adcreator_saved_ads") ?? "[]");
  } catch {
    return [];
  }
}

function saveAdToStorage(ad: SavedAd): void {
  const ads = loadSavedAds();
  ads.unshift(ad);
  localStorage.setItem("adcreator_saved_ads", JSON.stringify(ads.slice(0, 50)));
}

/* ═══════════════════════════════════════
   BUSINESS DATA
═══════════════════════════════════════ */

const BUSINESS_DATA: Record<
  string,
  { emoji: string; nameES: string; hashtags: string }
> = {
  gym: {
    emoji: "🏋️‍♂️",
    nameES: "gimnasio",
    hashtags: "#Fitness #Entrenamiento #VidaSaludable #Gym",
  },
  retail: {
    emoji: "🛍️",
    nameES: "tienda",
    hashtags: "#Compras #Tienda #OfertasEspeciales #Retail",
  },
  cafe: {
    emoji: "☕",
    nameES: "cafetería",
    hashtags: "#CaféLovers #CaféVibes #Brunch #Cafetería",
  },
  salon: {
    emoji: "✂️",
    nameES: "salón de belleza",
    hashtags: "#Belleza #CuidadoPersonal #Estética #Salon",
  },
  restaurant: {
    emoji: "🍽️",
    nameES: "restaurante",
    hashtags: "#Foodie #ComidaLocal #Gastronomia #Restaurante",
  },
  barberShop: {
    emoji: "💈",
    nameES: "barbería",
    hashtags: "#Barberia #EstiloMasculino #Corte #Barbero",
  },
  clothingStore: {
    emoji: "👗",
    nameES: "tienda de ropa",
    hashtags: "#Moda #Estilo #TiendaDeRopa #Fashion",
  },
  carDealer: {
    emoji: "🚗",
    nameES: "concesionaria",
    hashtags: "#Autos #Concesionaria #CarLovers #Vehiculos",
  },
  pharmacy: {
    emoji: "💊",
    nameES: "farmacia",
    hashtags: "#Salud #Farmacia #Bienestar #CuidadoDelCuerpo",
  },
  electronicsStore: {
    emoji: "📱",
    nameES: "tienda de electrónica",
    hashtags: "#Tecnología #Gadgets #TechLovers #Electrónica",
  },
  bakery: {
    emoji: "🥐",
    nameES: "panadería",
    hashtags: "#Panaderia #PanArtesanal #Postres #Reposteria",
  },
};

/* ═══════════════════════════════════════
   AD IMAGES MAP
═══════════════════════════════════════ */

const AD_IMAGES: Record<string, string[]> = {
  barberShop: ["/assets/generated/ad-barbershop.dim_1080x1080.jpg"],
  cafe: [
    "/assets/generated/ad-cafe.dim_1080x1080.jpg",
    "/assets/generated/ad-cafe-v2.dim_1080x1080.jpg",
  ],
  gym: [
    "/assets/generated/ad-gym.dim_1080x1080.jpg",
    "/assets/generated/ad-gym-v2.dim_1080x1080.jpg",
  ],
  restaurant: [
    "/assets/generated/ad-restaurant.dim_1080x1080.jpg",
    "/assets/generated/ad-restaurant-v2.dim_1080x1080.jpg",
  ],
  clothingStore: ["/assets/generated/ad-clothing.dim_1080x1080.jpg"],
  pharmacy: ["/assets/generated/ad-pharmacy.dim_1080x1080.jpg"],
  electronicsStore: ["/assets/generated/ad-electronics.dim_1080x1080.jpg"],
  bakery: [
    "/assets/generated/ad-bakery.dim_1080x1080.jpg",
    "/assets/generated/ad-bakery-v2.dim_1080x1080.jpg",
  ],
  salon: ["/assets/generated/ad-salon.dim_1080x1080.jpg"],
  retail: ["/assets/generated/ad-retail.dim_1080x1080.jpg"],
  carDealer: [
    "/assets/generated/ad-car-dealer.dim_1080x1080.jpg",
    "/assets/generated/ad-car-dealer-v2.dim_1080x1080.jpg",
  ],
};

function pickAdImage(
  businessType: string,
  exclude?: string | null,
): string | null {
  const variants = AD_IMAGES[businessType];
  if (!variants || variants.length === 0) return null;
  if (variants.length === 1) return variants[0];
  // Try to pick a different variant from the currently shown one
  const available = exclude ? variants.filter((v) => v !== exclude) : variants;
  const pool = available.length > 0 ? available : variants;
  return pool[Math.floor(Math.random() * pool.length)];
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  gym: "🏋️ Gimnasio",
  retail: "🛍️ Tienda",
  cafe: "☕ Cafetería",
  salon: "✂️ Salón de Belleza",
  restaurant: "🍽️ Restaurante",
  barberShop: "💈 Barbería",
  clothingStore: "👗 Tienda de Ropa",
  carDealer: "🚗 Concesionaria",
  pharmacy: "💊 Farmacia",
  electronicsStore: "📱 Tienda de Electrónica",
  bakery: "🥐 Panadería",
};

const TONE_LABELS: Record<AdTone, string> = {
  profesional: "💼 Profesional",
  urgente: "🚨 Urgente",
  divertido: "🎉 Divertido",
  promocion: "💥 Promoción",
};

/* ═══════════════════════════════════════
   CITY HASHTAGS HELPER
═══════════════════════════════════════ */

function getCityHashtags(city: string): string {
  const c = city.toLowerCase();
  if (c.includes("miami")) return "#Miami #SouthBeach";
  if (c.includes("new york")) return "#NuevaYork #NYC";
  if (c.includes("los angeles")) return "#LosAngeles #LA";
  if (c.includes("chicago")) return "#Chicago";
  if (c.includes("houston")) return "#Houston";
  if (
    c.includes("cdmx") ||
    c.includes("ciudad de mexico") ||
    c.includes("ciudad de méxico")
  )
    return "#CDMX #CiudadDeMexico";
  if (c.includes("monterrey")) return "#Monterrey #RegioMTY";
  if (c.includes("guadalajara")) return "#Guadalajara #GDL";
  if (c.includes("bogot")) return "#Bogotá #Colombia";
  if (c.includes("buenos aires")) return "#BuenosAires #Argentina";
  if (c.includes("madrid")) return "#Madrid #España";
  if (c.includes("barcelona")) return "#Barcelona";
  if (c.includes("lima")) return "#Lima #Peru";
  if (c.includes("santiago")) return "#Santiago #Chile";
  return "#NegocioLocal #TuCiudad";
}

/* ═══════════════════════════════════════
   AD GENERATION — TWO VERSIONS
═══════════════════════════════════════ */

function generateAd(data: FormData): AdVersions {
  const biz = BUSINESS_DATA[data.businessType] ?? {
    emoji: "🏪",
    nameES: "negocio",
    hashtags: "#Negocio #Ofertas",
  };

  const { emoji, hashtags: businessHashtags } = biz;
  const cityHashtags = getCityHashtags(data.city);
  const discountText =
    data.discount.trim() !== ""
      ? `\n\n¡Aprovecha el ${data.discount}% de descuento! 🎉`
      : "";
  const whatsappShort =
    data.whatsapp.trim() !== "" ? `\n📲 ${data.whatsapp.trim()}` : "";
  const whatsappLong =
    data.whatsapp.trim() !== ""
      ? `\n\n📲 Contáctanos: ${data.whatsapp.trim()}`
      : "";

  const name = data.businessName.trim() || biz.nameES;
  const city = data.city.trim();
  const promo = data.promotion.trim();

  let short = "";
  let long = "";

  // TikTok platform gets punchy short captions
  if (data.platform === "tiktok") {
    const tiktokHashtags = "#FYP #ParaTi #Viral";
    switch (data.tone) {
      case "profesional":
        short = `✨ ${name} — ${city}\n${promo}${discountText}${whatsappShort}\n${businessHashtags} ${tiktokHashtags}`;
        long = `✨ ${emoji} ${name} en ${city}\n\n${promo}${discountText}\n\nCalidad garantizada. ¡Visítanos hoy!${whatsappLong}\n${businessHashtags} ${cityHashtags} ${tiktokHashtags}`;
        break;
      case "urgente":
        short = `⚠️ ${name} - ${city} ¡AHORA!\n${promo}${discountText}${whatsappShort}\n${businessHashtags} ${tiktokHashtags} #OfertaLimitada`;
        long = `⚠️🚨 ¡NO TE LO PIERDAS!\n${name.toUpperCase()} en ${city.toUpperCase()}\n⏰ ${promo}${discountText}\n¡Solo por tiempo limitado! 🏃‍♂️${whatsappLong}\n${businessHashtags} ${cityHashtags} ${tiktokHashtags} #OfertaLimitada`;
        break;
      case "divertido":
        short = `🔥 ${name} en ${city} ${emoji}\n¡${promo}!${discountText}${whatsappShort}\n${businessHashtags} ${tiktokHashtags}`;
        long = `🎉🔥 ¡${city.toUpperCase()} ESCUCHA! ${emoji}\n¡${name} tiene algo increíble!\n✨ ${promo}!${discountText}\n¡Cuéntale a tus amigos! 😜${whatsappLong}\n${businessHashtags} ${cityHashtags} ${tiktokHashtags} #BuenVibes`;
        break;
      case "promocion":
        short = `💥 ${emoji} ${name} | ${city}\n🎁 ${promo}${discountText}${whatsappShort}\n${businessHashtags} ${tiktokHashtags} #Oferta`;
        long = `💥 ¡GRAN PROMO en ${city}! ${emoji}\n🎁 ${name} te trae:\n${promo}${discountText}\n¡No lo dejes pasar! 👥${whatsappLong}\n${businessHashtags} ${cityHashtags} ${tiktokHashtags} #Ahorra`;
        break;
      default:
        short = `🎉 ${emoji} ${name} en ${city}\n${promo}\n${businessHashtags} ${tiktokHashtags}`;
        long = short;
    }
    return { short, long };
  }

  switch (data.tone) {
    case "profesional":
      short = `✨ ${emoji} ${name} en ${city}\n\n${promo}${discountText}\n\n${businessHashtags} ${cityHashtags}${whatsappShort}`;
      long = `✨ ${emoji} Estimados clientes de ${city},\n\nNos complace presentarles una oportunidad especial de ${name}.\n\n${promo}${discountText}\n\nLos invitamos a visitarnos y descubrir la calidad de nuestros servicios. ¡Los esperamos con los brazos abiertos!${whatsappLong}\n\n${businessHashtags} ${cityHashtags} #Calidad #Excelencia`;
      break;

    case "urgente":
      short = `⚠️🚨 ¡ÚLTIMA OPORTUNIDAD! ${emoji} ${name} — ${city}\n⏰ ${promo}${discountText}\n${businessHashtags} ${cityHashtags} #OfertaLimitada${whatsappShort}`;
      long = `⚠️🚨 ¡NO TE LO PUEDES PERDER!\n\n${name.toUpperCase()} en ${city.toUpperCase()} tiene una oferta que NO se repetirá.\n\n⏰ ${promo}${discountText}\n\n¡Solo por tiempo limitado! 🏃‍♂️💨 Corre antes de que se acabe.${whatsappLong}\n\n${businessHashtags} ${cityHashtags} #OfertaLimitada #AhoritaMismo`;
      break;

    case "divertido":
      short = `🎉🔥 ¡${name} en ${city}! ${emoji}\n¡${promo}!${discountText}\n${businessHashtags} ${cityHashtags}${whatsappShort}`;
      long = `🎉🔥 ¡ATENCIÓN, ${city.toUpperCase()}! ${emoji}\n\n¡${name} tiene algo increíble para ti!\n\n✨ ${promo}!${discountText}\n\n¡No te lo puedes perder! 😜🙌 ¡Comparte con tus amigos y vengan juntos! 💥✨${whatsappLong}\n\n${businessHashtags} ${cityHashtags} #BuenVibes #DivertidoYEpico`;
      break;

    case "promocion":
      short = `💥 ${emoji} ${name} | ${city}\n🎁 ${promo}${discountText}\n${businessHashtags} ${cityHashtags}${whatsappShort}`;
      long = `💥 ¡GRAN PROMOCIÓN en ${city}! ${emoji}\n\n🎁 ${name} te trae una oferta especial:\n\n${promo}${discountText}\n\nVisita ${name} y aprovecha esta increíble oferta. ¡Comparte con tus amigos para que no se lo pierdan! 👥💬${whatsappLong}\n\n${businessHashtags} ${cityHashtags} #Promocion #Ahorra #NoTeLoPierdas`;
      break;

    default:
      short = `🎉 ${emoji} ${name} en ${city}\n${promo}\n${businessHashtags} ${cityHashtags}`;
      long = short;
  }

  return { short, long };
}

/* ═══════════════════════════════════════
   VARIATION GENERATION
═══════════════════════════════════════ */

function generateVariation(data: FormData, seed: number): AdVersions {
  const biz = BUSINESS_DATA[data.businessType] ?? {
    emoji: "🏪",
    nameES: "negocio",
    hashtags: "#Negocio #Ofertas",
  };

  const { emoji, hashtags: businessHashtags } = biz;
  const cityHashtags = getCityHashtags(data.city);
  const name = data.businessName.trim() || biz.nameES;
  const city = data.city.trim();
  const promo = data.promotion.trim();
  const discountText =
    data.discount.trim() !== "" ? ` ¡${data.discount}% de descuento!` : "";
  const whatsappText =
    data.whatsapp.trim() !== "" ? `\n📲 ${data.whatsapp.trim()}` : "";

  const openers = [
    `¡Hola ${city}!`,
    `📣 Atención ${city}!`,
    `🔥 ${name} tiene algo especial para ti:`,
  ];
  const ctas = [
    "¡Visítanos hoy!",
    "¡No lo dejes pasar!",
    "¡Cuéntale a tus amigos!",
  ];

  const opener = openers[seed];
  const cta = ctas[seed];

  const base = generateAd(data);

  const short = `${opener}\n\n${emoji} ${promo}${discountText}\n\n${cta}${whatsappText}\n${businessHashtags} ${cityHashtags}`;
  const long = `${opener}\n\n${base.long}\n\n${cta}`;

  return { short, long };
}

/* ═══════════════════════════════════════
   INSTAGRAM DOWNLOAD — IMPROVED 1080x1080
═══════════════════════════════════════ */

function downloadInstagramImage(businessName: string, adText: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;

  // Deep dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
  bgGrad.addColorStop(0, "#0a0a1a");
  bgGrad.addColorStop(0.5, "#0d0d20");
  bgGrad.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Blue glow arc top-right
  const glowTR = ctx.createRadialGradient(980, 100, 0, 980, 100, 400);
  glowTR.addColorStop(0, "rgba(99, 132, 255, 0.35)");
  glowTR.addColorStop(0.5, "rgba(60, 100, 230, 0.15)");
  glowTR.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowTR;
  ctx.fillRect(0, 0, 1080, 1080);

  // Purple glow bottom-left
  const glowBL = ctx.createRadialGradient(100, 980, 0, 100, 980, 350);
  glowBL.addColorStop(0, "rgba(130, 80, 220, 0.3)");
  glowBL.addColorStop(0.5, "rgba(100, 60, 180, 0.12)");
  glowBL.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowBL;
  ctx.fillRect(0, 0, 1080, 1080);

  // Business name — large bold centered at top
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 60px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Wrap business name if long
  const nameMaxW = 960;
  const nameWords = businessName.split(" ");
  const nameLines: string[] = [];
  let nameLine = "";
  for (const word of nameWords) {
    const test = nameLine + (nameLine ? " " : "") + word;
    if (ctx.measureText(test).width > nameMaxW && nameLine) {
      nameLines.push(nameLine);
      nameLine = word;
    } else {
      nameLine = test;
    }
  }
  if (nameLine) nameLines.push(nameLine);

  let nameY = 160;
  for (const nl of nameLines) {
    ctx.fillText(nl, 540, nameY);
    nameY += 72;
  }

  // Divider line below name
  const dividerY = nameY + 24;
  const divGrad = ctx.createLinearGradient(140, dividerY, 940, dividerY);
  divGrad.addColorStop(0, "rgba(99, 132, 255, 0)");
  divGrad.addColorStop(0.3, "rgba(99, 132, 255, 0.7)");
  divGrad.addColorStop(0.7, "rgba(99, 132, 255, 0.7)");
  divGrad.addColorStop(1, "rgba(99, 132, 255, 0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, dividerY);
  ctx.lineTo(940, dividerY);
  ctx.stroke();

  // Ad text body — centered, wrapped at 900px
  ctx.fillStyle = "#e8e8f5";
  ctx.font = "36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const lines = adText.split("\n").filter((l) => l.trim() !== "");
  const lineHeight = 52;
  const bodyStartY = dividerY + 50;

  // Pre-wrap all lines
  const wrappedLines: string[] = [];
  for (const line of lines) {
    const words = line.split(" ");
    let cur = "";
    for (const word of words) {
      const test = cur + (cur ? " " : "") + word;
      if (ctx.measureText(test).width > 900 && cur) {
        wrappedLines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) wrappedLines.push(cur);
    wrappedLines.push(""); // paragraph break
  }

  const totalBodyH = wrappedLines.length * lineHeight;
  const availH = 1080 - bodyStartY - 100;
  const startY = bodyStartY + Math.max(0, (availH - totalBodyH) / 2);

  let currentY = startY;
  for (const wl of wrappedLines) {
    if (currentY + lineHeight > 1080 - 90) break;
    ctx.fillText(wl, 540, currentY);
    currentY += lineHeight;
  }

  // Bottom watermark
  ctx.fillStyle = "rgba(150, 150, 200, 0.55)";
  ctx.font = "22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Created with AdCreator AI by Cristhian Paz", 540, 1048);

  // Download
  const link = document.createElement("a");
  link.download = "anuncio-instagram.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════ */

const pageVariants = {
  initial: { opacity: 0, y: 28, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.97,
    transition: { duration: 0.18, ease: "easeIn" as const },
  },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ═══════════════════════════════════════
   MOBILE UTILITY FUNCTIONS
═══════════════════════════════════════ */

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return (
    /iP(ad|hone|od)/i.test(ua) &&
    /WebKit/i.test(ua) &&
    !/CriOS|FxiOS|OPiOS|mercury/i.test(ua)
  );
}

async function saveToPhotos(imageUrl: string): Promise<void> {
  if (isIOSSafari()) {
    // On iOS Safari: open image in new tab so user can long-press to save
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank");
    toast.info('Mantén presionada la imagen y selecciona "Añadir a Fotos"', {
      duration: 5000,
    });
  } else {
    // Android / Desktop: trigger blob download
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "anuncio-adcreator.jpg";
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("¡Imagen guardada!", { duration: 2000 });
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.");
    }
  }
}

async function shareAdImage(imageUrl: string, adText: string): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], "anuncio-adcreator.jpg", {
      type: blob.type,
    });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Mi Anuncio",
        text: adText,
      });
    } else if (navigator.share) {
      await navigator.share({ title: "Mi Anuncio", text: adText });
    } else {
      await navigator.clipboard.writeText(adText);
      toast.success("¡Texto del anuncio copiado!", { duration: 2000 });
    }
  } catch (err) {
    if (err instanceof Error && err.name !== "AbortError") {
      toast.error("No se pudo compartir. Intenta copiar el texto manualmente.");
    }
  }
}

/* ═══════════════════════════════════════
   FULLSCREEN IMAGE MODAL
═══════════════════════════════════════ */

interface AdImageFullscreenModalProps {
  imageUrl: string;
  adText: string;
  onClose: () => void;
}

function AdImageFullscreenModal({
  imageUrl,
  adText,
  onClose,
}: AdImageFullscreenModalProps) {
  const ios = isIOSSafari();
  return (
    <motion.div
      data-ocid="result.fullscreen_image_modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          data-ocid="result.fullscreen_close_button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        role="presentation"
      >
        <img
          src={imageUrl}
          alt="Imagen del anuncio"
          className="max-w-full max-h-full object-contain rounded-xl"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        />
      </div>
      {/* Bottom action bar */}
      <div
        className="p-4 flex flex-col gap-3 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        role="presentation"
      >
        {ios && (
          <p className="text-center text-xs text-white/60">
            iPhone: mantén presionada la imagen para guardar en Fotos
          </p>
        )}
        <div className="flex gap-3">
          <Button
            data-ocid="result.fullscreen_save_button"
            onClick={() => saveToPhotos(imageUrl)}
            className="flex-1 h-12 font-semibold bg-white text-black hover:bg-white/90 rounded-xl gap-2"
          >
            📸 Guardar en Fotos
          </Button>
          <Button
            data-ocid="result.fullscreen_share_button"
            onClick={() => shareAdImage(imageUrl, adText)}
            className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   USER AVATAR CHIP
═══════════════════════════════════════ */

function UserAvatarChip({
  onLogout,
  userName,
  onFeedback,
  isPro,
}: {
  onLogout: () => void;
  userName: string;
  onFeedback?: () => void;
  isPro?: boolean;
}) {
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-ocid="header.user_avatar"
          className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative"
          aria-label="Mi cuenta"
        >
          {initials || <User className="w-4 h-4" />}
          {isPro && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 75), oklch(0.62 0.22 270))",
              }}
              aria-label="Pro"
            >
              ⭐
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-popover border-border rounded-xl"
      >
        <div className="px-3 py-2.5 border-b border-border/50">
          <p className="text-xs text-muted-foreground">Cuenta</p>
          <p className="text-sm font-semibold text-foreground truncate">
            {userName}
          </p>
          {isPro && (
            <span
              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 75 / 0.20), oklch(0.62 0.22 270 / 0.20))",
                color: "oklch(0.82 0.16 75)",
                border: "1px solid oklch(0.72 0.18 75 / 0.35)",
              }}
            >
              ⭐ Pro User
            </span>
          )}
        </div>
        {onFeedback && (
          <>
            <DropdownMenuItem
              data-ocid="header.feedback_button"
              onClick={onFeedback}
              className="cursor-pointer gap-2 m-1 rounded-lg text-foreground focus:text-foreground focus:bg-secondary"
            >
              <MessageSquare className="w-4 h-4 text-primary" />
              Enviar Feedback
            </DropdownMenuItem>
            <Separator className="mx-1 bg-border/50" />
          </>
        )}
        <DropdownMenuItem
          data-ocid="header.logout_button"
          onClick={onLogout}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 m-1 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ═══════════════════════════════════════
   PROFILE SETUP MODAL
═══════════════════════════════════════ */

function ProfileSetupModal({
  open,
  onSave,
}: {
  open: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setIsSubmitting(true);
    try {
      await onSave(name.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        data-ocid="profile_setup.dialog"
        className="bg-popover border-border rounded-2xl max-w-sm mx-4"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <img
                src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
                alt="AdCreator AI"
                className="w-9 h-9 object-contain logo-glow"
              />
            </div>
          </div>
          <DialogTitle className="font-display text-xl font-bold text-center text-foreground">
            ¿Cómo te llamas?
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-muted-foreground text-center">
            Personalizamos tu experiencia con tu nombre
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="profile-name"
              className="font-body text-sm font-medium text-foreground/90"
            >
              Tu nombre
            </Label>
            <Input
              id="profile-name"
              data-ocid="profile_setup.name_input"
              type="text"
              placeholder="ej. Carlos, María López"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoFocus
              className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
            />
          </div>
          <Button
            data-ocid="profile_setup.submit_button"
            type="submit"
            disabled={isSubmitting || name.trim().length < 2}
            size="lg"
            className="w-full h-12 font-semibold font-display bg-primary hover:bg-primary/90 text-primary-foreground btn-glow rounded-xl gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Continuar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════
   LOGIN VIEW
═══════════════════════════════════════ */

function LoginView() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "User is already authenticated"
      ) {
        // Already authenticated — ignore
      }
    }
  };

  return (
    <main className="flex flex-col flex-1 px-6 pt-12 pb-10 items-center">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45 } }}
        className="flex flex-col items-center gap-4 mb-10"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center logo-glow">
          <img
            src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
            alt="AdCreator AI"
            className="w-14 h-14 object-contain"
          />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            <span className="text-gradient">AdCreator</span>{" "}
            <span className="text-foreground">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5 tracking-wider uppercase">
            Powered by AI
          </p>
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.1, duration: 0.5 },
        }}
        className="text-center mb-10"
      >
        <h2 className="font-display text-2xl font-bold leading-tight text-foreground mb-3">
          Bienvenido a AdCreator AI
        </h2>
        <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
          Crea anuncios profesionales para tu negocio en segundos. Inicia sesión
          para guardar tu historial de anuncios.
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.4 } }}
        className="flex flex-wrap justify-center gap-2 mb-10"
      >
        {[
          "✍️ Captions con IA",
          "🖼️ Imágenes 1080×1080",
          "📱 Instagram · Facebook · TikTok",
          "💾 Historial de anuncios",
        ].map((f) => (
          <span
            key={f}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border font-body"
          >
            {f}
          </span>
        ))}
      </motion.div>

      {/* Login buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.3, duration: 0.4 },
        }}
        className="w-full max-w-xs flex flex-col gap-3"
      >
        {isLoggingIn ? (
          <div
            data-ocid="login.loading_state"
            className="flex flex-col items-center gap-3 py-6"
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-body">
              Iniciando sesión…
            </p>
          </div>
        ) : (
          <>
            {/* Continue with Google */}
            <Button
              data-ocid="login.google_button"
              onClick={handleLogin}
              size="lg"
              className="w-full h-14 text-sm font-semibold font-display bg-white hover:bg-gray-50 text-gray-800 rounded-xl gap-3 border border-gray-200 shadow-sm transition-all duration-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 flex-shrink-0"
                role="img"
                aria-label="Google"
              >
                <title>Google</title>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>

            {/* Continue with Email */}
            <Button
              data-ocid="login.email_button"
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="w-full h-14 text-sm font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-xl gap-3 transition-all duration-200"
            >
              <Mail className="w-5 h-5 flex-shrink-0" />
              Continuar con Email
            </Button>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground font-body mt-2">
          Tus anuncios se guardan en tu cuenta
        </p>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
        className="text-center mt-auto pt-8"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Creado con ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.footer>
    </main>
  );
}

/* ═══════════════════════════════════════
   APP ROOT
═══════════════════════════════════════ */

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  // User profile
  const { data: userProfile, isFetched: profileFetched } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });

  // Admin check
  const { data: isAdmin } = useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  // Register user role on first login
  useEffect(() => {
    if (actor && isAuthenticated && !actorFetching) {
      actor
        .getCallerUserRole()
        .then(async (role) => {
          if (role === UserRole.guest) {
            try {
              await actor.assignCallerUserRole(
                identity!.getPrincipal(),
                UserRole.user,
              );
            } catch {
              // Ignore if already assigned
            }
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [actor, isAuthenticated, actorFetching, identity]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const showProfileSetup =
    isAuthenticated && !actorFetching && profileFetched && userProfile === null;
  const userName = userProfile?.name ?? (identity ? "Usuario" : "");

  // Daily ad usage (freemium)
  const { data: dailyUsage, refetch: refetchDailyUsage } =
    useQuery<DailyUsageStats>({
      queryKey: ["dailyAdUsage"],
      queryFn: async () => {
        if (!actor) throw new Error("Actor not available");
        return actor.getDailyUsage();
      },
      enabled: !!actor && !actorFetching && isAuthenticated,
      retry: false,
    });

  // Pro subscription state (localStorage-based)
  const [isPro, setIsPro] = useState<boolean>(() =>
    identity ? isUserPro(identity.getPrincipal().toText()) : false,
  );

  useEffect(() => {
    if (identity) {
      setIsPro(isUserPro(identity.getPrincipal().toText()));
    } else {
      setIsPro(false);
    }
  }, [identity]);

  const handleUpgradeToPro = () => {
    if (identity) {
      markUserAsPro(identity.getPrincipal().toText());
      setIsPro(true);
      toast.success("¡Bienvenido a AdCreator AI Pro!", { duration: 3000 });
      setError("");
    }
  };

  // Logo usage state
  const [logoCount, setLogoCount] = useState<number>(() => {
    if (!identity) return 0;
    return getLogoUsage(identity.getPrincipal().toText()).count;
  });

  useEffect(() => {
    if (identity) {
      setLogoCount(getLogoUsage(identity.getPrincipal().toText()).count);
    }
  }, [identity]);

  const handleLogoGenerated = () => {
    if (identity) {
      const updated = incrementLogoUsage(identity.getPrincipal().toText());
      setLogoCount(updated.count);
    }
  };

  // Video usage state
  const [videoCount, setVideoCount] = useState<number>(() => {
    if (!identity) return 0;
    return getVideoUsage(identity.getPrincipal().toText()).count;
  });

  useEffect(() => {
    if (identity) {
      setVideoCount(getVideoUsage(identity.getPrincipal().toText()).count);
    }
  }, [identity]);

  const handleVideoGenerated = () => {
    if (identity) {
      const updated = incrementVideoUsage(identity.getPrincipal().toText());
      setVideoCount(updated.count);
    }
  };

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [view, setView] = useState<View>("landing");
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    businessType: "",
    city: "",
    promotion: "",
    discount: "",
    whatsapp: "",
    tone: "divertido",
    platform: "instagram",
    captionLength: "short",
  });
  const [generatedAd, setGeneratedAd] = useState<AdVersions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedLong, setCopiedLong] = useState(false);
  const [variations, setVariations] = useState<AdVersions[] | null>(null);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [adImageUrl, setAdImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  const handleGenerateAd = async (data?: FormData) => {
    const fd = data ?? formData;

    if (!fd.businessType || !fd.city.trim() || !fd.promotion.trim()) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    setIsLoading(true);
    setError("");

    // Build and briefly display the smart AI prompt
    const aiPrompt = buildAdPrompt(
      fd.businessName,
      fd.businessType,
      fd.city,
      fd.promotion,
    );
    setGeneratedPrompt(aiPrompt);

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const ad = generateAd(fd);
      setGeneratedAd(ad);
      setView("result");
      // Pick a random image variant
      const selectedImage = pickAdImage(fd.businessType);
      // Save to localStorage (fallback)
      saveAdToStorage({
        id: Date.now().toString(),
        businessName: fd.businessName || fd.businessType,
        imageUrl: selectedImage,
        captionShort: ad.short,
        captionLong: ad.long,
        platform: fd.platform,
        savedAt: Date.now(),
      });
      // Save to backend (primary)
      if (isAuthenticated) {
        try {
          await actor!.saveAd({
            businessName: fd.businessName || fd.businessType,
            imageUrl: selectedImage ?? undefined,
            captionShort: ad.short,
            captionLong: ad.long,
            platform: fd.platform,
            tone: fd.tone,
          });
          queryClient.invalidateQueries({ queryKey: ["myAds"] });
          await refetchDailyUsage();
        } catch (saveErr) {
          const errMsg =
            saveErr instanceof Error ? saveErr.message : String(saveErr);
          if (errMsg.toLowerCase().includes("daily usage limit")) {
            if (!isPro) {
              setError("DAILY_LIMIT_REACHED");
              setView("form");
              setIsLoading(false);
              return;
            }
            // Pro users: silently swallow the limit error and continue
          }
          // Non-limit errors: silently continue (ad already in localStorage)
          console.warn("saveAd failed:", saveErr);
        }
      }
      setIsGeneratingImage(true);
      setTimeout(() => {
        setAdImageUrl(selectedImage);
        setIsGeneratingImage(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Error al generar el anuncio. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (
      !formData.businessType ||
      !formData.city.trim() ||
      !formData.promotion.trim()
    ) {
      return;
    }
    setIsLoading(true);
    setError("");
    setVariations(null);

    // Refresh the AI prompt
    const aiPrompt = buildAdPrompt(
      formData.businessName,
      formData.businessType,
      formData.city,
      formData.promotion,
    );
    setGeneratedPrompt(aiPrompt);

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const ad = generateAd(formData);
      setGeneratedAd(ad);
      setAdImageUrl(null);
      setIsGeneratingImage(true);
      setTimeout(() => {
        // Pick a different variant from current
        const newImage = pickAdImage(formData.businessType, adImageUrl);
        setAdImageUrl(newImage);
        setIsGeneratingImage(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Error al generar el anuncio. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    setIsGeneratingVariations(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const vars = [
      generateVariation(formData, 0),
      generateVariation(formData, 1),
      generateVariation(formData, 2),
    ];
    setVariations(vars);
    setIsGeneratingVariations(false);
  };

  const handleCopyShort = async () => {
    if (!generatedAd) return;
    try {
      await navigator.clipboard.writeText(generatedAd.short);
      setCopiedShort(true);
      toast.success("¡Versión corta copiada!", { duration: 2000 });
      setTimeout(() => setCopiedShort(false), 2000);
    } catch {
      toast.error("Error al copiar. Por favor hazlo manualmente.");
    }
  };

  const handleCopyLong = async () => {
    if (!generatedAd) return;
    try {
      await navigator.clipboard.writeText(generatedAd.long);
      setCopiedLong(true);
      toast.success("¡Versión larga copiada!", { duration: 2000 });
      setTimeout(() => setCopiedLong(false), 2000);
    } catch {
      toast.error("Error al copiar. Por favor hazlo manualmente.");
    }
  };

  const handleShare = async () => {
    if (!generatedAd) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "¡Mira mi anuncio!",
          text: generatedAd.short,
        });
      } catch {
        // User cancelled — silently ignore
      }
    } else {
      await handleCopyShort();
    }
  };

  const handleSaveToPhotos = () => {
    if (adImageUrl) saveToPhotos(adImageUrl);
  };

  const handleShareAdImage = () => {
    if (adImageUrl && generatedAd) {
      shareAdImage(
        adImageUrl,
        formData.captionLength === "short"
          ? generatedAd.short
          : generatedAd.long,
      );
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      businessName: "",
      businessType: "",
      city: "",
      promotion: "",
      discount: "",
      whatsapp: "",
      tone: "divertido",
      platform: "instagram",
      captionLength: "short",
    });
    setGeneratedAd(null);
    setError("");
    setVariations(null);
    setAdImageUrl(null);
    setIsGeneratingImage(false);
    setGeneratedPrompt("");
    setView("landing");
  };

  // Show initializing spinner
  if (isInitializing) {
    return (
      <div className="min-h-dvh flex items-center justify-center noise-bg">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
            alt="AdCreator AI"
            className="w-12 h-12 object-contain logo-glow"
          />
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-start justify-center noise-bg">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.18 0.025 255)",
            border: "1px solid oklch(0.62 0.22 240 / 0.35)",
            color: "oklch(0.97 0.005 255)",
          },
        }}
      />

      <div className="w-full max-w-[520px] min-h-dvh flex flex-col relative overflow-hidden">
        {/* Feedback modal — app root level */}
        <FeedbackModal
          open={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />

        {/* Profile setup modal */}
        <ProfileSetupModal
          open={showProfileSetup}
          onSave={async (name) => {
            await saveProfileMutation.mutateAsync(name);
          }}
        />

        <AnimatePresence mode="wait">
          {/* Auth gate */}
          {!isAuthenticated && (
            <motion.div
              key="login"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <LoginView />
            </motion.div>
          )}

          {isAuthenticated && view === "landing" && (
            <motion.div
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <LandingView
                onTryFree={() => setView("form")}
                onMyAds={() => setView("myads")}
                onPhotoAd={() => setView("photo_ad")}
                onLogo={() => setView("logo")}
                onVideo={() => setView("video")}
                onAdmin={() => setView("admin")}
                onFeedback={() => setShowFeedbackModal(true)}
                isAdmin={isAdmin === true}
                userName={userName}
                onLogout={handleLogout}
                isPro={isPro}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "home" && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <HomeView
                onCreateAd={() => setView("form")}
                onGoToMyAds={() => setView("myads")}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "form" && (
            <motion.div
              key="form"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <FormView
                formData={formData}
                setFormData={setFormData}
                isLoading={isLoading}
                error={error}
                onBack={() => {
                  setError("");
                  setView("landing");
                }}
                onSubmit={() => handleGenerateAd()}
                userName={userName}
                onLogout={handleLogout}
                onFeedback={() => setShowFeedbackModal(true)}
                dailyUsage={dailyUsage}
                isPro={isPro}
                onUpgrade={handleUpgradeToPro}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "result" && generatedAd && (
            <motion.div
              key="result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <ResultView
                generatedAd={generatedAd}
                formData={formData}
                copiedShort={copiedShort}
                copiedLong={copiedLong}
                isLoading={isLoading}
                variations={variations}
                isGeneratingVariations={isGeneratingVariations}
                adImageUrl={adImageUrl}
                isGeneratingImage={isGeneratingImage}
                showImageModal={showImageModal}
                setShowImageModal={setShowImageModal}
                onSaveToPhotos={handleSaveToPhotos}
                onShareAdImage={handleShareAdImage}
                onCopyShort={handleCopyShort}
                onCopyLong={handleCopyLong}
                onShare={handleShare}
                onRegenerate={handleRegenerate}
                onGenerateVariations={handleGenerateVariations}
                onDownloadInstagram={() =>
                  downloadInstagramImage(
                    formData.businessName || formData.businessType,
                    formData.captionLength === "short"
                      ? generatedAd.short
                      : generatedAd.long,
                  )
                }
                onCreateAnother={handleCreateAnother}
                onGoToMyAds={() => setView("myads")}
                userName={userName}
                onLogout={handleLogout}
                onFeedback={() => setShowFeedbackModal(true)}
                generatedPrompt={generatedPrompt}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "myads" && (
            <motion.div
              key="myads"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <MyAdsView
                onBack={() => setView("landing")}
                onCreateAd={() => setView("form")}
                userName={userName}
                onLogout={handleLogout}
                onFeedback={() => setShowFeedbackModal(true)}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "photo_ad" && (
            <motion.div
              key="photo_ad"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <PhotoAdView onBack={() => setView("landing")} />
            </motion.div>
          )}

          {isAuthenticated && view === "admin" && (
            <motion.div
              key="admin"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <AdminDashboardView
                onBack={() => setView("landing")}
                userName={userName}
                onLogout={handleLogout}
                onFeedback={() => setShowFeedbackModal(true)}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "logo" && (
            <motion.div
              key="logo"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <LogoGeneratorView
                onBack={() => setView("landing")}
                isPro={isPro}
                onUpgrade={handleUpgradeToPro}
                logoCount={logoCount}
                onLogoGenerated={handleLogoGenerated}
              />
            </motion.div>
          )}

          {isAuthenticated && view === "video" && (
            <motion.div
              key="video"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <PromoVideoView
                onBack={() => setView("landing")}
                isPro={isPro}
                onUpgrade={handleUpgradeToPro}
                videoCount={videoCount}
                onVideoGenerated={handleVideoGenerated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   LANDING VIEW
═══════════════════════════════════════ */

function LandingView({
  onTryFree,
  onMyAds,
  onPhotoAd,
  onLogo,
  onVideo,
  onAdmin,
  onFeedback,
  isAdmin,
  userName,
  onLogout,
  isPro,
}: {
  onTryFree: () => void;
  onMyAds: () => void;
  onPhotoAd: () => void;
  onLogo: () => void;
  onVideo: () => void;
  onAdmin?: () => void;
  onFeedback?: () => void;
  isAdmin?: boolean;
  userName?: string;
  onLogout?: () => void;
  isPro?: boolean;
}) {
  return (
    <main className="flex flex-col flex-1 px-6 pt-12 pb-10">
      {/* Logo + Avatar row */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45 } }}
        className="flex items-center gap-3 mb-12"
      >
        <img
          src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
          alt="AdCreator AI"
          className="w-10 h-10 object-contain logo-glow"
        />
        <span className="font-display text-xl font-bold flex-1">
          <span className="text-gradient">AdCreator</span>{" "}
          <span className="text-foreground">AI</span>
        </span>
        {isPro && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 75 / 0.20), oklch(0.62 0.22 270 / 0.20))",
              color: "oklch(0.82 0.16 75)",
              border: "1px solid oklch(0.72 0.18 75 / 0.35)",
            }}
          >
            ⭐ Pro
          </span>
        )}
        {userName && onLogout && (
          <UserAvatarChip
            userName={userName}
            onLogout={onLogout}
            onFeedback={onFeedback}
            isPro={isPro}
          />
        )}
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.1, duration: 0.5 },
        }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/20 text-primary border border-primary/35 mb-4">
          <Sparkles className="w-2.5 h-2.5" /> Powered by AI
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight mb-4">
          <span className="text-gradient">Create Professional Ads</span>{" "}
          <span className="text-foreground">for Your Business in Seconds</span>
        </h1>
        <p className="font-body text-foreground/65 text-base leading-relaxed">
          Generate AI-powered ad captions and promotional images for Instagram,
          Facebook, and TikTok in seconds. No design skills needed.
        </p>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-3 mb-10"
      >
        {[
          {
            icon: "✍️",
            title: "AI Captions",
            desc: "Captions with emojis and hashtags in Spanish",
          },
          {
            icon: "🖼️",
            title: "AI Images",
            desc: "1080×1080 promotional images for every business type",
          },
          {
            icon: "🎨",
            title: "AI Logo Generator",
            desc: "Professional logos in modern, luxury, minimal or bold styles",
          },
          {
            icon: "🎬",
            title: "Promo Video",
            desc: "Animated vertical videos for Instagram Reels, TikTok & Facebook",
          },
        ].map((f) => (
          <motion.div
            key={f.title}
            variants={staggerItem}
            className="flex items-start gap-3 glass-card rounded-xl p-4"
          >
            <span className="text-2xl flex-shrink-0">{f.icon}</span>
            <div>
              <p className="font-display font-semibold text-foreground text-sm">
                {f.title}
              </p>
              <p className="font-body text-muted-foreground text-xs mt-0.5">
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.4, duration: 0.4 },
        }}
        className="mt-auto flex flex-col gap-3"
      >
        <Button
          data-ocid="landing.primary_button"
          onClick={onTryFree}
          size="lg"
          className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Try It Free →
        </Button>

        {/* New feature buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            data-ocid="landing.logo_button"
            onClick={onLogo}
            variant="outline"
            size="lg"
            className="w-full h-12 text-xs font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-xl gap-1.5 transition-all duration-200"
          >
            🎨 Generate Logo
          </Button>
          <Button
            data-ocid="landing.video_button"
            onClick={onVideo}
            variant="outline"
            size="lg"
            className="w-full h-12 text-xs font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-xl gap-1.5 transition-all duration-200"
          >
            🎬 Promo Video
          </Button>
        </div>

        <Button
          data-ocid="landing.photo_ad_button"
          onClick={onPhotoAd}
          variant="outline"
          size="lg"
          className="w-full h-12 text-sm font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-xl gap-2 transition-all duration-200"
        >
          📷 Generar Anuncio desde Foto
        </Button>
        <button
          type="button"
          data-ocid="landing.myads_link"
          onClick={onMyAds}
          className="w-full h-10 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View My Ads
        </button>
        {isAdmin && onAdmin && (
          <button
            type="button"
            data-ocid="landing.admin_button"
            onClick={onAdmin}
            className="w-full h-9 text-xs font-medium text-primary/70 hover:text-primary transition-colors flex items-center justify-center gap-1.5 border border-primary/20 rounded-xl hover:border-primary/40 hover:bg-primary/5"
          >
            🔐 Admin Dashboard
          </button>
        )}
        {onFeedback && (
          <button
            type="button"
            data-ocid="landing.feedback_link"
            onClick={onFeedback}
            className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Enviar Feedback
          </button>
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
        className="text-center mt-8"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Creado con ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.footer>
    </main>
  );
}

/* ═══════════════════════════════════════
   MY ADS VIEW
═══════════════════════════════════════ */

function MyAdsView({
  onBack,
  onCreateAd,
  userName,
  onLogout,
  onFeedback,
}: {
  onBack: () => void;
  onCreateAd: () => void;
  userName?: string;
  onLogout?: () => void;
  onFeedback?: () => void;
}) {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: backendAds, isLoading: adsLoading } = useQuery({
    queryKey: ["myAds"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAdsForCaller();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteAd(adId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myAds"] });
      toast.success("Anuncio eliminado", { duration: 2000 });
    },
    onError: () => {
      toast.error("Error al eliminar el anuncio");
    },
  });

  const ads: Ad[] = backendAds ?? [];

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button
          type="button"
          data-ocid="myads.cancel_button"
          onClick={onBack}
          aria-label="Volver"
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <img
            src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
            alt="AdCreator AI"
            className="w-7 h-7 object-contain logo-glow"
          />
          <span className="font-display font-bold text-sm text-foreground">
            Mis Anuncios
          </span>
        </div>
        {!adsLoading && (
          <span className="text-xs text-muted-foreground font-body">
            {ads.length} guardados
          </span>
        )}
        {userName && onLogout && (
          <UserAvatarChip
            userName={userName}
            onLogout={onLogout}
            onFeedback={onFeedback}
          />
        )}
      </header>

      <main className="flex flex-col flex-1 px-4 pt-5 pb-10">
        {adsLoading ? (
          <div
            data-ocid="myads.loading_state"
            className="grid grid-cols-2 gap-3"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden">
                <Skeleton className="aspect-square w-full bg-secondary" />
                <div className="p-3 flex flex-col gap-2">
                  <Skeleton className="h-3 w-3/4 bg-secondary rounded-full" />
                  <Skeleton className="h-3 w-full bg-secondary rounded-full" />
                  <Skeleton className="h-8 w-full bg-secondary rounded-lg mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : ads.length === 0 ? (
          <motion.div
            data-ocid="myads.empty_state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col flex-1 items-center justify-center gap-6 text-center px-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-4xl">
              🖼️
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-lg mb-2">
                Aún no has creado anuncios
              </p>
              <p className="font-body text-muted-foreground text-sm">
                Los anuncios que generes aparecerán aquí automáticamente.
              </p>
            </div>
            <Button
              data-ocid="myads.primary_button"
              onClick={onCreateAd}
              size="lg"
              className="h-12 px-8 font-semibold font-display bg-primary hover:bg-primary/90 text-primary-foreground btn-glow rounded-xl gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Crear mi primer anuncio
            </Button>
          </motion.div>
        ) : (
          <motion.div
            data-ocid="myads.list"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 gap-3"
          >
            {ads.map((ad, idx) => {
              const ocidSuffix = idx + 1;
              const imageUrl = ad.imageUrl ?? null;
              return (
                <motion.div
                  key={ad.id.toString()}
                  data-ocid={`myads.item.${ocidSuffix}`}
                  variants={staggerItem}
                  className="glass-card rounded-xl overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square w-full overflow-hidden bg-secondary/50 flex-shrink-0 relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={ad.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🏪
                      </div>
                    )}
                    {/* Platform badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{
                          background:
                            ad.platform === "instagram"
                              ? "linear-gradient(135deg, oklch(0.68 0.22 15), oklch(0.62 0.24 330), oklch(0.58 0.22 280))"
                              : ad.platform === "facebook"
                                ? "oklch(0.42 0.20 265)"
                                : "linear-gradient(135deg, #010101, #ee1d52)",
                        }}
                      >
                        {ad.platform === "instagram"
                          ? "IG"
                          : ad.platform === "facebook"
                            ? "FB"
                            : "TT"}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="font-display font-semibold text-foreground text-xs truncate">
                      {ad.businessName}
                    </p>
                    <p className="font-body text-muted-foreground text-[10px] leading-relaxed line-clamp-2">
                      {ad.captionShort.slice(0, 80)}
                      {ad.captionShort.length > 80 ? "…" : ""}
                    </p>
                    {/* Actions */}
                    <div className="flex gap-1.5 mt-auto pt-1">
                      <button
                        type="button"
                        data-ocid={`myads.copy_caption_button.${ocidSuffix}`}
                        onClick={() => {
                          navigator.clipboard.writeText(ad.captionShort);
                          toast.success("¡Caption copiado!", {
                            duration: 2000,
                          });
                        }}
                        className="flex-1 h-8 rounded-lg text-[10px] font-semibold font-display bg-primary/15 hover:bg-primary/25 border border-primary/25 text-primary transition-all flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </button>
                      <button
                        type="button"
                        data-ocid={`myads.download_button.${ocidSuffix}`}
                        onClick={() => imageUrl && saveToPhotos(imageUrl)}
                        disabled={!imageUrl}
                        className="flex-1 h-8 rounded-lg text-[10px] font-semibold font-display bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        <Download className="w-3 h-3" />
                        Guardar
                      </button>
                      <button
                        type="button"
                        data-ocid={`myads.delete_button.${ocidSuffix}`}
                        onClick={() => deleteAdMutation.mutate(ad.id)}
                        disabled={deleteAdMutation.isPending}
                        className="h-8 w-8 rounded-lg font-semibold bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive transition-all flex items-center justify-center disabled:opacity-40"
                        aria-label="Eliminar anuncio"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════
   HOME VIEW
═══════════════════════════════════════ */

function HomeView({
  onCreateAd,
  onGoToMyAds,
}: {
  onCreateAd: () => void;
  onGoToMyAds?: () => void;
}) {
  return (
    <main className="flex flex-col flex-1 px-6 pt-14 pb-10">
      {/* ── Hero card: image + overlaid title + pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: "easeOut" },
        }}
        className="relative rounded-2xl overflow-hidden mb-8 border border-primary/25 glow-primary"
        style={{ minHeight: 260 }}
      >
        {/* Hero image */}
        <img
          src="/assets/generated/hero-adcreator.dim_480x320.png"
          alt="AdCreator AI"
          className="w-full object-cover"
          style={{ height: 260, objectPosition: "center top" }}
          loading="eager"
        />

        {/* Full scrim for legibility */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.10 0.02 255 / 0.35) 0%, oklch(0.10 0.02 255 / 0.20) 30%, oklch(0.10 0.02 255 / 0.75) 70%, oklch(0.10 0.02 255 / 0.96) 100%)",
          }}
        />

        {/* Top-left badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/20 text-primary border border-primary/35 backdrop-blur-sm">
            <Zap className="w-2.5 h-2.5" />
            Marketing con IA
          </span>
        </div>

        {/* Top-right My Ads button */}
        {onGoToMyAds && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              data-ocid="home.myads_link"
              onClick={onGoToMyAds}
              aria-label="Mis Anuncios"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            >
              <BookMarked className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overlaid title + tagline at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          {/* Powered by AI badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.1, duration: 0.4 },
            }}
            className="mb-3"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/20 text-primary border border-primary/35 backdrop-blur-sm">
              ✦ Powered by AI
            </span>
          </motion.div>

          {/* Logo mark + wordmark lockup */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.15, duration: 0.45 },
            }}
            className="flex items-center gap-3 mb-1.5"
          >
            <img
              src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
              alt="AdCreator AI logo"
              className="w-12 h-12 object-contain logo-glow flex-shrink-0"
            />
            <h1 className="font-display text-5xl font-bold tracking-tight leading-tight">
              <span className="text-gradient">AdCreator</span>{" "}
              <span className="text-foreground">AI</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.25, duration: 0.4 },
            }}
            className="font-body text-foreground/70 text-sm leading-snug max-w-[280px]"
          >
            Anuncios profesionales para Instagram, Facebook y TikTok en segundos
          </motion.p>
        </div>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex justify-center gap-2 flex-wrap mb-10"
      >
        {[
          "💼 Nombre del Negocio",
          "📱 WhatsApp CTA",
          "📸 Instagram · Facebook · TikTok",
          "🎨 3 Variaciones",
          "#️⃣ Hashtags Sugeridos",
        ].map((feat) => (
          <motion.span
            key={feat}
            variants={staggerItem}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border"
          >
            {feat}
          </motion.span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.4, duration: 0.4, ease: "easeOut" },
        }}
        className="mt-auto"
      >
        <Button
          data-ocid="home.primary_button"
          onClick={onCreateAd}
          size="lg"
          className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Crear Anuncio
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
        className="text-center mt-8"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Creado con ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.footer>
    </main>
  );
}

/* ═══════════════════════════════════════
   FORM VIEW
═══════════════════════════════════════ */

interface FormViewProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isLoading: boolean;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
  userName?: string;
  onLogout?: () => void;
  onFeedback?: () => void;
  dailyUsage?: DailyUsageStats;
  isPro: boolean;
  onUpgrade: () => void;
}

/* ═══════════════════════════════════════
   UPGRADE SCREEN COMPONENT
═══════════════════════════════════════ */

function UpgradeScreen({
  onUpgrade,
}: {
  onUpgrade: () => void;
  dailyUsage?: DailyUsageStats;
}) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsUpgrading(false);
    onUpgrade();
  };

  return (
    <motion.div
      data-ocid="upgrade.card"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 280, damping: 24 },
      }}
      className="rounded-2xl overflow-hidden relative"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.14 0.04 280), oklch(0.16 0.06 260))",
        border: "1px solid oklch(0.62 0.22 270 / 0.40)",
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.62 0.22 270 / 0.12) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 p-5 flex flex-col gap-4">
        {/* Icon + headline */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 75 / 0.25), oklch(0.62 0.22 270 / 0.25))",
              border: "1px solid oklch(0.72 0.18 75 / 0.35)",
            }}
          >
            <span className="text-xl">⭐</span>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm text-foreground leading-tight mb-1">
              Upgrade to AdCreator AI Pro
            </p>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              Generate unlimited ads for your business.
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="flex flex-col gap-2">
          {[
            "Generación ilimitada de anuncios",
            "Imágenes IA ilimitadas",
            "Logos con IA ilimitados",
            "Videos promocionales ilimitados",
            "Sin límites diarios",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.62 0.22 270 / 0.20)",
                  border: "1px solid oklch(0.62 0.22 270 / 0.35)",
                }}
              >
                <span className="text-[9px]">✓</span>
              </div>
              <span className="font-body text-xs text-foreground/80">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          data-ocid="upgrade.primary_button"
          onClick={handleUpgrade}
          disabled={isUpgrading}
          size="lg"
          className="w-full h-12 font-semibold font-display text-sm rounded-xl gap-2 disabled:opacity-70 transition-all duration-200"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.62 0.22 270), oklch(0.55 0.22 290))",
            color: "white",
            border: "none",
          }}
        >
          {isUpgrading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Activando Pro…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

function FormView({
  formData,
  setFormData,
  isLoading,
  error,
  onBack,
  onSubmit,
  userName,
  onLogout,
  onFeedback,
  dailyUsage,
  isPro,
  onUpgrade,
}: FormViewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const platforms: { id: Platform; label: string; icon: string }[] = [
    { id: "instagram", label: "Instagram", icon: "📸" },
    { id: "facebook", label: "Facebook", icon: "👤" },
    { id: "tiktok", label: "TikTok", icon: "🎵" },
  ];

  const platformOcidMap: Record<Platform, string> = {
    instagram: "form.platform_instagram_button",
    facebook: "form.platform_facebook_button",
    tiktok: "form.platform_tiktok_button",
  };

  const platformActiveClass: Record<Platform, string> = {
    instagram: "platform-btn-ig",
    facebook: "platform-btn-fb",
    tiktok: "platform-btn-tt",
  };

  return (
    <div className="flex flex-col flex-1">
      {/* App Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button
          type="button"
          data-ocid="form.cancel_button"
          onClick={onBack}
          aria-label="Volver atrás"
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <img
            src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
            alt="AdCreator AI"
            className="w-7 h-7 object-contain logo-glow"
          />
          <span className="font-display font-bold text-sm text-foreground">
            AdCreator AI
          </span>
        </div>
        {userName && onLogout ? (
          <UserAvatarChip
            userName={userName}
            onLogout={onLogout}
            onFeedback={onFeedback}
            isPro={isPro}
          />
        ) : (
          <span className="text-xs text-muted-foreground font-body">
            Nuevo Anuncio
          </span>
        )}
      </header>

      <main className="flex flex-col flex-1 px-5 pt-5 pb-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          {/* ── SECTION 1: Información del Negocio ── */}
          <div className="flex flex-col gap-0">
            <div className="form-section-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                  Información del Negocio
                </span>
              </div>

              <div className="flex flex-col gap-4 p-4">
                {/* Business Name */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="business-name"
                    className="font-body text-sm font-medium text-foreground/90"
                  >
                    Nombre del Negocio{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="business-name"
                    data-ocid="form.business_name_input"
                    type="text"
                    placeholder="ej. Barbería Don Juan, Café El Rincón"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                    required
                    className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
                    autoComplete="organization"
                  />
                </div>

                {/* Business Type */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="business-type"
                    className="font-body text-sm font-medium text-foreground/90"
                  >
                    Tipo de Negocio <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessType: val,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="business-type"
                      data-ocid="form.business_type_select"
                      className="h-11 bg-secondary/60 border-border text-foreground focus:ring-primary rounded-xl"
                    >
                      <SelectValue placeholder="Selecciona el tipo de negocio" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                      {Object.entries(BUSINESS_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem
                            key={value}
                            value={value}
                            className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg"
                          >
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="city"
                    className="font-body text-sm font-medium text-foreground/90"
                  >
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    data-ocid="form.city_input"
                    type="text"
                    placeholder="ej. Miami, Ciudad de México, Bogotá"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    required
                    className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
                    autoComplete="address-level2"
                  />
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="whatsapp"
                    className="font-body text-sm font-medium text-foreground/90 flex items-center gap-1.5"
                  >
                    WhatsApp o Teléfono
                    <span className="text-muted-foreground text-xs font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="whatsapp"
                    data-ocid="form.whatsapp_input"
                    type="tel"
                    placeholder="ej. +1 305-555-0000"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Detalles del Anuncio ── */}
          <div className="flex flex-col gap-0">
            <div className="form-section-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                  Detalles del Anuncio
                </span>
              </div>

              <div className="flex flex-col gap-4 p-4">
                {/* Platform Selector */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-body text-sm font-medium text-foreground/90">
                    Plataforma
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        data-ocid={platformOcidMap[p.id]}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, platform: p.id }))
                        }
                        className={`platform-btn ${platformActiveClass[p.id]} flex flex-col items-center justify-center gap-1 h-16 rounded-xl border border-border/50 bg-secondary/50 text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body text-xs font-medium ${
                          formData.platform === p.id
                            ? "active"
                            : "hover:bg-secondary/80 hover:border-border"
                        }`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption Length Toggle */}
                <div className="flex flex-col gap-1.5">
                  <Label className="font-body text-sm font-medium text-foreground/90">
                    Tipo de Caption
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      data-ocid="form.caption_short_toggle"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          captionLength: "short",
                        }))
                      }
                      className={`caption-toggle-btn flex items-center justify-center gap-2 h-11 rounded-xl border border-border/50 bg-secondary/50 text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body text-sm font-medium ${
                        formData.captionLength === "short"
                          ? "active"
                          : "hover:bg-secondary/80"
                      }`}
                    >
                      <span>✂️</span>
                      Caption Corta
                    </button>
                    <button
                      type="button"
                      data-ocid="form.caption_long_toggle"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          captionLength: "long",
                        }))
                      }
                      className={`caption-toggle-btn flex items-center justify-center gap-2 h-11 rounded-xl border border-border/50 bg-secondary/50 text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body text-sm font-medium ${
                        formData.captionLength === "long"
                          ? "active"
                          : "hover:bg-secondary/80"
                      }`}
                    >
                      <span>📝</span>
                      Caption Larga
                    </button>
                  </div>
                </div>

                {/* Tone */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="ad-tone"
                    className="font-body text-sm font-medium text-foreground/90"
                  >
                    Tono del Anuncio <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        tone: val as AdTone,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="ad-tone"
                      data-ocid="form.tone_select"
                      className="h-11 bg-secondary/60 border-border text-foreground focus:ring-primary rounded-xl"
                    >
                      <SelectValue placeholder="Selecciona el tono" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                      {(Object.entries(TONE_LABELS) as [AdTone, string][]).map(
                        ([value, label]) => (
                          <SelectItem
                            key={value}
                            value={value}
                            className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg"
                          >
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Promotion */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="promotion"
                    className="font-body text-sm font-medium text-foreground/90"
                  >
                    ¿Qué estás promocionando?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="promotion"
                    data-ocid="form.promotion_textarea"
                    placeholder="ej. Descuento en cortes este fin de semana, Oferta especial de verano..."
                    value={formData.promotion}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        promotion: e.target.value,
                      }))
                    }
                    rows={3}
                    required
                    className="bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl resize-none text-base"
                  />
                </div>

                {/* Discount */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="discount"
                    className="font-body text-sm font-medium text-foreground/90 flex items-center gap-1.5"
                  >
                    Descuento %
                    <span className="text-muted-foreground text-xs font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="discount"
                    data-ocid="form.discount_input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="ej. 20"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discount: e.target.value,
                      }))
                    }
                    className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error (non-limit errors) */}
          {error && error !== "DAILY_LIMIT_REACHED" && (
            <Alert
              data-ocid="form.error_state"
              variant="destructive"
              className="bg-destructive/10 border-destructive/30 rounded-xl"
            >
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading && (
            <div data-ocid="form.loading_state" className="space-y-3 py-2">
              <Skeleton className="h-4 w-3/4 bg-secondary rounded-full" />
              <Skeleton className="h-4 w-full bg-secondary rounded-full" />
              <Skeleton className="h-4 w-2/3 bg-secondary rounded-full" />
            </div>
          )}

          {/* Submit / Daily Limit area */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            {(() => {
              const isLimitReached =
                !isPro &&
                (error === "DAILY_LIMIT_REACHED" ||
                  (dailyUsage != null &&
                    Number(dailyUsage.count) >= Number(dailyUsage.limit)));

              if (isLimitReached && !isLoading) {
                return (
                  <UpgradeScreen
                    onUpgrade={onUpgrade}
                    dailyUsage={dailyUsage}
                  />
                );
              }
              return (
                <>
                  <Button
                    data-ocid="form.submit_button"
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando tu anuncio…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Anuncio
                      </>
                    )}
                  </Button>
                  {/* Usage badge: Pro shows unlimited, free shows count */}
                  {!isLoading && (
                    <p
                      data-ocid="freemium.usage_badge"
                      className="text-center text-xs font-body"
                      style={{
                        color: isPro
                          ? "oklch(0.82 0.16 75)"
                          : "oklch(0.60 0.04 255)",
                      }}
                    >
                      {isPro ? (
                        "✨ Pro — Anuncios ilimitados"
                      ) : dailyUsage ? (
                        <>
                          {Number(dailyUsage.count)}/{Number(dailyUsage.limit)}{" "}
                          anuncios generados hoy
                        </>
                      ) : null}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </form>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════
   INSTAGRAM PREVIEW CARD
═══════════════════════════════════════ */

interface InstagramPreviewCardProps {
  businessName: string;
  adText: string;
  platform: Platform;
}

function InstagramPreviewCard({
  businessName,
  adText,
  platform,
}: InstagramPreviewCardProps) {
  const platformLabel = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
  }[platform];

  const usernameSlug =
    businessName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || "tu_negocio";

  const headerBg = {
    instagram:
      "linear-gradient(135deg, oklch(0.68 0.22 15), oklch(0.62 0.24 330), oklch(0.58 0.22 280))",
    facebook: "oklch(0.42 0.20 265)",
    tiktok: "linear-gradient(135deg, #010101, #ee1d52)",
  }[platform];

  return (
    <motion.div
      data-ocid="result.preview_card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          delay: 0.05,
          type: "spring",
          stiffness: 300,
          damping: 28,
        },
      }}
      whileHover={{ scale: 1.012, transition: { duration: 0.15 } }}
      className="flex flex-col items-center gap-3"
    >
      {/* Label */}
      <div className="flex items-center gap-2 self-start">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold text-white"
          style={{ background: headerBg }}
        >
          {platform === "instagram"
            ? "IG"
            : platform === "facebook"
              ? "FB"
              : "TT"}
        </span>
        <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground font-body">
          Vista Previa · {platformLabel}
        </span>
      </div>

      {/* Phone mockup card */}
      <div
        className="w-full preview-card-glow rounded-2xl overflow-hidden"
        style={{ aspectRatio: "1/1", maxWidth: 320, margin: "0 auto" }}
      >
        {/* Background */}
        <div
          className="w-full h-full flex flex-col"
          style={{
            background:
              "linear-gradient(145deg, #0a0a1a 0%, #0d0d22 50%, #131330 100%)",
            position: "relative",
          }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 80% 20%, oklch(0.62 0.22 240 / 0.18) 0%, transparent 70%)",
            }}
          />

          {/* Top bar: avatar + username + "···" */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2 relative z-10">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: headerBg }}
            >
              {(businessName || "N")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[10px] font-semibold truncate leading-tight">
                {usernameSlug}
              </p>
              <p
                className="text-[9px] leading-tight"
                style={{ color: "oklch(0.60 0.06 255)" }}
              >
                Publicidad
              </p>
            </div>
            <span
              className="text-[16px] leading-none"
              style={{ color: "oklch(0.55 0.04 255)" }}
            >
              ···
            </span>
          </div>

          {/* Divider */}
          <div
            className="mx-3"
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, oklch(0.62 0.22 240 / 0.25), transparent)",
            }}
          />

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center px-3 py-2 relative z-10 overflow-hidden">
            {/* Business name */}
            <p
              className="font-display font-bold text-white leading-tight mb-1.5 truncate"
              style={{ fontSize: "clamp(12px, 3.5vw, 16px)" }}
            >
              {businessName || "Tu Negocio"}
            </p>
            {/* Ad text preview */}
            <p
              className="font-body leading-relaxed"
              style={{
                fontSize: "clamp(9px, 2.2vw, 11px)",
                color: "oklch(0.82 0.03 255)",
                display: "-webkit-box",
                WebkitLineClamp: 7,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {adText}
            </p>
          </div>

          {/* Bottom action bar */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 relative z-10"
            style={{ borderTop: "1px solid oklch(0.30 0.03 255 / 0.60)" }}
          >
            <Heart
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.04 255)" }}
            />
            <MessageCircle
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.04 255)" }}
            />
            <Send
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.04 255)" }}
            />
            <div className="flex-1" />
            <span
              className="text-[8px] font-body"
              style={{ color: "oklch(0.45 0.04 255)" }}
            >
              AdCreator AI
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   AI PROMPT CHIP COMPONENT
═══════════════════════════════════════ */

function AiPromptChip({ prompt }: { prompt: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
      className="flex flex-col gap-1.5"
    >
      <button
        type="button"
        data-ocid="result.ai_prompt_toggle"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full self-start transition-all duration-200"
        style={{
          background: "oklch(0.62 0.22 270 / 0.10)",
          border: "1px solid oklch(0.62 0.22 270 / 0.25)",
          color: "oklch(0.80 0.14 270)",
        }}
      >
        <Sparkles className="w-3 h-3" />
        <span className="text-[10px] font-semibold font-body tracking-wide uppercase">
          ✨ AI Prompt Used
        </span>
        <span className="text-[11px] opacity-70">{expanded ? "▲" : "▼"}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 py-2.5 rounded-xl text-[11px] font-body leading-relaxed"
              style={{
                background: "oklch(0.62 0.22 270 / 0.07)",
                border: "1px solid oklch(0.62 0.22 270 / 0.18)",
                color: "oklch(0.75 0.06 260)",
              }}
            >
              <span className="font-semibold text-primary/80">Prompt:</span>{" "}
              {prompt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   RESULT VIEW
═══════════════════════════════════════ */

interface ResultViewProps {
  generatedAd: AdVersions;
  formData: FormData;
  copiedShort: boolean;
  copiedLong: boolean;
  isLoading: boolean;
  variations: AdVersions[] | null;
  isGeneratingVariations: boolean;
  adImageUrl: string | null;
  isGeneratingImage: boolean;
  showImageModal: boolean;
  setShowImageModal: (v: boolean) => void;
  onSaveToPhotos: () => void;
  onShareAdImage: () => void;
  onCopyShort: () => void;
  onCopyLong: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  onGenerateVariations: () => void;
  onDownloadInstagram: () => void;
  onCreateAnother: () => void;
  onGoToMyAds?: () => void;
  userName?: string;
  onLogout?: () => void;
  onFeedback?: () => void;
  generatedPrompt?: string;
}

function ResultView({
  generatedAd,
  formData,
  copiedShort,
  copiedLong,
  isLoading,
  variations,
  isGeneratingVariations,
  adImageUrl,
  isGeneratingImage,
  showImageModal,
  setShowImageModal,
  onSaveToPhotos,
  onShareAdImage,
  onCopyShort,
  onCopyLong,
  onShare,
  onRegenerate,
  onGenerateVariations,
  onDownloadInstagram,
  onCreateAnother,
  onGoToMyAds,
  userName,
  onLogout,
  onFeedback,
  generatedPrompt,
}: ResultViewProps) {
  const hashtagString =
    BUSINESS_DATA[formData.businessType]?.hashtags ?? "#Negocio #Ofertas";
  const hashtagChips = hashtagString.split(" ").filter(Boolean);
  const [copiedVariations, setCopiedVariations] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  const previewText =
    formData.captionLength === "short" ? generatedAd.short : generatedAd.long;

  const handleCopyVariation = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariations((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      toast.success(`¡Variación ${idx + 1} copiada!`, { duration: 2000 });
      setTimeout(() => {
        setCopiedVariations((prev) => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      }, 2000);
    } catch {
      toast.error("Error al copiar. Por favor hazlo manualmente.");
    }
  };

  // Platform card styles
  const isTikTok = formData.platform === "tiktok";
  const isFacebook = formData.platform === "facebook";

  // Card order: selected platform card first
  const primaryCardClass = isTikTok
    ? "glass-card-tt"
    : isFacebook
      ? "glass-card-fb"
      : "glass-card-ig";

  const primaryBorderColor = isTikTok
    ? "2px solid oklch(0.55 0.22 15 / 0.80)"
    : isFacebook
      ? "2px solid oklch(0.60 0.22 265 / 0.80)"
      : "2px solid oklch(0.72 0.18 230 / 0.80)";

  const primaryBadgeBg = isTikTok
    ? "linear-gradient(135deg, #010101, #ee1d52)"
    : isFacebook
      ? "oklch(0.42 0.20 265)"
      : "linear-gradient(135deg, oklch(0.68 0.22 15), oklch(0.62 0.24 330), oklch(0.58 0.22 280))";

  const primaryBadgeLabel = isTikTok ? "TT" : isFacebook ? "FB" : "IG";

  const primaryCardTitle = isTikTok
    ? "TikTok Caption"
    : isFacebook
      ? "Facebook Post"
      : "Instagram Caption";

  const primaryCardTagBg = isTikTok
    ? "oklch(0.55 0.22 15 / 0.15)"
    : isFacebook
      ? "oklch(0.55 0.18 280 / 0.15)"
      : "oklch(0.68 0.18 235 / 0.15)";

  const primaryCardTagColor = isTikTok
    ? "oklch(0.80 0.14 15)"
    : isFacebook
      ? "oklch(0.80 0.12 280)"
      : "oklch(0.82 0.14 235)";

  const primaryCardTagBorder = isTikTok
    ? "1px solid oklch(0.55 0.22 15 / 0.30)"
    : isFacebook
      ? "1px solid oklch(0.55 0.18 280 / 0.30)"
      : "1px solid oklch(0.68 0.18 235 / 0.30)";

  const primaryText =
    formData.captionLength === "short" ? generatedAd.short : generatedAd.long;
  const secondaryText =
    formData.captionLength === "short" ? generatedAd.long : generatedAd.short;
  const secondaryTitle =
    formData.captionLength === "short" ? "Versión Larga" : "Versión Corta";

  // Stagger delays for result cards
  const delays = [0.05, 0.12, 0.2, 0.28, 0.36];

  return (
    <div className="flex flex-col flex-1">
      {/* App Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 flex-1">
          <img
            src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
            alt="AdCreator AI"
            className="w-7 h-7 object-contain logo-glow"
          />
          <span className="font-display font-bold text-sm text-foreground">
            AdCreator AI
          </span>
        </div>
        {/* Success badge */}
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-full px-2.5 py-0.5 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Anuncio generado
        </Badge>
        {/* My Ads icon button */}
        {onGoToMyAds && (
          <button
            type="button"
            data-ocid="result.myads_link"
            onClick={onGoToMyAds}
            aria-label="Mis Anuncios"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ml-1"
          >
            <BookMarked className="w-4 h-4" />
          </button>
        )}
        {userName && onLogout && (
          <UserAvatarChip
            userName={userName}
            onLogout={onLogout}
            onFeedback={onFeedback}
          />
        )}
      </header>

      <main className="flex flex-col flex-1 px-5 pt-5 pb-10 gap-5">
        {/* Loading overlay during regeneration */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3 glass-card rounded-2xl px-10 py-8">
                <Loader2 className="w-9 h-9 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground font-body">
                  Regenerando…
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen image modal */}
        <AnimatePresence>
          {showImageModal && adImageUrl && (
            <AdImageFullscreenModal
              imageUrl={adImageUrl}
              adText={
                formData.captionLength === "short"
                  ? generatedAd.short
                  : generatedAd.long
              }
              onClose={() => setShowImageModal(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Instagram Preview Card ── */}
        <InstagramPreviewCard
          businessName={formData.businessName || formData.businessType}
          adText={previewText}
          platform={formData.platform}
        />

        {/* ── AI Prompt Chip ── */}
        {generatedPrompt && <AiPromptChip prompt={generatedPrompt} />}

        {/* ── AI Generated Image ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: delays[0], duration: 0.4, ease: "easeOut" },
          }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-base">🖼️</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                Imagen Generada por IA
              </span>
            </div>
            <span
              className="text-[10px] font-medium rounded-full px-2.5 py-0.5"
              style={{
                background: "oklch(0.62 0.22 240 / 0.12)",
                color: "oklch(0.82 0.14 235)",
                border: "1px solid oklch(0.62 0.22 240 / 0.25)",
              }}
            >
              1080 × 1080
            </span>
          </div>

          {/* Image area */}
          <div className="p-4">
            {isGeneratingImage ? (
              <div
                data-ocid="result.ad_image_loading_state"
                className="space-y-2"
              >
                <Skeleton
                  className="w-full rounded-xl bg-secondary"
                  style={{ aspectRatio: "1/1" }}
                />
                <p className="text-xs text-center text-muted-foreground font-body">
                  Generando imagen publicitaria…
                </p>
              </div>
            ) : adImageUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { type: "spring", stiffness: 260, damping: 22 },
                }}
                className="flex flex-col gap-3"
              >
                {/* Clickable image with watermark overlay and tap hint */}
                <button
                  type="button"
                  data-ocid="result.ad_image_preview"
                  className="w-full rounded-xl overflow-hidden relative cursor-pointer p-0 border-0 bg-transparent"
                  style={{ aspectRatio: "1/1" }}
                  onClick={() => setShowImageModal(true)}
                  aria-label="Ver imagen completa"
                >
                  <img
                    src={adImageUrl}
                    alt="Imagen publicitaria generada por IA"
                    className="w-full h-full object-cover"
                  />
                  {/* Watermark overlay */}
                  <div
                    className="absolute bottom-0 left-0 right-0 py-2 px-3 flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    }}
                  >
                    <span className="text-white/70 text-[10px] font-medium text-center">
                      Created with AdCreator AI by Cristhian Paz
                    </span>
                  </div>
                  {/* Tap hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                    <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                      Toca para ver completo
                    </span>
                  </div>
                </button>
                {/* 3 action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="result.save_to_photos_button"
                    onClick={() => onSaveToPhotos()}
                    className="flex-1 h-11 rounded-xl font-semibold font-display text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20"
                  >
                    📸 Guardar en Fotos
                  </button>
                  <button
                    type="button"
                    data-ocid="result.share_ad_image_button"
                    onClick={() => onShareAdImage()}
                    className="flex-1 h-11 rounded-xl font-semibold font-display text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </button>
                  <a
                    data-ocid="result.download_ad_image_button"
                    href={adImageUrl}
                    download="anuncio-ia.jpg"
                    className="h-11 w-11 rounded-xl font-semibold font-display text-sm transition-all duration-200 flex items-center justify-center bg-secondary/80 hover:bg-secondary text-foreground border border-border"
                    aria-label="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
                {/* iOS hint */}
                {isIOSSafari() && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    iPhone: mantén presionada la imagen para guardar en Fotos
                  </p>
                )}
              </motion.div>
            ) : (
              <div
                data-ocid="result.ad_image_empty_state"
                className="flex items-center justify-center"
                style={{ aspectRatio: "1/1" }}
              >
                <p className="text-xs text-muted-foreground font-body">
                  No hay imagen disponible.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Primary Platform Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: delays[1], duration: 0.4, ease: "easeOut" },
          }}
          whileHover={{ scale: 1.012, transition: { duration: 0.15 } }}
          className={`${primaryCardClass} rounded-2xl overflow-hidden relative`}
          style={{ borderTop: primaryBorderColor }}
        >
          {/* Top-right glow */}
          <div
            aria-hidden
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: isTikTok
                ? "radial-gradient(circle, oklch(0.55 0.22 15 / 0.18) 0%, transparent 70%)"
                : "radial-gradient(circle, oklch(0.68 0.20 235 / 0.18) 0%, transparent 70%)",
            }}
          />
          {/* Card header */}
          <div className="px-5 pt-4 pb-0 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold text-white"
                  style={{ background: primaryBadgeBg }}
                >
                  {primaryBadgeLabel}
                </span>
                <span className="text-sm font-semibold text-foreground font-display">
                  {formData.captionLength === "short"
                    ? "Versión Corta"
                    : "Versión Larga"}
                </span>
              </div>
              <span
                className="text-[10px] font-medium rounded-full px-2.5 py-0.5"
                style={{
                  background: primaryCardTagBg,
                  color: primaryCardTagColor,
                  border: primaryCardTagBorder,
                }}
              >
                {primaryCardTitle}
              </span>
            </div>
            <p className="font-body text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap min-h-[80px] pb-4">
              {primaryText}
            </p>
          </div>
          <div
            className="px-5 pb-4 pt-3 flex gap-2 relative z-10"
            style={{
              borderTop: `1px solid ${
                isTikTok
                  ? "oklch(0.55 0.22 15 / 0.18)"
                  : isFacebook
                    ? "oklch(0.55 0.20 280 / 0.18)"
                    : "oklch(0.62 0.22 240 / 0.15)"
              }`,
            }}
          >
            <Button
              data-ocid="result.copy_short_button"
              onClick={onCopyShort}
              variant="outline"
              size="sm"
              className="flex-1 h-9 font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-lg gap-1.5 text-xs transition-all duration-200"
            >
              {copiedShort ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Caption
                </>
              )}
            </Button>
            <Button
              data-ocid="result.download_button"
              onClick={onDownloadInstagram}
              variant="outline"
              size="sm"
              className="flex-1 h-9 font-semibold font-display border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg gap-1.5 text-xs transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar 1080×1080
            </Button>
          </div>
        </motion.div>

        {/* ── Secondary Card (other caption length) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: delays[2], duration: 0.4, ease: "easeOut" },
          }}
          whileHover={{ scale: 1.012, transition: { duration: 0.15 } }}
          className="glass-card-fb rounded-2xl overflow-hidden relative"
          style={{ borderTop: "2px solid oklch(0.60 0.22 265 / 0.80)" }}
        >
          {/* Bottom-left glow */}
          <div
            aria-hidden
            className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.55 0.20 280 / 0.18) 0%, transparent 70%)",
            }}
          />
          {/* Card header */}
          <div className="px-5 pt-4 pb-0 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold"
                  style={{
                    background: "oklch(0.42 0.20 265)",
                    color: "#fff",
                  }}
                >
                  {formData.captionLength === "short" ? "FB" : "IG"}
                </span>
                <span className="text-sm font-semibold text-foreground font-display">
                  {secondaryTitle}
                </span>
              </div>
              <span
                className="text-[10px] font-medium rounded-full px-2.5 py-0.5"
                style={{
                  background: "oklch(0.55 0.18 280 / 0.15)",
                  color: "oklch(0.80 0.12 280)",
                  border: "1px solid oklch(0.55 0.18 280 / 0.30)",
                }}
              >
                {formData.captionLength === "short"
                  ? "Facebook Post"
                  : "Instagram Caption"}
              </span>
            </div>
            <p className="font-body text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap min-h-[80px] pb-4">
              {secondaryText}
            </p>
          </div>
          <div
            className="px-5 pb-4 pt-3 relative z-10"
            style={{ borderTop: "1px solid oklch(0.55 0.20 280 / 0.18)" }}
          >
            <Button
              data-ocid="result.copy_long_button"
              onClick={onCopyLong}
              variant="outline"
              size="sm"
              className="w-full h-9 font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-lg gap-1.5 text-xs transition-all duration-200"
            >
              {copiedLong ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar {secondaryTitle}
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* ── Hashtag Chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: delays[3], duration: 0.35 },
          }}
          whileHover={{ scale: 1.012, transition: { duration: 0.15 } }}
          className="glass-card rounded-2xl p-5"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground font-body mb-3">
            # Hashtags Sugeridos
          </p>
          <div
            data-ocid="result.hashtag_chips"
            className="flex flex-wrap gap-2"
          >
            {hashtagChips.map((tag) => (
              <span
                key={tag}
                className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium font-body"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── Action Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: delays[4], duration: 0.35 },
          }}
          className="flex gap-3"
        >
          <Button
            data-ocid="result.regenerate_button"
            onClick={onRegenerate}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="flex-1 h-12 font-semibold font-display border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-xl gap-2 transition-all duration-200 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerar
          </Button>

          <Button
            data-ocid="result.generate_variations_button"
            onClick={onGenerateVariations}
            disabled={isGeneratingVariations || isLoading}
            variant="outline"
            size="lg"
            className="flex-1 h-12 font-semibold font-display border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl gap-2 transition-all duration-200 disabled:opacity-60"
          >
            {isGeneratingVariations ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Layers className="w-4 h-4" />
            )}
            3 Variaciones
          </Button>

          <Button
            data-ocid="result.share_button"
            onClick={onShare}
            variant="outline"
            size="lg"
            className="h-12 w-12 font-semibold font-display border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-all duration-200 p-0 flex-shrink-0"
            aria-label="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* ── Variations Row ── */}
        <AnimatePresence>
          {variations && variations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground font-body mb-3">
                ✨ 3 Variaciones Generadas
              </p>
              <div className="variations-scroll">
                {variations.map((variation, idx) => {
                  const varOcids = [
                    "result.variation_card.1",
                    "result.variation_card.2",
                    "result.variation_card.3",
                  ] as const;
                  const copyOcids = [
                    "result.copy_variation_button.1",
                    "result.copy_variation_button.2",
                    "result.copy_variation_button.3",
                  ] as const;
                  return (
                    <motion.div
                      key={`variation-${idx + 1}`}
                      data-ocid={varOcids[idx]}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          delay: idx * 0.08,
                          duration: 0.3,
                          ease: "easeOut",
                        },
                      }}
                      className="glass-card rounded-xl overflow-hidden flex-shrink-0"
                      style={{ width: 240, minWidth: 240 }}
                    >
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-primary/80 font-body mb-2">
                          Variación {idx + 1}
                        </p>
                        <p
                          className="font-body text-foreground/85 text-xs leading-relaxed whitespace-pre-wrap"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 6,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {variation.short}
                        </p>
                      </div>
                      <div
                        className="px-4 pb-3 pt-2"
                        style={{
                          borderTop: "1px solid oklch(0.62 0.22 240 / 0.12)",
                        }}
                      >
                        <Button
                          data-ocid={copyOcids[idx]}
                          onClick={() =>
                            handleCopyVariation(variation.short, idx)
                          }
                          variant="outline"
                          size="sm"
                          className="w-full h-8 font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-lg gap-1.5 text-xs transition-all duration-200"
                        >
                          {copiedVariations[idx] ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-primary" />
                              ¡Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="bg-border/40" />

        {/* ── Create Another ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.46, duration: 0.35 },
          }}
        >
          <Button
            data-ocid="result.primary_button"
            onClick={onCreateAnother}
            size="lg"
            className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Crear Otro Anuncio
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.55 } }}
          className="text-center mt-2"
        >
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Creado con ❤️ usando{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </motion.footer>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════
   PHOTO AD VIEW
═══════════════════════════════════════ */

const PHOTO_KEYWORD_MAP: Record<string, string[]> = {
  restaurant: [
    "food",
    "comida",
    "restaurant",
    "pizza",
    "burger",
    "taco",
    "sushi",
    "cafe",
    "coffee",
    "sandwich",
    "meal",
    "dish",
    "plate",
    "eat",
    "bread",
    "bakery",
    "pan",
    "pastel",
    "cake",
    "donut",
    "pollo",
    "chicken",
    "steak",
  ],
  barberShop: [
    "barber",
    "barberia",
    "corte",
    "haircut",
    "hair",
    "peluqueria",
    "fade",
    "beard",
  ],
  salon: [
    "salon",
    "beauty",
    "nail",
    "nails",
    "spa",
    "makeup",
    "belleza",
    "unas",
    "manicure",
  ],
  clothingStore: [
    "cloth",
    "ropa",
    "fashion",
    "shirt",
    "dress",
    "shoes",
    "zapatos",
    "outfit",
    "moda",
    "jeans",
    "jacket",
  ],
  carDealer: ["car", "auto", "vehiculo", "truck", "moto", "vehicle", "carro"],
  gym: [
    "gym",
    "fitness",
    "workout",
    "exercise",
    "sport",
    "crossfit",
    "entrenamiento",
  ],
  pharmacy: ["pharmacy", "farmacia", "medicine", "pill", "salud", "health"],
  electronicsStore: [
    "phone",
    "laptop",
    "computer",
    "tech",
    "electronic",
    "gadget",
    "celular",
    "tablet",
  ],
  bakery: [
    "bakery",
    "panaderia",
    "bread",
    "pastry",
    "reposteria",
    "cake",
    "pan",
  ],
};

const PHOTO_PROMO_MAP: Record<string, string> = {
  restaurant:
    "¡Visítanos y prueba nuestros deliciosos platillos! Sabores únicos que te encantarán.",
  barberShop:
    "¡El mejor corte de tu vida te espera! Reserva tu cita ahora y luce increíble.",
  salon:
    "¡Transforma tu look hoy! Tratamientos de belleza para realzar tu mejor versión.",
  clothingStore:
    "¡Renueva tu estilo con nuestras últimas colecciones! Moda para todos los gustos.",
  carDealer:
    "¡Encuentra el auto de tus sueños! Financiamiento disponible, test drive gratis.",
  gym: "¡Transforma tu cuerpo y mente! Únete hoy y alcanza tus metas fitness.",
  pharmacy:
    "¡Tu salud es nuestra prioridad! Medicamentos y productos de bienestar al mejor precio.",
  electronicsStore:
    "¡Tecnología de última generación! Encuentra los mejores gadgets al precio más bajo.",
  bakery:
    "¡Pan artesanal horneado con amor cada día! Postres y delicias para toda la familia.",
  cafe: "¡El café perfecto te espera! Ambiente acogedor y bebidas artesanales únicas.",
  retail:
    "¡Grandes ofertas y productos increíbles! Ven y descubre todo lo que tenemos.",
};

function detectCategoryFromFile(file: File): string {
  const name = file.name.toLowerCase().replace(/[^a-z0-9]/g, " ");
  for (const [category, keywords] of Object.entries(PHOTO_KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (name.includes(kw)) return category;
    }
  }
  return "restaurant";
}

const ANALYSIS_STEPS = [
  "📤 Subiendo imagen...",
  "🔍 Detectando producto...",
  "✍️ Generando caption...",
  "🎨 Creando layout del anuncio...",
  "✅ ¡Casi listo!",
];

function PhotoAdView({ onBack }: { onBack: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedCategory, setDetectedCategory] =
    useState<string>("restaurant");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("restaurant");
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<AdVersions | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Animate through analysis steps when generating
  useEffect(() => {
    if (!isGenerating) {
      setAnalysisStep(0);
      return;
    }
    setAnalysisStep(0);
    const timers = ANALYSIS_STEPS.slice(1).map((_, i) =>
      setTimeout(() => setAnalysisStep(i + 1), (i + 1) * 600),
    );
    return () => timers.forEach(clearTimeout);
  }, [isGenerating]);

  const handleFileChange = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    const category = detectCategoryFromFile(file);
    setDetectedCategory(category);
    setSelectedCategory(category);
    setResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFileChange(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile || !previewUrl) return;
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    const formDataForAd: FormData = {
      businessName: "",
      businessType: selectedCategory,
      city: "tu ciudad",
      promotion:
        PHOTO_PROMO_MAP[selectedCategory] ??
        "¡Visítanos hoy y descubre todo lo que tenemos para ti!",
      discount: "",
      whatsapp: "",
      tone: "divertido",
      platform: "instagram",
      captionLength: "short",
    };

    const ad = generateAd(formDataForAd);
    setResult(ad);

    saveAdToStorage({
      id: Date.now().toString(),
      businessName: BUSINESS_TYPE_LABELS[selectedCategory] ?? selectedCategory,
      imageUrl: previewUrl,
      captionShort: ad.short,
      captionLong: ad.long,
      platform: "instagram",
      savedAt: Date.now(),
    });

    setIsGenerating(false);
    toast.success("¡Anuncio generado desde tu foto!", { duration: 2000 });
  };

  const handleCopyCaption = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.short);
      setCopiedCaption(true);
      toast.success("¡Caption copiado!", { duration: 2000 });
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      toast.error("Error al copiar.");
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectedCategory("restaurant");
    setSelectedCategory("restaurant");
    setResult(null);
    setCopiedCaption(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const hashtagChips = (
    BUSINESS_DATA[selectedCategory]?.hashtags ?? "#Negocio #Ofertas"
  )
    .split(" ")
    .filter(Boolean);

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button
          type="button"
          data-ocid="photo_ad.cancel_button"
          onClick={onBack}
          aria-label="Volver"
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <img
            src="/assets/generated/adcreator-logo-icon-transparent.dim_200x200.png"
            alt="AdCreator AI"
            className="w-7 h-7 object-contain logo-glow"
          />
          <span className="font-display font-bold text-sm text-foreground">
            Anuncio desde Foto
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30">
          <Camera className="w-2.5 h-2.5" />
          Nuevo
        </span>
      </header>

      <main className="flex flex-col flex-1 px-5 pt-5 pb-10 gap-5">
        {/* Fullscreen image modal */}
        <AnimatePresence>
          {showPhotoModal && previewUrl && (
            <AdImageFullscreenModal
              imageUrl={previewUrl}
              adText={result?.short ?? ""}
              onClose={() => setShowPhotoModal(false)}
            />
          )}
        </AnimatePresence>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
          className="flex flex-col gap-3"
        >
          {/* Camera input — opens device camera */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Tomar foto con la cámara"
          />
          {/* Gallery input — opens photo library (NO capture attr) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Elegir foto de la galería"
          />

          {!previewUrl ? (
            /* Drop zone */
            <div
              data-ocid="photo_ad.dropzone"
              className="glass-card rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center gap-4 p-8"
              style={{ minHeight: 220 }}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-foreground text-base mb-1">
                  Elige cómo subir tu foto
                </p>
                <p className="font-body text-muted-foreground text-sm">
                  Cámara directa o desde tu galería
                </p>
                <p className="font-body text-muted-foreground text-xs mt-2">
                  JPG, PNG, HEIC · Máx 20 MB
                </p>
              </div>
              {/* Dual upload buttons */}
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  type="button"
                  data-ocid="photo_ad.camera_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 h-12 rounded-xl font-semibold font-display text-sm bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Cámara
                </button>
                <button
                  type="button"
                  data-ocid="photo_ad.gallery_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    galleryInputRef.current?.click();
                  }}
                  className="flex-1 h-12 rounded-xl font-semibold font-display text-sm bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Galería
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { type: "spring", stiffness: 280, damping: 24 },
              }}
              className="flex flex-col gap-3"
            >
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={previewUrl}
                  alt="Foto subida"
                  className="w-full h-full object-cover"
                />
                {/* Watermark overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 py-2 px-3 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  }}
                >
                  <span className="text-white/70 text-[10px] font-medium text-center">
                    Created with AdCreator AI by Cristhian Paz
                  </span>
                </div>
              </div>
              {/* Change photo — dual buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="photo_ad.camera_button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-10 rounded-xl font-semibold font-display text-xs bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Cámara
                </button>
                <button
                  type="button"
                  data-ocid="photo_ad.gallery_button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 h-10 rounded-xl font-semibold font-display text-xs bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Galería
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Detection + Category selector (only after photo selected) */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3"
            >
              {/* Detection badge */}
              <div className="flex items-center gap-2">
                <span
                  data-ocid="photo_ad.detected_category"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 font-body"
                >
                  🔍 Detectado:{" "}
                  {BUSINESS_TYPE_LABELS[detectedCategory] ?? detectedCategory}
                </span>
              </div>

              {/* Category override */}
              <div className="flex flex-col gap-1.5">
                <Label className="font-body text-sm font-medium text-foreground/90">
                  Tipo de Negocio
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(val) => setSelectedCategory(val)}
                >
                  <SelectTrigger
                    data-ocid="photo_ad.category_select"
                    className="h-11 bg-secondary/60 border-border text-foreground focus:ring-primary rounded-xl"
                  >
                    <SelectValue placeholder="Selecciona el tipo de negocio" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl">
                    {Object.entries(BUSINESS_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg"
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate button */}
              {!result && (
                <Button
                  data-ocid="photo_ad.submit_button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full h-12 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analizando imagen…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />✨ Analizar y Generar
                      Anuncio
                    </>
                  )}
                </Button>
              )}

              {/* Loading state with animated analysis steps */}
              {isGenerating && (
                <div
                  data-ocid="photo_ad.loading_state"
                  className="space-y-3 py-2"
                >
                  <Skeleton className="h-4 w-3/4 bg-secondary rounded-full" />
                  <Skeleton className="h-4 w-full bg-secondary rounded-full" />
                  <Skeleton className="h-4 w-2/3 bg-secondary rounded-full" />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={analysisStep}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-center pt-1"
                    >
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-body"
                        style={{
                          background: "oklch(0.62 0.22 240 / 0.12)",
                          color: "oklch(0.82 0.14 235)",
                          border: "1px solid oklch(0.62 0.22 240 / 0.30)",
                        }}
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {ANALYSIS_STEPS[analysisStep]}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result section */}
        <AnimatePresence>
          {result && previewUrl && (
            <motion.div
              data-ocid="photo_ad.result_section"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <Separator className="bg-border/40" />

              {/* AI Image section with uploaded photo */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.05, duration: 0.35 },
                }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📸</span>
                    <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                      Tu Foto como Anuncio
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-medium rounded-full px-2.5 py-0.5"
                    style={{
                      background: "oklch(0.62 0.22 240 / 0.12)",
                      color: "oklch(0.82 0.14 235)",
                      border: "1px solid oklch(0.62 0.22 240 / 0.25)",
                    }}
                  >
                    1080 × 1080
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <button
                    type="button"
                    className="w-full rounded-xl overflow-hidden relative cursor-pointer p-0 border-0 bg-transparent"
                    style={{ aspectRatio: "1/1" }}
                    onClick={() => setShowPhotoModal(true)}
                    aria-label="Ver imagen completa"
                  >
                    <img
                      src={previewUrl}
                      alt="Foto del producto"
                      className="w-full h-full object-cover"
                    />
                    {/* Top gradient + AdCreator AI badge */}
                    <div
                      className="absolute top-0 left-0 right-0 pt-3 pb-8 px-3 flex items-start justify-between"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)",
                      }}
                    >
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.55 0.25 265 / 0.85), oklch(0.50 0.28 295 / 0.85))",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        ✨ AdCreator AI
                      </span>
                    </div>
                    {/* Bottom gradient + business label + caption subtitle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 pt-10 pb-2 px-4 flex flex-col gap-0.5"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.45), transparent)",
                      }}
                    >
                      <span className="text-white font-display font-bold text-lg leading-tight drop-shadow">
                        {BUSINESS_TYPE_LABELS[selectedCategory] ??
                          selectedCategory}
                      </span>
                      <span className="text-white/80 text-xs font-body leading-snug line-clamp-2">
                        {result.short.split("\n")[0] ?? ""}
                      </span>
                      <span className="text-white/50 text-[9px] font-medium mt-1 text-center">
                        Created with AdCreator AI by Cristhian Paz
                      </span>
                    </div>
                    {/* Tap hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                        Toca para ver completo
                      </span>
                    </div>
                  </button>
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-ocid="photo_ad.save_to_photos_button"
                      onClick={() => saveToPhotos(previewUrl)}
                      className="flex-1 h-12 rounded-xl font-semibold font-display text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20"
                    >
                      📸 Guardar en Fotos
                    </button>
                    <button
                      type="button"
                      data-ocid="photo_ad.share_button"
                      onClick={() => shareAdImage(previewUrl, result.short)}
                      className="flex-1 h-12 rounded-xl font-semibold font-display text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </button>
                    <button
                      type="button"
                      data-ocid="photo_ad.download_button"
                      onClick={() =>
                        downloadInstagramImage(
                          BUSINESS_TYPE_LABELS[selectedCategory] ??
                            selectedCategory,
                          result.short,
                        )
                      }
                      className="h-12 w-12 rounded-xl font-semibold font-display text-sm transition-all duration-200 flex items-center justify-center bg-secondary/80 hover:bg-secondary text-foreground border border-border"
                      aria-label="Descargar 1080×1080"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  {isIOSSafari() && (
                    <p className="text-center text-[11px] text-muted-foreground">
                      iPhone: mantén presionada la imagen para guardar en Fotos
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Instagram preview card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.1, duration: 0.35 },
                }}
              >
                <InstagramPreviewCard
                  businessName={
                    BUSINESS_TYPE_LABELS[selectedCategory] ?? selectedCategory
                  }
                  adText={result.short}
                  platform="instagram"
                />
              </motion.div>

              {/* Caption card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.15, duration: 0.35 },
                }}
                className="glass-card-ig rounded-2xl overflow-hidden"
                style={{ borderTop: "2px solid oklch(0.72 0.18 230 / 0.80)" }}
              >
                <div className="px-5 pt-4 pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.68 0.22 15), oklch(0.62 0.24 330), oklch(0.58 0.22 280))",
                        }}
                      >
                        IG
                      </span>
                      <span className="text-sm font-semibold text-foreground font-display">
                        Caption Generada
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-medium rounded-full px-2.5 py-0.5"
                      style={{
                        background: "oklch(0.68 0.18 235 / 0.15)",
                        color: "oklch(0.82 0.14 235)",
                        border: "1px solid oklch(0.68 0.18 235 / 0.30)",
                      }}
                    >
                      Instagram Caption
                    </span>
                  </div>
                  <p className="font-body text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap min-h-[80px] pb-4">
                    {result.short}
                  </p>
                </div>
                <div
                  className="px-5 pb-4 pt-3"
                  style={{ borderTop: "1px solid oklch(0.62 0.22 240 / 0.15)" }}
                >
                  <Button
                    data-ocid="photo_ad.copy_caption_button"
                    onClick={handleCopyCaption}
                    variant="outline"
                    size="sm"
                    className="w-full h-9 font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-lg gap-1.5 text-xs transition-all duration-200"
                  >
                    {copiedCaption ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-primary" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Caption
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Hashtag chips */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.2, duration: 0.35 },
                }}
                className="glass-card rounded-2xl p-5"
              >
                <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground font-body mb-3">
                  # Hashtags Sugeridos
                </p>
                <div className="flex flex-wrap gap-2">
                  {hashtagChips.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium font-body"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Action row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.25, duration: 0.35 },
                }}
                className="flex gap-3"
              >
                <Button
                  data-ocid="photo_ad.regenerate_button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 font-semibold font-display border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-xl gap-2 transition-all duration-200 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerar
                </Button>
                <Button
                  data-ocid="photo_ad.new_photo_button"
                  onClick={handleReset}
                  size="lg"
                  className="flex-1 h-12 font-semibold font-display bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl gap-2 transition-all duration-200"
                >
                  <Camera className="w-4 h-4" />
                  Nueva Foto
                </Button>
              </motion.div>

              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.35 } }}
                className="text-center mt-2"
              >
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()}. Creado con ❤️ usando{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    caffeine.ai
                  </a>
                </p>
              </motion.footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
