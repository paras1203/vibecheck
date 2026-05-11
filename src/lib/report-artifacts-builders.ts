import { RADAR_AXIS_LABELS, scoreForRadarAxis } from "@/lib/radar-axis-scores";
import type {
  ExperimentBacklogItem,
  ImplementationChecklistItem,
} from "@/types/report-artifacts";

type QuickWinInput = {
  elementName?: string;
  title?: string;
  problem?: string;
  fix?: string;
};

function shortSlug(s: string, max = 48): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function inferOwner(theme: string): ImplementationChecklistItem["owner"] {
  const l = theme.toLowerCase();
  if (/(copy|headline|value|seo|message|proposal)/i.test(l)) return "Copy";
  if (/(visual|layout|hero|image|cta visibility|brand)/i.test(l)) return "Design";
  if (/(speed|form|technical|mobile|tag|privacy|cookie|performance)/i.test(l)) return "Dev";
  return "Marketing";
}

function inferEffort(theme: string, fixLen: number): ImplementationChecklistItem["effort"] {
  const l = theme.toLowerCase();
  if (/speed|migrate|architecture|analytics|install/i.test(l) || fixLen > 200) return "1–2 days";
  if (/hero|landing|rewrite|screenshot/i.test(l) || fixLen > 80) return "Half day";
  return "15 min";
}

export function buildExperimentBacklog(quickWins: QuickWinInput[]): ExperimentBacklogItem[] {
  return quickWins.slice(0, 5).map((w, i) => {
    const name = w.elementName || w.title || "Audit theme";
    const prob = (w.problem || "").trim();
    const fix = (w.fix || "").trim();
    return {
      testName: `Test #${i + 1} – ${shortSlug(name, 52)}`,
      hypothesis: prob
        ? `If we fix ${shortSlug(name, 36)}, we expect clearer intent and fewer drop-offs: ${prob.slice(0, 140)}${prob.length > 140 ? "…" : ""}`
        : `If we improve ${shortSlug(name, 40)}, clarity and motivation to convert should rise.`,
      primaryMetric:
        i % 3 === 0
          ? "Primary CTA click-through rate"
          : i % 3 === 1
            ? "Signup / lead form completion rate"
            : "Time-to-first-scroll or engagement proxy",
      variantDescription:
        fix.slice(0, 220) || `Ship the prioritized fix paths for ${shortSlug(name, 42)}.`,
    };
  });
}

export function buildImplementationChecklist(
  quickWins: QuickWinInput[],
  radarScores?: Record<string, unknown>,
  radarMetrics?: Record<string, unknown>
): ImplementationChecklistItem[] {
  const radar = (radarScores ?? radarMetrics) as Record<string, unknown> | undefined;
  const out: ImplementationChecklistItem[] = [];

  for (const w of quickWins.slice(0, 6)) {
    const name = (w.elementName || w.title || "Audit item").trim();
    const problem = (w.problem || "").trim();
    const fix = (w.fix || "").trim();
    const task = problem ? `${name}: ${problem.slice(0, 140)}`.trim() : `Implement remediation for ${name}`;
    out.push({
      task: task.length > 180 ? `${task.slice(0, 177)}…` : task,
      owner: inferOwner(name),
      effort: inferEffort(name + fix, fix.length),
    });
    if (out.length >= 10) return out;
  }

  if (radar && typeof radar === "object") {
    for (const label of RADAR_AXIS_LABELS) {
      if (out.length >= 10) break;
      const v = scoreForRadarAxis(radar as Record<string, number>, label);
      if (typeof v !== "number" || v >= 55) continue;
      out.push({
        task: `Raise ${label} pillar (currently ~${Math.round(v)}/100) using the matching audit fixes and proofs above.`,
        owner:
          label === "Copy"
            ? "Copy"
            : label === "Visuals"
              ? "Design"
              : label === "Speed"
                ? "Dev"
                : "Marketing",
        effort: label === "Speed" ? "Half day" : "Half day",
      });
    }
  }

  return out.slice(0, 10);
}
