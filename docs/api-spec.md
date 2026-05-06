# HI-DORRI API 명세서

이 문서는 프론트엔드와 백엔드가 공유하는 API 계약입니다.

기준 범위는 2026-05-11 MVP입니다. 실제 구현 중 변경이 생기면 이 문서를 먼저 수정한 뒤 프론트엔드와 백엔드 양쪽에 반영합니다.

## 공통 규칙

Base URL:

```text
http://localhost:4000/api
```

Content-Type:

```text
application/json
```

인증 방식:

```text
Authorization: Bearer <accessToken>
```

MVP 초기에는 인증을 단순화할 수 있습니다. 단, 프론트엔드 코드는 최종적으로 `accessToken` 기반 호출이 가능하도록 준비합니다.

## 공통 에러 응답

```json
{
  "statusCode": 400,
  "code": "INVALID_REQUEST",
  "message": "Invalid request body"
}
```

공통 에러 코드:

```text
INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
INSUFFICIENT_DORRI_BALANCE
XRPL_TRANSACTION_FAILED
INTERNAL_SERVER_ERROR
```

## 공통 상태값

TrustLine status:

```text
PENDING
ACTIVE
FAILED
```

Meetup type:

```text
FREE
PAID
```

Meetup status:

```text
DRAFT
PUBLISHED
CLOSED
SETTLED
```

Application status:

```text
PENDING_APPROVAL
APPROVED
REJECTED
CHECKED_IN
REVIEWED
NO_SHOW
SETTLED
CANCELED
```

Escrow status:

```text
CREATED
FINISHED
CANCELED
FAILED
```

Settlement status:

```text
PENDING
COMPLETED
FAILED
```

Settlement line type:

```text
PARTICIPANT_REFUND
HOST_PAYOUT
PLATFORM_FEE
NO_SHOW_PENALTY
```

Reputation event type:

```text
ATTENDANCE
CANCEL_48H_PLUS
CANCEL_24_48
CANCEL_WITHIN_24
NO_SHOW
```

Transaction status:

```text
PENDING
VALIDATED
FAILED
```

## 정산 정책

XRPL Escrow는 하나의 escrow에서 여러 destination으로 직접 분배하지 않습니다. 따라서 HI-DORRI MVP에서는 아래 구조를 사용합니다.

플랫폼 XRPL 지갑은 3개를 분리해서 관리합니다.

```text
DORRI issuer wallet
- DORRI 토큰 발행 주소입니다.
- 유저와 플랫폼 운영 지갑은 이 주소를 issuer로 TrustLine을 생성합니다.
- 자동 정산 서버에서 평상시 사용하지 않는 cold 성격의 지갑입니다.

Platform settlement wallet
- 밋업 신청 시 생성되는 escrow의 destination입니다.
- EscrowFinish 후 잠긴 자산을 수령하고, 정산 정책에 따라 유저/주최자/수수료 지갑으로 Payment를 보냅니다.
- 서버가 자동 서명해야 하므로 seed를 암호화해서 저장합니다.

Platform fee wallet
- 유료 밋업 플랫폼 수수료를 최종 보관하는 지갑입니다.
- MVP에서도 settlement wallet과 분리합니다.
```

```text
참가자 신청
-> escrow 생성
-> escrow destination은 platform settlement wallet
-> 주최자 수락/거절 또는 출석/노쇼 확정
-> EscrowFinish
-> platform settlement wallet이 수령
-> 백엔드가 settlement wallet에서 정책에 따라 DORRI Payment로 분배
```

무료 밋업:

```text
depositDorri = 20

주최자 거절:
- 참가자 환불 20 DORRI

출석:
- 참가자 환불 20 DORRI
- 주최자 지급 0 DORRI
- 플랫폼 수수료 0 DORRI
- 참가자 평점 +0.1

참가자 취소/노쇼:
- 48시간+ 전 취소: 참가자 20 DORRI, 주최자 0 DORRI, 플랫폼 0 DORRI, 평점 영향 없음
- 24-48시간 전 취소: 참가자 18 DORRI, 주최자 2 DORRI, 플랫폼 0 DORRI, 평점 -0.1
- 24시간 내 취소: 참가자 14 DORRI, 주최자 6 DORRI, 플랫폼 0 DORRI, 평점 -0.3
- 노쇼: 참가자 10 DORRI, 주최자 10 DORRI, 플랫폼 0 DORRI, 평점 -0.5
```

