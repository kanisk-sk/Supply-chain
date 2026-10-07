"use client";

import React from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/common/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import WarehouseManagerDashboard from "@/components/dashboard/WarehouseManagerDashboard";
import { useAuth } from "@/context/AuthContext";

// Role-specific dashboard entry point. Every authenticated role can view "/dashboard"
// (see PAGE_PERMISSIONS), but each role only mounts the dashboard whose API
// calls it is authorized for — so no role fires requests that 403:
//
// - ADMIN / SUPPLY_CHAIN_MANAGER / ANALYST → full analytics dashboard
//   (all hold analytics:read + alerts:read).
// - WAREHOUSE_MANAGER → warehouse-scoped operational dashboard (no
//   analyticsApi calls; the backend denies analytics:read to this role).
export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  return (
    <ProtectedRoute>
      <div className={styles.workspace} data-dashboard-workspace><AppLayout>
        {isLoading || !user ? (
          <div className={styles.loading} role="status">Loading your operations workspace…<div className={styles.skeleton} /><div className={styles.skeleton} /></div>
        ) : user.role === "WAREHOUSE_MANAGER" ? (
          <WarehouseManagerDashboard warehouseId={user.warehouse_id} />
        ) : user.role === "SUPPLY_CHAIN_MANAGER" ? (
          <AdminDashboard
            title="Supply chain overview"
            subtitle="Supplier activity, stock levels and shipments across your warehouses."
          />
        ) : user.role === "ANALYST" ? (
          <AdminDashboard
            title="Analytics overview"
            subtitle="Review inventory, delivery performance and supplier lead times."
          />
        ) : (
          <AdminDashboard />
        )}
      </AppLayout></div>
    </ProtectedRoute>
  );
}
