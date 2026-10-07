import { describe, expect, it } from "vitest";
import { dashboardOverview, dashboardInventory, dashboardShipments, dashboardSuppliers, dashboardBottlenecks } from "./analytics-data";

describe("dashboard backend analytics contract", () => {
  it("maps lifecycle segments to table stages", () => {
    expect(dashboardBottlenecks({ segments: [{ name: "packed_to_in_transit", count: 5, avg_hours: 2.4, p50_hours: 2, p90_hours: 3.5 }], unit: "hours" }).stages).toEqual([{ stage: "packed_to_in_transit", count: 5, avg_hours: 2.4, p50_hours: 2, p90_hours: 3.5 }]);
  });
  it("provides safe empty table arrays when response collections are absent", () => {
    expect(dashboardBottlenecks({}).stages).toEqual([]);
    expect(dashboardInventory({}).by_warehouse).toEqual([]);
    expect(dashboardSuppliers({}).suppliers).toEqual([]);
  });
  it("maps live overview metrics without replacing real counts with zeros", () => {
    expect(dashboardOverview({ total_products: 24, total_inventory_units: 7200, low_stock_items: 3, active_orders: 12, shipments_in_transit: 8, delayed_shipments: 2 })).toEqual({ product_count: 24, total_stock: 7200, low_stock_count: 3, active_orders_count: 12, in_transit_shipments_count: 8, delayed_shipments_count: 2 });
  });
  it("maps warehouse stock quantities and totals", () => {
    const result = dashboardInventory({ total_stock: 7200, stock_by_warehouse: [{ warehouse_id: 4, warehouse_name: "Mumbai Hub", total_stock: 3200 }] });
    expect(result.total_inventory).toBe(7200);
    expect(result.by_warehouse).toEqual([{ warehouse_id: 4, warehouse_name: "Mumbai Hub", total_quantity: 3200 }]);
  });
  it("maps supplier identity, order count and delivery rate", () => {
    expect(dashboardSuppliers({ suppliers: [{ supplier_id: 7, name: "Deccan Packaging", code: "SUP-DCP-007", order_count: 15, delivery_count: 10, on_time_delivery_rate: .9 }] }).suppliers[0]).toEqual({ supplier_id: 7, supplier_name: "Deccan Packaging", supplier_code: "SUP-DCP-007", total_orders: 15, performance_score: 90 });
  });
  it("maps shipment totals and timing without inventing an all-time on-time count", () => {
    const result = dashboardShipments({ delivered_shipments: 12, delayed_shipments: 2, average_delivery_hours: 28.5, average_delay_hours: null });
    expect(result).toMatchObject({ delivered_count: 12, delayed_count: 2, avg_delivery_hours: 28.5, avg_delay_hours: null });
    expect(result.on_time_count).toBeNull();
  });
  it("preserves supported frontend-shaped results", () => {
    const data = { stages: [{ stage: "packed", count: 0, avg_hours: null, p50_hours: null, p90_hours: null }] };
    expect(dashboardBottlenecks(data)).toEqual(data);
  });
});
