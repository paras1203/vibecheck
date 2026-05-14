

type PillStyle = { background: string; color: string };

function normStatus(s: string): string {
  return s.trim().toLowerCase();
}

function normImpact(s: string): string {
  return s.trim().toUpperCase();
}

export function auditStatusTextClassName(status: string): string {
  const key = normStatus(status);
  if (key === "excellent" || key === "good") {
    return "font-semibold text-emerald-700 dark:text-emerald-300";
  }
  if (key === "satisfactory") {
    return "font-semibold text-muted-foreground";
  }
  if (key === "needs improvement") {
    return "font-semibold text-amber-800 dark:text-amber-300";
  }
  if (key === "failed") {
    return "font-semibold text-destructive";
  }
  return "font-semibold text-foreground";
}

export function auditImpactTextClassName(impact: string): string {
  const u = normImpact(impact);
  if (u === "HI") {
    return "font-semibold text-red-700 dark:text-red-300";
  }
  if (u === "MI") {
    return "font-semibold text-amber-800 dark:text-amber-300";
  }
  if (u === "LI") {
    return "font-semibold text-emerald-700 dark:text-emerald-300";
  }
  return "font-semibold text-muted-foreground";
}

export function formatAuditImpactLabel(code: string): string {
  const u = normImpact(code);
  switch (u) {
    case "HI":
      return "High";
    case "MI":
      return "Medium";
    case "LI":
      return "Low";
    default:
      return code.trim() || "—";
  }
}

/** Legacy export name; status is plain colored text (no pill background). */
export const auditStatusPillClassName = auditStatusTextClassName;

/** Legacy export name; impact is plain colored text (no pill background). */
export const auditImpactPillClassName = auditImpactTextClassName;

function auditStatusHtmlColor(status: string): string {
  const key = normStatus(status);
  if (key === "excellent" || key === "good") return "#047857";
  if (key === "satisfactory") return "#71717a";
  if (key === "needs improvement") return "#b45309";
  if (key === "failed") return "#dc2626";
  return "#18181b";
}

function auditImpactHtmlColor(impact: string): string {
  const u = normImpact(impact);
  if (u === "HI") return "#b91c1c";
  if (u === "MI") return "#b45309";
  if (u === "LI") return "#047857";
  return "#71717a";
}

export function buildAuditStatusPillHtml(rawStatus: string, esc: (s: string) => string): string {
  const color = auditStatusHtmlColor(rawStatus);
  return `<span style="font-size:11px;font-weight:600;line-height:1.35;color:${color};">${esc(rawStatus)}</span>`;
}

export function buildAuditImpactPillHtml(rawImpact: string, esc: (s: string) => string): string {
  const label = formatAuditImpactLabel(rawImpact);
  const color = auditImpactHtmlColor(rawImpact);
  return `<span style="font-size:11px;font-weight:600;line-height:1.35;color:${color};">${esc(label)}</span>`;
}
