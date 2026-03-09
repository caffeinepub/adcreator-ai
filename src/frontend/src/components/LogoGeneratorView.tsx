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
import { buildLogoPrompt } from "../utils/aiPrompts";

/* ── Types ─────────────────────────────────────── */

type LogoStyle = "modern" | "luxury" | "minimal" | "bold" | "tech" | "vintage";

const LOGO_FREE_LIMIT = 3;

const STYLE_CONFIG: Record<
  LogoStyle,
  {
    label: string;
    bg: string[];
    accent: string;
    font: string;
    desc: string;
    icon: string;
  }
> = {
  modern: {
    label: "Modern",
    bg: ["#0a0a1a", "#1a1a3e"],
    accent: "#6366f1",
    font: "bold",
    desc: "Clean gradients, geometric shapes",
    icon: "◈",
  },
  luxury: {
    label: "Luxury",
    bg: ["#0d0a00", "#1a1200"],
    accent: "#d4a017",
    font: "bold",
    desc: "Gold tones, elegant serif style",
    icon: "✦",
  },
  minimal: {
    label: "Minimal",
    bg: ["#0f0f0f", "#1c1c1c"],
    accent: "#e2e8f0",
    font: "normal",
    desc: "Simple, clean, lots of whitespace",
    icon: "○",
  },
  bold: {
    label: "Bold",
    bg: ["#1a0000", "#300010"],
    accent: "#ef4444",
    font: "bold",
    desc: "Strong contrast, impactful design",
    icon: "▶",
  },
  tech: {
    label: "Tech",
    bg: ["#020d1a", "#041a2e"],
    accent: "#00d4ff",
    font: "bold",
    desc: "Circuit board, electric neon, futuristic",
    icon: "⬡",
  },
  vintage: {
    label: "Vintage",
    bg: ["#12100a", "#1e1a0e"],
    accent: "#c9a84c",
    font: "bold",
    desc: "Retro badge, warm amber, ornate borders",
    icon: "❋",
  },
};

const BUSINESS_ICONS: Record<string, string> = {
  gym: "🏋️",
  retail: "🛍️",
  cafe: "☕",
  salon: "✂️",
  restaurant: "🍽️",
  barberShop: "💈",
  clothingStore: "👗",
  carDealer: "🚗",
  pharmacy: "💊",
  electronicsStore: "📱",
  bakery: "🥐",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  gym: "Gimnasio",
  retail: "Tienda",
  cafe: "Cafetería",
  salon: "Salón de Belleza",
  restaurant: "Restaurante",
  barberShop: "Barbería",
  clothingStore: "Tienda de Ropa",
  carDealer: "Concesionaria",
  pharmacy: "Farmacia",
  electronicsStore: "Tienda de Electrónica",
  bakery: "Panadería",
};

/* ── Seeded deterministic random ───────────────── */

function seededRand(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297 + 233) * 1e9;
  return x - Math.floor(x);
}

/* ── Geometric shape helpers ───────────────────── */

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.7, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.7, cy);
  ctx.closePath();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.87, cy + r * 0.5);
  ctx.lineTo(cx - r * 0.87, cy + r * 0.5);
  ctx.closePath();
}

function drawRoundedSquare(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const x = cx - r;
  const y = cy - r;
  const size = r * 2;
  const rad = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + size - rad, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + rad);
  ctx.lineTo(x + size, y + size - rad);
  ctx.quadraticCurveTo(x + size, y + size, x + size - rad, y + size);
  ctx.lineTo(x + rad, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

type ShapeDrawer = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) => void;

function getShape(idx: number): ShapeDrawer {
  const shapes: ShapeDrawer[] = [
    (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
    },
    drawHexagon,
    drawDiamond,
    drawTriangle,
    drawRoundedSquare,
    (ctx, cx, cy, r) => {
      ctx.beginPath();
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      ctx.closePath();
    },
  ];
  return shapes[idx % shapes.length];
}

/* ── Canvas logo renderer ───────────────────────── */

