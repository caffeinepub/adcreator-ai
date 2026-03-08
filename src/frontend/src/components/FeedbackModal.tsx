import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { actor } = useActor();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const handleClose = () => {
    if (isSubmitting) return;
    setEmail("");
    setMessage("");
    setInlineError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    if (!actor) {
      setInlineError("No se pudo conectar. Intenta de nuevo.");
      return;
    }

    setIsSubmitting(true);
    setInlineError("");

    try {
      await actor.submitFeedback(email.trim(), message.trim());
      toast.success("¡Gracias por tu feedback! Lo revisaremos pronto.", {
        duration: 4000,
      });
      handleClose();
    } catch (err) {
      console.error(err);
      setInlineError(
        "No se pudo enviar el feedback. Por favor intenta de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="feedback.dialog"
        className="bg-popover border-border rounded-2xl max-w-sm mx-4 p-0 overflow-hidden"
        onInteractOutside={() => !isSubmitting && handleClose()}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-lg font-bold text-foreground leading-tight">
                Enviar Feedback
              </DialogTitle>
              <DialogDescription className="font-body text-xs text-muted-foreground mt-0.5">
                Cuéntanos cómo mejorar AdCreator AI
              </DialogDescription>
            </div>
            <button
              type="button"
              data-ocid="feedback.close_button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/60 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-shrink-0 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="feedback-email"
              className="font-body text-sm font-medium text-foreground/90"
            >
              Tu email
            </Label>
            <Input
              id="feedback-email"
              data-ocid="feedback.email_input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl text-base"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="feedback-message"
              className="font-body text-sm font-medium text-foreground/90"
            >
              Tu mensaje
            </Label>
            <Textarea
              id="feedback-message"
              data-ocid="feedback.message_textarea"
              placeholder="Escribe tus sugerencias, problemas o comentarios..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary rounded-xl resize-none text-base"
            />
          </div>

          {/* Inline error */}
          {inlineError && (
            <p
              data-ocid="feedback.error_state"
              className="text-sm text-destructive font-body"
            >
              {inlineError}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              data-ocid="feedback.cancel_button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-12 font-semibold font-display border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-xl transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              data-ocid="feedback.submit_button"
              disabled={
                isSubmitting || !email.trim() || !message.trim() || !actor
              }
              className="flex-1 h-12 font-semibold font-display bg-primary hover:bg-primary/90 text-primary-foreground btn-glow rounded-xl gap-2 transition-all duration-200 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
