import { ApiError, zReferralClaimed } from "./api";
import type { SessionStore } from "./session";

/**
 * Invite links: https://meldiq.app/signup?ref=CODE. The code isn't a secret (it's meant to be shared): it's kept in this
 * tab's sessionStorage from the sign-up form until the new account has verified its address and signed in, then claimed
 * once (POST /v2/billing/referral/claim). The server decides everything: whether the code exists, whether this account
 * is new enough, and how many days each person gets.
 */
const KEY = "meldiq.site.ref";
const CODE = /^[A-Za-z0-9]{6,20}$/;

export function inviteLink(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/$/, "")}/signup?ref=${encodeURIComponent(code)}`;
}

/** A well-formed invite code from the address's ?ref=, else null. */
export function refFromQuery(value: unknown): string | null {
  return typeof value === "string" && CODE.test(value.trim()) ? value.trim().toUpperCase() : null;
}

export function rememberRef(code: string): void {
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    // No storage: the invite just isn't remembered past this page.
  }
}

export function pendingRef(): string | null {
  try {
    return refFromQuery(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function forgetRef(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
}

export type ClaimResult = { claimed: true; endsAt: number } | { claimed: false; reason: string } | null;

/** Claims the remembered invite for the signed-in account (once). null: there was none to claim. */
export async function claimPendingRef(session: SessionStore): Promise<ClaimResult> {
  const code = pendingRef();
  if (!code) return null;
  try {
    const r = await session.authed("/v2/billing/referral/claim", zReferralClaimed, { method: "POST", body: { code } });
    forgetRef();
    return { claimed: true, endsAt: r.inviteeEndsAt };
  } catch (e) {
    // The server's answer stands (unknown code, account not new, already claimed): don't try again.
    if (e instanceof ApiError && e.code !== "network") forgetRef();
    return { claimed: false, reason: e instanceof ApiError ? e.message : "The invite couldn't be applied." };
  }
}
