import Link from "next/link";
import { Layout } from "../components/Layout";
import { LandingProductPreview } from "../components/LandingProductPreview";
import { AppButtons } from "../components/AppButtons";
import { OnlineNow } from "../components/OnlineNow";

const questions = [
  {
    question: "Is Meldiq free?",
    answer:
      "Yes. Communities, direct messages, private groups, voice and video calls, screen sharing and encrypted file sharing are free. Meldiq Plus is an optional subscription that adds larger uploads and other account extras.",
    href: "/pricing",
    label: "See Meldiq Plus",
  },
  {
    question: "Which platforms can I use?",
    answer:
      "Use Meldiq in your browser, download it for Windows or get the Android app from Google Play. The same account works across all three. Native apps for iPhone, iPad and macOS are planned.",
    href: "/download",
    label: "See available downloads",
  },
  {
    question: "What can bots do?",
    answer:
      "Bots can help run a community with welcomes, reminders, moderation and other tools. Community owners can review the available bots and their permissions inside Meldiq.",
    href: "/bots",
    label: "Explore Meldiq bots",
  },
  {
    question: "Can I start my own community?",
    answer:
      "Yes. Make a public or invite-only community, organize it into text channels, forums and voice rooms, and use roles to manage who can join and participate.",
    href: "/community",
    label: "Learn about communities",
  },
  {
    question: "How does Meldiq handle my data?",
    answer:
      "Files are encrypted before upload, and call-media encryption is on by default. The server can read some attachment keys and see information such as community memberships and message routing data.",
    href: "/legal/privacy",
    label: "Read the Privacy Policy",
  },
];

export default function Home() {
  return (
    <Layout
      landing
      title="Meldiq | Community Chat, Voice & Screen Sharing"
      description="Create a gaming community or chat with friends on Meldiq. Get text channels, group messages, voice and video calls, and screen sharing."
    >
      <section className="ref-hero wrap">
        <div className="ref-orbit" aria-hidden="true" />
        <h1>
          Your group chat,
          <br />
          <em>
            with space <span>to hang out.</span>
          </em>
        </h1>
        <p>
          Meldiq is where friends and communities come together to chat, call and share their screens. The essentials are free, and Meldiq Plus is optional.
        </p>
        <AppButtons />
        <p className="ref-trust-note">
          <OnlineNow />
        </p>
      </section>
      <div className="ref-main-preview wrap">
        <LandingProductPreview />
      </div>
      <section className="ref-feature-row wrap">
        <div className="ref-feature-copy">
          <span className="ref-kicker">Discover</span>
          <h2>Find your people.</h2>
          <p>
            Discover a public community or start a space of your own. Set up text channels, forums and voice rooms for your group, and make them yours with
            roles and invitations.
          </p>
          <Link className="inline-link" href="/community">
            Explore communities <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <LandingProductPreview view="discover" />
      </section>
      <section className="ref-feature-row ref-feature-reversed wrap">
        <LandingProductPreview view="messages" />
        <div className="ref-feature-copy">
          <span className="ref-kicker">Direct messages</span>
          <h2>Everyone you talk to, in one place.</h2>
          <p>Keep your friends, group chats and direct messages together. Catch up in private or bring the group into a call with video and screen sharing.</p>
          <Link className="inline-link" href="/features#messaging">
            Explore messaging <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="ref-join wrap">
        <div className="ref-join-inner">
          <img className="ref-join-logo" src="/meldling-128.png" width={72} height={72} alt="" loading="lazy" />
          <h2>Come say hello.</h2>
          <p>Make an account, start a conversation and invite your people. Chatting is free, and you can start right in your browser.</p>
          <AppButtons />
          <span>Free · No credit card · Runs in your browser</span>
        </div>
      </section>
      <section className="ref-faq wrap" id="faq">
        <h2>Questions.</h2>
        {questions.map(({ question, answer, href, label }, index) => (
          <details key={question} name="home-faq" open={index === 0 ? true : undefined}>
            <summary>
              {question}
              <span aria-hidden="true">⌄</span>
            </summary>
            <p>
              {answer} <Link href={href}>{label}</Link>.
            </p>
          </details>
        ))}
        <Link className="ref-more-help" href="/faq">
          More questions and answers <span aria-hidden="true">→</span>
        </Link>
      </section>
    </Layout>
  );
}
