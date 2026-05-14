/**
 * Adds a deterministic Trust pillar finding when the user supplied an explicit http:// URL
 * (no TLS for that load). Radar trust + overall scores are recomputed from detailedAudit.trust.
 */

type AuditItemWorker = Record<string, unknown>;

function weightedCategoryScore(items: AuditItemWorker[]): number {
  const statusPoints: Record<string, number> = {
    Excellent: 95,
    Good: 80,
    Satisfactory: 60,
    "Needs Improvement": 35,
    Failed: 5,
  };
  const impactMultipliers: Record<string, number> = { HI: 1.5, MI: 1.0, LI: 0.5 };

  if (items.length === 0) return 50;

  let weightedSum = 0;
  let weightSum = 0;
  for (const item of items) {
    const status = String(item.status ?? "Satisfactory");
    const impact = String(item.impact ?? "MI");
    const points = statusPoints[status] ?? 60;
    const multiplier = impactMultipliers[impact] ?? 1;
    weightedSum += points * multiplier;
    weightSum += 95 * multiplier;
  }
  return weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) : 50;
}

/** User-submitted URL (not Puppeteer normalization). Adds trust item + audit row and rescores Trust. */
export function applyInsecureHttpUrlAuditEnhancement(
  result: Record<string, unknown>,
  requestedUrl: string
): void {
  if (!/^http:\/\//i.test(requestedUrl.trim())) return;

  const item: AuditItemWorker = {
    elementName: "HTTPS / TLS encryption",
    status: "Failed",
    impact: "HI",
    radarCategory: "trust",
    rationale:
      "The audit used the submitted http:// URL, so traffic is not encrypted in transit. Visitors see insecure-connection indicators—undermining trust—and credentials or form data could be intercepted on hostile networks.",
    workingWell: [] as string[],
    notWorking: [
      "No TLS-backed HTTPS load for this audit: HTTPS security certificate protections do not apply to plain HTTP origins.",
      "Treat this as absent transport security unless you intentionally serve only HTTP (not recommended for production).",
    ],
    fix: {
      quickFix:
        "Enable HTTPS with a valid TLS certificate from a public CA; redirect all HTTP URLs to HTTPS with HSTS where appropriate.",
      example: "",
      expectedImpact: "Restores browser trust signals and protects data in transit.",
    },
    conversionImpact:
      "Unencrypted HTTP measurably weakens credibility and lowers conversion readiness for authenticated or payment journeys.",
  };

  const detailed = (result.detailedAudit as Record<string, AuditItemWorker[]>) || {};
  const trustList = Array.isArray(detailed.trust) ? [...detailed.trust] : [];

  const already = trustList.some(
    (row) =>
      String(row.elementName || "")
        .toLowerCase()
        .includes("https") && String(row.elementName || "").toLowerCase().includes("tls")
  );
  if (already) return;

  trustList.unshift(item);
  result.detailedAudit = { ...detailed, trust: trustList };

  const radarMetrics =
    typeof result.radarMetrics === "object" && result.radarMetrics !== null
      ? { ...(result.radarMetrics as Record<string, number>) }
      : {};
  radarMetrics.trust = weightedCategoryScore(trustList);
  result.radarMetrics = radarMetrics;

  const rs =
    typeof result.radar_scores === "object" && result.radar_scores !== null
      ? { ...(result.radar_scores as Record<string, number>) }
      : null;
  if (rs && typeof radarMetrics.trust === "number") {
    rs.Trust = radarMetrics.trust;
    result.radar_scores = rs;
  }

  type LegacyAi = {
    element: string;
    status: string;
    rationale: string;
    working: string[];
    not_working: string[];
    fix: string;
    expected_impact: string;
  };

  const legacyRow: LegacyAi = {
    element: String(item.elementName),
    status: String(item.status ?? ""),
    rationale: String(item.rationale ?? ""),
    working: (item.workingWell as string[]) ?? [],
    not_working: (item.notWorking as string[]) ?? [],
    fix:
      typeof item.fix === "object" && item.fix !== null
        ? String((item.fix as { quickFix?: string }).quickFix ?? "")
        : "",
    expected_impact: String(item.conversionImpact ?? ""),
  };

  const auditItems = Array.isArray(result.audit_items) ? [...result.audit_items] : [];
  auditItems.unshift(legacyRow);
  result.audit_items = auditItems;
}
