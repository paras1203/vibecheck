const planRank: Record<string, number> = { free: 0, pro: 1, agency: 2 };

export function mergePlanAfterPurchase(
  previous: string | undefined,
  purchased: "pro" | "agency"
): "pro" | "agency" {
  const prev = previous === "pro" || previous === "agency" ? previous : "free";
  if (prev === "free") return purchased;
  return (planRank[prev] >= planRank[purchased] ? prev : purchased) as "pro" | "agency";
}
