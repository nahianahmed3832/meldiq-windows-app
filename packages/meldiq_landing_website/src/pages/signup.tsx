import Link from "next/link";
import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";
import { Field, FormError } from "../components/Field";
import { Layout } from "../components/Layout";
import { TrialPill } from "../components/Mojo";
import { ApiError, endpoints } from "../lib/api";
import { dayCount, trialOf, trialPlanName, useCatalog } from "../lib/catalog";
import { rememberSignup } from "../lib/pendingSignup";
import { pendingRef, refFromQuery, rememberRef } from "../lib/referral";
import { ANNOUNCED_PLANS } from "../lib/site";
import { check, emailSchema, type FieldErrors, nameSchema, PASSWORD_MIN, passwordSchema } from "../lib/validation";

type Key = "name" | "email" | "password";

/** Creates a Meldiq account: the same account the apps use (POST /v2/auth/register), never a separate website one. */
export default function SignUp() {
  const router = useRouter();
  const [invited, setInvited] = useState(false);
  const catalog = useCatalog();
  const trial = trialOf(catalog);
  // An invite link (?ref=CODE): remembered for this tab and claimed once the new account has signed in.
  useEffect(() => {
    if (!router.isReady) return;
    const ref = refFromQuery(router.query.ref);
    if (ref) rememberRef(ref);
    setInvited(!!(ref ?? pendingRef()));
  }, [router.isReady, router.query.ref]);
  const [values, setValues] = useState<Record<Key, string>>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Key>>({});
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: Key) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = check({ name: nameSchema, email: emailSchema, password: passwordSchema }, values);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length > 0) return;
    if (!agreed) {
      setError("Agree to the Terms of Service and the Privacy Policy to create an account.");
      return;
    }
    setBusy(true);
    try {
      await endpoints.register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      // The password goes with the code (whoever verifies chose it): held in memory for the next step only.
      rememberSignup(values.email.trim(), values.password);
      void router.push(`/verify-email?email=${encodeURIComponent(values.email.trim())}`);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.code === "email_taken") setErrors({ email: err.message });
      else if (err instanceof ApiError && err.code === "weak_password") setErrors({ password: err.message });
      else setError(err instanceof ApiError ? err.message : "Your account couldn't be created. Try again.");
    }
  }

  return (
    <Layout title="Create your account" description="Create a free Meldiq account. The same account works on the web, on Android and on this website." noindex>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="muted">One Meldiq account for the web app, Android and this website.</p>
          {invited && trial && trial.referralDays > 0 ? (
            <div className="callout success" role="status" style={{ marginBottom: 16 }}>
              <p>
                You were invited! Once your account is ready, you and the friend who invited you both get {trialPlanName(catalog, ANNOUNCED_PLANS)} free for{" "}
                {dayCount(trial.referralDays)}.
              </p>
            </div>
          ) : invited ? null : (
            <TrialPill load={catalog} href="/pricing" />
          )}
          <form className="form" onSubmit={submit} noValidate>
            <Field label="Your name" autoComplete="name" value={values.name} onChange={set("name")} error={errors.name} maxLength={80} />
            <Field label="Email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} error={errors.email} />
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={set("password")}
              error={errors.password}
              hint={`At least ${PASSWORD_MIN} characters. A passphrase of a few words works well.`}
            />
            <label className="check">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                I agree to the <Link href="/legal/terms">Terms of Service</Link> and have read the <Link href="/legal/privacy">Privacy Policy</Link>.
              </span>
            </label>
            <FormError message={error} />
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Creating your account…" : "Create account"}
            </button>
          </form>
          <p className="form-foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
