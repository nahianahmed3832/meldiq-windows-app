import { GuidePage } from "../components/GuidePage";

export default function Tutorials() {
  return (
    <GuidePage
      title="Getting Started with Meldiq Communities & Chat"
      eyebrow="YOUR FIRST FEW MINUTES"
      heading="Less setup. More conversation."
      description="A short guide to finding your way around Meldiq, from your first account to your own community."
      sections={[
        {
          title: "Create your account",
          text: "Open Meldiq in your browser or get the app for your device. Create an account, verify your email and sign in. Core messaging is free and doesn’t require a payment card.",
          href: "/signup",
          label: "Create an account",
        },
        {
          title: "Find your people",
          text: "Use Discover to look for public communities, or follow an invitation from a friend. Introduce yourself in a text channel and check the community’s rules before posting.",
          href: "/community",
          label: "About communities",
        },
        {
          title: "Keep in touch",
          text: "Start a direct message for a one-to-one conversation or bring a few friends into a private group. Reply to messages, add reactions and share files from the conversation.",
          href: "/features#messaging",
          label: "Messaging features",
        },
        {
          title: "Talk it through",
          text: "Join a voice channel or start a call. Allow microphone or camera access when you choose to use them. Check the call encryption indicator, and select a screen or window when sharing.",
          href: "/voice-video-screen-sharing",
          label: "Calls and screen sharing",
        },
        {
          title: "Make your own community",
          text: "Create a community, give it a name and add channels around your group’s interests. Set roles and permissions before sharing an invitation. Start small; you can add more structure as your group grows.",
          href: "/features#communities",
          label: "Community tools",
        },
        {
          title: "Secure your account",
          text: "Set up a passkey or authenticator-based two-step sign-in. Keep your recovery codes somewhere safe and review your signed-in sessions regularly.",
          href: "/security",
          label: "Account security",
        },
      ]}
    />
  );
}
