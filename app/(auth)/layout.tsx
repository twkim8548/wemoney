export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light to-white p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
