"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  House,
  Columns3,
  ArrowLeftRight,
  PanelsLeftBottom,
  PictureInPicture2,
  SquareUser,
  ToggleRight,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UnreadCounts = {
  messages?: number;
  bookings?: number;
};

type NavigationBarProps = {
  className?: string;
  isAuthenticated?: boolean;
  userName?: string;
  userImageUrl?: string;
  unreadCounts?: UnreadCounts;
  onRequireAuth?: (path: string) => void;
  currentPath?: string;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  requiresAuth?: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badgeCount?: number;
};

export default function NavigationBar({
  className,
  isAuthenticated = false,
  userName,
  userImageUrl,
  unreadCounts,
  onRequireAuth,
  currentPath,
}: NavigationBarProps) {
  const pathname = usePathname();
  const activePath = currentPath ?? pathname ?? "/";

  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = root.classList.contains("dark") || prefersDark;
    setIsDark(initialDark);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const items = useMemo<NavItem[]>(
    () => [
      { key: "home", label: "Home", href: "/", icon: House },
      { key: "search", label: "Search", href: "/search", icon: Columns3 },
      { key: "social", label: "Social", href: "/social", icon: ArrowLeftRight, requiresAuth: true },
      {
        key: "bookings",
        label: "Bookings",
        href: "/bookings",
        icon: PanelsLeftBottom,
        requiresAuth: true,
        badgeCount: unreadCounts?.bookings ?? 0,
      },
      {
        key: "messages",
        label: "Messages",
        href: "/messages",
        icon: PictureInPicture2,
        requiresAuth: true,
        badgeCount: unreadCounts?.messages ?? 0,
      },
      { key: "profile", label: "Profile", href: "/profile", icon: SquareUser, requiresAuth: true },
      { key: "admin", label: "Admin", href: "/admin", icon: PanelsLeftBottom, requiresAuth: true },
    ],
    [unreadCounts?.bookings, unreadCounts?.messages]
  );

  const handleAuthGate = (href: string) => {
    if (isAuthenticated) return;
    if (onRequireAuth) {
      onRequireAuth(href);
    }
  };

  const initials = (userName ?? "Guest")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        role="navigation"
        aria-label="Primary"
        className={[
          "w-full bg-card text-foreground border-b border-border",
          "sticky top-0 z-40",
          "backdrop-blur supports-[backdrop-filter]:bg-card/95",
          "transition-colors duration-300",
          className ?? "",
        ].join(" ")}
      >
        <div className="w-full max-w-full">
          <div className="mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3">
            {/* Brand / App Title */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Rent My Life Home"
              >
                <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-display text-xs">
                  R
                </div>
                <span className="font-display text-sm sm:text-base font-semibold tracking-tight truncate">
                  Rent My Life
                </span>
              </Link>
            </div>

            {/* Primary Navigation */}
            <ul className="flex items-center gap-1 sm:gap-2 min-w-0">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activePath === item.href ||
                  (item.href !== "/" && activePath.startsWith(item.href + "/")) ||
                  (item.href !== "/" && activePath === item.href);

                const gated = !!item.requiresAuth && !isAuthenticated;

                const baseClasses =
                  "relative inline-flex items-center gap-2 rounded-full px-3 sm:px-3.5 py-2 text-sm font-medium transition-colors";
                const stateClasses = isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/80 hover:text-foreground hover:bg-foreground/5";
                const disabledClasses = gated ? "opacity-60 cursor-not-allowed" : "";

                const content = (
                  <span className="flex items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline min-w-0 truncate">{item.label}</span>
                    {Boolean(item.badgeCount) && item.badgeCount! > 0 && (
                      <span
                        aria-label={`${item.badgeCount} unread`}
                        className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground px-1.5 text-xs leading-none"
                      >
                        {item.badgeCount! > 99 ? "99+" : item.badgeCount}
                      </span>
                    )}
                    <span className="sr-only">{isActive ? "(current)" : ""}</span>
                  </span>
                );

                return (
                  <li key={item.key} className="min-w-0">
                    {gated ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleAuthGate(item.href)}
                            className={[baseClasses, stateClasses, disabledClasses].join(" ")}
                            aria-disabled="true"
                            aria-label={`${item.label} (sign in required)`}
                          >
                            {content}
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-x-2 -bottom-1 block h-0.5 rounded-full bg-foreground/70"
                              />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
                          Sign in required
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={[baseClasses, stateClasses].join(" ")}
                      >
                        {content}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-2 -bottom-1 block h-0.5 rounded-full bg-foreground/70"
                          />
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Right side actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setIsDark((v) => !v)}
                className="rounded-full bg-transparent hover:bg-foreground/5 text-foreground/80 hover:text-foreground"
              >
                <ToggleRight className="h-5 w-5" />
              </Button>

              {/* Authenticated user menu or auth actions */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1.5 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                      aria-label="User menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          alt={userName ?? "User avatar"}
                          src={
                            userImageUrl ||
                            "https://images.unsplash.com/photo-1541534401786-2077eed87a42?q=80&w=256&auto=format&fit=crop"
                          }
                        />
                        <AvatarFallback className="font-medium">{initials || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium max-w-[10rem] truncate">
                        {userName ?? "User"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-popover text-popover-foreground"
                  >
                    <DropdownMenuLabel className="truncate">Signed in as {userName ?? "User"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">My Bookings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages">Messages</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/logout">Sign out</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => onRequireAuth?.("/login")}
                  >
                    Sign in
                  </Button>
                  <Button
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => onRequireAuth?.("/signup")}
                  >
                    Get started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}