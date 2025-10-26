import { createClient } from '@/lib/supabase/server'
import MainClient from './main-client'

// 지출 데이터 타입
type Expense = {
  id: string
  amount: number
  memo: string | null
  spent_at: string
  category: {
    name: string
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

async function getAppData(selectedMonth: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('User:', user?.id)

  if (!user) return null

  // 현재 사용자의 workspace 찾기
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single() as { data: { workspace_id: string } | null }

  console.log('Member workspace_id:', member?.workspace_id)

  if (!member) return null

  // 해당 월의 시작일과 종료일 계산
  const startDate = `${selectedMonth}-01`
  const endDate = new Date(selectedMonth + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  endDate.setDate(0) // 전월 마지막 날
  const endDateStr = endDate.toISOString().split('T')[0]

  // 지출 목록 가져오기 (선택한 월)
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      id,
      amount,
      memo,
      spent_at,
      spent_by,
      recorded_by,
      category_id,
      categories!category_id(name, emoji)
    `)
    .eq('workspace_id', member.workspace_id)
    .gte('spent_at', startDate)
    .lte('spent_at', endDateStr)
    .order('spent_at', { ascending: false })
    .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

  // 카테고리 목록 가져오기
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('workspace_id', member.workspace_id)
    .order('name') as { data: { id: string; name: string }[] | null }

  // 멤버 목록 가져오기 (이름 포함)
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, display_name')
    .eq('workspace_id', member.workspace_id) as { data: { user_id: string; display_name: string | null }[] | null }

  console.log('Expenses count:', expenses?.length)
  console.log('Expenses error:', error)

  if (!expenses) return null

  // 멤버 ID to 이름 맵 생성
  const memberMap = new Map(
    members?.map(m => [m.user_id, m.display_name || (m.user_id === user.id ? '나' : '상대방')]) || []
  )

  // spent_by로 표시명 매핑
  const expensesWithUser = expenses.map(exp => ({
    ...exp,
    category: exp.categories,
    spent_by_user: {
      email: memberMap.get(exp.spent_by) || '알 수 없음'
    },
    recorded_by_user: {
      email: memberMap.get(exp.recorded_by) || '알 수 없음'
    }
  }))

  return {
    expenses: expensesWithUser as Expense[],
    categories: categories || [],
    members: members || [],
    currentUserId: user.id
  }
}

type Props = {
  searchParams: Promise<{
    month?: string
  }>
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams
  const selectedMonth = params.month || new Date().toISOString().slice(0, 7) // YYYY-MM

  const appData = await getAppData(selectedMonth)

  if (!appData) {
    return <MainClient 
      expenses={[]} 
      totalAmount={0} 
      groupedExpenses={{}} 
      categories={[]}
      members={[]}
      currentUserId=""
      selectedMonth={selectedMonth}
    />
  }

  const { expenses, categories, members, currentUserId } = appData

  // 날짜별로 그룹핑
  const groupedExpenses: GroupedExpenses = expenses.reduce((acc, expense) => {
    const date = expense.spent_at
    if (!acc[date]) {
      acc[date] = { expenses: [], total: 0 }
    }
    acc[date].expenses.push(expense)
    acc[date].total += expense.amount
    return acc
  }, {} as GroupedExpenses)

  // 전체 합계
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <MainClient 
      expenses={expenses} 
      totalAmount={totalAmount} 
      groupedExpenses={groupedExpenses}
      categories={categories}
      members={members}
      currentUserId={currentUserId}
      selectedMonth={selectedMonth}
    />
  )
}
