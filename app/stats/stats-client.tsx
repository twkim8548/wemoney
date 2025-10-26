'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type Expense = {
    id: string
    amount: number
    spent_at: string
    spent_by: string
    categories: {
        name: string
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
    categories: Category[]
    members: Member[]
    currentUserId: string
    selectedMonth: string
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function StatsClient({ expenses, categories, members, currentUserId, selectedMonth }: Props) {
    const router = useRouter()

    // 카테고리별 합계
    const categoryStats = categories.map(cat => {
        const total = expenses
            .filter(exp => exp.categories.name === cat.name)
            .reduce((sum, exp) => sum + exp.amount, 0)
        return {
            name: cat.name,
            total,
        }
    }).filter(stat => stat.total > 0)
        .sort((a, b) => b.total - a.total)

    // 지출자별 합계
    const memberStats = members.map(member => {
        const total = expenses
            .filter(exp => exp.spent_by === member.user_id)
            .reduce((sum, exp) => sum + exp.amount, 0)
        
        // 이름 결정: 본인이면 display_name 또는 '나', 타인이면 display_name 또는 '상대방'
        let displayName = member.display_name || (member.user_id === currentUserId ? '나' : '상대방')
        
        return {
            name: displayName,
            total,
            userId: member.user_id,
        }
    }).filter(stat => stat.total > 0)

    // 전체 합계
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)

    // 월 변경
    const changeMonth = (delta: number) => {
        const date = new Date(selectedMonth + '-01')
        date.setMonth(date.getMonth() + delta)
        const newMonth = date.toISOString().slice(0, 7)
        router.push(`/stats?month=${newMonth}`)
    }

    const formatMonth = (month: string) => {
        const date = new Date(month + '-01')
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link href="/main">
                            <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">통계</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-4 space-y-4">
                {/* 월 선택 */}
                <Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => changeMonth(-1)}
                                className="min-w-[44px] min-h-[44px]"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <h2 className="text-xl font-bold">{formatMonth(selectedMonth)}</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => changeMonth(1)}
                                className="min-w-[44px] min-h-[44px]"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 총 지출 */}
                <Card>
                    <CardHeader>
                        <CardTitle>총 지출</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-primary">
                            {totalAmount.toLocaleString()}원
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            총 {expenses.length}건
                        </p>
                    </CardContent>
                </Card>

                {/* 카테고리별 */}
                {categoryStats.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>카테고리별</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* 목록 */}
                            <div className="space-y-2">
                                {categoryStats.map((stat, index) => (
                                    <div
                                        key={stat.name}
                                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                        onClick={() => router.push(`/stats/detail?month=${selectedMonth}&category=${encodeURIComponent(stat.name)}`)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="font-medium">{stat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{stat.total.toLocaleString()}원</p>
                                            <p className="text-xs text-gray-500">
                                                {((stat.total / totalAmount) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 파이 차트 */}
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryStats}
                                            dataKey="total"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {categoryStats.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()}원`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 지출자별 */}
                {memberStats.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>지출자별</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {memberStats.map((stat, index) => (
                                <div
                                    key={stat.name}
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                    onClick={() => router.push(`/stats/detail?month=${selectedMonth}&userId=${stat.userId}`)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="font-medium">{stat.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{stat.total.toLocaleString()}원</p>
                                        <p className="text-xs text-gray-500">
                                            {((stat.total / totalAmount) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* 파이 차트 */}
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={memberStats}
                                            dataKey="total"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={60}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {memberStats.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()}원`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 데이터 없음 */}
                {expenses.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-gray-600">이번 달 지출 내역이 없어요</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}