유료 밋업:

```text
entryFeeDorri = 주최자 설정 금액

주최자 거절:
- 참가자 환불 100%

출석:
- 주최자 지급 90%
- 플랫폼 수수료 10%
- 참가자 환불 0%
- 참가자 평점 +0.1

참가자 취소/노쇼:
- 48시간+ 전 취소: 참가자 90%, 주최자 0%, 플랫폼 10%, 평점 영향 없음
- 24-48시간 전 취소: 참가자 70%, 주최자 20%, 플랫폼 10%, 평점 -0.1
- 24시간 내 취소: 참가자 50%, 주최자 40%, 플랫폼 10%, 평점 -0.3
- 노쇼: 참가자 0%, 주최자 90%, 플랫폼 10%, 평점 -0.5
```

MVP 구현 메모:

```text
DORRI는 XRPL TokenEscrow를 우선 사용합니다.
신청 시 EscrowCreate의 Amount는 XRP drops가 아니라 DORRI issued amount object입니다.
Token escrow는 `CancelAfter`가 필수이므로 MVP 기본 만료 기간을 설정합니다.
TokenEscrow를 사용할 수 없는 네트워크에서만 별도 fallback을 검토합니다.
```

## 1. Auth

### POST /auth/signup

이메일 회원가입을 요청합니다.

Request:

```json
{
  "name": "hidorri",
  "email": "hidorri@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "userId": "clw_user_example",
  "name": "hidorri",
  "email": "hidorri@example.com",
  "nextStep": "VERIFY_EMAIL",
  "devVerificationCode": "123456"
}
```

`devVerificationCode`는 MVP 개발용 필드입니다. 실제 이메일 발송 서비스를 붙이면 응답에서 제거합니다.

Errors:

```text
400 INVALID_REQUEST
409 CONFLICT
```

### POST /auth/verify-email

이메일 인증 코드를 검증합니다.

Request:

```json
{
  "email": "hidorri@example.com",
  "code": "123456"
}
```

Response:

```json
{
  "userId": "clw_user_example",
  "email": "hidorri@example.com",
  "emailVerified": true,
  "accessToken": "mock-or-jwt-access-token",
  "nextStep": "CREATE_WALLET"
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
404 NOT_FOUND
```

### POST /auth/login

기존 유저가 이메일과 비밀번호로 로그인합니다.

Request:

```json
{
  "email": "hidorri@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "mock-or-jwt-access-token",
  "user": {
    "id": "clw_user_example",
    "email": "hidorri@example.com",
    "name": "hidorri",
    "emailVerified": true
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
404 NOT_FOUND
```

## 2. User

### GET /users/me

현재 로그인한 유저 정보를 조회합니다.

Response:

```json
{
  "id": "clw_user_example",
  "email": "hidorri@example.com",
  "name": "hidorri",
  "emailVerified": true,
  "reputationScore": "3.00",
  "wallet": {
    "xrplAddress": "rSARAH123456789XRPLWALLEThj92",
    "network": "TESTNET"
  },
  "dorri": {
    "balance": "50",
    "trustLineStatus": "ACTIVE"
  }
}
```

Errors:

```text
401 UNAUTHORIZED
404 NOT_FOUND
```

## 3. Wallet

### POST /wallets/create

현재 유저의 XRPL Testnet 지갑을 생성합니다.

가입 플로우에서는 이메일 인증이 끝난 뒤 호출합니다. 지갑 생성 후 백엔드는 seed를 암호화해서 저장해야 합니다.

Request:

```json
{}
```

Response:

```json
{
  "wallet": {
    "id": "clw_wallet_example",
    "xrplAddress": "rSARAH123456789XRPLWALLEThj92",
    "network": "TESTNET",
    "createdAt": "2026-05-05T12:00:00.000Z"
  },
  "xrpl": {
    "fundingTxHash": "A1B2C3D4",
    "status": "VALIDATED"
  },
  "nextStep": "CREATE_DORRI_TRUSTLINE"
}
```

Errors:

