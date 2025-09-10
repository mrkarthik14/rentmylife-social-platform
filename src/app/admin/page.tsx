import AdminDashboard from "@/components/admin-dashboard"

export default function Page(): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold mb-4">Admin</h1>
        <AdminDashboard />
      </main>
    </div>
  )
}