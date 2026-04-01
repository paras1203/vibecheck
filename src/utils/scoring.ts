/**
 * Scoring module for landing page audits
 * Converts audit items into 6 standardized radar metrics (UX, Conversion, Copy, Visuals, Trust, Speed)
 */

export type AuditItemStatus = 
  | "Excellent" 
  | "Good" 
  | "Satisfactory" 
  | "Needs Improvement" 
  | "Failed";

export type AuditItemImpact = "High" | "Medium" | "Low" | "HI" | "MI" | "LI";

export type RadarCategory = "ux" | "conversion" | "copy" | "visuals" | "trust" | "speed";

export interface AuditItem {
  element?: string;
  item?: string;
  status: AuditItemStatus;
  impact?: AuditItemImpact;
  rationale?: string;
  working?: string[];
  not_working?: string[];
  why_this_matters?: string;
  fix?: string;
  fix_example?: string;
  expected_impact?: string;
}

export interface RadarScores {
  ux: number;
  conversion: number;
  copy: number;
  visuals: number;
  trust: number;
  speed: number;
}

export interface ScoringResult {
  radarScores: RadarScores;
  overallScore: number;
}

/**
 * Maps status to numeric points
 */
const STATUS_POINTS: Record<AuditItemStatus, number> = {
  "Excellent": 95,
  "Good": 80,
  "Satisfactory": 60,
  "Needs Improvement": 35,
  "Failed": 5,
};

/**
 * Maps impact to multiplier
 */
const IMPACT_MULTIPLIER: Record<AuditItemImpact, number> = {
  "High": 1.5,
  "HI": 1.5,
  "Medium": 1.0,
  "MI": 1.0,
  "Low": 0.5,
  "LI": 0.5,
};

/**
 * Maps audit item to radar category based on element/item name
 */
function mapItemToCategory(item: AuditItem): RadarCategory | null {
  const itemName = (item.element || item.item || "").toLowerCase();
  const itemNameLower = itemName.toLowerCase();

  // UX & Layout
  if (
    itemNameLower.includes("hero") ||
    itemNameLower.includes("above the fold") ||
    itemNameLower.includes("visual hierarchy") ||
    itemNameLower.includes("content flow") ||
    itemNameLower.includes("navigation") ||
    itemNameLower.includes("whitespace") ||
    itemNameLower.includes("spacing") ||
    itemNameLower.includes("alignment") ||
    itemNameLower.includes("readability") ||
    itemNameLower.includes("scroll") ||
    itemNameLower.includes("mobile") ||
    itemNameLower.includes("layout") ||
    itemNameLower.includes("ux")
  ) {
    // Mobile performance items go to Speed, UX items go to UX
    if (itemNameLower.includes("speed") || itemNameLower.includes("load") || itemNameLower.includes("performance")) {
      return "speed";
    }
    return "ux";
  }

  // Conversion & Funnel
  if (
    itemNameLower.includes("cta") ||
    itemNameLower.includes("call to action") ||
    itemNameLower.includes("conversion") ||
    itemNameLower.includes("funnel") ||
    itemNameLower.includes("form") ||
    itemNameLower.includes("lead capture") ||
    itemNameLower.includes("offer") ||
    itemNameLower.includes("friction") ||
    itemNameLower.includes("urgency") ||
    itemNameLower.includes("scarcity")
  ) {
    return "conversion";
  }

  // Copy & Messaging
  if (
    itemNameLower.includes("headline") ||
    itemNameLower.includes("subheadline") ||
    itemNameLower.includes("copy") ||
    itemNameLower.includes("messaging") ||
    itemNameLower.includes("value proposition") ||
    itemNameLower.includes("objection") ||
    itemNameLower.includes("persuasion") ||
    itemNameLower.includes("tone") ||
    itemNameLower.includes("voice")
  ) {
    return "copy";
  }

  // Visuals & Brand
  if (
    itemNameLower.includes("logo") ||
    itemNameLower.includes("visual") ||
    itemNameLower.includes("brand") ||
    itemNameLower.includes("imagery") ||
    itemNameLower.includes("image") ||
    itemNameLower.includes("icon") ||
    itemNameLower.includes("colour") ||
    itemNameLower.includes("color") ||
    itemNameLower.includes("video") ||
    itemNameLower.includes("clutter")
  ) {
    return "visuals";
  }

  // Trust & Credibility
  if (
    itemNameLower.includes("testimonial") ||
    itemNameLower.includes("review") ||
    itemNameLower.includes("trust") ||
    itemNameLower.includes("credibility") ||
    itemNameLower.includes("badge") ||
    itemNameLower.includes("certification") ||
    itemNameLower.includes("contact") ||
    itemNameLower.includes("legal") ||
    itemNameLower.includes("privacy") ||
    itemNameLower.includes("terms") ||
    itemNameLower.includes("transparency") ||
    itemNameLower.includes("footer")
  ) {
    return "trust";
  }

  // Speed & Technical Health
  if (
    itemNameLower.includes("speed") ||
    itemNameLower.includes("load") ||
    itemNameLower.includes("lcp") ||
    itemNameLower.includes("fcp") ||
    itemNameLower.includes("cls") ||
    itemNameLower.includes("technical") ||
    itemNameLower.includes("health") ||
    itemNameLower.includes("optimization") ||
    itemNameLower.includes("optimisation") ||
    itemNameLower.includes("js") ||
    itemNameLower.includes("css") ||
    itemNameLower.includes("bloat") ||
    itemNameLower.includes("caching") ||
    itemNameLower.includes("cdn") ||
    itemNameLower.includes("https") ||
    itemNameLower.includes("ssl") ||
    itemNameLower.includes("console") ||
    itemNameLower.includes("error")
  ) {
    return "speed";
  }

  return null;
}

