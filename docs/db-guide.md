# HI-DORRI DB 구조 가이드

프론트엔드 팀원이 데이터 구조를 이해하기 위한 문서입니다. 실제 화면 개발은 `docs/api-spec.md`의 response shape를 기준으로 진행하고, 이 문서는 DB에 어떤 데이터가 어떤 의미로 저장되는지 파악하는 용도입니다.

Schema 원본:

```text
prisma/schema.prisma
```

## 전체 관계 요약

```text
User
+-- Wallet
+-- DorriAccount
+-- MeetupApplication
|   +-- Escrow
|   +-- Review
|   +-- Settlement
|       +-- SettlementLine
|   +-- UserReputationEvent
|   +-- OrganizerParticipantEvaluation
+-- Meetup (as organizer)
+-- DorriCharge
+-- LedgerTx
+-- UserBlock

Meetup
+-- MeetupTag
+-- MeetupApplication
+-- Review
+-- Settlement

PlatformWallet
+-- DORRI_ISSUER
+-- SETTLEMENT
+-- FEE
```

## User

가입한 유저입니다. 참여자/주최자 role은 따로 두지 않습니다. 어떤 유저든 밋업을 만들면 그 밋업의 주최자가 되고, 밋업에 신청하면 참가자가 됩니다.

주요 컬럼:

```text
id                String   cuid
email             String   unique
name              String
passwordHash      String
emailVerifiedAt   DateTime?
profileImageUrl   String?
reputationScore   Decimal  default 3
createdAt         DateTime
updatedAt         DateTime
```

관계:

```text
User 1:1 Wallet
User 1:1 DorriAccount
User 1:N MeetupApplication
User 1:N Meetup as organizer
User 1:N Review
User 1:N DorriCharge
User 1:N LedgerTx
User 1:N UserReputationEvent
User 1:N OrganizerParticipantEvaluation as organizer
User 1:N OrganizerParticipantEvaluation as participant
User 1:N UserBlock as blocker/blocked user
```

## EmailVerificationCode

이메일 인증 코드 저장용 테이블입니다.

주요 컬럼:

```text
id          String   cuid
email       String
codeHash    String
expiresAt   DateTime
consumedAt  DateTime?
createdAt   DateTime
```

의미:

```text
codeHash    인증 코드 원문이 아니라 hash 저장
expiresAt   코드 만료 시간
consumedAt  인증 완료 시각
```

## Wallet

유저의 XRPL 지갑 정보입니다.

주요 컬럼:

```text
id             String       cuid
userId         String       unique
xrplAddress    String       unique
encryptedSeed  String
network        XrplNetwork  TESTNET | MAINNET
fundingTxHash  String?
createdAt      DateTime
updatedAt      DateTime
```

의미:

```text
xrplAddress    유저의 XRPL 주소
encryptedSeed  암호화된 seed. 프론트에 내려주면 안 됨
fundingTxHash  Testnet faucet funding tx hash
```

## PlatformWallet

플랫폼이 운영하는 XRPL 지갑 정보입니다. 유저 지갑과 분리해서 관리합니다.

MVP에서는 아래 3개 지갑을 각각 따로 둡니다.

```text
DORRI_ISSUER  DORRI 토큰 발행 주소
SETTLEMENT    escrow destination 및 정산 지급 출금 지갑
FEE           플랫폼 수수료 최종 수령 지갑
```

주요 컬럼:

```text
id             String              cuid
kind           PlatformWalletKind  DORRI_ISSUER | SETTLEMENT | FEE
xrplAddress    String              unique
encryptedSeed  String?
network        XrplNetwork         TESTNET | MAINNET
fundingTxHash  String?
createdAt      DateTime
updatedAt      DateTime
```

의미:

```text
kind           플랫폼 지갑 역할. 역할별로 하나만 존재
xrplAddress    XRPL 주소
encryptedSeed  암호화된 seed. 프론트에 내려주면 안 됨
network        testnet/mainnet 구분
fundingTxHash  Testnet faucet funding tx hash
```

운영 원칙:

```text
DORRI_ISSUER는 issuer/cold 성격입니다. 운영 환경에서는 서버 DB에 seed를 저장하지 않는 것을 원칙으로 합니다.
SETTLEMENT는 escrow destination입니다. EscrowFinish 후 이 지갑에서 유저 환불/주최자 지급/수수료 지급 Payment를 보냅니다.
FEE는 플랫폼 수수료 보관 지갑입니다. 유료 밋업 수수료 SettlementLine의 recipientAddress로 사용합니다.
```

