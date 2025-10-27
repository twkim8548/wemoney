import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsDetailClient from './stats-detail-client'

type Props = {
  searchParams: Promise<{
    month?: string
    category?: string
    userId?: string
  }>
}

export default async function StatsDetailPage({ searchParams }: Props) {
  const supabase = await createClient()
  const params = await searchParams

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

  const selectedMonth = params.month || new Date().toISOString().slice(0, 7)
  const categoryName = params.category
  const userId = params.userId

  // 월의 시작일과 종료일 계산
  const startDate = `${selectedMonth}-01`
  const endDate = new Date(selectedMonth + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  endDate.setDate(0)
  const endDateStr = endDate.toISOString().split('T')[0]

  // 지출 내역 가져오기
  let query = supabase
    .from('expenses')
    .select(`
      id,
      amount,
      memo,
      spent_at,
      spent_by,
      category_id,
      categories!category_id(name, emoji)
    `)
    .eq('workspace_id', member.workspace_id)
    .gte('spent_at', startDate)
    .lte('spent_at', endDateStr)
    .order('spent_at', { ascending: false })

  // 카테고리 필터
  if (categoryName) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('workspace_id', member.workspace_id)
      .eq('name', categoryName)
      .single() as { data: { id: string } | null }

    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  // 사용자 필터
  if (userId) {
    query = query.eq('spent_by', userId)
  }

  // 지출 데이터와 멤버/카테고리 정보를 병렬로 가져오기
  const [expensesResult, membersResult, categoriesResult] = await Promise.all([
    query,
    supabase
      .from('workspace_members')
      .select('user_id, display_name')
      .eq('workspace_id', member.workspace_id),
    supabase
      .from('categories')
      .select('id, name')
      .eq('workspace_id', member.workspace_id)
      .order('name')
  ])

  const { data: expenses } = expensesResult as {
    data: Array<{
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
    }> | null
  }
  const { data: members } = membersResult as {
    data: Array<{
      user_id: string
      display_name: string | null
    }> | null
  }
  const { data: categories } = categoriesResult as {
    data: Array<{
      id: string
      name: string
    }> | null
  }

  return (
    <StatsDetailClient
      expenses={expenses || []}
      members={members || []}
      categories={categories || []}
      currentUserId={user.id}
      selectedMonth={selectedMonth}
      filterCategory={categoryName}
      filterUserId={userId}
    />
  )
}