```text
401 UNAUTHORIZED
409 CONFLICT
500 XRPL_TRANSACTION_FAILED
```

### GET /wallets/me

현재 유저의 지갑 정보를 조회합니다.

Response:

```json
{
  "id": "clw_wallet_example",
  "xrplAddress": "rSARAH123456789XRPLWALLEThj92",
  "network": "TESTNET",
  "createdAt": "2026-05-05T12:00:00.000Z"
}
```

Errors:

```text
401 UNAUTHORIZED
404 NOT_FOUND
```

## 4. DORRI

### POST /dorri/trustline

현재 유저 지갑에 DORRI TrustLine을 생성합니다.

Validator NFT minting은 2026-05-11 MVP 범위에서 제외합니다.

XRPL 트랜잭션에서는 4글자 이상 currency code를 직접 사용할 수 없으므로, DORRI는 `444F525249000000000000000000000000000000` hex currency code로 제출합니다. API 응답과 DB 표시값은 계속 `DORRI`를 사용합니다.

Request:

```json
{
  "limit": "100000"
}
```

Response:

```json
{
  "trustLine": {
    "status": "ACTIVE",
    "currency": "DORRI",
    "issuer": "rDORRIIssuerAddress",
    "limit": "100000"
  },
  "tx": {
    "txHash": "TRUSTLINE_TX_HASH",
    "status": "VALIDATED",
    "explorerUrl": "https://testnet.xrpl.org/transactions/TRUSTLINE_TX_HASH"
  },
  "nextStep": "HOME"
}
```

Errors:

```text
401 UNAUTHORIZED
404 NOT_FOUND
409 CONFLICT
500 XRPL_TRANSACTION_FAILED
```

### GET /dorri/balance

현재 유저의 DORRI 잔액을 조회합니다.

Response:

```json
{
  "currency": "DORRI",
  "balance": "50",
  "trustLineStatus": "ACTIVE",
  "issuer": "rDORRIIssuerAddress",
  "updatedAt": "2026-05-05T12:00:00.000Z"
}
```

Errors:

```text
401 UNAUTHORIZED
404 NOT_FOUND
```

### POST /dorri/charge/quote

DORRI 충전 전 실시간 환율 견적을 생성합니다.

`rateToUsd`는 `1 USD`를 구매하는 데 필요한 fiat 금액입니다. 예를 들어 KRW 기준 `1350`이면 `1350 KRW = 1 USD = 1 DORRI`입니다. 충전 지급 DORRI 수량은 소수점 둘째 자리까지 내림 처리합니다.

Request:

```json
{
  "fiatCurrency": "KRW",
  "fiatAmount": "40500"
}
```

Response:

```json
{
  "quoteId": "clw_quote_example",
  "fiat": {
    "currency": "KRW",
    "amount": "40500",
    "rateToUsd": "1350"
  },
  "dorri": {
    "currency": "DORRI",
    "amount": "30"
  },
  "expiresAt": "2026-05-05T12:05:00.000Z"
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
500 INTERNAL_SERVER_ERROR
```

### POST /dorri/charge

MVP 테스트용 DORRI 충전을 요청합니다.

MVP에서는 실제 결제 완료를 mock 처리하고, 유효한 quote를 기준으로 DORRI issuer wallet에서 유저 지갑으로 DORRI Payment를 보냅니다. quote가 만료되면 프론트는 `/dorri/charge/quote`를 다시 호출해야 합니다.

Request:

```json
{
  "quoteId": "clw_quote_example"
}
```

Response:

```json
{
  "charge": {
    "id": "clw_charge_example",
    "fiatCurrency": "KRW",
    "fiatAmount": "40500",
    "rateToUsd": "1350",
    "amount": "50",
    "status": "COMPLETED"
  },
  "balance": {
    "currency": "DORRI",
    "balance": "50"
  },
  "tx": {
    "txHash": "DORRI_PAYMENT_TX_HASH",
    "status": "VALIDATED",
    "explorerUrl": "https://testnet.xrpl.org/transactions/DORRI_PAYMENT_TX_HASH"
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
404 NOT_FOUND
409 CONFLICT
500 XRPL_TRANSACTION_FAILED
```

## 5. Home

### GET /home

참여자 홈 화면에 필요한 데이터를 한 번에 조회합니다.

