import { GuidePage } from "../components/GuidePage";
import { mojoOf, useMojoCatalog } from "../lib/catalog";
import { formatMoney } from "../lib/money";
import { useCatalog } from "../lib/catalog";

export default function Bots() {
  const mojo = mojoOf(useMojoCatalog());
  const catalog = useCatalog();
  const free = mojo?.plans.find((p) => p.key === "free");
  const plus = mojo?.plans.find((p) => p.key === "plus");
  const addon =
    catalog.state === "ready" && catalog.catalog.available
      ? catalog.catalog.plans.find((p) => p.key === "bots_plus" && p.audience === "organization")
      : undefined;
  return (
    <GuidePage
      title="Bots"
      eyebrow="A LITTLE HELP FOR YOUR COMMUNITY"
      heading="Make room for your bots."
      description="Explore bot tools in Meldiq and understand how personal bot allowances differ from a community’s Bots+ add-on."
      sections={[
        {
          title: "Start in Meldiq",
          text: "Use the bot tools available in the app to explore and manage bots for your community. Check what a bot can access before you add it, and give it only the permissions it needs.",
          href: "https://web.meldiq.app",
          label: "Open Meldiq",
        },
        {
          title: "Your account allowance",
          text:
            free?.bots !== undefined && plus?.bots !== undefined
              ? `The current catalog includes ${free.bots} bots you can make on Free and ${plus.bots} with Meldiq Plus. Your account plan and a community’s add-ons are separate.`
              : "Your account’s bot allowance comes from the current Meldiq catalog. Check the pricing comparison for the latest Free and Plus limits.",
          href: "/pricing",
          label: "Compare account plans",
        },
        {
          title: "Meldiq Bots+",
          text: addon
            ? `The community add-on is ${formatMoney(addon.amountMinor, addon.currency)} per ${addon.interval} for premium bots in one community. It is separate from personal Plus and Spark boosting. Review availability, renewal and cancellation terms in the app.`
            : "Bots+ is a separate community add-on. Check availability and current pricing in Meldiq before subscribing; it is not included automatically with a personal Plus subscription.",
          href: "https://web.meldiq.app",
          label: "Manage community add-ons",
        },
        {
          title: "Build thoughtfully",
          text: "Use dedicated bot identities and the permissions supported by Meldiq. Keep secrets out of public code and never ask members for their passwords, recovery codes or payment details.",
          href: "/developers",
          label: "Developer information",
        },
      ]}
    />
  );
}
