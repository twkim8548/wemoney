'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useTransition } from 'react'
import ExpenseModal from '@/components/expense-modal'
import Image from "next/image"
import ExpenseListSkeleton from '@/components/expense-list-skeleton'

// 지출 데이터 타입
type Expense = {
  id: string
  amount: number
  memo: string | null
  spent_at: string
  category: {
    name: string
    emoji: string | null
  }
  spent_by_user: {
    email: string
  }
  recorded_by_user: {
    email: string
  }
}

// 날짜별로 그룹핑된 지출
type GroupedExpenses = {
  [date: string]: {
    expenses: Expense[]
    total: number
  }
}

type Category = {
  id: string
  name: string
}

type Member = {
  user_id: string
  display_name: string | null
}

type Props = {
  expenses: Expense[]
  totalAmount: number
  groupedExpenses: GroupedExpenses
  categories: Category[]
  members: Member[]
  currentUserId: string
  selectedMonth: string
}

export default function MainClient({ expenses, totalAmount, groupedExpenses, categories, members, currentUserId, selectedMonth }: Props) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // 현재 선택된 년도와 월
  const currentYear = parseInt(selectedMonth.split('-')[0])
  const currentMonthNum = parseInt(selectedMonth.split('-')[1])

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
  }

  const handleCloseModal = () => {
    setSelectedExpense(null)
  }

  // 월 변경
  const changeMonth = (delta: number) => {
    const date = new Date(selectedMonth + '-01')
    date.setMonth(date.getMonth() + delta)
    const newMonth = date.toISOString().slice(0, 7)
    startTransition(() => {
      router.push(`/main?month=${newMonth}`)
    })
  }

  // 년도 선택
  const selectYear = (year: number) => {
    const monthStr = currentMonthNum.toString().padStart(2, '0')
    startTransition(() => {
      router.push(`/main?month=${year}-${monthStr}`)
    })
    setShowYearPicker(false)
  }

  // 월 선택
  const selectMonth = (month: number) => {
    const monthStr = month.toString().padStart(2, '0')
    startTransition(() => {
      router.push(`/main?month=${currentYear}-${monthStr}`)
    })
    setShowMonthPicker(false)
  }

  // 년도 목록 (2020년부터 현재+5년까지)
  const startYear = 2020
  const endYear = new Date().getFullYear() + 5
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/wemoney-logo.png" alt="logo" width={50} height={50}/>
              <h1 className="text-2xl font-bold">위머니</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/stats">
                <Button variant="ghost" size="sm">
                  통계
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  설정
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 월간 합계 */}
      <div className="bg-primary text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeMonth(-1)}
              className="min-w-[36px] min-h-[36px] text-white hover:bg-primary-dark"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex items-center">
              {/* 년도 선택 */}
              <div className="relative">
                <button
                  className="text-white/90 text-lg font-semibold hover:text-white transition-colors px-2 py-1 rounded active:bg-primary-dark"
                >
                  {currentYear}년
                </button>
                {showYearPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowYearPicker(false)}
                    />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 max-h-64 overflow-y-auto">
                      {years.reverse().map((year) => (
                        <button
                          key={year}
                          onClick={() => selectYear(year)}
                          className={`w-full px-4 py-2.5 text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            year === currentYear
                              ? 'bg-primary text-white font-semibold'
                              : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          {year}년
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 월 선택 */}
              <div className="relative">
                <button
                  className="text-white/90 text-lg font-semibold hover:text-white transition-colors px-2 py-1 rounded active:bg-primary-dark"
                >
                  {currentMonthNum}월
                </button>
                {showMonthPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMonthPicker(false)}
                    />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50 p-3">
                      <div className="grid grid-cols-3 gap-2">
                        {months.map((month) => (
                          <Button
                            key={month}
                            variant={month === currentMonthNum ? 'default' : 'outline'}
                            onClick={() => selectMonth(month)}
                            className="h-10"
                            size="sm"
                          >
                            {month}월
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeMonth(1)}
              className="min-w-[36px] min-h-[36px] text-white hover:bg-primary-dark"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-3xl font-bold text-center">
            {totalAmount.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 지출 목록 */}
      {isPending ? (
        <ExpenseListSkeleton />
      ) : (
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
          {(!expenses || expenses.length === 0) ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="text-6xl">💰</div>
                <h2 className="text-xl font-semibold text-gray-700">
                  이번 달 지출 내역이 없어요
                </h2>
                <p className="text-gray-500">
                  첫 지출을 기록해보세요!
                </p>
              </div>
            </div>
          ) : (
            <>
              {Object.entries(groupedExpenses).map(([date, { expenses, total }]) => (
          <div key={date} className="space-y-2">
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold text-gray-700">
                {format(new Date(date), 'M월 d일 (E)', { locale: ko })}
              </h2>
              <p className="text-sm font-medium text-gray-600">
                {total.toLocaleString()}원
              </p>
            </div>

            {/* 지출 항목들 */}
            <Card className="divide-y">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpenseClick(expense)}
                >
                  {/* 카테고리 */}
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                    <span className="text-lg">
                      {expense.category.emoji || '💰'}
                    </span>
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {expense.category.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {expense.spent_by_user.email}
                      </span>
                    </div>
                    {expense.memo && (
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {expense.memo}
                      </p>
                    )}
                  </div>

                  {/* 금액 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold text-gray-900">
                      {expense.amount.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}
            </>
          )}
        </div>
      )}

      {/* 플로팅 버튼 */}
      <Link href="/add" className="fixed bottom-6 right-6">
        <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>

      {/* 지출 수정/삭제 모달 */}
      {selectedExpense && (
        <ExpenseModal
          expense={selectedExpense}
          categories={categories}
          members={members}
          currentUserId={currentUserId}
          onClose={handleCloseModal}
          onUpdate={() => {
            window.location.reload()
          }}
          onDelete={() => {
            window.location.reload()
          }}
        />
      )}


    </div>
  )
}

