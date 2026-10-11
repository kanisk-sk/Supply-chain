import { hasPermission } from "@/config/navigation";
import type { UserRole } from "@/types/api";

export type LoginIntent = "sign-in" | "create-user";

export function loginDestination(role: UserRole, intent: LoginIntent = "sign-in") {
  if (intent === "create-user") {
    if (!hasPermission(role, "users:write")) {
      throw new Error("Sign in with an administrator account to add a new user.");
    }
    return "/admin/users?create=1";
  }
  return "/dashboard";
}