/**
 * Calculate radar scores from audit items
 */
export function calculateRadarScores(items: AuditItem[]): ScoringResult {
  // Group items by category
  const categoryItems: Record<RadarCategory, AuditItem[]> = {
    ux: [],
    conversion: [],
    copy: [],
    visuals: [],
    trust: [],
    speed: [],
  };

  // Map items to categories
  for (const item of items) {
    const category = mapItemToCategory(item);
    if (category) {
      categoryItems[category].push(item);
    }
  }

  // Calculate score for each category
  const radarScores: RadarScores = {
    ux: 0,
    conversion: 0,
    copy: 0,
    visuals: 0,
    trust: 0,
    speed: 0,
  };

  for (const category of Object.keys(categoryItems) as RadarCategory[]) {
    const itemsInCategory = categoryItems[category];

    if (itemsInCategory.length === 0) {
      // Default to 50 if no items in category
      radarScores[category] = 50;
      continue;
    }

    // Calculate weighted points
    let weightedPoints = 0;
    let maxPossible = 0;

    for (const item of itemsInCategory) {
      const statusPoints = STATUS_POINTS[item.status];
      const impact = item.impact || "Medium";
      const impactMultiplier = IMPACT_MULTIPLIER[impact] || 1.0;

      weightedPoints += statusPoints * impactMultiplier;
      maxPossible += 95 * impactMultiplier; // 95 = Excellent
    }

    // Calculate score (0-100)
    const score = maxPossible > 0 
      ? Math.round((weightedPoints / maxPossible) * 100)
      : 50; // Default if division by zero

    radarScores[category] = Math.max(0, Math.min(100, score)); // Clamp to 0-100
  }

  // Calculate overall score (average of 6 metrics)
  const overallScore = Math.round(
    (radarScores.ux +
      radarScores.conversion +
      radarScores.copy +
      radarScores.visuals +
      radarScores.trust +
      radarScores.speed) /
      6
  );

  return {
    radarScores,
    overallScore,
  };
}

/**
 * Helper to convert radar scores to the format expected by the radar chart
 * (converts lowercase keys to capitalized for display)
 */
export function formatRadarScoresForChart(scores: RadarScores): Record<string, number> {
  return {
    UX: scores.ux,
    Conversion: scores.conversion,
    Copy: scores.copy,
    Visuals: scores.visuals,
    Trust: scores.trust,
    Speed: scores.speed,
  };
}

