"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  LayoutDashboard,
  UsersRound,
  Settings2,
  Table as TableIcon,
  UserPlus,
  CircleUser,
  UserRound,
  TrendingDown,
  PanelsLeftBottom,
  Trello,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Role = "admin" | "moderator" | "host" | "member"
type Status = "active" | "suspended" | "pending"

type User = {
  id: string
  name: string
  email: string
  role: Role
  status: Status
  verified: boolean
  joinedAt: string
}

type Report = {
  id: string
  type: "post" | "listing" | "message"
  reportedBy: string
  targetTitle: string
  reason: string
  createdAt: string
  severity: "low" | "medium" | "high"
}

type Analytics = {
  activeUsers: number
  newSignups: number
  bookingsThisWeek: number
  bookingsChange: number
  revenueThisMonth: number
  revenueChange: number
  disputeOpen: number
  avgResponseHrs: number
}

export interface AdminDashboardProps {
  className?: string
  initialUsers?: User[]
  initialReports?: Report[]
  initialAnalytics?: Analytics
  onExport?: (payload: { users: User[]; reports: Report[] }) => void
}

const defaultUsers: User[] = [
  {
    id: "usr_01",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    role: "host",
    status: "active",
    verified: true,
    joinedAt: "2024-11-10",
  },
  {
    id: "usr_02",
    name: "Priya Sharma",
    email: "priya.s@example.com",
    role: "member",
    status: "pending",
    verified: false,
    joinedAt: "2025-01-05",
  },
  {
    id: "usr_03",
    name: "Marcus Chen",
    email: "marcus.chen@example.com",
    role: "moderator",
    status: "active",
    verified: true,
    joinedAt: "2024-08-23",
  },
  {
    id: "usr_04",
    name: "Sara Müller",
    email: "sara.mueller@example.com",
    role: "member",
    status: "suspended",
    verified: false,
    joinedAt: "2024-06-14",
  },
  {
    id: "usr_05",
    name: "Diego Alvarez",
    email: "diego.alvarez@example.com",
    role: "host",
    status: "active",
    verified: false,
    joinedAt: "2025-02-20",
  },
]

const defaultReports: Report[] = [
  {
    id: "rep_1001",
    type: "listing",
    reportedBy: "usr_21",
    targetTitle: "Pro Camera Kit A7",
    reason: "Misleading price info",
    createdAt: "2025-08-30",
    severity: "medium",
  },
  {
    id: "rep_1002",
    type: "post",
    reportedBy: "usr_08",
    targetTitle: "Weekend rental recap",
    reason: "Harassment in comments",
    createdAt: "2025-09-02",
    severity: "high",
  },
  {
    id: "rep_1003",
    type: "message",
    reportedBy: "usr_32",
    targetTitle: "DM #8821",
    reason: "Spam/scam attempt",
    createdAt: "2025-09-08",
    severity: "low",
  },
]

