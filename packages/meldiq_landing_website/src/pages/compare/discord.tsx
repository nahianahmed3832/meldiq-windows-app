import { GuidePage } from "../../components/GuidePage";

export default function DiscordComparison() {
  return (
    <GuidePage
      title="Meldiq vs. Discord for Gaming Groups"
      eyebrow="COMPARING COMMUNITY CHAT APPS"
      heading="Should your group try Meldiq or stay on Discord?"
      description="Compare what matters for a gaming group. Look at voice rooms, screen sharing, platforms and the work involved in moving an existing community."
      sections={[
        {
          title: "Start with the features you use every week",
          text: "Both apps offer organized community spaces, text and voice channels, direct messages and screen sharing. If that covers your group’s weekly routine, try a small community on Meldiq and see how it fits. Compare the actual call controls on the devices your members use.",
          href: "/gaming-community-chat",
          label: "Set up a gaming community on Meldiq",
        },
        {
          title: "Check the platforms your group needs",
          text: "Meldiq offers a browser app, an Android app and a Windows download. If members need a native app for iPhone, iPad or macOS, Discord offers native downloads for those platforms. Check the current availability of each app before asking people to move.",
          href: "https://discord.com/download",
          label: "Check Discord’s official downloads",
        },
        {
          title: "Inventory bots, permissions and history",
          text: "List the bots, custom roles and moderation steps you rely on. Discord documents server templates for setting up other Discord servers. Plan to recreate the channels and roles you need in Meldiq, and check each integration before moving a group that depends on it.",
          href: "https://support.discord.com/hc/en-us/articles/360041033511-Server-Templates",
          label: "Read Discord’s server template documentation",
        },
        {
          title: "Run one session before deciding",
          text: "Invite a few regular members to one session. Test voice, screen sharing and moderator permissions. Ask them what took more work and what they missed. If a feature or bot is essential and unavailable, keep using your existing setup while you evaluate.",
          href: "/download",
          label: "Try Meldiq on your devices",
        },
      ]}
    />
  );
}
