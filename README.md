# HI-DORRI

XRPL 기반 DORRI 토큰, 밋업 신청/정산, 프론트 웹앱을 함께 관리하는 모노레포입니다.

## 핸드폰에서 프론트 확인하기

컴퓨터와 핸드폰이 같은 Wi-Fi에 연결되어 있어야 합니다.

1. 컴퓨터의 로컬 IP를 확인합니다.

```bash
ipconfig
```

`IPv4 Address` 값을 확인합니다. 예: `172.30.1.38`

2. 프론트 개발 서버를 외부 접속 가능하게 실행합니다.

```bash
cd apps/web
npm run dev -- --hostname 0.0.0.0
```

3. 핸드폰 브라우저에서 접속합니다.

```text
http://컴퓨터IPv4주소:3000
```

예:

```text
http://172.30.1.38:3000
```

핸드폰에서 버튼 클릭이 안 되거나 터미널에 `Blocked cross-origin request`가 뜨면, [apps/web/next.config.ts](apps/web/next.config.ts)의 `allowedDevOrigins`에 현재 컴퓨터 IP를 추가한 뒤 개발 서버를 재시작하세요.

## 프로젝트 구조

```text
apps/api      NestJS 백엔드 API
apps/web      Next.js 프론트 웹앱
docs          API/DB 문서
prisma        Prisma schema, migrations
```

## 기술 스택

```text
Frontend  Next.js + React + Tailwind CSS
Backend   NestJS + TypeScript
DB        PostgreSQL + Prisma
XRPL      xrpl.js
Package   npm workspaces
```

## 로컬 실행

처음 한 번만 설치합니다.

```bash
npm install
copy .env.example .env
```

DB를 실행하고 Prisma를 준비합니다.

```bash
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
```

프론트 실행:

```bash
npm run dev:web
```

백엔드 실행:

```bash
npm run dev:api
```

기본 URL:

```text
Web  http://localhost:3000
API  http://localhost:4000/api
DB   localhost:5432
```

## 주요 명령어

```bash
npm run typecheck
npm run lint
npm run build
npm run prisma:studio
npm run seed:dev
npm run reset:dev-data
```

워크스페이스별 실행:

```bash
npm run typecheck --workspace @hi-dorri/web
npm run typecheck --workspace @hi-dorri/api
npm run build --workspace @hi-dorri/web
npm run build --workspace @hi-dorri/api
```

## 현재 프론트 진행 상황

구현됨:

- `/home`: 홈 화면
- `/wallet/add-funds`: DORRI 충전 플로우 목업
- 모바일/데스크톱 반응형 레이아웃

아직 미연결:

- 실제 로그인 세션/access token
- 백엔드 API 연동
- 실제 결제/충전 처리

## 현재 백엔드 진행 상황

주요 API는 `http://localhost:4000/api` 기준입니다.

```text
Auth        /auth/signup, /auth/login, /auth/verify-email
Users       /users/me
Wallets     /wallets/create, /wallets/me
DORRI       /dorri/trustline, /dorri/balance, /dorri/charge/*
Home        /home
Meetups     /meetups
Apply       /meetups/:id/apply, /applications/*
Organizer   /organizer/*
```

자세한 API/DB 문서는 아래 파일을 참고하세요.

```text
docs/api-spec.md
docs/db-guide.md
```

## XRPL 개발용 지갑

플랫폼 지갑은 역할별로 분리되어 있습니다.

```text
DORRI_ISSUER  DORRI token issuer
SETTLEMENT    escrow destination / settlement sender
FEE           platform fee receiver
```

초기 testnet 설정:

```bash
npm run platform-wallets:init
npm run platform-wallets:trustlines
npm run dorri-issuer:configure
```

## 주의사항

- `.env`는 커밋하지 않습니다.
- 프론트는 현재 디자인/목업 중심이며 API 연결은 이후 작업입니다.
- Prisma schema 변경 시 migration도 함께 관리합니다.
- 핸드폰 테스트 시 컴퓨터와 핸드폰은 같은 네트워크에 있어야 합니다.
