/* ═══════════════════════════════════════
   PRO SUBSCRIPTION STORAGE HELPERS
   Stored in localStorage keyed by principal ID
═══════════════════════════════════════ */

const PRO_KEY_PREFIX = "adcreator_pro_";
const LOGO_USAGE_PREFIX = "adcreator_logo_usage_";
const VIDEO_USAGE_PREFIX = "adcreator_video_usage_";

const DAY_MS = 24 * 60 * 60 * 1000;

interface UsageRecord {
  count: number;
  windowStart: number;
}

// ── Pro status ──────────────────────────────────────────

export function isUserPro(principalId: string): boolean {
  try {
    return localStorage.getItem(`${PRO_KEY_PREFIX}${principalId}`) === "true";
  } catch {
    return false;
  }
}

export function markUserAsPro(principalId: string): void {
  try {
    localStorage.setItem(`${PRO_KEY_PREFIX}${principalId}`, "true");
  } catch {
    // Silently ignore storage errors
  }
}

// ── Generic daily usage helpers ─────────────────────────

function getUsage(key: string): UsageRecord {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { count: 0, windowStart: Date.now() };
    const parsed = JSON.parse(raw) as UsageRecord;
    // Reset if window expired
    if (Date.now() - parsed.windowStart > DAY_MS) {
      return { count: 0, windowStart: Date.now() };
    }
    return parsed;
  } catch {
    return { count: 0, windowStart: Date.now() };
  }
}

function incrementUsage(key: string): UsageRecord {
  const current = getUsage(key);
  const updated: UsageRecord = {
    count: current.count + 1,
    windowStart: current.windowStart,
  };
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

// ── Logo usage ──────────────────────────────────────────

export function getLogoUsage(principalId: string): UsageRecord {
  return getUsage(`${LOGO_USAGE_PREFIX}${principalId}`);
}

export function incrementLogoUsage(principalId: string): UsageRecord {
  return incrementUsage(`${LOGO_USAGE_PREFIX}${principalId}`);
}

// ── Video usage ─────────────────────────────────────────

export function getVideoUsage(principalId: string): UsageRecord {
  return getUsage(`${VIDEO_USAGE_PREFIX}${principalId}`);
}

export function incrementVideoUsage(principalId: string): UsageRecord {
  return incrementUsage(`${VIDEO_USAGE_PREFIX}${principalId}`);
}
