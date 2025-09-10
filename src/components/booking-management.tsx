"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  CalendarOff,
  CalendarX,
  CircleCheckBig,
  TicketCheck,
  GitPullRequestArrow,
  FolderKanban,
  UserX,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "awaiting_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed"

type Booking = {
  id: string
  listingTitle: string
  guestName: string
  hostName: string
  startDate: Date
  endDate: Date
  total: number
  status: BookingStatus
  createdAt: Date
  lastUpdatedAt: Date
  cancellationPolicy: "flexible" | "moderate" | "strict"
  canModify?: boolean
  canCancel?: boolean
  canPay?: boolean
  canReview?: boolean
}

type DateRange = {
  from?: Date
  to?: Date
}

const currency = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

const statusMeta: Record<
  BookingStatus,
  { label: string; tone: "default" | "secondary" | "destructive" | "outline" | "success" }
> = {
  pending: { label: "Pending", tone: "secondary" },
  accepted: { label: "Accepted", tone: "default" },
  rejected: { label: "Rejected", tone: "destructive" },
  awaiting_payment: { label: "Awaiting Payment", tone: "outline" },
  confirmed: { label: "Confirmed", tone: "success" },
  in_progress: { label: "In Progress", tone: "default" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "destructive" },
  disputed: { label: "Disputed", tone: "outline" },
}

const CancellationPolicyCopy: Record<Booking["cancellationPolicy"], string> = {
  flexible: "Full refund 1 day prior to start, except fees.",
  moderate: "Full refund 5 days prior to start, except fees.",
  strict: "50% refund up to 1 week prior to start. No refund afterwards.",
}

function withinRange(date: Date, range?: DateRange) {
  if (!range?.from || !range?.to) return false
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const from = new Date(range.from)
  from.setHours(0, 0, 0, 0)
  const to = new Date(range.to)
  to.setHours(0, 0, 0, 0)
  return d >= from && d <= to
}

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime())
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function formatRange(a: Date, b: Date) {
  return `${a.toLocaleDateString()} – ${b.toLocaleDateString()}`
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = statusMeta[status]
  const tone =
    meta.tone === "success"
      ? "bg-accent text-foreground"
      : meta.tone === "destructive"
      ? "bg-destructive text-destructive-foreground"
      : meta.tone === "outline"
      ? "bg-secondary text-foreground"
      : meta.tone === "secondary"
      ? "bg-muted text-foreground"
      : "bg-primary text-primary-foreground"
  return <Badge className={cn("rounded-full px-2.5 py-1 text-xs", tone)}>{meta.label}</Badge>
}

