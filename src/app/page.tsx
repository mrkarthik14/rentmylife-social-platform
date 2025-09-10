"use client";

import { useCallback, useMemo, useState } from "react";
import AuthenticationSystem from "@/components/authentication-system";
import SearchDiscovery from "@/components/search-discovery";
import SocialFeedSystem from "@/components/social-feed-system";
import RentalMarketplace from "@/components/rental-marketplace";
import BookingManagement from "@/components/booking-management";
import MessagingSystem from "@/components/messaging-system";
import UserProfileSystem from "@/components/user-profile-system";
import AdminDashboard from "@/components/admin-dashboard";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type SectionKey =
  | "home"
  | "search"
  | "social"
  | "marketplace"
  | "bookings"
  | "messages"
  | "profile"
  | "admin";

const pathForSection: Record<SectionKey, string> = {
  home: "/",
  search: "/search",
  social: "/social",
  marketplace: "/marketplace",
  bookings: "/bookings",
  messages: "/messages",
  profile: "/profile",
  admin: "/admin",
};

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userImageUrl] = useState<string | undefined>(undefined);
  const [unreadCounts, setUnreadCounts] = useState<{ messages: number; bookings: number }>({
    messages: 2,
    bookings: 1,
  });

  const [activeSection, setActiveSection] = useState<SectionKey>("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const currentPath = pathForSection[activeSection];

  const handleRequireAuth = useCallback((path: string) => {
    setPendingPath(path);
    setAuthOpen(true);
  }, []);

  const handleAuthedNavigation = useCallback(() => {
    if (!pendingPath) return;
    const entry = (Object.entries(pathForSection) as [SectionKey, string][])
      .find(([, href]) => href === pendingPath);
    if (entry) {
      setActiveSection(entry[0]);
    }
    setPendingPath(null);
  }, [pendingPath]);

  const onAuth = useCallback(
    (payload: { type: "login" | "signup" | "admin-login"; role: "guest" | "user" | "companion" | "admin"; email?: string }) => {
      setIsAuthenticated(true);
      setUserName(payload.email ? payload.email.split("@")[0] : "Member");
      setAuthOpen(false);
      handleAuthedNavigation();
      // Small demo tweak: if admin login, open admin section
      if (payload.type === "admin-login" || payload.role === "admin") {
        setActiveSection("admin");
      }
    },
    [handleAuthedNavigation]
  );

  // Messaging demo data
  const conversations = useMemo(
    () => [
      {
        id: "c1",
        name: "Studio Host",
        isGroup: false,
        participants: [
          { id: "me", name: userName || "You", avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop" },
          { id: "u2", name: "Priya Patel", avatarUrl: "https://images.unsplash.com/photo-1541534401786-2077eed87a42?q=80&w=200&auto=format&fit=crop" },
        ],
        unread: 1,
        lastMessage: {
          id: "lm1",
          senderId: "u2",
          content: "Hi! Are you still interested in the booking?",
          createdAt: new Date().toISOString(),
          status: "delivered",
        },
      },
      {
        id: "c2",
        name: "Camera Kit Owner",
        isGroup: false,
        participants: [
          { id: "me", name: userName || "You" },
          { id: "u3", name: "Alex Johnson", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
        ],
        unread: 1,
        lastMessage: {
          id: "lm2",
          senderId: "me",
          content: "Can I pick up at 10am?",
          createdAt: new Date().toISOString(),
          status: "sent",
        },
      },
    ],
    [userName]
  );

  const onSendMessage = useCallback((conversationId: string) => {
    // Mark messages as read on send
    setUnreadCounts((prev) => ({ ...prev, messages: Math.max(0, prev.messages - 1) }));
  }, []);

  const onMarkMessagesRead = useCallback((conversationId: string) => {
    setUnreadCounts((prev) => ({ ...prev, messages: 0 }));
  }, []);

  // Example profile data
  const profileUser = useMemo(
    () => ({
      id: "me",
      name: userName || "You",
      username: (userName || "you").toLowerCase(),
      avatarUrl:
        userImageUrl ||
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=facearea&facepad=3&h=256",
      bio: "Exploring the world through shared experiences and gear.",
      interests: ["Travel", "Photography", "Outdoors"],
      verified: isAuthenticated,
      stats: { posts: 12, followers: 340, following: 181 },
      ratings: { host: 4.7, guest: 4.8 },
    }),
    [isAuthenticated, userImageUrl, userName]
  );

  const onSelectSearchResult = useCallback(
    (payload: { type: "user" | "hashtag" | "post" | "rental"; id: string }) => {
      if (payload.type === "rental") {
        setActiveSection("marketplace");
      } else if (payload.type === "post" || payload.type === "hashtag" || payload.type === "user") {
        setActiveSection("social");
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4">
          <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as SectionKey)} className="w-full">
            <TabsList className="flex w-full flex-wrap gap-2 bg-muted/60 p-1">
              <TabsTrigger value="home" className="rounded-full">Home</TabsTrigger>
              <TabsTrigger value="search" className="rounded-full">Search</TabsTrigger>
              <TabsTrigger value="social" className="rounded-full">Social</TabsTrigger>
              <TabsTrigger value="marketplace" className="rounded-full">Marketplace</TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-full" disabled={!isAuthenticated}>Bookings</TabsTrigger>
              <TabsTrigger value="messages" className="rounded-full" disabled={!isAuthenticated}>Messages</TabsTrigger>
              <TabsTrigger value="profile" className="rounded-full" disabled={!isAuthenticated}>Profile</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-full" disabled={!isAuthenticated}>Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <SocialFeedSystem isAdmin={false} />
                  <RentalMarketplace layout="comfortable" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                  <SearchDiscovery defaultTab="all" onSelectResult={onSelectSearchResult} />
                  {isAuthenticated ? (
                    <UserProfileSystem user={profileUser} layout="compact" />
                  ) : (
                    <AuthenticationSystem
                      defaultTab="user"
                      onAuth={onAuth}
                      className=""
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                <SearchDiscovery defaultTab="all" onSelectResult={onSelectSearchResult} />
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <SocialFeedSystem isAdmin={isAuthenticated} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                  <SearchDiscovery defaultTab="social" onSelectResult={onSelectSearchResult} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                <RentalMarketplace layout="comfortable" />
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              {isAuthenticated ? (
                <BookingManagement />
              ) : (
                <div className="max-w-2xl">
                  <AuthenticationSystem defaultTab="user" onAuth={onAuth} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              {isAuthenticated ? (
                <MessagingSystem
                  conversations={conversations as any}
                  currentUserId="me"
                  onSendMessage={(id) => onSendMessage(id)}
                  onMarkRead={(id) => onMarkMessagesRead(id)}
                />
              ) : (
                <div className="max-w-2xl">
                  <AuthenticationSystem defaultTab="user" onAuth={onAuth} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              {isAuthenticated ? (
                <UserProfileSystem
                  user={profileUser}
                  rentals={[
                    {
                      id: "r1",
                      title: "Cozy Studio Space",
                      coverUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
                      pricePerNight: 120,
                      rating: 4.8,
                      location: "Brooklyn, NY",
                    },
                    {
                      id: "r2",
                      title: "Mirrorless Camera Kit",
                      coverUrl: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=1200&auto=format&fit=crop",
                      pricePerNight: 65,
                      rating: 4.7,
                      location: "San Francisco, CA",
                    },
                  ]}
                  activity={[
                    { id: "a1", type: "post", dateISO: new Date().toISOString(), title: "Shared a weekend recap" },
                    { id: "a2", type: "booking", dateISO: new Date().toISOString(), title: "Confirmed: Studio Space" },
                    { id: "a3", type: "social", dateISO: new Date().toISOString(), title: "Gained 3 new followers" },
                  ]}
                />
              ) : (
                <div className="max-w-2xl">
                  <AuthenticationSystem defaultTab="user" onAuth={onAuth} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              {isAuthenticated ? (
                <AdminDashboard />
              ) : (
                <div className="max-w-2xl">
                  <AuthenticationSystem defaultTab="admin" onAuth={onAuth} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-3xl">
          <AuthenticationSystem defaultTab="user" onAuth={onAuth} />
        </DialogContent>
      </Dialog>
    </div>
  );
}