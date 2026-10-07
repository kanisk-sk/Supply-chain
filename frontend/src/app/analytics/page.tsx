"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/common/AppLayout";
import WorkspacePageHeader from "@/components/common/WorkspacePageHeader";
import OperationsSummary from "@/components/dashboard/OperationsSummary";
import { Panel, Metric, DataState } from "@/components/dashboard/DashboardPrimitives";
import styles from "@/components/dashboard/dashboard.module.css";
import { dashboardOverview, dashboardInventory, dashboardShipments, dashboardSuppliers, dashboardBottlenecks, DashboardShipmentAnalytics } from "@/components/dashboard/analytics-data";
import FeedbackAlert from "@/components/common/FeedbackAlert";
import { analyticsApi } from "@/lib/api";
import {
  AnalyticsOverview,
  InventoryAnalytics,
  SupplierAnalytics,
  BottleneckAnalytics,
} from "@/types/api";
import { RefreshCw } from "lucide-react";

// Restricted to ADMIN / SUPPLY_CHAIN_MANAGER / ANALYST (see PAGE_PERMISSIONS).
// All three roles hold analytics:read, so every request here is authorized.
export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [inventory, setInventory] = useState<InventoryAnalytics | null>(null);
  const [shipments, setShipments] = useState<DashboardShipmentAnalytics | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierAnalytics | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [ov, inv, shp, sup, btn] = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getInventory(),
        analyticsApi.getShipments(),
        analyticsApi.getSuppliers(),
        analyticsApi.getBottlenecks(),
      ]);
      if (ov.status === "fulfilled") setOverview(dashboardOverview(ov.value));
      if (inv.status === "fulfilled") setInventory(dashboardInventory(inv.value));
      if (shp.status === "fulfilled") setShipments(dashboardShipments(shp.value));
      if (sup.status === "fulfilled") setSuppliers(dashboardSuppliers(sup.value));
      if (btn.status === "fulfilled") setBottlenecks(dashboardBottlenecks(btn.value));
      const failed = [ov, inv, shp, sup, btn].filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setFeedback({ type: "error", message: "Failed to load some analytics sections." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load analytics" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const hours = (value: number | null | undefined) => value == null ? "N/A" : `${value.toFixed(1)} h`;

  return (
    <ProtectedRoute requiredPermissions={["analytics:read"]} requiredRoles={["ADMIN", "SUPPLY_CHAIN_MANAGER", "ANALYST"]}>
      <AppLayout>
        <div className={styles.dashboard} aria-busy={loading}>
          <WorkspacePageHeader title="Analytics" section="Insights" description="Inventory distribution, delivery performance, and supplier activity.">
            <button type="button" onClick={loadAnalytics} disabled={loading} className={styles.button}><RefreshCw size={13} aria-hidden="true" />{loading ? "Refreshing…" : "Refresh"}</button>
          </WorkspacePageHeader>
          {feedback && <FeedbackAlert type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />}
          <OperationsSummary overview={overview} loading={loading} error={!!feedback} />
          <div className={styles.split}>
            <Panel title="Stock by warehouse">
              <DataState loading={loading} empty={!inventory?.by_warehouse.length && "No inventory data available."}>
                <table className={styles.table}><thead><tr><th>Warehouse</th><th className={styles.number}>Units</th><th className={styles.number}>Share</th></tr></thead><tbody>{inventory?.by_warehouse.map(wh => <tr key={wh.warehouse_id}><td>{wh.warehouse_name}</td><td className={styles.number}>{Number(wh.total_quantity).toLocaleString()}</td><td className={styles.number}>{((Number(wh.total_quantity) / (inventory.total_inventory || 1)) * 100).toFixed(1)}%</td></tr>)}</tbody></table>
              </DataState>
            </Panel>
            <Panel title="Shipment performance">
              <DataState loading={loading} empty={!shipments && "No shipment performance data available."}>
                <div className={styles.performance}>
                  <Metric label="Delivered" value={shipments?.delivered_count ?? 0} note={shipments?.on_time_count == null ? "Completed deliveries" : `${shipments.on_time_count} on time`} />
                  <Metric label="Delayed" value={shipments?.delayed_count ?? 0} note="Historical & active" tone={(shipments?.delayed_count ?? 0) > 0 ? "danger" : undefined} />
                  <Metric label="Average delivery" value={hours(shipments?.avg_delivery_hours)} note="Dispatch to delivery" />
                  <Metric label="Average delay" value={hours(shipments?.avg_delay_hours)} note="Beyond delivery estimate" tone={(shipments?.avg_delay_hours ?? 0) > 0 ? "warning" : undefined} />
                </div>
              </DataState>
            </Panel>
          </div>
          <Panel title="Supplier activity">
            <DataState loading={loading} empty={!suppliers?.suppliers.length && "No suppliers registered."}>
              <table className={styles.table}><thead><tr><th>Supplier</th><th>Code</th><th className={styles.number}>Orders</th><th className={styles.number}>On-time</th></tr></thead><tbody>{suppliers?.suppliers.map(supplier => <tr key={supplier.supplier_id}><td>{supplier.supplier_name}</td><td><code>{supplier.supplier_code}</code></td><td className={styles.number}>{supplier.total_orders ?? 0}</td><td className={styles.number}>{supplier.performance_score == null ? "N/A" : `${supplier.performance_score}%`}</td></tr>)}</tbody></table>
            </DataState>
          </Panel>
          <Panel title="Lifecycle bottleneck timing">
            <DataState loading={loading} empty={!bottlenecks?.stages.length && "Insufficient lifecycle history to calculate stage bottlenecks."}>
              <table className={styles.table}><thead><tr><th>Lifecycle stage</th><th className={styles.number}>Samples</th><th className={styles.number}>Average</th><th className={styles.number}>Median / p50</th><th className={styles.number}>p90</th></tr></thead><tbody>{bottlenecks?.stages.map(stage => <tr key={stage.stage}><td>{stage.stage}</td><td className={styles.number}>{stage.count}</td><td className={styles.number}>{hours(stage.avg_hours)}</td><td className={styles.number}>{hours(stage.p50_hours)}</td><td className={styles.number}>{hours(stage.p90_hours)}</td></tr>)}</tbody></table>
            </DataState>
          </Panel>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
