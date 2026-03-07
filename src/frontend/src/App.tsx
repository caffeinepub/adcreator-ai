import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCheck,
  Copy,
  Download,
  Heart,
  Layers,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */

type AdTone = "profesional" | "urgente" | "divertido" | "promocion";
type View = "home" | "form" | "result";
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

const AD_IMAGES: Record<string, string> = {
  barberShop: "/assets/generated/ad-barbershop.dim_1080x1080.jpg",
  cafe: "/assets/generated/ad-cafe.dim_1080x1080.jpg",
  gym: "/assets/generated/ad-gym.dim_1080x1080.jpg",
  restaurant: "/assets/generated/ad-restaurant.dim_1080x1080.jpg",
  clothingStore: "/assets/generated/ad-clothing.dim_1080x1080.jpg",
  pharmacy: "/assets/generated/ad-pharmacy.dim_1080x1080.jpg",
  electronicsStore: "/assets/generated/ad-electronics.dim_1080x1080.jpg",
  bakery: "/assets/generated/ad-bakery.dim_1080x1080.jpg",
  salon: "/assets/generated/ad-salon.dim_1080x1080.jpg",
  retail: "/assets/generated/ad-retail.dim_1080x1080.jpg",
  carDealer: "/assets/generated/ad-car-dealer.dim_1080x1080.jpg",
};

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
  ctx.font = "26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AdCreator AI", 540, 1048);

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
   APP ROOT
═══════════════════════════════════════ */

export default function App() {
  const [view, setView] = useState<View>("home");
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

  const handleGenerateAd = async (data?: FormData) => {
    const fd = data ?? formData;

    if (!fd.businessType || !fd.city.trim() || !fd.promotion.trim()) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    setIsLoading(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const ad = generateAd(fd);
      setGeneratedAd(ad);
      setView("result");
      setIsGeneratingImage(true);
      setTimeout(() => {
        setAdImageUrl(AD_IMAGES[fd.businessType] ?? null);
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

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const ad = generateAd(formData);
      setGeneratedAd(ad);
      setAdImageUrl(null);
      setIsGeneratingImage(true);
      setTimeout(() => {
        setAdImageUrl(AD_IMAGES[formData.businessType] ?? null);
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
    setView("home");
  };

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
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <HomeView onCreateAd={() => setView("form")} />
            </motion.div>
          )}

          {view === "form" && (
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
                  setView("home");
                }}
                onSubmit={() => handleGenerateAd()}
              />
            </motion.div>
          )}

          {view === "result" && generatedAd && (
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HOME VIEW
═══════════════════════════════════════ */

function HomeView({ onCreateAd }: { onCreateAd: () => void }) {
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

        {/* Overlaid title + tagline at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.15, duration: 0.45 },
            }}
            className="font-display text-4xl font-bold tracking-tight mb-1.5 leading-tight"
          >
            <span className="text-gradient">AdCreator</span>{" "}
            <span className="text-foreground">AI</span>
          </motion.h1>
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
}

function FormView({
  formData,
  setFormData,
  isLoading,
  error,
  onBack,
  onSubmit,
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
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">
            AdCreator AI
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-body">
          Nuevo Anuncio
        </span>
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

          {/* Error */}
          {error && (
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

          {/* Submit */}
          <div className="mt-auto pt-2">
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
  onCopyShort: () => void;
  onCopyLong: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  onGenerateVariations: () => void;
  onDownloadInstagram: () => void;
  onCreateAnother: () => void;
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
  onCopyShort,
  onCopyLong,
  onShare,
  onRegenerate,
  onGenerateVariations,
  onDownloadInstagram,
  onCreateAnother,
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
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-display font-bold text-sm text-foreground">
            AdCreator AI
          </span>
        </div>
        {/* Success badge */}
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-full px-2.5 py-0.5 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Anuncio generado
        </Badge>
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

        {/* ── Instagram Preview Card ── */}
        <InstagramPreviewCard
          businessName={formData.businessName || formData.businessType}
          adText={previewText}
          platform={formData.platform}
        />

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
                <div
                  data-ocid="result.ad_image_preview"
                  className="w-full rounded-xl overflow-hidden"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={adImageUrl}
                    alt="Imagen publicitaria generada por IA"
                    className="w-full h-full object-cover"
                  />
                </div>
                <a
                  data-ocid="result.download_ad_image_button"
                  href={adImageUrl}
                  download="anuncio-ia.jpg"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl font-semibold font-display text-sm transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground btn-glow"
                >
                  <Download className="w-4 h-4" />
                  Descargar Imagen del Anuncio
                </a>
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
                  Copiar
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
