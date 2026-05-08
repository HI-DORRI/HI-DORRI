# HI-DORRI

XRPL 기반 밋업 신청, DORRI TokenEscrow, 취소/노쇼/정산 MVP입니다.

이 브랜치는 백엔드 개발용입니다. 프론트엔드는 placeholder만 유지하며, 실제 화면 구현은 프론트 담당 브랜치에서 진행합니다.

## Stack

```text
Backend   NestJS + TypeScript
DB        PostgreSQL + Prisma
XRPL      xrpl.js
Frontend  Next.js placeholder
Package   npm workspaces
```

## Structure

```text
apps/api      NestJS API
apps/web      Next.js placeholder
docs          API/DB 문서
prisma        schema, migrations
```

주요 문서:

```text
docs/api-spec.md
docs/db-guide.md
```

## Local Setup

```bash
npm install
copy .env.example .env
docker compose up -d
npx prisma migrate deploy
npm run prisma:generate
```

API 실행:

```bash
npm run dev:api
```

URL:

```text
API     http://localhost:4000/api
Web     http://localhost:3000
DB      localhost:5432
```

Prisma Studio:

```bash
npm run prisma:studio
```

## Platform Wallet Setup

플랫폼 XRPL 지갑은 3개를 분리해서 사용합니다.

```text
DORRI_ISSUER  DORRI token issuer
SETTLEMENT    escrow destination, settlement sender
FEE           platform fee receiver
```

초기 testnet 세팅:

```bash
npm run platform-wallets:init
npm run platform-wallets:trustlines
npm run dorri-issuer:configure
```

`dorri-issuer:configure`는 issuer의 `DefaultRipple`, `AllowTrustLineLocking`을 설정하고 기존 TrustLine의 issuer-side NoRipple을 정리합니다.

## Dev Data Reset

플랫폼 지갑은 유지하고 유저/밋업/신청/정산 데이터만 초기화합니다.

```bash
npm run reset:dev-data
```

보존:

```text
PlatformWallet
```

삭제:

```text
User, Wallet, DorriAccount, Meetup, Application, Escrow,
Review, Settlement, Charge, Reputation, Evaluation, Block
```

## Implemented API

Base URL:

```text
http://localhost:4000/api
```

Auth:

```text
POST /auth/signup
POST /auth/verify-email
POST /auth/login
```

Users / Wallets:

```text
GET  /users/me
POST /wallets/create
GET  /wallets/me
```

DORRI:

```text
POST /dorri/trustline
GET  /dorri/balance
POST /dorri/charge/quote
POST /dorri/charge
```

Home / Meetups:

```text
GET  /home
GET  /meetups
GET  /meetups/:id
POST /meetups
```

Applications:

```text
POST /meetups/:id/apply
GET  /applications/me
GET  /applications/:id
POST /applications/:id/cancel
POST /applications/:id/review
POST /applications/:id/settle
GET  /applications/:id/settlement
```

Organizer:

```text
GET  /organizer/meetups
GET  /organizer/meetups/:id/applications
POST /organizer/applications/:id/approve
POST /organizer/applications/:id/reject
POST /organizer/applications/:id/check-in
POST /organizer/applications/:id/no-show
POST /organizer/applications/:id/evaluate
```

## Settlement Summary

신청 시 참가자 지갑에서 platform settlement wallet을 destination으로 DORRI TokenEscrow를 생성합니다.

```text
Apply
-> DORRI TokenEscrow
-> approve/reject/cancel/check-in/no-show/review
-> EscrowFinish
-> settlement wallet receives DORRI
-> participant refund / host payout / platform fee Payment
```

무료 밋업:

```text
depositDorri = 20
attend        participant 20, host 0,  platform 0, rating +0.1
cancel 48h+   participant 20, host 0,  platform 0, rating 0
cancel 24-48  participant 18, host 2,  platform 0, rating -0.1
cancel <24    participant 14, host 6,  platform 0, rating -0.3
no-show       participant 10, host 10, platform 0, rating -0.5
```

유료 밋업:

```text
entryFeeDorri = organizer setting
attend        participant 0%,  host 90%, platform 10%, rating +0.1
cancel 48h+   participant 90%, host 0%,  platform 10%, rating 0
cancel 24-48  participant 70%, host 20%, platform 10%, rating -0.1
cancel <24    participant 50%, host 40%, platform 10%, rating -0.3
no-show       participant 0%,  host 90%, platform 10%, rating -0.5
```

유저 초기 평점은 `3.00`입니다.

## Useful Commands

```bash
npm run build --workspace @hi-dorri/api
npm run prisma:generate
npm run prisma:studio
npm run seed:dev
npm run reset:dev-data
```

## Notes

- `.env`는 커밋하지 않습니다.
- Prisma schema 변경 시 migration도 함께 커밋합니다.
- 유저/주최자 지갑은 DORRI를 받기 전에 `/dorri/trustline`이 필요합니다.
- XRPL testnet 원장 데이터는 DB reset으로 삭제되지 않습니다.
