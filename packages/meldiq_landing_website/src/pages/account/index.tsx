import Link from "next/link";
import { useRouter } from "next/router";
import { AccountShell, LoadingCard } from "../../components/AccountShell";
import { InviteCard } from "../../components/InviteCard";
import { DaysLeft } from "../../components/Mojo";
import { dayCount, trialOf, useCatalog } from "../../lib/catalog";
import { useAuthedData, useRequireSession } from "../../components/useAccount";
import { billingNotDeployed, zEntitlements } from "../../lib/api";
import { describeGrant } from "../../lib/plans";
import { browserSession } from "../../lib/session";
import { SITE } from "../../lib/site";

/** The account's overview: who is signed in, and the plan the account has (GET /v2/billing/entitlements). */
export default function AccountHome() {
  const session = useRequireSession();
  const router = useRouter();
  const ent = useAuthedData(session, () => browserSession().authed("/v2/billing/entitlements", zEntitlements), "entitlements");
  const trial = trialOf(useCatalog());
  const free = ent.data?.personal.trial ?? null;
  // How long this kind of free period lasts now (for the bar); a gift or bonus has no fixed length.
  const freeLength = free?.source === "signup" ? (trial?.days ?? null) : free?.source === "invite" ? (trial?.referralDays ?? null) : null;

  return (
    <AccountShell title="Your account">
      {router.query.welcome ? (
        <div className="callout success" role="status">
          <p>
            Welcome to Meldiq! Your account is ready
            {router.query.invited ? `, and your invite gave you and your friend ${trial ? dayCount(trial.referralDays) : "free days"} of Meldiq Plus` : ""}.
            Open the app to start a community or join one.
          </p>
        </div>
      ) : null}
      <section className="card">
        <h1 style={{ fontSize: "1.7rem" }}>Your account</h1>
        {session ? (
          <dl className="kv">
            <dt>Name</dt>
            <dd>{session.account.name}</dd>
            <dt>Email</dt>
            <dd>{session.account.email}</dd>
          </dl>
        ) : (
          <div className="skeleton" />
        )}
        <p className="muted" style={{ marginTop: 16, marginBottom: 0 }}>
          Change your name, password, passkeys, two-step sign-in or signed-in sessions in the Meldiq app under Settings.{" "}
          <a href={SITE.webAppUrl}>Open Meldiq</a>
        </p>
      </section>

      {ent.loading && !ent.data ? <LoadingCard /> : null}
      {billingNotDeployed(ent.error) ? (
        <section className="card">
          <div className="row">
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Meldiq Plus</h2>
            <span className="badge">Free</span>
          </div>
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Your account is on the free tier. Meldiq Plus isn&apos;t on sale yet: <Link href="/pricing">see the prices</Link>.
          </p>
        </section>
      ) : ent.error ? (
        <div className="callout danger" role="alert">
          <p>{ent.error.message}</p>
          <button type="button" className="btn btn-secondary" onClick={ent.reload}>
            Try again
          </button>
        </div>
      ) : null}
      {ent.data ? (
        <section className="card">
          <div className="row">
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Your plan</h2>
            <span className={`badge ${ent.data.personal.plan ? "success" : ""}`}>{ent.data.personal.plan?.name ?? "Free"}</span>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            {describeGrant(ent.data.personal)}
          </p>
          {free ? <DaysLeft endsAt={free.endsAt} totalDays={freeLength} /> : null}
          {free ? (
            <p style={{ marginTop: 0 }}>
              Subscribe now and your first payment waits until these free days end. <Link href="/pricing">See Meldiq Plus</Link>
            </p>
          ) : null}
          <p style={{ marginBottom: 0 }}>
            It applies on every device signed in to this account. <Link href="/account/billing">Manage billing</Link>
          </p>
        </section>
      ) : null}

      <InviteCard session={session} />

      <section className="card">
        <h2 style={{ fontSize: "1.3rem" }}>Your data</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          You can delete your account from the Meldiq app (Settings › Account). Cancel any subscription first.{" "}
          <Link href="/legal/account-deletion">What deleting removes</Link>
        </p>
      </section>
    </AccountShell>
  );
}
