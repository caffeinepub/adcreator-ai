import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useRef, useState } from "react";
import { toast } from "sonner";

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

/* ── Canvas video renderer ──────────────────────── */

function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  businessName: string,
  promoMessage: string,
  platform: VideoPlatform,
  t: number, // time in seconds
) {
  const cfg = PLATFORM_CONFIG[platform];

  // Dynamic background
  const hue = (t * 15) % 360;
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, `hsl(${220 + Math.sin(t * 0.3) * 20}, 60%, 8%)`);
  bg.addColorStop(0.5, `hsl(${240 + Math.sin(t * 0.2) * 15}, 55%, 12%)`);
  bg.addColorStop(1, `hsl(${260 + Math.sin(t * 0.25) * 10}, 50%, 7%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Animated particle dots
  for (let i = 0; i < 18; i++) {
    const px =
      ((Math.sin(i * 2.4 + t * 0.4) * 0.5 + 0.5) * width * 1.1) % width;
    const py =
      ((Math.cos(i * 1.7 + t * 0.3) * 0.5 + 0.5) * height * 1.1) % height;
    const r = 2 + Math.sin(i + t * 0.8) * 1.5;
    const alpha = 0.15 + Math.sin(i * 0.9 + t * 0.6) * 0.1;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,102,241,${alpha})`;
    ctx.fill();
  }

  // Radial glow pulse
  const pulseScale = 0.8 + Math.sin(t * 1.5) * 0.2;
  const glow = ctx.createRadialGradient(
    width / 2,
    height * 0.4,
    0,
    width / 2,
    height * 0.4,
    width * 0.7 * pulseScale,
  );
  glow.addColorStop(0, "rgba(99,102,241,0.18)");
  glow.addColorStop(0.5, "rgba(139,92,246,0.08)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Platform color accent top bar (animated width)
  const barAlpha = 0.7 + Math.sin(t * 2) * 0.3;
  ctx.fillStyle =
    cfg.color +
    Math.round(barAlpha * 255)
      .toString(16)
      .padStart(2, "0");
  ctx.fillRect(0, 0, width, 6);
  ctx.fillRect(0, height - 6, width, 6);

  // Platform badge top-right
  const badgeText = cfg.label;
  ctx.font = "bold 20px Arial, sans-serif";
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeX = width - badgeW - 16;
  const badgeY = 20;
  ctx.fillStyle = `${cfg.color}cc`;
  roundRect(ctx, badgeX, badgeY, badgeW, 32, 8);
  ctx.fillStyle = "white";
  ctx.font = "bold 17px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + 12, badgeY + 16);

  // Business name — animated slide-in from left
  const nameSlide = Math.min(1, t / 0.5);
  const nameX = -60 + nameSlide * (width / 2 + 60);
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 0.4);
  ctx.font = `bold ${Math.min(52, Math.floor(width * 0.09))}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(99,102,241,0.8)";
  ctx.shadowBlur = 18;
  ctx.fillText(
    (businessName || "Mi Negocio").toUpperCase(),
    nameX,
    height * 0.35,
  );
  ctx.shadowBlur = 0;
  ctx.restore();

  // Divider line — animated
  const divAlpha = Math.min(1, Math.max(0, (t - 0.3) / 0.4));
  const divProgress = Math.min(1, Math.max(0, (t - 0.3) / 0.5));
  ctx.save();
  ctx.globalAlpha = divAlpha;
  const divGrad = ctx.createLinearGradient(
    width * 0.1,
    height * 0.44,
    width * 0.9,
    height * 0.44,
  );
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.3, `${cfg.color}cc`);
  divGrad.addColorStop(0.7, `${cfg.color}cc`);
  divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.44);
  ctx.lineTo(width * 0.1 + width * 0.8 * divProgress, height * 0.44);
  ctx.stroke();
  ctx.restore();

  // Promo message — animated fade-in + word wrap
  const msgAlpha = Math.min(1, Math.max(0, (t - 0.6) / 0.5));
  ctx.save();
  ctx.globalAlpha = msgAlpha;
  const fontSize = Math.min(30, Math.floor(width * 0.055));
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(220,220,255,0.92)";

  const msg = promoMessage || "¡Oferta especial para ti!";
  const words = msg.split(" ");
  const maxW = width * 0.82;
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur + (cur ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  const lineH = fontSize * 1.5;
  const startY = height * 0.48;
  lines.slice(0, 5).forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineH);
  });
  ctx.restore();

  // Animated "sparkle" accent
  const sparkAlpha = 0.4 + Math.sin(t * 3 + hue) * 0.4;
  ctx.save();
  ctx.globalAlpha = sparkAlpha;
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("✨", width / 2, height * 0.72 + Math.sin(t * 2) * 6);
  ctx.restore();

  // Hashtags at bottom
  const hashAlpha = Math.min(1, Math.max(0, (t - 1.0) / 0.4));
  ctx.save();
  ctx.globalAlpha = hashAlpha;
  ctx.font = "18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = `${cfg.color}aa`;
  ctx.fillText(cfg.hashtags, width / 2, height * 0.82);
  ctx.restore();

  // Watermark
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.font = "14px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(
    "Created with AdCreator AI by Cristhian Paz",
    width / 2,
    height - 24,
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
  promoMessage: string,
  platform: VideoPlatform,
  onProgress: (p: number) => void,
): Promise<Blob> {
  const W = 540;
  const H = 960;
  const FPS = 30;
  const DURATION = 6; // seconds
  const TOTAL_FRAMES = FPS * DURATION;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Use MediaRecorder if available
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
      drawVideoFrame(ctx, W, H, businessName, promoMessage, platform, t);
      onProgress(Math.round((frame / TOTAL_FRAMES) * 100));
      frame++;
      requestAnimationFrame(renderNext);
    }
    renderNext();
  });
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
  const [promoMessage, setPromoMessage] = useState("");
  const [platform, setPlatform] = useState<VideoPlatform>("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const limitReached = !isPro && videoCount >= VIDEO_FREE_LIMIT;

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

    try {
      const blob = await generatePromoVideo(
        businessName,
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

        {/* Format badge */}
        <div className="flex items-center gap-2">
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
            🎬 6 sec · Animated
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
                    "Instagram, TikTok & Facebook Reels",
                    "Vertical 9:16 animated format",
                    "Download & share directly",
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
                  Regenerate Video
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
