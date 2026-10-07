// Only the explicitly approved workspace routes use the dashboard design.
const workspaceRoutes = ["/inventory", "/orders", "/shipments", "/products", "/suppliers", "/warehouses", "/alerts", "/analytics", "/admin/users"];

export function usesWorkspaceDesign(pathname: string): boolean {
  return workspaceRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}
