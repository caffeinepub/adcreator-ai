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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  Loader2,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildVideoSceneBreakdown } from "../utils/aiPrompts";

/* ── Types ─────────────────────────────────────── */

type VideoPlatform = "instagram" | "tiktok" | "facebook";

const VIDEO_FREE_LIMIT = 1;

const PLATFORM_CONFIG: Record<
  VideoPlatform,
  { label: string; icon: string; color: string; hashtags: string }
> = {
  instagram: {
    label: "Instagram Reels",
    icon: "📸",
    color: "#e1306c",
    hashtags: "#InstagramReels #Reels #FYP",
  },
  tiktok: {
    label: "TikTok",
    icon: "🎵",
    color: "#ee1d52",
    hashtags: "#TikTok #FYP #ParaTi #Viral",
  },
  facebook: {
    label: "Facebook Reels",
    icon: "👤",
    color: "#1877f2",
    hashtags: "#FacebookReels #Reels",
  },
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  gym: "🏋️ Gimnasio",
  cafe: "☕ Cafetería",
  restaurant: "🍽️ Restaurante",
  barberShop: "💈 Barbería",
  salon: "✂️ Salón de Belleza",
  clothingStore: "👗 Tienda de Ropa",
  carDealer: "🚗 Concesionaria",
  pharmacy: "💊 Farmacia",
  electronicsStore: "📱 Electrónica",
  bakery: "🥐 Panadería",
  retail: "🛍️ Tienda",
};

const BUSINESS_HOOKS: Record<string, string> = {
  gym: "¿Quieres transformar tu cuerpo?",
  cafe: "¿Buscas el café perfecto?",
  restaurant: "¿Se te antoja comer rico?",
  barberShop: "¿Buscas el mejor corte?",
  salon: "¿Lista para un cambio de look?",
  clothingStore: "¿Buscas estilo único?",
  carDealer: "¿Tu auto ideal te espera?",
  pharmacy: "¿Cuidando tu salud?",
  electronicsStore: "¿Buscas la última tecnología?",
  bakery: "¿Antojo de pan fresco?",
  retail: "¿Buscas las mejores ofertas?",
};

/* ── Scene timing ────────────────────────────────
   Total: 8 seconds
   Scene 1: 0–2s   Hook
   Scene 2: 2–4s   Product highlight
   Scene 3: 4–6s   Promo message
   Scene 4: 6–8s   CTA
─────────────────────────────────────────────────── */

const DURATION = 8;
const SCENE_TIMES = [0, 2, 4, 6, 8];

function getScene(t: number): number {
  if (t < 2) return 1;
  if (t < 4) return 2;
  if (t < 6) return 3;
  return 4;
}

function getSceneProgress(t: number): number {
  const scene = getScene(t);
  const sceneStart = SCENE_TIMES[scene - 1];
  const sceneDur = 2;
  return Math.min(1, (t - sceneStart) / sceneDur);
}

function getCrossfadeAlpha(t: number): number {
  // Crossfade during first 0.3s of each scene
  const sceneStart = SCENE_TIMES[getScene(t) - 1];
  const elapsed = t - sceneStart;
  if (elapsed < 0.3) return elapsed / 0.3;
  return 1;
}

/* ── Canvas video renderer ──────────────────────── */

