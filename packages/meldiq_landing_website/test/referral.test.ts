import { describe, expect, it } from "vitest";
import { inviteLink, refFromQuery } from "../src/lib/referral";

describe("invite links", () => {
  it("are the sign-up page with the code", () => {
    expect(inviteLink("https://meldiq.app/", "ABC234XYZ9")).toBe("https://meldiq.app/signup?ref=ABC234XYZ9");
  });

  it("accept only well-formed codes from the address", () => {
    expect(refFromQuery("abc234xyz9")).toBe("ABC234XYZ9");
    for (const bad of [undefined, "", "short", "has space 12", "<script>", "x".repeat(21), ["ABC234XYZ9"]]) expect(refFromQuery(bad)).toBeNull();
  });
});
