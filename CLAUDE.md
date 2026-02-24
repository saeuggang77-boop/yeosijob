# 여시알바 (YeosiAlba) — Claude Code 프로젝트 가이드

> **이 문서는 프로젝트의 모든 설계를 담고 있다. 개발 중 방향이 헷갈리면 반드시 이 문서를 다시 읽어라.**

---

## 1. 프로젝트 정의

### 한 줄 요약
밤여시 네이버 카페(2만+ 회원) 기반 유흥업소 구인구직 플랫폼. 업소 사장님이 광고비를 내고, 구직자(여성)가 무료로 일자리를 찾는다.

### 비즈니스 모델
수익원은 단 하나: **업소 사장님의 광고비**. 구직자는 완전 무료.

### 경쟁사
- 퀸알바(queenalba.net) — 2014년~ 운영, 업계 1위급, PHP 기반 레거시
- 여우알바(foxalba.io) — 패키지형 요금, 수동점프 기능 보유

### 우리의 무기
1. 밤여시 카페 2만+ 회원 = 광고주와 구직자 동시 확보
2. 2026년 기술(Next.js, 모바일퍼스트) vs 2014년 PHP 레거시
3. 업계의 고질적 문제(허위광고, 불신, 낡은 UX)를 해결

---

## 2. 기술 스택

```
프레임워크:   Next.js 15 App Router (TypeScript)
DB:          PostgreSQL + Prisma ORM  
인증:        NextAuth.js v5 (Credentials + 카카오 소셜로그인)
결제:        Toss Payments (카드 + 카카오페이 + 가상계좌)
배포:        Vercel
스타일:      Tailwind CSS + shadcn/ui
이미지:      Vercel Blob (추후 S3 마이그레이션 가능)
알림:        카카오 알림톡 API (Phase 3)
```

---

## 3. 경쟁사 완전 분석 (실제 확인 데이터)

### 3-1. 퀸알바 요금 체계

**구조: 줄광고(필수) + 상위 등급(선택) + 부가 옵션(선택) = 합산 결제**

| 등급 | 상품명 | 30일 | 60일 | 90일 | 자동점프 | 지역 수 | 비고 |
|---|---|---|---|---|---|---|---|
| 필수 | 줄광고 | 70,000 | 125,000 | 170,000 | 일10회 | 1개 | 모든 광고의 기반 |
| 6 | 추천 | 100,000 | 185,000 | 240,000 | 일20회 | 2개 | 급구 우측 |
| 5 | 급구 | 100,000 | 185,000 | 240,000 | 일20회 | 2개 | 메인 좌측하단, 진한 |
| 4 | 스페셜 | 130,000 | 235,000 | 310,000 | 일20회 | 2개 | 채용/지역 중단 |
| 3 | 프리미엄 | 180,000 | 325,000 | 430,000 | 일30회 | 3개 | 이력서 알림 포함 |
| 2 | 우대 | 230,000 | 415,000 | 550,000 | 일30회 | 3개 | 최고 위치, 알림 포함 |
| 1 | 특수배너 | 비공개 | 비공개 | 비공개 | - | 전체 | 23건 한정(현재 만석) |

**부가 옵션:**
| 옵션 | 30일 | 60일 | 90일 |
|---|---|---|---|
| 굵은글씨 | 30,000 | 55,000 | 70,000 |
| 아이콘(10종) | 30,000 | 55,000 | 70,000 |
| 형광펜(8종) | 30,000 | 55,000 | 70,000 |

**퀸알바의 강점:**
- 2014년부터 운영 → 인지도와 신뢰도
- 디자인 제작 포함 (사장님이 디자인 못해도 됨)
- 이력서 등록 알림 문자 (우대/프리미엄)
- 특수배너 만석 → 희소성으로 가격 정당화
- 카카오톡 실시간 상담 (1544-5568)

**퀸알바의 약점 (= 우리가 이길 포인트):**
- PHP 레거시 → 모바일 UX 최악, 느림, 디자인 구식
- 줄광고 자동점프 일10회뿐 → 기본 등급 광고주 불만
- 수동점프 없음 → 사장님이 원하는 시간에 노출 제어 불가
- 이력서 열람이 상위 등급만 → 기본 광고주 구직자 정보 접근 불가
- 급구 아이콘 별도 3만원 → 니켈앤다임 느낌
- 허위광고 검증 시스템 부재 → 구직자 불신
- 업소 후기/평가 시스템 없음 → 구직자가 업소 선택 시 정보 부족
- 광고 수정 1회 제한 → 사장님 불편

### 3-2. 여우알바 요금 체계

**구조: 올인원 패키지 (등급 하나만 선택)**

| 등급 | 30일 | 60일 | 90일 | 자동점프 | 수동점프 | 포함 |
|---|---|---|---|---|---|---|
| 1등급 | 330,000 | 620,000 | 890,000 | 일8회 | 일20회 | 박스+상단+특별구인+줄광고+구직열람 |
| 2등급 | 230,000 | 430,000 | 620,000 | 일6회 | 일10회 | 중간박스+상단+줄광고+구직열람 |
| 3등급 | 66,000 | 125,000 | 178,000 | 없음 | 일5회 | 전체구인+리스트+줄광고+구직열람 |

