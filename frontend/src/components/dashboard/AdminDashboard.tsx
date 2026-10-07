"use client";

import React, { useEffect, useState } from "react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import styles from "./dashboard.module.css";
import { dashboardOverview, dashboardInventory, dashboardShipments, dashboardSuppliers, dashboardBottlenecks, DashboardShipmentAnalytics } from "./analytics-data";
import { Panel, Metric, DataState, DashboardError, Signal, DashboardExamples } from "./DashboardPrimitives";
import { analyticsApi, alertsApi } from "@/lib/api";
import {
  AnalyticsOverview,
  InventoryAnalytics,
  SupplierAnalytics,
  BottleneckAnalytics,
  Alert,
} from "@/types/api";
import OperationsSummary from "./OperationsSummary";

interface AdminDashboardProps {
  title?: string;
  subtitle?: string;
}

// Full operational dashboard. Allowed callers (ADMIN, SUPPLY_CHAIN_MANAGER,
// ANALYST) all hold analytics:read + alerts:read on the backend, so every
// request below is authorized for each of them — no 403s by construction.
export default function AdminDashboard({
  title = "Operations overview",
  subtitle = "Stock levels, open orders, shipments and alerts across your warehouses.",
}: AdminDashboardProps) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [inventoryAnalytics, setInventoryAnalytics] = useState<InventoryAnalytics | null>(null);
  const [shipmentAnalytics, setShipmentAnalytics] = useState<DashboardShipmentAnalytics | null>(null);
  const [supplierAnalytics, setSupplierAnalytics] = useState<SupplierAnalytics | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalytics | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, inv, shp, sup, btn, alt] = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getInventory(),
        analyticsApi.getShipments(),
        analyticsApi.getSuppliers(),
        analyticsApi.getBottlenecks(),
        alertsApi.list({ resolved: false, limit: 5 }),
      ]);

      if (ov.status === "fulfilled") setOverview(dashboardOverview(ov.value));
      if (inv.status === "fulfilled") setInventoryAnalytics(dashboardInventory(inv.value));
      if (shp.status === "fulfilled") setShipmentAnalytics(dashboardShipments(shp.value));
      if (sup.status === "fulfilled") setSupplierAnalytics(dashboardSuppliers(sup.value));
      if (btn.status === "fulfilled") setBottlenecks(dashboardBottlenecks(btn.value));
      if (alt.status === "fulfilled") setActiveAlerts(alt.value.data || []);

      if (ov.status === "rejected") {
        setError(ov.reason?.message || "Failed to load dashboard data");
      } else if ([inv, shp, sup, btn, alt].some(result => result.status === "rejected")) {
        setError("Some dashboard panels could not refresh. Retry to load the missing data.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const hours = (number: number | null | undefined) => number == null ? "N/A" : `${number.toFixed(1)} h`;

  return (
    <div className={styles.dashboard} aria-busy={loading}>
      <DashboardHero title={title} subtitle={subtitle} loading={loading} onRefresh={fetchDashboardData} />
      {error && <DashboardError message={error} retry={fetchDashboardData} dismiss={() => setError(null)} />}
      <OperationsSummary overview={overview} loading={loading} error={!!error} />
      <div className={styles.split}>
        <Panel title="Unresolved alerts" href="/alerts" action="All alerts">
          <DataState loading={loading} empty={!activeAlerts.length && "No active alerts. All systems normal."}>
            <table className={styles.table}><thead><tr><th>Severity</th><th>Exception</th><th>Created / UTC</th></tr></thead><tbody>{activeAlerts.map(alert => <tr key={alert.id}><td><Signal tone={alert.severity === "CRITICAL" ? "danger" : alert.severity === "WARNING" ? "warning" : undefined}>{alert.severity}</Signal></td><td>{alert.message}</td><td><time dateTime={alert.created_at}>{new Date(alert.created_at).toISOString().slice(0,16).replace("T", " ")}</time></td></tr>)}</tbody></table>
          </DataState>
        </Panel>
        <Panel title="Shipment performance">
          <DataState loading={loading} empty={!shipmentAnalytics && "No shipment performance data available."}>
            <div className={styles.performance}>
              <Metric label="Delivered" value={shipmentAnalytics?.delivered_count ?? 0} note={shipmentAnalytics?.on_time_count == null ? "Completed deliveries" : `${shipmentAnalytics.on_time_count} on time`} />
              <Metric label="Delayed" value={shipmentAnalytics?.delayed_count ?? 0} note="Historical & active" tone="danger" />
              <Metric label="Average delivery" value={hours(shipmentAnalytics?.avg_delivery_hours)} note="Dispatch to delivery" />
              <Metric label="Average delay" value={hours(shipmentAnalytics?.avg_delay_hours)} note="Beyond delivery estimate" tone="warning" />
            </div>
          </DataState>
        </Panel>
      </div>
      <Panel title="Lifecycle bottleneck timing">
        <DataState loading={loading} empty={!bottlenecks?.stages?.length && "Insufficient lifecycle history to calculate stage bottlenecks."}>
          <table className={styles.table}><thead><tr><th>Lifecycle stage</th><th className={styles.number}>Samples</th><th className={styles.number}>Average</th><th className={styles.number}>Median / p50</th><th className={styles.number}>p90</th></tr></thead><tbody>{bottlenecks?.stages?.map(stage => <tr key={stage.stage}><td>{stage.stage}</td><td className={styles.number}>{stage.count}</td><td className={styles.number}>{hours(stage.avg_hours)}</td><td className={styles.number}>{hours(stage.p50_hours)}</td><td className={styles.number}>{hours(stage.p90_hours)}</td></tr>)}</tbody></table>
        </DataState>
      </Panel>
      <div className={styles.split}>
        <Panel title="Stock by warehouse" href="/inventory" action="Inventory">
          <DataState loading={loading} empty={!inventoryAnalytics?.by_warehouse?.length && "No inventory data available."}>
            <table className={styles.table}><thead><tr><th>Warehouse</th><th className={styles.number}>Units</th><th className={styles.number}>Share</th></tr></thead><tbody>{inventoryAnalytics?.by_warehouse?.map(wh => <tr key={wh.warehouse_id}><td>{wh.warehouse_name}</td><td className={styles.number}>{Number(wh.total_quantity).toLocaleString()}</td><td className={styles.number}>{((Number(wh.total_quantity) / (inventoryAnalytics.total_inventory || 1)) * 100).toFixed(1)}%</td></tr>)}</tbody></table>
          </DataState>
        </Panel>
        <Panel title="Supplier activity" href="/suppliers" action="Suppliers">
          <DataState loading={loading} empty={!supplierAnalytics?.suppliers?.length && "No suppliers registered."}>
            <table className={styles.table}><thead><tr><th>Supplier</th><th>Code</th><th className={styles.number}>Orders</th><th className={styles.number}>On-time</th></tr></thead><tbody>{supplierAnalytics?.suppliers?.map(sup => <tr key={sup.supplier_id}><td>{sup.supplier_name}</td><td><code>{sup.supplier_code}</code></td><td className={styles.number}>{sup.total_orders ?? 0}</td><td className={styles.number}>{sup.performance_score == null ? "N/A" : `${sup.performance_score}%`}</td></tr>)}</tbody></table>
          </DataState>
        </Panel>
      </div>
      {!loading && !activeAlerts.length && <DashboardExamples />}
      <footer className={styles.footer}><span>Supply Chain / Operations workspace</span><span className={styles.mono}>{loading ? "SYNCING" : error ? "SYNC INCOMPLETE" : "SYNC COMPLETE"}</span></footer>
    </div>
  );
}
