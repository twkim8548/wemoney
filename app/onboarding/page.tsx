'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'

export default function OnboardingPage() {
    const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
    const [inviteCode, setInviteCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleCreateWorkspace = async () => {
        setLoading(true)
        setError('')

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error('로그인이 필요합니다')

            const { error: workspaceError } = await supabase.rpc(
                'create_workspace_with_defaults',
                { user_id: user.id } as any
            )

            if (workspaceError) throw workspaceError

            router.push('/main')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : '생성에 실패했습니다')
            setLoading(false)
        }
    }

    const handleJoinWorkspace = async () => {
        if (!inviteCode.trim()) {
            setError('초대 코드를 입력해주세요')
            return
        }

        setLoading(true)
        setError('')

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error('로그인이 필요합니다')

            console.log('Searching for invite code:', inviteCode.trim())

            const { data: workspace, error: fetchError } = await supabase
                .from('workspaces')
                .select('id')
                .eq('invite_code', inviteCode.trim())
                .maybeSingle() as { data: { id: string } | null; error: any }

            console.log('Workspace found:', workspace)
            console.log('Error:', fetchError)

            if (!workspace) {
                setError('유효하지 않은 초대 코드입니다')
                setLoading(false)
                return
            }

            const { error: joinError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: user.id,
                } as any)

            if (joinError) throw joinError

            router.push('/main')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : '참여에 실패했습니다')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light to-white p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-primary">💰</h1>
                    <h2 className="text-3xl font-bold">위머니</h2>
                    <p className="text-gray-600 text-sm">우리의 가계부</p>
                </div>

                {mode === 'select' && (
                    <div className="space-y-3">
                        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setMode('create')}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-primary-light rounded-full flex items-center justify-center">
                                        <Plus className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">새로 만들기</CardTitle>
                                        <CardDescription>새 가계부를 시작해요</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setMode('join')}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">초대받았어요</CardTitle>
                                        <CardDescription>초대 코드로 참여해요</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>
                )}

                {mode === 'create' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>새 가계부 만들기</CardTitle>
                            <CardDescription>나중에 상대방을 초대할 수 있어요</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setMode('select')} disabled={loading} className="flex-1">뒤로</Button>
                                <Button onClick={handleCreateWorkspace} disabled={loading} className="flex-1">{loading ? '생성 중...' : '만들기'}</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {mode === 'join' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>초대 코드 입력</CardTitle>
                            <CardDescription>상대방에게 받은 초대 코드를 입력하세요</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="inviteCode">초대 코드</Label>
                                <Input id="inviteCode" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="8d04c0d7" className="font-mono" />
                            </div>
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setMode('select')} disabled={loading} className="flex-1">뒤로</Button>
                                <Button onClick={handleJoinWorkspace} disabled={loading} className="flex-1">{loading ? '참여 중...' : '참여하기'}</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}