'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ExpenseModal from '@/components/expense-modal'

type Expense = {
  id: string
  amount: number
  memo: string | null
  spent_at: string
  spent_by: string
  category_id: string
  categories: {
    name: string
    emoji: string | null
  } | null
}

type Member = {
  user_id: string
  display_name: string | null
}

type Category = {
  id: string
  name: string
}

type Props = {
  expenses: Expense[]
  members: Member[]
  categories: Category[]
  currentUserId: string
  selectedMonth: string
  filterCategory?: string
  filterUserId?: string
}

export default function StatsDetailClient({
  expenses,
  members,
  categories,
  currentUserId,
  selectedMonth,
  filterCategory,
  filterUserId,
}: Props) {
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const router = useRouter()

  // 날짜별로 그룹핑
  const groupedExpenses: {
    [date: string]: {
      expenses: Expense[]
      total: number
    }
  } = {}

  expenses.forEach((expense) => {
    const date = expense.spent_at
    if (!groupedExpenses[date]) {
      groupedExpenses[date] = {
        expenses: [],
        total: 0,
      }
    }
    groupedExpenses[date].expenses.push(expense)
    groupedExpenses[date].total += expense.amount
  })

  // 총 금액
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // 필터 이름 가져오기
  const getFilterName = () => {
    if (filterCategory) {
      return filterCategory
    }
    if (filterUserId) {
      const member = members.find((m) => m.user_id === filterUserId)
      return member?.display_name || (filterUserId === currentUserId ? '나' : '상대방')
    }
    return '전체'
  }

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01')
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  const handleExpenseClick = (expense: Expense) => {
    // ExpenseModal이 기대하는 타입으로 변환
    const transformedExpense = {
      ...expense,
      category: {
        name: expense.categories?.name || '카테고리 없음'
      },
      spent_by_user: {
        email: members.find(m => m.user_id === expense.spent_by)?.display_name || '이름 없음'
      },
      recorded_by_user: {
        email: ''
      }
    }
    setSelectedExpense(transformedExpense as any)
  }

  const handleCloseModal = () => {
    setSelectedExpense(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/stats?month=${selectedMonth}`}>
              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{getFilterName()}</h1>
              <p className="text-sm text-gray-600">{formatMonth(selectedMonth)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 합계 */}
      <div className="bg-primary text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-sm mb-1">총 {expenses.length}건</p>
          <p className="text-3xl font-bold">{totalAmount.toLocaleString()}원</p>
        </div>
      </div>

      {/* 지출 목록 */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {expenses.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="text-6xl">💰</div>
              <h2 className="text-xl font-semibold text-gray-700">지출 내역이 없어요</h2>
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
                          {expense.categories?.emoji || '💰'}
                        </span>
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {expense.categories?.name || '카테고리 없음'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {members.find(m => m.user_id === expense.spent_by)?.display_name || '이름 없음'}
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

      {/* 지출 수정/삭제 모달 */}
      {selectedExpense && (
        <ExpenseModal
          expense={selectedExpense}
          categories={categories}
          members={members}
          currentUserId={currentUserId}
          onClose={handleCloseModal}
          onUpdate={() => {
            router.refresh()
            setSelectedExpense(null)
          }}
          onDelete={() => {
            router.refresh()
            setSelectedExpense(null)
          }}
        />
      )}
    </div>
  )
}
