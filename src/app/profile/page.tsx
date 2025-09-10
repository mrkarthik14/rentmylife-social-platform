import UserProfileSystem from "@/components/user-profile-system"

export default function Page(): JSX.Element {
  const user = {
    id: "me",
    name: "You",
    username: "you",
    avatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=facearea&facepad=3&h=256",
    bio: "Exploring the world through shared experiences and gear.",
    interests: ["Travel", "Photography", "Outdoors"],
    verified: false,
    stats: { posts: 12, followers: 340, following: 181 },
    ratings: { host: 4.7, guest: 4.8 }
  }

  const rentals = [
    {
      id: "1",
      title: "Professional Camera Kit",
      coverUrl: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?q=80&w=400&auto=format&fit=crop",
      pricePerNight: 45,
      rating: 4.9,
      location: "San Francisco, CA"
    },
    {
      id: "2",
      title: "Camping Gear Bundle",
      coverUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=400&auto=format&fit=crop",
      pricePerNight: 35,
      rating: 4.8,
      location: "Denver, CO"
    }
  ]

  const activity = [
    {
      id: "1",
      type: "post" as const,
      dateISO: new Date().toISOString(),
      title: "Just listed my camping gear for rent!"
    },
    {
      id: "2",
      type: "booking" as const,
      dateISO: new Date(Date.now() - 86400000).toISOString(),
      title: "Confirmed booking for camera kit"
    },
    {
      id: "3",
      type: "social" as const,
      dateISO: new Date(Date.now() - 172800000).toISOString(),
      title: "Joined the Photography group"
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <UserProfileSystem
          user={user}
          rentals={rentals}
          activity={activity}
        />
      </main>
    </div>
  )
}