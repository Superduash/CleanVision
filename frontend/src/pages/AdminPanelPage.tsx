import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  LayoutGrid,
  Activity,
  Database,
  ScanLine,
  Trash2,
  Edit2,
  Plus,
  UserPlus,
  Crown,
  UserX,
  CheckCircle2,
  Loader2,
  ClipboardList,
  Search,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useQuery as useFireQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getAllAdmins, grantAdmin, revokeAdmin, type AdminRecord } from "@/lib/adminService";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "rooms",   label: "Rooms",       icon: LayoutGrid },
  { id: "access",  label: "Access",      icon: ShieldCheck },
  { id: "system",  label: "System",      icon: Activity },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function SmallConfirm({
  message,
  onConfirm,
  onCancel,
  isLoading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-bg">
          <Trash2 className="h-5 w-5 text-danger" />
        </div>
        <p className="mt-3 text-sm font-medium text-text-primary">{message}</p>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button
            className="flex-1 bg-danger hover:bg-danger/90 shadow-none"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Rooms Tab ─────────────────────────────────────────────────────────────────
function RoomsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: api.listRooms,
    select: (d) => d.rooms,
  });

  const rooms = (data ?? []).filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.block?.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingId(null);
    },
    onError: () => toast.error("Failed to delete room."),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            className="h-10 w-full rounded-xl border border-border bg-bg pl-9 pr-4 text-sm text-text-primary outline-none focus:border-primary focus:shadow-focus"
            placeholder="Search rooms or blocks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link to="/dashboard/rooms/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-5 py-3 font-semibold text-text-muted">Room</th>
                <th className="px-5 py-3 font-semibold text-text-muted">Block</th>
                <th className="px-5 py-3 font-semibold text-text-muted">Status</th>
                <th className="px-5 py-3 font-semibold text-text-muted">Score</th>
                <th className="px-5 py-3 font-semibold text-text-muted">Last Scanned</th>
                <th className="px-5 py-3 font-semibold text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3">
                      <div className="h-5 skeleton rounded" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && rooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-text-muted">
                    {search ? "No rooms match your search." : "No rooms yet. Add one to get started."}
                  </td>
                </tr>
              )}
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-highlight transition-colors">
                  <td className="px-5 py-3 font-medium text-text-primary">
                    <Link to={`/dashboard/rooms/${room.id}`} className="hover:text-primary hover:underline">
                      {room.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{room.block ?? "—"}</td>
                  <td className="px-5 py-3">
                    {room.latest_status ? <StatusBadge status={room.latest_status} /> : (
                      <span className="text-xs text-text-disabled">Not scanned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {room.latest_score != null ? (
                      <span className={cn(
                        "font-mono font-bold text-base",
                        room.latest_status === "clean" ? "text-success" :
                        room.latest_status === "needs_attention" ? "text-warning" : "text-danger"
                      )}>
                        {Math.round(room.latest_score)}
                      </span>
                    ) : <span className="text-text-disabled">—</span>}
                  </td>
                  <td className="px-5 py-3 text-text-muted text-xs">
                    {room.last_scanned
                      ? formatDistanceToNow(new Date(room.last_scanned), { addSuffix: true })
                      : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/dashboard/rooms/${room.id}/edit`}>
                        <button className="rounded-lg p-1.5 text-text-disabled hover:bg-highlight hover:text-primary transition-colors" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <Link to={`/dashboard/scan?room=${room.id}`}>
                        <button className="rounded-lg p-1.5 text-text-disabled hover:bg-highlight hover:text-accent transition-colors" title="Scan">
                          <ScanLine className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => setDeletingId(room.id)}
                        className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deletingId !== null && (
        <SmallConfirm
          message={`Delete "${rooms.find(r => r.id === deletingId)?.name ?? "this room"}"? All scans will also be deleted.`}
          onConfirm={() => deleteMutation.mutate(deletingId)}
          onCancel={() => setDeletingId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// ── Access Tab ────────────────────────────────────────────────────────────────
function AccessTab() {
  const { session } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useFireQuery({
    queryKey: ["admin-list"],
    queryFn: getAllAdmins,
  });

  const grantMutation = useMutation({
    mutationFn: (email: string) => grantAdmin(email, session?.email ?? "admin"),
    onSuccess: () => {
      toast.success(`Admin access granted.`);
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to grant admin."),
  });

  const revokeMutation = useMutation({
    mutationFn: (email: string) => revokeAdmin(email),
    onSuccess: () => {
      toast.success("Admin access revoked.");
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to revoke admin."),
  });

  return (
    <div className="space-y-5">
      {/* Grant form */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Grant Admin Access
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          The user must already have a CleanVision account. They'll get admin role on next sign-in.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="h-10 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-text-primary outline-none focus:border-primary focus:shadow-focus"
            placeholder="user@hospital.com"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newEmail && grantMutation.mutate(newEmail)}
          />
          <Button
            size="sm"
            onClick={() => newEmail && grantMutation.mutate(newEmail)}
            isLoading={grantMutation.isPending}
            disabled={!newEmail}
          >
            Grant
          </Button>
        </div>
      </div>

      {/* Admin list */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-semibold text-text-primary">Current Admins</h3>
        </div>
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="h-8 w-8 skeleton rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>
            </div>
          ))}
          {admins.map((admin: AdminRecord) => (
            <div key={admin.email} className="flex items-center gap-3 px-5 py-4 hover:bg-highlight transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {admin.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{admin.email}</p>
                  {admin.isSuperAdmin && (
                    <span className="flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
                      <Crown className="h-3 w-3" /> Super Admin
                    </span>
                  )}
                </div>
                {admin.grantedAt ? (
                  <p className="text-xs text-text-disabled">
                    Granted {format(admin.grantedAt, "dd MMM yyyy")}
                    {admin.grantedBy && ` by ${admin.grantedBy}`}
                  </p>
                ) : (
                  <p className="text-xs text-text-disabled">System admin</p>
                )}
              </div>
              {!admin.isSuperAdmin && (
                <button
                  onClick={() => revokeMutation.mutate(admin.email)}
                  disabled={revokeMutation.isPending}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-danger-bg hover:text-danger transition-colors disabled:opacity-50"
                  title="Revoke admin"
                >
                  <UserX className="h-3.5 w-3.5" /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── System Tab ────────────────────────────────────────────────────────────────
function SystemTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: api.getAdminStats,
    refetchInterval: 60_000,
  });

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30_000,
  });

  const isHealthy = health?.status === "ok";

  const statCards = [
    { label: "Total Rooms",          value: stats?.total_rooms,          icon: LayoutGrid,   color: "text-primary" },
    { label: "Total Scans",          value: stats?.total_scans,          icon: ScanLine,     color: "text-accent"  },
    { label: "Pending Requests",     value: stats?.pending_requests,     icon: ClipboardList, color: "text-warning" },
    { label: "Unread Notifications", value: stats?.unread_notifications, icon: Activity,     color: "text-danger"  },
  ];

  return (
    <div className="space-y-5">
      {/* Status + model */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Backend Status</h3>
          <div className="mt-3 flex items-center gap-3">
            <span className={cn("dot-pulse", isHealthy ? "bg-success" : "bg-danger")} />
            <span className={cn("font-semibold", isHealthy ? "text-success" : "text-danger")}>
              {health ? (isHealthy ? "Operational" : "Degraded") : "Checking…"}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">AI Model</h3>
          <div className="mt-3 flex items-center gap-3">
            {stats?.mock_mode == null ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-disabled" />
            ) : stats.mock_mode ? (
              <>
                <span className="dot-pulse bg-warning" />
                <span className="font-semibold text-warning">Mock Mode (no model file)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="font-semibold text-success">Real Model Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <Icon className={cn("h-5 w-5", color)} />
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {isLoading ? <span className="inline-block w-12 h-7 skeleton rounded" /> : (value ?? "—")}
            </p>
            <p className="mt-0.5 text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Database info */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Database</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-text-muted">Rooms</span>
            <span className="font-mono font-semibold text-text-primary">{stats?.total_rooms ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-text-muted">Scans</span>
            <span className="font-mono font-semibold text-text-primary">{stats?.total_scans ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AdminPanelPage() {
  const [tab, setTab] = useState<TabId>("rooms");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Admin Panel
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage rooms, user access, and monitor system health.
        </p>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit shadow-card">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              tab === id
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "rooms"  && <RoomsTab />}
      {tab === "access" && <AccessTab />}
      {tab === "system" && <SystemTab />}
    </div>
  );
}
