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
          text: "Files are encrypted before upload. Current messages can include attachment keys that the Meldiq server can read, so attachment encryption does not prevent server access to those files. Only authorized conversation members can access them through the app.",
          href: "/legal/privacy",
          label: "Read the Privacy Policy",
        },
        {
          title: "Calls and screen sharing",
          text: "Call-media encryption is enabled by default. Check the encryption indicator in your call. Share only the window or screen you intend to show and stop sharing when you’re finished.",
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
          text: "Use in-app reporting for unwanted messages and abuse. For account or security concerns, use the support page to check the currently published contact information. Never share passwords, recovery codes or payment credentials in a report.",
          href: "/support",
          label: "Get help",
        },
      ]}
    />
  );
}
