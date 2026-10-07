"use client";

import { ReactNode, useEffect } from "react";
import { Search } from "lucide-react";
import { focusNavigationSearch } from "./navigation-search";
import styles from "./workspace.module.css";

export default function WorkspacePageHeader({ title, section, description, children }: { title: string; section: string; description?: string; children?: ReactNode }) {
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusNavigationSearch();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  return <header className={styles.header}>
    <div><p className={styles.breadcrumb}>{section} / {title}</p><h1>{title}</h1>{description && <p className={styles.description}>{description}</p>}</div>
    <div className={styles.headerActions}>
      <button type="button" onClick={focusNavigationSearch} className={styles.search} aria-keyshortcuts="Meta+K Control+K"><Search size={13} aria-hidden="true" />Find page<kbd>⌘K</kbd></button>
      {children}
    </div>
  </header>;
}
