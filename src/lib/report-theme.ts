/**
 * Hex/rgba palette for Puppeteer PDFs, static HTML export, and SVG charts.
 * Keep in sync with src/app/globals.css (:root[data-theme="dark"] tokens).
 */
export const reportHex = {
  bg: "#0B0F17",
  surface: "#111827",
  surfaceMuted: "#151D2B",
  border: "rgba(255, 255, 255, 0.08)",
  foreground: "#E6EAF2",
  muted: "#94A3B8",
  primary: "#6366F1",
  primaryMuted: "#6366F1",
  accent: "#22D3EE",
  success: "#22C55E",
  warning: "#F59E0B",
  destructive: "#EF4444",
  foldLine: "#F59E0B",
  codeBg: "#0B0F17",
} as const;

export const reportFontsHref =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap";

/** Shared layout, typography utilities, cards, tables, print-break rules (HTML + PDF). */
export function getReportCoreStyles(): string {
  const h = reportHex;
  return `
    :root {
      --rs-xs: 6px;
      --rs-sm: 10px;
      --rs-md: 16px;
      --rs-lg: 24px;
      --rs-xl: 36px;
      --rs-2xl: 48px;
    }
    .report-mono,
    .report-figure {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
    }
    .report-cover-subtitle {
      font-family: Inter, system-ui, sans-serif;
      font-size: 1.125rem;
      font-weight: 500;
      color: ${h.muted};
      margin: 0 0 var(--rs-lg);
      letter-spacing: -0.01em;
    }
    .report-label {
      font-family: Inter, system-ui, sans-serif;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${h.muted};
      margin: 0 0 var(--rs-xs);
    }
    .report-eyebrow {
      font-size: 0.75rem;
      font-weight: 500;
      color: ${h.muted};
      margin-bottom: var(--rs-sm);
    }
    .report-prose {
      font-size: 1rem;
      line-height: 1.72;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
      text-wrap: pretty;
    }
    .report-prose p { margin: 0 0 var(--rs-md); }
    .report-prose p:last-child { margin-bottom: 0; }
    .report-nojustify {
      text-align: left;
      hyphens: none;
      -webkit-hyphens: none;
    }
    .report-card,
    .insight-card,
    .quick-win,
    .locked-section,
    .chart-box {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-card {
      background: ${h.surface};
      border: 1px solid ${h.border};
      border-radius: 10px;
      padding: var(--rs-md) var(--rs-lg);
      margin: var(--rs-md) 0;
    }
    .report-card--accent {
      border-left: 3px solid ${h.primary};
      background: ${h.surface};
    }
    .report-card__title {
      font-family: Inter, system-ui, sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: ${h.foreground};
      margin: 0 0 var(--rs-sm);
      line-height: 1.35;
    }
    .report-card__index {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.875rem;
      font-weight: 600;
      color: ${h.primary};
      margin-bottom: var(--rs-xs);
    }
    .insight-card {
      margin-bottom: var(--rs-md);
      padding: var(--rs-md);
      border: 1px solid ${h.border};
      border-radius: 10px;
      background: ${h.surface};
    }
    .insight-card__head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--rs-sm);
      flex-wrap: wrap;
      margin-bottom: var(--rs-sm);
    }
    .insight-card__name {
      font-family: Inter, system-ui, sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: ${h.foreground};
    }
    .insight-priority {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid ${h.border};
      color: ${h.muted};
      font-weight: 600;
    }
    .insight-compare {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--rs-xs) var(--rs-md);
      font-size: 0.875rem;
      margin: var(--rs-sm) 0;
      color: ${h.muted};
    }
    .insight-compare .report-figure {
      font-weight: 700;
      color: ${h.foreground};
    }
    .insight-signals-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${h.muted};
      margin-top: var(--rs-md);
      margin-bottom: var(--rs-xs);
    }
    .insight-signals {
      margin: 0;
      padding-left: 1.15rem;
      font-size: 0.875rem;
      line-height: 1.55;
      color: ${h.foreground};
    }
    .insight-sub {
      width: 100%;
      border-collapse: collapse;
      margin-top: var(--rs-md);
      font-size: 0.8125rem;
    }
    .insight-sub th,
    .insight-sub td {
      border: 1px solid ${h.border};
      padding: 8px 10px;
      text-align: left;
    }
    .insight-sub th {
      background: ${h.surfaceMuted};
      font-weight: 600;
      color: ${h.foreground};
    }
    .insight-sub td:nth-child(2),
    .insight-sub td:nth-child(3) {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      text-align: center;
    }
    .scenario-row {
      flex: 1;
      min-width: 112px;
      padding: var(--rs-sm) var(--rs-sm);
      text-align: center;
      border: 1px solid ${h.border};
      border-radius: 8px;
      background: ${h.surfaceMuted};
    }
    .scenario-row__label {
      font-size: 0.7rem;
      color: ${h.muted};
    }
    .scenario-row__amt {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 1.125rem;
      font-weight: 700;
      margin: 4px 0;
      color: ${h.foreground};
    }
    .scenario-row__rate {
      font-size: 0.65rem;
      color: ${h.muted};
    }
    .chart-block {
      margin-bottom: var(--rs-lg);
    }
    .chart-block:last-child {
      margin-bottom: 0;
    }
    .chart-box {
      display: flex;
      justify-content: center;
      padding: var(--rs-md);
      background: ${h.surface};
      border-radius: 10px;
      border: 1px solid ${h.border};
      margin-bottom: 0;
    }
    .chart-block:last-child .chart-box { margin-bottom: 0; }
    .chart-block__title {
      font-family: Inter, system-ui, sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      color: ${h.foreground};
      margin: 0 0 var(--rs-xs);
    }
    .chart-block__caption {
      font-size: 0.75rem;
      color: ${h.muted};
      line-height: 1.5;
      margin: var(--rs-sm) 0 0;
      text-align: left;
    }
    table.matrix,
    table.report-matrix {
      width: 100%;
      border-collapse: collapse;
      margin-top: var(--rs-md);
    }
    table.matrix th,
    table.matrix td,
    table.report-matrix th,
    table.report-matrix td {
      border: 1px solid ${h.border};
      padding: 10px 12px;
      text-align: left;
    }
    table.matrix th,
    table.report-matrix th {
      background: ${h.surfaceMuted};
      font-weight: 600;
      font-size: 0.8125rem;
    }
    table.matrix tr,
    table.report-matrix tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    table.matrix td:first-child,
    table.report-matrix td:first-child {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-weight: 600;
      color: ${h.primary};
    }
    table.report-matrix thead {
      display: table-header-group;
    }
    .report-verdict {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: ${h.primary};
      margin: var(--rs-md) 0 var(--rs-xs);
    }
    .report-head {
      border-bottom: 1px solid ${h.border};
      padding-bottom: var(--rs-md);
      margin-bottom: var(--rs-xl);
    }
    .report-meta {
      color: ${h.muted};
      font-size: 0.875rem;
      text-align: left;
    }
    .intel-micro {
      font-size: 0.6875rem;
      line-height: 1.45;
      color: ${h.muted};
      opacity: 0.92;
      margin-top: var(--rs-sm);
      max-width: 36rem;
      text-align: left;
    }
    h1, h2, h3 {
      font-family: Inter, system-ui, sans-serif;
      break-after: avoid;
      page-break-after: avoid;
    }
    h2 {
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    h3 {
      font-weight: 600;
      font-size: 1rem;
      color: ${h.foreground};
      margin-top: var(--rs-lg);
      margin-bottom: var(--rs-sm);
    }
    .report-section-head {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section {
      background: ${h.surface};
      border: 1px solid ${h.border};
      padding: var(--rs-lg);
      border-radius: 10px;
      margin: var(--rs-lg) 0;
    }
    .section.insight-layers {
      padding: var(--rs-lg);
    }
    .quick-win {
      background: ${h.surface};
      border: 1px solid ${h.border};
      border-left: 3px solid ${h.primary};
      padding: var(--rs-md);
      border-radius: 10px;
      margin: var(--rs-md) 0;
    }
    .locked-section {
      background: ${h.surface};
      padding: var(--rs-xl);
      border-radius: 10px;
      margin: var(--rs-lg) 0;
      text-align: center;
      border: 1px dashed ${h.border};
      color: ${h.muted};
    }
    pre {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.8125rem;
      background: ${h.codeBg};
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid ${h.border};
      text-align: left;
      white-space: pre-wrap;
      word-break: break-word;
    }
    small, .muted { color: ${h.muted}; }
  `;
}

