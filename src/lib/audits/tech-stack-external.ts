import { z } from "zod";

import type { DetectedTechTool } from "@/lib/audits/tech-stack-audit";
import type { TechToolCategory } from "@/lib/audits/tech-stack-registry";

const ToolRowSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

const ResponseEnvelope = z.object({
  tools: z.array(ToolRowSchema).optional(),
  technologies: z.array(ToolRowSchema).optional(),
  detected: z.array(ToolRowSchema).optional(),
});

function mapCategory(raw: string | undefined): TechToolCategory {
  const x = (raw || "").toLowerCase();
  if (x.includes("analytics")) return "analytics";
  if (x.includes("tag") || x.includes("manager")) return "tag_manager";
  if (x.includes("ad") || x.includes("marketing")) return "ads";
  if (x.includes("heatmap") || x.includes("session")) return "heatmap";
  if (x.includes("chat") || x.includes("support")) return "chat";
  return "other";
}

function rowToTool(r: z.infer<typeof ToolRowSchema>): DetectedTechTool | null {
  const id = r.id ?? r.slug;
  const name = r.name ?? id;
  if (!id || !name) return null;
  return {
    id: String(id).toLowerCase().replace(/\s+/g, "_"),
    name: String(name),
    category: mapCategory(r.category),
    confidence: r.confidence ?? "low",
  };
}

/**
 * Optional third-party tech detector. Requires `TECHSTACK_API_URL`; response shape best-effort.
 */
export async function fetchOptionalTechStackApi(
  auditedUrl: string
): Promise<DetectedTechTool[]> {
  const base = process.env.TECHSTACK_API_URL?.trim();
  if (!base) return [];

  try {
    const key = process.env.TECHSTACK_API_KEY?.trim();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    };

    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), 12_000);
    let res: Response;
    try {
      res = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: auditedUrl }),
        signal: ac.signal,
      });
    } finally {
      clearTimeout(tm);
    }

    if (!res.ok) return [];

    const jsonUnknown: unknown = await res.json().catch(() => null);
    if (jsonUnknown == null || typeof jsonUnknown !== "object") return [];

    const parsed = ResponseEnvelope.safeParse(jsonUnknown);
    if (!parsed.success) return [];

    const rows = [
      ...(parsed.data.tools ?? []),
      ...(parsed.data.technologies ?? []),
      ...(parsed.data.detected ?? []),
    ];
    const tools: DetectedTechTool[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const row = rowToTool(r);
      if (row != null && !seen.has(row.id)) {
        seen.add(row.id);
        tools.push(row);
      }
    }
    return tools;
  } catch {
    return [];
  }
}
