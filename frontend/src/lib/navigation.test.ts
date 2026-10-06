import { describe, it, expect } from "vitest";
import { NAV_ITEMS, isItemActive } from "@/components/common/LandingNavbar";

describe("Landing Navbar Configuration", () => {
  it("defines the exact required nav links in order", () => {
    expect(NAV_ITEMS).toEqual([
      { label: "Home", href: "/", sectionId: "hero" },
      { label: "Features", href: "/features", sectionId: "features" },
      { label: "Solutions", href: "/solutions", sectionId: "solutions" },
      { label: "About", href: "/about", sectionId: "about" },
    ]);
  });

  describe("isItemActive resolver", () => {
    it("marks Home as active on / and /landing", () => {
      expect(isItemActive("/", "/")).toBe(true);
      expect(isItemActive("/landing", "/")).toBe(true);
      expect(isItemActive("/features", "/")).toBe(false);
      expect(isItemActive("/solutions", "/")).toBe(false);
      expect(isItemActive("/about", "/")).toBe(false);
    });

    it("marks Features as active on /features and subpaths", () => {
      expect(isItemActive("/features", "/features")).toBe(true);
      expect(isItemActive("/features/inventory", "/features")).toBe(true);
      expect(isItemActive("/", "/features")).toBe(false);
      expect(isItemActive("/solutions", "/features")).toBe(false);
    });

    it("marks Solutions as active on /solutions and subpaths", () => {
      expect(isItemActive("/solutions", "/solutions")).toBe(true);
      expect(isItemActive("/solutions/warehouse", "/solutions")).toBe(true);
      expect(isItemActive("/", "/solutions")).toBe(false);
      expect(isItemActive("/features", "/solutions")).toBe(false);
    });

    it("marks About as active on /about and subpaths", () => {
      expect(isItemActive("/about", "/about")).toBe(true);
      expect(isItemActive("/about/journey", "/about")).toBe(true);
      expect(isItemActive("/", "/about")).toBe(false);
    });

    it("handles null or empty pathname safely", () => {
      expect(isItemActive(null, "/")).toBe(false);
      expect(isItemActive("", "/features")).toBe(false);
    });
  });
});