정산 Payment를 실행하려면 `SETTLEMENT`와 `FEE` 지갑도 DORRI issuer에 대한 TrustLine이 있어야 합니다.

```bash
npm run platform-wallets:trustlines
```

## DorriAccount

유저의 DORRI TrustLine 상태와 잔액 snapshot입니다.

주요 컬럼:

```text
id                String           cuid
userId            String           unique
currency          String           default "DORRI"
issuerAddress     String
trustLineLimit    Decimal
trustLineStatus   TrustLineStatus  PENDING | ACTIVE | FAILED
trustLineTxHash   String?
balanceSnapshot   Decimal
balanceCheckedAt  DateTime?
createdAt         DateTime
updatedAt         DateTime
```

의미:

```text
trustLineStatus   DORRI 수신 가능 여부
trustLineTxHash   TrustSet transaction hash
balanceSnapshot   마지막으로 조회한 DORRI 잔액
```

프론트에서는 주로 아래 값으로 사용합니다.

```text
dorri.balance
dorri.trustLineStatus
```

## Meetup

밋업 정보입니다.

주요 컬럼:

```text
id              String        cuid
organizerId     String
title           String
description     String
hostName        String?
imageUrl        String?
locationName    String
address         String
mapImageUrl     String?
startsAt        DateTime
endsAt          DateTime
type            MeetupType    FREE | PAID
depositDorri    Decimal
entryFeeDorri   Decimal
capacity        Int
status          MeetupStatus  DRAFT | PUBLISHED | CLOSED | SETTLED
createdAt       DateTime
updatedAt       DateTime
```

의미:

```text
organizerId     이 밋업을 만든 유저 id
type            무료/유료 밋업 구분
depositDorri    무료 밋업 노쇼 방지 보증금. MVP 기본값 20
entryFeeDorri   유료 밋업 참가비
capacity        정원
status          노출/마감/정산 상태
```

정책:

```text
FREE  밋업: depositDorri 사용, entryFeeDorri = 0
PAID  밋업: entryFeeDorri 사용, depositDorri = 0
```

## MeetupTag

밋업 태그입니다.

주요 컬럼:

```text
id        String
meetupId  String
name      String
```

예시:

```text
Web3
Networking
NFT
```

## MeetupApplication

유저가 밋업에 신청한 기록입니다.

주요 컬럼:

```text
id                 String             cuid
meetupId           String
userId             String
status             ApplicationStatus
lockedDorriAmount  Decimal
appliedAt          DateTime
approvedAt         DateTime?
rejectedAt         DateTime?
checkedInAt        DateTime?
noShowAt           DateTime?
reviewedAt         DateTime?
settledAt          DateTime?
canceledAt         DateTime?
createdAt          DateTime
updatedAt          DateTime
```

상태값:

```text
PENDING_APPROVAL   신청 완료, 주최자 수락 대기
APPROVED           주최자 수락 완료
REJECTED           주최자 거절
CHECKED_IN         QR 체크인 완료
REVIEWED           참가자 평가 제출 완료
NO_SHOW            노쇼 처리
SETTLED            정산 완료
CANCELED           신청 취소
```

의미:

```text
lockedDorriAmount  신청 시 잠긴 DORRI 금액
canceledAt          참가자가 직접 취소한 시각
```

제약:

```text
한 유저는 같은 밋업에 한 번만 신청 가능
unique(meetupId, userId)
```

## Escrow

XRPL escrow 생성/해제 정보를 저장합니다.

주요 컬럼:

```text
id                    String        cuid
applicationId         String        unique
status                EscrowStatus  CREATED | FINISHED | CANCELED | FAILED
ownerAddress          String
destinationAddress    String
offerSequence         Int
lockedDorriAmount     Decimal
amountDrops           String?
condition             String?
fulfillmentEncrypted  String?
createTxHash          String        unique
finishTxHash          String?       unique
cancelTxHash          String?       unique
explorerUrl           String?
finishAfter           DateTime?
cancelAfter           DateTime?
createdAt             DateTime
finishedAt            DateTime?
canceledAt            DateTime?
updatedAt             DateTime
```

의미:

