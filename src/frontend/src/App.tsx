import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import {
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  Copy,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BusinessType } from "./backend.d";

type View = "home" | "form" | "result";

interface FormData {
  businessType: BusinessType | "";
  city: string;
  promotion: string;
  discount: string;
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.gym]: "🏋️ Gym & Fitness",
  [BusinessType.retail]: "🛍️ Retail Store",
  [BusinessType.cafe]: "☕ Café",
  [BusinessType.salon]: "💇 Salon & Spa",
  [BusinessType.restaurant]: "🍽️ Restaurant",
};

const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: { duration: 0.22, ease: "easeIn" as const },
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

export default function App() {
  const [view, setView] = useState<View>("home");
  const [formData, setFormData] = useState<FormData>({
    businessType: "",
    city: "",
    promotion: "",
    discount: "",
  });
  const [generatedAd, setGeneratedAd] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { actor } = useActor();

  const handleGenerateAd = async () => {
    if (
      !formData.businessType ||
      !formData.city.trim() ||
      !formData.promotion.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!actor) {
      setError("Connection unavailable. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const discountValue =
        formData.discount.trim() !== ""
          ? BigInt(Math.round(Number(formData.discount)))
          : null;

      const result = await actor.generateAd(
        formData.businessType as BusinessType,
        formData.city.trim(),
        formData.promotion.trim(),
        discountValue,
      );

      setGeneratedAd(result);
      setView("result");
    } catch (err) {
      console.error(err);
      setError("Failed to generate ad. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedAd);
      setCopied(true);
      toast.success("Copied to clipboard!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please try manually.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my ad!",
          text: generatedAd,
        });
      } catch {
        // User cancelled share — silently ignore
      }
    } else {
      await handleCopy();
    }
  };

  const handleCreateAnother = () => {
    setFormData({ businessType: "", city: "", promotion: "", discount: "" });
    setGeneratedAd("");
    setError("");
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

      <div className="w-full max-w-[480px] min-h-dvh flex flex-col relative overflow-hidden">
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
                onSubmit={handleGenerateAd}
              />
            </motion.div>
          )}

          {view === "result" && (
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
                copied={copied}
                onCopy={handleCopy}
                onShare={handleShare}
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
    <main className="flex flex-col flex-1 px-6 pt-16 pb-10">
      {/* Top badge */}
      <motion.div
        variants={staggerItem}
        initial="initial"
        animate="animate"
        className="flex justify-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-primary/15 text-primary border border-primary/30">
          <Zap className="w-3 h-3" />
          AI-Powered
        </span>
      </motion.div>

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: { duration: 0.5, delay: 0.05 },
        }}
        className="rounded-2xl overflow-hidden mb-8 border border-primary/20 glow-primary"
      >
        <img
          src="/assets/generated/hero-adcreator.dim_480x320.png"
          alt="AdCreator AI"
          className="w-full object-cover"
          loading="eager"
        />
      </motion.div>

      {/* Title & tagline */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="text-center mb-10"
      >
        <motion.h1
          variants={staggerItem}
          className="font-display text-4xl font-bold tracking-tight mb-3 leading-tight"
        >
          <span className="text-gradient">AdCreator</span>{" "}
          <span className="text-foreground">AI</span>
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="font-body text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto"
        >
          Create stunning social media ads in seconds
        </motion.p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex justify-center gap-2 flex-wrap mb-10"
      >
        {["✨ Emojis", "#️⃣ Hashtags", "📱 Social-Ready"].map((feat) => (
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
          Create Ad
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
        className="text-center mt-8"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
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

  return (
    <main className="flex flex-col flex-1 px-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          data-ocid="form.cancel_button"
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Create Your Ad
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fill in the details below
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        {/* Business Type */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="business-type"
            className="font-body text-sm font-medium text-foreground/90"
          >
            Business Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.businessType}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                businessType: val as BusinessType,
              }))
            }
          >
            <SelectTrigger
              id="business-type"
              data-ocid="form.select"
              className="h-12 bg-secondary border-border text-foreground focus:ring-primary rounded-xl"
            >
              <SelectValue placeholder="Select your business type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border rounded-xl">
              {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="city"
            className="font-body text-sm font-medium text-foreground/90"
          >
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            data-ocid="form.input"
            type="text"
            placeholder="e.g. Miami, New York, Austin"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
            autoComplete="address-level2"
          />
        </div>

        {/* Promotion */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="promotion"
            className="font-body text-sm font-medium text-foreground/90"
          >
            What are you promoting? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="promotion"
            data-ocid="form.textarea"
            placeholder="e.g. Summer sale on all sneakers, Free consultation this weekend..."
            value={formData.promotion}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, promotion: e.target.value }))
            }
            rows={3}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl resize-none text-base"
          />
        </div>

        {/* Discount */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="discount"
            className="font-body text-sm font-medium text-foreground/90"
          >
            Discount %{" "}
            <span className="text-muted-foreground text-xs font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="discount"
            data-ocid="form.input"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 20"
            value={formData.discount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, discount: e.target.value }))
            }
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
          />
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
                Generating your ad…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Ad
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}

/* ═══════════════════════════════════════
   RESULT VIEW
═══════════════════════════════════════ */

interface ResultViewProps {
  generatedAd: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onCreateAnother: () => void;
}

function ResultView({
  generatedAd,
  copied,
  onCopy,
  onShare,
  onCreateAnother,
}: ResultViewProps) {
  return (
    <main className="flex flex-col flex-1 px-6 pt-8 pb-10">
      {/* Header */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="text-center mb-8"
      >
        <motion.div variants={staggerItem} className="flex justify-center mb-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30">
            <Sparkles className="w-6 h-6 text-primary" />
          </span>
        </motion.div>
        <motion.h1
          variants={staggerItem}
          className="font-display text-2xl font-bold text-foreground mb-2"
        >
          Your Ad is Ready!
        </motion.h1>
        <motion.p
          variants={staggerItem}
          className="text-sm text-muted-foreground"
        >
          Copy or share your ad right away
        </motion.p>
      </motion.div>

      {/* Ad card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { delay: 0.15, duration: 0.45, ease: "easeOut" },
        }}
        data-ocid="result.card"
        className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden flex-1"
      >
        {/* Decorative glow accent */}
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/15 blur-3xl pointer-events-none"
        />

        <p className="font-body text-foreground/95 text-base leading-relaxed whitespace-pre-wrap relative z-10">
          {generatedAd}
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.3, duration: 0.35 },
        }}
        className="flex gap-3 mb-4"
      >
        <Button
          data-ocid="result.button"
          onClick={onCopy}
          variant="outline"
          size="lg"
          className="flex-1 h-13 font-semibold font-display border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-xl gap-2 transition-all duration-200"
        >
          {copied ? (
            <>
              <CheckCheck className="w-4 h-4 text-primary" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
        <Button
          data-ocid="result.secondary_button"
          onClick={onShare}
          variant="outline"
          size="lg"
          className="flex-1 h-13 font-semibold font-display border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-xl gap-2 transition-all duration-200"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </motion.div>

      {/* Create another */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.4, duration: 0.35 },
        }}
      >
        <Button
          data-ocid="result.primary_button"
          onClick={onCreateAnother}
          size="lg"
          className="w-full h-14 text-base font-semibold font-display tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground btn-glow transition-all duration-300 rounded-xl gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Create Another
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.55 } }}
        className="text-center mt-8"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
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
