"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ListFilter, Locate, TextSearch, PackageSearch, CalendarSearch, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type SearchDiscoveryProps = {
  className?: string;
  style?: React.CSSProperties;
  defaultTab?: "all" | "social" | "rentals";
  initialQuery?: string;
  onSelectResult?: (payload: { type: "user" | "hashtag" | "post" | "rental"; id: string }) => void;
};

type User = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
};

type Hashtag = {
  id: string;
  tag: string;
  uses: number;
};

type Post = {
  id: string;
  author: User;
  image: string;
  text: string;
  likes: number;
};

type Rental = {
  id: string;
  title: string;
  image: string;
  location: string;
  pricePerDay: number;
  category: string;
  rating: number;
};

const demoUsers: User[] = [
  { id: "u1", name: "Ava Thompson", handle: "ava.t", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&q=80&auto=format&fit=crop&crop=faces" },
  { id: "u2", name: "Jordan Smith", handle: "jsmith", avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=256&q=80&auto=format&fit=crop&crop=faces" },
  { id: "u3", name: "Priya Patel", handle: "priyap", avatar: "https://images.unsplash.com/photo-1541534401786-2077eed87a72?w=256&q=80&auto=format&fit=crop&crop=faces" },
];

const demoHashtags: Hashtag[] = [
  { id: "h1", tag: "CityLife", uses: 12830 },
  { id: "h2", tag: "TravelHacks", uses: 8721 },
  { id: "h3", tag: "GearShare", uses: 6590 },
];

const demoPosts: Post[] = [
  {
    id: "p1",
    author: demoUsers[0],
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80&auto=format&fit=crop",
    text: "Weekend shoot with the 85mm—bokeh dreams.",
    likes: 324,
  },
  {
    id: "p2",
    author: demoUsers[1],
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80&auto=format&fit=crop",
    text: "Kayaking through glassy waters. Rentals make it easy.",
    likes: 742,
  },
];

const demoRentals: Rental[] = [
  {
    id: "r1",
    title: "Mirrorless Camera Kit",
    image: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=1200&q=80&auto=format&fit=crop",
    location: "Seattle, WA",
    pricePerDay: 42,
    category: "Electronics",
    rating: 4.8,
  },
  {
    id: "r2",
    title: "Inflatable Kayak for 2",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&q=80&auto=format&fit=crop",
    location: "Austin, TX",
    pricePerDay: 35,
    category: "Outdoors",
    rating: 4.6,
  },
  {
    id: "r3",
    title: "Cordless Drill Set",
    image: "https://images.unsplash.com/photo-1504148455329-4f6d06c1a08f?w=1200&q=80&auto=format&fit=crop",
    location: "Chicago, IL",
    pricePerDay: 18,
    category: "Tools",
    rating: 4.4,
  },
];

const categories = ["All", "Users", "Hashtags", "Posts", "Rentals"] as const;
type Category = (typeof categories)[number];

const rentalCategories = ["All", "Outdoors", "Tools", "Electronics", "Vehicles", "Home"] as const;
const sortOptions = [
  { label: "Relevance", value: "relevance" },
  { label: "Most recent", value: "recent" },
  { label: "Top rated", value: "rating" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
] as const;

export default function SearchDiscovery({
  className,
  style,
  defaultTab = "all",
  initialQuery = "",
  onSelectResult,
}: SearchDiscoveryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "social" | "rentals">(defaultTab);
  const [category, setCategory] = useState<Category>("All");
  const [rentalCategory, setRentalCategory] = useState<(typeof rentalCategories)[number]>("All");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState<typeof sortOptions[number]["value"]>("relevance");
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const r = JSON.parse(localStorage.getItem("rentmylife_recent_searches") || "[]");
      const s = JSON.parse(localStorage.getItem("rentmylife_saved_searches") || "[]");
      if (Array.isArray(r)) setRecent(r.slice(0, 8));
      if (Array.isArray(s)) setSaved(s.slice(0, 8));
    } catch {
      // ignore
    }
  }, []);

  const suggestions = useMemo(() => {
    const base = [
      "camera",
      "kayak",
      "drill",
      "moving van",
      "studio lights",
      "Austin rentals",
      "Seattle photographers",
      "tools near me",
    ];
    if (!query) return base.slice(0, 6);
    const q = query.toLowerCase();
    return base.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const filteredUsers = useMemo(() => {
    if (!query) return demoUsers;
    return demoUsers.filter(
      (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.handle.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const filteredHashtags = useMemo(() => {
    if (!query) return demoHashtags;
    return demoHashtags.filter((h) => h.tag.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const filteredPosts = useMemo(() => {
    if (!query) return demoPosts;
    return demoPosts.filter(
      (p) =>
        p.text.toLowerCase().includes(query.toLowerCase()) ||
        p.author.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const filteredRentals = useMemo(() => {
    let items = demoRentals.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase()) ||
        r.location.toLowerCase().includes(query.toLowerCase())
    );
    if (rentalCategory !== "All") {
      items = items.filter((r) => r.category === rentalCategory);
    }
    if (location.trim()) {
      items = items.filter((r) => r.location.toLowerCase().includes(location.trim().toLowerCase()));
    }
    switch (sort) {
      case "recent":
        items = [...items].reverse();
        break;
      case "rating":
        items = [...items].sort((a, b) => b.rating - a.rating);
        break;
      case "price-asc":
        items = [...items].sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "price-desc":
        items = [...items].sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      default:
        break;
    }
    return items;
  }, [query, rentalCategory, location, sort]);

  function onSubmitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setRecent((prev) => {
      const next = [q, ...prev.filter((r) => r !== q)].slice(0, 8);
      if (typeof window !== "undefined") {
        localStorage.setItem("rentmylife_recent_searches", JSON.stringify(next));
      }
      return next;
    });
    toast.success("Search updated");
  }

  function handleSaveSearch() {
    if (!query.trim()) {
      toast.error("Type something to save this search");
      return;
    }
    const q = query.trim();
    setSaved((prev) => {
      if (prev.includes(q)) {
        toast.message("Already saved", { description: "This search is in your saved list." });
        return prev;
      }
      const next = [q, ...prev].slice(0, 10);
      if (typeof window !== "undefined") {
        localStorage.setItem("rentmylife_saved_searches", JSON.stringify(next));
      }
      toast.success("Search saved");
      return next;
    });
  }

  function clearRecent() {
    setRecent([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("rentmylife_recent_searches", JSON.stringify([]));
    }
    toast.message("Recent cleared");
  }

  const showSuggestionPanel = focused && (suggestions.length > 0 || recent.length > 0 || saved.length > 0);

  return (
    <section
      className={["w-full max-w-full", className].filter(Boolean).join(" ")}
      style={style}
      aria-label="Search and discovery"
    >
      <div className="w-full rounded-[var(--radius)] bg-card border border-[var(--border)] shadow-sm">
        <div className="p-4 sm:p-6">
          <form onSubmit={onSubmitSearch} className="relative">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1 min-w-0">
                <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[--muted-foreground]" />
                <Input
                  ref={inputRef}
                  aria-label="Search"
                  placeholder="Search users, hashtags, posts, or rentals"
                  className="pl-10 pr-10 rounded-xl bg-secondary border-input text-foreground placeholder:text-[--muted-foreground] focus-visible:ring-[--ring]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    // Delay to allow click interactions inside panel
                    setTimeout(() => setFocused(false), 150);
                  }}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[--muted-foreground] hover:text-foreground hover:bg-muted transition"
                    onClick={() => setQuery("")}
                  >
                    <SearchX className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl bg-secondary text-foreground hover:bg-muted"
                    aria-label="Open filters"
                  >
                    <ListFilter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-80 rounded-xl bg-card border border-[--border] shadow-md p-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category</span>
                      <Select
                        value={category}
                        onValueChange={(v) => setCategory(v as Category)}
                      >
                        <SelectTrigger className="w-[150px] rounded-lg bg-secondary border-input">
                          <SelectValue placeholder="Pick category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Rentals</span>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2">
                          <PackageSearch className="h-4 w-4 text-[--muted-foreground]" />
                          <Select
                            value={rentalCategory}
                            onValueChange={(v) => setRentalCategory(v as (typeof rentalCategories)[number])}
                          >
                            <SelectTrigger className="rounded-lg bg-secondary border-input">
                              <SelectValue placeholder="Any type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              {rentalCategories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Locate className="h-4 w-4 text-[--muted-foreground]" />
                          <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Location (e.g., Austin, TX)"
                            aria-label="Rental location"
                            className="rounded-lg bg-secondary border-input"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarSearch className="h-4 w-4 text-[--muted-foreground]" />
                          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                            <SelectTrigger className="rounded-lg bg-secondary border-input">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              {sortOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() => {
                          setCategory("All");
                          setRentalCategory("All");
                          setLocation("");
                          setSort("relevance");
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        type="button"
                        className="rounded-lg"
                        onClick={() => {
                          setShowFilters(false);
                          onSubmitSearch();
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button type="submit" className="rounded-xl">
                Search
              </Button>
            </div>

            {showSuggestionPanel && (
              <div
                role="listbox"
                aria-label="Search suggestions"
                className="absolute z-10 mt-2 w-full rounded-xl bg-card border border-[--border] shadow-md p-3 sm:p-4"
              >
                <div className="flex flex-col gap-3">
                  {suggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TextSearch className="h-4 w-4 text-[--muted-foreground]" />
                        <span className="text-sm font-medium">Suggestions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuery(s);
                              setFocused(false);
                              onSubmitSearch();
                            }}
                            className="px-3 py-1.5 rounded-full bg-secondary hover:bg-muted text-sm transition border border-input"
                            aria-label={`Use suggestion ${s}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(recent.length > 0 || saved.length > 0) && <Separator />}

                  {recent.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-[--muted-foreground]" />
                          <span className="text-sm font-medium">Recent</span>
                        </div>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={clearRecent}
                          className="text-xs text-[--muted-foreground] hover:text-foreground"
                          aria-label="Clear recent searches"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuery(r);
                              setFocused(false);
                              onSubmitSearch();
                            }}
                            className="px-3 py-1.5 rounded-full bg-secondary hover:bg-muted text-sm transition border border-input"
                            aria-label={`Use recent search ${r}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {saved.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FolderLabelIcon />
                        <span className="text-sm font-medium">Saved searches</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {saved.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuery(s);
                              setFocused(false);
                              onSubmitSearch();
                            }}
                            className="px-3 py-1.5 rounded-full bg-accent hover:bg-[--secondary] text-sm transition border border-input"
                            aria-label={`Use saved search ${s}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="rounded-full bg-secondary text-foreground border border-input" variant="secondary">
                Query: <span className="ml-1 font-medium">{query ? query : "—"}</span>
              </Badge>
              <Badge className="rounded-full bg-secondary text-foreground border border-input" variant="secondary">
                Category: <span className="ml-1 font-medium">{category}</span>
              </Badge>
              <Badge className="rounded-full bg-secondary text-foreground border border-input" variant="secondary">
                Rentals: <span className="ml-1 font-medium">{rentalCategory}</span>
              </Badge>
              {location && (
                <Badge className="rounded-full bg-secondary text-foreground border border-input" variant="secondary">
                  <Locate className="h-3.5 w-3.5 mr-1" />
                  {location}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg"
                onClick={handleSaveSearch}
              >
                Save search
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="p-4 sm:p-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList className="rounded-xl bg-secondary p-1">
                <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                <TabsTrigger value="social" className="rounded-lg">Social</TabsTrigger>
                <TabsTrigger value="rentals" className="rounded-lg">Rentals</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-8">
                <TrendingSection />
                <UsersSection users={filteredUsers} onSelect={onSelectResult} />
                <HashtagsSection hashtags={filteredHashtags} onSelect={onSelectResult} />
                <PostsSection posts={filteredPosts} onSelect={onSelectResult} />
                <RentalsSection rentals={filteredRentals} onSelect={onSelectResult} />
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <div className="space-y-8">
                <UsersSection users={filteredUsers} onSelect={onSelectResult} />
                <HashtagsSection hashtags={filteredHashtags} onSelect={onSelectResult} />
                <PostsSection posts={filteredPosts} onSelect={onSelectResult} />
              </div>
            </TabsContent>

            <TabsContent value="rentals" className="mt-6">
              <div className="space-y-8">
                <CategoryBrowse />
                <RentalsSection rentals={filteredRentals} onSelect={onSelectResult} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

/** Decorative helper built from allowed icons */
function FolderLabelIcon() {
  return (
    <div aria-hidden className="inline-flex items-center justify-center">
      {/* Using TextSearch to symbolize saved label as the only list contains allowed icons */}
      <TextSearch className="h-4 w-4 text-[--muted-foreground]" />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      </div>
      {actionLabel && (
        <Button
          type="button"
          variant="ghost"
          className="rounded-lg text-sm"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function TrendingSection() {
  const trending = [
    { label: "CityLife", type: "hashtag" as const },
    { label: "GearShare", type: "hashtag" as const },
    { label: "studio lights", type: "query" as const },
    { label: "Austin, TX", type: "location" as const },
  ];
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<Search className="h-5 w-5 text-[--muted-foreground]" />}
        title="Trending"
        actionLabel="Refresh"
        onAction={() => toast.message("Trends refreshed")}
      />
      <div className="flex flex-wrap gap-2">
        {trending.map((t) => (
          <Badge
            key={t.label}
            variant="secondary"
            className="rounded-full bg-accent text-foreground border border-input"
          >
            {t.type === "hashtag" ? "#" : t.type === "location" ? <Locate className="h-3.5 w-3.5 mr-1" /> : null}
            {typeof t.label === "string" ? t.label : String(t.label)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function UsersSection({
  users,
  onSelect,
}: {
  users: User[];
  onSelect?: SearchDiscoveryProps["onSelectResult"];
}) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<TextSearch className="h-5 w-5 text-[--muted-foreground]" />}
        title="Users"
        actionLabel="See all"
        onAction={() => toast.message("Navigate to full user results")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-[--border] hover:shadow-sm transition"
          >
            <img
              src={u.avatar}
              alt={`${u.name} avatar`}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="font-medium truncate">{u.name}</div>
              <div className="text-sm text-[--muted-foreground] truncate">@{u.handle}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-lg"
                onClick={() => toast.success(`Following @${u.handle}`)}
              >
                Follow
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-lg"
                onClick={() => onSelect?.({ type: "user", id: u.id })}
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HashtagsSection({
  hashtags,
  onSelect,
}: {
  hashtags: Hashtag[];
  onSelect?: SearchDiscoveryProps["onSelectResult"];
}) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<Search className="h-5 w-5 text-[--muted-foreground]" />}
        title="Hashtags"
        actionLabel="See all"
        onAction={() => toast.message("Navigate to full hashtag results")}
      />
      <div className="flex flex-wrap gap-2">
        {hashtags.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-2 p-2 pr-3 rounded-full bg-secondary border border-input"
          >
            <Badge variant="secondary" className="rounded-full bg-card border border-[--border] px-2 py-0.5">
              #
            </Badge>
            <span className="text-sm font-medium">{h.tag}</span>
            <span className="text-xs text-[--muted-foreground]">{Intl.NumberFormat().format(h.uses)} uses</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full h-7 px-2 ml-1"
              onClick={() => onSelect?.({ type: "hashtag", id: h.id })}
            >
              Explore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsSection({
  posts,
  onSelect,
}: {
  posts: Post[];
  onSelect?: SearchDiscoveryProps["onSelectResult"];
}) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<Search className="h-5 w-5 text-[--muted-foreground]" />}
        title="Posts"
        actionLabel="See all"
        onAction={() => toast.message("Navigate to full post results")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((p) => (
          <article
            key={p.id}
            className="rounded-xl bg-card border border-[--border] overflow-hidden hover:shadow-sm transition"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={p.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <img
                  src={p.author.avatar}
                  alt={`${p.author.name} avatar`}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.author.name}</div>
                  <div className="text-xs text-[--muted-foreground] truncate">@{p.author.handle}</div>
                </div>
                <Badge variant="secondary" className="ml-auto rounded-full bg-secondary border border-input text-xs">
                  {p.likes} likes
                </Badge>
              </div>
              <p className="mt-2 text-sm line-clamp-2">{p.text}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-lg"
                  onClick={() => toast.success("Post liked")}
                >
                  Like
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => onSelect?.({ type: "post", id: p.id })}
                >
                  Open
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function RentalsSection({
  rentals,
  onSelect,
}: {
  rentals: Rental[];
  onSelect?: SearchDiscoveryProps["onSelectResult"];
}) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<PackageSearch className="h-5 w-5 text-[--muted-foreground]" />}
        title="Rentals"
        actionLabel="See all"
        onAction={() => toast.message("Navigate to full rental results")}
      />
      {rentals.length === 0 ? (
        <div className="p-6 rounded-xl bg-secondary border border-input text-sm text-[--muted-foreground]">
          No rentals match your filters. Try adjusting category or location.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rentals.map((r) => (
            <article
              key={r.id}
              className="rounded-xl bg-card border border-[--border] overflow-hidden hover:shadow-sm transition"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={r.image}
                  alt={r.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute left-3 top-3">
                  <Badge className="rounded-full bg-accent text-foreground border border-input">
                    ${r.pricePerDay}/day
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-semibold line-clamp-1">{r.title}</h4>
                <div className="mt-1 flex items-center gap-2 text-xs text-[--muted-foreground]">
                  <Locate className="h-3.5 w-3.5" />
                  <span className="truncate">{r.location}</span>
                  <span aria-hidden>•</span>
                  <span>{r.category}</span>
                  <span aria-hidden>•</span>
                  <span>{r.rating.toFixed(1)}★</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-lg"
                    onClick={() => toast.success("Saved to favorites")}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => onSelect?.({ type: "rental", id: r.id })}
                  >
                    Book
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryBrowse() {
  const cats = [
    { label: "Outdoors", icon: <PackageSearch className="h-4 w-4" /> },
    { label: "Tools", icon: <PackageSearch className="h-4 w-4" /> },
    { label: "Electronics", icon: <PackageSearch className="h-4 w-4" /> },
    { label: "Vehicles", icon: <PackageSearch className="h-4 w-4" /> },
    { label: "Home", icon: <PackageSearch className="h-4 w-4" /> },
  ];
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<ListFilter className="h-5 w-5 text-[--muted-foreground]" />}
        title="Browse by category"
      />
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c.label}
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-input text-sm hover:bg-muted transition"
            onClick={() => toast.message(`Filter: ${c.label}`)}
            aria-label={`Filter by ${c.label}`}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}