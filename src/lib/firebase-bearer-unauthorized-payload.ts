/** Maps requireFirebaseBearerUid failures to API JSON (no server-only / Firebase imports). */
export function firebaseBearerUnauthorizedPayload(error: unknown): {
  error: string;
  details: string;
} | null {
  if (!(error instanceof Error)) return null;
  const msg = error.message;
  if (msg.startsWith("Unauthorized:missing_token")) {
    return {
      error: "Unauthorized",
      details: "Sign-in token was not sent. Refresh the page and try again.",
    };
  }
  if (msg.startsWith("Unauthorized:invalid_token:")) {
    return {
      error: "Unauthorized",
      details: msg.slice("Unauthorized:invalid_token:".length),
    };
  }
  if (msg.startsWith("Unauthorized")) {
    return {
      error: "Unauthorized",
      details:
        "Your sign-in token could not be verified. Try refreshing, or sign out and back in. For dev: ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY match the Firebase project used in the app (same project id as NEXT_PUBLIC_FIREBASE_* / FIREBASE_WEB_*).",
    };
  }
  return null;
}
