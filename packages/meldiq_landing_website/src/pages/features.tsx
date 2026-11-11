import Link from "next/link";
import { LandingProductPreview } from "../components/LandingProductPreview";
import { CallPreview } from "../components/CallPreview";
import { Layout } from "../components/Layout";

const sections = [
  {
    id: "communities",
    title: "Communities & channels",
    text: "Create a public community or keep it invite-only. Organize conversations around the things your members share.",
    items: [
      "Categories, text and announcement channels",
      "Forums and threads",
      "Community discovery and invitations",
      "Owners, admins, moderators and custom roles",
      "Permissions for channels and categories",
    ],
  },
  {
    id: "messaging",
    title: "Messages & files",
    text: "Talk with one person, a private group or your whole community. Share photos, videos, documents and voice messages.",
    items: [
      "Direct messages and private groups",
      "Replies, reactions, mentions and read receipts",
      "Message editing and deletion",
      "Encrypted attachments",
      "Message requests from people you don’t know",
    ],
  },
  {
    id: "calls",
    title: "Voice, video & screen sharing",
    text: "Join a voice room or start a call. Screen sharing makes it easy to show what you’re working on or playing.",
    items: [
      "One-to-one and group calls",
      "Drop-in voice channels",
      "Video calls and screen sharing",
      "Call-media encryption on by default; check the indicator in the app",
    ],
  },
  {
    id: "privacy",
    title: "Privacy & encryption",
    text: "Files are encrypted before upload. Current messages can include attachment keys that the Meldiq server can read.",
    items: [
      "Conversation history available to authorized members",
      "Attachments encrypted before upload",
      "Call media encrypted when call encryption is on",
      "Account details, memberships and routing metadata remain visible to the server",
      "No independent security audit has been completed",
    ],
  },
  {
    id: "security",
    title: "Account security",
    text: "Use the same account on the web and Android. Manage access and security settings in Meldiq.",
    items: [
      "Passkeys",
      "Authenticator-based two-step sign-in",
      "Recovery codes",
      "View and end signed-in sessions",
      "Account subscription entitlements across supported devices",
    ],
  },
  {
    id: "moderation",
    title: "Community moderation",
    text: "Give your moderators the tools to keep the community welcoming and conversations manageable.",
    items: ["Reports, bans and timeouts", "Invitation controls", "Slow mode", "Member and role management", "Community rules and channel permissions"],
  },
];
export default function Features() {
  const links = ["/community", "/download", "/voice-video-screen-sharing", "/legal/privacy", "/security", "/legal/acceptable-use"];
  const labels = [
    "Explore communities",
    "Find your app",
    "Explore calls and screen sharing",
    "Read the Privacy Policy",
    "Account security guide",
    "Community standards",
  ];
  return (
    <Layout
      title="Community Channels, Group Messaging & Calls"
      description="Explore Meldiq communities, channels, group messages, voice and video calls, screen sharing and account security."
    >
      <section className="interior-hero feature-intro wrap">
        <span className="ref-kicker">Made for being together</span>
        <h1>
          Everything you need
          <br />
          <em>to talk, together.</em>
        </h1>
        <p>From the everyday group chat to a whole community. Messages, channels and calls belong in the same place.</p>
        <a className="button primary" href="/signup">
          Create a free account <span aria-hidden="true">→</span>
        </a>
        <nav className="section-links" aria-label="Explore features">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>
      </section>
      <div className="feature-stories wrap">
        {sections.slice(0, 3).map((section, i) => (
          <section className={`feature-story feature-story-${i}`} id={section.id} key={section.id}>
            <div className="feature-story-copy">
              <span className="ref-kicker">
                0{i + 1} / {i === 0 ? "Find your people" : i === 1 ? "Keep in touch" : "Be there"}
              </span>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              <ul className="checklist">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="inline-link" href={links[i]!}>
                {labels[i]} →
              </Link>
            </div>
            <div className="feature-visual">{i === 2 ? <CallPreview /> : <LandingProductPreview view={i === 0 ? "community" : "messages"} />}</div>
          </section>
        ))}
      </div>
      <section className="interior-section wrap">
        <div className="section-intro">
          <span className="ref-kicker">Know your space</span>
          <h2>
            More control.
            <br />
            <em>Clear boundaries.</em>
          </h2>
          <p>Tools to protect your account and look after your community, with the privacy limits explained.</p>
        </div>
        <div className="trust-sections">
          {sections.slice(3).map((section, i) => (
            <section id={section.id} key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              <ul className="checklist">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="inline-link" href={links[i + 3]!}>
                {labels[i + 3]} →
              </Link>
            </section>
          ))}
        </div>
      </section>
      <section className="interior-end wrap">
        <div>
          <span className="ref-kicker">Start with the essentials</span>
          <h2>Your conversations stay free.</h2>
          <p>
            Use the web, Windows or Android. Optional Plus and community add-ons have separate limits and benefits. Calling and screen-sharing options depend on
            your device and browser.
          </p>
          <Link className="inline-link" href="/pricing">
            Compare Free, Plus and community add-ons →
          </Link>
        </div>
        <a className="button primary" href="/signup">
          Create a free account →
        </a>
      </section>
    </Layout>
  );
}
