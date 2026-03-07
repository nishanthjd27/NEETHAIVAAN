import crypto from "crypto";

/**
 * Generates a cryptographically secure, URL-safe raw tracking token.
 *
 * Returns BOTH:
 *  - rawToken  → sent to the citizen ONCE (never stored in DB)
 *  - tokenHash → SHA-256 hash stored in the Complaint document
 */
export function generateTrackingToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken  = crypto.randomBytes(32).toString("hex"); // 64-char hex string
  const tokenHash = hashTrackingToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Hashes a raw tracking token using SHA-256.
 * Call this when a citizen submits their token for a status lookup.
 *
 * @param rawToken - The plain token provided by the citizen
 * @returns  64-char hex SHA-256 digest
 */
export function hashTrackingToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}
