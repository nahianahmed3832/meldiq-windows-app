import Link from "next/link";
import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";
import { Field, FormError } from "../components/Field";
import { Layout } from "../components/Layout";
import { ApiError, endpoints } from "../lib/api";
import { takeSignupPassword } from "../lib/pendingSignup";
import { claimPendingRef } from "../lib/referral";
import { browserSession } from "../lib/session";
import { check, codeSchema, emailSchema, type FieldErrors, passwordSchema } from "../lib/validation";

type Key = "email" | "code" | "password";

/** Verifies the address with the emailed code, then signs in (the account API needs a verified address to sign in). */
export default function VerifyEmail() {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>({ email: "", code: "", password: "" });
  const [knownPassword, setKnownPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<Key>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const email = typeof router.query.email === "string" ? router.query.email : "";
    const password = email ? takeSignupPassword(email) : null;
    setValues((v) => ({ ...v, email, password: password ?? "" }));
    setKnownPassword(!!password);
  }, [router.isReady, router.query.email]);

  const set = (k: Key) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = check({ email: emailSchema, code: codeSchema, password: passwordSchema }, values);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await endpoints.verifyEmail({ email: values.email.trim(), code: values.code.trim(), password: values.password });
      browserSession().save(await endpoints.login({ email: values.email.trim(), password: values.password }));
      // Signed up through an invite link: apply it now (the server checks it; a refusal never blocks signing in).
      const invite = await claimPendingRef(browserSession());
      void router.replace(`/account?welcome=1${invite?.claimed ? "&invited=1" : ""}`);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.code === "invalid_code") setErrors({ code: err.message });
      else setError(err instanceof ApiError ? err.message : "The address couldn't be verified. Try again.");
    }
  }

  async function resend() {
    const r = emailSchema.safeParse(values.email);
    if (!r.success) {
      setErrors({ email: r.error.issues[0]?.message });
      return;
    }
    setError(null);
    try {
      await endpoints.resendCode(r.data.trim());
      setNotice("If that address is waiting for a code, a new one is on its way.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The code couldn't be sent. Try again.");
    }
  }

  return (
    <Layout title="Verify your email" description="Enter the code we emailed you to finish creating your Meldiq account." noindex>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="muted">We sent a verification code to {values.email || "your address"}. Enter it below to finish creating your account.</p>
          <form className="form" onSubmit={submit} noValidate>
            <Field label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} />
            <Field label="Verification code" autoComplete="one-time-code" inputMode="numeric" value={values.code} onChange={set("code")} error={errors.code} />
            {knownPassword ? null : (
              <Field
                label="Password"
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={set("password")}
                error={errors.password}
                hint="The password you chose when signing up."
              />
            )}
            <FormError message={error} />
            {notice ? (
              <div className="callout success" role="status">
                <p>{notice}</p>
              </div>
            ) : null}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Verifying…" : "Verify and sign in"}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={resend}>
              Send a new code
            </button>
          </form>
          <p className="form-foot">
            Wrong address? <Link href="/signup">Start again</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
