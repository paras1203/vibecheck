export type TechToolCategory =
  | "analytics"
  | "tag_manager"
  | "ads"
  | "heatmap"
  | "chat"
  | "other";

export type TechRegistryEntry = {
  id: string;
  name: string;
  category: TechToolCategory;
  /** Checked against lowercased raw HTML via substring includes */
  substrings?: string[];
  /** Optional regex on lowercased HTML */
  regexes?: RegExp[];
};

/** Substrings intentionally short to reduce false negatives; tighten if needed */
export const TECH_STACK_REGISTRY: TechRegistryEntry[] = [
  {
    id: "google-analytics-4",
    name: "Google Analytics (gtag)",
    category: "analytics",
    substrings: ["googletagmanager.com/gtag/js", "google-analytics.com/analytics"],
  },
  {
    id: "google-analytics-ua",
    name: "Universal Analytics legacy",
    category: "analytics",
    regexes: [/\bu\/aanalytics\.js\b/i, /google-analytics\.com\/analytics\.js/i],
  },
  {
    id: "google-tag-manager",
    name: "Google Tag Manager",
    category: "tag_manager",
    substrings: ["googletagmanager.com/gtm.js", "/ns.html?id=gtm-"],
  },
  {
    id: "meta-pixel",
    name: "Meta (Facebook) Pixel",
    category: "ads",
    substrings: ["connect.facebook.net", "fbevents.js", "fbq("],
  },
  {
    id: "microsoft-clarity",
    name: "Microsoft Clarity",
    category: "heatmap",
    substrings: ["clarity.ms/tag", "/clarity.js", "microsoft.com/clarity"],
  },
  {
    id: "hotjar",
    name: "Hotjar",
    category: "heatmap",
    substrings: ["static.hotjar.com", "hotjar.com", "hj("],
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "chat",
    substrings: ["widget.intercom.io", "intercomcdn.com", "intercom-settings"],
  },
  {
    id: "crisp",
    name: "Crisp",
    category: "chat",
    substrings: ["client.crisp.chat"],
  },
  {
    id: "hubspot-tracking",
    name: "HubSpot tracking",
    category: "analytics",
    substrings: ["js.hs-scripts.com", "js.hs-banner.com"],
  },
  {
    id: "linkedin-insight",
    name: "LinkedIn Insight Tag",
    category: "ads",
    substrings: ["snap.licdn.com/li.lms-analytics"],
  },
];
