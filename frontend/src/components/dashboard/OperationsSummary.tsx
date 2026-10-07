import Link from "next/link";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { AnalyticsOverview } from "@/types/api";
import styles from "./dashboard.module.css";

export default function OperationsSummary({ overview, loading, error }: { overview: AnalyticsOverview | null; loading: boolean; error?: boolean }) {
  const value = (number: number | string | null | undefined) => loading ? "—" : error && !overview ? "N/A" : Number(number ?? 0).toLocaleString();
  return (
<section aria-label="Operations at a glance" className={styles.overviewSummary}>
        <div className={styles.summaryGroup}>
          <Link href="/inventory" className={styles.summaryHeading}>Inventory<ArrowUpRight size={13} aria-hidden="true" /></Link>
          <p className={styles.summaryValue}><strong>{value(overview?.total_stock)}</strong><span>units on hand</span></p>
          <div className={styles.summaryDetails}>
            <Link href="/products"><span className={styles.mono}>{value(overview?.product_count)}</span> products</Link>
            {loading || !overview ? <span>{loading ? "Updating stock…" : "Stock data unavailable"}</span> : (
              <Link href="/inventory" className={(overview.low_stock_count > 0) ? styles.summaryAttention : undefined}>
                {overview.low_stock_count > 0 && <AlertTriangle size={12} aria-hidden="true" />}
                {overview.low_stock_count > 0 ? <><span className={styles.mono}>{value(overview.low_stock_count)}</span> {overview.low_stock_count === 1 ? "product needs" : "products need"} restocking</> : "No products below reorder level"}
              </Link>
            )}
          </div>
        </div>
        <div className={styles.summaryGroup}>
          <Link href="/orders" className={styles.summaryHeading}>Orders<ArrowUpRight size={13} aria-hidden="true" /></Link>
          <p className={styles.summaryValue}><strong>{value(overview?.active_orders_count)}</strong><span>open orders</span></p>
          <p className={styles.summaryNote}>{loading ? "Updating orders…" : !overview ? "Order data unavailable" : overview.active_orders_count === 0 ? "No orders awaiting fulfillment" : "Placed or confirmed, ready for fulfillment"}</p>
        </div>
        <div className={styles.summaryGroup}>
          <Link href="/shipments" className={styles.summaryHeading}>Deliveries<ArrowUpRight size={13} aria-hidden="true" /></Link>
          <p className={styles.summaryValue}><strong>{value(overview?.in_transit_shipments_count)}</strong><span>in transit</span></p>
          {loading || !overview ? <p className={styles.summaryNote}>{loading ? "Updating deliveries…" : "Delivery data unavailable"}</p> : (
            <Link href="/shipments" className={`${styles.summaryNote} ${overview.delayed_shipments_count > 0 ? styles.summaryAttention : ""}`}>
              {overview.delayed_shipments_count > 0 && <AlertTriangle size={12} aria-hidden="true" />}
              {overview.delayed_shipments_count > 0 ? <><span className={styles.mono}>{value(overview.delayed_shipments_count)}</span> {overview.delayed_shipments_count === 1 ? "delivery is" : "deliveries are"} overdue</> : "No overdue deliveries"}
            </Link>
          )}
        </div>
      </section>
  );
}
