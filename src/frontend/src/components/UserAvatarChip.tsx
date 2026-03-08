import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, MessageSquare, User } from "lucide-react";

export function UserAvatarChip({
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
            <DropdownMenuSeparator className="mx-1 bg-border/50" />
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
