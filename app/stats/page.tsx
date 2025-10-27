import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsClient from './stats-client'

type Props = {
  searchParams: Promise<{
    month?: string
  }>
}

export default async function StatsPage({ searchParams }: Props) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // workspace 찾기
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single() as { data: { workspace_id: string } | null }

  if (!member) {
    redirect('/onboarding')
  }

  // 월 파라미터 (기본값: 현재 월)
  const params = await searchParams
  const selectedMonth = params.month || new Date().toISOString().slice(0, 7) // YYYY-MM

  // 해당 월의 시작일과 종료일
  const startDate = `${selectedMonth}-01`
  const endDate = new Date(selectedMonth + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  endDate.setDate(0) // 전월 마지막 날
  const endDateStr = endDate.toISOString().split('T')[0]

  // 모든 쿼리를 병렬로 실행
  const [expensesResult, categoriesResult, membersResult] = await Promise.all([
    // 지출 데이터 가져오기
    supabase
      .from('expenses')
      .select(`
        id,
        amount,
        spent_at,
        spent_by,
        categories!category_id(name)
      `)
      .eq('workspace_id', member.workspace_id)
      .gte('spent_at', startDate)
      .lte('spent_at', endDateStr)
      .order('spent_at', { ascending: false }),

    // 카테고리 목록
    supabase
      .from('categories')
      .select('id, name')
      .eq('workspace_id', member.workspace_id)
      .order('name'),

    // 멤버 목록 (이름 포함)
    supabase
      .from('workspace_members')
      .select('user_id, display_name')
      .eq('workspace_id', member.workspace_id)
  ])

  const { data: expenses } = expensesResult as { data: any[] | null }
  const { data: categories } = categoriesResult as { data: { id: string; name: string }[] | null }
  const { data: members } = membersResult as { data: { user_id: string; display_name: string | null }[] | null }

  return (
    <StatsClient
      expenses={expenses || []}
      categories={categories || []}
      members={members || []}
      currentUserId={user.id}
      selectedMonth={selectedMonth}
    />
  )
}