**여우알바의 강점:**
- 수동점프 기능 (사장님이 원하는 시간에 직접 끌어올리기)
- 구직이력서 열람이 전 등급 포함
- 올인원이라 상품 구조가 단순

**여우알바의 약점:**
- 최상위 33만원으로 퀸알바보다 비쌈
- 3단계뿐이라 세분화 불가, 업셀 기회 적음
- 자동점프가 1등급도 일8회뿐 (퀸알바 일30회 대비 매우 적음)
- 특별한 차별화 기능 없음

### 3-3. 업계 공통 문제점 (= 여시알바가 해결할 것)

1. **허위광고 만연**: 광고비만 받고 검증 없이 게재 → 구직자 피해
2. **모바일 UX 최악**: 대부분 PC 기반 PHP 사이트를 모바일로 억지 변환
3. **업소 정보 불투명**: 구직자가 업소 선택 시 후기/평가 정보 없음
4. **결제가 불편**: 대부분 무통장만, 카드결제 지원 미비
5. **광고 효과 측정 불가**: 사장님이 돈 쓰고도 효과를 모름
6. **커뮤니티 부재 또는 분리**: 구인구직과 커뮤니티가 별개 → 체류시간 짧음

---

## 4. 여시알바 가격 전략

### 핵심 원칙: "퀸알바와 같은 가격, 모든 등급에서 서비스 더 많이"

이건 단순히 자동점프 20% 더 주는 게 아니라, **퀸알바가 돈 받고 하는 걸 우리는 기본으로 제공**하는 전략이다.

### 4-1. 메인 상품 요금표

```typescript
// src/lib/constants/products.ts

export type DurationDays = 30 | 60 | 90;

export interface AdProduct {
  id: string;
  name: string;
  rank: number;           // 낮을수록 상위 (1=특수배너, 0=줄광고는 필수)
  required: boolean;      // true = 줄광고(필수 결제)
  description: string;
  position: string;       // 메인 페이지에서의 위치 설명
  maxRegions: number;     // 노출 가능 지역 수 (0 = 전체)
  autoJumpPerDay: number;
  manualJumpPerDay: number;
  includeResumeView: boolean;    // 이력서 열람 포함 여부
  includeDesignCount: number;    // 디자인 제작 무료 횟수
  includeResumeAlert: boolean;   // 이력서 등록 알림
  includeCafeAd: number;         // 밤여시 카페 연동 광고 횟수
  includeIconFree: boolean;      // 아이콘 무료 포함 (급구 전용)
  maxEdits: number;              // 광고 수정 가능 횟수
  maxSlots?: number;             // 최대 동시 광고 수 (특수배너용)
  pricing: Record<DurationDays, number>;
  vsQueen: string;               // 퀸알바 대비 차별점 (마케팅용)
}

export const AD_PRODUCTS: Record<string, AdProduct> = {
  LINE: {
    id: "LINE",
    name: "줄광고",
    rank: 99,
    required: true,
    description: "채용정보 리스트에 기본 노출",
    position: "채용정보 리스트",
    maxRegions: 1,
    autoJumpPerDay: 12,       // 퀸알바 10회 → +20%
    manualJumpPerDay: 0,
    includeResumeView: true,  // ★ 퀸알바는 상위만 → 우리는 기본부터
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: false,
    maxEdits: 1,
    pricing: { 30: 70_000, 60: 125_000, 90: 170_000 },
    vsQueen: "자동점프 +20%, 이력서열람 기본 포함",
  },

  RECOMMEND: {
    id: "RECOMMEND",
    name: "추천",
    rank: 6,
    required: false,
    description: "메인 하단 추천 영역에 배치",
    position: "메인 하단 추천 영역",
    maxRegions: 2,
    autoJumpPerDay: 24,       // 퀸알바 20회 → +20%
    manualJumpPerDay: 3,      // ★ 퀸알바에 없는 기능
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: false,
    maxEdits: 1,
    pricing: { 30: 100_000, 60: 185_000, 90: 240_000 },
    vsQueen: "자동점프 +20%, 수동점프 3회 추가",
  },

  URGENT: {
    id: "URGENT",
    name: "급구",
    rank: 5,
    required: false,
    description: "메인 좌측 하단, 진한 강조 노출",
    position: "메인 좌측 하단 (강조)",
    maxRegions: 2,
    autoJumpPerDay: 24,       // 퀸알바 20회 → +20%
    manualJumpPerDay: 5,
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: true,    // ★ 퀸알바는 아이콘 별도 3만원 → 무료
    maxEdits: 1,
    pricing: { 30: 100_000, 60: 185_000, 90: 240_000 },
    vsQueen: "자동점프 +20%, 수동점프 5회, 아이콘 무료(퀸알바 3만원)",
  },

  SPECIAL: {
    id: "SPECIAL",
    name: "스페셜",
    rank: 4,
    required: false,
    description: "채용정보/지역별 페이지 중단 배치",
    position: "채용/지역별 페이지 중단",
    maxRegions: 2,
    autoJumpPerDay: 28,       // 퀸알바 20회 → +40%
    manualJumpPerDay: 8,
    includeResumeView: true,
    includeDesignCount: 0,
    includeResumeAlert: false,
    includeCafeAd: 0,
    includeIconFree: false,
    maxEdits: 2,              // ★ 퀸알바 1회 → 2회
    pricing: { 30: 130_000, 60: 235_000, 90: 310_000 },
    vsQueen: "자동점프 +40%, 수동점프 8회, 수정 2회",
  },

  PREMIUM: {
    id: "PREMIUM",
    name: "프리미엄",
    rank: 3,
    required: false,
    description: "메인 우대 하단 프리미엄 영역 배치",
    position: "메인 우대 하단 (프리미엄 영역)",
    maxRegions: 3,
    autoJumpPerDay: 36,       // 퀸알바 30회 → +20%
    manualJumpPerDay: 12,
    includeResumeView: true,
    includeDesignCount: 1,    // 디자인 1회 무료
    includeResumeAlert: true, // ★ 이력서 알림
    includeCafeAd: 0,
    includeIconFree: false,
    maxEdits: 2,
    pricing: { 30: 180_000, 60: 325_000, 90: 430_000 },
    vsQueen: "자동점프 +20%, 수동점프 12회, 디자인+알림 포함",
  },

  VIP: {
    id: "VIP",
    name: "우대",
    rank: 2,
    required: false,
    description: "메인 중단 최고 위치 배치",
    position: "메인 중단 (최고 위치)",
    maxRegions: 3,
    autoJumpPerDay: 42,       // 퀸알바 30회 → +40%
    manualJumpPerDay: 18,
    includeResumeView: true,
    includeDesignCount: 2,    // 디자인 2회
    includeResumeAlert: true,
    includeCafeAd: 1,         // ★ 밤여시 카페 연동 1회
    includeIconFree: false,
    maxEdits: 3,              // ★ 퀸알바 2회 → 3회
    pricing: { 30: 230_000, 60: 415_000, 90: 550_000 },
    vsQueen: "자동점프 +40%, 수동점프 18회, 카페연동, 수정 3회",
  },

  BANNER: {
    id: "BANNER",
    name: "특수배너",
    rank: 1,
    required: false,
    description: "모든 페이지 최상단 배너 노출",
    position: "사이트 전체 최상단 배너",
    maxRegions: 0,            // 전체 노출
    autoJumpPerDay: 48,
    manualJumpPerDay: 24,
    includeResumeView: true,
    includeDesignCount: 3,
    includeResumeAlert: true,
    includeCafeAd: 2,
    includeIconFree: true,
    maxEdits: 5,
    maxSlots: 12,             // ★ 퀸알바 23건 → 12건 (더 희소)
    pricing: { 30: 350_000, 60: 650_000, 90: 900_000 },
    vsQueen: "12건 한정(퀸알바 23건), 카페연동 2회, 수정 5회",
  },
};

// ── 부가 옵션 ──
export const AD_OPTIONS = {
  BOLD: {
    id: "BOLD",
    name: "굵은글씨",
    description: "제목을 굵게 표시하여 리스트에서 눈에 띄게",
    pricing: { 30: 30_000, 60: 55_000, 90: 70_000 },
  },
  ICON: {
    id: "ICON",
    name: "아이콘",
    description: "10종 아이콘 중 선택하여 리스트에 아이콘 표시",
    choices: 10,
    pricing: { 30: 30_000, 60: 55_000, 90: 70_000 },
  },
  HIGHLIGHT: {
    id: "HIGHLIGHT",
    name: "형광펜",
    description: "8종 형광색 중 선택하여 리스트 배경 강조",
    choices: 8,
    pricing: { 30: 30_000, 60: 55_000, 90: 70_000 },
  },
  KAKAO_ALERT: {
    id: "KAKAO_ALERT",
    name: "카카오 알림톡",
    description: "신규 이력서 등록 시 카카오 알림톡으로 즉시 알림",
    pricing: { 30: 50_000, 60: 90_000, 90: 120_000 },
  },
} as const;
```

