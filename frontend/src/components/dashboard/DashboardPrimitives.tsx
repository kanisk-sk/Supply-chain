import { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox, AlertTriangle, X } from "lucide-react";
import styles from "./dashboard.module.css";

export function Panel({ title, href, action = "Open", children }: { title: string; href?: string; action?: string; children: ReactNode }) {
  return <section className={styles.panel}><div className={styles.panelHeader}><h2>{title}</h2>{href && <Link href={href}>{action}<ArrowUpRight size={12} aria-hidden="true" /></Link>}</div>{children}</section>;
}
export function Metric({ label, value, note, tone, icon }: { label: string; value: ReactNode; note: string; tone?: "warning" | "danger"; icon?: ReactNode }) {
  return <div className={styles.metric}><span>{label}{icon}</span><strong className={tone ? styles[tone] : undefined}>{value}</strong><small>{note}</small></div>;
}
export function DataState({ loading, empty, children }: { loading: boolean; empty: string | false; children: ReactNode }) {
  if (loading) return <div role="status" className={styles.loading}>Loading records…<div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} /></div>;
  if (empty) return <div role="status" className={styles.empty}><Inbox size={16} aria-hidden="true" />{empty}</div>;
  return <div className={styles.scroll}>{children}</div>;
}
export function DashboardError({ message, retry, dismiss }: { message: string; retry: () => void; dismiss: () => void }) {
  return <div role="alert" className={styles.error}><span className="flex items-center gap-2"><AlertTriangle size={15} aria-hidden="true" />{message}</span><div className="flex items-center gap-2"><button type="button" onClick={retry} className={styles.button}>Retry</button><button type="button" onClick={dismiss} aria-label="Dismiss error" className={styles.button}><X size={13} /></button></div></div>;
}
export function Signal({ children, tone }: { children: ReactNode; tone?: "warning" | "danger" | "success" }) {
  return <span className={styles.status} data-tone={tone}>{children}</span>;
}
export function DashboardExamples() {
  const examples = [
    ["SHP-26-8802-MUM", "Mumbai → Pune", "IN_TRANSIT", "2026-10-07T08:15:00Z"],
    ["SHP-26-8791-BLR", "Bengaluru → Chennai", "DELIVERED", "2026-10-06T14:40:00Z"],
    ["SHP-26-8786-DEL", "Delhi → Jaipur", "DELAYED", "2026-10-07T05:30:00Z"],
    ["SHP-26-8808-HYD", "Hyderabad → Bengaluru", "PENDING", "2026-10-07T09:00:00Z"],
    ["SHP-26-8774-AMD", "Ahmedabad → Mumbai", "DISPATCHED", "2026-10-06T18:20:00Z"],
  ];
  return <details className={`${styles.panel} ${styles.examples}`}><summary>Sample shipment records · 5 rows</summary><p>Design examples only. These records are separate from your operational data.</p><div className={styles.scroll}><table className={styles.table}><thead><tr><th>Shipment ID</th><th>Route</th><th>Status</th><th>Updated / UTC</th></tr></thead><tbody>{examples.map(([id, route, status, timestamp]) => <tr key={id}><td><code>{id}</code></td><td>{route}</td><td><Signal tone={status === "DELAYED" ? "danger" : status === "DELIVERED" ? "success" : undefined}>{status}</Signal></td><td><time dateTime={timestamp}>{timestamp}</time></td></tr>)}</tbody></table></div></details>;
}
