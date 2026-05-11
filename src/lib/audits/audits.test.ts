import { beforeEach, describe, expect, it, vi } from "vitest";

import { deriveBehaviourToolsAdvice } from "@/lib/audits/behaviour-tools";
import { runMetaPreviewAudit } from "@/lib/audits/meta-preview-audit";
import { runOnPageSeoAudit } from "@/lib/audits/on-page-seo";
import { fetchPerformanceAuditResult } from "@/lib/audits/performance-pagespeed";
import { runPatternTechStackAudit } from "@/lib/audits/tech-stack-audit";

describe("runPatternTechStackAudit", () => {
  it("detects GTM and Clarity", () => {
    const html = `<html><head><script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXX"></script>
    <script src="https://www.clarity.ms/tag/abc"></script></head><body></body></html>`;
    const r = runPatternTechStackAudit(html);
    const ids = r.detectedTools.map((t) => t.id).sort();
    expect(ids).toContain("google-tag-manager");
    expect(ids).toContain("microsoft-clarity");
  });
});

describe("runOnPageSeoAudit", () => {
  it("flags single H1 and canonical host match", () => {
    const desc = "x".repeat(120);
    const html = `<!doctype html><html><head>
    <title>Good length title for landing page example here</title>
    <meta name="description" content="${desc}" />
    <link rel="canonical" href="https://example.com/page" />
    </head><body>
    <h1>Main</h1><h2>Sub</h2>
    <a href="/other">x</a><a href="https://other.com">out</a>
    <main><img src="/h.png" alt="Hero product" /></main>
    </body></html>`;
    const r = runOnPageSeoAudit(html, "https://example.com/page");
    expect(r.headingH1Count).toBe(1);
    expect(r.canonicalMatchesPageHost).toBe(true);
    expect(r.internalLinks).toBeGreaterThanOrEqual(1);
    expect(r.heroAltPresentLikely).toBe(true);
  });
});

describe("runMetaPreviewAudit", () => {
  it("surfaces missing OG tags", () => {
    const html =
      "<html><head><title>T</title><meta name=\"description\" content=\"D\" /></head><body></body></html>";
    const r = runMetaPreviewAudit(html, "https://x.com");
    expect(r.missingOgTitle).toBe(true);
    expect(r.serpPreviewText).toContain("T");
  });
});

describe("deriveBehaviourToolsAdvice", () => {
  it("recommends Clarity when no heatmap tools", () => {
    const r = deriveBehaviourToolsAdvice({ detectedTools: [], htmlSampleLength: 1 });
    expect(r.recommendBehaviourAnalytics).toBe(true);
  });
});

describe("fetchPerformanceAuditResult", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.PAGESPEED_API_KEY;
  });

  it("returns dual strategy summary when API responds", async () => {
    process.env.PAGESPEED_API_KEY = "test-key";
    const lh = {
      categories: { performance: { score: 0.9 } },
      audits: {
        "largest-contentful-paint": { displayValue: "1.0 s" },
        "interaction-to-next-paint": { displayValue: "120 ms" },
        "cumulative-layout-shift": { displayValue: "0.05" },
        "total-blocking-time": { displayValue: "50 ms" },
        "unused-javascript": {
          title: "Remove unused JavaScript",
          description: "desc",
          score: 0,
          details: { type: "opportunity", overallSavingsMs: 500 },
        },
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ lighthouseResult: lh }),
    } as Response);

    const r = await fetchPerformanceAuditResult("https://example.com");
    expect(r?.mobile?.performanceScore).toBe(90);
    expect(r?.desktop?.performanceScore).toBe(90);
    expect(r?.opportunities.length).toBeGreaterThan(0);
  });
});