### 4-2. 퀸알바 대비 등급별 차별점 정리 (모든 곳에서 이김)

| 등급 | 항목 | 퀸알바 | 여시알바 | 차이 |
|---|---|---|---|---|
| 줄광고 | 자동점프 | 일10회 | 일12회 | +20% |
| 줄광고 | 이력서열람 | 없음 | **포함** | 완전 신규 |
| 추천 | 자동점프 | 일20회 | 일24회 | +20% |
| 추천 | 수동점프 | 없음 | **일3회** | 완전 신규 |
| 급구 | 아이콘 | 별도 3만원 | **무료 포함** | 3만원 절감 |
| 급구 | 수동점프 | 없음 | **일5회** | 완전 신규 |
| 스페셜 | 자동점프 | 일20회 | 일28회 | +40% |
| 스페셜 | 수동점프 | 없음 | **일8회** | 완전 신규 |
| 스페셜 | 수정 | 1회 | **2회** | +1회 |
| 프리미엄 | 자동점프 | 일30회 | 일36회 | +20% |
| 프리미엄 | 수동점프 | 없음 | **일12회** | 완전 신규 |
| 우대 | 자동점프 | 일30회 | 일42회 | +40% |
| 우대 | 수동점프 | 없음 | **일18회** | 완전 신규 |
| 우대 | 카페연동 | 없음 | **1회 포함** | 독보적 |
| 우대 | 수정 | 2회 | **3회** | +1회 |
| 특수배너 | 한정 | 23건 | **12건** | 더 희소 |
| 특수배너 | 카페연동 | 없음 | **2회 포함** | 독보적 |
| 전 등급 | 결제 | 카드/무통장 | **카드+무통장+카카오페이** | 편의 |
| 전 등급 | 업소검증 | 없음 | **사업자등록증 확인** | 신뢰 |
| 전 등급 | 모바일 | PHP 어거지 | **모바일퍼스트** | UX |

