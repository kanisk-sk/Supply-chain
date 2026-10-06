"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { NAVIGATION_CONFIG, getVisibleNavItems } from "@/config/navigation";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navigationSearch, setNavigationSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem("supply-chain-sidebar-collapsed") === "true");
    } catch {
      // Sidebar controls still work when browser storage is unavailable.
    }
  }, []);

  const toggleSidebar = () => {
    const collapsed = !sidebarCollapsed;
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem("supply-chain-sidebar-collapsed", String(collapsed));
    } catch {
      // Persistence is optional; never prevent navigation or resizing.
    }
  };
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const visibleNavItems = user ? getVisibleNavItems(user.role) : [];
  // Filter items within each section too: a section passes only with its
  // visible items, otherwise unauthorized modules leak into the sidebar.
  const visibleSections = NAVIGATION_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter((item) => visibleNavItems.includes(item) &&
      (!navigationSearch.trim() || `${section.label || ""} ${item.name}`.toLowerCase().includes(navigationSearch.trim().toLowerCase()))),
  })).filter((section) => section.items.length > 0);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    SUPPLY_CHAIN_MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
    WAREHOUSE_MANAGER: "bg-amber-100 text-amber-800 border-amber-200",
    ANALYST: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const isItemActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: prev[label] === false }));
  };

  const renderNavItem = (item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }, isMobile = false) => {
    const isActive = isItemActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        aria-label={item.name}
        aria-current={isActive ? "page" : undefined}
        title={!isMobile && sidebarCollapsed ? item.name : undefined}
        onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
          isActive
            ? "border-slate-200 bg-white text-slate-900 font-semibold shadow-sm"
            : "border-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-slate-800" : "text-slate-500"}`} />
        {(isMobile || !sidebarCollapsed) && item.name}
      </Link>
    );
  };

  const renderSection = (section: { label?: string; items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[] }, isMobile = false) => {
    if (!section.label) {
      return section.items.map((item) => renderNavItem(item, isMobile));
    }

    const isExpanded = navigationSearch.trim() !== "" || expandedSections[section.label] !== false;
    return (
      <div key={section.label} className="mt-3 border-t border-slate-200/70 pt-3">
        <button
          type="button"
          onClick={() => toggleSection(section.label!)}
          aria-expanded={isExpanded}
          disabled={navigationSearch.trim() !== ""}
          className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
        >
          {section.label}
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
        {isExpanded && <div className="space-y-1">{section.items.map((item) => renderNavItem(item, isMobile))}</div>}
      </div>
    );
  };

  const renderSearch = () => (
    <div className="relative mb-4 shrink-0">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
      <input
        type="search"
        aria-label="Search navigation"
        placeholder="Search navigation"
        value={navigationSearch}
        onChange={(event) => setNavigationSearch(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-100/70 py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      {navigationSearch && <button type="button" onClick={() => setNavigationSearch("")} aria-label="Clear navigation search" className="absolute right-2 top-2 rounded-md p-1 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden ${sidebarCollapsed ? "" : "md:flex"} md:w-64 md:flex-col fixed inset-y-0 z-30 border-r border-slate-200 bg-[#f4f3f0]`}>
        <div className="flex min-h-20 shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 px-4">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label="Supply Chain dashboard">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#211f1b] text-sm font-bold tracking-wide text-white">SC</div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">Supply Chain</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Operations workspace</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            aria-expanded={true}
            title="Hide sidebar"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-4">
          {renderSearch()}
          <nav aria-label="Workspace navigation" className="min-h-0 flex-1 overflow-y-auto pb-4">
            {visibleSections.length === 0 && <p role="status" className="px-3 py-4 text-xs text-slate-500">No matching pages.</p>}
            {visibleSections.map((section) => renderSection(section, false))}
          </nav>

          {/* User Profile in Sidebar Footer */}
          {user && (
            <div className="shrink-0 border-t border-slate-200/70 bg-[#f4f3f0] py-2 px-2">
              <Link href="/profile" aria-label="Edit your profile" className="flex items-center gap-2.5 mb-1 rounded-xl p-1.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  {user.avatar_data ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_data} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : <UserIcon className="h-5 w-5" />}
                </div>
                <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "hidden" : ""}`}>
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-1.5">
                <span
                  title={user.role.replace(/_/g, " ")}
                  className={`max-w-[60%] truncate text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${roleColors[user.role] || "bg-slate-100 text-slate-700"}`}
                >
                  {user.role.replace(/_/g, " ")}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
              {user.warehouse_id && (
                <p className="px-1.5 text-[10px] text-slate-500 mt-1">Warehouse: #{user.warehouse_id}</p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">
            SC
          </div>
          <span className="font-semibold text-slate-800 text-sm">Supply Chain</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          className="rounded p-1 text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex flex-col bg-[#f4f3f0] pt-14">
          <nav aria-label="Workspace navigation" className="flex-1 p-4 overflow-y-auto">
            {renderSearch()}
            {visibleSections.length === 0 && <p role="status" className="px-3 py-4 text-xs text-slate-500">No matching pages.</p>}
            {visibleSections.map((section) => renderSection(section, true))}
          </nav>
          {user && (
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} aria-label="Edit your profile" className="rounded-md hover:bg-slate-50">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </Link>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                    roleColors[user.role] || "bg-slate-100"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              {user.warehouse_id && (
                <p className="text-[10px] text-slate-500 mb-2">Warehouse: #{user.warehouse_id}</p>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-slate-100 py-2 text-xs font-medium text-red-600"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className={`min-w-0 flex-1 ${sidebarCollapsed ? "md:pl-0" : "md:pl-64"} flex flex-col min-h-screen pt-14 md:pt-0`}>
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {sidebarCollapsed && (
            <div className="hidden md:flex mb-4">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                aria-expanded={false}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900"
              >
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                Show sidebar
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
