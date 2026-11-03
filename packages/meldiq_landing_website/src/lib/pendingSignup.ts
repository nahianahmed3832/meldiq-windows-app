/**
 * The address and password just used to sign up, kept in memory only for the next step (verifying the address needs
 * the password too). Never written to storage: after a reload the verification page asks for the password again.
 */
let pending: { email: string; password: string } | null = null;

export function rememberSignup(email: string, password: string): void {
  pending = { email, password };
}

/** The password for [email] if it was just used to sign up in this page; once only. */
export function takeSignupPassword(email: string): string | null {
  const p = pending && pending.email.toLowerCase() === email.toLowerCase() ? pending.password : null;
  pending = null;
  return p;
}
