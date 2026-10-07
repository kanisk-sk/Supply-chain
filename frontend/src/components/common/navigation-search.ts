export function focusNavigationSearch() {
  const workspace = document.querySelector<HTMLElement>("[data-dashboard-workspace], [data-workspace-design]");
  if (!workspace) return;
  const focusInput = () => {
    const input = Array.from(workspace.querySelectorAll<HTMLInputElement>('input[aria-label="Search navigation"]')).find(element => element.getClientRects().length > 0);
    input?.focus();
    return !!input;
  };
  if (focusInput()) return;
  const toggle = Array.from(workspace.querySelectorAll<HTMLButtonElement>('button[aria-label="Expand sidebar"], button[aria-label="Open navigation"]')).find(element => element.getClientRects().length > 0);
  toggle?.click();
  window.requestAnimationFrame(() => window.requestAnimationFrame(focusInput));
}
