import { AnalyticsOverview, BottleneckAnalytics, InventoryAnalytics, ShipmentAnalytics, SupplierAnalytics } from "@/types/api";

// Adapt the backend analytics fields only for the dashboard. Missing collections
// become empty arrays before JSX children are evaluated by React.
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(record) : [];
}
function number(value: unknown): number {
  return typeof value === "number" || typeof value === "string" ? Number(value) || 0 : 0;
}
function hours(value: unknown): number | null {
  return value == null ? null : number(value);
}

export function dashboardOverview(value: unknown): AnalyticsOverview {
  const data = record(value);
  return {
    product_count: number(data.total_products ?? data.product_count),
    total_stock: number(data.total_inventory_units ?? data.total_stock),
    low_stock_count: number(data.low_stock_items ?? data.low_stock_count),
    active_orders_count: number(data.active_orders ?? data.active_orders_count),
    in_transit_shipments_count: number(data.shipments_in_transit ?? data.in_transit_shipments_count),
    delayed_shipments_count: number(data.delayed_shipments ?? data.delayed_shipments_count),
  };
}
export function dashboardInventory(value: unknown): InventoryAnalytics {
  const data = record(value);
  return {
    total_inventory: number(data.total_stock ?? data.total_inventory),
    low_stock_items: number(data.low_stock_items),
    by_warehouse: rows(data.stock_by_warehouse ?? data.by_warehouse).map(row => ({
      warehouse_id: number(row.warehouse_id),
      warehouse_name: String(row.warehouse_name ?? ""),
      total_quantity: number(row.total_stock ?? row.total_quantity),
    })),
    by_product: rows(data.stock_by_product ?? data.by_product).map(row => ({
      product_id: number(row.product_id),
      product_name: String(row.name ?? row.product_name ?? ""),
      sku: String(row.sku ?? ""),
      total_quantity: number(row.total_stock ?? row.total_quantity),
    })),
  };
}
export type DashboardShipmentAnalytics = Omit<ShipmentAnalytics, "on_time_count"> & { on_time_count: number | null };
export function dashboardShipments(value: unknown): DashboardShipmentAnalytics {
  const data = record(value);
  return {
    delivered_count: number(data.delivered_shipments ?? data.delivered_count),
    delayed_count: number(data.delayed_shipments ?? data.delayed_count),
    // Backend performance buckets cover a time window, not the all-time total.
    on_time_count: data.on_time_count == null ? null : number(data.on_time_count),
    avg_delivery_hours: hours(data.average_delivery_hours ?? data.avg_delivery_hours),
    avg_delay_hours: hours(data.average_delay_hours ?? data.avg_delay_hours),
  };
}
export function dashboardSuppliers(value: unknown): SupplierAnalytics {
  const data = record(value);
  return { suppliers: rows(data.suppliers).map(row => ({
    supplier_id: number(row.supplier_id),
    supplier_name: String(row.name ?? row.supplier_name ?? ""),
    supplier_code: String(row.code ?? row.supplier_code ?? ""),
    total_orders: number(row.order_count ?? row.total_orders),
    performance_score: row.on_time_delivery_rate == null
      ? hours(row.performance_score)
      : row.delivery_count === 0 ? null : Math.round(number(row.on_time_delivery_rate) * 10000) / 100,
  })) };
}
export function dashboardBottlenecks(value: unknown): BottleneckAnalytics {
  const data = record(value);
  return { stages: rows(data.segments ?? data.stages).map(row => ({
    stage: String(row.name ?? row.stage ?? ""),
    count: number(row.count),
    avg_hours: hours(row.avg_hours),
    p50_hours: hours(row.p50_hours),
    p90_hours: hours(row.p90_hours),
  })) };
}
