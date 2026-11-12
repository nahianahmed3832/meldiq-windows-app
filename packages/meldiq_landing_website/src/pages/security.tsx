import { GuidePage } from "../components/GuidePage";

export default function Security() {
  return (
    <GuidePage
      title="Security"
      eyebrow="KNOW WHAT YOU’RE SHARING"
      heading="Privacy, explained plainly."
      description="Understand how Meldiq protects your account, conversations and files, and where the current limits are."
      sections={[
        {
          title: "Protect your account",
          text: "Meldiq supports passkeys, authenticator-based two-step sign-in and recovery codes. You can review and end signed-in sessions from your account security settings.",
          items: ["Use a unique password", "Keep recovery codes private", "End sessions on devices you no longer use"],
        },
        {
          title: "Messages and attachments",
          text: "Connections are encrypted in transit. The service can read stored message content and the attachment keys included in current messages. Files are encrypted before upload, and the app checks conversation permissions before serving them.",
          href: "/legal/privacy",
          label: "Read the Privacy Policy",
        },
        {
          title: "Calls and screen sharing",
          text: "Call-media encryption is on by default in supported configurations. The indicator shows when call media is encrypted. It does not establish who can obtain the call keys. Share only the window or screen you intend to show and stop sharing when you’re finished.",
          href: "/features#calls",
          label: "Calling features",
        },
        {
          title: "What the server sees",
          text: "Account details, community memberships and routing metadata remain visible to the server. Meldiq has not completed an independent security audit. These limits matter when deciding what to share.",
          href: "/legal/privacy",
          label: "Data handling and retention",
        },
        {
          title: "Something doesn’t look right?",
          text: "Use in-app reporting for unwanted messages and abuse. For a security issue, email contact@griipbuddy.com and include the affected feature and version. Never share passwords, recovery codes or payment credentials in a report.",
          href: "/legal/forms#security",
          label: "Security report form",
        },
      ]}
    />
  );
}
