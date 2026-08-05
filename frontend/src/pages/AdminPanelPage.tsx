import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  LayoutGrid,
  Activity,
  ScanLine,
  Trash2,
  Edit2,
  Plus,
  UserPlus,
  Users,
  CheckCircle2,
  Loader2,
  ClipboardList,
  Search,
  Settings,
  QrCode,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, Room } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useHospitalConfig } from "@/hooks/useHospitalConfig";
import { createManager, createInspector, listStaff } from "@/lib/adminService";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "rooms font-medium", label: "Rooms & QR Codes", icon: QrCode },
  { id: "staff", label: "Staff Provisioning", icon: Users },
  { id: "settings", label: "Hospital Config", icon: Settings },
  { id: "system", label: "System Health", icon: Activity },
] as const;
type TabId = "rooms" | "staff" | "settings" | "system";

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

// ── Print QR Code Modal ───────────────────────────────────────────────────────
function QRPrintModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { config } = useHospitalConfig();
  const roomCode = room.roomCode || `${config.hospitalCode}-${room.block.replace(/\s+/g, '')}-${room.name.replace(/\D/g, '') || '101'}-A`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    window.location.origin + "/report/" + roomCode
  )}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised space-y-4 print:border-none print:shadow-none">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-disabled hover:text-text-muted print:hidden">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="font-bold text-lg text-text-primary">{config.hospitalName}</h3>
          <p className="text-xs text-text-muted">Scan QR code to report cleanliness issues</p>
        </div>

        <div className="flex flex-col items-center justify-center border border-border rounded-xl p-6 bg-white shadow-inner">
          <img src={qrUrl} alt={`QR Code for ${room.name}`} className="h-44 w-44" />
          <p className="mt-3 font-mono font-bold text-sm text-black">{roomCode}</p>
          <p className="text-xs font-semibold text-black/70">{room.name} · {room.block}</p>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 gap-1.5" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print QR
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
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [qrRoom, setQrRoom] = useState<Room | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.listRooms(),
    select: (d) => d.rooms,
  });

  const rooms = (data ?? []).filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.block?.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.deleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingId(null);
    },
    onError: () => toast.error("Failed to delete room."),
  });

  return (
    <div className="space-y-4">
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

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-5 py-3 font-semibold text-text-muted">Room</th>
                <th className="px-5 py-3 font-semibold text-text-muted">Block</th>
                <th className="px-5 py-3 font-semibold text-text-muted">QR Code</th>
                <th className="px-5 py-3 font-semibold text-text-muted">Status</th>
                <th className="px-5 py-3 font-semibold text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-5 skeleton rounded" /></td>
                  ))}
                </tr>
              ))}
              {!isLoading && rooms.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-text-muted">
                    No rooms found.
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
                  <td className="px-5 py-3 text-text-muted">{room.block}</td>
                  <td className="px-5 py-3 font-mono text-xs text-primary font-semibold">
                    {room.roomCode || `${room.block.replace(/\s+/g, '')}-${room.name.replace(/\D/g, '') || '101'}-A`}
                  </td>
                  <td className="px-5 py-3">
                    {room.latest_status ? <StatusBadge status={room.latest_status} /> : (
                      <span className="text-xs text-text-disabled">Not scanned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setQrRoom(room)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <QrCode className="h-3.5 w-3.5" /> Print QR
                      </button>
                      <Link to={`/dashboard/rooms/${room.id}/edit`}>
                        <button className="rounded-lg p-1.5 text-text-disabled hover:bg-highlight hover:text-primary transition-colors" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
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
          message="Delete room? All associated scans will also be deleted."
          onConfirm={() => deleteMutation.mutate(deletingId)}
          onCancel={() => setDeletingId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {qrRoom && <QRPrintModal room={qrRoom} onClose={() => setQrRoom(null)} />}
    </div>
  );
}

// ── Staff Provisioning Tab ────────────────────────────────────────────────────
function StaffTab() {
  const { session } = useAuth();
  const { config } = useHospitalConfig();

  const [roleToCreate, setRoleToCreate] = useState<"manager" | "inspector">("manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const createManagerMutation = useMutation({
    mutationFn: () => createManager({ email, password, name }),
    onSuccess: () => {
      toast.success("Manager account created.");
      setEmail(""); setPassword(""); setName("");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create manager."),
  });

  const createInspectorMutation = useMutation({
    mutationFn: () => createInspector({ email, password, name, assignedBlocks: selectedBlocks }),
    onSuccess: () => {
      toast.success("Inspector account created.");
      setEmail(""); setPassword(""); setName(""); setSelectedBlocks([]);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create inspector."),
  });

  const toggleBlock = (block: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (roleToCreate === "manager") {
      createManagerMutation.mutate();
    } else {
      createInspectorMutation.mutate();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Provision Staff Account
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          Server-side role custom claims assignment.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">Role</label>
            <div className="mt-2 flex gap-3">
              {session?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => setRoleToCreate("manager")}
                  className={cn(
                    "flex-1 rounded-xl border p-2.5 text-xs font-bold transition-all",
                    roleToCreate === "manager" ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted"
                  )}
                >
                  Manager
                </button>
              )}
              <button
                type="button"
                onClick={() => setRoleToCreate("inspector")}
                className={cn(
                  "flex-1 rounded-xl border p-2.5 text-xs font-bold transition-all",
                  roleToCreate === "inspector" ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted"
                )}
              >
                Inspector
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">Full Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              placeholder="Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">Email Address</label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              placeholder="sarah@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">Password</label>
            <input
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {roleToCreate === "inspector" && (
            <div>
              <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">
                Assigned Blocks
              </label>
              <div className="flex flex-wrap gap-2">
                {config.blocks.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBlock(b)}
                    className={cn(
                      "rounded-lg border px-3 py-1 text-xs font-semibold transition-all",
                      selectedBlocks.includes(b)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-bg text-text-muted hover:border-text-disabled"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={createManagerMutation.isPending || createInspectorMutation.isPending}
          >
            Create {roleToCreate === "manager" ? "Manager" : "Inspector"} Account
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card flex flex-col">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-semibold text-text-primary">Staff Roster</h3>
        </div>
        <div className="divide-y divide-border overflow-y-auto max-h-[440px]">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4"><div className="h-4 skeleton rounded w-1/2" /></div>
          ))}
          {!isLoading && staff.length === 0 && (
            <div className="py-12 text-center text-xs text-text-muted">
              No staff members registered.
            </div>
          )}
          {staff.map((member) => (
            <div key={member.uid} className="flex items-center justify-between p-4 hover:bg-highlight transition-colors">
              <div>
                <p className="font-medium text-text-primary text-sm">{member.name || member.email}</p>
                <p className="text-xs text-text-disabled">{member.email}</p>
                {member.assignedBlocks && member.assignedBlocks.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {member.assignedBlocks.map((b) => (
                      <span key={b} className="rounded bg-bg px-1.5 py-0.5 text-[10px] text-text-muted border border-border">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hospital Config Settings Tab ─────────────────────────────────────────────
function SettingsTab() {
  const { config, updateConfig, isUpdating } = useHospitalConfig();

  const [name, setName] = useState(config.hospitalName);
  const [code, setCode] = useState(config.hospitalCode);
  const [email, setEmail] = useState(config.supportEmail);
  const [blocksStr, setBlocksStr] = useState(config.blocks.join(", "));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const blocks = blocksStr.split(",").map((b) => b.trim()).filter(Boolean);
    try {
      await updateConfig({
        hospitalName: name,
        hospitalCode: code,
        supportEmail: email,
        blocks,
      });
      toast.success("Hospital configuration updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card max-w-2xl space-y-6">
      <div>
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> Hospital Singleton Configuration
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          Manage facility settings without modifying application source code.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-text-muted">Hospital Name</label>
          <input
            type="text"
            required
            className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">Hospital Code</label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-primary"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <p className="mt-1 text-[11px] text-text-disabled">Used as prefix in room QR codes (e.g. CGH-B-101-A)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">Support Email</label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-text-muted">Facility Blocks (Comma Separated)</label>
          <input
            type="text"
            required
            className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
            value={blocksStr}
            onChange={(e) => setBlocksStr(e.target.value)}
          />
        </div>

        <Button type="submit" isLoading={isUpdating} className="w-full">
          Save Configuration Changes
        </Button>
      </form>
    </div>
  );
}

// ── System Tab ────────────────────────────────────────────────────────────────
function SystemTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getAdminStats(),
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
    { label: "Open Issue Alerts",    value: stats?.open_issues,          icon: ClipboardList, color: "text-warning" },
    { label: "Unread Notifications", value: stats?.unread_notifications, icon: Activity,     color: "text-danger"  },
  ];

  return (
    <div className="space-y-5">
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
                <span className="font-semibold text-warning">Mock Mode Active</span>
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
    </div>
  );
}

// ── Main Admin / Manager Operations Page ──────────────────────────────────────
export function AdminPanelPage() {
  const [tab, setTab] = useState<TabId>("rooms");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Facility Management & Operations
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage rooms, generate QR codes, provision staff, and update hospital settings.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit shadow-card overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as TabId)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
              tab === id
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "rooms"    && <RoomsTab />}
      {tab === "staff"    && <StaffTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "system"   && <SystemTab />}
    </div>
  );
}
