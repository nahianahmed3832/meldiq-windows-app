import Link from "next/link";
import { Layout } from "../components/Layout";
import { CodeExample } from "../components/CodeExample";
import { PageIndex } from "../components/PageIndex";
import { SITE } from "../lib/site";

const botSettings = new URL("/settings/developer", SITE.webAppUrl).href;
const botSdk = new URL("/developers/meldiq-bot-sdk-preview.zip", SITE.webAppUrl).href;
const botGuide = new URL("/developers/bot-sdk/README.txt", SITE.webAppUrl).href;
const topics = [
  { id: "quick-start", label: "Your first bot" },
  { id: "sdk", label: "SDKs & examples" },
  { id: "creator-bots", label: "Bots for creators" },
  { id: "permissions", label: "Permissions" },
  { id: "credentials", label: "Credentials" },
  { id: "limits", label: "Plans & limits" },
  { id: "help", label: "Integration help" },
];
const example = `import { MeldiqBot } from "./javascript/index.mjs";

const bot = new MeldiqBot({
  apiOrigin: process.env.MELDIQ_API_ORIGIN,
  token: process.env.MELDIQ_BOT_TOKEN,
});

const { bot: identity } = await bot.me();`;

export default function Developers() {
  return (
    <Layout
      title="Developers"
      description="Build a community bot with Meldiq's JavaScript and Python SDK previews. Start with a bot identity, scoped permissions and a working example."
    >
      <section className="interior-hero developer-intro wrap">
        <div>
          <span className="ref-kicker">Meldiq for developers</span>
          <h1>
            Build a little help.
            <br />
            <em>For your people.</em>
          </h1>
          <p>
            Create slash commands, community tools and helpful integrations with a dedicated bot identity. You host the code. Your community controls its
            access.
          </p>
          <a className="button primary" href={botSettings}>
            Open Developer Settings <span aria-hidden="true">↗</span>
          </a>
          <div className="supporting-links">
            <a href={botSdk}>Download SDK preview</a>
            <a href={botGuide}>Read the SDK guide</a>
          </div>
        </div>
        <aside className="developer-map" aria-label="How a Meldiq bot works">
          <span className="ref-kicker">From idea to community</span>
          <div>
            <span>01</span>
            <strong>Your bot process</strong>
            <p>JavaScript or Python · Hosted by you</p>
          </div>
          <div>
            <span>02</span>
            <strong>Reviewed permissions</strong>
            <p>Bot identity · Scoped community access</p>
          </div>
          <div>
            <span>03</span>
            <strong>A useful interaction</strong>
            <p>Slash commands · Community workflows</p>
          </div>
          <p className="fine-print">SDK preview · Check the guide for supported capabilities and limits.</p>
        </aside>
      </section>
      <div className="reading-layout wrap">
        <PageIndex items={topics} />
        <div className="reading-article">
          <section id="quick-start">
            <span className="ref-kicker">Start here</span>
            <h2>Your first bot, step by step.</h2>
            <ol className="setup-steps">
              <li>
                <div>
                  <h3>Create a bot identity</h3>
                  <p>Open Settings → Developer in Meldiq and create a bot. Keep its token in an environment variable in your bot process.</p>
                  <a href={botSettings}>Open Developer Settings ↗</a>
                </div>
              </li>
              <li>
                <div>
                  <h3>Choose a community and request access</h3>
                  <p>
                    Request only the permissions your bot needs. A community manager adds the bot and reviews access in Community Settings → Integrations →
                    Permissions. Native roles and channel restrictions still apply.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Run the example with a small group</h3>
                  <p>
                    Extract the SDK preview. Follow its guide to configure the API origin and token, then run <code>examples/commands.mjs</code> or{" "}
                    <code>examples/commands.py</code> on your own infrastructure. Try the command in a test channel.
                  </p>
                </div>
              </li>
            </ol>
          </section>
          <section id="sdk">
            <span className="ref-kicker">SDK preview</span>
            <h2>A small starting point.</h2>
            <p>
              The JavaScript and Python clients ship together in the preview archive. The base clients need no third-party dependencies. Optional voice helpers
              have separate requirements; check the guide before using them.
            </p>
            <CodeExample code={example} label="JavaScript · Read your bot identity" />
            <div className="resource-pair">
              <a href={botSdk}>
                <span className="ref-kicker">JavaScript + Python</span>
                <strong>Download the SDK preview ↗</strong>
                <span>Clients, slash-command examples and reference guide.</span>
              </a>
              <a href={botGuide}>
                <span className="ref-kicker">Reference</span>
                <strong>Read the SDK guide ↗</strong>
                <span>Setup, supported operations, errors and optional previews.</span>
              </a>
            </div>
          </section>
          <section id="creator-bots">
            <h2>One useful job for your audience.</h2>
            <p>
              Start with a slash command that links to your latest guide or answers a common question. Register the command, handle its interactions and test
              the reply in a private channel before rolling it out.
            </p>
            <p>
              Personal bot messages require the recipient’s separate approval from the bot’s profile. Community approval does not grant access to someone’s
              private messages.
            </p>
            <Link className="inline-link" href="/creators">
              Explore the Creator Program →
            </Link>
          </section>
          <section id="permissions">
            <h2>Permission is part of the design.</h2>
            <p>
              Request history, events or rich-message access only when needed. Community approval and native channel permissions both apply; approval never
              grants an owner role or bypasses a denial. Changes to requested access need a fresh review.
            </p>
            <a className="inline-link" href={botGuide}>
              Review supported permissions →
            </a>
          </section>
          <section id="credentials">
            <h2>Keep credentials with your bot.</h2>
            <p>
              Keep tokens out of frontend code, public repositories, screenshots and logs. Use a dedicated bot token in your process environment. If a
              credential is exposed, replace it through the available developer tools.
            </p>
            <Link className="inline-link" href="/security">
              Read about Meldiq security →
            </Link>
          </section>
          <section id="limits">
            <h2>Know your limits.</h2>
            <p>
              Free and Plus accounts have different bot creation allowances. Communities manage the separate Bots+ add-on in Meldiq. The SDK guide covers
              request budgets, pagination, permission failures and retry behavior.
            </p>
            <Link className="inline-link" href="/pricing">
              See current plans and limits →
            </Link>
          </section>
          <section id="help">
            <h2>Keep building.</h2>
            <p>Use the reference guide for implementation details and the bot tools in Meldiq to review your setup.</p>
            <div className="supporting-links">
              <Link href="/bots">Explore bot tools</Link>
              <Link href="/support">Developer support</Link>
              <Link href="/roadmap">Published roadmap</Link>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
