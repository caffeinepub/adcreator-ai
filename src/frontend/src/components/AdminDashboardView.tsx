import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  ImageIcon,
  MessageSquare,
  ShieldAlert,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Feedback } from "../backend";
import { useActor } from "../hooks/useActor";
import { UserAvatarChip } from "./UserAvatarChip";

/* ── helpers ─────────────────────────────────────────────── */

function fmtDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function truncatePrincipal(p: string): string {
  if (p.length <= 10) return p;
  return `${p.slice(0, 8)}…`;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram:
    "linear-gradient(135deg, oklch(0.68 0.22 15), oklch(0.62 0.24 330), oklch(0.58 0.22 280))",
  facebook: "oklch(0.42 0.20 265)",
  tiktok: "linear-gradient(135deg, #010101, #ee1d52)",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "📸 Instagram",
  facebook: "👤 Facebook",
  tiktok: "🎵 TikTok",
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ── StatCard ─────────────────────────────────────────────── */

function StatCard({
  icon,
  value,
  label,
  ocid,
  accentColor,
}: {
  icon: React.ReactNode;
  value: number | bigint;
  label: string;
  ocid: string;
  accentColor?: string;
}) {
  const displayVal = typeof value === "bigint" ? Number(value) : value;
  const accent = accentColor ?? "oklch(0.62 0.22 240)";

  return (
    <motion.div
      variants={fadeUp}
      data-ocid={ocid}
      className="glass-card rounded-2xl p-4 flex flex-col gap-2"
      style={{
        borderTop: `2px solid ${accent}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: `${accent} / 0.15`,
          backgroundColor: `${accent}22`,
        }}
      >
        {icon}
      </div>
      <p className="font-display text-3xl font-bold text-foreground leading-none">
        {displayVal.toLocaleString()}
      </p>
      <p className="font-body text-xs text-muted-foreground leading-snug">
        {label}
      </p>
    </motion.div>
  );
}

/* ── BarRow ───────────────────────────────────────────────── */

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-foreground/90">{label}</span>
        <span className="font-display text-sm font-semibold text-foreground">
          {count.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-secondary/60">
        <motion.div
          className="h-2 rounded-full"
          style={{ background: color, width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ── WeeklyBar ────────────────────────────────────────────── */

function WeeklyBarChart({
  data,
}: {
  data: Array<{ day: string; count: bigint }>;
}) {
  const max = Math.max(...data.map((d) => Number(d.count)), 1);
  return (
    <div className="flex items-end gap-2 w-full" style={{ height: 120 }}>
      {data.map((d, i) => {
        const cnt = Number(d.count);
        const pct = Math.max((cnt / max) * 100, 4);
        return (
          <div
            key={`${d.day}-${i}`}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span className="font-display text-[10px] font-semibold text-foreground/70">
              {cnt > 0 ? cnt : ""}
            </span>
            <motion.div
              className="w-full rounded-t-md"
              style={{
                background:
                  i === data.length - 1
                    ? "oklch(0.62 0.22 240)"
                    : "oklch(0.62 0.22 240 / 0.5)",
                height: `${pct}%`,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
            />
            <span className="font-body text-[9px] text-muted-foreground truncate w-full text-center">
              {d.day.length > 3 ? d.day.slice(0, 3) : d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── FeedbackCard ─────────────────────────────────────────── */

function FeedbackCard({
  feedback,
  ocid,
}: {
  feedback: Feedback;
  ocid: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = feedback.message.slice(0, 100);
  const hasMore = feedback.message.length > 100;

  return (
    <div
      data-ocid={ocid}
      className="rounded-xl border border-border/40 bg-secondary/30 p-4 flex flex-col gap-2"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-display font-semibold text-sm text-foreground truncate">
            {feedback.userName || "Usuario"}
          </p>
          <p className="font-body text-xs text-muted-foreground truncate">
            {feedback.userEmail}
          </p>
        </div>
        <span className="font-body text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
          {fmtDate(feedback.submittedAt)}
        </span>
      </div>
      {/* Message */}
      <p className="font-body text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
        {expanded ? feedback.message : preview}
        {!expanded && hasMore ? "…" : ""}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors font-body"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Ver más
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ── AdminDashboardView ───────────────────────────────────── */

interface AdminDashboardViewProps {
  onBack: () => void;
  userName: string;
  onLogout: () => void;
  onFeedback?: () => void;
}

export function AdminDashboardView({
  onBack,
  userName,
  onLogout,
  onFeedback,
}: AdminDashboardViewProps) {
  const { actor, isFetching: actorFetching } = useActor();

  /* access check */
  const { data: isAdmin, isLoading: adminCheckLoading } = useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  /* analytics */
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getAdminAnalytics();
    },
    enabled: !!actor && !actorFetching && isAdmin === true,
    retry: false,
  });

  /* users */
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getAllUsersForAdmin();
    },
    enabled: !!actor && !actorFetching && isAdmin === true,
    retry: false,
  });

  /* feedback */
  const { data: allFeedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ["adminFeedback"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getAllFeedback();
    },
    enabled: !!actor && !actorFetching && isAdmin === true,
    retry: false,
  });

  /* ── Header ─── */
  const Header = (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <button
        type="button"
        data-ocid="admin.back_button"
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
          <span className="text-gradient">Admin</span>{" "}
          <span className="text-foreground/80">Dashboard</span>
        </span>
      </div>
      <UserAvatarChip
        userName={userName}
        onLogout={onLogout}
        onFeedback={onFeedback}
      />
    </header>
  );

  /* ── Loading ─── */
  if (adminCheckLoading || actorFetching) {
    return (
      <div className="flex flex-col flex-1" data-ocid="admin.page">
        {Header}
        <main className="flex flex-col flex-1 px-4 pt-6 pb-10 gap-5">
          <div data-ocid="admin.loading_state" className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-28 w-full rounded-2xl bg-secondary"
                />
              ))}
            </div>
            <Skeleton className="h-36 w-full rounded-2xl bg-secondary" />
            <Skeleton className="h-52 w-full rounded-2xl bg-secondary" />
            <Skeleton className="h-64 w-full rounded-2xl bg-secondary" />
          </div>
        </main>
      </div>
    );
  }

  /* ── Access Denied ─── */
  if (isAdmin !== true) {
    return (
      <div className="flex flex-col flex-1" data-ocid="admin.page">
        {Header}
        <main className="flex flex-col flex-1 items-center justify-center px-6 gap-5 text-center">
          <div
            data-ocid="admin.error_state"
            className="flex flex-col items-center gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/25 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-foreground mb-2">
                Acceso Denegado
              </p>
              <p className="font-body text-muted-foreground text-sm max-w-xs">
                Solo el administrador puede ver este panel.
              </p>
            </div>
            <Button
              data-ocid="admin.back_button"
              onClick={onBack}
              variant="outline"
              className="gap-2 border-border bg-secondary/60 hover:bg-secondary text-foreground rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
        </main>
      </div>
    );
  }

  /* ── Data loading skeletons ─── */
  const dataLoading = analyticsLoading || usersLoading || feedbackLoading;

  /* ── Platform chart data ─── */
  const platformData = analytics?.platformCounts ?? [];
  const platformMax = Math.max(...platformData.map((p) => Number(p.count)), 1);

  /* ── Business types (top 5) ─── */
  const bizTypes = [...(analytics?.topBusinessTypes ?? [])]
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5);
  const bizMax = Math.max(...bizTypes.map((b) => Number(b.count)), 1);

  /* ── Weekly activity ─── */
  const weeklyData = analytics?.weeklyActivity ?? [];

  return (
    <div className="flex flex-col flex-1" data-ocid="admin.page">
      {Header}

      <main className="flex flex-col flex-1 px-4 pt-5 pb-10 gap-5 overflow-x-hidden">
        {/* ── Page title ─── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/20 text-primary border border-primary/35">
              🔐 Solo para administradores
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold">
            <span className="text-gradient">Analytics</span>{" "}
            <span className="text-foreground/80">del Sistema</span>
          </h1>
        </motion.div>

        {dataLoading ? (
          <div data-ocid="admin.loading_state" className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl bg-secondary" />
              ))}
            </div>
            <Skeleton className="h-36 rounded-2xl bg-secondary" />
            <Skeleton className="h-52 rounded-2xl bg-secondary" />
            <Skeleton className="h-64 rounded-2xl bg-secondary" />
          </div>
        ) : (
          <>
            {/* ── Stats cards — 2×2 + 1 full-width ─── */}
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  ocid="admin.stats.total_users_card"
                  icon={
                    <Users
                      className="w-5 h-5"
                      style={{ color: "oklch(0.62 0.22 240)" }}
                    />
                  }
                  value={analytics?.totalUsers ?? 0n}
                  label="Usuarios Registrados"
                  accentColor="oklch(0.62 0.22 240)"
                />
                <StatCard
                  ocid="admin.stats.active_today_card"
                  icon={
                    <Activity
                      className="w-5 h-5"
                      style={{ color: "oklch(0.72 0.18 170)" }}
                    />
                  }
                  value={analytics?.activeUsersToday ?? 0n}
                  label="Activos Hoy"
                  accentColor="oklch(0.72 0.18 170)"
                />
                <StatCard
                  ocid="admin.stats.total_ads_card"
                  icon={
                    <FileText
                      className="w-5 h-5"
                      style={{ color: "oklch(0.65 0.22 300)" }}
                    />
                  }
                  value={analytics?.totalAdsGenerated ?? 0n}
                  label="Anuncios Generados"
                  accentColor="oklch(0.65 0.22 300)"
                />
                <StatCard
                  ocid="admin.stats.total_images_card"
                  icon={
                    <ImageIcon
                      className="w-5 h-5"
                      style={{ color: "oklch(0.70 0.18 200)" }}
                    />
                  }
                  value={analytics?.totalImagesGenerated ?? 0n}
                  label="Imágenes Generadas"
                  accentColor="oklch(0.70 0.18 200)"
                />
              </div>
              {/* Feedback stat — full width */}
              <StatCard
                ocid="admin.stats.total_feedback_card"
                icon={
                  <MessageSquare
                    className="w-5 h-5"
                    style={{ color: "oklch(0.75 0.18 50)" }}
                  />
                }
                value={allFeedback?.length ?? 0}
                label="Feedback Recibido"
                accentColor="oklch(0.75 0.18 50)"
              />
            </motion.div>

            {/* ── Platforms ─── */}
            <motion.section
              data-ocid="admin.platforms.section"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="glass-card rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                <span className="text-base">📱</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                  Plataformas Más Usadas
                </span>
              </div>
              {platformData.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-2">
                  Sin datos aún
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {platformData.map((p) => (
                    <BarRow
                      key={p.platform}
                      label={PLATFORM_LABELS[p.platform] ?? p.platform}
                      count={Number(p.count)}
                      max={platformMax}
                      color={
                        PLATFORM_COLORS[p.platform] ?? "oklch(0.62 0.22 240)"
                      }
                    />
                  ))}
                </div>
              )}
            </motion.section>

            {/* ── Top Business Types ─── */}
            <motion.section
              data-ocid="admin.business_types.section"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="glass-card rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                <span className="text-base">🏪</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                  Tipos de Negocio Más Usados
                </span>
              </div>
              {bizTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-2">
                  Sin datos aún
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {bizTypes.map((b) => (
                    <BarRow
                      key={b.businessType}
                      label={b.businessType}
                      count={Number(b.count)}
                      max={bizMax}
                      color="oklch(0.65 0.22 300)"
                    />
                  ))}
                </div>
              )}
            </motion.section>

            {/* ── Weekly Activity Chart ─── */}
            <motion.section
              data-ocid="admin.weekly_chart.section"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="glass-card rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                    Actividad Semanal
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
                  Últimos 7 días
                </span>
              </div>
              {weeklyData.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center py-2">
                  Sin datos aún
                </p>
              ) : (
                <WeeklyBarChart data={weeklyData} />
              )}
            </motion.section>

            {/* ── Users Table ─── */}
            <motion.section
              data-ocid="admin.users.table"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="glass-card rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">👥</span>
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                    Usuarios Registrados
                  </span>
                </div>
                <span className="font-display text-sm font-semibold text-foreground/80">
                  {(users ?? []).length}
                </span>
              </div>

              {(users ?? []).length === 0 ? (
                <div
                  data-ocid="admin.users.empty_state"
                  className="flex flex-col items-center justify-center gap-3 py-8 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <p className="font-body text-muted-foreground text-sm">
                    Aún no hay usuarios registrados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="font-body text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          Nombre
                        </TableHead>
                        <TableHead className="font-body text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          ID
                        </TableHead>
                        <TableHead className="font-body text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          Registrado
                        </TableHead>
                        <TableHead className="font-body text-xs font-semibold text-muted-foreground whitespace-nowrap text-right">
                          Anuncios
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(users ?? []).map((u, idx) => {
                        const principalStr = u.principal.toString();
                        return (
                          <TableRow
                            key={principalStr}
                            data-ocid={`admin.users.row.${idx + 1}`}
                            className="border-border/30 hover:bg-secondary/30 transition-colors"
                          >
                            <TableCell className="font-body text-sm text-foreground/90 py-3">
                              {u.name.trim() || "—"}
                            </TableCell>
                            <TableCell
                              className="font-mono text-xs text-muted-foreground py-3"
                              title={principalStr}
                            >
                              {truncatePrincipal(principalStr)}
                            </TableCell>
                            <TableCell className="font-body text-xs text-muted-foreground py-3 whitespace-nowrap">
                              {fmtDate(u.registeredAt)}
                            </TableCell>
                            <TableCell className="font-display text-sm font-semibold text-primary py-3 text-right">
                              {Number(u.adCount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.section>

            {/* ── Feedback Section ─── */}
            <motion.section
              data-ocid="admin.feedback.section"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="glass-card rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80 font-body">
                    Feedback de Usuarios
                  </span>
                </div>
                <span className="font-display text-sm font-semibold text-foreground/80">
                  {(allFeedback ?? []).length}
                </span>
              </div>

              {feedbackLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-20 rounded-xl bg-secondary"
                    />
                  ))}
                </div>
              ) : (allFeedback ?? []).length === 0 ? (
                <div
                  data-ocid="admin.feedback.empty_state"
                  className="flex flex-col items-center justify-center gap-3 py-8 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-body text-muted-foreground text-sm">
                    Aún no hay feedback enviado.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(allFeedback ?? []).map((fb, idx) => (
                    <FeedbackCard
                      key={fb.id.toString()}
                      feedback={fb}
                      ocid={`admin.feedback.item.${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </motion.section>

            {/* ── Error info icon if analytics missing ─── */}
            {!analytics && (
              <div
                data-ocid="admin.error_state"
                className="flex items-center gap-2 text-destructive/80 text-sm font-body"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No se pudieron cargar los analytics del servidor.
              </div>
            )}
          </>
        )}

        {/* ── Footer ─── */}
        <footer className="text-center mt-4">
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
        </footer>
      </main>
    </div>
  );
}
