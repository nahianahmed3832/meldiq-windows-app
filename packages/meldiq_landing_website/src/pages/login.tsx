import Link from "next/link";
import { useRouter } from "next/router";
import { type FormEvent, useState } from "react";
import { Field, FormError } from "../components/Field";
import { Layout } from "../components/Layout";
import { ApiError, endpoints } from "../lib/api";
import { browserSession } from "../lib/session";
import { SITE } from "../lib/site";
import { check, emailSchema, type FieldErrors, safeNext } from "../lib/validation";
import { z } from "zod";

type Key = "email" | "password";

/**
 * Signs in to the Meldiq account (POST /v2/auth/login, the same sign-in as every app). The session belongs to this tab
 * and has no device: it can manage the account's billing, not read messages (that's the web app's job).
 */
export default function Login() {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>({ email: "", password: "" });
  const [totp, setTotp] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors<Key>>({});
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: Key) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = check({ email: emailSchema, password: z.string().min(1, "Enter your password.") }, values);
    setErrors(found);
    setError(null);
    setUnverified(false);
    if (Object.keys(found).length > 0) return;
    if (totp !== null && totp.trim().length < 6) {
      setError("Enter the 6-digit code from your authenticator app, or a backup code.");
      return;
    }
    setBusy(true);
    try {
      const grant = await endpoints.login({ email: values.email.trim(), password: values.password, ...(totp ? { totpCode: totp.trim() } : {}) });
      browserSession().save(grant);
      void router.replace(safeNext(router.query.next));
    } catch (err) {
      setBusy(false);
      if (!(err instanceof ApiError)) return setError("You couldn't be signed in. Try again.");
      if (err.code === "totp_required") {
        setTotp("");
        return;
      }
      if (err.code === "email_unverified") setUnverified(true);
      setError(err.message);
    }
  }

  return (
    <Layout title="Sign in" description="Sign in to your Meldiq account to manage your subscription and billing." noindex>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Account &amp; billing sign-in</h1>
          <p className="muted">This sign-in is for managing your account and subscriptions. To access your messages, sign in to the Meldiq app.</p>
          <a className="btn btn-secondary btn-block" href={SITE.webAppUrl} style={{ marginBottom: 20 }}>
            Sign in to Meldiq
          </a>
          <form className="form" onSubmit={submit} noValidate>
            <Field label="Email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} error={errors.email} />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={set("password")}
              error={errors.password}
            />
            {totp !== null ? (
              <Field
                label="Two-step sign-in code"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                hint="Use your authenticator app or a backup code. This step does not send an email code."
                autoFocus
              />
            ) : null}
            <FormError message={error} />
            {unverified ? (
              <p>
                <Link href={`/verify-email?email=${encodeURIComponent(values.email.trim())}`}>Enter your verification code</Link>
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="form-foot">
            <Link href="/forgot-password">Forgot your password?</Link>
            <br />
            New to Meldiq? <Link href="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
