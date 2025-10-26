import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinWorkspace from './join-workspace'

type Props = {
  params: Promise<{
    code: string
  }>
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()

  console.log('Invite code:', code)

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('User:', user?.id)

  if (!user) {
    // 로그인 안 되어 있으면 로그인 페이지로
    redirect(`/login?redirect=/invite/${code}`)
  }

  // 초대 코드로 workspace 찾기
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('invite_code', code)
    .limit(1) as { data: { id: string; name: string }[] | null; error: any }

  console.log('Workspaces:', workspaces)
  console.log('Error:', error)

  const workspace = workspaces?.[0]

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold">유효하지 않은 초대 링크</h1>
          <p className="text-gray-600">
            초대 링크가 잘못되었거나 만료되었습니다.
          </p>
        </div>
      </div>
    )
  }

  // 이미 해당 workspace 멤버인지 확인
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // 이미 멤버면 메인으로
    redirect('/main')
  }

  return <JoinWorkspace workspaceId={workspace.id} workspaceName={workspace.name} />
}
