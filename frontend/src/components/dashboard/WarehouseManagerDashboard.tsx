"use client";

import React, { useEffect, useState } from "react";
import { alertsApi, inventoryApi, ordersApi, shipmentsApi, warehousesApi } from "@/lib/api";
import { Alert, InventoryItem, InventoryTransaction, Shipment, Warehouse } from "@/types/api";
import { Boxes, AlertTriangle, Truck, ShoppingCart } from "lucide-react";
import Link from "next/link";
import DashboardHero from "./DashboardHero";
import styles from "./dashboard.module.css";
import { Panel, Metric, DataState, DashboardError, Signal, DashboardExamples } from "./DashboardPrimitives";

interface WarehouseManagerDashboardProps {
  warehouseId: number | null;
}

// Warehouse-scoped operational dashboard. Uses only endpoints the
// WAREHOUSE_MANAGER role is authorized for (warehouses / inventory /
// inventory-transactions / orders / shipments / alerts — all warehouse-scoped
// server-side). Deliberately makes NO analyticsApi calls: the backend denies
// analytics:read to this role, so those would only produce 403s.
export default function WarehouseManagerDashboard({ warehouseId }: WarehouseManagerDashboardProps) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouseInventory, setWarehouseInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);
  const [delayedCount, setDelayedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (warehouseId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [wh, inv, low, shp, tx, alt, ord, transit, delayed] = await Promise.allSettled([
        warehousesApi.get(warehouseId),
        inventoryApi.list({ warehouse_id: warehouseId, limit: 10 }),
        inventoryApi.list({ warehouse_id: warehouseId, below_threshold: true, limit: 10 }),
        shipmentsApi.list({ limit: 5 }),
        inventoryApi.transactions({ warehouse_id: warehouseId, limit: 5 }),
        alertsApi.list({ resolved: false, limit: 5 }),
        ordersApi.list({ limit: 1 }),
        shipmentsApi.list({ status: "IN_TRANSIT", limit: 1 }),
        shipmentsApi.list({ is_delayed: true, limit: 1 }),
      ]);

      if (wh.status === "fulfilled") setWarehouse(wh.value);
      if (inv.status === "fulfilled") setWarehouseInventory(inv.value.data || []);
      if (low.status === "fulfilled") { setLowStockItems(low.value.data || []); setLowStockCount(low.value.meta.total); }
      if (shp.status === "fulfilled") setRecentShipments(shp.value.data || []);
      if (tx.status === "fulfilled") setRecentTransactions(tx.value.data || []);
      if (alt.status === "fulfilled") setActiveAlerts(alt.value.data || []);
      if (ord.status === "fulfilled") setOrderCount(ord.value.meta?.total ?? 0);
      if (transit.status === "fulfilled") setInTransitCount(transit.value.meta?.total ?? 0);
      if (delayed.status === "fulfilled") setDelayedCount(delayed.value.meta?.total ?? 0);

      const failures = [wh, inv, low, shp, tx, alt, ord, transit, delayed].filter(
        (r) => r.status === "rejected"
      );
      if (failures.length > 0) {
        setError("Failed to load some dashboard data");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  if (warehouseId == null) {
    return <section className={styles.panel}><div className={styles.panelHeader}><h1>No warehouse assigned</h1></div><div className={styles.empty}><AlertTriangle size={16} />Your account is not assigned to a warehouse yet. Contact an administrator.</div></section>;
  }
  const totalUnits = warehouseInventory.reduce((sum, item) => sum + Number(item.quantity), 0);
  const value = (number: number) => loading ? "—" : number.toLocaleString();
  const timestamp = (date: string) => new Date(date).toISOString().slice(0,16).replace("T", " ");
  return (
    <div className={styles.dashboard} aria-busy={loading}>
      <DashboardHero title={warehouse ? `${warehouse.name} / ${warehouse.code}` : "Warehouse operations"} subtitle="Operational metrics and inventory status for your warehouse." loading={loading} onRefresh={fetchDashboardData} />
      {error && <DashboardError message={error} retry={fetchDashboardData} dismiss={() => setError(null)} />}
      <section aria-label="Warehouse metrics" className={styles.metrics}>
        <Metric label="Warehouse stock" value={value(totalUnits)} note="Units in loaded inventory" icon={<Boxes size={13} />} />
        <Metric label="Low stock" value={value(lowStockCount)} note="Items below threshold" tone="warning" icon={<AlertTriangle size={13} />} />
        <Metric label="Orders" value={value(orderCount)} note="Touching this warehouse" icon={<ShoppingCart size={13} />} />
        <Metric label="In transit" value={value(inTransitCount)} note="From this warehouse" icon={<Truck size={13} />} />
        <Metric label="Delayed" value={value(delayedCount)} note="Shipments need attention" tone="danger" />
        <Metric label="Loaded SKUs" value={value(warehouseInventory.length)} note="Current inventory sample" />
      </section>
      <div className={styles.split}>
        <Panel title="Warehouse alerts" href="/alerts" action="All alerts">
          <DataState loading={loading} empty={!activeAlerts.length && "No active alerts. All systems normal."}>
            <table className={styles.table}><thead><tr><th>Severity</th><th>Exception</th><th>Created / UTC</th></tr></thead><tbody>{activeAlerts.map(alert => <tr key={alert.id}><td><Signal tone={alert.severity === "CRITICAL" ? "danger" : alert.severity === "WARNING" ? "warning" : undefined}>{alert.severity}</Signal></td><td>{alert.message}</td><td><time dateTime={alert.created_at}>{timestamp(alert.created_at)}</time></td></tr>)}</tbody></table>
          </DataState>
        </Panel>
        <Panel title="Reorder queue" href="/inventory" action="Inventory">
          <DataState loading={loading} empty={!lowStockItems.length && "All products are above their reorder threshold."}>
            <table className={styles.table}><thead><tr><th>Product / SKU</th><th className={styles.number}>Available</th><th className={styles.number}>Threshold</th></tr></thead><tbody>{lowStockItems.slice(0,10).map(item => <tr key={item.id}><td>{item.product?.name || `Product #${item.product_id}`}<div className={styles.mono}>{item.product?.sku || "N/A"}</div></td><td className={`${styles.number} ${styles.warning}`}>{Number(item.quantity).toLocaleString()} {item.product?.unit || "units"}</td><td className={styles.number}>{Number(item.product?.reorder_threshold ?? 0).toLocaleString()}</td></tr>)}</tbody></table>
          </DataState>
        </Panel>
      </div>
      <Panel title="Recent shipments" href="/shipments" action="All shipments">
        {delayedCount > 0 && <div className={`${styles.empty} ${styles.danger}`}><AlertTriangle size={14} />{delayedCount} delayed shipment{delayedCount === 1 ? "" : "s"} need attention.</div>}
        <DataState loading={loading} empty={!recentShipments.length && "No shipments found for this warehouse."}>
          <table className={styles.table}><thead><tr><th>Shipment ID</th><th>Order</th><th>Status</th><th>Delivery / UTC</th><th>Created / UTC</th></tr></thead><tbody>{recentShipments.map(shipment => <tr key={shipment.id}><td><Link href={`/shipments/${shipment.id}`} className={styles.mono}>{shipment.shipment_number}</Link></td><td><code>#{shipment.order_id}</code></td><td><Signal tone={shipment.is_delayed ? "danger" : shipment.status === "DELIVERED" ? "success" : undefined}>{shipment.is_delayed ? "DELAYED" : shipment.status}</Signal></td><td>{shipment.expected_delivery_at ? <time dateTime={shipment.expected_delivery_at}>{timestamp(shipment.expected_delivery_at)}</time> : "Not scheduled"}</td><td><time dateTime={shipment.created_at}>{timestamp(shipment.created_at)}</time></td></tr>)}</tbody></table>
        </DataState>
      </Panel>
      <Panel title="Recent stock movements" href="/inventory" action="Inventory">
        <DataState loading={loading} empty={!recentTransactions.length && "No recent stock movements."}>
          <table className={styles.table}><thead><tr><th>Product</th><th>Movement</th><th>Created / UTC</th><th className={styles.number}>Unit change</th></tr></thead><tbody>{recentTransactions.map(tx => <tr key={tx.id}><td>{tx.product?.name || `Product #${tx.product_id}`}</td><td><Signal>{tx.type.replace(/_/g," ")}</Signal></td><td><time dateTime={tx.created_at}>{timestamp(tx.created_at)}</time></td><td className={styles.number}>{Number(tx.delta) > 0 ? "+" : ""}{Number(tx.delta).toLocaleString()}</td></tr>)}</tbody></table>
        </DataState>
      </Panel>
      {!loading && !recentShipments.length && <DashboardExamples />}
      <footer className={styles.footer}><span>Warehouse <span className={styles.mono}>#{warehouseId}</span> / Operations workspace</span><span className={styles.mono}>{loading ? "SYNCING" : error ? "SYNC INCOMPLETE" : "SYNC COMPLETE"}</span></footer>
    </div>
  );
}
