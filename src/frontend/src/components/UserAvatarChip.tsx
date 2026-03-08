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
}: {
  onLogout: () => void;
  userName: string;
  onFeedback?: () => void;
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
          className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Mi cuenta"
        >
          {initials || <User className="w-4 h-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-popover border-border rounded-xl"
      >
        <div className="px-3 py-2 border-b border-border/50">
          <p className="text-xs text-muted-foreground">Cuenta</p>
          <p className="text-sm font-semibold text-foreground truncate">
            {userName}
          </p>
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