---

## 5. 퀸알바/여우알바에는 없는 여시알바만의 기능

### 5-1. 업소 인증 배지 시스템
```
사업자등록증 제출 → 관리자 확인 → "인증업소" 배지 부여
→ 구직자가 안심하고 지원 가능
→ 허위광고 사전 차단
→ 배지 있는 업소가 리스트에서 더 눈에 띔
```
퀸알바/여우알바 모두 돈만 받으면 광고 올려줌. 검증 없음. 이게 업계 최대 문제.

### 5-2. 구직자 업소 후기 시스템
```
실제 근무했던 구직자가 업소에 별점+후기 남김
→ 다른 구직자가 참고
→ 악성 업소 자연 도태
→ 커뮤니티 활성화 → 체류시간 증가 → 광고 가치 상승
```
밤여시 카페에 이미 이런 후기 문화가 있음. 이걸 플랫폼으로 가져오면 됨.

### 5-3. 밤여시 카페 연동
```
우대/특수배너 구매 시 → 밤여시 카페에 광고 게시물 자동(또는 수동) 등록
→ 카페 2만+ 회원에게 추가 노출
→ 경쟁사가 절대 따라할 수 없는 독보적 무기
```

### 5-4. 광고 성과 대시보드
```
사장님 마이페이지에서:
- 조회수 추이 (일별 그래프)
- 클릭수
- 이력서 열람 수
- 점프 이력
- 경쟁 업소 대비 노출 순위
```
퀸알바/여우알바에는 통계 기능이 없음. 사장님이 돈 쓰고도 효과를 모름.

### 5-5. 스마트 자동점프
```
기존: 24시간 균등 배분 (낮에도 밤에도 같은 빈도)
여시알바: 영업시간(18:00~06:00)에 70% 집중 배분
→ 구직자가 실제 활동하는 시간에 더 많이 노출
→ 같은 점프 횟수로도 효과 2배
```

---

## 6. 디렉토리 구조

```
src/
├── app/
│   ├── (public)/                 # 비로그인 접근 가능
│   │   ├── page.tsx                  # 메인 홈페이지
│   │   ├── jobs/page.tsx             # 채용정보 리스트 (지역별/직종별 필터)
│   │   ├── jobs/[id]/page.tsx        # 채용 상세 페이지
│   │   └── about/page.tsx            # 서비스 소개
│   │
│   ├── (auth)/                   # 인증
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx         # 구직자 회원가입
│   │   └── register/business/page.tsx # 업소 회원가입
│   │
│   ├── (business)/               # 업소 사장님 전용 (로그인 필수, role=BUSINESS)
│   │   ├── layout.tsx                # 사장님 레이아웃 (사이드바)
│   │   ├── dashboard/page.tsx        # 대시보드 (내 광고 현황, 통계 요약)
│   │   ├── ads/
│   │   │   ├── new/page.tsx          # ★ 광고 등록 (상품선택 + 정보입력 + 결제)
│   │   │   ├── [id]/page.tsx         # 광고 상세/관리
│   │   │   ├── [id]/edit/page.tsx    # 광고 수정
│   │   │   └── [id]/stats/page.tsx   # 광고 통계
│   │   ├── resumes/page.tsx          # 이력서 열람
│   │   └── profile/page.tsx          # 업소 프로필 관리
│   │
│   ├── (jobseeker)/              # 구직자 전용 (로그인 필수, role=JOBSEEKER)
│   │   ├── layout.tsx
│   │   ├── my-resume/page.tsx        # 내 이력서 관리
│   │   ├── scraps/page.tsx           # 스크랩한 채용공고
│   │   ├── reviews/page.tsx          # 내가 작성한 후기
│   │   └── profile/page.tsx          # 프로필 설정
│   │
│   ├── (admin)/                  # 관리자 전용 (role=ADMIN)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx        # 관리자 대시보드
│   │   ├── ads/page.tsx              # 광고 승인/관리
│   │   ├── payments/page.tsx         # 결제 관리 (무통장 입금 확인)
│   │   ├── users/page.tsx            # 회원 관리
│   │   ├── reviews/page.tsx          # 후기 관리 (신고된 후기 등)
│   │   └── settings/page.tsx         # 사이트 설정
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── ads/
│       │   ├── route.ts              # GET(리스트), POST(생성)
│       │   └── [id]/
│       │       ├── route.ts          # GET(상세), PATCH(수정), DELETE
│       │       └── stats/route.ts    # GET(통계)
│       ├── payments/
│       │   ├── create/route.ts       # 결제 생성 (orderId 발급)
│       │   ├── confirm/route.ts      # Toss 결제 승인
│       │   └── webhook/route.ts      # Toss 웹훅
│       ├── resumes/
│       │   ├── route.ts              # GET(리스트), POST(생성)
│       │   └── [id]/route.ts         # GET, PATCH, DELETE
│       ├── reviews/
│       │   ├── route.ts              # GET(업소별 후기), POST(작성)
│       │   └── [id]/route.ts         # PATCH, DELETE
│       ├── jump/route.ts             # POST(수동점프)
│       ├── scraps/route.ts           # 스크랩 토글
│       ├── admin/
│       │   ├── ads/[id]/approve/route.ts
│       │   ├── ads/[id]/reject/route.ts
│       │   ├── payments/[id]/approve/route.ts  # 무통장 입금 승인
│       │   └── users/route.ts
│       ├── cron/
│       │   ├── auto-jump/route.ts        # 자동점프 (매 10분)
│       │   ├── expire-ads/route.ts       # 만료 광고 처리 (매시간)
│       │   ├── expire-pending/route.ts   # 미입금 48h 자동 취소 (매시간)
│       │   └── reset-manual-jump/route.ts # 수동점프 카운터 리셋 (매일 0시)
│       └── upload/route.ts               # 이미지 업로드
│
├── components/
│   ├── ads/
│   │   ├── AdCard.tsx                # 리스트용 카드 (등급별 스타일링)
│   │   ├── AdDetail.tsx              # 상세 페이지 컨텐츠
│   │   ├── AdRegistrationForm.tsx    # 등록폼 (멀티스텝)
│   │   ├── ProductSelector.tsx       # 상품+옵션 선택 + 합산 계산
│   │   ├── JumpButton.tsx            # 수동점프 (잔여횟수 표시)
│   │   └── AdBadge.tsx               # 등급 뱃지 (급구/추천/VIP 등)
│   ├── payment/
│   │   ├── TossPaymentWidget.tsx     # Toss 위젯 래퍼
│   │   ├── BankTransferInfo.tsx      # 무통장 안내
│   │   └── PriceSummary.tsx          # 합산 금액 실시간 계산
│   ├── resume/
│   │   ├── ResumeForm.tsx
│   │   └── ResumeCard.tsx
│   ├── review/
│   │   ├── ReviewForm.tsx            # 후기 작성
│   │   ├── ReviewCard.tsx            # 후기 카드
│   │   └── StarRating.tsx            # 별점
│   ├── layout/
│   │   ├── Header.tsx                # 메인 헤더 (모바일 반응형)
│   │   ├── Footer.tsx
│   │   ├── MobileBottomNav.tsx       # 모바일 하단 탭바
│   │   └── BusinessSidebar.tsx       # 사장님 사이드바
│   └── ui/                           # shadcn/ui 기반
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── auth.config.ts
│   ├── toss/
│   │   ├── client.ts
│   │   ├── confirm.ts
│   │   └── webhook.ts
│   ├── constants/
│   │   ├── products.ts               # 위의 AD_PRODUCTS, AD_OPTIONS
│   │   ├── regions.ts                # 지역 데이터
│   │   └── business-types.ts         # 업종 데이터
│   ├── validators/
│   │   ├── ad.ts
│   │   ├── payment.ts
│   │   └── review.ts
│   └── utils/
│       ├── format.ts
│       ├── jump-scheduler.ts         # 스마트 점프 시간 계산
│       └── cron-auth.ts
│
└── types/
    └── index.ts
```

