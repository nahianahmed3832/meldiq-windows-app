import { GuidePage } from "../components/GuidePage";

export default function Roadmap() {
  return (
    <GuidePage
      title="Roadmap"
      eyebrow="WHERE MELDIQ IS TODAY"
      heading="More places to connect."
      description="A straightforward look at supported platforms and what is planned. Planned apps have no announced release date."
      sections={[
        {
          title: "Available: web",
          text: "Use Meldiq in a supported browser, with no installation required. Your account brings communities, messages and calls together.",
          href: "https://web.meldiq.app",
          label: "Open the web app",
        },
        {
          title: "Available: Android",
          text: "The official Meldiq Android listing is on Google Play. Availability can vary by region and device.",
          href: "https://play.google.com/store/apps/details?id=com.meldiq.android",
          label: "View on Google Play",
        },
        {
          title: "Available: Windows",
          text: "Meldiq has a dedicated 64-bit Windows app. The download page includes the current version, release information and checksum.",
          href: "/download",
          label: "Get Meldiq for Windows",
        },
        {
          title: "Planned: iPhone, iPad & macOS",
          text: "Native apps for Apple devices are planned. They are not available for download here, and no release date has been announced. You can use the web app in the meantime.",
          href: "/download",
          label: "Current download options",
        },
        {
          title: "Your feedback helps",
          text: "Found a bug or a rough edge? Include the affected platform, what happened and the steps that reproduce it when contacting support. Keep private conversation content out of your report.",
          href: "/support",
          label: "Report a problem",
        },
      ]}
    />
  );
}