```text
ownerAddress          EscrowCreate를 만든 참가자 XRPL 주소
destinationAddress    platform settlement wallet 주소
offerSequence         EscrowFinish에 필요한 XRPL OfferSequence
createTxHash          EscrowCreate tx hash
finishTxHash          EscrowFinish tx hash
lockedDorriAmount     화면/API에서 보여줄 DORRI lock 금액
amountDrops           XRP escrow fallback 사용 시 실제 drops 금액
```

MVP에서는 escrow destination을 platform settlement wallet으로 둡니다. EscrowFinish 후 정산 정책에 따라 DORRI Payment를 여러 번 실행합니다.

## Review

참가자가 밋업 후 제출하는 평가입니다.

주요 컬럼:

```text
id             String   cuid
applicationId  String   unique
meetupId       String
userId         String
rating         Int
tags           String[]
comment        String?
createdAt      DateTime
```

의미:

```text
rating   별점. MVP 기준 1~5
tags     선택 태그 목록
comment  상세 후기
```

제약:

```text
신청 1건당 리뷰 1개
unique(applicationId)
```

## UserReputationEvent

참가자 평점 변화 이력입니다. 신청 1건당 평점 이벤트는 최대 1개만 생성합니다.

주요 컬럼:

```text
id             String
userId         String
applicationId  String   unique
type           ReputationEventType
delta          Decimal
reason         String?
createdAt      DateTime
```

type:

```text
ATTENDANCE         출석 완료
CANCEL_48H_PLUS    48시간+ 전 취소
CANCEL_24_48       24-48시간 전 취소
CANCEL_WITHIN_24   24시간 내 취소
NO_SHOW            노쇼
```

정책:

```text
출석 완료       +0.1
48시간+ 전 취소  0
24-48시간 취소  -0.1
24시간 내 취소   -0.3
노쇼            -0.5
```

`User.reputationScore`는 초기값 3.00에서 평점 이벤트 delta를 누적한 값입니다.

## OrganizerParticipantEvaluation

밋업 종료 후 주최자가 참가자를 평가한 기록입니다.

주요 컬럼:

```text
id             String
applicationId  String   unique
organizerId    String
participantId  String
rating         Int      1~5
tags           String[]
comment        String?
blocked        Boolean
blockReason    String?
createdAt      DateTime
```

의미:

```text
rating       주최자가 참가자에게 준 평가 점수
blocked      평가와 함께 블락했는지 여부
blockReason  블락 사유
```

## UserBlock

주최자가 특정 유저를 다시 받지 않기 위해 블락한 기록입니다.

주요 컬럼:

```text
id             String
blockerId      String   블락한 유저, 보통 주최자
blockedUserId  String   블락된 유저
applicationId  String?
reason         String?
createdAt      DateTime
```

제약:

```text
한 blocker는 같은 blockedUser를 한 번만 블락 가능
unique(blockerId, blockedUserId)
```

## Settlement

정산 묶음입니다. 하나의 신청에 대해 하나의 정산이 생성됩니다.

주요 컬럼:

```text
id                  String            cuid
applicationId       String            unique
meetupId            String
status              SettlementStatus  PENDING | COMPLETED | FAILED
reason              SettlementReason
escrowFinishTxHash  String?
createdAt           DateTime
completedAt         DateTime?
failedAt            DateTime?
updatedAt           DateTime
```

reason:

```text
REJECTED                    주최자 거절로 전액 환불
FREE_ATTENDED               무료 밋업 출석, 보증금 전액 환불
FREE_NO_SHOW                무료 밋업 노쇼, 50% 환불 + 50% 주최자 지급
FREE_CANCELED_48H_PLUS      무료 밋업 48시간+ 전 취소, 100% 환불
FREE_CANCELED_24_48         무료 밋업 24-48시간 전 취소, 90% 환불 + 10% 주최자 지급
FREE_CANCELED_WITHIN_24     무료 밋업 24시간 내 취소, 70% 환불 + 30% 주최자 지급
PAID_ATTENDED               유료 밋업 출석, 주최자 90% + 플랫폼 10%
PAID_NO_SHOW                유료 밋업 노쇼, 주최자 90% + 플랫폼 10%
PAID_CANCELED_48H_PLUS      유료 밋업 48시간+ 전 취소, 90% 환불 + 플랫폼 10%
PAID_CANCELED_24_48         유료 밋업 24-48시간 전 취소, 70% 환불 + 주최자 20% + 플랫폼 10%
PAID_CANCELED_WITHIN_24     유료 밋업 24시간 내 취소, 50% 환불 + 주최자 40% + 플랫폼 10%
```

