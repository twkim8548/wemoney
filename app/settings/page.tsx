'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Copy, Check, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [origin, setOrigin] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInviteCode()
    setOrigin(window.location.origin)
  }, [])

  const loadInviteCode = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id, display_name')
      .eq('user_id', user.id)
      .single() as { data: { workspace_id: string; display_name: string | null } | null }

    if (!member) return

    // 표시 이름 설정
    setDisplayName(member.display_name || '')

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('invite_code')
      .eq('id', member.workspace_id)
      .single() as { data: { invite_code: string } | null }

    if (workspace) {
      setInviteCode(workspace.invite_code)
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      alert('이름을 입력해주세요')
      return
    }

    setSavingName(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await (supabase as any)
      .from('workspace_members')
      .update({ display_name: displayName.trim() })
      .eq('user_id', user.id)

    setSavingName(false)

    if (error) {
      alert('이름 저장에 실패했습니다')
      return
    }

    setEditingName(false)
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
            <h1 className="text-xl font-bold">설정</h1>
          </div>
        </div>
      </header>

      {/* 내용 */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 내 이름 */}
        <Card>
          <CardHeader>
            <CardTitle>내 이름</CardTitle>
            <CardDescription>
              상대방에게 표시될 이름을 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>이름</Label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 홍길동"
                  disabled={!editingName}
                  maxLength={20}
                />
                {editingName ? (
                  <>
                    <Button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="flex-shrink-0"
                    >
                      {savingName ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingName(false)
                        loadInviteCode() // 원래 값으로 되돌리기
                      }}
                      variant="outline"
                      disabled={savingName}
                      className="flex-shrink-0"
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditingName(true)}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    수정
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 초대 링크 */}
        <Card>
          <CardHeader>
            <CardTitle>초대 링크</CardTitle>
            <CardDescription>
              이 링크를 공유하여 상대방을 초대하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>초대 코드</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono"
                />
                <Button
                  onClick={copyInviteLink}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      링크 복사
                    </>
                  )}
                </Button>
              </div>
            </div>
            {origin && (
              <p className="text-sm text-gray-500">
                {origin}/invite/{inviteCode}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 로그아웃 */}
        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? '로그아웃 중...' : '로그아웃'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
