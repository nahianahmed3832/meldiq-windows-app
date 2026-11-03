import Link from "next/link";
import { Layout } from "../components/Layout";
import { ActivityPreview } from "../components/ActivityPreview";
import { LandingProductPreview } from "../components/LandingProductPreview";
import { SITE } from "../lib/site";
const questions = [
  [
    "Is Meldiq free?",
    "Yes. Communities, channels, direct messages, private groups, voice and video calls, screen sharing and encrypted file sharing are part of the free experience. Meldiq Plus is optional. Visit Pricing for current availability and details.",
  ],
  [
    "Which platforms are available?",
    "Meldiq is available in your browser, on Android and as a Windows desktop download. Native apps for iPhone and iPad and macOS are planned. One account works across supported devices.",
  ],
  [
    "Can I create my own community?",
    "Yes. Create a public or invite-only community, organize it with categories and channels, and use roles and permissions to decide who can see and participate in each space.",
  ],
  [
    "What does Meldiq Plus add?",
    "Meldiq Plus adds optional account extras for $4.99/month, including files up to 1 GB each. The Pricing page explains availability, benefits and separate Spark community boosting. Every core messaging feature remains free; no paid plan is required to start talking.",
  ],
  [
    "How private are my conversations?",
    "Files are encrypted before upload. Current messages can include attachment keys that the Meldiq server can read. Call-media encryption is on by default. The server can still see account details, community memberships and routing metadata. Meldiq has not had an independent security audit. Read the Privacy Policy for the full explanation.",
  ],
];
function Actions() {
  return (
    <div className="ref-actions">
      <a className="button primary" href={SITE.webAppUrl}>
        Open Meldiq in your browser <span aria-hidden="true">→</span>
      </a>
      <Link className="button secondary" href="/download">
        Download Meldiq
      </Link>
    </div>
  );
}
export default function Home() {
  return (
    <Layout
      landing
      title="Meldiq"
      description="Your people, your channels, one place to talk. Free community messaging, voice and video on the web, Android and Windows."
    >
      <section className="ref-hero wrap">
        <div className="ref-orbit" aria-hidden="true" />
        <h1>
          Your people,
          <br />
          <em>your channels, one place to talk.</em>
        </h1>
        <p>
          Meldiq brings your friends and communities together to talk, call and share. The core experience is free. Mojo
          Plus is optional.
        </p>
        <Actions />
        <p className="ref-trust-note">
          <span className="ref-availability">
            <span className="status-dot" aria-hidden="true" />
            <strong>Free to use</strong>
            <span>·</span> Web, Android & Windows
          </span>
          <ActivityPreview />
        </p>
      </section>
      <section className="ref-main-preview wrap" aria-label="Meldiq community preview">
        <LandingProductPreview />
      </section>
      <section className="ref-feature-row wrap">
        <div className="ref-feature-copy">
          <span className="ref-kicker">COMMUNITIES</span>
          <h2>A place for your people.</h2>
          <p>
            Discover a public community or start one for your own group. Keep conversations organized with text channels, forums and voice rooms, and make the
            space your own with roles and invitations.
          </p>
        </div>
        <LandingProductPreview view="discover" />
      </section>
      <section className="ref-feature-row ref-feature-reversed wrap">
        <LandingProductPreview view="messages" />
        <div className="ref-feature-copy">
          <span className="ref-kicker">DIRECT MESSAGES</span>
          <h2>Keep your conversations close.</h2>
          <p>
            Direct messages and private groups alongside your communities. Catch up with a friend, make plans with the group, and share the photos, files and
            little things that keep you connected.
          </p>
        </div>
      </section>
      <section className="ref-join wrap">
        <div className="ref-join-inner">
          <h2>Come say hello.</h2>
          <p>Open Meldiq, create your account and bring your people together. Core messaging is free; Meldiq Plus is an optional extra.</p>
          <Actions />
          <span>Free to use · No card to start · Runs in your browser</span>
        </div>
      </section>
      <section className="ref-faq wrap" id="faq">
        <h2>Questions.</h2>
        {questions.map(([q, a], i) => (
          <details key={q} open={i === 0 ? true : undefined}>
            <summary>
              {q}
              <span aria-hidden="true">⌄</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
        <Link className="ref-more-help" href="/faq">
          More questions and answers →
        </Link>
      </section>
    </Layout>
  );
}
