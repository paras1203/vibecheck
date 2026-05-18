# Firestore credits and profile semantics (repo audit)

Deployed **Security Rules are not tracked in this repository**. This document traces **repository codepaths** only so client behavior aligns with an intended model: **`users/{uid}`** holds **`credits`**, **`plan`**, identity fields; **trusted servers** mutate credits/plan during roast debit and checkout.

---

## Document shape (`users/{uid}`)

| Field | Type (client expectation) | Read (client) | Write (client) | Write (server / Admin) |
| --- | --- | --- | --- | --- |
| `uid` | string | `AuthContext` on create | Initial `setDoc` for **new** users only | Merge via Dodo verify if doc missing |
| `email` | string | Loaded with profile | Initial `setDoc` for **new** users only | Merge via Dodo verify if doc missing |
| `credits` | number (coerced) | `coerceUserCreditsFromDocument` | **No direct updates** after signup | **`debitRoastCreditsIfSufficient`**, **`refundRoastCredits`**, **Dodo `verify`** |
| `plan` | `"free"` \| `"pro"` \| `"agency"` | Normalized lowercase | **`setDoc` only initial `"free"`** | **Dodo `verify`** (merge after payment) |
| `displayName`, `photoURL` | optional strings | Firebase profile + doc | Initial `setDoc` | **`PATCH /api/user/profile`** (displayName merge + Auth) |
| `createdAt`, `updatedAt` | timestamps | — | `serverTimestamp()` on create | `Date` / `FieldValue` on server routes |

---

## Client: `AuthContext`

- **Read:** `getDoc(users/{uid})` on sign-in; sets `user.credits`, `user.plan`, **`firestoreSynced: true`** on success.
- **Create:** If no document, **`setDoc`** with `credits: newUserCreditsDefault()` (baseline **0** unless env / promo bonus), `plan: "free"`, timestamps.
- **Failure path:** `firestoreSynced: false`; credits fall back to placeholder or previous; sidebar uses **`creditsBalanceTitle`** → “Balance not confirmed with Firestore”.
- **Optimistic credit updates:** `updateCredits(n, { fromServer: true })` after **`/api/roast`** returns `creditsRemaining` (authoritative server debit). This sets **`firestoreSynced: true`** because the value came from the API that wrote Firestore. Without `{ fromServer: true }`, **`firestoreSynced` is unchanged** (reserved for future non-server callers).
- **Checkout:** `updateCreditsAndPlan` after **`/api/dodo/verify`** — still sets **`firestoreSynced: true`** (payment verification path).

---

## Server: roast credits

- **`lib/roast-credits-server.ts`:** `debitRoastCreditsIfSufficient` — transaction read/modify **`credits`**; `refundRoastCredits` — **`FieldValue.increment`**.
- **`/api/roast`** (not expanded here) should be the only path that debits for a full roast; client must not write `credits` directly.

---

## Server: Dodo verify

- **`app/api/dodo/verify/route.ts`:** Creates user stub if missing; runs transaction to add **`credits`**, upgrade **`plan`**, idempotent per **`payments/{paymentId}`**.

---

## Preview / free roast

- **`isPreviewRoastFree()`** (`credits-config`): when marketing preview does not use credits, UI copy reflects **0 credits** for that flow; server should match (env-driven).

---

## Action items (rules / ops, outside repo)

- Keep **rules** aligned with: clients may **read** own `users/{uid}`; **writes** to `credits`/`plan` only via **Admin SDK** (API routes) or tightly scoped rules if any.
- Consider committing a **`firestore.rules`** snapshot for CI diff review (optional).
