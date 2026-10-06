import { afterEach, describe, expect, it, vi } from "vitest";
import { getLandingScrollBehavior } from "./landing-scroll";

afterEach(() => vi.unstubAllGlobals());

describe("landing navigation motion preference", () => {
  it.each([
    [true, "auto"],
    [false, "smooth"],
  ])("uses the user's current reduced-motion preference (%s)", (matches, expected) => {
    const matchMedia = vi.fn().mockReturnValue({ matches });
    vi.stubGlobal("window", { matchMedia });
    expect(getLandingScrollBehavior()).toBe(expected);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("responds to preference changes between clicks", () => {
    const preference = { matches: false };
    vi.stubGlobal("window", { matchMedia: () => preference });
    expect(getLandingScrollBehavior()).toBe("smooth");
    preference.matches = true;
    expect(getLandingScrollBehavior()).toBe("auto");
  });
});
