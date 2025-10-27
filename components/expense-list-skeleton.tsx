import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function ExpenseListSkeleton() {
  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          {/* 날짜 헤더 */}
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>

          {/* 지출 항목들 */}
          <Card className="divide-y">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-4 flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20 flex-shrink-0" />
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}
