import { GuidePage } from "../components/GuidePage";

export default function VoiceVideoScreenSharing() {
  return (
    <GuidePage
      title="Voice Chat, Video Calls & Screen Sharing"
      eyebrow="CALLS AND SCREEN SHARING"
      heading="Talk it through and share your screen."
      description="Use Meldiq for voice rooms, group video calls and screen sharing. Here’s how to start a call, choose what to share and troubleshoot common problems."
      sections={[
        {
          title: "Pick a voice room or a call",
          text: "Open a voice channel in a community when you want people to drop in. To call specific friends, open your direct message or private group and start a call from there. Allow microphone access when prompted, and turn on the camera if you want to use video.",
          href: "/features#calls",
          label: "See calling features",
        },
        {
          title: "Share a tab, window or screen",
          text: "Open the screen-sharing control in the call and choose a source from the picker. The available sources depend on your browser and device. Pick a single tab or window when you only need to show one thing, and use Stop sharing when you’re finished.",
        },
        {
          title: "Troubleshoot audio or a missing screen",
          text: "If nobody can hear you, check whether you’re muted and confirm that the selected microphone matches the one you’re using. If you can’t start sharing, check the browser and operating system permissions. If the picker offers an audio option, confirm it’s enabled and ask someone in the call to check the sound.",
          href: "/support",
          label: "Get help with Meldiq",
        },
        {
          title: "Check what others can see",
          text: "Close windows with private information and silence notifications before sharing your entire display. Check the call encryption indicator in Meldiq to see whether call-media encryption is active.",
          href: "/security",
          label: "Read about call privacy",
        },
      ]}
    />
  );
}
