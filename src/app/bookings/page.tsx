import BookingManagement from "@/components/booking-management"

export default function Page(): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold mb-4">Bookings</h1>
        <BookingManagement />
      </main>
    </div>
  )
}