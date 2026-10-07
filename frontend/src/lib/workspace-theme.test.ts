import { describe, expect, it } from "vitest";
import { usesWorkspaceDesign } from "./workspace-theme";

describe("workspace design scope", () => {
  it("includes all approved management pages and their details", () => {
    for (const route of ["/inventory", "/orders", "/orders/12", "/shipments", "/shipments/7", "/products", "/suppliers", "/warehouses", "/alerts", "/analytics", "/admin/users"]) {
      expect(usesWorkspaceDesign(route), route).toBe(true);
    }
  });
  it("keeps public pages, profile and the existing dashboard styling separate", () => {
    for (const route of ["/", "/landing", "/login", "/track", "/tracking/TRK-12345678", "/profile", "/dashboard", "/orders-other", "/about"]) {
      expect(usesWorkspaceDesign(route), route).toBe(false);
    }
  });
});
