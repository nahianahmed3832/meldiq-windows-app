import { useRouter } from "next/router";
import { useEffect } from "react";
import { Layout } from "../components/Layout";
import { appSignInDestination } from "../lib/appSignIn";

/** Use the application's chooser and existing browser session; never transfer tokens between origins. */
export default function Login() {
  const router = useRouter();
  const destination = appSignInDestination(router.query.next);
  useEffect(() => {
    if (router.isReady) window.location.replace(destination);
  }, [router.isReady, destination]);
  return (
    <Layout title="Sign in" description="Sign in to Meldiq with Google, Discord, a passkey or email." noindex>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Sign in to Meldiq</h1>
          <p>Continue with Google, Discord, a passkey or email in Meldiq. Your existing sign-in works here too.</p>
          <a className="btn btn-primary btn-block" href={destination}>
            Continue to Meldiq
          </a>
        </div>
      </div>
    </Layout>
  );
}
