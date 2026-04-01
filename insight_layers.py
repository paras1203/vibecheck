"""
Insight layers for SiteRoast: revenue scenarios + AI-scored executive layers.
Mirrors src/lib/insight-layers.ts behavior for Python / Streamlit.
"""
import json
import re

REVENUE_LIFT_BASE = 0.02
REVENUE_LIFT_LOW = 0.01
REVENUE_LIFT_HIGH = 0.035

REVENUE_LEAK_DISCLAIMER = (
    "Illustrative estimate only—not a guarantee of results. "
    "Actual outcomes depend on traffic quality, offer, and execution."
)

REVENUE_LEAK_METHODOLOGY = (
    "Annual revenue at risk is modeled as monthly sessions × assumed incremental conversion rate "
    "× average order value × 12 months. Low, base, and high use different uplift assumptions; "
    "base uses the standard 2% incremental conversion benchmark."
)

REVENUE_LEAK_ASSUMPTIONS = [
    "Monthly sessions and average order value come from the calculator inputs (defaults: 1,000 sessions, $50 AOV unless changed).",
    "Uplift is interpreted as incremental conversion rate (not additive revenue percentage).",
    "Scenarios bracket uncertainty; base matches the product's historical 2% benchmark.",
]

INSIGHT_LAYERS_SYSTEM_PROMPT = """You are a senior conversion consultant. Output concise, precise JSON only. Tone: professional, neutral, actionable—no hype, jokes, or dramatic language.

Scoring: integers 0–100 only for current and proposed. proposed must be >= current unless the impact text explicitly explains a staged rollback (rare); prefer proposed >= current.

Return ONLY valid JSON matching this shape (no markdown):
{
  "firstImpressionScore": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "headlineClarity": { "current": 0, "proposed": 0, "impact": "short" },
      "ctaVisibility": { "current": 0, "proposed": 0, "impact": "short" },
      "visualHierarchy": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  },
  "trustGapIndex": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "testimonials": { "current": 0, "proposed": 0, "impact": "short" },
      "guarantees": { "current": 0, "proposed": 0, "impact": "short" },
      "proof": { "current": 0, "proposed": 0, "impact": "short" },
      "perceivedRisk": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  },
  "messagingClarityScore": {
    "layerSummary": "1-2 sentences",
    "composite": { "current": 0, "proposed": 0, "impact": "one sentence" },
    "subscores": {
      "valueProposition": { "current": 0, "proposed": 0, "impact": "short" },
      "readability": { "current": 0, "proposed": 0, "impact": "short" },
      "specificity": { "current": 0, "proposed": 0, "impact": "short" }
    },
    "highPrioritySignals": ["2-4 short items"]
  }
}

Do not include priority fields; the client derives priority from composite.current."""


def build_revenue_leak_estimate(default_traffic=1000, default_price=50):
    def annual(rate):
        return default_traffic * rate * default_price * 12

    return {
        "disclaimer": REVENUE_LEAK_DISCLAIMER,
        "methodology": REVENUE_LEAK_METHODOLOGY,
        "assumptions": list(REVENUE_LEAK_ASSUMPTIONS),
        "scenarios": {
            "low": {"label": "Low scenario (conservative uplift)", "conversionUpliftRate": REVENUE_LIFT_LOW},
            "base": {"label": "Base scenario (standard benchmark)", "conversionUpliftRate": REVENUE_LIFT_BASE},
            "high": {"label": "High scenario (stronger uplift)", "conversionUpliftRate": REVENUE_LIFT_HIGH},
        },
        "annualLeakUsdDefaults": {
            "low": annual(REVENUE_LIFT_LOW),
            "base": annual(REVENUE_LIFT_BASE),
            "high": annual(REVENUE_LIFT_HIGH),
        },
    }


