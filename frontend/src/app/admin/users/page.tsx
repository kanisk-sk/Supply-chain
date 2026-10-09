"use client";

import React, { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/common/AppLayout";
import WorkspacePageHeader from "@/components/common/WorkspacePageHeader";
import DataTable, { Column } from "@/components/common/DataTable";
import FeedbackAlert from "@/components/common/FeedbackAlert";
import { usersApi, warehousesApi, listAllPages } from "@/lib/api";
import { User, UserRole, Warehouse, PaginationMeta } from "@/types/api";

import Modal from "@/components/common/Modal";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil } from "lucide-react";

// ADMIN-only (see PAGE_PERMISSIONS). Only ADMIN holds users:read/users:write
// on the backend, so this page is unreachable for all other roles.
export default function AdminUsersPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("users:write");
  const [editor, setEditor] = useState<{ user: User | null } | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saving, setSaving] = useState(false);
  const [choicesLoading, setChoicesLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ANALYST" as UserRole, warehouse_id: "", is_active: true });
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadUsers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, limit });
      setUsers(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(1, meta.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUsers]);

  const openEditor = async (user: User | null) => {
    setEditor({ user }); setFormError(null);
    setForm({ name: user?.name || "", email: user?.email || "", password: "", role: user?.role || "ANALYST", warehouse_id: user?.warehouse_id ? String(user.warehouse_id) : "", is_active: user?.is_active ?? true });
    setChoicesLoading(true);
    try { setWarehouses(await listAllPages<Warehouse>(page => warehousesApi.list({ page, limit: 100, is_active: true }))); }
    catch { setFormError("Could not load warehouse assignments. Close and reopen the form to retry."); }
    finally { setChoicesLoading(false); }
  };
  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || !canWrite) return;
    if (form.role === "WAREHOUSE_MANAGER" && !form.warehouse_id) { setFormError("Select an active warehouse for this manager."); return; }
    setSaving(true); setFormError(null);
    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, is_active: form.is_active, warehouse_id: form.role === "WAREHOUSE_MANAGER" ? Number(form.warehouse_id) : null };
    try {
      if (editor.user) await usersApi.update(editor.user.id, { ...payload, ...(form.password ? { password: form.password } : {}) });
      else await usersApi.create({ ...payload, password: form.password });
      setEditor(null); setFeedback({ type: "success", message: "User access saved." }); await loadUsers(meta.page, meta.limit);
    } catch (error) { setFormError(error instanceof Error ? error.message : "Could not save user access."); }
    finally { setSaving(false); }
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    SUPPLY_CHAIN_MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
    WAREHOUSE_MANAGER: "bg-amber-100 text-amber-800 border-amber-200",
    ANALYST: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div>
          <p className="font-semibold text-slate-900">{u.name}</p>
          <span className="text-xs text-slate-500">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <span
          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
            roleColors[u.role] || "bg-slate-100 text-slate-700"
          }`}
        >
          {u.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (u) => (
        <span className="text-xs text-slate-600">
          {u.warehouse_id !== null && u.warehouse_id !== undefined ? `#${u.warehouse_id}` : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) =>
        u.is_active ? (
          <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            Active
          </span>
        ) : (
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
            Inactive
          </span>
        ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (u) => (
        <span className="text-xs text-slate-500">{new Date(u.created_at).toLocaleString()}</span>
      ),
    },
    ...(canWrite ? [{ key: "actions", header: "Actions", render: (user: User) => <button type="button" aria-label={`Edit ${user.name}`} onClick={() => openEditor(user)} className="rounded border border-slate-300 p-1.5"><Pencil size={14} /></button> }] : []),
  ];

  return (
    <ProtectedRoute requiredPermissions={["users:read"]} requiredRoles={["ADMIN"]}>
      <AppLayout>
        <div className="space-y-6">
          <WorkspacePageHeader title="User management" section="Administration" description="User access, assigned roles, and warehouse assignments.">
            {canWrite && <button type="button" onClick={() => openEditor(null)} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white"><Plus size={14} />Create user</button>}
          </WorkspacePageHeader>

          {feedback && (
            <FeedbackAlert type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
          )}

          <DataTable
            columns={columns}
            data={users}
            isLoading={loading}
            meta={meta}
            onPageChange={(p) => loadUsers(p, meta.limit)}
            onLimitChange={(l) => loadUsers(1, l)}
            emptyMessage="No users found."
          />
          <Modal isOpen={!!editor} onClose={() => { if (!saving) setEditor(null); }} title={editor?.user ? "Edit user access" : "Create user"}>
            <form onSubmit={saveUser} className="space-y-4">
              {formError && <FeedbackAlert type="error" message={formError} />}
              <label className="block text-xs">Name<input required maxLength={120} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>
              <label className="block text-xs">Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>
              <label className="block text-xs">{editor?.user ? "New password (leave blank to keep current)" : "Initial password"}<input required={!editor?.user} type="password" autoComplete="new-password" minLength={8} maxLength={72} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>
              <label className="block text-xs">Role<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value as UserRole, warehouse_id: "" })} className="mt-1 block w-full rounded border border-slate-300 p-2">{(["ADMIN", "WAREHOUSE_MANAGER", "SUPPLY_CHAIN_MANAGER", "ANALYST"] as UserRole[]).map(role => <option key={role}>{role}</option>)}</select></label>
              {form.role === "WAREHOUSE_MANAGER" && <label className="block text-xs">Assigned warehouse<select required disabled={choicesLoading} value={form.warehouse_id} onChange={event => setForm({ ...form, warehouse_id: event.target.value })} className="mt-1 block w-full rounded border border-slate-300 p-2"><option value="">{choicesLoading ? "Loading warehouses…" : "Select an active warehouse"}</option>{warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} — {warehouse.name}</option>)}</select></label>}
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.is_active} onChange={event => setForm({ ...form, is_active: event.target.checked })} />Active account</label>
              <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setEditor(null)} className="rounded border border-slate-300 px-3 py-2 text-xs">Cancel</button><button type="submit" disabled={saving || choicesLoading} className="rounded bg-indigo-600 px-3 py-2 text-xs text-white">{saving ? "Saving…" : "Save access"}</button></div>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
