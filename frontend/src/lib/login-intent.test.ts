import { describe, expect, it } from "vitest";
import { loginDestination } from "./login-intent";

describe("login user creation shortcut", () => {
  it("opens the creation dialog after administrator sign-in", () => {
    expect(loginDestination("ADMIN", "create-user")).toBe("/admin/users?create=1");
  });
  it.each(["ANALYST", "WAREHOUSE_MANAGER", "SUPPLY_CHAIN_MANAGER"] as const)(
    "rejects %s accounts for user creation", role => {
      expect(() => loginDestination(role, "create-user")).toThrow("administrator account");
      expect(loginDestination(role)).toBe("/dashboard");
    },
  );
  it("keeps normal administrator sign-in unchanged", () => {
    expect(loginDestination("ADMIN")).toBe("/dashboard");
  });
});
