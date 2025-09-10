"use client"

import React, { useMemo, useState } from "react"
import {
  SearchCheck,
  ListFilter,
  CalendarDays,
  LayoutList,
  Calendar,
  CreditCard,
  ArrowDownNarrowWide,
  StarOff,
  CalendarSearch,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ListingCategory = "gear" | "space" | "vehicle" | "service" | "companion"

type Listing = {
  id: string
  title: string
  category: ListingCategory
  location: string
  pricePerHour: number
  rating: number
  ratingCount: number
  image: string
  description: string
  availableFrom?: string
  availableTo?: string
  isFeatured?: boolean
}

type BookingRequest = {
  listingId: string
  date: string
  startTime: string
  endTime: string
  notes?: string
  paymentMethod?: "stripe" | "paypal"
}

export interface RentalMarketplaceProps {
  className?: string
  style?: React.CSSProperties
  listings?: Listing[]
  layout?: "comfortable" | "compact"
  onBookingRequest?: (req: BookingRequest) => Promise<void> | void
}

const DEFAULT_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Mirrorless Camera Kit",
    category: "gear",
    location: "San Francisco, CA",
    pricePerHour: 22,
    rating: 4.7,
    ratingCount: 128,
    image:
      "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=1600&auto=format&fit=crop",
    description:
      "Sony A7 III with 24-70mm f/2.8. Extra batteries, SD cards, and bag included.",
    availableFrom: "2025-09-15",
    availableTo: "2025-12-31",
    isFeatured: true,
  },
  {
    id: "2",
    title: "Cozy Studio Space",
    category: "space",
    location: "Brooklyn, NY",
    pricePerHour: 35,
    rating: 4.9,
    ratingCount: 86,
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop",
    description:
      "Natural light studio perfect for photo/video shoots. Backdrops and props available.",
    availableFrom: "2025-09-01",
    availableTo: "2026-01-31",
  },
  {
    id: "3",
    title: "Weekend Hiking Companion",
    category: "companion",
    location: "Denver, CO",
    pricePerHour: 18,
    rating: 4.8,
    ratingCount: 54,
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    description:
      "Experienced local guide for easy-to-moderate trails. Friendly, safe, and reliable.",
    availableFrom: "2025-09-10",
    availableTo: "2025-11-30",
  },
  {
    id: "4",
    title: "Electric Scooter",
    category: "vehicle",
    location: "Austin, TX",
    pricePerHour: 9,
    rating: 4.5,
    ratingCount: 210,
    image:
      "https://images.unsplash.com/photo-1541199249251-f713e6145474?q=80&w=1600&auto=format&fit=crop",
    description:
      "Zip through the city with a full charge. Helmet and lock included.",
    availableFrom: "2025-09-05",
    availableTo: "2026-05-31",
  },
  {
    id: "5",
    title: "Personal Fitness Coach",
    category: "service",
    location: "Seattle, WA",
    pricePerHour: 28,
    rating: 4.6,
    ratingCount: 72,
    image:
      "https://images.unsplash.com/photo-1546484959-f9a53db89f97?q=80&w=1600&auto=format&fit=crop",
    description:
      "Custom sessions at your level. Strength, mobility, or conditioning.",
    availableFrom: "2025-09-12",
    availableTo: "2025-12-15",
    isFeatured: true,
  },
  {
    id: "6",
    title: "Professional Audio Kit",
    category: "gear",
    location: "Los Angeles, CA",
    pricePerHour: 25,
    rating: 4.4,
    ratingCount: 33,
    image:
      "https://images.unsplash.com/photo-1514580426463-fd77dc4d0672?q=80&w=1600&auto=format&fit=crop",
    description:
      "Zoom H6, shotgun mic, lavs, and cables. Great for interviews and podcasts.",
    availableFrom: "2025-09-02",
    availableTo: "2025-12-31",
  },
]

function RatingStars({
  rating,
  count,
  size = 16,
  className,
}: {
  rating: number
  count?: number
  size?: number
  className?: string
}) {
  const stars = Array.from({ length: 5 })
  const rounded = Math.round(rating)
  return (
    <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
      {stars.map((_, i) => (
        <StarOff
          key={i}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            i < rounded ? "text-foreground" : "text-muted-foreground/50"
          )}
          style={{ width: size, height: size }}
        />
      ))}
      {typeof count === "number" ? (
        <span className="ml-1 text-xs text-muted-foreground">({count})</span>
      ) : null}
    </div>
  )
}

