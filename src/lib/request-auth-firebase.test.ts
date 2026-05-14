import { describe, expect, it } from "vitest";
import { firebaseBearerUnauthorizedPayload } from "@/lib/firebase-bearer-unauthorized-payload";

describe("firebaseBearerUnauthorizedPayload", () => {
  it("maps missing_token", () => {
    const p = firebaseBearerUnauthorizedPayload(new Error("Unauthorized:missing_token"));
    expect(p?.error).toBe("Unauthorized");
    expect(p?.details).toMatch(/not sent/i);
  });

  it("maps invalid_token with custom hint", () => {
    const p = firebaseBearerUnauthorizedPayload(
      new Error("Unauthorized:invalid_token:Your session expired."),
    );
    expect(p?.details).toBe("Your session expired.");
  });

  it("returns null for unrelated errors", () => {
    expect(firebaseBearerUnauthorizedPayload(new Error("boom"))).toBeNull();
    expect(firebaseBearerUnauthorizedPayload(null)).toBeNull();
  });
});
