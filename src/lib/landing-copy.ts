export function getRoastInputMicrocopy(): string {
  const v = process.env.NEXT_PUBLIC_ROAST_INPUT_MICROCOPY?.trim();
  return v && v.length > 0 ? v : "";
}
