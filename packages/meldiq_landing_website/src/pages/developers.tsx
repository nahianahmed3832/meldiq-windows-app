import { GuidePage } from "../components/GuidePage";

export default function Developers() {
  return (
    <GuidePage
      title="Developers"
      eyebrow="BUILD AROUND YOUR COMMUNITY"
      heading="Useful tools. Clear boundaries."
      description="Start with Meldiq’s bot tools and account permissions. This page is an overview, not an API or SDK reference."
      sections={[
        {
          title: "Start with the app",
          text: "Open Meldiq to check the bot and developer tools available to your account. Use the supported controls to create or manage a bot identity and review its permissions.",
          href: "https://web.meldiq.app",
          label: "Open Meldiq",
        },
        {
          title: "Understand the limits",
          text: "Free and Plus accounts have different bot creation allowances. Community Bots+ is a separate product. Current published allowances and prices are on the pricing page.",
          href: "/pricing",
          label: "Current plans and limits",
        },
        {
          title: "Keep credentials private",
          text: "Store bot credentials outside public repositories and client-side code. Give a bot the smallest set of community permissions it needs, and remove access when it is no longer used.",
          href: "/security",
          label: "Security information",
        },
        {
          title: "Need integration details?",
          text: "A public API and SDK reference is not published on this website. Check the tools in Meldiq or the current support contact before building against an undocumented endpoint.",
          href: "/support",
          label: "Contact support",
        },
      ]}
    />
  );
}
