import { SITE } from "./site";

/** Only fixed first-party destinations; arbitrary next URLs and query values never cross the origin. */
export function appSignInDestination(next: string | string[] | undefined): string {
  let path = "/";
  if (typeof next === "string") {
    if (next === "/pricing" || next === "/pricing?plan=plus") path = "/settings/mojo";
    else if (next === "/account/billing") path = "/settings/billing";
    else if (next === "/account") path = "/settings/account";
  }
  return new URL(path, SITE.webAppUrl).href;
}