function renderLogoToCanvas(
  canvas: HTMLCanvasElement,
  businessName: string,
  businessType: string,
  style: LogoStyle,
  seed: number,
) {
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cfg = STYLE_CONFIG[style];

  // Seeded layout variant (0–3)
  const layoutType = Math.floor(seededRand(seed, 0) * 4);
  // Shape type (0–5)
  const shapeIdx = Math.floor(seededRand(seed, 1) * 6);
  // Whether to swap accent/primary positions
  const swapColors = seededRand(seed, 2) > 0.5;
  // Gradient direction
  const gradAngle = seededRand(seed, 3) * 360;

  const drawShape = getShape(shapeIdx);

  // ── Background ──────────────────────────────────
  const gx = size * Math.cos((gradAngle * Math.PI) / 180);
  const gy = size * Math.sin((gradAngle * Math.PI) / 180);
  const bg = ctx.createLinearGradient(0, 0, gx, gy);
  bg.addColorStop(0, cfg.bg[0]);
  bg.addColorStop(1, cfg.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Ambient glow
  const glowX = size * (0.3 + seededRand(seed, 4) * 0.4);
  const glowY = size * (0.2 + seededRand(seed, 5) * 0.3);
  const glow = ctx.createRadialGradient(
    glowX,
    glowY,
    0,
    glowX,
    glowY,
    size * 0.5,
  );
  glow.addColorStop(0, `${cfg.accent}28`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // ── Style-specific background decorations ───────
  if (style === "modern") {
    // Geometric ring
    ctx.strokeStyle = `${cfg.accent}35`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 340, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `${cfg.accent}15`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 380, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === "luxury") {
    // Ornamental corner lines
    const drawCorner = (x: number, y: number, fx: number, fy: number) => {
      ctx.strokeStyle = `${cfg.accent}55`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + fx * 90, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + fy * 90);
      ctx.stroke();
    };
    drawCorner(60, 60, 1, 1);
    drawCorner(size - 60, 60, -1, 1);
    drawCorner(60, size - 60, 1, -1);
    drawCorner(size - 60, size - 60, -1, -1);
    // Inner diamond decorative
    ctx.strokeStyle = `${cfg.accent}20`;
    ctx.lineWidth = 1;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-300, -300, 600, 600);
    ctx.restore();
  } else if (style === "bold") {
    // Bold color band top and bottom
    const bandGrad = ctx.createLinearGradient(0, 0, size, 0);
    bandGrad.addColorStop(0, "transparent");
    bandGrad.addColorStop(0.25, cfg.accent);
    bandGrad.addColorStop(0.75, cfg.accent);
    bandGrad.addColorStop(1, "transparent");
    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, 0, size, 14);
    ctx.fillRect(0, size - 14, size, 14);
  } else if (style === "minimal") {
    // Single thin horizontal accent
    const lineGrad = ctx.createLinearGradient(0, 0, size, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.15, `${cfg.accent}20`);
    lineGrad.addColorStop(0.85, `${cfg.accent}20`);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, size / 2 + 130);
    ctx.lineTo(size, size / 2 + 130);
    ctx.stroke();
  } else if (style === "tech") {
    // Circuit board grid pattern
    ctx.strokeStyle = `${cfg.accent}12`;
    ctx.lineWidth = 1;
    for (let gx2 = 0; gx2 < size; gx2 += 80) {
      ctx.beginPath();
      ctx.moveTo(gx2, 0);
      ctx.lineTo(gx2, size);
      ctx.stroke();
    }
    for (let gy2 = 0; gy2 < size; gy2 += 80) {
      ctx.beginPath();
      ctx.moveTo(0, gy2);
      ctx.lineTo(size, gy2);
      ctx.stroke();
    }
    // Circuit dots at intersections (random subset)
    ctx.fillStyle = `${cfg.accent}30`;
    for (let xi = 0; xi <= size; xi += 80) {
      for (let yi = 0; yi <= size; yi += 80) {
        if (seededRand(seed + xi + yi, 10) > 0.6) {
          ctx.beginPath();
          ctx.arc(xi, yi, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // Corner brackets
    ctx.strokeStyle = `${cfg.accent}45`;
    ctx.lineWidth = 3;
    for (const [bx, by] of [
      [80, 80],
      [size - 80, 80],
      [80, size - 80],
      [size - 80, size - 80],
    ]) {
      const fx = bx < size / 2 ? 1 : -1;
      const fy = by < size / 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(bx, by + fy * 40);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + fx * 40, by);
      ctx.stroke();
    }
  } else if (style === "vintage") {
    // Ornamental outer border
    const pad = 40;
    ctx.strokeStyle = `${cfg.accent}50`;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, size - pad * 2, size - pad * 2);
    ctx.strokeStyle = `${cfg.accent}25`;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      pad + 12,
      pad + 12,
      size - (pad + 12) * 2,
      size - (pad + 12) * 2,
    );
    // Diamond corner ornaments
    for (const [ox, oy] of [
      [pad + 6, pad + 6],
      [size - pad - 6, pad + 6],
      [pad + 6, size - pad - 6],
      [size - pad - 6, size - pad - 6],
    ]) {
      ctx.save();
      ctx.strokeStyle = `${cfg.accent}60`;
      ctx.lineWidth = 1.5;
      ctx.translate(ox, oy);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();
    }
  }

  // ── Layout variants ──────────────────────────────
  const name = (businessName || "My Business").toUpperCase();
  const bizLabel = BUSINESS_TYPE_LABELS[businessType] ?? businessType;
  const icon = BUSINESS_ICONS[businessType] ?? cfg.icon;
  const lettermark = name.slice(0, Math.min(2, name.length));
  const primaryColor = swapColors ? `${cfg.accent}` : `${cfg.accent}`;
  const textColor = cfg.accent;

  if (layoutType === 0) {
    // ── Layout 0: Emblem — centered shape + icon, name below ──
    const shapeY = size * 0.35;
    const shapeR = 110;

    const emblemFill = ctx.createRadialGradient(
      size / 2,
      shapeY,
      0,
      size / 2,
      shapeY,
      shapeR,
    );
    emblemFill.addColorStop(0, `${cfg.accent}30`);
    emblemFill.addColorStop(1, `${cfg.accent}08`);
    ctx.fillStyle = emblemFill;
    drawShape(ctx, size / 2, shapeY, shapeR);
    ctx.fill();
    ctx.strokeStyle = `${cfg.accent}70`;
    ctx.lineWidth = 2.5;
    drawShape(ctx, size / 2, shapeY, shapeR);
    ctx.stroke();

    // Lettermark inside shape
    const lmSize = shapeR * 1.0;
    ctx.font = `bold ${lmSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = 16;
    ctx.fillText(lettermark, size / 2, shapeY + 6);
    ctx.shadowBlur = 0;

    // Business name below
    const nameFontSize = Math.max(
      52,
      Math.min(100, Math.floor(840 / Math.max(name.length, 1))),
    );
    ctx.font = `${cfg.font} ${nameFontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = style === "bold" ? 22 : style === "tech" ? 14 : 8;
    ctx.fillText(name, size / 2, size * 0.62);
    ctx.shadowBlur = 0;

    // Divider line
    const divY = size * 0.71;
    const dg = ctx.createLinearGradient(120, divY, size - 120, divY);
    dg.addColorStop(0, "transparent");
    dg.addColorStop(0.3, `${cfg.accent}55`);
    dg.addColorStop(0.7, `${cfg.accent}55`);
    dg.addColorStop(1, "transparent");
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, divY);
    ctx.lineTo(size - 120, divY);
    ctx.stroke();

    // Biz type label
    ctx.font = "300 28px Arial, sans-serif";
    ctx.fillStyle = `${cfg.accent}70`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bizLabel.toUpperCase(), size / 2, size * 0.77);
  } else if (layoutType === 1) {
    // ── Layout 1: Lettermark — big monogram left, name+type stacked right ──
    const monomX = size * 0.28;
    const monomY = size * 0.5;
    const monomR = 140;

    // Background shape for monogram
    const mFill = ctx.createRadialGradient(
      monomX,
      monomY,
      0,
      monomX,
      monomY,
      monomR,
    );
    mFill.addColorStop(0, `${cfg.accent}25`);
    mFill.addColorStop(1, `${cfg.accent}05`);
    ctx.fillStyle = mFill;
    drawShape(ctx, monomX, monomY, monomR);
    ctx.fill();
    ctx.strokeStyle = `${cfg.accent}65`;
    ctx.lineWidth = 3;
    drawShape(ctx, monomX, monomY, monomR);
    ctx.stroke();

    // Monogram text
    ctx.font = `bold ${monomR * 1.05}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = 20;
    ctx.fillText(lettermark, monomX, monomY + 6);
    ctx.shadowBlur = 0;

    // Right side: name
    const rightX = size * 0.62;
    const maxNameWidth = size - rightX - 60;
    let nfs = 72;
    ctx.font = `${cfg.font} ${nfs}px Arial, sans-serif`;
    while (ctx.measureText(name).width > maxNameWidth && nfs > 30) {
      nfs -= 4;
      ctx.font = `${cfg.font} ${nfs}px Arial, sans-serif`;
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = 10;
    ctx.fillText(name, rightX, size * 0.46);
    ctx.shadowBlur = 0;

    // Divider
    const smallDivY = size * 0.54;
    ctx.strokeStyle = `${cfg.accent}45`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rightX, smallDivY);
    ctx.lineTo(size - 60, smallDivY);
    ctx.stroke();

    // Biz type
    ctx.font = "26px Arial, sans-serif";
    ctx.fillStyle = `${cfg.accent}65`;
    ctx.fillText(bizLabel.toUpperCase(), rightX, size * 0.59);
  } else if (layoutType === 2) {
    // ── Layout 2: Icon+Stack — small icon top-left, large name, divider, type ──
    const iconX = size * 0.15;
    const iconY = size * 0.22;
    const iconR = 55;

    const iF = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconR);
    iF.addColorStop(0, `${cfg.accent}30`);
    iF.addColorStop(1, `${cfg.accent}08`);
    ctx.fillStyle = iF;
    drawShape(ctx, iconX, iconY, iconR);
    ctx.fill();
    ctx.strokeStyle = `${cfg.accent}60`;
    ctx.lineWidth = 2;
    drawShape(ctx, iconX, iconY, iconR);
    ctx.stroke();

    ctx.font = `${iconR * 0.95}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, iconX, iconY + 3);

    // Large left-aligned name
    const leftX = size * 0.1;
    const nameFontSize2 = Math.max(
      50,
      Math.min(110, Math.floor(800 / Math.max(name.length, 1))),
    );
    ctx.font = `${cfg.font} ${nameFontSize2}px Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = style === "bold" ? 20 : 10;

    // Word wrap
    const words = name.split(" ");
    const maxW = size - leftX * 2;
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur + (cur ? " " : "") + w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);

    const lineH = nameFontSize2 * 1.15;
    let nameStartY = size * 0.46 - (lines.length - 1) * lineH * 0.5;
    for (const ln of lines) {
      ctx.fillText(ln, leftX, nameStartY);
      nameStartY += lineH;
    }
    ctx.shadowBlur = 0;

    // Horizontal rule
    const hrY = nameStartY + 20;
    const hrG = ctx.createLinearGradient(leftX, hrY, size * 0.85, hrY);
    hrG.addColorStop(0, `${cfg.accent}60`);
    hrG.addColorStop(1, "transparent");
    ctx.strokeStyle = hrG;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, hrY);
    ctx.lineTo(size * 0.85, hrY);
    ctx.stroke();

    // Type label
    ctx.font = "28px Arial, sans-serif";
    ctx.fillStyle = `${cfg.accent}65`;
    ctx.textAlign = "left";
    ctx.fillText(bizLabel.toUpperCase(), leftX, hrY + 48);
  } else {
    // ── Layout 3: Full-width wordmark ──
    // Ultra-large auto-fitting name
    let wfs = 150;
    const maxW2 = size * 0.88;
    ctx.font = `${cfg.font} ${wfs}px Arial, sans-serif`;
    while (ctx.measureText(name).width > maxW2 && wfs > 40) {
      wfs -= 4;
      ctx.font = `${cfg.font} ${wfs}px Arial, sans-serif`;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = style === "luxury" ? 16 : 12;
    ctx.fillText(name, size / 2, size * 0.46);
    ctx.shadowBlur = 0;

    // Accent line below
    const accentLineY = size * 0.57;
    const alG = ctx.createLinearGradient(
      100,
      accentLineY,
      size - 100,
      accentLineY,
    );
    alG.addColorStop(0, "transparent");
    alG.addColorStop(0.2, `${cfg.accent}80`);
    alG.addColorStop(0.8, `${cfg.accent}80`);
    alG.addColorStop(1, "transparent");
    ctx.strokeStyle = alG;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, accentLineY);
    ctx.lineTo(size - 100, accentLineY);
    ctx.stroke();

    // Type label
    ctx.font = "300 30px Arial, sans-serif";
    ctx.fillStyle = `${cfg.accent}70`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bizLabel.toUpperCase(), size / 2, accentLineY + 60);

    // Small decorative dots flanking the type label
    const dotY = accentLineY + 60;
    const dotX1 = size / 2 - 160;
    const dotX2 = size / 2 + 160;
    ctx.fillStyle = `${cfg.accent}50`;
    for (const [dx, dy] of [
      [dotX1, dotY],
      [dotX2, dotY],
    ]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Style tag (common to all layouts) ───────────
  const styleTag = `${STYLE_CONFIG[style].label} Design`.toUpperCase();
  ctx.font = "22px Arial, sans-serif";
  ctx.fillStyle = `${cfg.accent}40`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(styleTag, size / 2, size * 0.88);

  // ── Watermark ────────────────────────────────────
  ctx.font = "18px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Created with AdCreator AI by Cristhian Paz",
    size / 2,
    size - 36,
  );
}

/* ── AI Prompt Steps Animation ─────────────────── */

const AI_STEPS = [
  "🤖 Analyzing business profile…",
  "🎨 Designing logo composition…",
  "✨ Applying style elements…",
  "🖌️ Rendering final logo…",
];

function AiStepsAnimation({ prompt }: { prompt: string }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < AI_STEPS.length) {
        setStep(i);
      } else {
        clearInterval(interval);
        setDone(true);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 py-1">
      {AI_STEPS.map((s, idx) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, x: -8 }}
          animate={
            idx <= step ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -4 }
          }
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-xs font-body"
          style={{
            color:
              idx <= step ? "oklch(0.85 0.06 260)" : "oklch(0.50 0.04 260)",
          }}
        >
          {idx < step ? (
            <span className="text-emerald-400">✓</span>
          ) : idx === step ? (
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          ) : (
            <span className="opacity-30">○</span>
          )}
          {s}
        </motion.div>
      ))}
      {done && prompt && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.35 }}
          className="mt-1 px-3 py-2 rounded-xl text-[10px] font-body leading-relaxed overflow-hidden"
          style={{
            background: "oklch(0.62 0.22 270 / 0.07)",
            border: "1px solid oklch(0.62 0.22 270 / 0.18)",
            color: "oklch(0.72 0.06 260)",
          }}
        >
          <span className="font-semibold text-primary/80">AI Prompt:</span>{" "}
          {prompt}
        </motion.div>
      )}
    </div>
  );
}

/* ── Props ─────────────────────────────────────── */

interface LogoGeneratorViewProps {
  onBack: () => void;
  isPro: boolean;
  onUpgrade: () => void;
  logoCount: number;
  onLogoGenerated: () => void;
}

/* ── Component ─────────────────────────────────── */

export function LogoGeneratorView({
  onBack,
  isPro,
  onUpgrade,
  logoCount,
  onLogoGenerated,
}: LogoGeneratorViewProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [logoStyle, setLogoStyle] = useState<LogoStyle>("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [logoSeed, setLogoSeed] = useState(0);
  const [aiPromptText, setAiPromptText] = useState("");
  const [showAiSteps, setShowAiSteps] = useState(false);
  const [showPromptChip, setShowPromptChip] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const limitReached = !isPro && logoCount >= LOGO_FREE_LIMIT;

  // Sync preview canvas when style, inputs, or seed changes
  useEffect(() => {
    if (!generated || !previewCanvasRef.current) return;
    renderLogoToCanvas(
      previewCanvasRef.current,
      businessName,
      businessType,
      logoStyle,
      logoSeed,
    );
  }, [generated, businessName, businessType, logoStyle, logoSeed]);

  const handleGenerate = async () => {
    if (!businessName.trim() || !businessType) {
      toast.error("Por favor completa el nombre y tipo de negocio.");
      return;
    }
    if (limitReached) return;

    const newSeed = Math.floor(Math.random() * 1000);
    setLogoSeed(newSeed);

    const prompt = buildLogoPrompt(businessName, businessType, logoStyle);
    setAiPromptText(prompt);
    setShowAiSteps(true);
    setShowPromptChip(false);
    setIsGenerating(true);

    // Show AI steps animation for 1.2s
    await new Promise((r) => setTimeout(r, 1300));

    if (canvasRef.current) {
      renderLogoToCanvas(
        canvasRef.current,
        businessName,
        businessType,
        logoStyle,
        newSeed,
      );
    }
    if (previewCanvasRef.current) {
      renderLogoToCanvas(
        previewCanvasRef.current,
        businessName,
        businessType,
        logoStyle,
        newSeed,
      );
    }

    setGenerated(true);
    setShowAiSteps(false);
    setShowPromptChip(true);
    setIsGenerating(false);
    onLogoGenerated();
    toast.success("¡Logo generado!", { duration: 2000 });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `logo-${businessName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("¡Logo descargado!", { duration: 2000 });
  };

  const handleSaveToPhotos = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const ua = navigator.userAgent;
      const isIOS =
        /iP(ad|hone|od)/i.test(ua) &&
        /WebKit/i.test(ua) &&
        !/CriOS|FxiOS|OPiOS/i.test(ua);
      if (isIOS) {
        window.open(url, "_blank");
        toast.info(
          'Mantén presionada la imagen y selecciona "Añadir a Fotos"',
          {
            duration: 5000,
          },
        );
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `logo-${businessName.replace(/\s+/g, "-").toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("¡Logo guardado!", { duration: 2000 });
      }
    }, "image/png");
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File(
        [blob],
        `logo-${businessName.replace(/\s+/g, "-").toLowerCase()}.png`,
        { type: "image/png" },
      );
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${businessName} Logo`,
            text: `Logo de ${businessName} creado con AdCreator AI`,
          });
        } catch (e) {
          if (e instanceof Error && e.name !== "AbortError") {
            toast.error("No se pudo compartir.");
          }
        }
      } else if (navigator.share) {
        await navigator.share({
          title: `${businessName} Logo`,
          text: `Logo de ${businessName} creado con AdCreator AI`,
        });
      } else {
        toast.info("Usa el botón de descarga para guardar el logo.");
      }
    }, "image/png");
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsUpgrading(false);
    onUpgrade();
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Hidden full-res canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button
          type="button"
          data-ocid="logo.cancel_button"
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
            Generate Logo with AI
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
            {logoCount}/{LOGO_FREE_LIMIT} today
          </span>
        )}
      </header>

      <main className="flex flex-col flex-1 px-5 pt-5 pb-10 gap-5">
        {/* Style selector — 3x2 grid for 6 styles */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          className="flex flex-col gap-2"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
            Logo Style
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(STYLE_CONFIG) as LogoStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                data-ocid={`logo.style_${s}_button`}
                onClick={() => setLogoStyle(s)}
                className="flex flex-col gap-1 p-2.5 rounded-xl border transition-all duration-200 text-left"
                style={{
                  background:
                    logoStyle === s
                      ? `${STYLE_CONFIG[s].accent}15`
                      : "oklch(0.15 0.02 255 / 0.60)",
                  borderColor:
                    logoStyle === s
                      ? `${STYLE_CONFIG[s].accent}60`
                      : "oklch(0.30 0.03 255 / 0.50)",
                }}
              >
                <span className="text-base">{STYLE_CONFIG[s].icon}</span>
                <span
                  className="text-[11px] font-bold font-display"
                  style={{
                    color:
                      logoStyle === s
                        ? STYLE_CONFIG[s].accent
                        : "oklch(0.85 0.02 255)",
                  }}
                >
                  {STYLE_CONFIG[s].label}
                </span>
                <span className="text-[9px] text-muted-foreground font-body leading-snug">
                  {STYLE_CONFIG[s].desc}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

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
              Business Info
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="logo-biz-name"
                className="font-body text-sm font-medium text-foreground/90"
              >
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="logo-biz-name"
                data-ocid="logo.business_name_input"
                type="text"
                placeholder="e.g. Barbería Don Juan"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="logo-biz-type"
                className="font-body text-sm font-medium text-foreground/90"
              >
                Business Type <span className="text-destructive">*</span>
              </Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger
                  id="logo-biz-type"
                  data-ocid="logo.business_type_select"
                  className="h-11 bg-secondary/60 border-border text-foreground focus:ring-primary rounded-xl"
                >
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {Object.entries(BUSINESS_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg"
                      >
                        {BUSINESS_ICONS[value]} {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* AI Steps animation */}
        <AnimatePresence>
          {showAiSteps && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-xl px-4 py-3"
            >
              <AiStepsAnimation prompt={aiPromptText} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Limit / Upgrade gate */}
        <AnimatePresence>
          {limitReached && (
            <motion.div
              data-ocid="logo.upgrade_card"
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
                    <span className="text-xl">⭐</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-sm text-foreground leading-tight mb-1">
                      Daily Limit Reached
                    </p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                      You've reached the free daily limit of 3 logos. Upgrade to
                      AdCreator AI Pro for unlimited logo generation.
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid="logo.upgrade_button"
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
          <Button
            data-ocid="logo.generate_button"
            onClick={handleGenerate}
            disabled={isGenerating || !businessName.trim() || !businessType}
            size="lg"
            className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2 disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Logo…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Logo
              </>
            )}
          </Button>
        )}

        {/* Preview + actions */}
        <AnimatePresence>
          {generated && (
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
                  Your Logo Preview
                </span>
                <span
                  className="text-[10px] font-medium rounded-full px-2 py-0.5"
                  style={{
                    background: "oklch(0.62 0.22 240 / 0.12)",
                    color: "oklch(0.82 0.14 235)",
                    border: "1px solid oklch(0.62 0.22 240 / 0.25)",
                  }}
                >
                  1080 × 1080
                </span>
              </div>

              {/* AI prompt chip below preview label */}
              {showPromptChip && aiPromptText && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-2 rounded-xl text-[10px] font-body leading-relaxed"
                  style={{
                    background: "oklch(0.62 0.22 270 / 0.07)",
                    border: "1px solid oklch(0.62 0.22 270 / 0.18)",
                    color: "oklch(0.72 0.06 260)",
                  }}
                >
                  <span className="font-semibold text-primary/80">
                    ✨ AI Prompt:
                  </span>{" "}
                  {aiPromptText}
                </motion.div>
              )}

              {/* Preview canvas */}
              <div className="rounded-2xl overflow-hidden border border-border/40 shadow-xl">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-auto"
                  style={{ aspectRatio: "1/1" }}
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  data-ocid="logo.save_to_photos_button"
                  onClick={handleSaveToPhotos}
                  className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl font-display text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
                >
                  📸<span>Guardar</span>
                </button>
                <button
                  type="button"
                  data-ocid="logo.download_button"
                  onClick={handleDownload}
                  className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl font-display text-xs font-semibold bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
                </button>
                <button
                  type="button"
                  data-ocid="logo.share_button"
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl font-display text-xs font-semibold bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </button>
              </div>

              {/* Re-generate */}
              <button
                type="button"
                data-ocid="logo.regenerate_button"
                onClick={handleGenerate}
                disabled={isGenerating || limitReached}
                className="w-full h-11 rounded-xl font-display text-sm font-semibold border border-border bg-secondary/60 hover:bg-secondary text-foreground transition-all disabled:opacity-40"
              >
                🎲 Regenerate (New Layout)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Free usage note */}
        {!isPro && !limitReached && (
          <p className="text-center text-xs text-muted-foreground font-body">
            {logoCount}/{LOGO_FREE_LIMIT} free logos generated today
          </p>
        )}
        {isPro && (
          <p
            className="text-center text-xs font-body"
            style={{ color: "oklch(0.82 0.16 75)" }}
          >
            ✨ Pro — Unlimited logo generation
          </p>
        )}
      </main>
    </div>
  );
}
