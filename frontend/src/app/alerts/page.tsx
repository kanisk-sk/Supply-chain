"use client";

import React, { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/common/AppLayout";
import WorkspacePageHeader from "@/components/common/WorkspacePageHeader";
import workspaceStyles from "@/components/common/workspace.module.css";
import DataTable, { Column } from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import FeedbackAlert from "@/components/common/FeedbackAlert";
import { alertsApi } from "@/lib/api";
import { Alert, PaginationMeta, AlertType, AlertSeverity } from "@/types/api";
import Link from "next/link";
import { AlertTriangle, Filter, CheckCircle2 } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [resolvedFilter, setResolvedFilter] = useState<string>("false"); // default to active

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAlerts = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await alertsApi.list({
        page,
        limit,
        type: typeFilter || undefined,
        severity: severityFilter || undefined,
        resolved:
          resolvedFilter === "all"
            ? undefined
            : resolvedFilter === "true"
            ? true
            : false,
      });
      setAlerts(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load alerts" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, severityFilter, resolvedFilter]);

  useEffect(() => {
    loadAlerts(1, meta.limit);
  }, [loadAlerts, meta.limit]);

  const columns: Column<Alert>[] = [
    {
      key: "type",
      header: "Alert Type",
      render: (a) => <StatusBadge alertType={a.type} />,
    },
    {
      key: "severity",
      header: "Severity",
      render: (a) => <StatusBadge severity={a.severity} />,
    },
    {
      key: "entity",
      header: "Entity Reference",
      render: (a) => {
        if (a.entity_type === "shipment") {
          return (
            <Link
              href={`/shipments/${a.entity_id}`}
              className="text-xs font-mono font-semibold text-indigo-600 hover:underline"
            >
              Shipment #{a.entity_id}
            </Link>
          );
        }
        if (a.entity_type === "product" || a.entity_type === "inventory") {
          return (
            <Link
              href="/inventory"
              className="text-xs font-mono font-semibold text-indigo-600 hover:underline"
            >
              {a.entity_type.toUpperCase()} #{a.entity_id}
            </Link>
          );
        }
        return (
          <span className="text-xs font-mono text-slate-500">
            {a.entity_type} #{a.entity_id}
          </span>
        );
      },
    },
    {
      key: "message",
      header: "Description / Condition",
      render: (a) => <span className="text-slate-900 font-medium text-xs">{a.message}</span>,
    },
    {
      key: "status",
      header: "Condition Status",
      render: (a) =>
        a.is_resolved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" /> Active
          </span>
        ),
    },
    {
      key: "created_at",
      header: "Triggered At",
      render: (a) => (
        <span className="text-xs text-slate-500">
          {new Date(a.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "resolved_at",
      header: "Resolved At",
      render: (a) => (
        <span className="text-xs text-slate-400">
          {a.resolved_at ? new Date(a.resolved_at).toLocaleString() : "-"}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute requiredPermissions={["alerts:read"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <WorkspacePageHeader title="Alerts" section="Insights" description="Stock and delivery conditions that need attention." />

          <details className={workspaceStyles.help}>
            <summary>How automatic alerts work</summary>
            <p>Alerts appear when stock falls below a reorder point or a shipment passes its expected delivery time. They resolve automatically when the condition clears. Alert states cannot be edited manually.</p>
          </details>

          {feedback && (
            <FeedbackAlert
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          )}

          {/* Filters Bar */}
          <div className={workspaceStyles.filters}>
            <div className="flex items-center gap-1 text-slate-400">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-medium text-slate-700">Filters:</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-slate-300 py-1.5 px-2.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="LOW_STOCK">LOW_STOCK</option>
              <option value="SHIPMENT_OVERDUE">SHIPMENT_OVERDUE</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-md border border-slate-300 py-1.5 px-2.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>

            <select
              value={resolvedFilter}
              onChange={(e) => setResolvedFilter(e.target.value)}
              className="rounded-md border border-slate-300 py-1.5 px-2.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="false">Active Only (Unresolved)</option>
              <option value="true">Resolved Only</option>
              <option value="all">All Records</option>
            </select>

            {(typeFilter || severityFilter || resolvedFilter !== "false") && (
              <button
                onClick={() => {
                  setTypeFilter("");
                  setSeverityFilter("");
                  setResolvedFilter("false");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={alerts}
            isLoading={loading}
            meta={meta}
            onPageChange={(p) => loadAlerts(p, meta.limit)}
            onLimitChange={(l) => loadAlerts(1, l)}
            emptyMessage="No alerts found matching the selected criteria."
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