function Timeline({ status }: { status: BookingStatus }) {
  const steps: { key: BookingStatus; label: string; icon: React.ReactNode }[] = [
    { key: "pending", label: "Request", icon: <GitPullRequestArrow className="size-4" aria-hidden /> },
    { key: "accepted", label: "Accepted", icon: <Check className="size-4" aria-hidden /> },
    { key: "awaiting_payment", label: "Payment", icon: <TicketCheck className="size-4" aria-hidden /> },
    { key: "confirmed", label: "Confirmed", icon: <CircleCheckBig className="size-4" aria-hidden /> },
    { key: "in_progress", label: "In Progress", icon: <FolderKanban className="size-4" aria-hidden /> },
    { key: "completed", label: "Completed", icon: <CalendarDays className="size-4" aria-hidden /> },
  ]

  const activeIndex = steps.findIndex((s) => s.key === status || (status === "rejected" && s.key === "pending") || (status === "cancelled" && s.key === "confirmed") || (status === "disputed" && s.key === "in_progress"))
  return (
    <ol className="flex w-full min-w-0 items-center gap-3">
      {steps.map((s, i) => {
        const isDone = i <= activeIndex && status !== "rejected" && status !== "cancelled" && status !== "disputed"
        const isActive = i === activeIndex && (status !== "rejected" && status !== "cancelled" && status !== "disputed")
        return (
          <li key={s.key} className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border",
                isDone || isActive ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-foreground border-border"
              )}
              aria-current={isActive ? "step" : undefined}
              aria-label={s.label}
              role="group"
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className={cn("truncate text-xs font-medium", isDone || isActive ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1", isDone ? "bg-primary" : "bg-border")} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function BookingCard({
  booking,
  onAction,
}: {
  booking: Booking
  onAction: (id: string, action: "accept" | "reject" | "pay" | "confirm" | "cancel" | "complete" | "modify" | "dispute" | "review") => void
}) {
  const nights = daysBetween(booking.startDate, booking.endDate)
  return (
    <Card className="bg-card">
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg md:text-xl">{booking.listingTitle}</CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-foreground">
                <CalendarIcon className="size-4" aria-hidden />
                <span className="text-sm">{formatRange(booking.startDate, booking.endDate)}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">{nights} nights</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">{currency(booking.total)}</span>
            </CardDescription>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Timeline status={booking.status} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Guest: <span className="text-foreground">{booking.guestName}</span> • Host:{" "}
            <span className="text-foreground">{booking.hostName}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {booking.status === "pending" && (
              <>
                <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => onAction(booking.id, "accept")} aria-label="Accept booking">
                  Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onAction(booking.id, "reject")} aria-label="Reject booking">
                  Reject
                </Button>
              </>
            )}
            {booking.status === "accepted" && (
              <Button size="sm" onClick={() => onAction(booking.id, "confirm")} aria-label="Confirm booking">
                Confirm
              </Button>
            )}
            {booking.status === "awaiting_payment" && (
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => onAction(booking.id, "pay")} aria-label="Pay now">
                Pay now
              </Button>
            )}
            {booking.status === "confirmed" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => onAction(booking.id, "modify")} aria-label="Request modification">
                  Modify
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onAction(booking.id, "cancel")} aria-label="Cancel booking">
                  Cancel
                </Button>
              </>
            )}
            {booking.status === "in_progress" && (
              <>
                <Button size="sm" onClick={() => onAction(booking.id, "complete")} aria-label="Mark as completed">
                  Mark completed
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onAction(booking.id, "dispute")} aria-label="Open dispute">
                  Dispute
                </Button>
              </>
            )}
            {booking.status === "completed" && (
              <Button size="sm" onClick={() => onAction(booking.id, "review")} aria-label="Leave review">
                Leave review
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="text-sm min-w-0">
            <p className="text-muted-foreground">Cancellation policy</p>
            <p className="mt-1 break-words">{CancellationPolicyCopy[booking.cancellationPolicy]}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden />
            <span>Requested {booking.createdAt.toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated {booking.lastUpdatedAt.toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AvailabilityPanel({
  bookedRanges,
  onRangeSelect,
  selected,
}: {
  bookedRanges: DateRange[]
  onRangeSelect: (range: DateRange | undefined) => void
  selected?: DateRange
}) {
  const isBooked = (day: Date) => bookedRanges.some((r) => withinRange(day, r))
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Availability</CardTitle>
        <CardDescription>Manage blackout dates and see upcoming reservations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <CalendarRange className="size-4" aria-hidden />
              {selected?.from && selected?.to ? (
                <span>{formatRange(selected.from, selected.to)}</span>
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={selected}
              onSelect={onRangeSelect}
              numberOfMonths={2}
              disabled={(date) => date < new Date(new Date().toDateString())}
              modifiers={{ booked: isBooked }}
              modifiersClassNames={{ booked: "bg-muted text-muted-foreground" }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-3 rounded bg-muted" aria-hidden />
            <span>Booked</span>
            <div className="size-3 rounded bg-secondary" aria-hidden />
            <span>Available</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-accent text-foreground" aria-label="Calendar integration">
            <CalendarDays className="mr-1 size-3" aria-hidden />
            Sync with calendar
          </Badge>
          <Badge variant="outline" className="bg-secondary">
            <CalendarOff className="mr-1 size-3" aria-hidden />
            Blackout dates
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function RequestForm({
  onSubmit,
}: {
  onSubmit: (payload: {
    listing: string
    range?: DateRange
    guests: number
    message?: string
    policy: Booking["cancellationPolicy"]
  }) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange>()
  const [listing, setListing] = React.useState<string>("")
  const [guests, setGuests] = React.useState<string>("1")
  const [message, setMessage] = React.useState("")
  const [policy, setPolicy] = React.useState<Booking["cancellationPolicy"]>("moderate")

  const submit = () => {
    if (!listing || !range?.from || !range?.to) {
      toast.error("Please complete listing and dates")
      return
    }
    onSubmit({ listing, range, guests: Number(guests), message, policy })
    setOpen(false)
    setRange(undefined)
    setListing("")
    setGuests("1")
    setMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground" aria-label="Create booking request">
          New booking request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create booking request</DialogTitle>
          <DialogDescription>Send a request to the host. No charge until accepted.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="listing">Listing</Label>
            <Input
              id="listing"
              placeholder="e.g. Cozy Studio Downtown"
              value={listing}
              onChange={(e) => setListing(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                  <CalendarRange className="size-4" aria-hidden />
                  {range?.from && range?.to ? (
                    <span>{formatRange(range.from, range.to)}</span>
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date(new Date().toDateString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Guests</Label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger aria-label="Guest count">
                  <SelectValue placeholder="Select guests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 guest</SelectItem>
                  <SelectItem value="2">2 guests</SelectItem>
                  <SelectItem value="3">3 guests</SelectItem>
                  <SelectItem value="4">4 guests</SelectItem>
                  <SelectItem value="5">5 guests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cancellation policy</Label>
              <Select value={policy} onValueChange={(v: Booking["cancellationPolicy"]) => setPolicy(v)}>
                <SelectTrigger aria-label="Cancellation policy">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message to host</Label>
            <Textarea
              id="message"
              placeholder="Share details or questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button className="bg-primary text-primary-foreground" onClick={submit}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModifyDialog({
  open,
  onOpenChange,
  onConfirm,
  initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (payload: { range?: DateRange; note?: string }) => void
  initial?: DateRange
}) {
  const [range, setRange] = React.useState<DateRange>(initial)
  const [note, setNote] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request modification</DialogTitle>
          <DialogDescription>Propose date changes or add a note for the host/guest.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>New dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                  <CalendarRange className="size-4" aria-hidden />
                  {range?.from && range?.to ? (
                    <span>{formatRange(range.from, range.to)}</span>
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Add context..." />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => {
              onConfirm({ range, note })
              onOpenChange(false)
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
  policy,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (reason: string) => void
  policy: Booking["cancellationPolicy"]
}) {
  const [reason, setReason] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancel booking</DialogTitle>
          <DialogDescription>Review policy and provide a reason.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="font-medium">Cancellation policy</p>
            <p className="mt-1 text-muted-foreground">{CancellationPolicyCopy[policy]}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" placeholder="Share why you’re cancelling..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Keep booking</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(reason)
              onOpenChange(false)
            }}
          >
            Confirm cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DisputeDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (payload: { summary: string; evidence?: string }) => void
}) {
  const [summary, setSummary] = React.useState("")
  const [evidence, setEvidence] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open dispute</DialogTitle>
          <DialogDescription>Our team will review and mediate the issue.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Describe the issue..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evidence">Evidence link (optional)</Label>
            <Input
              id="evidence"
              type="url"
              placeholder="https://..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Dismiss</Button>
          </DialogClose>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => {
              onSubmit({ summary, evidence })
              onOpenChange(false)
            }}
          >
            Submit dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  onSubmit,
  listingTitle,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (payload: { rating: number; review: string }) => void
  listingTitle: string
}) {
  const [rating, setRating] = React.useState<number>(5)
  const [review, setReview] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rate your stay</DialogTitle>
          <DialogDescription>Share feedback for {listingTitle}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Rating</Label>
            <Select value={String(rating)} onValueChange={(v) => setRating(Number(v))}>
              <SelectTrigger aria-label="Rating">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 - Excellent</SelectItem>
                <SelectItem value="4">4 - Great</SelectItem>
                <SelectItem value="3">3 - Good</SelectItem>
                <SelectItem value="2">2 - Fair</SelectItem>
                <SelectItem value="1">1 - Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review">Review</Label>
            <Textarea id="review" rows={4} value={review} onChange={(e) => setReview(e.target.value)} placeholder="What stood out?" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => {
              onSubmit({ rating, review })
              onOpenChange(false)
            }}
          >
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BookingManagement({
  className,
}: {
  className?: string
}) {
  const [bookings, setBookings] = React.useState<Booking[]>([
    {
      id: "bkg_1001",
      listingTitle: "Modern Loft with Skyline View",
      guestName: "Ava Chen",
      hostName: "Marcus Lee",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 23),
      total: 520,
      status: "awaiting_payment",
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      cancellationPolicy: "moderate",
      canModify: true,
      canCancel: true,
      canPay: true,
    },
    {
      id: "bkg_1002",
      listingTitle: "Cozy Studio Downtown",
      guestName: "You",
      hostName: "Priya Patel",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 8),
      total: 360,
      status: "confirmed",
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      cancellationPolicy: "flexible",
      canModify: true,
      canCancel: true,
    },
    {
      id: "bkg_1003",
      listingTitle: "Beachfront Bungalow",
      guestName: "Liam Johnson",
      hostName: "You",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 3),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10),
      total: 1450,
      status: "pending",
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      cancellationPolicy: "strict",
    },
    {
      id: "bkg_0990",
      listingTitle: "Mountain Cabin Retreat",
      guestName: "You",
      hostName: "Sofia Gomez",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 12),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 16),
      total: 780,
      status: "completed",
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      cancellationPolicy: "moderate",
      canReview: true,
    },
  ])

  const [availabilityRange, setAvailabilityRange] = React.useState<DateRange>()
  const bookedRanges = React.useMemo<DateRange[]>(
    () =>
      bookings
        .filter((b) => ["confirmed", "in_progress", "completed", "accepted", "awaiting_payment"].includes(b.status))
        .map((b) => ({ from: b.startDate, to: b.endDate })),
    [bookings]
  )

  // Dialog controls
  const [modifyFor, setModifyFor] = React.useState<Booking | null>(null)
  const [cancelFor, setCancelFor] = React.useState<Booking | null>(null)
  const [disputeFor, setDisputeFor] = React.useState<Booking | null>(null)
  const [reviewFor, setReviewFor] = React.useState<Booking | null>(null)

  const handleAction = (id: string, action: Parameters<typeof BookingCard>[0]["onAction"] extends (id: string, action: infer A) => any ? A : never) => {
    const b = bookings.find((x) => x.id === id)
    if (!b) return

    if (action === "accept") {
      updateBooking(id, { status: "accepted" })
      toast.success("Booking accepted")
    } else if (action === "reject") {
      updateBooking(id, { status: "rejected" })
      toast("Booking rejected", { icon: <UserX className="size-4" /> })
    } else if (action === "confirm") {
      updateBooking(id, { status: "awaiting_payment" })
      toast("Awaiting payment", { description: "We sent a payment link to the guest." })
    } else if (action === "pay") {
      updateBooking(id, { status: "confirmed" })
      toast.success("Payment received. Booking confirmed.")
    } else if (action === "cancel") {
      setCancelFor(b)
    } else if (action === "complete") {
      updateBooking(id, { status: "completed" })
      toast.success("Booking marked as completed")
    } else if (action === "modify") {
      setModifyFor(b)
    } else if (action === "dispute") {
      setDisputeFor(b)
    } else if (action === "review") {
      setReviewFor(b)
    }
  }

  const updateBooking = (id: string, patch: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch, lastUpdatedAt: new Date() } : b))
    )
  }

  const submitRequest = (payload: {
    listing: string
    range?: DateRange
    guests: number
    message?: string
    policy: Booking["cancellationPolicy"]
  }) => {
    const id = `bkg_${Math.floor(Math.random() * 100000)}`
    const newB: Booking = {
      id,
      listingTitle: payload.listing,
      guestName: "You",
      hostName: "Host",
      startDate: payload.range!.from!,
      endDate: payload.range!.to!,
      total: 100 * daysBetween(payload.range!.from!, payload.range!.to!),
      status: "pending",
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      cancellationPolicy: payload.policy,
      canModify: true,
      canCancel: true,
    }
    setBookings((prev) => [newB, ...prev])
    toast.success("Request submitted")
  }

  const onModifyConfirm = (payload: { range?: DateRange; note?: string }) => {
    if (!modifyFor) return
    if (payload.range?.from && payload.range?.to) {
      updateBooking(modifyFor.id, { startDate: payload.range.from, endDate: payload.range.to, status: "pending" })
      toast("Modification sent", { description: "Awaiting approval from the other party." })
    } else {
      toast.error("Please choose a new date range")
    }
    setModifyFor(null)
  }

  const onCancelConfirm = (reason: string) => {
    if (!cancelFor) return
    updateBooking(cancelFor.id, { status: "cancelled" })
    toast("Booking cancelled", { description: reason || "You can still leave a review if eligible." })
    setCancelFor(null)
  }

  const onDisputeSubmit = (payload: { summary: string; evidence?: string }) => {
    if (!disputeFor) return
    updateBooking(disputeFor.id, { status: "disputed" })
    toast("Dispute submitted", { description: "Support will follow up within 24–48 hours." })
    setDisputeFor(null)
  }

  const onReviewSubmit = (payload: { rating: number; review: string }) => {
    if (!reviewFor) return
    toast.success("Thanks for your feedback!")
    setReviewFor(null)
  }

  const active = bookings.filter((b) => ["pending", "accepted", "awaiting_payment", "confirmed", "in_progress"].includes(b.status))
  const upcoming = bookings.filter((b) => b.startDate > new Date() && ["confirmed", "accepted"].includes(b.status))
  const history = bookings.filter((b) => ["completed", "cancelled", "rejected", "disputed"].includes(b.status))

  return (
    <section className={cn("w-full max-w-full", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl">Booking management</h2>
            <p className="text-sm text-muted-foreground">Manage requests, payments, confirmations, and more.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RequestForm onSubmit={submitRequest} />
            <Button variant="secondary" aria-label="Export bookings">
              <CalendarDays className="mr-2 size-4" aria-hidden />
              Export
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-3 lg:col-span-3 space-y-4">
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">Your bookings</CardTitle>
                  <Badge variant="outline" className="bg-secondary">
                    <FolderKanban className="mr-1 size-3" aria-hidden />
                    {bookings.length} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="mt-4">
                    {active.length === 0 ? (
                      <EmptyState icon={<CalendarX className="size-6" aria-hidden />} title="No active bookings" subtitle="New requests and ongoing stays will appear here." />
                    ) : (
                      <div className="space-y-4">
                        {active.map((b) => (
                          <BookingCard key={b.id} booking={b} onAction={handleAction} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="upcoming" className="mt-4">
                    {upcoming.length === 0 ? (
                      <EmptyState icon={<CalendarDays className="size-6" aria-hidden />} title="No upcoming reservations" subtitle="Confirmed future stays will appear here." />
                    ) : (
                      <div className="space-y-4">
                        {upcoming.map((b) => (
                          <BookingCard key={b.id} booking={b} onAction={handleAction} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="mt-4">
                    {history.length === 0 ? (
                      <EmptyState icon={<CalendarOff className="size-6" aria-hidden />} title="No booking history" subtitle="Completed, cancelled, and rejected bookings will appear here." />
                    ) : (
                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4">
                          {history.map((b) => (
                            <BookingCard key={b.id} booking={b} onAction={handleAction} />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 lg:col-span-2 space-y-4">
            <AvailabilityPanel bookedRanges={bookedRanges} onRangeSelect={setAvailabilityRange} selected={availabilityRange} />
            <PoliciesCard />
          </div>
        </div>
      </div>

      <ModifyDialog
        open={!!modifyFor}
        onOpenChange={(v) => !v && setModifyFor(null)}
        onConfirm={onModifyConfirm}
        initial={{ from: modifyFor?.startDate, to: modifyFor?.endDate }}
      />
      <CancelDialog
        open={!!cancelFor}
        onOpenChange={(v) => !v && setCancelFor(null)}
        onConfirm={onCancelConfirm}
        policy={cancelFor?.cancellationPolicy || "moderate"}
      />
      <DisputeDialog open={!!disputeFor} onOpenChange={(v) => !v && setDisputeFor(null)} onSubmit={onDisputeSubmit} />
      <ReviewDialog
        open={!!reviewFor}
        onOpenChange={(v) => !v && setReviewFor(null)}
        onSubmit={onReviewSubmit}
        listingTitle={reviewFor?.listingTitle || "your stay"}
      />
    </section>
  )
}

function PoliciesCard() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Policies & guidelines</CardTitle>
        <CardDescription>Understand cancellations and disputes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-start gap-3">
            <TicketCheck className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">Payments & confirmation</p>
              <p className="text-sm text-muted-foreground">
                Bookings are confirmed after host acceptance and successful payment. You’ll receive a receipt and confirmation code.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-start gap-3">
            <CalendarX className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">Cancellations</p>
              <p className="text-sm text-muted-foreground">
                Refunds follow the listing’s policy. Host cancellations issue full refunds and affect host reliability.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-start gap-3">
            <GitPullRequestArrow className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">Disputes</p>
              <p className="text-sm text-muted-foreground">
                If an issue arises, open a dispute with details. Our support mediates fairly and may request additional evidence.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-secondary p-8 text-center">
      <div className="mb-3 rounded-full bg-card p-3 text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4">
        <Button variant="outline">
          <CalendarIcon className="mr-2 size-4" aria-hidden />
          Create a booking
        </Button>
      </div>
    </div>
  )
}