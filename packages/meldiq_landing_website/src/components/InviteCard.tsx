import { useState } from "react";
import { useAuthedData } from "./useAccount";
import { zReferral } from "../lib/api";
import { formatDate } from "../lib/money";
import { inviteLink } from "../lib/referral";
import { browserSession, type StoredSession } from "../lib/session";
import { SITE } from "../lib/site";

/**
 * The account's personal invite link (GET /v2/billing/referral): a friend who signs up through it gets 30 days of Mojo
 * Plus, and so does this account, up to the yearly cap. Hidden while invite links aren't active (or the API predates them).
 */
export function InviteCard({ session }: { session: StoredSession | null }) {
  const ref = useAuthedData(session, () => browserSession().authed("/v2/billing/referral", zReferral), "referral");
  const [copied, setCopied] = useState(false);
  const r = ref.data;
  if (!r || !r.available) return null;
  const link = inviteLink(SITE.url, r.code);
  const left = Math.max(0, r.yearlyCapDays - r.bonusDaysThisYear);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="card" aria-labelledby="invite-heading">
      <h2 id="invite-heading" style={{ fontSize: "1.3rem" }}>
        Invite friends, get Mojo Plus free
      </h2>
      <p className="muted">
        When a friend creates their Meldiq account through your link, you both get {r.daysEach} days of Mojo Plus free. You can earn up to {r.yearlyCapDays}{" "}
        days a year this way.
      </p>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <input className="invite-link" readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-primary" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      {r.yearlyCapDays > 0 ? (
        <div className="meter" style={{ marginTop: 16 }} aria-hidden="true">
          <span style={{ width: `${Math.min(100, Math.round((r.bonusDaysThisYear / r.yearlyCapDays) * 100))}%` }} />
        </div>
      ) : null}
      <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: "0.92rem" }} aria-live="polite">
        {r.invited === 1 ? "1 friend has joined" : `${r.invited} friends have joined`} through your link. You&apos;ve earned {r.bonusDaysThisYear} of{" "}
        {r.yearlyCapDays} days this year{left === 0 ? `; new invites still give your friends their ${r.daysEach} days` : ""}. Counted over the last 12 months,
        as of {formatDate(Date.now())}.
      </p>
    </section>
  );
}