Response:

```json
{
  "user": {
    "id": "clw_user_example",
    "name": "hidorri",
    "profileImageUrl": "/images/avatar-hidorri.png"
  },
  "wallet": {
    "xrplAddress": "rSARAH123456789XRPLWALLEThj92",
    "network": "TESTNET"
  },
  "dorri": {
    "balance": "50",
    "trustLineStatus": "ACTIVE"
  },
  "upcomingMeetups": [
    {
      "id": "clw_meetup1_example",
      "title": "Singapore NFT Global Summit",
      "hostName": "Asia Crypto Alliance",
      "imageUrl": "/images/meetup-singapore.png",
      "locationName": "Marina Bay, Singapore",
      "startsAt": "2026-05-10T13:00:00.000Z",
      "type": "FREE",
      "depositDorri": "20",
      "entryFeeDorri": "0",
      "capacity": 100,
      "appliedCount": 85,
      "rating": 3.8
    }
  ],
  "myMeetups": [
    {
      "applicationId": "clw_application_example",
      "status": "APPROVED",
      "lockedDorriAmount": "30",
      "meetup": {
        "id": "clw_meetup2_example",
        "title": "Seoul Crypto Meetup",
        "imageUrl": "/images/meetup-seoul.png",
        "startsAt": "2026-05-10T13:00:00.000Z"
      }
    }
  ]
}
```

Errors:

```text
401 UNAUTHORIZED
```

## 6. Meetups

### GET /meetups

밋업 목록을 조회합니다.

Query:

```text
status=PUBLISHED
```

Response:

```json
{
  "meetups": [
    {
      "id": "clw_meetup1_example",
      "title": "Singapore NFT Global Summit",
      "hostName": "Asia Crypto Alliance",
      "imageUrl": "/images/meetup-singapore.png",
      "locationName": "Marina Bay, Singapore",
      "startsAt": "2026-05-10T13:00:00.000Z",
      "type": "FREE",
      "depositDorri": "20",
      "entryFeeDorri": "0",
      "capacity": 100,
      "appliedCount": 85,
      "rating": 3.8,
      "status": "PUBLISHED"
    },
    {
      "id": "clw_meetup2_example",
      "title": "Seoul Crypto Meetup",
      "hostName": "CryptoMagic",
      "imageUrl": "/images/meetup-seoul.png",
      "locationName": "Hongdae, Seoul",
      "startsAt": "2026-05-13T13:00:00.000Z",
      "type": "PAID",
      "depositDorri": "0",
      "entryFeeDorri": "30",
      "capacity": 20,
      "appliedCount": 18,
      "rating": 4.7,
      "status": "PUBLISHED"
    }
  ]
}
```

Errors:

```text
401 UNAUTHORIZED
```

### GET /meetups/:id

밋업 상세 정보를 조회합니다.

`requirements`는 2026-05-11 MVP 범위에서 제외합니다.

Response:

```json
{
  "id": "clw_meetup2_example",
  "title": "Seoul Crypto Meetup",
  "description": "A crypto-native meetup for builders and community members.",
  "host": {
    "id": "clw_user_host_example",
    "name": "CryptoMagic",
    "profileImageUrl": "/images/host-cryptomagic.png",
    "rating": 4.7,
    "reviewCount": 56
  },
  "imageUrl": "/images/meetup-detail.png",
  "tags": ["Web3", "Networking"],
  "location": {
    "name": "Hongdae",
    "address": "Seoul, KR",
    "mapImageUrl": "/images/map-hongdae.png"
  },
  "startsAt": "2026-05-10T13:00:00.000Z",
  "endsAt": "2026-05-10T15:00:00.000Z",
  "type": "PAID",
  "depositDorri": "0",
  "entryFeeDorri": "30",
  "lockedDorriAmount": "30",
  "capacity": 20,
  "appliedCount": 18,
  "status": "PUBLISHED",
  "myApplication": null
}
```

Errors:

```text
401 UNAUTHORIZED
404 NOT_FOUND
```

### POST /meetups

주최자가 밋업을 등록합니다.

유저 role은 따로 두지 않습니다. 밋업을 만든 유저가 해당 밋업의 주최자입니다.