def extract_raw_content_insight(html_source, text_content):
    h1_text = ""
    try:
        m = re.search(r"<h1[^>]*>([^<]+)</h1>", html_source, re.I)
        if m:
            h1_text = re.sub(r"\s+", " ", m.group(1).strip())
    except Exception:
        pass

    button_texts = []
    try:
        for m in re.finditer(
            r"<(?:button|a)[^>]*(?:class|role)=[\"'][^\"']*button[^\"']*[\"'][^>]*>([^<]+)</(?:button|a)>",
            html_source,
            re.I,
        ):
            t = re.sub(r"\s+", " ", m.group(1).strip())
            if t and len(t) < 100:
                button_texts.append(t)
            if len(button_texts) >= 5:
                break
        if not button_texts:
            for m in re.finditer(r"<button[^>]*>([^<]+)</button>", html_source, re.I):
                t = re.sub(r"\s+", " ", m.group(1).strip())
                if t and len(t) < 100:
                    button_texts.append(t)
                if len(button_texts) >= 5:
                    break
    except Exception:
        pass

    first_paragraph = ""
    try:
        m = re.search(r"<p[^>]*>([^<]{50,300})</p>", html_source, re.I)
        if m:
            first_paragraph = re.sub(r"\s+", " ", m.group(1).strip())
    except Exception:
        pass

    hero_text = ""
    try:
        hero_text = re.sub(r"\s+", " ", (text_content or "")[:300].strip())
    except Exception:
        pass

    return {
        "h1Text": h1_text,
        "buttonTexts": button_texts[:5],
        "heroText": hero_text,
        "firstParagraph": first_paragraph,
    }


def _clamp_score(n):
    try:
        x = float(n)
        if x != x:
            x = 50.0
    except (TypeError, ValueError):
        x = 50.0
    return max(0, min(100, int(round(x))))


def _priority_from_composite(current):
    if current < 45:
        return "high"
    if current < 70:
        return "medium"
    return "low"


def _normalize_triple(raw, fallback_current):
    if not isinstance(raw, dict):
        raw = {}
    current = _clamp_score(raw.get("current", fallback_current))
    proposed = _clamp_score(raw.get("proposed", current + 10))
    impact = raw.get("impact")
    if not isinstance(impact, str) or not impact.strip():
        impact = "Address gaps surfaced in the detailed audit to lift clarity and conversion."
    else:
        impact = impact.strip()
    if proposed < current:
        proposed = current
    return {"current": current, "proposed": proposed, "impact": impact}


def _normalize_layer(raw, sub_keys, radar_blend):
    if not isinstance(raw, dict):
        raw = {}
    composite = _normalize_triple(raw.get("composite"), radar_blend)
    subscores = {}
    subs = raw.get("subscores") or {}
    if not isinstance(subs, dict):
        subs = {}
    for key in sub_keys:
        subscores[key] = _normalize_triple(subs.get(key), composite["current"])
    sigs = raw.get("highPrioritySignals")
    if isinstance(sigs, list):
        hp = [str(s).strip() for s in sigs if isinstance(s, str) and str(s).strip()][:4]
    else:
        hp = []
    ls = raw.get("layerSummary")
    if isinstance(ls, str) and ls.strip():
        layer_summary = ls.strip()
    else:
        layer_summary = "Derived from audit signals; see detailed findings for evidence."
    return {
        "layerSummary": layer_summary,
        "priority": _priority_from_composite(composite["current"]),
        "composite": composite,
        "subscores": subscores,
        "highPrioritySignals": hp,
    }