---

## 7. Prisma 스키마

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ── ENUMS ──

enum UserRole {
  JOBSEEKER
  BUSINESS
  ADMIN
}

enum AdStatus {
  DRAFT
  PENDING_PAYMENT
  PENDING_DEPOSIT       // 무통장 입금 대기
  PENDING_REVIEW        // 관리자 검토 대기
  ACTIVE
  PAUSED
  EXPIRED
  REJECTED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  APPROVED
  FAILED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  KAKAO_PAY
}

enum AdProductId {
  LINE
  RECOMMEND
  URGENT
  SPECIAL
  PREMIUM
  VIP
  BANNER
}

enum AdOptionId {
  BOLD
  ICON
  HIGHLIGHT
  KAKAO_ALERT
}

enum JumpType {
  AUTO
  MANUAL
}

enum BusinessType {
  KARAOKE
  ROOM_SALON
  TEN_CAFE
  SHIRT_ROOM
  LEGGINGS_ROOM
  PUBLIC_BAR
  HYPER_PUBLIC
  BAR_LOUNGE
  CLUB
  MASSAGE
  GUANRI
  OTHER
}

enum Region {
  SEOUL
  GYEONGGI
  INCHEON
  BUSAN
  DAEGU
  DAEJEON
  GWANGJU
  ULSAN
  SEJONG
  GANGWON
  CHUNGBUK
  CHUNGNAM
  JEONBUK
  JEONNAM
  GYEONGBUK
  GYEONGNAM
  JEJU
}

// ── AUTH ──

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String @unique
  expires    DateTime
  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ── USER ──

model User {
  id              String      @id @default(cuid())
  name            String?
  email           String?     @unique
  emailVerified   DateTime?
  image           String?
  phone           String?     @unique
  hashedPassword  String?
  role            UserRole    @default(JOBSEEKER)

  // 업소 사장님 전용
  businessName    String?
  businessNumber  String?     // 사업자등록번호
  isVerifiedBiz   Boolean     @default(false)  // 사업자 인증 완료 여부

  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  accounts        Account[]
  sessions        Session[]
  ads             Ad[]
  payments        Payment[]
  resumes         Resume[]
  reviews         Review[]
  scraps          Scrap[]
  jumpLogs        JumpLog[]
  notifications   Notification[]
  @@index([role])
  @@map("users")
}