무료 밋업은 `type = FREE`, `depositDorri = 20`, `entryFeeDorri = 0`을 사용합니다. 유료 밋업은 `type = PAID`, `entryFeeDorri`를 주최자가 설정합니다.

Request:

```json
{
  "title": "Seoul Crypto Meetup",
  "description": "A crypto-native meetup for builders and community members.",
  "imageUrl": "/images/meetup-detail.png",
  "locationName": "Hongdae",
  "address": "Seoul, KR",
  "startsAt": "2026-05-10T13:00:00.000Z",
  "endsAt": "2026-05-10T15:00:00.000Z",
  "type": "PAID",
  "depositDorri": "0",
  "entryFeeDorri": "30",
  "capacity": 20,
  "status": "PUBLISHED"
}
```

Response:

```json
{
  "id": "clw_meetup2_example",
  "title": "Seoul Crypto Meetup",
  "type": "PAID",
  "status": "PUBLISHED",
  "createdAt": "2026-05-05T12:00:00.000Z"
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
```

## 7. Applications

### POST /meetups/:id/apply

밋업에 신청하고 escrow를 생성합니다.

신청 금액은 request body로 받지 않습니다. 백엔드가 밋업의 `type`, `depositDorri`, `entryFeeDorri`를 기준으로 `lockedDorriAmount`를 결정합니다.

Request:

```json
{}
```

Response:

```json
{
  "application": {
    "id": "clw_application_example",
    "meetupId": "clw_meetup2_example",
    "status": "PENDING_APPROVAL",
    "lockedDorriAmount": "30",
    "createdAt": "2026-05-05T12:00:00.000Z"
  },
  "escrow": {
    "id": "clw_escrow_example",
    "status": "CREATED",
    "ownerAddress": "rSARAH123456789XRPLWALLEThj92",
    "destinationAddress": "rPlatformSettlementWallet",
    "offerSequence": 12345,
    "createTxHash": "ESCROW_CREATE_TX_HASH",
    "explorerUrl": "https://testnet.xrpl.org/transactions/ESCROW_CREATE_TX_HASH"
  },
  "balance": {
    "before": "50",
    "locked": "30",
    "remain": "20"
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
404 NOT_FOUND
409 CONFLICT
500 INSUFFICIENT_DORRI_BALANCE
500 XRPL_TRANSACTION_FAILED
```

### GET /applications/me

현재 유저의 밋업 신청 목록을 조회합니다.

Response:

```json
{
  "applications": [
    {
      "id": "clw_application_example",
      "status": "PENDING_APPROVAL",
      "lockedDorriAmount": "30",
      "meetup": {
        "id": "clw_meetup2_example",
        "title": "Seoul Crypto Meetup",
        "imageUrl": "/images/meetup-seoul.png",
        "startsAt": "2026-05-10T13:00:00.000Z",
        "locationName": "Hongdae, Seoul"
      },
      "escrow": {
        "status": "CREATED",
        "createTxHash": "ESCROW_CREATE_TX_HASH"
      }
    }
  ]
}
```

Errors:

```text
401 UNAUTHORIZED
```

### GET /applications/:id

신청 상세 정보를 조회합니다.

Response:

```json
{
  "id": "clw_application_example",
  "status": "PENDING_APPROVAL",
  "lockedDorriAmount": "30",
  "meetup": {
    "id": "clw_meetup2_example",
    "title": "Seoul Crypto Meetup",
    "type": "PAID",
    "startsAt": "2026-05-10T13:00:00.000Z",
    "locationName": "Hongdae, Seoul"
  },
  "escrow": {
    "id": "clw_escrow_example",
    "status": "CREATED",
    "ownerAddress": "rSARAH123456789XRPLWALLEThj92",
    "destinationAddress": "rPlatformSettlementWallet",
    "offerSequence": 12345,
    "createTxHash": "ESCROW_CREATE_TX_HASH",
    "finishTxHash": null,
    "cancelTxHash": null
  },
  "review": null,
  "settlement": null
}
```

Errors:

```text
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
```

### POST /applications/:id/cancel

참가자가 본인의 밋업 신청을 취소합니다.

취소 가능한 상태:

```text
PENDING_APPROVAL
APPROVED
```