def fallback_insight_layers(radar_metrics):
    rm = radar_metrics or {}
    copy = rm.get("copy", 50)
    visuals = rm.get("visuals", 50)
    conversion = rm.get("conversion", 50)
    trust = rm.get("trust", 50)
    first_blend = int(round((copy + visuals + conversion) / 3))
    trust_blend = trust
    msg_blend = int(round((copy + conversion) / 2))

    def neutral(c):
        return {
            "current": c,
            "proposed": min(100, c + 12),
            "impact": "Prioritize fixes in the detailed audit; projected scores assume implementation of recommended changes.",
        }

    fi = _normalize_layer(None, ["headlineClarity", "ctaVisibility", "visualHierarchy"], first_blend)
    fi["subscores"] = {
        "headlineClarity": neutral(fi["composite"]["current"]),
        "ctaVisibility": neutral(max(0, fi["composite"]["current"] - 5)),
        "visualHierarchy": neutral(max(0, fi["composite"]["current"] - 3)),
    }
    fi["highPrioritySignals"] = [
        "Validate hero headline against primary offer",
        "Confirm primary CTA visibility above the fold",
    ]

    tg = _normalize_layer(None, ["testimonials", "guarantees", "proof", "perceivedRisk"], trust_blend)
    tg["subscores"] = {
        "testimonials": neutral(tg["composite"]["current"]),
        "guarantees": neutral(max(0, tg["composite"]["current"] - 4)),
        "proof": neutral(max(0, tg["composite"]["current"] - 2)),
        "perceivedRisk": neutral(max(0, 100 - tg["composite"]["current"])),
    }
    tg["highPrioritySignals"] = [
        "Strengthen proof points (logos, outcomes, credentials)",
        "Surface guarantees or risk-reversal where appropriate",
    ]

    mc = _normalize_layer(None, ["valueProposition", "readability", "specificity"], msg_blend)
    mc["subscores"] = {
        "valueProposition": neutral(mc["composite"]["current"]),
        "readability": neutral(max(0, mc["composite"]["current"] - 5)),
        "specificity": neutral(max(0, mc["composite"]["current"] - 4)),
    }
    mc["highPrioritySignals"] = [
        "Tighten value proposition in one clear line",
        "Replace vague claims with specific outcomes",
    ]

    return {
        "firstImpressionScore": fi,
        "trustGapIndex": tg,
        "messagingClarityScore": mc,
    }


def merge_insight_layers_from_ai(parsed, radar_metrics):
    fb = fallback_insight_layers(radar_metrics)
    if not isinstance(parsed, dict):
        return fb

    def merge_first():
        raw = parsed.get("firstImpressionScore")
        if not isinstance(raw, dict):
            raw = {}
        base = _normalize_layer(
            raw, ["headlineClarity", "ctaVisibility", "visualHierarchy"], fb["firstImpressionScore"]["composite"]["current"]
        )
        subs = raw.get("subscores") or {}
        if not isinstance(subs, dict):
            subs = {}
        base["subscores"] = {
            "headlineClarity": _normalize_triple(subs.get("headlineClarity"), base["composite"]["current"]),
            "ctaVisibility": _normalize_triple(subs.get("ctaVisibility"), base["composite"]["current"]),
            "visualHierarchy": _normalize_triple(subs.get("visualHierarchy"), base["composite"]["current"]),
        }
        if not base["highPrioritySignals"]:
            base["highPrioritySignals"] = fb["firstImpressionScore"]["highPrioritySignals"]
        ls = raw.get("layerSummary")
        if isinstance(ls, str) and ls.strip():
            base["layerSummary"] = ls.strip()
        base["priority"] = _priority_from_composite(base["composite"]["current"])
        return base

    def merge_trust():
        raw = parsed.get("trustGapIndex")
        if not isinstance(raw, dict):
            raw = {}
        base = _normalize_layer(
            raw, ["testimonials", "guarantees", "proof", "perceivedRisk"], fb["trustGapIndex"]["composite"]["current"]
        )
        subs = raw.get("subscores") or {}
        if not isinstance(subs, dict):
            subs = {}
        base["subscores"] = {
            "testimonials": _normalize_triple(subs.get("testimonials"), base["composite"]["current"]),
            "guarantees": _normalize_triple(subs.get("guarantees"), base["composite"]["current"]),
            "proof": _normalize_triple(subs.get("proof"), base["composite"]["current"]),
            "perceivedRisk": _normalize_triple(subs.get("perceivedRisk"), base["composite"]["current"]),
        }
        if not base["highPrioritySignals"]:
            base["highPrioritySignals"] = fb["trustGapIndex"]["highPrioritySignals"]
        ls = raw.get("layerSummary")
        if isinstance(ls, str) and ls.strip():
            base["layerSummary"] = ls.strip()
        base["priority"] = _priority_from_composite(base["composite"]["current"])
        return base

    def merge_msg():
        raw = parsed.get("messagingClarityScore")
        if not isinstance(raw, dict):
            raw = {}
        base = _normalize_layer(
            raw, ["valueProposition", "readability", "specificity"], fb["messagingClarityScore"]["composite"]["current"]
        )
        subs = raw.get("subscores") or {}
        if not isinstance(subs, dict):
            subs = {}
        base["subscores"] = {
            "valueProposition": _normalize_triple(subs.get("valueProposition"), base["composite"]["current"]),
            "readability": _normalize_triple(subs.get("readability"), base["composite"]["current"]),
            "specificity": _normalize_triple(subs.get("specificity"), base["composite"]["current"]),
        }
        if not base["highPrioritySignals"]:
            base["highPrioritySignals"] = fb["messagingClarityScore"]["highPrioritySignals"]
        ls = raw.get("layerSummary")
        if isinstance(ls, str) and ls.strip():
            base["layerSummary"] = ls.strip()
        base["priority"] = _priority_from_composite(base["composite"]["current"])
        return base

    return {
        "firstImpressionScore": merge_first(),
        "trustGapIndex": merge_trust(),
        "messagingClarityScore": merge_msg(),
    }