// ── AD (광고 = 채용공고) ──

model Ad {
  id              String        @id @default(cuid())
  userId          String

  // 업소 정보
  businessName    String
  businessType    BusinessType
  contactPhone    String
  contactKakao    String?

  // 채용 조건
  title           String
  description     String        @db.Text
  salaryText      String        // "시급 15,000~25,000+α" 자유 입력
  workHours       String?       // "PM 7:00 ~ AM 3:00"
  benefits        String?       @db.Text  // 복리후생/혜택

  // 위치
  regions         Region[]      // 노출 지역
  address         String?
  addressDetail   String?

  // 광고 상품
  productId       AdProductId
  durationDays    Int           // 30, 60, 90
  totalAmount     Int           // 최종 결제 금액

  // 노출 상태
  status          AdStatus      @default(DRAFT)
  startDate       DateTime?
  endDate         DateTime?

  // 점프 시스템
  autoJumpPerDay   Int          @default(0)
  manualJumpPerDay Int          @default(0)
  manualJumpUsedToday Int       @default(0)
  lastJumpedAt     DateTime     @default(now())  // 정렬 기준
  lastManualJumpAt DateTime?

  // 이미지
  imageUrl        String?       // 박스형 배너 이미지
  thumbnailUrl    String?

  // 통계
  viewCount       Int           @default(0)
  clickCount      Int           @default(0)

  // 수정
  editCount       Int           @default(0)
  maxEdits        Int           @default(1)

  // 인증
  isVerified      Boolean       @default(false)  // 관리자 검수 완료

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id])
  options         AdOption[]
  payments        Payment[]
  jumpLogs        JumpLog[]
  reviews         Review[]
  scraps          Scrap[]
  dailyMetrics    AdDailyMetric[]

  @@index([status, lastJumpedAt(sort: Desc)])
  @@index([status, productId])
  @@index([userId])
  @@index([regions])
  @@index([businessType])
  @@index([startDate, endDate])
  @@map("ads")
}

model AdOption {
  id           String     @id @default(cuid())
  adId         String
  optionId     AdOptionId
  value        String?    // 아이콘 번호("3"), 형광펜 색상("yellow") 등
  durationDays Int
  startDate    DateTime?
  endDate      DateTime?
  createdAt    DateTime   @default(now())
  ad           Ad         @relation(fields: [adId], references: [id], onDelete: Cascade)
  @@index([adId])
  @@map("ad_options")
}

// ── PAYMENT ──

model Payment {
  id              String        @id @default(cuid())
  userId          String
  adId            String?

  orderId         String        @unique
  amount          Int
  method          PaymentMethod
  status          PaymentStatus @default(PENDING)

  // Toss
  tossPaymentKey  String?       @unique
  cardCompany     String?
  cardNumber      String?
  receiptUrl      String?

  // 무통장
  bankName        String?
  accountNumber   String?
  depositorName   String?

  // 상품 내역 스냅샷
  itemSnapshot    Json          // { product, options, duration, breakdown }

  // 세금계산서
  taxInvoice      Boolean       @default(false)
  taxBizNumber    String?

  paidAt          DateTime?
  failedAt        DateTime?
  failReason      String?
  refundedAt      DateTime?
  refundAmount    Int?
  refundReason    String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id])
  ad              Ad?           @relation(fields: [adId], references: [id])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

// ── JUMP ──

model JumpLog {
  id       String   @id @default(cuid())
  adId     String
  userId   String
  type     JumpType
  jumpedAt DateTime @default(now())
  ad       Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])
  @@index([adId, jumpedAt])
  @@map("jump_logs")
}

// ── RESUME (구직자 이력서) ──

model Resume {
  id           String        @id @default(cuid())
  userId       String        @unique  // 1인 1이력서
  nickname     String
  age          Int?
  region       Region
  district     String?
  desiredJobs  BusinessType[]
  experience   String?
  introduction String?       @db.Text
  isPublic     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([region])
  @@index([isPublic, createdAt])
  @@map("resumes")
}

// ── REVIEW (업소 후기) ──

model Review {
  id        String   @id @default(cuid())
  adId      String
  userId    String
  rating    Int      // 1~5
  content   String   @db.Text
  isHidden  Boolean  @default(false) // 신고로 숨겨진 후기
  createdAt DateTime @default(now())
  ad        Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  @@unique([adId, userId])  // 1인 1후기
  @@index([adId])
  @@map("reviews")
}

// ── SCRAP (스크랩/찜) ──

model Scrap {
  id        String   @id @default(cuid())
  userId    String
  adId      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ad        Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  @@unique([userId, adId])
  @@index([userId])
  @@map("scraps")
}

// ── 통계 ──

model AdDailyMetric {
  id         String   @id @default(cuid())
  adId       String
  date       DateTime @db.Date
  views      Int      @default(0)
  clicks     Int      @default(0)
  ad         Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  @@unique([adId, date])
  @@map("ad_daily_metrics")
}

// ── NOTIFICATION ──

model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String   @db.Text
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead])
  @@map("notifications")
}
```

---

## 8. 결제 플로우

### 8-1. 카드 / 카카오페이
```
1) 사장님: 상품 선택 + 정보 입력 완료
2) POST /api/payments/create
   → Ad 생성 (status: PENDING_PAYMENT)
   → Payment 생성 (status: PENDING)
   → { orderId, amount, orderName } 반환
