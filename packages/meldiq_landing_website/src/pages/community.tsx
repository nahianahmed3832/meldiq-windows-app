import { GuidePage } from "../components/GuidePage";
import { LandingProductPreview } from "../components/LandingProductPreview";
import { SITE } from "../lib/site";

export default function Community() {
  return (
    <GuidePage
      title="Find or Create a Community"
      eyebrow="A PLACE TO BELONG"
      heading="Bring your people together."
      description="Find a community around the things you enjoy, or make a space for the people you already know."
      sections={[
        {
          title: "Find your corner",
          text: "Open Discover in Meldiq to explore public communities. Search for a name or topic, read the community’s rules and find a conversation you want to join.",
          href: SITE.webAppUrl,
          label: "Explore in Meldiq",
        },
        {
          title: "Build a space of your own",
          text: "Create a public or invite-only community. Give each conversation a home with categories, text channels, forums and voice rooms.",
          items: ["Share invitations with your group", "Set up roles and channel permissions", "Give announcements and community rules their own space"],
          href: "/gaming-community-chat",
          label: "Set up a gaming community",
        },
        {
          title: "Make it welcoming",
          text: "Clear expectations and a little moderation help people feel at home. Set your rules, choose moderators and use reports, slow mode and invitation controls when you need them.",
          href: "/legal/acceptable-use",
          label: "Community guidelines",
        },
        {
          title: "Support the whole community",
          text: "Meldiq Spark adds community benefits separately from your account subscription. Review current levels, prices and purchase terms before boosting.",
          href: "/pricing#spark-heading",
          label: "Explore Sparks",
        },
      ]}
    >
      <div className="guide-preview wrap">
        <LandingProductPreview view="discover" />
      </div>
    </GuidePage>
  );
}
