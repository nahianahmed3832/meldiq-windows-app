/**
 * The site's header and footer links: edit this file to change them, then build and deploy (README › Deploy).
 *
 * - HEADER_LINKS: the top navigation (and the phone menu), left to right.
 * - FOOTER: the footer's columns, left to right; each has a title and its links, top to bottom.
 *   A column can be added, removed or reordered; a link is { href, label }.
 * - FOOTER_NOTE: the line under the logo in the footer.
 *
 * `href` is a path on this site ("/pricing", "/legal/billing#cancel") or a full address ("https://…"). A path must
 * exist as a page in src/pages, or the link leads to the 404 page (the browser tests open every page linked here).
 */
export interface NavLink {
  href: string;
  label: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export const HEADER_LINKS: NavLink[] = [
  { href: "/features", label: "Features" },
  { href: "/developers", label: "Developers" },
  { href: "/pricing", label: "Plus" },
  { href: "/download", label: "Download" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
];

export const FOOTER: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/download", label: "Download" },
      { href: "/developers", label: "Developers" },
      { href: "/bots", label: "Bots" },
      { href: "/creators", label: "Creator Program" },
      { href: "/partners", label: "Partners" },
      { href: "/roadmap", label: "Roadmap" },
      { href: "/brand", label: "Brand kit" },
      { href: "https://status.meldiq.app", label: "Service status" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/community", label: "Find your community" },
      { href: "/gaming-community-chat", label: "Gaming community chat" },
      { href: "/voice-video-screen-sharing", label: "Voice, video & screen sharing" },
      { href: "/compare/discord", label: "Meldiq vs. Discord" },
      { href: "/tutorials", label: "Getting started" },
      { href: "/faq", label: "Questions & answers" },
      { href: "/legal/acceptable-use", label: "Community guidelines" },
      { href: "/account", label: "Your account" },
      { href: "/account/billing", label: "Billing" },
      { href: "/support", label: "Contact support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal", label: "Legal & privacy center" },
      { href: "/legal/content-removal#intimate-images", label: "Report intimate images" },
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/billing", label: "Meldiq Plus terms" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
      { href: "/legal/account-deletion", label: "Account deletion & your data" },
      { href: "/security", label: "Security & encryption" },
      { href: "/legal/billing#cancel", label: "Cancel Meldiq Plus" },
    ],
  },
];

export const FOOTER_NOTE = "Communities, direct messages and calls in one place.";
