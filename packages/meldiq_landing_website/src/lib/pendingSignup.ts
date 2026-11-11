/**
 * The address and password just used to sign up, kept in memory only for the next step (verifying the address needs
 * the password too). Never written to storage: after a reload the verification page asks for the password again.
 */
let pending: { email: string; password: string } | null = null;

export function rememberSignup(email: string, password: string): void {
  pending = { email, password };
}

/** Consume the one-time handoff. An older verification link can supply an expected address. */
export function takeSignup(expectedEmail?: string): typeof pending {
  const signup = pending;
  pending = null;
  if (expectedEmail && signup?.email.toLowerCase() !== expectedEmail.toLowerCase()) return null;
  return signup;
}
