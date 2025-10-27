import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function MainSkeleton() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-[50px] w-[50px] rounded" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </div>
      </header>

      {/* 월간 합계 */}
      <div className="bg-primary text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-9 w-9 rounded bg-white/20" />
            <Skeleton className="h-7 w-32 bg-white/20" />
            <Skeleton className="h-9 w-9 rounded bg-white/20" />
          </div>
          <Skeleton className="h-10 w-48 mx-auto bg-white/20" />
        </div>
      </div>

      {/* 지출 목록 스켈레톤 */}
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
    </div>
  )
}
