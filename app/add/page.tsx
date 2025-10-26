'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { addExpense } from './actions'

type Category = {
  id: string
  name: string
  emoji: string | null
  is_default: boolean
}

type WorkspaceMember = {
  user_id: string
  display_name: string | null
}

export default function AddExpensePage() {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [memo, setMemo] = useState('')
  const [spentBy, setSpentBy] = useState('')
  const [spentAt, setSpentAt] = useState(new Date().toISOString().split('T')[0])
  const [categories, setCategories] = useState<Category[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('💰')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // workspace 찾기
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single() as { data: { workspace_id: string } | null }

    if (!member) return

    // 카테고리 로드
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, emoji, is_default')
      .eq('workspace_id', member.workspace_id)
      .order('name') as { data: Category[] | null }

    if (categoriesData && categoriesData.length > 0) {
      setCategories(categoriesData)
      setCategoryId(categoriesData[0].id)
    }

    // 멤버 로드 (현재 유저 + workspace 멤버들, 이름 포함)
    const { data: membersData } = await supabase
      .from('workspace_members')
      .select('user_id, display_name')
      .eq('workspace_id', member.workspace_id) as { data: WorkspaceMember[] | null }

    if (membersData) {
      setMembers(membersData)
      setSpentBy(user.id) // 기본값은 본인
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single() as { data: { workspace_id: string } | null }

    if (!member) return

    // 해당 카테고리에 지출 내역이 있는지 확인
    const { data: expenses, count } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', member.workspace_id)
      .eq('category_id', categoryId)

    if (count && count > 0) {
      alert(`"${categoryName}" 카테고리에 ${count}건의 지출 내역이 있어 삭제할 수 없습니다.`)
      return
    }

    if (!confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      return
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      setError('카테고리 삭제 실패')
      return
    }

    // 삭제된 카테고리 제거
    setCategories(categories.filter(cat => cat.id !== categoryId))
    
    // 선택된 카테고리가 삭제된 경우 첫 번째 카테고리로 변경
    if (categoryId === categoryId) {
      const remaining = categories.filter(cat => cat.id !== categoryId)
      if (remaining.length > 0) {
        setCategoryId(remaining[0].id)
      }
    }
  }

  const handleCategoryLongPress = (categoryId: string, categoryName: string) => {
    handleDeleteCategory(categoryId, categoryName)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single() as { data: { workspace_id: string } | null }

    if (!member) return

    const { data, error } = await supabase
      .from('categories')
      .insert({
        workspace_id: member.workspace_id,
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        is_default: false,
        created_by: user.id,
      } as any)
      .select()
      .single() as { data: Category | null; error: any }

    if (error) {
      setError('카테고리 추가 실패')
      return
    }

    if (data) {
      setCategories([...categories, data])
      setCategoryId(data.id)
      setNewCategoryName('')
      setNewCategoryEmoji('💰')
      setShowNewCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || !categoryId || !spentBy) {
      setError('필수 항목을 입력해주세요')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('올바른 금액을 입력해주세요')
      return
    }

    setLoading(true)

    try {
      await addExpense({
        categoryId,
        amount: amountNum,
        memo: memo.trim(),
        spentAt,
        spentBy,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '지출 추가에 실패했습니다')
      setLoading(false)
    }
  }

  // 자주 쓰는 이모지 목록
  const commonEmojis = ['🍚', '🍺', '☕', '🛒', '🍪', '✈️', '🎮', '💪', '🏠', '🚗', '💰', '📱', '👕', '💊', '🎬', '📚']

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
            <h1 className="text-xl font-bold">지출 추가</h1>
          </div>
        </div>
      </header>

      {/* 폼 */}
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>새 지출 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 금액 */}
              <div className="space-y-2">
                <Label htmlFor="amount">금액 *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={amount ? parseInt(amount.replace(/,/g, '')).toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '')
                      if (value === '' || /^\d+$/.test(value)) {
                        setAmount(value)
                      }
                    }}
                    placeholder="10,000"
                    required
                    className="text-lg"
                  />
                  <span className="text-gray-600">원</span>
                </div>
              </div>

              {/* 카테고리 */}
              <div className="space-y-2">
                <Label>카테고리 * <span className="text-xs text-gray-500">(길게 눌러서 삭제)</span></Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      onTouchStart={() => {
                        const timer = setTimeout(() => {
                          handleCategoryLongPress(category.id, category.name)
                        }, 800)
                        setLongPressTimer(timer)
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer)
                          setLongPressTimer(null)
                        }
                      }}
                      onMouseDown={() => {
                        const timer = setTimeout(() => {
                          handleCategoryLongPress(category.id, category.name)
                        }, 800)
                        setLongPressTimer(timer)
                      }}
                      onMouseUp={() => {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer)
                          setLongPressTimer(null)
                        }
                      }}
                      onMouseLeave={() => {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer)
                          setLongPressTimer(null)
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors select-none ${
                        categoryId === category.id
                          ? 'border-primary bg-primary-light'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{category.emoji || '💰'}</div>
                      <div className="text-xs font-medium text-gray-700">{category.name}</div>
                    </button>
                  ))}
                  
                  {/* 카테고리 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-primary hover:bg-primary-light transition-colors"
                  >
                    <Plus className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <div className="text-xs font-medium text-gray-600">추가</div>
                  </button>
                </div>

                {/* 새 카테고리 입력 */}
                {showNewCategory && (
                  <div className="space-y-3 mt-3 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label className="text-sm mb-2 block">이모지 선택</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
                        {commonEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewCategoryEmoji(emoji)}
                            className={`p-2 text-2xl rounded border-2 transition-colors ${
                              newCategoryEmoji === emoji
                                ? 'border-primary bg-primary-light'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Input
                          value={newCategoryEmoji}
                          onChange={(e) => setNewCategoryEmoji(e.target.value)}
                          placeholder="또는 직접 입력"
                          className="text-center text-xs h-12"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">카테고리 이름</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="예: 교통비"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowNewCategory(false)
                          setNewCategoryName('')
                          setNewCategoryEmoji('💰')
                        }}
                        className="flex-1"
                      >
                        취소
                      </Button>
                      <Button type="button" onClick={handleAddCategory} className="flex-1">
                        추가
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 지출자 */}
              <div className="space-y-2">
                <Label>지출자 *</Label>
                <div className="flex gap-2">
                  {members.map((member) => (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => setSpentBy(member.user_id)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                        spentBy === member.user_id
                          ? 'border-primary bg-primary-light'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {member.display_name || '이름 없음'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 날짜 */}
              <div className="space-y-2">
                <Label htmlFor="spentAt">날짜 *</Label>
                <Input
                  id="spentAt"
                  type="date"
                  value={spentAt}
                  onChange={(e) => setSpentAt(e.target.value)}
                  required
                />
              </div>

              {/* 메모 */}
              <div className="space-y-2">
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="메모를 입력하세요 (선택)"
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? '추가 중...' : '지출 추가'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
