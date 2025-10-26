'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  workspaceId: string
  workspaceName: string
}

export default function JoinWorkspace({ workspaceId, workspaceName }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('로그인이 필요합니다')

      // workspace_members에 추가
      const { error: joinError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
        } as any)

      if (joinError) throw joinError

      router.push('/main')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '참여에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light to-white p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">💰</h1>
          <h2 className="text-3xl font-bold">위머니</h2>
        </div>

        {/* 초대 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>가계부 초대</CardTitle>
            <CardDescription>
              <span className="font-semibold">{workspaceName}</span>에 초대되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              참여하면 함께 가계부를 관리할 수 있어요
            </p>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleJoin}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? '참여 중...' : '참여하기'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