function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  businessName: string,
  businessType: string,
  promoMessage: string,
  platform: VideoPlatform,
  t: number,
) {
  const cfg = PLATFORM_CONFIG[platform];
  const scene = getScene(t);
  const sp = getSceneProgress(t);
  const fadeIn = getCrossfadeAlpha(t);

  // ── Scene-specific backgrounds ───────────────────
  const drawBackground = () => {
    let bg: CanvasGradient;
    if (scene === 1) {
      // Deep purple → black, energy
      bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#1a0035");
      bg.addColorStop(0.5, "#0d001a");
      bg.addColorStop(1, "#050005");
    } else if (scene === 2) {
      // Platform brand color → dark
      bg = ctx.createLinearGradient(0, 0, width * 0.5, height);
      bg.addColorStop(0, `${cfg.color}33`);
      bg.addColorStop(0.6, "#060c18");
      bg.addColorStop(1, "#020408");
    } else if (scene === 3) {
      // Dark teal/green → black
      bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#002020");
      bg.addColorStop(0.5, "#001010");
      bg.addColorStop(1, "#000505");
    } else {
      // Deep blue → purple CTA
      bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#000c2e");
      bg.addColorStop(0.5, "#0a0020");
      bg.addColorStop(1, "#150028");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  };

  drawBackground();

  // ── Animated particles (scene-specific color) ────
  const particleColor =
    scene === 1
      ? "rgba(160,60,240,"
      : scene === 2
        ? `rgba(${Number.parseInt(cfg.color.slice(1, 3), 16)},${Number.parseInt(cfg.color.slice(3, 5), 16)},${Number.parseInt(cfg.color.slice(5, 7), 16)},`
        : scene === 3
          ? "rgba(0,200,160,"
          : "rgba(80,120,255,";

  for (let i = 0; i < 20; i++) {
    const px =
      ((Math.sin(i * 2.4 + t * 0.35) * 0.5 + 0.5) * width * 1.1) % width;
    const py =
      ((Math.cos(i * 1.7 + t * 0.28) * 0.5 + 0.5) * height * 1.1) % height;
    const r = 2.5 + Math.sin(i + t * 0.7) * 1.5;
    const alpha = 0.12 + Math.sin(i * 0.9 + t * 0.5) * 0.08;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `${particleColor}${alpha})`;
    ctx.fill();
  }

  // ── Radial glow pulse ────────────────────────────
  const pulseScale = 0.85 + Math.sin(t * 1.4) * 0.15;
  const glowColors: [string, string] =
    scene === 1
      ? ["rgba(150,50,230,0.20)", "rgba(100,30,180,0.08)"]
      : scene === 2
        ? [`${cfg.color}33`, `${cfg.color}11`]
        : scene === 3
          ? ["rgba(0,180,140,0.18)", "rgba(0,120,100,0.07)"]
          : ["rgba(60,100,240,0.20)", "rgba(40,60,200,0.08)"];

  const glowRad = ctx.createRadialGradient(
    width / 2,
    height * 0.38,
    0,
    width / 2,
    height * 0.38,
    width * 0.72 * pulseScale,
  );
  glowRad.addColorStop(0, glowColors[0]);
  glowRad.addColorStop(0.5, glowColors[1]);
  glowRad.addColorStop(1, "transparent");
  ctx.fillStyle = glowRad;
  ctx.fillRect(0, 0, width, height);

  // ── Platform color accent bars ───────────────────
  const barAlpha = 0.7 + Math.sin(t * 1.8) * 0.3;
  const barColorHex = Math.round(barAlpha * 255)
    .toString(16)
    .padStart(2, "0");
  ctx.fillStyle = cfg.color + barColorHex;
  ctx.fillRect(0, 0, width, 5);
  ctx.fillRect(0, height - 5, width, 5);

  // ── Platform badge (top-right) ───────────────────
  ctx.font = "bold 18px Arial, sans-serif";
  const badgeText = cfg.label;
  const badgeW = ctx.measureText(badgeText).width + 22;
  const badgeX = width - badgeW - 14;
  const badgeY = 16;
  ctx.fillStyle = `${cfg.color}cc`;
  roundRect(ctx, badgeX, badgeY, badgeW, 30, 8);
  ctx.fillStyle = "white";
  ctx.font = "bold 15px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + 11, badgeY + 15);

  // ── Scene indicator dots (bottom area) ───────────
  const dotSpacing = 20;
  const totalDotW = 4 * dotSpacing;
  const dotStartX = width / 2 - totalDotW / 2 + dotSpacing / 2;
  const dotY = height - 50;
  for (let di = 0; di < 4; di++) {
    const isActive = di + 1 === scene;
    ctx.beginPath();
    ctx.arc(
      dotStartX + di * dotSpacing,
      dotY,
      isActive ? 5 : 3,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = isActive ? cfg.color : "rgba(255,255,255,0.30)";
    ctx.fill();
  }

  // ── Apply fade-in on scene transitions ───────────
  ctx.save();
  ctx.globalAlpha = fadeIn;

  if (scene === 1) {
    // ── SCENE 1: Hook ────────────────────────────────
    const hookText = BUSINESS_HOOKS[businessType] ?? "¿Buscas lo mejor?";

    // Large hook question
    const hookFontSize = Math.min(44, Math.floor(width * 0.078));
    ctx.font = `bold ${hookFontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(180,80,255,0.9)";
    ctx.shadowBlur = 22;

    // Word-wrap hook
    const hookWords = hookText.split(" ");
    const hookMaxW = width * 0.82;
    const hookLines: string[] = [];
    let hCur = "";
    for (const w of hookWords) {
      const test = hCur + (hCur ? " " : "") + w;
      if (ctx.measureText(test).width > hookMaxW && hCur) {
        hookLines.push(hCur);
        hCur = w;
      } else hCur = test;
    }
    if (hCur) hookLines.push(hCur);

    const hookLineH = hookFontSize * 1.25;
    const hookStartY = height * 0.36 - (hookLines.length - 1) * hookLineH * 0.5;
    // Slide in from left
    const slideX = -50 + Math.min(1, sp * 2.5) * (width / 2 + 50);
    hookLines.forEach((ln, i) => {
      ctx.fillText(ln, slideX, hookStartY + i * hookLineH);
    });
    ctx.shadowBlur = 0;

    // Sparkle emoji
    const sparkAlpha = sp > 0.3 ? 0.5 + Math.sin(t * 3) * 0.5 : 0;
    ctx.save();
    ctx.globalAlpha *= sparkAlpha;
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("✨", width / 2, height * 0.58 + Math.sin(t * 2) * 5);
    ctx.restore();

    // Business name teaser (bottom)
    const nameAlpha = sp > 0.5 ? Math.min(1, (sp - 0.5) * 2) : 0;
    ctx.save();
    ctx.globalAlpha *= nameAlpha;
    ctx.font = `bold ${Math.min(32, Math.floor(width * 0.058))}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = cfg.color;
    ctx.fillText(
      (businessName || "Mi Negocio").toUpperCase(),
      width / 2,
      height * 0.73,
    );
    ctx.restore();
  } else if (scene === 2) {
    // ── SCENE 2: Product Highlight ───────────────────
    // Business name LARGE
    const nameFontSize = Math.min(56, Math.floor(width * 0.095));
    ctx.font = `bold ${nameFontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 20;

    const nameSlide = Math.min(1, sp / 0.5);
    const nameX = -60 + nameSlide * (width / 2 + 60);

    // Wrap name
    const nameText = (businessName || "Mi Negocio").toUpperCase();
    const nameWords2 = nameText.split(" ");
    const nameMaxW2 = width * 0.84;
    const nameLines2: string[] = [];
    let nCur = "";
    for (const w of nameWords2) {
      const test = nCur + (nCur ? " " : "") + w;
      if (ctx.measureText(test).width > nameMaxW2 && nCur) {
        nameLines2.push(nCur);
        nCur = w;
      } else nCur = test;
    }
    if (nCur) nameLines2.push(nCur);

    const nLineH2 = nameFontSize * 1.2;
    const nStartY = height * 0.32 - (nameLines2.length - 1) * nLineH2 * 0.5;
    nameLines2.forEach((ln, i) => {
      ctx.fillText(ln, nameX, nStartY + i * nLineH2);
    });
    ctx.shadowBlur = 0;

    // Divider line (animated width)
    const divProg = Math.min(1, Math.max(0, (sp - 0.25) / 0.4));
    ctx.save();
    ctx.globalAlpha *= Math.min(1, Math.max(0, (sp - 0.2) / 0.3));
    const divGrad2 = ctx.createLinearGradient(
      width * 0.1,
      height * 0.47,
      width * 0.9,
      height * 0.47,
    );
    divGrad2.addColorStop(0, "transparent");
    divGrad2.addColorStop(0.3, `${cfg.color}cc`);
    divGrad2.addColorStop(0.7, `${cfg.color}cc`);
    divGrad2.addColorStop(1, "transparent");
    ctx.strokeStyle = divGrad2;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.47);
    ctx.lineTo(width * 0.1 + width * 0.8 * divProg, height * 0.47);
    ctx.stroke();
    ctx.restore();

    // City/discover subtitle
    const subAlpha = sp > 0.4 ? Math.min(1, (sp - 0.4) * 2.5) : 0;
    ctx.save();
    ctx.globalAlpha *= subAlpha;
    ctx.font = `${Math.min(24, Math.floor(width * 0.042))}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(200,220,255,0.88)";
    ctx.fillText("Descubre lo mejor en tu ciudad 🌟", width / 2, height * 0.54);
    ctx.restore();
  } else if (scene === 3) {
    // ── SCENE 3: Promo Message ───────────────────────
    // Energetic background accent shape
    const accentAlpha = sp * 0.3;
    ctx.save();
    ctx.globalAlpha *= accentAlpha;
    ctx.fillStyle = "rgba(0,200,140,0.15)";
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.4, width * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // "OFERTA" label badge at top
    const badgeAlpha2 = Math.min(1, sp * 3);
    ctx.save();
    ctx.globalAlpha *= badgeAlpha2;
    const pBadge = "¡OFERTA ESPECIAL!";
    ctx.font = "bold 22px Arial, sans-serif";
    const pBadgeW = ctx.measureText(pBadge).width + 24;
    const pBadgeX = (width - pBadgeW) / 2;
    ctx.fillStyle = "rgba(0,180,120,0.80)";
    roundRect(ctx, pBadgeX, height * 0.19, pBadgeW, 34, 10);
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(pBadge, pBadgeX + 12, height * 0.19 + 17);
    ctx.restore();

    // Main promo message
    const msgAlpha2 = Math.min(1, Math.max(0, (sp - 0.15) / 0.5));
    ctx.save();
    ctx.globalAlpha *= msgAlpha2;
    const fontSize3 = Math.min(34, Math.floor(width * 0.06));
    ctx.font = `bold ${fontSize3}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(240,255,240,0.96)";
    ctx.shadowColor = "rgba(0,200,120,0.7)";
    ctx.shadowBlur = 12;

    const msg = promoMessage || "¡Oferta especial para ti!";
    const promoWords = msg.split(" ");
    const promoMaxW = width * 0.82;
    const promoLines: string[] = [];
    let pCur = "";
    for (const w of promoWords) {
      const test = pCur + (pCur ? " " : "") + w;
      if (ctx.measureText(test).width > promoMaxW && pCur) {
        promoLines.push(pCur);
        pCur = w;
      } else pCur = test;
    }
    if (pCur) promoLines.push(pCur);

    const pLineH = fontSize3 * 1.5;
    const pStartY = height * 0.37;
    promoLines.slice(0, 4).forEach((ln, i) => {
      ctx.fillText(ln, width / 2, pStartY + i * pLineH);
    });
    ctx.shadowBlur = 0;
    ctx.restore();

    // Business name small
    const bizSmallAlpha = sp > 0.6 ? Math.min(1, (sp - 0.6) * 3) : 0;
    ctx.save();
    ctx.globalAlpha *= bizSmallAlpha;
    ctx.font = "22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `${cfg.color}cc`;
    ctx.fillText(
      `— ${businessName || "Mi Negocio"} —`,
      width / 2,
      height * 0.72,
    );
    ctx.restore();
  } else {
    // ── SCENE 4: CTA ────────────────────────────────
    // "¡Visítanos Hoy!" in large text
    const ctaAlpha = Math.min(1, sp * 2.5);
    ctx.save();
    ctx.globalAlpha *= ctaAlpha;
    const ctaFontSize = Math.min(60, Math.floor(width * 0.105));
    ctx.font = `bold ${ctaFontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(80,120,255,0.9)";
    ctx.shadowBlur = 24;
    ctx.fillText("¡Visítanos", width / 2, height * 0.34);
    ctx.fillText("Hoy! 👋", width / 2, height * 0.34 + ctaFontSize * 1.2);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Business name
    const ctaNameAlpha = sp > 0.25 ? Math.min(1, (sp - 0.25) * 2.5) : 0;
    ctx.save();
    ctx.globalAlpha *= ctaNameAlpha;
    ctx.font = `bold ${Math.min(32, Math.floor(width * 0.058))}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 10;
    ctx.fillText(
      (businessName || "Mi Negocio").toUpperCase(),
      width / 2,
      height * 0.6,
    );
    ctx.shadowBlur = 0;
    ctx.restore();

    // Hashtags
    const hashAlpha = sp > 0.5 ? Math.min(1, (sp - 0.5) * 2.5) : 0;
    ctx.save();
    ctx.globalAlpha *= hashAlpha;
    ctx.font = "18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `${cfg.color}bb`;
    ctx.fillText(cfg.hashtags, width / 2, height * 0.7);
    ctx.restore();

    // CTA Pulse indicator circle
    const pulseProg = (t % 1) / 1;
    ctx.save();
    ctx.globalAlpha *= ctaAlpha * (1 - pulseProg) * 0.5;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.8, 20 + pulseProg * 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // end fadeIn globalAlpha

  // ── Watermark ────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.font = "13px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(
    "Created with AdCreator AI by Cristhian Paz",
    width / 2,
    height - 22,
  );
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

async function generatePromoVideo(
  businessName: string,
  businessType: string,
  promoMessage: string,
  platform: VideoPlatform,
  onProgress: (p: number) => void,
): Promise<Blob> {
  const W = 540;
  const H = 960;
  const FPS = 30;
  const TOTAL_FRAMES = FPS * DURATION;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm",
    videoBitsPerSecond: 2_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onerror = reject;
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(blob);
    };

    recorder.start();

    let frame = 0;
    function renderNext() {
      if (frame >= TOTAL_FRAMES) {
        recorder.stop();
        return;
      }
      const t = frame / FPS;
      drawVideoFrame(
        ctx,
        W,
        H,
        businessName,
        businessType,
        promoMessage,
        platform,
        t,
      );
      onProgress(Math.round((frame / TOTAL_FRAMES) * 100));
      frame++;
      requestAnimationFrame(renderNext);
    }
    renderNext();
  });
}

/* ── AI Scene Breakdown Component ───────────────── */

function SceneBreakdown({ scenes }: { scenes: string[] }) {
  const labels = ["Hook", "Highlight", "Promo", "CTA"];
  return (
    <div className="flex flex-col gap-2">
      {scenes.map((s, i) => (
        <motion.div
          key={labels[i]}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0, transition: { delay: i * 0.12 } }}
          className="flex gap-2 items-start"
        >
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
            style={{
              background: "oklch(0.62 0.22 270 / 0.20)",
              color: "oklch(0.82 0.14 270)",
              border: "1px solid oklch(0.62 0.22 270 / 0.35)",
            }}
          >
            {i + 1}
          </span>
          <div>
            <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wide">
              {labels[i]}
            </span>
            <p className="text-[10px] font-body text-muted-foreground leading-snug">
              {s.split("—")[1]?.trim() ?? s.slice(0, 80)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Props ─────────────────────────────────────── */

interface PromoVideoViewProps {
  onBack: () => void;
  isPro: boolean;
  onUpgrade: () => void;
  videoCount: number;
  onVideoGenerated: () => void;
}

/* ── Component ─────────────────────────────────── */

export function PromoVideoView({
  onBack,
  isPro,
  onUpgrade,
  videoCount,
  onVideoGenerated,
}: PromoVideoViewProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [platform, setPlatform] = useState<VideoPlatform>("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentScene, setCurrentScene] = useState(1);
  const [showSceneBreakdown, setShowSceneBreakdown] = useState(false);
  const [scenePrompts, setScenePrompts] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneIntervalRef = useRef<number | null>(null);

  const limitReached = !isPro && videoCount >= VIDEO_FREE_LIMIT;

  // Track current scene during playback
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      const video = videoRef.current;
      const onTimeUpdate = () => {
        setCurrentScene(getScene(video.currentTime));
      };
      video.addEventListener("timeupdate", onTimeUpdate);
      return () => video.removeEventListener("timeupdate", onTimeUpdate);
    }
  }, [videoUrl]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (sceneIntervalRef.current) clearInterval(sceneIntervalRef.current);
    };
  }, []);

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      toast.error("Por favor ingresa el nombre del negocio.");
      return;
    }
    if (limitReached) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setIsGenerating(true);
    setProgress(0);
    setCurrentScene(1);

    // Build and show AI scene prompts
    const prompts = buildVideoSceneBreakdown(
      businessName,
      businessType,
      promoMessage || "¡Visítanos y descubre nuestras ofertas especiales!",
    );
    setScenePrompts(prompts);
    setShowSceneBreakdown(true);

    // Brief display of scene breakdown (1.5s)
    await new Promise((r) => setTimeout(r, 1500));
    setShowSceneBreakdown(false);

    try {
      const blob = await generatePromoVideo(
        businessName,
        businessType,
        promoMessage || "¡Visítanos y descubre nuestras ofertas especiales!",
        platform,
        setProgress,
      );
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      onVideoGenerated();
      toast.success("¡Video generado!", { duration: 2000 });
    } catch (err) {
      console.error(err);
      toast.error(
        "Error generando el video. Tu navegador puede no soportar esta función.",
      );
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-${businessName.replace(/\s+/g, "-").toLowerCase()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("¡Video descargado!", { duration: 2000 });
  };

  const handleShare = async () => {
    if (!videoBlob) return;
    const file = new File(
      [videoBlob],
      `promo-${businessName.replace(/\s+/g, "-").toLowerCase()}.webm`,
      { type: "video/webm" },
    );
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${businessName} Promo Video`,
          text: promoMessage,
        });
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          toast.error("No se pudo compartir.");
        }
      }
    } else if (navigator.share) {
      await navigator.share({
        title: `${businessName} Promo Video`,
        text: promoMessage,
      });
    } else {
      handleDownload();
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsUpgrading(false);
    onUpgrade();
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button
          type="button"
          data-ocid="video.cancel_button"
          onClick={onBack}
          aria-label="Volver"
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
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
            Generate Promo Video
          </span>
        </div>
        {isPro ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 75 / 0.20), oklch(0.62 0.22 270 / 0.20))",
              color: "oklch(0.82 0.16 75)",
              border: "1px solid oklch(0.72 0.18 75 / 0.35)",
            }}
          >
            ⭐ Pro
          </span>
        ) : (
          <span className="text-xs text-muted-foreground font-body">
            {videoCount >= VIDEO_FREE_LIMIT ? "Trial used" : "1 free trial"}
          </span>
        )}
      </header>

      <main className="flex flex-col flex-1 px-5 pt-5 pb-10 gap-5">
        {/* Platform selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          className="flex flex-col gap-2"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
            Target Platform
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PLATFORM_CONFIG) as VideoPlatform[]).map((p) => (
              <button
                key={p}
                type="button"
                data-ocid={`video.platform_${p}_button`}
                onClick={() => setPlatform(p)}
                className="flex flex-col items-center justify-center gap-1 h-16 rounded-xl border transition-all duration-200"
                style={{
                  background:
                    platform === p
                      ? `${PLATFORM_CONFIG[p].color}20`
                      : "oklch(0.15 0.02 255 / 0.60)",
                  borderColor:
                    platform === p
                      ? `${PLATFORM_CONFIG[p].color}80`
                      : "oklch(0.30 0.03 255 / 0.50)",
                }}
              >
                <span className="text-xl">{PLATFORM_CONFIG[p].icon}</span>
                <span
                  className="text-[10px] font-semibold font-display"
                  style={{
                    color:
                      platform === p
                        ? PLATFORM_CONFIG[p].color
                        : "oklch(0.85 0.02 255)",
                  }}
                >
                  {PLATFORM_CONFIG[p].label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Format + duration badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={{
              background: "oklch(0.62 0.22 270 / 0.12)",
              color: "oklch(0.82 0.14 270)",
              border: "1px solid oklch(0.62 0.22 270 / 0.25)",
            }}
          >
            📐 Vertical 9:16 · 540×960
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={{
              background: "oklch(0.62 0.22 140 / 0.12)",
              color: "oklch(0.82 0.14 140)",
              border: "1px solid oklch(0.62 0.22 140 / 0.25)",
            }}
          >
            🎬 8 sec · 4 Scenes
          </span>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.08, duration: 0.35 },
          }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
              Video Content
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="video-biz-name"
                className="font-body text-sm font-medium text-foreground/90"
              >
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="video-biz-name"
                data-ocid="video.business_name_input"
                type="text"
                placeholder="e.g. Café El Rincón"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="video-biz-type"
                className="font-body text-sm font-medium text-foreground/90"
              >
                Business Type
              </Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger
                  id="video-biz-type"
                  data-ocid="video.business_type_select"
                  className="h-11 bg-secondary/60 border-border text-foreground focus:ring-primary rounded-xl"
                >
                  <SelectValue placeholder="Select business type (optional)" />
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
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="video-promo"
                className="font-body text-sm font-medium text-foreground/90"
              >
                Promotional Message
              </Label>
              <Textarea
                id="video-promo"
                data-ocid="video.promo_message_textarea"
                placeholder="e.g. 30% descuento este fin de semana. ¡Visítanos!"
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
                rows={3}
                className="bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl resize-none text-base"
              />
            </div>
          </div>
        </motion.div>

        {/* Scene breakdown / AI prompt preview */}
        <AnimatePresence>
          {showSceneBreakdown && scenePrompts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-xl px-4 py-3 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                  AI Scene Breakdown
                </span>
              </div>
              <SceneBreakdown scenes={scenePrompts} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upgrade gate */}
        <AnimatePresence>
          {limitReached && (
            <motion.div
              data-ocid="video.upgrade_card"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { type: "spring", stiffness: 280, damping: 24 },
              }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background:
                  "linear-gradient(145deg, oklch(0.14 0.04 280), oklch(0.16 0.06 260))",
                border: "1px solid oklch(0.62 0.22 270 / 0.40)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.62 0.22 270 / 0.12) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10 p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.18 75 / 0.25), oklch(0.62 0.22 270 / 0.25))",
                      border: "1px solid oklch(0.72 0.18 75 / 0.35)",
                    }}
                  >
                    <span className="text-xl">🎬</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-sm text-foreground leading-tight mb-1">
                      Premium Feature
                    </p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                      Video generation is a premium feature. Upgrade to
                      AdCreator AI Pro to create unlimited promotional videos
                      for your business.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    "Unlimited promo videos",
                    "4-scene story structure",
                    "Instagram, TikTok & Facebook Reels",
                    "Vertical 9:16 animated format",
                  ].map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]"
                        style={{
                          background: "oklch(0.62 0.22 270 / 0.20)",
                          border: "1px solid oklch(0.62 0.22 270 / 0.35)",
                          color: "oklch(0.82 0.14 270)",
                        }}
                      >
                        ✓
                      </div>
                      <span className="font-body text-xs text-foreground/80">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  data-ocid="video.upgrade_button"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  size="lg"
                  className="w-full h-12 font-semibold font-display text-sm rounded-xl gap-2"
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
                      Activating Pro…
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
          )}
        </AnimatePresence>

        {/* Generate button */}
        {!limitReached && (
          <div className="flex flex-col gap-2">
            <Button
              data-ocid="video.generate_button"
              onClick={handleGenerate}
              disabled={isGenerating || !businessName.trim()}
              size="lg"
              className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Video… {progress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Promo Video
                </>
              )}
            </Button>
            {isGenerating && (
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.62 0.22 270), oklch(0.72 0.18 220))",
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Video preview + actions */}
        <AnimatePresence>
          {videoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 260, damping: 22 },
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                  Your Promo Video
                </span>
                <span
                  className="text-[10px] font-medium rounded-full px-2 py-0.5"
                  style={{
                    background: "oklch(0.62 0.22 140 / 0.12)",
                    color: "oklch(0.82 0.14 140)",
                    border: "1px solid oklch(0.62 0.22 140 / 0.25)",
                  }}
                >
                  Ready to share
                </span>
              </div>

              {/* Video player */}
              <div
                className="rounded-2xl overflow-hidden border border-border/40 mx-auto"
                style={{ maxWidth: 280 }}
              >
                <video
                  ref={videoRef}
                  data-ocid="video.preview"
                  src={videoUrl}
                  controls
                  loop
                  playsInline
                  autoPlay
                  className="w-full h-auto"
                  style={{ aspectRatio: "9/16", background: "#000" }}
                >
                  <track kind="captions" />
                </video>
              </div>

              {/* Scene indicator dots UI */}
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4].map((s) => {
                  const sceneLabels = ["Hook", "Highlight", "Promo", "CTA"];
                  const isActive = currentScene === s;
                  return (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: isActive ? 10 : 7,
                          height: isActive ? 10 : 7,
                          background: isActive
                            ? PLATFORM_CONFIG[platform].color
                            : "oklch(0.35 0.03 255)",
                        }}
                      />
                      <span
                        className="text-[8px] font-body font-semibold uppercase tracking-wide"
                        style={{
                          color: isActive
                            ? PLATFORM_CONFIG[platform].color
                            : "oklch(0.45 0.03 255)",
                        }}
                      >
                        {sceneLabels[s - 1]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-ocid="video.download_button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 h-12 rounded-xl font-display text-sm font-semibold bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  type="button"
                  data-ocid="video.share_button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 h-12 rounded-xl font-display text-sm font-semibold bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>

              <p className="text-center text-[11px] text-muted-foreground font-body">
                Share directly to Instagram Reels, TikTok, or Facebook Reels
              </p>

              {/* Re-generate (Pro only) */}
              {isPro && (
                <button
                  type="button"
                  data-ocid="video.regenerate_button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-11 rounded-xl font-display text-sm font-semibold border border-border bg-secondary/60 hover:bg-secondary text-foreground transition-all disabled:opacity-40"
                >
                  🎲 Regenerate Video
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage note */}
        {!isPro && !limitReached && (
          <p className="text-center text-xs text-muted-foreground font-body">
            You have 1 free trial video. Upgrade to Pro for unlimited.
          </p>
        )}
        {isPro && (
          <p
            className="text-center text-xs font-body"
            style={{ color: "oklch(0.82 0.16 75)" }}
          >
            ✨ Pro — Unlimited promo videos
          </p>
        )}
      </main>
    </div>
  );
}