/** Scrollable HTML export + browser print. */
export function getReportEmbedStyles(): string {
  const h = reportHex;
  return `
    ${getReportCoreStyles()}
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body {
      font-family: Inter, system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--rs-lg) 28px var(--rs-2xl);
      background: ${h.bg};
      color: ${h.foreground};
      font-size: 1rem;
      line-height: 1.7;
    }
    h1 {
      color: ${h.primary};
      font-size: 1.75rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: var(--rs-xs);
    }
    .report-cover h1.report-cover-brand {
      font-size: 2.25rem;
      font-weight: 700;
    }
    h2 {
      color: ${h.foreground};
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: var(--rs-2xl);
      margin-bottom: var(--rs-md);
      border-bottom: 1px solid ${h.border};
      padding-bottom: var(--rs-sm);
      letter-spacing: -0.02em;
    }
    .report-body > .report-major:first-child h2 {
      margin-top: var(--rs-xl);
    }
    .score {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 2.75rem;
      font-weight: 700;
      color: ${h.primary};
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .score--semantic { color: inherit; }
    .score .score-suffix {
      font-size: 0.38em;
      color: ${h.muted};
      font-weight: 600;
    }
    .report-cover {
      text-align: center;
      padding: var(--rs-xl) var(--rs-md);
      margin-bottom: var(--rs-xl);
      border-bottom: 1px solid ${h.border};
    }
    .report-cover .score {
      margin: var(--rs-md) 0;
    }
    .report-cover .report-meta {
      text-align: center;
    }
    .report-cover .intel-micro {
      margin-left: auto;
      margin-right: auto;
    }
    .report-major {
      margin-bottom: var(--rs-2xl);
    }
    footer.meta {
      margin-top: var(--rs-2xl);
      padding-top: var(--rs-md);
      border-top: 1px solid ${h.border};
      font-size: 0.75rem;
      color: ${h.muted};
      text-align: center;
    }
  `;
}

