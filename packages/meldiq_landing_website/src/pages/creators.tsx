import Link from "next/link";
import { Layout } from "../components/Layout";
import { SITE } from "../lib/site";

const center = new URL("/settings/creators", SITE.webAppUrl).href;
const account = new URL("/settings/account", SITE.webAppUrl).href;

export default function Creators() {
  return (
    <Layout title="Creator Program" description="Verify your channel, apply to the Meldiq Creator Program and track your submissions in the Creator Center.">
      <section className="program-hero wrap">
        <span className="ref-kicker">Meldiq Creator Program</span>
        <h1>
          Make something <em>about Meldiq.</em>
        </h1>
        <p>Share a guide, video or post about Meldiq. Apply through the Creator Center and follow the review of your work from your account.</p>
        <div className="ref-actions">
          <a className="button primary" href={center}>
            Open Creator Center <span aria-hidden="true">→</span>
          </a>
          <Link className="button secondary" href="/brand">
            Get the brand kit
          </Link>
        </div>
      </section>
      <section className="download-section wrap">
        <span className="ref-kicker">How to join</span>
        <h2>From your channel to the Creator Center.</h2>
        <div className="download-platforms program-steps">
          <article>
            <h3>1. Verify your channel</h3>
            <p>In My Account, open Creator Verification and send proof that you control the public channel you’re applying with.</p>
            <a className="inline-link" href={account}>
              Open My Account →
            </a>
          </article>
          <article>
            <h3>2. Apply to the program</h3>
            <p>Once your channel is verified, apply in the Creator Center. You can see the status of the application there.</p>
          </article>
          <article>
            <h3>3. Submit what you make</h3>
            <p>After approval, submit links to your original Meldiq content and check the review status, counted views and staff notes.</p>
          </article>
        </div>
      </section>
      <section className="ref-faq wrap">
        <h2>Creator questions.</h2>
        <details>
          <summary>
            What can I submit?<span aria-hidden="true">⌄</span>
          </summary>
          <p>Submit original content where Meldiq is the subject or a substantial part, such as a walkthrough or a video about your community.</p>
        </details>
        <details>
          <summary>
            Where can I see rewards?<span aria-hidden="true">⌄</span>
          </summary>
          <p>Check the staff notes on your submissions in the Creator Center for any rewards awarded after review.</p>
        </details>
        <details>
          <summary>
            Can I build a bot for my audience?<span aria-hidden="true">⌄</span>
          </summary>
          <p>
            Use a dedicated bot for community commands and workflows. The <Link href="/developers#creator-bots">creator bot guide</Link> covers setup, approvals
            and safe testing.
          </p>
        </details>
      </section>
    </Layout>
  );
}
