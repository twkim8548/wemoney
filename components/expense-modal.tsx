'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

type Category = {
  id: string
  name: string
}

type Member = {
  user_id: string
  display_name: string | null
}

type Props = {
  expense: Expense
  categories: Category[]
  members: Member[]
  currentUserId: string
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
}

export default function ExpenseModal({ 
  expense, 
  categories,
  members,
  currentUserId,
  onClose, 
  onUpdate, 
  onDelete 
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // 모달 열릴 때 배경 스크롤 방지 (iOS Safari 포함)
  useEffect(() => {
    // 현재 스크롤 위치 저장
    const scrollY = window.scrollY
    
    // 모달이 열릴 때
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    
    // 모달이 닫힐 때 (cleanup)
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      
      // 스크롤 위치 복원
      window.scrollTo(0, scrollY)
    }
  }, [])
  
  // 현재 지출의 카테고리 ID 찾기
  const getCurrentCategoryId = () => {
    const category = categories.find(cat => cat.name === expense.category.name)
    return category?.id || ''
  }

  // 현재 지출자 ID 찾기 (expense 객체에서 실제 spent_by 필드 사용)
  const getCurrentSpentBy = () => {
    // expense 객체에 spent_by가 있다고 가정
    return (expense as any).spent_by || currentUserId
  }

  // 수정 폼 상태
  const [formData, setFormData] = useState({
    amount: expense.amount.toString(),
    memo: expense.memo || '',
    spent_at: expense.spent_at,
    category_id: getCurrentCategoryId(),
    spent_by: getCurrentSpentBy()
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData({
      amount: expense.amount.toString(),
      memo: expense.memo || '',
      spent_at: expense.spent_at,
      category_id: '',
      spent_by: ''
    })
  }

  const handleUpdate = async () => {
    if (!formData.amount || !formData.category_id) {
      alert('금액과 카테고리는 필수입니다.')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await (supabase as any)
        .from('expenses')
        .update({
          amount: parseInt(formData.amount),
          memo: formData.memo || null,
          spent_at: formData.spent_at,
          category_id: formData.category_id,
          spent_by: formData.spent_by
        })
        .eq('id', expense.id)

      if (error) {
        console.error('수정 오류:', error)
        alert('지출 수정에 실패했습니다.')
        return
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('수정 오류:', error)
      alert('지출 수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 지출을 삭제하시겠습니까?')) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) {
        console.error('삭제 오류:', error)
        alert('지출 삭제에 실패했습니다.')
        return
      }

      onDelete()
      onClose()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('지출 삭제에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {isEditing ? '지출 수정' : '지출 상세'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="min-w-[44px] min-h-[44px]">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-4">
          {isEditing ? (
            <>
              {/* 수정 폼 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">금액</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formData.amount ? parseInt(formData.amount.replace(/,/g, '')).toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '')
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({ ...formData, amount: value })
                      }
                    }}
                    placeholder="10,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">카테고리</label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">지출자</label>
                  <Select value={formData.spent_by} onValueChange={(value) => setFormData({ ...formData, spent_by: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="지출자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.display_name || '이름 없음'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">날짜</label>
                  <Input
                    type="date"
                    value={formData.spent_at}
                    onChange={(e) => setFormData({ ...formData, spent_at: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">메모</label>
                  <Textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="메모를 입력하세요 (선택사항)"
                    rows={3}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 상세 정보 */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">카테고리</span>
                  <span className="font-medium">{expense.category.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">금액</span>
                  <span className="font-semibold text-lg">{expense.amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">지출자</span>
                  <span className="font-medium">{expense.spent_by_user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">날짜</span>
                  <span className="font-medium">{expense.spent_at}</span>
                </div>
                {expense.memo && (
                  <div>
                    <span className="text-gray-600 block mb-1">메모</span>
                    <p className="bg-gray-50 p-2 rounded text-sm">{expense.memo}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 버튼 */}
        <div className="p-4 border-t">
          {isEditing ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={isLoading}
                className="flex-1 min-w-[80px]"
              >
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                닫기
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                수정
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isLoading ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}