export default function RentalMarketplace({
  className,
  style,
  listings = DEFAULT_LISTINGS,
  layout = "comfortable",
  onBookingRequest,
}: RentalMarketplaceProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ListingCategory | "all">("all")
  const [location, setLocation] = useState("")
  const [minPrice, setMinPrice] = useState<number | "">("")
  const [maxPrice, setMaxPrice] = useState<number | "">("")
  const [sort, setSort] = useState<"relevance" | "price-asc" | "price-desc" | "rating">(
    "relevance"
  )
  const [view, setView] = useState<"grid" | "list">("grid")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [booking, setBooking] = useState<BookingRequest | null>(null)

  const filtered = useMemo(() => {
    let items = [...listings]
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      )
    }
    if (category !== "all") {
      items = items.filter((l) => l.category === category)
    }
    if (location.trim()) {
      const loc = location.trim().toLowerCase()
      items = items.filter((l) => l.location.toLowerCase().includes(loc))
    }
    if (minPrice !== "") items = items.filter((l) => l.pricePerHour >= Number(minPrice))
    if (maxPrice !== "") items = items.filter((l) => l.pricePerHour <= Number(maxPrice))
    if (dateFrom) {
      items = items.filter((l) => !l.availableFrom || l.availableFrom <= dateFrom)
    }
    if (dateTo) {
      items = items.filter((l) => !l.availableTo || l.availableTo >= dateTo)
    }
    switch (sort) {
      case "price-asc":
        items.sort((a, b) => a.pricePerHour - b.pricePerHour)
        break
      case "price-desc":
        items.sort((a, b) => b.pricePerHour - a.pricePerHour)
        break
      case "rating":
        items.sort((a, b) => b.rating - a.rating)
        break
      default:
        // relevance could keep featured first
        items.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    }
    return items
  }, [listings, query, category, location, minPrice, maxPrice, sort, dateFrom, dateTo])

  function resetFilters() {
    setQuery("")
    setCategory("all")
    setLocation("")
    setMinPrice("")
    setMaxPrice("")
    setSort("relevance")
    setDateFrom("")
    setDateTo("")
  }

  async function handleBookNow(listing: Listing) {
    const defaultDate =
      dateFrom || (listing.availableFrom ? listing.availableFrom : new Date().toISOString().slice(0, 10))
    setBooking({
      listingId: listing.id,
      date: defaultDate,
      startTime: "10:00",
      endTime: "12:00",
      notes: "",
    })
  }

  async function submitBooking(method: "stripe" | "paypal") {
    if (!booking) return
    const payload: BookingRequest = { ...booking, paymentMethod: method }
    try {
      if (onBookingRequest) await onBookingRequest(payload)
      toast.success(
        method === "stripe"
          ? "Redirecting to Stripe Checkout..."
          : "Redirecting to PayPal..."
      )
      setBooking(null)
    } catch (e) {
      toast.error("Failed to create booking. Please try again.")
    }
  }

  const density = layout === "compact" ? "p-3" : "p-4"

  return (
    <section
      className={cn(
        "w-full max-w-full bg-background text-foreground",
        className
      )}
      style={style}
      aria-label="Rental marketplace"
    >
      <div className="w-full max-w-full space-y-4">
        <div className={cn("bg-card border border-border rounded-2xl", density)}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <div className="relative">
                  <SearchCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items, spaces, or people"
                    className="pl-9 bg-secondary"
                    aria-label="Search listings"
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="location" className="sr-only">
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="bg-secondary"
                  aria-label="Filter by location"
                />
              </div>
              <div className="sm:col-span-2">
                <Select
                  onValueChange={(v: ListingCategory | "all") => setCategory(v)}
                  value={category}
                >
                  <SelectTrigger aria-label="Select category" className="bg-secondary">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="gear">Gear</SelectItem>
                    <SelectItem value="space">Spaces</SelectItem>
                    <SelectItem value="vehicle">Vehicles</SelectItem>
                    <SelectItem value="service">Services</SelectItem>
                    <SelectItem value="companion">Companionship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Select
                  onValueChange={(v: "relevance" | "price-asc" | "price-desc" | "rating") =>
                    setSort(v)
                  }
                  value={sort}
                >
                  <SelectTrigger aria-label="Sort by" className="bg-secondary">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <div className="flex items-center gap-2">
                  <ArrowDownNarrowWide
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">Price range (hour)</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Label htmlFor="minPrice" className="sr-only">
                    Min price
                  </Label>
                  <Input
                    id="minPrice"
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Min"
                    className="bg-secondary"
                    aria-label="Minimum price per hour"
                  />
                  <Label htmlFor="maxPrice" className="sr-only">
                    Max price
                  </Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Max"
                    className="bg-secondary"
                    aria-label="Maximum price per hour"
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <div className="flex items-center gap-2">
                  <CalendarSearch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Availability</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Label htmlFor="from" className="sr-only">
                    From date
                  </Label>
                  <Input
                    id="from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-secondary"
                    aria-label="Available from date"
                  />
                  <Label htmlFor="to" className="sr-only">
                    To date
                  </Label>
                  <Input
                    id="to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-secondary"
                    aria-label="Available to date"
                  />
                </div>
              </div>
              <div className="sm:col-span-6 flex flex-wrap items-end justify-start gap-2">
                <Button
                  variant="outline"
                  className="bg-card"
                  onClick={resetFilters}
                  aria-label="Reset all filters"
                >
                  <ListFilter className="mr-2 h-4 w-4" aria-hidden="true" />
                  Reset filters
                </Button>
                <Tabs
                  defaultValue="grid"
                  value={view}
                  onValueChange={(v: string) => setView(v as "grid" | "list")}
                >
                  <TabsList className="bg-secondary">
                    <TabsTrigger value="grid" aria-label="Grid view">
                      <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="list" aria-label="List view">
                      <LayoutList className="mr-2 h-4 w-4" aria-hidden="true" />
                      List
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="ml-auto hidden sm:block">
                  <small className="text-muted-foreground">
                    {filtered.length} result{filtered.length === 1 ? "" : "s"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={view} onValueChange={(v: string) => setView(v as "grid" | "list")}>
          <TabsContent value="grid" className="m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  density={layout}
                  onBook={() => handleBookNow(l)}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list" className="m-0">
            <div className="flex flex-col gap-3">
              {filtered.map((l) => (
                <ListingRow
                  key={l.id}
                  listing={l}
                  onBook={() => handleBookNow(l)}
                  density={layout}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!booking} onOpenChange={(o) => !o && setBooking(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Request booking</DialogTitle>
              <DialogDescription>
                Choose your time and payment method to continue.
              </DialogDescription>
            </DialogHeader>
            {booking ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bk-date">Date</Label>
                    <div className="relative mt-1">
                      <Calendar
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="bk-date"
                        type="date"
                        value={booking.date}
                        onChange={(e) =>
                          setBooking((b) => (b ? { ...b, date: e.target.value } : b))
                        }
                        className="pl-9 bg-secondary"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bk-start">Start time</Label>
                    <Input
                      id="bk-start"
                      type="time"
                      value={booking.startTime}
                      onChange={(e) =>
                        setBooking((b) => (b ? { ...b, startTime: e.target.value } : b))
                      }
                      className="mt-1 bg-secondary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bk-end">End time</Label>
                    <Input
                      id="bk-end"
                      type="time"
                      value={booking.endTime}
                      onChange={(e) =>
                        setBooking((b) => (b ? { ...b, endTime: e.target.value } : b))
                      }
                      className="mt-1 bg-secondary"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="bk-notes">Notes (optional)</Label>
                    <Input
                      id="bk-notes"
                      value={booking.notes ?? ""}
                      onChange={(e) =>
                        setBooking((b) => (b ? { ...b, notes: e.target.value } : b))
                      }
                      placeholder="Any details to share with the owner"
                      className="mt-1 bg-secondary"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">Pay securely</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We support Stripe and PayPal. You&#39;ll be redirected to complete payment.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => submitBooking("stripe")} className="gap-2">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Pay with Stripe
                  </Button>
                  <Button variant="outline" onClick={() => submitBooking("paypal")} className="gap-2 bg-card">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Pay with PayPal
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

function ListingCard({
  listing,
  onBook,
  density,
}: {
  listing: Listing
  onBook: () => void
  density: "comfortable" | "compact"
}) {
  return (
    <Card className="bg-card border-border overflow-hidden rounded-2xl">
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {listing.isFeatured ? (
            <Badge className="bg-accent text-foreground">Featured</Badge>
          ) : null}
          <Badge variant="secondary" className="bg-secondary text-foreground">
            {formatCategory(listing.category)}
          </Badge>
        </div>
      </div>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base sm:text-lg break-words">{listing.title}</CardTitle>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{listing.location}</p>
          </div>
          <RatingStars rating={listing.rating} count={listing.ratingCount} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold">${listing.pricePerHour}</span>
            <span className="text-sm text-muted-foreground">/hr</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>
              {listing.availableFrom ? formatDate(listing.availableFrom) : "Now"} -{" "}
              {listing.availableTo ? formatDate(listing.availableTo) : "Flexible"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-card">
              <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
              Check availability
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Availability</DialogTitle>
              <DialogDescription>
                Select dates to check availability for {listing.title}.
              </DialogDescription>
            </DialogHeader>
            <AvailabilityPreview listing={listing} />
          </DialogContent>
        </Dialog>
        <Button onClick={onBook}>
          Book now
        </Button>
      </CardFooter>
    </Card>
  )
}

function ListingRow({
  listing,
  onBook,
  density,
}: {
  listing: Listing
  onBook: () => void
  density: "comfortable" | "compact"
}) {
  return (
    <Card className="bg-card border-border rounded-2xl">
      <div className="flex gap-4 p-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
          {listing.isFeatured ? (
            <Badge className="absolute left-2 top-2 bg-accent text-foreground">Featured</Badge>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg truncate">{listing.title}</h3>
                <Badge variant="secondary" className="bg-secondary text-foreground shrink-0">
                  {formatCategory(listing.category)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{listing.location}</p>
            </div>
            <div className="flex items-center gap-3">
              <RatingStars rating={listing.rating} count={listing.ratingCount} />
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold">${listing.pricePerHour}</span>
                <span className="text-sm text-muted-foreground">/hr</span>
              </div>
            </div>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-card">
                  <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                  Availability
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Availability</DialogTitle>
                  <DialogDescription>
                    Select dates to check availability for {listing.title}.
                  </DialogDescription>
                </DialogHeader>
                <AvailabilityPreview listing={listing} />
              </DialogContent>
            </Dialog>
            <Button onClick={onBook}>Book now</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AvailabilityPreview({ listing }: { listing: Listing }) {
  const [from, setFrom] = useState<string>(listing.availableFrom ?? "")
  const [to, setTo] = useState<string>(listing.availableTo ?? "")
  const available =
    (!from || !to) || (listing.availableFrom ?? "1900-01-01") <= from &&
    (listing.availableTo ?? "2999-12-31") >= to

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="av-from">From</Label>
          <Input
            id="av-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 bg-secondary"
          />
        </div>
        <div>
          <Label htmlFor="av-to">To</Label>
          <Input
            id="av-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 bg-secondary"
          />
        </div>
      </div>
      <div
        className={cn(
          "rounded-xl border p-3 text-sm",
          available
            ? "border-green-200 bg-emerald-50 text-foreground"
            : "border-destructive/30 bg-destructive/10 text-foreground"
        )}
        role="status"
        aria-live="polite"
      >
        {available ? "Selected dates are available." : "Some selected dates are unavailable."}
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Typical response time: within 2 hours. You&#39;ll only be charged if the host accepts.
        </p>
        <ReviewsSnippet />
      </div>
    </div>
  )
}

function ReviewsSnippet() {
  return (
    <div className="rounded-xl border border-border bg-muted p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RatingStars rating={4.7} />
          <span className="text-sm font-medium">4.7</span>
        </div>
        <span className="text-xs text-muted-foreground">128 reviews</span>
      </div>
      <ul className="mt-2 space-y-2">
        <li className="text-sm">
          “Great communication and exactly as described.”
        </li>
        <li className="text-sm">
          “Smooth booking and very helpful host.”
        </li>
      </ul>
    </div>
  )
}

function formatCategory(c: ListingCategory) {
  switch (c) {
    case "gear":
      return "Gear"
    case "space":
      return "Space"
    case "vehicle":
      return "Vehicle"
    case "service":
      return "Service"
    case "companion":
      return "Companion"
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso + "T00:00:00")
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return iso
  }
}