3) 프론트: Toss Payments 위젯 호출
   → requestPayment({ orderId, amount, method: "카드" 또는 "카카오페이" })
4) 성공 → /business/ads/new/success?paymentKey=...&orderId=...&amount=...
5) POST /api/payments/confirm
   → Toss API confirmPayment 호출
   → Payment: PENDING → APPROVED
   → Ad: PENDING_PAYMENT → ACTIVE
   → startDate = now(), endDate = startDate + durationDays
   → 자동점프 스케줄 활성화
   → 알림 발송
```

### 8-2. 무통장 입금
```
1) 사장님: 상품 선택 + 정보 입력 + 무통장 선택
2) POST /api/payments/create
   → Ad 생성 (status: PENDING_DEPOSIT)
   → Payment 생성 (status: PENDING, method: BANK_TRANSFER)
   → 입금 안내 화면: 계좌번호, 금액, 입금자명 안내
3) 관리자: /admin/payments에서 입금 확인
   → POST /api/admin/payments/[id]/approve
   → Payment: PENDING → APPROVED
   → Ad: PENDING_DEPOSIT → ACTIVE
   → startDate = 승인시점, endDate 계산
   → 알림톡 발송
4) 48시간 미입금:
   → cron /api/cron/expire-pending
   → Payment: CANCELLED, Ad: CANCELLED
```

### 8-3. 환불
```
- 24시간 이내 + 미노출: 100% 환불
- 7일 이내: 잔여기간 비례 70%
- 7일 초과: 불가 (사이트 장애 시 기간 연장)
- 무통장: 본인 계좌 3영업일 이내
```

---

## 9. 점프 시스템

### 9-1. 자동점프 (cron: 매 10분)
```
GET /api/cron/auto-jump  (Vercel Cron, 인증 필요)

1. ACTIVE 광고 중 현재 startDate~endDate 범위 내인 것 조회
2. 각 광고의 다음 점프 시간 계산:
   - 영업시간(18:00~06:00 KST): 전체 점프의 70%
   - 비영업시간(06:00~18:00 KST): 전체 점프의 30%
   - 예: 우대 일42회 → 영업시간에 ~30회(24분 간격), 비영업시간에 ~12회(60분 간격)
3. lastJumpedAt + 간격 < now() 이면 점프 실행
4. 점프: Ad.lastJumpedAt = now(), JumpLog 기록
5. 리스트 정렬: status=ACTIVE → lastJumpedAt DESC
```

### 9-2. 수동점프
```
POST /api/jump  { adId }

1. 해당 Ad가 본인 소유 + ACTIVE 상태 확인
2. manualJumpUsedToday < manualJumpPerDay 확인
3. lastManualJumpAt + 30분 < now() 확인 (쿨다운)
4. 실행:
   - Ad.lastJumpedAt = now()
   - Ad.lastManualJumpAt = now()
   - Ad.manualJumpUsedToday += 1
   - JumpLog 기록 (type: MANUAL)
5. 응답: { remaining: manualJumpPerDay - manualJumpUsedToday - 1, nextAvailable: now + 30min }
```

### 9-3. 일일 리셋 (cron: 매일 00:00 KST)
```
GET /api/cron/reset-manual-jump
→ UPDATE ads SET manualJumpUsedToday = 0 WHERE status = 'ACTIVE'
```

---

## 10. 메인 페이지 레이아웃

```
┌─────────────────────────────────────────┐
│  [로고]  [지역선택▼]  [업종선택▼]  [검색]  │  ← 헤더
│  [로그인] [회원가입] [광고등록]            │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │    특수배너 (슬라이드, 최대12건)    │    │  ← BANNER 등급
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  ★ 우대 채용정보        [더보기]          │  ← VIP 등급
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 박스형 │ │ 박스형 │ │ 박스형 │ │ 박스형 │  │    박스형 카드 (이미지)
│  │ 광고1  │ │ 광고2  │ │ 광고3  │ │ 광고4  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
├─────────────────────────────────────────┤
│  ★ 프리미엄 채용정보     [더보기]          │  ← PREMIUM 등급
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 박스형 │ │ 박스형 │ │ 박스형 │ │ 박스형 │  │    박스형 카드 (이미지)
│  └──────┘ └──────┘ └──────┘ └──────┘  │
├─────────────────────────────────────────┤
│  ★ 스페셜 채용정보       [더보기]          │  ← SPECIAL 등급
│  ┌─────────────────────────────────┐    │
│  │ 줄광고1 (스페셜)     강남 | 룸싸롱   │    │    줄형 (텍스트 강조)
│  │ 줄광고2 (스페셜)     홍대 | 바라운지  │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  ┌───────────┐  ★ 급구 채용정보          │  ← URGENT(좌) + RECOMMEND(우)
│  │ 급구 리스트  │  ★ 추천 채용정보          │
│  │ (진한 배경)  │  ┌─────────────────┐    │
│  │ 급구1       │  │ 추천1  추천2  추천3 │    │
│  │ 급구2       │  │ 추천4  추천5  추천6 │    │
│  │ 급구3       │  └─────────────────┘    │
│  └───────────┘                          │
├─────────────────────────────────────────┤
│  전체 채용정보 (줄광고)    [지역▼] [업종▼]   │  ← LINE 등급 (필수)
│  ┌─────────────────────────────────┐    │
│  │ 🔥업소명 | 강남 | 텐카페 | 시급 25~   │    │    lastJumpedAt DESC 정렬
│  │ 💎업소명 | 홍대 | 바 | 시급 20~      │    │    굵은글씨/아이콘/형광펜 적용
│  │   업소명 | 부산 | 룸싸롱 | 시급 18~   │    │    인증업소 배지 표시
│  │   ...                              │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  [커뮤니티]  [이벤트]  [공지사항]           │  ← 하단
│  [이용약관]  [개인정보처리방침]              │
└─────────────────────────────────────────┘
```

모바일에서는 각 섹션이 세로로 풀스크린 스와이프 되는 형태.

---

## 11. 광고 등록 플로우 (멀티스텝 폼)

```
Step 1: 업소 정보 입력
  - 업소명 (필수)
  - 업종 선택 (BusinessType enum)
  - 연락처 (필수)
  - 카카오톡 ID (선택)
  - 주소 (선택)
  - 사업자등록증 업로드 (선택 → 인증배지 받으려면 필수)