def generate_insight_layers_with_model(
    model,
    html_source,
    text_content,
    all_items,
    radar_metrics,
    radar_categories,
    clean_json_text,
    repair_json,
    safe_error_message,
    log_warn=print,
):
    """
    Returns (revenue_leak_estimate, first_impression, trust_gap, messaging_clarity) dicts.
    """
    revenue = build_revenue_leak_estimate(1000, 50)
    fb = fallback_insight_layers(radar_metrics)
    if not all_items:
        return revenue, fb["firstImpressionScore"], fb["trustGapIndex"], fb["messagingClarityScore"]

    try:
        raw_c = extract_raw_content_insight(html_source, text_content)
        radar_summary = ", ".join(f"{c}: {radar_metrics.get(c, 50)}" for c in radar_categories)
        failed = [
            item for item in all_items
            if item.get("status") in ("Failed", "Needs Improvement")
        ]
        lines = []
        for item in failed[:15]:
            name = item.get("elementName") or "Item"
            st = item.get("status") or ""
            lines.append(f"- {name}: {st}")
        audit_dump = "\n".join(lines) if lines else "No failed items; infer from radar and raw content."

        btn_lbl = ", ".join(f'"{t}"' for t in raw_c["buttonTexts"]) if raw_c["buttonTexts"] else "(none parsed)"
        raw_block = f"""RAW PAGE SIGNALS:
- H1: "{raw_c['h1Text'] or '(not found)'}"
- Button labels: {btn_lbl}
- Hero text (truncated): "{raw_c['heroText'][:280]}"
- First paragraph (truncated): "{raw_c['firstParagraph'][:200]}"
"""

        user_prompt = f"""Radar scores (0-100): {radar_summary}

Audit items needing attention:
{audit_dump}

{raw_block}

Return JSON only per the schema."""

        response = model.generate_content(
            INSIGHT_LAYERS_SYSTEM_PROMPT + "\n\n" + user_prompt,
            generation_config={
                "temperature": 0.45,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4096,
                "response_mime_type": "application/json",
            },
        )
        text = response.text.strip()
        text = clean_json_text(text)
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as e:
            fixed = repair_json(text, getattr(e, "pos", None))
            parsed = json.loads(fixed)

        merged = merge_insight_layers_from_ai(parsed, radar_metrics)
        return revenue, merged["firstImpressionScore"], merged["trustGapIndex"], merged["messagingClarityScore"]
    except Exception as e:
        log_warn(f"[WARN] Insight layers generation failed: {safe_error_message(e)}")
        return revenue, fb["firstImpressionScore"], fb["trustGapIndex"], fb["messagingClarityScore"]
