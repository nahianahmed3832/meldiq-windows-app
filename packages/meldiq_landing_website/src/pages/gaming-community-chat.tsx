import { GuidePage } from "../components/GuidePage";

export default function GamingCommunityChat() {
  return (
    <GuidePage
      title="Gaming Community Chat App"
      eyebrow="FOR GUILDS, SQUADS AND FRIENDS"
      heading="Give your gaming group a place to meet."
      description="Set up text channels, drop-in voice rooms and screen sharing for your gaming group. Use Meldiq in a browser, on Windows or on Android."
      sections={[
        {
          title: "Create a home for your group",
          text: "Start an invite-only community for your squad or guild. Set up an announcements channel for raid times, a looking-for-group channel to fill a spot and a general channel for everything else. Pin the schedule so people can find it when they join.",
          href: "/tutorials",
          label: "Get started with Meldiq",
        },
        {
          title: "Keep voice chat open between games",
          text: "Create a drop-in voice room so friends can join when they’re ready. Add a second room if you play in separate teams. When someone wants to show a replay or help a friend with a build, they can share their screen from a supported client.",
          href: "/voice-video-screen-sharing",
          label: "Learn how screen sharing works",
        },
        {
          title: "Set permissions before you send invites",
          text: "Give moderators their own role and let members post where you want conversations to happen. For example, let everyone read announcements and give posting access to organizers. Check what a regular member can see before inviting the rest of the group.",
          href: "/features#moderation",
          label: "See community moderation tools",
        },
        {
          title: "Try it with a few friends",
          text: "Set up one text channel and one voice room. Ask a few friends to try joining, sending a message and sharing a screen on the devices they use. A quick test gives you a chance to fix permissions and microphone settings before the next session.",
          href: "/signup",
          label: "Create a free account",
        },
      ]}
    >
      <p className="wrap">
        <a className="inline-link" href="/es/chat-para-comunidades-gaming" hrefLang="es" lang="es">
          Leer en español
        </a>
      </p>
    </GuidePage>
  );
}
