# 💰 위머니 (WeMoney)

커플을 위한 공동 가계부 웹 애플리케이션

## 📱 주요 기능

### 인증 및 워크스페이스
- 이메일 기반 회원가입/로그인
- 워크스페이스 생성 및 초대 코드 공유
- 초대 링크를 통한 간편한 멤버 추가

### 지출 관리
- 지출 내역 추가/수정/삭제
- 카테고리별 분류 (이모지 지원)
- 커스텀 카테고리 생성 및 관리
- 날짜별 지출 내역 조회
- 메모 기능으로 상세 정보 기록

### 통계 및 분석
- 월별 지출 내역 조회
- 카테고리별 지출 분석 (파이 차트)
- 사용자별 지출 분석
- 상세 필터링 기능 (카테고리/사용자별)

### 사용자 경험
- 모바일 최적화 (iOS Safari 호환)
- 반응형 디자인
- 직관적인 터치 인터랙션
- 사용자 이름 커스터마이징

## 🛠 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Charts**: Recharts
- **Deployment**: Vercel

## 🚀 시작하기

### 사전 요구사항

- Node.js 18.17 이상
- Supabase 계정

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 데이터베이스 설정

Supabase 프로젝트를 생성한 후, SQL Editor에서 다음 스키마를 실행하세요:

<details>
<summary>데이터베이스 스키마 보기</summary>

```sql
-- 워크스페이스 테이블
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '우리의 가계부',
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 워크스페이스 멤버 테이블
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 카테고리 테이블
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지출 테이블
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  memo TEXT,
  spent_at DATE NOT NULL,
  spent_by UUID NOT NULL REFERENCES auth.users(id),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- workspaces 정책
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- workspace_members 정책
CREATE POLICY "Users can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join workspaces"
  ON workspace_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their display name"
  ON workspace_members FOR UPDATE
  USING (user_id = auth.uid());

-- categories 정책
CREATE POLICY "Users can view workspace categories"
  ON categories FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create categories"
  ON categories FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories"
  ON categories FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- expenses 정책
CREATE POLICY "Users can view workspace expenses"
  ON expenses FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses"
  ON expenses FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses"
  ON expenses FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 헬퍼 함수: 워크스페이스 생성 시 기본 카테고리 생성
CREATE OR REPLACE FUNCTION create_workspace_with_defaults(user_id UUID)
RETURNS VOID AS $$
DECLARE
  new_workspace_id UUID;
  invite_code TEXT;
BEGIN
  -- 고유한 초대 코드 생성
  invite_code := substr(md5(random()::text), 1, 8);

  -- 워크스페이스 생성
  INSERT INTO workspaces (name, invite_code, created_by)
  VALUES ('우리의 가계부', invite_code, user_id)
  RETURNING id INTO new_workspace_id;

  -- 생성자를 멤버로 추가
  INSERT INTO workspace_members (workspace_id, user_id)
  VALUES (new_workspace_id, user_id);

  -- 기본 카테고리 생성
  INSERT INTO categories (workspace_id, name, emoji, is_default, created_by)
  VALUES
    (new_workspace_id, '식비', '🍚', true, user_id),
    (new_workspace_id, '술/유흥', '🍺', true, user_id),
    (new_workspace_id, '카페/간식', '☕', true, user_id),
    (new_workspace_id, '생활/마트', '🛒', true, user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

</details>

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 Vercel 배포

### 1. GitHub 레포지토리 연결

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 레포지토리 `twkim8548/wemoney` 선택
4. "Import" 클릭

### 2. 환경 변수 설정

Vercel 프로젝트 설정에서 다음 환경 변수를 추가하세요:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon 키

### 3. 배포

- "Deploy" 버튼 클릭
- 자동으로 빌드 및 배포가 진행됩니다

### 4. Supabase 설정 업데이트

Supabase Dashboard에서:
1. Authentication → URL Configuration
2. Site URL에 Vercel 배포 URL 추가 (예: `https://wemoney.vercel.app`)
3. Redirect URLs에 `https://wemoney.vercel.app/**` 추가

## 🎨 디자인

- Primary 색상: Teal (#4AA3BC)
- 모바일 우선 반응형 디자인
- shadcn/ui 컴포넌트 라이브러리 활용

## 📄 라이선스

MIT

## 👨‍💻 개발자

- GitHub: [@twkim8548](https://github.com/twkim8548)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
