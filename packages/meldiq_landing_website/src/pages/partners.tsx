import Link from "next/link";
import { Layout } from "../components/Layout";
import { SITE } from "../lib/site";

const workspace = new URL("/workspace/overview", SITE.webAppUrl).href;

export default function Partners() {
  return (
    <Layout title="Community Partners" description="Learn how Meldiq community owners can apply for partnership and track staff review.">
      <section className="program-hero wrap">
        <span className="ref-kicker">Community</span>
        <h1>
          Meldiq <em>Partners.</em>
        </h1>
        <p>For community owners building an active, welcoming space. Apply from the community you own and follow its review in Meldiq.</p>
        <div className="ref-actions">
          <a className="button primary" href={workspace}>
            Open Community Settings <span aria-hidden="true">→</span>
          </a>
          <Link className="button secondary" href="/legal/acceptable-use">
            Community guidelines
          </Link>
        </div>
      </section>
      <section className="download-section wrap">
        <span className="ref-kicker">How to apply</span>
        <h2>Give reviewers a picture of your community.</h2>
        <div className="download-platforms program-steps">
          <article>
            <h3>1. Choose your community</h3>
            <p>Sign in as its owner. Select the community and open the Partner application on its Overview page.</p>
          </article>
          <article>
            <h3>2. Complete the checklist</h3>
            <p>Confirm your community meets the requirements shown in the application, and explain what makes it a good fit.</p>
          </article>
          <article>
            <h3>3. Follow the review</h3>
            <p>Staff review the application. Return to the same page for its status and any reviewer notes.</p>
          </article>
        </div>
      </section>
      <section className="ref-faq wrap">
        <h2>Partner questions.</h2>
        <details>
          <summary>
            Who can submit an application?<span aria-hidden="true">⌄</span>
          </summary>
          <p>The community owner submits from the community’s Overview page. Choose the right community before opening its settings.</p>
        </details>
        <details>
          <summary>
            Where are the requirements?<span aria-hidden="true">⌄</span>
          </summary>
          <p>The current requirements are in the application checklist inside Meldiq. Staff review your checklist and statement together.</p>
        </details>
      </section>
    </Layout>
  );
}