백엔드는 밋업 시작 시간 기준으로 취소 구간을 계산하고, EscrowFinish 후 settlement wallet에서 참가자/주최자/플랫폼 지갑으로 DORRI Payment를 분배합니다.

Request:

```json
{}
```

Response:

```json
{
  "settlement": {
    "id": "clw_settlement_example",
    "applicationId": "clw_application_example",
    "reason": "PAID_CANCELED_24_48",
    "status": "COMPLETED",
    "createdAt": "2026-05-05T12:00:00.000Z",
    "lines": [
      {
        "type": "PARTICIPANT_REFUND",
        "recipientAddress": "rParticipantWallet",
        "amountDorri": "21",
        "txHash": "REFUND_PAYMENT_TX_HASH"
      },
      {
        "type": "HOST_PAYOUT",
        "recipientAddress": "rHostWallet",
        "amountDorri": "6",
        "txHash": "HOST_PAYMENT_TX_HASH"
      },
      {
        "type": "PLATFORM_FEE",
        "recipientAddress": "rPlatformFeeWallet",
        "amountDorri": "3",
        "txHash": "FEE_PAYMENT_TX_HASH"
      }
    ]
  },
  "application": {
    "id": "clw_application_example",
    "status": "CANCELED"
  },
  "reputation": {
    "delta": "-0.1"
  },
  "balance": {
    "dorri": "71"
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
500 XRPL_TRANSACTION_FAILED
```

## 8. Organizer

### GET /organizer/meetups

현재 유저가 주최자로 등록한 밋업 목록을 조회합니다.

Response:

```json
{
  "meetups": [
    {
      "id": "clw_meetup2_example",
      "title": "Seoul Crypto Meetup",
      "type": "PAID",
      "status": "PUBLISHED",
      "startsAt": "2026-05-10T13:00:00.000Z",
      "entryFeeDorri": "30",
      "depositDorri": "0",
      "capacity": 20,
      "appliedCount": 18,
      "settledCount": 0
    }
  ]
}
```

Errors:

```text
401 UNAUTHORIZED
403 FORBIDDEN
```

### GET /organizer/meetups/:id/applications

주최자가 특정 밋업의 신청자 목록을 조회합니다.

Response:

```json
{
  "meetup": {
    "id": "clw_meetup2_example",
    "title": "Seoul Crypto Meetup"
  },
  "applications": [
    {
      "id": "clw_application_example",
      "status": "PENDING_APPROVAL",
      "lockedDorriAmount": "30",
      "participant": {
        "id": "clw_user_example",
        "name": "hidorri",
        "xrplAddress": "rSARAH123456789XRPLWALLEThj92"
      },
      "escrow": {
        "status": "CREATED",
        "createTxHash": "ESCROW_CREATE_TX_HASH"
      }
    }
  ]
}
```

Errors:

```text
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
```

### POST /organizer/applications/:id/approve

주최자가 참가 신청을 수락합니다.

Escrow는 유지되고, 신청 상태만 `APPROVED`로 변경됩니다.

Request:

```json
{}
```

Response:

```json
{
  "application": {
    "id": "clw_application_example",
    "status": "APPROVED",
    "approvedAt": "2026-05-05T12:00:00.000Z"
  },
  "escrow": {
    "id": "clw_escrow_example",
    "status": "CREATED"
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
```

### POST /organizer/applications/:id/reject

주최자가 참가 신청을 거절합니다.

거절 시 escrow를 release하고 참가자에게 전액 환불합니다. XRPL `EscrowCancel`이 아니라 `EscrowFinish` 후 환불 Payment를 사용할 수 있습니다.

Request:

```json
{}
```

Response:

```json
{
  "application": {
    "id": "clw_application_example",
    "status": "SETTLED"
  },
  "escrow": {
    "id": "clw_escrow_example",
    "status": "FINISHED",
    "finishTxHash": "ESCROW_FINISH_TX_HASH"
  },
  "settlement": {
    "id": "clw_settlement_example",
    "status": "COMPLETED",
    "reason": "REJECTED",
    "lines": [
      {
        "type": "PARTICIPANT_REFUND",
        "recipientAddress": "rSARAH123456789XRPLWALLEThj92",
        "amountDorri": "30",
        "txHash": "REFUND_PAYMENT_TX_HASH"
      }
    ]
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
500 XRPL_TRANSACTION_FAILED
```

