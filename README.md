# HI-DORRI

HI-DORRI는 XRPL 기반 밋업 신뢰 정산 MVP입니다.

현재 브랜치(`feature/backend`)는 백엔드 개발용 브랜치입니다. 프론트엔드 구현 코드는 제거했고, Next.js가 실행될 수 있는 최소 placeholder만 남겨두었습니다. 실제 프론트엔드 화면 구현은 프론트 담당 브랜치에서 진행합니다.

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
|   +-- api
|   |   +-- NestJS backend
|   +-- web
|       +-- Minimal Next.js shell only
+-- docs
|   +-- api-spec.md
|   +-- db-guide.md
+-- prisma
|   +-- schema.prisma
|   +-- migrations
+-- docker-compose.yml
+-- package.json
+-- .env.example
```

## 현재 상태

### Frontend

프론트엔드는 골격만 유지합니다.

현재 남아 있는 파일:

```text
apps/web/src/app/page.tsx
apps/web/src/app/signup/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/app/globals.css
```

현재 화면은 placeholder입니다. 기존 signup UI 구현은 백엔드 브랜치에서 제거했습니다.

### Backend

백엔드는 NestJS 기반입니다.

현재 구현된 것:

```text
GET /api/health
GET /api/xrpl/status
```

현재 있는 주요 모듈:

```text
apps/api/src/prisma
apps/api/src/xrpl
```

아직 구현해야 하는 주요 기능:

```text
auth
users
wallets
dorri
meetups
applications
reviews
settlements
organizer
```

### DB

Prisma schema와 migration이 준비되어 있습니다.

주요 문서:

```text
docs/api-spec.md
docs/db-guide.md
```

DB 구조는 선택지 B 기준입니다.

```text
신청 시 escrow 생성
-> escrow destination = platform settlement wallet
-> 거절/출석/노쇼/평가 완료 시 EscrowFinish
-> platform settlement wallet 수령
-> SettlementLine 기준으로 환불/주최자 지급/플랫폼 수수료 Payment 실행
```

## 로컬 실행

의존성 설치:

```bash
npm install
```

환경 변수 생성:

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
npx prisma migrate dev
```

백엔드 실행:

```bash
npm run dev:api
```

프론트 placeholder 실행:

```bash
npm run dev:web
```

로컬 URL:

```text
Backend:  http://localhost:4000/api
Frontend: http://localhost:3000
```

## 자주 쓰는 명령어

```bash
npm run typecheck
npm run typecheck --workspace @hi-dorri/api
npm run typecheck --workspace @hi-dorri/web
npm run build --workspace @hi-dorri/api
npm run prisma:generate
npm run prisma:studio
```

## 문서

API 명세:

```text
docs/api-spec.md
```

DB 구조 설명:

```text
docs/db-guide.md
```

## Git 규칙

커밋 메시지는 아래 형식을 권장합니다.

```text
type: short description
```

예시:

```text
feat: implement wallet creation api
fix: resolve escrow settlement status
docs: update api spec
chore: setup backend schema and docs
```

권장 type:

```text
feat      기능 추가
fix       버그 수정
docs      문서 수정
refactor  동작 변경 없는 구조 개선
style     포맷팅, CSS 등 스타일 수정
chore     설정, 패키지, 빌드 작업
```

PR 설명에는 최소한 아래 내용을 적습니다.

```text
## 작업 내용
- 무엇을 변경했는지

## 확인한 것
- 실행한 명령어 또는 테스트

## 참고
- 아직 남은 작업이나 주의할 점
```

## 주의사항

- `.env`는 GitHub에 올리지 않습니다.
- `*.tsbuildinfo`는 TypeScript 빌드 캐시이므로 Git에서 제외합니다.
- 프론트 구현물은 이 브랜치에 추가하지 않습니다.
- Prisma schema를 바꾸면 migration도 함께 생성해서 공유합니다.
