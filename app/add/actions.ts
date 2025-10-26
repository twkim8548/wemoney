'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addExpense(formData: {
  categoryId: string
  amount: number
  memo: string
  spentAt: string
  spentBy: string
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인이 필요합니다')
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single() as { data: { workspace_id: string } | null }

  if (!member) {
    throw new Error('workspace를 찾을 수 없습니다')
  }

  const { error } = await supabase
    .from('expenses')
    .insert({
      workspace_id: member.workspace_id,
      category_id: formData.categoryId,
      amount: formData.amount,
      memo: formData.memo || null,
      spent_at: formData.spentAt,
      spent_by: formData.spentBy,
      recorded_by: user.id,
    } as any)

  if (error) {
    throw error
  }

  revalidatePath('/main')
  redirect('/main')
}