### POST /organizer/applications/:id/check-in

주최자가 참가자의 출석을 확인합니다.

Request:

```json
{}
```

Response:

```json
{
  "application": {
    "id": "clw_application_example",
    "status": "CHECKED_IN",
    "checkedInAt": "2026-05-05T12:00:00.000Z"
  },
  "nextStep": "SUBMIT_REVIEW"
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
```

### POST /organizer/applications/:id/no-show

주최자가 참가자를 노쇼로 처리합니다.

Request:

```json
{}
```

Response:

```json
{
  "application": {
    "id": "clw_application_example",
    "status": "NO_SHOW",
    "noShowAt": "2026-05-05T12:00:00.000Z"
  },
  "nextStep": "SETTLE_ESCROW"
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
```

### POST /organizer/applications/:id/evaluate

밋업 종료 후 주최자가 참가자를 평가하고 필요하면 블락합니다.

Request:

```json
{
  "rating": 4,
  "tags": ["On time", "Good participation"],
  "comment": "Joined the discussion actively.",
  "blocked": false,
  "blockReason": null
}
```

Response:

```json
{
  "evaluation": {
    "id": "clw_evaluation_example",
    "applicationId": "clw_application_example",
    "rating": 4,
    "tags": ["On time", "Good participation"],
    "comment": "Joined the discussion actively.",
    "blocked": false,
    "blockReason": null,
    "createdAt": "2026-05-05T12:00:00.000Z"
  },
  "block": null
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
```

## 9. Reviews

### POST /applications/:id/review

밋업 참가 후 리뷰를 제출합니다.

Request:

```json
{
  "rating": 5,
  "tags": ["Well organized", "Great venue", "Valuable content", "Good networking"],
  "comment": "The meetup was well-organized and engaging from start to finish."
}
```

Response:

```json
{
  "review": {
    "id": "clw_review_example",
    "applicationId": "clw_application_example",
    "meetupId": "clw_meetup2_example",
    "rating": 5,
    "tags": ["Well organized", "Great venue", "Valuable content", "Good networking"],
    "comment": "The meetup was well-organized and engaging from start to finish.",
    "createdAt": "2026-05-05T12:00:00.000Z"
  },
  "application": {
    "id": "clw_application_example",
    "status": "REVIEWED"
  },
  "nextStep": "SETTLE_ESCROW"
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
```

## 10. Settlement

### POST /applications/:id/settle

Escrow 정산을 실행합니다.

정산 정책은 `meetup.type`과 `application.status`에 따라 결정됩니다.

정산 가능한 상태:

```text
REVIEWED
NO_SHOW
```

참가자 취소는 `/applications/:id/cancel`에서 즉시 정산합니다.

Request:

```json
{}
```

Response for paid meetup after attendance:

```json
{
  "settlement": {
    "id": "clw_settlement_example",
    "applicationId": "clw_application_example",
    "reason": "PAID_ATTENDED",
    "status": "COMPLETED",
    "createdAt": "2026-05-05T12:00:00.000Z",
    "lines": [
      {
        "type": "HOST_PAYOUT",
        "recipientAddress": "rHostWalletAddress",
        "amountDorri": "27",
        "txHash": "HOST_PAYOUT_TX_HASH"
      },
      {
        "type": "PLATFORM_FEE",
        "recipientAddress": "rPlatformFeeWallet",
        "amountDorri": "3",
        "txHash": "PLATFORM_FEE_TX_HASH"
      }
    ]
  },
  "application": {
    "id": "clw_application_example",
    "status": "SETTLED"
  },
  "escrow": {
    "id": "clw_escrow_example",
    "status": "FINISHED",
    "finishTxHash": "ESCROW_FINISH_TX_HASH",
    "explorerUrl": "https://testnet.xrpl.org/transactions/ESCROW_FINISH_TX_HASH"
  },
  "balance": {
    "dorri": "20"
  }
}
```

Response for free meetup no-show:

