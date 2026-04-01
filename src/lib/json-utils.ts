/**
 * JSON repair utilities - 1:1 migration from main.py
 * These functions replicate the exact logic from Python repair_json and clean_json_text
 */

/**
 * Repair common JSON syntax errors.
 * Tries multiple strategies to fix malformed JSON, especially missing commas.
 * Exact 1:1 migration from main.py repair_json function (lines 703-765)
 */
export function repairJson(text: string, errorPos?: number): string {
  if (errorPos !== undefined && errorPos < text.length) {
    const startCtx = Math.max(0, errorPos - 100);
    const endCtx = Math.min(text.length, errorPos + 100);
    const context = text.substring(startCtx, endCtx);
    console.log(`[DEBUG] Error context (pos ${errorPos}): ${context}`);
  }

  let fixed = text;

  // Strategy 1: Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([}\]])/g, "$1");

  // Strategy 2: Fix missing comma after closing bracket before quote (CRITICAL - most common issue)
  // Pattern: ] "key": -> ], "key":  OR  ]\n    "key": -> ],\n    "key":
  fixed = fixed.replace(/\]\s+"(\w+)":/g, '], "$1":');
  fixed = fixed.replace(/\]\s*\n\s*"(\w+)":/g, '],\n    "$1":');

  // Strategy 3: Fix missing comma after closing quote before quote (array/object property)
  // Pattern: "value" "key": -> "value", "key":
  fixed = fixed.replace(/"\s+"(\w+)":/g, '", "$1":');

  // Strategy 4: Fix missing comma after closing brace/bracket before quote
  // Pattern: } "key": -> }, "key":  OR  ] "key": -> ], "key":
  fixed = fixed.replace(/([}\]])"(\w+)":/g, '$1, "$2":');

  // Strategy 5: Fix missing comma after string values with newlines
  // Pattern: "string"\n    "key": -> "string",\n    "key":
  fixed = fixed.replace(/"\s*\n\s*"(\w+)":/g, '",\n    "$1":');

  // Strategy 6: Fix missing comma after closing bracket before opening brace
  // Pattern: ] { -> ], {
  fixed = fixed.replace(/\]\s*{/g, "], {");

  // Strategy 7: Fix missing comma between array elements (after closing bracket)
  // Pattern: ]"key": -> ], "key":  (array ending before property)
  fixed = fixed.replace(/\]"(\w+)":/g, '], "$1":');

  // Strategy 8: Fix missing comma after number/boolean before quote
  // Pattern: 123 "key": -> 123, "key":  OR  true "key": -> true, "key":
  fixed = fixed.replace(/(\d+|true|false|null)\s+"(\w+)":/g, "$1, \"$2\":");

  // Strategy 9: Fix missing comma after closing quote before opening brace (nested objects)
  // Pattern: "value" { -> "value", {
  fixed = fixed.replace(/"\s*{/g, '", {');

  // Strategy 10: Fix missing comma after closing quote before opening bracket (nested arrays)
  // Pattern: "value" [ -> "value", [
  fixed = fixed.replace(/"\s*\[/g, '", [');

  // Strategy 11: Fix missing comma after closing quote in arrays (common pattern)
  // Pattern: "item"\n      "key": -> "item",\n      "key":
  fixed = fixed.replace(/"\s*\n\s+"(\w+)":/g, '",\n    "$1":');

  // Strategy 12: More aggressive - fix any quote-space-quote that looks like property boundary
  // But only if it's followed by a word and colon (property name pattern)
  fixed = fixed.replace(/(\")\s+(\")(\w+)":/g, '$1, $2$3":');

  return fixed;
}

/**
 * The 'Janitor' cleaner: strip Markdown formatting and extract clean JSON.
 * Removes markdown code blocks and extracts the JSON object using balanced braces.
 * Handles truncated JSON by finding the deepest complete JSON object.
 * Exact 1:1 migration from main.py clean_json_text function (lines 767-806)
 */
export function cleanJsonText(text: string): string {
  // Remove markdown code blocks
  text = text.replace(/```json/g, "").replace(/```/g, "");
  text = text.trim();

  // Find the first open bracket
  const start = text.indexOf("{");
  if (start === -1) {
    return text;
  }

  // Find the last close bracket that balances with the first {
  // This handles truncated JSON better than just finding last }
  let braceCount = 0;
  let lastBalancedBrace = -1;

  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") {
      braceCount += 1;
    } else if (text[i] === "}") {
      braceCount -= 1;
      if (braceCount === 0) {
        lastBalancedBrace = i;
        break; // Found the matching closing brace
      }
    }
  }

  // If we found a balanced JSON object, return it
  if (lastBalancedBrace !== -1) {
    return text.substring(start, lastBalancedBrace + 1);
  }

  // Fallback: if no balanced brace found, try to find last } (might be truncated)
  const end = text.lastIndexOf("}");
  if (end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }

  // Last resort: return from first { to end (truncated JSON - will be completed later)
  return text.substring(start);
}

/**
 * Safely convert an error to a string that can be displayed without Unicode encoding issues.
 * Exact 1:1 migration from main.py safe_error_message function (lines 3371-3386)
 */
export function safeErrorMessage(error: unknown, maxLength: number = 200): string {
  try {
    let errorStr = String(error);
    // Truncate if too long
    if (errorStr.length > maxLength) {
      errorStr = errorStr.substring(0, maxLength) + "...";
    }
    return errorStr;
  } catch {
    // If even cleaning fails, return a safe fallback
    return "An error occurred during processing. Please try again.";
  }
}

