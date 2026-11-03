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
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "Your account" },
      { href: "/account/billing", label: "Billing" },
      { href: "/legal/billing#cancel", label: "Cancel Mojo Plus" },
      { href: "/support", label: "Contact support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/billing", label: "Mojo Plus terms" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
      { href: "/legal/account-deletion", label: "Account deletion & your data" },
    ],
  },
];

export const FOOTER_NOTE = "Communities, direct messages and calls, encrypted on your devices.";
