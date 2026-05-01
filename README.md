# HI-DORRI

HI-DORRI는 XRPL 기반 밋업 신뢰 정산 MVP입니다.

현재 레포는 팀 개발을 시작하기 위한 초기 세팅 상태입니다. 프론트엔드는 온보딩/회원가입 화면만 구현되어 있고, 백엔드는 NestJS 기본 구조와 Prisma, XRPL helper까지만 연결되어 있습니다. DB는 Prisma schema만 작성되어 있으며 실제 PostgreSQL migration은 아직 적용되지 않았습니다.

## 기술 스택

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- DB: PostgreSQL + Prisma
- Blockchain: xrpl.js
- Package manager: npm workspaces

## 폴더 구조

```text
.
+-- apps
|   +-- web
|   |   +-- Next.js 프론트엔드
|   +-- api
|       +-- NestJS 백엔드
+-- prisma
|   +-- Prisma DB schema
+-- docker-compose.yml
|   +-- 로컬 PostgreSQL 설정
+-- package.json
|   +-- 루트 workspace scripts
+-- .env
|   +-- 로컬 환경 변수
+-- .env.example
    +-- 환경 변수 예시
```

## 현재 프론트엔드 상태

프론트엔드 코드는 아래 폴더에 있습니다.

```text
apps/web
```

현재 구현된 화면:

- `/signup`
  - 런치 화면
  - 이메일 회원가입 화면
  - 이메일 인증 화면
  - 지갑 생성 진행 화면
  - 지갑 생성 완료 화면

- `/`
  - `SignupPage`를 그대로 렌더링합니다.

주요 파일:

```text
apps/web/src/app/signup/page.tsx
apps/web/src/app/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/app/globals.css
```

아직 구현되지 않은 화면:

- 참여자 홈
- DORRI 충전 화면
- 밋업 신청 화면
- 주최자 체크인/정산 콘솔
- 실제 API 연동

현재 `/signup` 플로우는 프론트엔드 프로토타입입니다. 아직 이메일 인증, XRPL 지갑 생성, DORRI TrustLine 생성 API와 연결되어 있지 않습니다.

## 현재 백엔드 상태

백엔드 코드는 아래 폴더에 있습니다.

```text
apps/api
```

현재 구현된 것:

- NestJS 앱 기본 부트스트랩
- API prefix: `/api`
- 로컬 프론트엔드용 CORS 설정
- Prisma module/service
- XRPL module/service
- 기본 XRPL transaction builder helper

현재 사용 가능한 API:

```text
GET /api/health
GET /api/xrpl/status
```

주요 파일:

```text
apps/api/src/main.ts
apps/api/src/app.module.ts
apps/api/src/app.controller.ts
apps/api/src/prisma/prisma.module.ts
apps/api/src/prisma/prisma.service.ts
apps/api/src/xrpl/xrpl.module.ts
apps/api/src/xrpl/xrpl.service.ts
apps/api/src/xrpl/transactions.ts
```

현재 XRPL helper 상태:

- XRPL Testnet client 연결
- Testnet funded wallet 생성 helper
- 일반 wallet 생성 helper
- XRPL server info 조회
- DORRI TrustLine transaction builder
- DORRI Payment transaction builder
- XRP EscrowCreate transaction builder

아직 구현되지 않은 백엔드 기능:

- Auth module
- 이메일 회원가입 API
- 이메일 인증 API
- User 저장 플로우
- 지갑 생성 API
- seed 암호화 저장 플로우
- TrustLine transaction submit 플로우
- DORRI 충전 API
- 밋업 신청 API
- EscrowCreate / EscrowFinish / EscrowCancel API

## 현재 DB 상태

현재 로컬 환경에서는 실제 DB가 아직 실행되지 않은 상태입니다.

작성된 것:

- Prisma schema 파일
- Prisma Client generation 테스트

아직 안 된 것:

- PostgreSQL 실행
- Prisma migration 적용
- 실제 DB 테이블 생성
- seed data 생성

Schema 파일:

```text
prisma/schema.prisma
```

현재 Prisma model:

- `User`
- `Meetup`
- `MeetupApplication`
- `WalletLedgerTx`
- `DorriCharge`

Prisma는 NestJS 백엔드와 PostgreSQL 사이에서 사용하는 TypeScript ORM입니다. `schema.prisma`는 DB 설계 원본이고, migration을 실행하면 이 schema를 기준으로 PostgreSQL 테이블이 생성됩니다.

## 로컬 실행 방법

의존성 설치:

```bash
npm install
```

환경 변수 파일 생성:

```bash
copy .env.example .env
```

PostgreSQL 실행:

```bash
docker compose up -d
```

Prisma Client 생성:

```bash
npm run prisma:generate
```

DB migration 적용:

```bash
npm run prisma:migrate
```

백엔드 실행:

```bash
npm run dev:api
```

프론트엔드 실행:

```bash
npm run dev:web
```

로컬 URL:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:4000/api
```

참고: 현재 작업 환경에서는 Docker CLI를 사용할 수 없어 PostgreSQL 실행과 Prisma migration은 아직 검증하지 못했습니다.

## 자주 쓰는 명령어

```bash
npm run typecheck
npm run typecheck --workspace @hi-dorri/web
npm run typecheck --workspace @hi-dorri/api
npm run build --workspace @hi-dorri/api
npm run prisma:generate
npm run prisma:studio
```

## 추천 작업 분배

- Frontend 1: `/signup` API 연동
- Frontend 2: 참여자 홈 화면
- Frontend 3: DORRI 충전 화면
- Frontend 4: 밋업 상세/신청 화면
- Frontend 5: 주최자 체크인/정산 콘솔
- Backend 1: Auth, 이메일 인증
- Backend 2: 지갑 생성, seed 암호화 저장
- Backend 3: DORRI TrustLine, 충전 플로우
- Backend 4: 밋업 신청, EscrowCreate 플로우
- Backend 5: 정산, transaction status polling

## MVP 범위

1. 참여자 회원가입
2. 이메일 인증
3. XRPL Testnet 지갑 생성
4. DORRI TrustLine 생성
5. 참여자 홈
6. DORRI 충전
7. 밋업 신청
8. Escrow 기반 정산

## PR / Commit 규칙

커밋 메시지는 아래 형식을 권장합니다.

```text
type: short description
```

예시:

```text
feat: add signup onboarding UI
fix: resolve api tsconfig rootDir warning
docs: update project status in README
refactor: move signup flow into signup route
chore: update dependencies
```

권장 type:

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `refactor`: 동작 변경 없는 구조 개선
- `style`: 포맷팅, CSS 등 스타일 수정
- `chore`: 설정, 패키지, 빌드 작업

PR 제목도 커밋 메시지와 비슷하게 짧게 작성합니다.

```text
feat: implement signup API integration
```

PR 설명에는 최소한 아래 내용을 적습니다.

```text
## 작업 내용
- 무엇을 구현했는지

## 확인한 것
- 실행한 명령어 또는 테스트

## 참고
- 아직 남은 작업이나 주의할 점
```