const defaultAnalytics: Analytics = {
  activeUsers: 12450,
  newSignups: 482,
  bookingsThisWeek: 938,
  bookingsChange: 7.4,
  revenueThisMonth: 183_420,
  revenueChange: -2.1,
  disputeOpen: 36,
  avgResponseHrs: 3.2,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default function AdminDashboard({
  className,
  initialUsers = defaultUsers,
  initialReports = defaultReports,
  initialAnalytics = defaultAnalytics,
  onExport,
}: AdminDashboardProps) {
  const [users, setUsers] = React.useState<User[]>(initialUsers)
  const [reports, setReports] = React.useState<Report[]>(initialReports)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<Role | "all">("all")
  const [statusFilter, setStatusFilter] = React.useState<Status | "all">("all")
  const [onlyVerified, setOnlyVerified] = React.useState(false)
  const [denseMode, setDenseMode] = React.useState(false)

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.id.toLowerCase().includes(query.toLowerCase())
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter
      const matchesStatus = statusFilter === "all" ? true : u.status === statusFilter
      const matchesVerified = onlyVerified ? u.verified : true
      return matchesQuery && matchesRole && matchesStatus && matchesVerified
    })
  }, [users, query, roleFilter, statusFilter, onlyVerified])

  const allVisibleSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id))
  const someVisibleSelected = filteredUsers.some((u) => selectedIds.has(u.id))

  function toggleSelectAll(checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) {
      filteredUsers.forEach((u) => next.add(u.id))
    } else {
      filteredUsers.forEach((u) => next.delete(u.id))
    }
    setSelectedIds(next)
  }

  function toggleSelect(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  function bulkUpdateStatus(status: Status) {
    if (selectedIds.size === 0) {
      toast.message("No users selected", { description: "Select at least one user to perform bulk actions." })
      return
    }
    setUsers((prev) => prev.map((u) => (selectedIds.has(u.id) ? { ...u, status } : u)))
    toast.success(`Updated ${selectedIds.size} account${selectedIds.size > 1 ? "s" : ""} to ${status}.`)
    setSelectedIds(new Set())
  }

  function bulkVerify(verified: boolean) {
    if (selectedIds.size === 0) {
      toast.message("No users selected", { description: "Select at least one user to verify or remove badge." })
      return
    }
    setUsers((prev) => prev.map((u) => (selectedIds.has(u.id) ? { ...u, verified } : u)))
    toast.success(`${verified ? "Verified" : "Removed verification for"} ${selectedIds.size} user${selectedIds.size > 1 ? "s" : ""}.`)
    setSelectedIds(new Set())
  }

  function exportCSV() {
    const data = filteredUsers
    const header = ["id", "name", "email", "role", "status", "verified", "joinedAt"]
    const rows = data.map((u) => [u.id, u.name, u.email, u.role, u.status, String(u.verified), u.joinedAt])
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    if (onExport) {
      onExport({ users: data, reports })
    }
    if (typeof window !== "undefined") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "users_export.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Export started", { description: `${data.length} users exported to CSV.` })
    }
  }

  function resolveReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id))
    toast.success("Report resolved", { description: `Report ${id} has been closed.` })
  }

  function dismissReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id))
    toast.message("Report dismissed", { description: `Report ${id} removed from queue.` })
  }

  function escalateReport(id: string) {
    toast.info("Escalated to senior moderator", { description: `Report ${id} forwarded with context.` })
  }

  return (
    <section
      className={cn(
        "w-full max-w-full bg-card border border-border rounded-2xl p-4 sm:p-6",
        "shadow-sm",
        className
      )}
      aria-label="Administrative control panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            <span className="truncate">Admin</span>
            <span aria-hidden="true">/</span>
            <span className="truncate">Control Panel</span>
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Platform Administration
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Manage users, review content, and monitor platform health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="size-4" aria-hidden="true" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Density</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={denseMode}
                onCheckedChange={(v) => setDenseMode(Boolean(v))}
              >
                Compact rows
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked disabled>
                Core fields
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Verification
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Joined date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator className="my-4" />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="users" className="gap-2">
            <UsersRound className="size-4" aria-hidden="true" />
            Users
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-2">
            <PanelsLeftBottom className="size-4" aria-hidden="true" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TableIcon className="size-4" aria-hidden="true" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email, or ID"
                  className="w-64 sm:w-80"
                  aria-label="Search users"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as Role | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as Status | "all")}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="only-verified"
                  checked={onlyVerified}
                  onCheckedChange={setOnlyVerified}
                />
                <Label htmlFor="only-verified" className="text-sm text-muted-foreground">
                  Verified only
                </Label>
              </div>

              <div className="ms-auto flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={exportCSV}>
                  <Trello className="size-4" aria-hidden="true" />
                  Export CSV
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="size-4" aria-hidden="true" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite new admin or moderator</DialogTitle>
                      <DialogDescription>
                        Send an email invitation to grant access. They&#39;ll receive a link to set up their account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input id="invite-email" placeholder="name@company.com" type="email" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select defaultValue="moderator">
                          <SelectTrigger>
                            <SelectValue placeholder="Choose role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => toast.message("Invitation cancelled")}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          toast.success("Invitation sent", {
                            description: "The recipient will be notified via email.",
                          })
                        }}
                      >
                        Send invite
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div
              className={cn(
                "rounded-xl border border-border bg-card",
                "overflow-hidden"
              )}
            >
              <div className={cn("grid grid-cols-12 items-center px-4", denseMode ? "py-2" : "py-3", "bg-secondary/60 border-b border-border")}>
                <div className="col-span-6 md:col-span-4 flex items-center gap-3 min-w-0">
                  <Checkbox
                    aria-label="Select all"
                    checked={allVisibleSelected}
                    onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                    indeterminate={!allVisibleSelected && someVisibleSelected}
                  />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">User</span>
                </div>
                <div className="col-span-3 hidden md:block">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Role</span>
                </div>
                <div className="col-span-3 hidden md:block">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Status</span>
                </div>
                <div className="col-span-6 md:col-span-2 text-right">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Actions</span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className={cn(
                      "grid grid-cols-12 items-center px-4",
                      denseMode ? "py-2" : "py-3",
                      "hover:bg-secondary/50 focus-within:bg-secondary/50 transition-colors"
                    )}
                  >
                    <div className="col-span-6 md:col-span-4 flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={selectedIds.has(u.id)}
                        onCheckedChange={(v) => toggleSelect(u.id, Boolean(v))}
                        aria-label={`Select ${u.name}`}
                      />
                      <Avatar className="size-8">
                        <AvatarImage
                          alt={u.name}
                          src={`https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80&h=80&fit=crop&auto=format&sat=-20&blend=111&blend-mode=normal`}
                        />
                        <AvatarFallback>{toInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{u.name}</span>
                          {u.verified ? (
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
                              Verified
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                          <span className="truncate">{u.email}</span>
                          <span aria-hidden="true">•</span>
                          <span className="whitespace-nowrap">Joined {u.joinedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 hidden md:flex items-center">
                      <RolePill role={u.role} />
                    </div>

                    <div className="col-span-3 hidden md:flex items-center">
                      <StatusPill status={u.status} />
                    </div>

                    <div className="col-span-6 md:col-span-2 flex justify-end gap-2">
                      <Select
                        defaultValue={u.role}
                        onValueChange={(v) =>
                          setUsers((prev) =>
                            prev.map((x) => (x.id === u.id ? { ...x, role: v as Role } : x))
                          )
                        }
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="host">Host</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" aria-label="Quick actions">
                            <Settings2 className="size-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Account</DropdownMenuLabel>
                          <DropdownMenuCheckboxItem
                            checked={u.status === "active"}
                            onCheckedChange={(v) =>
                              setUsers((prev) =>
                                prev.map((x) =>
                                  x.id === u.id ? { ...x, status: v ? "active" : "suspended" } : x
                                )
                              )
                            }
                          >
                            Active
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={u.verified}
                            onCheckedChange={(v) =>
                              setUsers((prev) =>
                                prev.map((x) => (x.id === u.id ? { ...x, verified: Boolean(v) } : x))
                              )
                            }
                          >
                            Verified badge
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={u.status === "suspended"}
                            onCheckedChange={(v) =>
                              setUsers((prev) =>
                                prev.map((x) =>
                                  x.id === u.id ? { ...x, status: v ? "suspended" : "active" } : x
                                )
                              )
                            }
                          >
                            Suspended
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </div>
              <Button variant="outline" onClick={() => bulkUpdateStatus("active")}>
                Activate
              </Button>
              <Button variant="outline" onClick={() => bulkUpdateStatus("suspended")}>
                Suspend
              </Button>
              <Button variant="outline" onClick={() => bulkUpdateStatus("pending")}>
                Set Pending
              </Button>
              <Button onClick={() => bulkVerify(true)}>Verify</Button>
              <Button variant="secondary" onClick={() => bulkVerify(false)}>
                Remove Badge
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  Queue {reports.length}
                </Badge>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="listing">Listings</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => toast.message("Exported moderation log")}>
                  <Trello className="size-4" aria-hidden="true" />
                  Export log
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-10 rounded-lg flex items-center justify-center text-card-foreground",
                        r.severity === "high" ? "bg-destructive/10" : r.severity === "medium" ? "bg-accent" : "bg-secondary"
                      )}
                      aria-hidden="true"
                    >
                      {r.type === "listing" ? (
                        <TableIcon className="size-5" />
                      ) : r.type === "post" ? (
                        <PanelsLeftBottom className="size-5" />
                      ) : (
                        <CircleUser className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium truncate">{r.targetTitle}</p>
                        <Badge variant="secondary" className="rounded-full">
                          {r.type}
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-full",
                            r.severity === "high"
                              ? "bg-destructive text-destructive-foreground"
                              : r.severity === "medium"
                              ? "bg-amber-200 text-foreground"
                              : "bg-secondary text-foreground"
                          )}
                        >
                          {r.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Reason: {r.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reported by {r.reportedBy} on {r.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="sm:ms-auto flex items-center gap-2">
                    <Button variant="outline" onClick={() => escalateReport(r.id)}>
                      Escalate
                    </Button>
                    <Button variant="secondary" onClick={() => dismissReport(r.id)}>
                      Dismiss
                    </Button>
                    <Button onClick={() => resolveReport(r.id)}>Resolve</Button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No reports in the queue. Great job keeping things clean!
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KPI
                label="Active users"
                value={initialAnalytics.activeUsers.toLocaleString()}
                icon={<UsersRound className="size-4" aria-hidden="true" />}
                hint="+ Daily actives"
              />
              <KPI
                label="New signups"
                value={initialAnalytics.newSignups.toLocaleString()}
                icon={<UserRound className="size-4" aria-hidden="true" />}
                hint="Last 24h"
              />
              <KPI
                label="Bookings this week"
                value={initialAnalytics.bookingsThisWeek.toLocaleString()}
                icon={<Trello className="size-4" aria-hidden="true" />}
                delta={initialAnalytics.bookingsChange}
              />
              <KPI
                label="Revenue (month)"
                value={formatCurrency(initialAnalytics.revenueThisMonth)}
                icon={<TableIcon className="size-4" aria-hidden="true" />}
                delta={initialAnalytics.revenueChange}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Engagement</h4>
                  <Badge variant="secondary" className="rounded-full">
                    7 days
                  </Badge>
                </div>
                <MiniBarChart
                  series={[42, 56, 61, 58, 62, 68, 71]}
                  labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown
                    className={cn(
                      "size-4",
                      initialAnalytics.bookingsChange >= 0 ? "rotate-180 text-green-600" : "text-destructive"
                    )}
                    aria-hidden="true"
                  />
                  <span>
                    {Math.abs(initialAnalytics.bookingsChange)}% vs last week
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Disputes</h4>
                  <Badge variant="secondary" className="rounded-full">
                    Live
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <StatRow label="Open cases" value={initialAnalytics.disputeOpen.toString()} />
                  <StatRow label="Avg response" value={`${initialAnalytics.avgResponseHrs}h`} />
                  <StatRow label="Resolved 7d" value="128" />
                  <StatRow label="Escalated 7d" value="12" />
                </div>
                <ProgressBar value={72} label="Resolution rate" />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Top segments</h4>
                  <Badge variant="secondary" className="rounded-full">
                    Updated
                  </Badge>
                </div>
                <div className="mt-3 space-y-3">
                  <SegRow label="Hosts" value={38} />
                  <SegRow label="Members" value={27} />
                  <SegRow label="Moderators" value={22} />
                  <SegRow label="Admins" value={13} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

function RolePill({ role }: { role: Role }) {
  const icon =
    role === "admin" ? <Settings2 className="size-3.5" aria-hidden="true" /> :
    role === "moderator" ? <PanelsLeftBottom className="size-3.5" aria-hidden="true" /> :
    role === "host" ? <Trello className="size-3.5" aria-hidden="true" /> :
    <CircleUser className="size-3.5" aria-hidden="true" />
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border",
        role === "admin"
          ? "bg-primary text-primary-foreground border-transparent"
          : role === "moderator"
          ? "bg-accent text-foreground border-accent"
          : role === "host"
          ? "bg-secondary text-foreground border-secondary"
          : "bg-muted text-foreground border-muted"
      )}
    >
      {icon}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs border",
        status === "active"
          ? "bg-green-100 text-green-800 border-green-200"
          : status === "suspended"
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-amber-100 text-amber-800 border-amber-200"
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function KPI({
  label,
  value,
  icon,
  delta,
  hint,
}: {
  label: string
  value: string
  icon: React.ReactNode
  delta?: number
  hint?: string
}) {
  const positive = typeof delta === "number" ? delta >= 0 : undefined
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        {typeof delta === "number" ? (
          <span
            className={cn(
              "text-xs rounded-full px-2 py-0.5",
              positive ? "bg-green-100 text-green-800" : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        ) : hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function MiniBarChart({ series, labels }: { series: number[]; labels: string[] }) {
  const max = Math.max(...series, 1)
  return (
    <div className="mt-3">
      <div className="flex items-end gap-2 h-28">
        {series.map((v, i) => (
          <div key={i} className="flex-1 min-w-0">
            <div
              className="w-full rounded-t-md bg-foreground/80"
              style={{ height: `${(v / max) * 100}%` }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-[10px] text-muted-foreground">
        {labels.map((l) => (
          <span key={l} className="text-center truncate">{l}</span>
        ))}
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="mt-4">
      {label ? <div className="text-sm mb-1 text-muted-foreground">{label}</div> : null}
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-foreground transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || "Progress"}
        />
      </div>
    </div>
  )
}

function SegRow({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-foreground"
            style={{ width: `${clamped}%` }}
            aria-hidden="true"
          />
        </div>
        <span className="font-semibold">{clamped}%</span>
      </div>
    </div>
  )
}