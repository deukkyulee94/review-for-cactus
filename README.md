# 공연 코멘트 (Next.js + Supabase)

공연 관람 **전·후**에 출연 배우에게 코멘트를 남기고, 같은 공연을 본 다른 사람의 메시지를 함께 볼 수 있는 웹 애플리케이션입니다.

- **방문자**: 홈에서 공연 목록 확인 → 공연 상세(`/show/[slug]`)에서 배우 목록 확인 → 배우 선택 후 코멘트 작성·열람  
- **어드민**: 비밀번호(`ADMIN_SECRET`)로 로그인 후 공연·배우·이미지를 등록

---

## 기술 스택

| 구분 | 사용 |
|------|------|
| 프레임워크 | [Next.js 16](https://nextjs.org/) (App Router) |
| 스타일 | [Tailwind CSS 4](https://tailwindcss.com/) |
| DB·스토리지 | [Supabase](https://supabase.com/) (PostgreSQL + Storage) |
| 서버 연동 | `@supabase/supabase-js`, `@supabase/ssr` |

---

## 프로젝트 구조

```
review-for-cactus/
├── README.md                 # 이 문서
├── .env.local.example        # 환경 변수 예시 (복사 후 .env.local 로 사용)
├── next.config.ts            # Next 설정 (Supabase 이미지 도메인 허용)
├── supabase/
│   ├── schema.sql            # DB 테이블·RLS·Storage 버킷 정의 (신규 프로젝트용)
│   └── migrations/
│       ├── add_actor_role_name.sql           # 기존 DB에 배역 컬럼 추가
│       └── drop_comments_author_nickname.sql # 코멘트 닉네임 컬럼 제거
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 루트 레이아웃·메타데이터
│   │   ├── (main)/           # 방문자 영역
│   │   │   ├── layout.tsx    # SiteHeader 포함
│   │   │   ├── page.tsx      # 홈: 공연 목록
│   │   │   └── show/
│   │   │       └── [slug]/
│   │   │           ├── page.tsx              # 공연 상세 + 배우 그리드
│   │   │           ├── not-found.tsx
│   │   │           └── actor/[actorId]/page.tsx  # 배우 코멘트 페이지
│   │   ├── admin/            # 어드민 영역
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── (protected)/  # 로그인 후만 접근 (layout에서 쿠키 검증)
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx      # /admin → /admin/shows 리다이렉트
│   │   │       └── shows/
│   │   │           ├── page.tsx    # 등록 공연 목록
│   │   │           └── new/page.tsx # 공연·배우 등록 폼
│   │   └── actions/
│   │       ├── admin.ts      # 로그인·공연 등록 Server Actions
│   │       └── comments.ts   # 코멘트 작성 Server Action
│   ├── components/
│   │   ├── admin/            # 어드민 UI (헤더, 등록 폼)
│   │   └── public/           # 방문자 UI (헤더, 코멘트 폼)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts     # 브라우저용 Supabase (anon 키)
│   │   │   ├── server.ts     # 서버용 Supabase (anon 키 + 쿠키)
│   │   │   └── admin.ts      # Service Role (서버 전용, RLS 우회)
│   │   ├── admin-session.ts  # 어드민 세션 쿠키
│   │   └── sha256-hex.ts     # 세션 토큰용 해시 (Edge/Node 공통)
│   └── types/
│       └── database.ts       # 테이블 row 타입
```

---

## Next.js + Supabase 연동 요약 (예시 코드 위치)

입문용으로 **역할별로 파일을 나눠** 두었습니다.

1. **브라우저에서 읽기·쓰기 (anon 키)**  
   - `src/lib/supabase/client.ts` — `createBrowserClient`  
   - 코멘트 작성은 서버 액션에서 `server.ts`의 클라이언트로 insert 합니다 (`src/app/actions/comments.ts`).

2. **서버 컴포넌트에서 데이터 조회 (anon 키)**  
   - `src/lib/supabase/server.ts` — `createServerClient` + `cookies()`  
   - 예: `src/app/(main)/page.tsx` 에서 `performances` 목록 조회.

3. **어드민 전용 쓰기 (Service Role)**  
   - `src/lib/supabase/admin.ts` — **서버에서만** 사용. 키를 클라이언트에 넣지 마세요.  
   - 예: `src/app/actions/admin.ts` 에서 공연·배우 insert, Storage 업로드.

4. **파일 업로드 (Storage)**  
   - 버킷: `posters`, `actor-photos` (`supabase/schema.sql` 참고)  
   - 업로드는 Service Role 클라이언트로만 수행하는 예시입니다.

---

## 사전 준비

- [Node.js](https://nodejs.org/) 20 이상 권장  
- [Supabase](https://supabase.com/) 프로젝트 하나 (무료 티어 가능)

---

## 실행 프로세스 (처음부터)

### 1) Supabase 프로젝트 생성

1. Supabase 대시보드에서 새 프로젝트를 만듭니다.

### 2) Supabase에서 복사한 값을 `.env.local`에 붙여넣기

**“복사해서 어떻게 하라는 거야?”**에 대한 답은 다음과 같습니다.

1. 프로젝트 루트에서 예시 파일을 복사해 `.env.local` 파일을 만듭니다.  
   ```bash
   cp .env.local.example .env.local
   ```
2. Supabase 웹 콘솔에서 **Project Settings**(톱니바퀴) → **Data API** 또는 **API** 메뉴로 들어갑니다.  
3. 화면에 보이는 값을 **각각 복사**한 뒤, VS Code 등으로 **`.env.local`을 열고** 아래처럼 **왼쪽 이름 뒤에 붙여넣기**만 하면 됩니다.  
   - 화면의 **Project URL** (예: `https://abcdefgh.supabase.co`) 한 덩어리를 복사 → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL=` **오른쪽**에 붙여넣기  
   - **anon** / **public** 라고 적힌 긴 키(`eyJ...`로 시작)를 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY=` 오른쪽에 붙여넣기  
   - **service_role** 키(역시 `eyJ...` 형태, **Reveal**을 눌러 표시)를 복사 → `SUPABASE_SERVICE_ROLE_KEY=` 오른쪽에 붙여넣기  
     - 이 키는 **깃허브·스크린샷·브라우저에 노출하면 안 됩니다.** 오직 `.env.local`과 배포 서버 설정에만 둡니다.

**붙여넣은 뒤 형태 예시** (값은 본인 프로젝트 것으로 바꿉니다):

```env
NEXT_PUBLIC_SUPABASE_URL=https://여기에-Project-URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.여기에-anon-키-전체
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.여기에-service_role-키-전체
ADMIN_SECRET=본인이-정한-어드민-비밀번호-긴-문자열
```

- 따옴표(`"`)는 보통 **붙이지 않습니다.**  
- `=` 앞뒤에 **공백을 넣지 않는 것**이 안전합니다.  
- `ADMIN_SECRET`은 Supabase에 있는 값이 아니라, **본인이 임의로 정하는** 어드민 로그인용 비밀번호입니다.

### 3) 데이터베이스·스토리지 스키마 적용

1. Supabase 대시보드 → **SQL Editor**  
2. **처음 세팅**: `supabase/schema.sql` 전체를 붙여넣고 **Run** 합니다.  
3. **이미 예전 schema 로 DB 를 만든 경우** (해당할 때만 SQL Editor 에서 실행):  
   - 배역 컬럼: `supabase/migrations/add_actor_role_name.sql`  
   - 코멘트 닉네임 제거: `supabase/migrations/drop_comments_author_nickname.sql`  
4. **Table Editor** 에 `performances`, `actors`, `comments` 테이블이 생겼는지 확인합니다. (`actors` 에 `role_name` 열이 있어야 배역 등록이 됩니다.)  
5. **Storage** 에 `posters`, `actor-photos` 버킷이 생겼는지 확인합니다.

### 4) 의존성 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

### 5) 동작 확인 순서

1. **어드민**  
   - [http://localhost:3000/admin/login](http://localhost:3000/admin/login)  
   - `ADMIN_SECRET` 입력 후 로그인  
   - **공연 등록**에서 슬러그·제목·기간·설명·포스터·배우(이름·한마디·사진) 입력 후 저장  

2. **방문자**  
   - 홈(`/`)에서 공연 카드 클릭 → `/show/슬러그`  
   - 배우 카드 클릭 → `/show/슬러그/actor/배우UUID`  
   - 코멘트 작성 후 목록에 표시되는지 확인  

공개 URL 예시:

- 공연: `https://your-domain.com/show/my-show-slug`  
- 배우: `https://your-domain.com/show/my-show-slug/actor/<actor-id>`  
  (`actor-id` 는 Supabase `actors` 테이블의 `id` 입니다. 어드민 목록의 공개 페이지에서 들어가면 확인 가능합니다.)

### 6) 프로덕션 빌드

```bash
npm run build
npm start
```

배포 시(Vercel 등)에도 동일한 환경 변수를 프로젝트 설정에 등록해야 합니다.

---

## 보안·운영 참고

- **`SUPABASE_SERVICE_ROLE_KEY`** 는 서버 환경 변수로만 두고, Git·클라이언트 번들에 포함되지 않게 하세요.  
- **`ADMIN_SECRET`** 은 단순 공유 비밀번호 예시입니다. 운영 환경에서는 Supabase Auth + 역할(Role) 기반 관리로 바꾸는 것을 권장합니다.  
- 코멘트는 누구나 작성할 수 있도록 RLS 예시를 두었습니다. 스팸 방지가 필요하면 Rate limiting, Captcha, 로그인 요구 등을 추가하세요.

---

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |

---

## 요구사항 대응 체크리스트

| 요구사항 | 구현 |
|----------|------|
| 어드민에서 공연 등록 (포스터, 제목, 기간, 설명, 배우 N명) | `/admin/shows/new`, `createPerformanceWithActors` |
| 배우 등록 (이름, 사진, 한마디) | 동일 폼에서 행 추가 |
| 공연 URL을 path variable(slug)로 접근 | `/show/[slug]` |
| 공연 페이지에 배우 이름·프로필 출력 | `show/[slug]/page.tsx` |
| 배우 클릭 시 코멘트 페이지, 타인 코멘트 표시 | `show/[slug]/actor/[actorId]/page.tsx` |

---

## 문제 해결

- **이미지가 안 보임**: `next.config.ts` 의 `images.remotePatterns` 와 Supabase Storage **공개 버킷** 설정을 확인하세요.  
- **공연 목록 에러**: `.env.local` 의 URL·anon 키, `schema.sql` 실행 여부를 확인하세요.  
- **어드민 로그인 후에도 이동 안 함 / 다시 로그인으로 튕김**: 로그인은 **`POST /api/admin/login`** (일반 폼 제출)로 처리해, `302` 응답과 `Set-Cookie` 가 브라우저에 확실히 전달되게 했습니다. `.env.local` 의 `ADMIN_SECRET` 을 수정했다면 **개발 서버를 완전히 종료한 뒤 `npm run dev` 로 다시 실행**해야 합니다(Next는 시작 시에만 env 를 읽는 경우가 많습니다). 값 앞뒤 따옴표·공백·줄바꿈도 제거하세요.  
- **공연 등록 시 `An unexpected response was received from the server`**: 이미지가 크면 Server Action 기본 용량(1MB)을 넘깁니다. `next.config.ts` 의 `experimental.serverActions.bodySizeLimit`(예: 25mb)을 확인하고, **개발 서버를 재시작**하세요.  
- **어드민 등록 실패**: `SUPABASE_SERVICE_ROLE_KEY` 오타, Storage 버킷 이름(`posters`, `actor-photos`) 일치 여부를 확인하세요.  
- **코멘트 저장 실패**: RLS 정책 `comments_insert_public` 이 적용되었는지, `performance_id`·`actor_id` 가 같은 공연에 속하는지 확인하세요.  
- **개발자 도구에 WebSocket 오류**: 이 프로젝트 코드에서 WebSocket 을 직접 쓰지는 않습니다. `npm run dev` 시 Next.js(Turbopack)가 **핫 리로드(HMR)** 용으로 브라우저와 WebSocket 을 붙이는데, 회사 프록시·VPN·방화벽 때문에 연결이 끊기면 콘솔에 에러가 보일 수 있습니다. 앱의 Supabase·로그인 기능과는 별개이며, `npm run build` 후 `npm start` 로 띄우면 해당 개발용 연결은 없어집니다.

---

이 프로젝트는 학습·프로토타입용 예시입니다. 상용 서비스로 가져갈 때는 인증, 입력 검증, 에러 처리, 백업 정책을 보강하세요.