Step 2: 채용 정보 입력
  - 채용 제목 (필수, 30자 이내)
  - 급여 (자유 입력: "시급 15,000~25,000+α")
  - 근무시간 (선택)
  - 혜택/복리후생 (선택, 텍스트)
  - 상세 설명 (필수, 에디터)
  - 이미지 업로드 (박스형 광고용, 선택)

Step 3: 광고 상품 선택
  - 노출 지역 선택 (등급별 1~3개)
  - 기간 선택: 30일 / 60일 / 90일
  - 줄광고 (필수, 자동 선택됨)
  - 상위 등급 선택 (선택, 라디오: 추천~특수배너)
  - 부가 옵션 선택 (선택, 체크박스: 굵은글씨/아이콘/형광펜/알림톡)
  - ★ 합산 금액 실시간 표시 (하단 고정 바)

Step 4: 결제
  - 주문 요약 (상품 + 옵션 + 금액)
  - 결제 수단 선택: 카드 / 카카오페이 / 무통장
  - 세금계산서 발행 여부 (사업자등록번호 입력)
  - 이용약관 동의
  - 결제 버튼
```

---

## 12. 개발 순서 (엄격히 지킬 것)

### Phase 1: MVP — 이것만 하면 매출 발생 (3~4주)
```
1.  프로젝트 셋업 (Next.js + Prisma + Tailwind + shadcn/ui)
2.  Prisma 스키마 적용 + DB 마이그레이션
3.  인증: 이메일/비밀번호 로그인 + 회원가입 (구직자/업소 구분)
4.  메인 홈페이지 (광고 리스트 — 줄광고만)
5.  채용 상세 페이지
6.  광고 등록폼 (4단계 멀티스텝)
7.  상품 선택 UI + 합산 금액 계산 (줄광고 + 급구 + 추천만)
8.  무통장 입금 결제 (Payment 생성 → 입금 안내 → 관리자 승인)
9.  관리자 페이지 (광고 목록 + 입금 확인 승인 버튼)
10. 자동점프 cron (/api/cron/auto-jump)
11. 만료 처리 cron (/api/cron/expire-ads)
12. 미입금 취소 cron (/api/cron/expire-pending)
13. 모바일 반응형 전체 적용
```

### Phase 2: 결제 + 등급 확장 (2~3주)
```
14. Toss Payments 카드 결제 연동
15. 카카오페이 연동
16. 스페셜 / 프리미엄 / 우대 등급 오픈 (메인 레이아웃 섹션 추가)
17. 수동점프 기능 (API + UI)
18. 수동점프 리셋 cron
19. 부가 옵션: 굵은글씨 / 아이콘 / 형광펜
20. 광고 수정 기능 (editCount 체크)
```

### Phase 3: 차별화 (3~4주)
```
21. 특수배너 등급 (12건 한정, 슬라이드 배너)
22. 카카오 소셜 로그인
23. 이력서 등록/열람 시스템
24. 이력서 등록 알림 (프리미엄 이상)
25. 업소 인증 배지 (사업자등록증 제출 → 관리자 확인)
26. 구직자 업소 후기/별점 시스템
27. 구직자 스크랩(찜) 기능
28. 사장님 광고 통계 대시보드
29. 카카오 알림톡 옵션
30. 밤여시 카페 연동 (수동, 추후 자동화)
```

---

## 13. 절대 규칙

1. **줄광고 없이 상위 등급 결제 불가** — ProductSelector에서 줄광고 미선택 시 상위 등급 비활성화
2. **옵션만 단독 결제 불가** — 줄광고 필수
3. **특수배너 12건 초과 시 구매 불가** — ACTIVE 상태 BANNER 카운트 체크
4. **수동점프 쿨다운 30분** — lastManualJumpAt + 30min 체크
5. **수동점프 일일 리셋** — KST 자정 기준
6. **무통장 48시간 미입금 자동 취소** — cron으로 체크
7. **모든 금액은 VAT 포함** — 별도 세금 계산 없음
8. **모바일 퍼스트** — 모든 페이지 모바일 우선 설계
10. **Phase 순서 엄격히 준수** — Phase 1 완성 전에 Phase 2 착수 금지
```