## SettlementLine

정산의 실제 분배 라인입니다.

주요 컬럼:

```text
id                String              cuid
settlementId      String
type              SettlementLineType
recipientAddress  String
amountDorri       Decimal
txHash            String?
status            LedgerTxStatus      PENDING | VALIDATED | FAILED
createdAt         DateTime
completedAt       DateTime?
```

type:

```text
PARTICIPANT_REFUND  참가자 환불
HOST_PAYOUT         주최자 지급
PLATFORM_FEE        플랫폼 수수료
NO_SHOW_PENALTY     무료 밋업 노쇼 패널티
```

예시:

```text
무료 밋업 출석:
- PARTICIPANT_REFUND 20 DORRI

무료 밋업 노쇼:
- PARTICIPANT_REFUND 10 DORRI
- NO_SHOW_PENALTY 10 DORRI

유료 밋업 출석/노쇼:
- HOST_PAYOUT 27 DORRI
- PLATFORM_FEE 3 DORRI
```

## LedgerTx

XRPL 트랜잭션 로그입니다.

주요 컬럼:

```text
id          String          cuid
userId      String?
txHash      String          unique
txType      LedgerTxType
status      LedgerTxStatus  PENDING | VALIDATED | FAILED
rawJson     Json?
createdAt   DateTime
validatedAt DateTime?
```

txType:

```text
WALLET_FUND
TRUST_SET
DORRI_PAYMENT
ESCROW_CREATE
ESCROW_FINISH
ESCROW_CANCEL
SETTLEMENT_PAYMENT
```

의미:

```text
rawJson  XRPL 응답 원본 저장용
```

## DorriCharge

MVP 테스트용 DORRI 충전 기록입니다.

주요 컬럼:

```text
id             String             cuid
userId         String
quoteId        String?
amount         Decimal            지급된 DORRI 수량
fiatCurrency   String?
fiatAmount     Decimal?
rateToUsd      Decimal?
dorriAmount    Decimal?
paymentTxHash  String?
status         DorriChargeStatus  PENDING | COMPLETED | FAILED
createdAt      DateTime
updatedAt      DateTime
```

## DorriChargeQuote

DORRI 충전 전 환율 견적입니다.

주요 컬럼:

```text
id             String    cuid
userId         String
fiatCurrency   String    KRW | USD | JPY | EUR 등
fiatAmount     Decimal   유저가 결제하려는 fiat 금액
rateToUsd      Decimal   1 USD를 구매하는 데 필요한 fiat 금액
dorriAmount    Decimal   지급 예정 DORRI 수량. 1 DORRI = 1 USD, 소수점 둘째 자리까지 내림
expiresAt      DateTime
consumedAt     DateTime?
createdAt      DateTime
```

의미:

```text
quote는 환율 변동을 막기 위해 짧은 시간만 유효합니다.
expiresAt이 지난 quote는 사용할 수 없고, 프론트는 새 quote를 요청해야 합니다.
charge가 완료되면 consumedAt을 기록합니다.
```

## 프론트엔드에서 자주 보게 될 필드

홈 화면:

```text
User.name
User.profileImageUrl
DorriAccount.balanceSnapshot
DorriAccount.trustLineStatus
Meetup.title
Meetup.imageUrl
Meetup.startsAt
Meetup.type
Meetup.depositDorri
Meetup.entryFeeDorri
Meetup.capacity
MeetupApplication.status
```

밋업 상세:

```text
Meetup.title
Meetup.description
Meetup.imageUrl
Meetup.locationName
Meetup.address
Meetup.startsAt
Meetup.endsAt
Meetup.type
Meetup.depositDorri
Meetup.entryFeeDorri
Meetup.capacity
MeetupTag.name
```

신청 완료:

```text
MeetupApplication.status
MeetupApplication.lockedDorriAmount
Escrow.status
Escrow.createTxHash
Escrow.offerSequence
```

평가/정산:

```text
Review.rating
Review.tags
Review.comment
Settlement.status
Settlement.reason
SettlementLine.type
SettlementLine.amountDorri
SettlementLine.txHash
```

## 짧은 확인 명령어

Prisma Studio:

```bash
npm run prisma:studio
```

PostgreSQL 직접 조회:

```bash
docker exec -it hi-dorri-postgres psql -U hidorri -d hidorri
```

테이블 목록:

```sql
\dt
```
