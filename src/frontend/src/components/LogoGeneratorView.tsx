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

/* ── Types ─────────────────────────────────────── */

type LogoStyle = "modern" | "luxury" | "minimal" | "bold";

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

/* ── Canvas logo renderer ───────────────────────── */

function renderLogoToCanvas(
  canvas: HTMLCanvasElement,
  businessName: string,
  businessType: string,
  style: LogoStyle,
) {
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cfg = STYLE_CONFIG[style];

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, cfg.bg[0]);
  bg.addColorStop(1, cfg.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Ambient glow circles
  const glow = ctx.createRadialGradient(
    size * 0.7,
    size * 0.3,
    0,
    size * 0.7,
    size * 0.3,
    size * 0.5,
  );
  glow.addColorStop(0, `${cfg.accent}30`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const glow2 = ctx.createRadialGradient(
    size * 0.3,
    size * 0.7,
    0,
    size * 0.3,
    size * 0.7,
    size * 0.4,
  );
  glow2.addColorStop(0, `${cfg.accent}20`);
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, size, size);

  // Style-specific decorative elements
  if (style === "modern") {
    // Geometric ring
    ctx.strokeStyle = `${cfg.accent}40`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 320, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `${cfg.accent}20`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 360, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === "luxury") {
    // Corner ornaments
    const drawCornerLine = (x: number, y: number, fx: number, fy: number) => {
      ctx.strokeStyle = `${cfg.accent}60`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + fx * 80, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + fy * 80);
      ctx.stroke();
    };
    drawCornerLine(80, 80, 1, 1);
    drawCornerLine(size - 80, 80, -1, 1);
    drawCornerLine(80, size - 80, 1, -1);
    drawCornerLine(size - 80, size - 80, -1, -1);
  } else if (style === "bold") {
    // Bold accent bar at top
    const barGrad = ctx.createLinearGradient(0, 0, size, 0);
    barGrad.addColorStop(0, "transparent");
    barGrad.addColorStop(0.3, cfg.accent);
    barGrad.addColorStop(0.7, cfg.accent);
    barGrad.addColorStop(1, "transparent");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, size, 12);
    ctx.fillRect(0, size - 12, size, 12);
  } else if (style === "minimal") {
    // Subtle thin horizontal line through center
    const lineGrad = ctx.createLinearGradient(0, 0, size, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.2, `${cfg.accent}25`);
    lineGrad.addColorStop(0.8, `${cfg.accent}25`);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, size / 2 + 120);
    ctx.lineTo(size, size / 2 + 120);
    ctx.stroke();
  }

  // Icon circle / emblem
  const iconY = size / 2 - 160;
  const iconR = style === "minimal" ? 70 : 90;

  if (style !== "minimal") {
    const emblemGrad = ctx.createRadialGradient(
      size / 2,
      iconY,
      0,
      size / 2,
      iconY,
      iconR,
    );
    emblemGrad.addColorStop(0, `${cfg.accent}35`);
    emblemGrad.addColorStop(1, `${cfg.accent}10`);
    ctx.fillStyle = emblemGrad;
    ctx.beginPath();
    ctx.arc(size / 2, iconY, iconR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `${cfg.accent}60`;
    ctx.lineWidth = style === "bold" ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, iconY, iconR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Business emoji/icon
  const icon = BUSINESS_ICONS[businessType] ?? cfg.icon;
  ctx.font = `${iconR * 0.9}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, size / 2, iconY);

  // Business name — large centered
  const name = (businessName || "My Business").toUpperCase();
  const fontSize = Math.max(
    48,
    Math.min(96, Math.floor(800 / Math.max(name.length, 1))),
  );
  ctx.font = `${cfg.font} ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = cfg.accent;

  // Text shadow / glow
  ctx.shadowColor = cfg.accent;
  ctx.shadowBlur = style === "bold" ? 20 : style === "luxury" ? 12 : 8;
  ctx.fillText(name, size / 2, size / 2 + 30);
  ctx.shadowBlur = 0;

  // Style name tag below
  const styleLabel = STYLE_CONFIG[style].label.toUpperCase();
  ctx.font = "300 26px Arial, sans-serif";
  ctx.fillStyle = `${cfg.accent}80`;
  ctx.letterSpacing = "0.3em";
  ctx.fillText(`${styleLabel} DESIGN`, size / 2, size / 2 + 110);

  // Business type subtitle
  const bizLabel = BUSINESS_TYPE_LABELS[businessType] ?? businessType;
  ctx.font = "22px Arial, sans-serif";
  ctx.fillStyle = `${cfg.accent}55`;
  ctx.fillText(bizLabel.toUpperCase(), size / 2, size / 2 + 160);

  // Divider lines around name
  const divY = size / 2 + 78;
  const divGrad = ctx.createLinearGradient(140, divY, size - 140, divY);
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.3, `${cfg.accent}50`);
  divGrad.addColorStop(0.7, `${cfg.accent}50`);
  divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, divY);
  ctx.lineTo(size - 140, divY);
  ctx.stroke();

  // Watermark
  ctx.font = "18px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Created with AdCreator AI by Cristhian Paz",
    size / 2,
    size - 40,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const limitReached = !isPro && logoCount >= LOGO_FREE_LIMIT;

  // Sync preview canvas when style or inputs change
  useEffect(() => {
    if (!generated || !previewCanvasRef.current) return;
    renderLogoToCanvas(
      previewCanvasRef.current,
      businessName,
      businessType,
      logoStyle,
    );
  }, [generated, businessName, businessType, logoStyle]);

  const handleGenerate = async () => {
    if (!businessName.trim() || !businessType) {
      toast.error("Por favor completa el nombre y tipo de negocio.");
      return;
    }
    if (limitReached) return;

    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (canvasRef.current) {
      renderLogoToCanvas(
        canvasRef.current,
        businessName,
        businessType,
        logoStyle,
      );
    }
    if (previewCanvasRef.current) {
      renderLogoToCanvas(
        previewCanvasRef.current,
        businessName,
        businessType,
        logoStyle,
      );
    }

    setGenerated(true);
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
        {/* Style selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          className="flex flex-col gap-2"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
            Preferred Style
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STYLE_CONFIG) as LogoStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                data-ocid={`logo.style_${s}_button`}
                onClick={() => setLogoStyle(s)}
                className="flex flex-col gap-1 p-3 rounded-xl border transition-all duration-200 text-left"
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
                <span className="text-lg">{STYLE_CONFIG[s].icon}</span>
                <span
                  className="text-xs font-bold font-display"
                  style={{
                    color:
                      logoStyle === s
                        ? STYLE_CONFIG[s].accent
                        : "oklch(0.85 0.02 255)",
                  }}
                >
                  {STYLE_CONFIG[s].label}
                </span>
                <span className="text-[10px] text-muted-foreground font-body">
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
                Regenerate
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
