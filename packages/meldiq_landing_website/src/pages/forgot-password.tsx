import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Field, FormError } from "../components/Field";
import { Layout } from "../components/Layout";
import { ApiError, endpoints } from "../lib/api";
import { check, codeSchema, emailSchema, type FieldErrors, PASSWORD_MIN, passwordSchema } from "../lib/validation";

type Key = "email" | "code" | "password";

/** Password reset with an emailed code (POST /v2/auth/password/forgot, then /reset). */
export default function ForgotPassword() {
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [values, setValues] = useState<Record<Key, string>>({ email: "", code: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Key>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: Key) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function request(e: FormEvent) {
    e.preventDefault();
    const found = check({ email: emailSchema }, { email: values.email });
    setErrors(found);
    setError(null);
    if (found.email) return;
    setBusy(true);
    try {
      await endpoints.forgotPassword(values.email.trim());
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The code couldn't be sent. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    const found = check({ email: emailSchema, code: codeSchema, password: passwordSchema }, values);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await endpoints.resetPassword({ email: values.email.trim(), code: values.code.trim(), newPassword: values.password });
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_code") setErrors({ code: err.message });
      else if (err instanceof ApiError && err.code === "weak_password") setErrors({ password: err.message });
      else setError(err instanceof ApiError ? err.message : "The password couldn't be changed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout title="Reset your password" description="Reset your Meldiq password with a code sent to your email." noindex>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Reset your password</h1>
          {step === "request" ? (
            <form className="form" onSubmit={request} noValidate>
              <p className="muted">Enter your account&apos;s email address and we&apos;ll send you a code.</p>
              <Field label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} />
              <FormError message={error} />
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Sending…" : "Send a code"}
              </button>
            </form>
          ) : null}
          {step === "reset" ? (
            <form className="form" onSubmit={reset} noValidate>
              <div className="callout info" role="status">
                <p>If {values.email} has a Meldiq account, a code is on its way. It may take a minute.</p>
              </div>
              <Field label="Code from the email" autoComplete="one-time-code" value={values.code} onChange={set("code")} error={errors.code} />
              <Field
                label="New password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={set("password")}
                error={errors.password}
                hint={`At least ${PASSWORD_MIN} characters.`}
              />
              <FormError message={error} />
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Saving…" : "Set new password"}
              </button>
            </form>
          ) : null}
          {step === "done" ? (
            <div className="stack">
              <div className="callout success" role="status">
                <p>Your password is changed. Other devices signed in to your account may need to sign in again.</p>
              </div>
              <Link href="/login" className="btn btn-primary btn-block">
                Sign in
              </Link>
            </div>
          ) : null}
          <p className="form-foot">
            <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
