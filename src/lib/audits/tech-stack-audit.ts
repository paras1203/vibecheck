import { TECH_STACK_REGISTRY, type TechToolCategory } from "@/lib/audits/tech-stack-registry";

export type TechConfidence = "high" | "medium" | "low";

export type DetectedTechTool = {
  id: string;
  name: string;
  category: TechToolCategory;
  confidence: TechConfidence;
};

export type TechStackAuditResult = {
  detectedTools: DetectedTechTool[];
  htmlSampleLength: number;
};

function dedupeMerge(
  primary: DetectedTechTool[],
  secondary: DetectedTechTool[]
): DetectedTechTool[] {
  const map = new Map<string, DetectedTechTool>();
  for (const t of primary) map.set(t.id, t);
  for (const t of secondary) {
    if (!map.has(t.id)) map.set(t.id, t);
  }
  return [...map.values()];
}

export function runPatternTechStackAudit(htmlRaw: string): TechStackAuditResult {
  const lower = htmlRaw.toLowerCase();
  const detected: DetectedTechTool[] = [];

  for (const r of TECH_STACK_REGISTRY) {
    let hit = false;
    let confidence: TechConfidence = "medium";
    if (r.regexes?.length) {
      for (const rx of r.regexes) {
        if (rx.test(lower)) {
          hit = true;
          confidence = "high";
          break;
        }
      }
    }
    if (!hit && r.substrings?.length) {
      for (const s of r.substrings) {
        if (lower.includes(s.toLowerCase())) {
          hit = true;
          confidence = r.regexes?.length ? "medium" : "medium";
          break;
        }
      }
    }
    if (hit) {
      detected.push({
        id: r.id,
        name: r.name,
        category: r.category,
        confidence,
      });
    }
  }

  detected.sort((a, b) => a.name.localeCompare(b.name));

  return {
    detectedTools: detected,
    htmlSampleLength: htmlRaw.length,
  };
}

export function mergeTechStackResults(
  local: TechStackAuditResult,
  apiTools?: DetectedTechTool[] | null
): TechStackAuditResult {
  if (!apiTools?.length) return local;
  return {
    detectedTools: dedupeMerge(local.detectedTools, apiTools),
    htmlSampleLength: local.htmlSampleLength,
  };
}
