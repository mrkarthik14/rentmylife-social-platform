import MessagingSystem from "@/components/messaging-system"

export default function Page(): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <MessagingSystem
          conversations={[
            {
              id: "conv-1",
              name: "Sarah Johnson",
              isGroup: false,
              participants: [
                { id: "me", name: "You", avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop" },
                { id: "user-1", name: "Sarah Johnson" }
              ],
              unread: 2,
              lastMessage: {
                id: "msg-1",
                senderId: "user-1",
                content: "Hey, is the bike still available for rent?",
                createdAt: new Date().toISOString(),
                status: "delivered",
              }
            },
            {
              id: "conv-2",
              name: "Weekend Trip Group",
              isGroup: true,
              participants: [
                { id: "me", name: "You" },
                { id: "user-2", name: "Mike Chen" },
                { id: "user-3", name: "Emma Wilson" }
              ],
              unread: 0,
              lastMessage: {
                id: "msg-2",
                senderId: "user-2",
                content: "Sounds good, I'll bring the camera gear",
                createdAt: new Date().toISOString(),
                status: "sent",
              }
            }
          ]}
          currentUserId="me"
        />
      </main>
    </div>
  )
}