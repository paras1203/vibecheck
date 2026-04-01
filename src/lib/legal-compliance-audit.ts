export function auditElementLabel(item: { elementName?: string; element?: string }): string {
  return (item.elementName || item.element || "").trim();
}

export function isDeprioritizedLegalAuditElement(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (n === "legal compliance" || n.includes("legal compliance")) return true;
  if (n.includes("cookie policy") || n.includes("gdpr")) return true;
  if (
    n === "privacy policy" ||
    n === "terms & conditions" ||
    n === "terms and conditions" ||
    n === "disclaimer" ||
    n.includes("disclaimers")
  ) {
    return true;
  }
  return false;
}

export function partitionLegalComplianceAuditLast<
  T extends { elementName?: string; element?: string },
>(items: T[]): T[] {
  const primary: T[] = [];
  const legalish: T[] = [];
  for (const item of items) {
    if (isDeprioritizedLegalAuditElement(auditElementLabel(item))) legalish.push(item);
    else primary.push(item);
  }
  return [...primary, ...legalish];
}
