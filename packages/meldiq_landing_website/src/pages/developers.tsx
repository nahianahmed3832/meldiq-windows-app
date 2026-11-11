import Link from "next/link";
import { Layout } from "../components/Layout";
import { SITE } from "../lib/site";

const botSettings = new URL("/settings/developer", SITE.webAppUrl).href;
const botSdk = new URL("/developers/meldiq-bot-sdk-preview.zip", SITE.webAppUrl).href;
const botGuide = new URL("/developers/bot-sdk/README.txt", SITE.webAppUrl).href;
const topics = [
  { id: "quick-start", label: "Quick start" },
  { id: "creator-bots", label: "Bots for creators" },
  { id: "permissions", label: "Bot permissions" },
  { id: "credentials", label: "Credentials" },
  { id: "limits", label: "Plans and limits" },
  { id: "help", label: "Integration help" },
];

export default function Developers() {
  return (
    <Layout title="Developers" description="Build bots for your Meldiq community and learn about bot permissions, credentials and account limits.">
      <section className="developer-hero wrap">
        <span className="ref-kicker">Developers</span>
        <h1>Build bots on Meldiq.</h1>
        <p>Give your community a hand with tools that welcome members, help with moderation and support the way your group works.</p>
        <div className="developer-links">
          <a href={botSettings}>Open Developer Settings</a>
          <a href={botSdk}>Download SDK preview</a>
          <a href={botGuide}>SDK guide</a>
          <Link href="/bots">Bot tools</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/support">Developer support</Link>
        </div>
      </section>
      <div className="developer-docs wrap">
        <div className="developer-article">
          <section id="quick-start">
            <h2>Quick start</h2>
            <ol>
              <li>
                <strong>Create a bot identity.</strong> In Settings, open Developer and create a bot. Copy its token into an environment variable in your bot
                process.
              </li>
              <li>
                <strong>Choose a community.</strong> In Developer, request only the permissions your bot needs. A community manager adds the bot and reviews
                access in Community Settings → Integrations → Permissions.
              </li>
              <li>
                <strong>Test with a small group.</strong> Download the JavaScript or Python SDK preview. Run the slash-command example on infrastructure you
                control and try it in a test channel.
              </li>
            </ol>
          </section>
          <section id="creator-bots">
            <h2>Bots for creators</h2>
            <p>
              Start with one job, such as a slash command that links to your latest guide or answers a common question. Register the command, handle its
              interactions and test the reply in a private channel before rolling it out to your audience.
            </p>
            <p>
              Host the bot process yourself. Use a dedicated token and keep it out of frontend code, screenshots and logs. To send personal bot messages, the
              recipient must separately approve the bot from its profile.
            </p>
            <a className="inline-link" href={botGuide}>
              Read setup, SDK examples and permission details →
            </a>
          </section>
          <section id="permissions">
            <h2>Bot permissions</h2>
            <p>
              Community approval and channel permissions both apply. Request history, event or rich-message access only when needed. A change to requested
              access needs a new review.
            </p>
          </section>
          <section id="credentials">
            <h2>Credentials</h2>
            <p>
              Keep bot credentials out of public repositories and browser code. If a credential is exposed, replace it through the available developer tools.
            </p>
            <Link className="inline-link" href="/security">
              Read about Meldiq security →
            </Link>
          </section>
          <section id="limits">
            <h2>Plans and limits</h2>
            <p>Free and Plus accounts have different bot creation allowances. Communities can manage the separate Bots+ add-on in Meldiq.</p>
            <Link className="inline-link" href="/pricing">
              See current plans and limits →
            </Link>
          </section>
          <section id="help">
            <h2>Integration help</h2>
            <p>Start with the bot tools in Meldiq. Contact support for current integration details and developer access.</p>
            <Link className="inline-link" href="/support">
              Contact support →
            </Link>
          </section>
        </div>
        <nav className="developer-toc" aria-label="On this page">
          <span className="ref-kicker">On this page</span>
          <ul>
            {topics.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Layout>
  );
}