/** Puppeteer PDF: full-bleed pages, section page breaks. */
export function getReportPdfStyles(): string {
  const h = reportHex;
  return `
    ${getReportCoreStyles()}
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      .report-page { page-break-after: always; }
      .report-page:last-of-type { page-break-after: auto; }
    }
    body {
      width: 100%;
      background: ${h.bg};
      color: ${h.foreground};
      font-family: Inter, system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.72;
    }
    .report-page {
      padding: 44px 36px 48px;
      background: ${h.bg};
      border-bottom: 1px solid ${h.border};
    }
    h1 {
      color: ${h.primary};
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 1.375rem;
      font-weight: 600;
      margin: 0 0 var(--rs-md);
      padding-bottom: var(--rs-sm);
      border-bottom: 1px solid ${h.border};
      color: ${h.foreground};
    }
    h3 {
      font-size: 1.0625rem;
      margin-top: var(--rs-lg);
      margin-bottom: var(--rs-sm);
    }
    .report-pdf-footer {
      padding: var(--rs-xl) 36px;
      text-align: center;
      font-size: 0.75rem;
      color: ${h.muted};
      line-height: 1.5;
    }
    .report-pdf-footer p { margin: 0.25em 0; }
    .report-page > h2:first-child {
      margin-top: 0;
    }
    .report-page > .section {
      margin-top: 0;
    }
    .report-cover-pdf {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }
    .report-cover-pdf h1 {
      font-size: 56px;
      margin-bottom: var(--rs-md);
    }
    .score {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
    }
    .report-cover-pdf .score {
      font-size: 96px;
      font-weight: 700;
      line-height: 1;
      margin: var(--rs-md) 0;
    }
    .report-cover-pdf .score .score-suffix {
      font-size: 28px;
      font-weight: 600;
      color: ${h.muted};
    }
    .report-cover-pdf .intel-micro {
      margin-left: auto;
      margin-right: auto;
      max-width: 440px;
      text-align: center;
    }
    .report-deep-dive-body > h3:first-of-type {
      margin-top: 0;
    }
  `;
}
