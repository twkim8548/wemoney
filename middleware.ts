import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 로그인 안된 상태에서 보호된 페이지 접근 시 로그인으로
    if (!user && 
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/signup') &&
        !request.nextUrl.pathname.startsWith('/invite') &&
        request.nextUrl.pathname !== '/') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 로그인된 상태에서 auth 페이지 접근 시 메인으로
    if (user && (request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/main', request.url))
    }

    // 로그인 되었지만 onboarding이 아닌 페이지 접근 시, workspace 체크
    if (user && 
        !request.nextUrl.pathname.startsWith('/onboarding') &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/signup') &&
        request.nextUrl.pathname !== '/') {
        
        // workspace_members 체크
        const { data: member } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        // workspace 없으면 onboarding으로
        if (!member) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
    }

    // onboarding 페이지인데 이미 workspace 있으면 메인으로
    if (user && request.nextUrl.pathname.startsWith('/onboarding')) {
        const { data: member } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (member) {
            return NextResponse.redirect(new URL('/main', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files with extensions (images, manifest, sw.js)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}