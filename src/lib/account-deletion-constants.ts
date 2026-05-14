/** Canonical phrase (display); matching is case-insensitive after trim. */
export const ACCOUNT_DELETION_CONFIRM_PHRASE = "DELETE MY ACCOUNT" as const;

export function deletionConfirmationMatches(input: string): boolean {
  return input.trim().toUpperCase() === ACCOUNT_DELETION_CONFIRM_PHRASE;
}
