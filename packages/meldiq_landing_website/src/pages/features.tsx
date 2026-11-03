import Link from "next/link";
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
  return (
    <Layout
      title="Features"
      description="Explore Meldiq communities, channels, encrypted messages, voice and video calls, screen sharing and account security."
    >
      <section className="plain-page-heading wrap">
        <Link className="breadcrumb" href="/">
          Home / Features
        </Link>
        <h1>
          Everything you need
          <br />
          to talk, together.
        </h1>
        <p>Communities, messages and calls in one place. Every core messaging feature is free.</p>
        <Link className="button primary" href="/signup">
          Find your people <span aria-hidden="true">→</span>
        </Link>
      </section>
      <div className="plain-features wrap">
        {sections.map((section) => (
          <section className="plain-feature-row" id={section.id} key={section.id}>
            <div>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              {section.id === "privacy" ? (
                <Link className="inline-link" href="/legal/privacy">
                  Read the Privacy Policy →
                </Link>
              ) : section.id === "moderation" ? (
                <Link className="inline-link" href="/legal/acceptable-use">
                  Community standards →
                </Link>
              ) : null}
            </div>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="plain-page-end wrap">
        <h2>Ready when you are.</h2>
        <p>
          Create a free account or find the right app for your device. <Link href="/pricing">Explore optional Meldiq Plus benefits and community add-ons.</Link>
        </p>
        <div className="button-row">
          <Link className="button primary" href="/signup">
            Create a Free Account
          </Link>
          <Link className="button secondary" href="/download">
            Get Meldiq
          </Link>
        </div>
      </section>
    </Layout>
  );
}