```json
{
  "settlement": {
    "id": "clw_settlement_example",
    "applicationId": "clw_application_example",
    "reason": "FREE_NO_SHOW",
    "status": "COMPLETED",
    "createdAt": "2026-05-05T12:00:00.000Z",
    "lines": [
      {
        "type": "PARTICIPANT_REFUND",
        "recipientAddress": "rSARAH123456789XRPLWALLEThj92",
        "amountDorri": "18",
        "txHash": "REFUND_PAYMENT_TX_HASH"
      },
      {
        "type": "NO_SHOW_PENALTY",
        "recipientAddress": "rHostWalletAddress",
        "amountDorri": "2",
        "txHash": "PENALTY_PAYMENT_TX_HASH"
      }
    ]
  },
  "application": {
    "id": "clw_application_example",
    "status": "SETTLED"
  },
  "escrow": {
    "id": "clw_escrow_example",
    "status": "FINISHED",
    "finishTxHash": "ESCROW_FINISH_TX_HASH",
    "explorerUrl": "https://testnet.xrpl.org/transactions/ESCROW_FINISH_TX_HASH"
  },
  "balance": {
    "dorri": "68"
  }
}
```

Errors:

```text
400 INVALID_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
500 XRPL_TRANSACTION_FAILED
```

### GET /applications/:id/settlement

정산 내역을 조회합니다.

Response:

```json
{
  "settlement": {
    "id": "clw_settlement_example",
    "status": "COMPLETED",
    "reason": "PAID_ATTENDED",
    "createdAt": "2026-05-05T12:00:00.000Z",
    "lines": [
      {
        "type": "HOST_PAYOUT",
        "recipientAddress": "rHostWalletAddress",
        "amountDorri": "27",
        "txHash": "HOST_PAYOUT_TX_HASH"
      },
      {
        "type": "PLATFORM_FEE",
        "recipientAddress": "rPlatformFeeWallet",
        "amountDorri": "3",
        "txHash": "PLATFORM_FEE_TX_HASH"
      }
    ]
  },
  "meetup": {
    "id": "clw_meetup2_example",
    "title": "Seoul Crypto Meetup"
  },
  "balance": {
    "dorri": "20"
  },
  "escrowTx": {
    "txHash": "ESCROW_FINISH_TX_HASH",
    "explorerUrl": "https://testnet.xrpl.org/transactions/ESCROW_FINISH_TX_HASH"
  }
}
```

Errors:

```text
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
```

## 프론트엔드 구현 메모

프론트엔드는 백엔드 구현 전까지 위 response shape에 맞춘 mock data를 사용합니다.

추천 라우트:

```text
/signup
/home
/meetups
/meetups/[id]
/applications/[id]/submitted
/applications/[id]/review
/applications/[id]/review-submitted
/applications/[id]/settlement
/wallet
/profile
/organizer/meetups
/organizer/meetups/new
/organizer/meetups/[id]
```

## 백엔드 구현 메모

추천 모듈:

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

Escrow 관련 DB에는 최소한 아래 필드를 저장합니다.

```text
applicationId
ownerAddress
destinationAddress
offerSequence
lockedDorriAmount
createTxHash
finishTxHash
cancelTxHash
status
createdAt
finishedAt
```

XRPL EscrowFinish에는 `Owner`와 `OfferSequence`가 필요합니다. 조건부 escrow를 사용하는 경우 `Condition`과 `Fulfillment`도 별도로 저장해야 합니다.

플랫폼 지갑은 `PlatformWallet` 테이블로 관리합니다.

```text
DORRI_ISSUER  DORRI 토큰 issuer 주소. TrustLine issuer 기준값.
SETTLEMENT    escrow destination 및 정산 지급 출금 지갑.
FEE           플랫폼 수수료 최종 수령 지갑.
```

`SETTLEMENT`와 `FEE` 지갑의 seed는 백엔드가 자동 Payment를 서명해야 하므로 암호화 저장합니다. `DORRI_ISSUER` seed는 운영 환경에서는 서버 DB에 저장하지 않는 것을 원칙으로 하며, MVP/testnet 초기 발행 자동화가 필요할 때만 제한적으로 암호화 저장할 수 있습니다.

정산 테스트 전에는 플랫폼 운영 지갑 TrustLine도 필요합니다.

```bash
npm run platform-wallets:trustlines
```

주최자 지갑도 DORRI를 수령하려면 해당 계정으로 로그인한 뒤 `/dorri/trustline`을 먼저 호출해야 합니다.
