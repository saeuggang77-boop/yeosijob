# 여시알바 (YeosiAlba) - 사이트 전체 구조 분석

> **최종 업데이트**: 2026-03-16
> **도메인**: yeosijob.com
> **핵심 비즈니스**: 유흥업소 구인구직 + 제휴업체(성형/미용/렌탈/금융) 광고 플랫폼

---

## 1. 기술 스택

| 항목 | 버전/상세 |
|------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| ORM | Prisma 7.4.1 |
| DB | PostgreSQL (Neon) |
| Auth | NextAuth 5.0.0-beta.30 (JWT) |
| 배포 | Vercel |
| 캐시/Rate Limit | Upstash Redis |
| 파일 저장 | Vercel Blob |
| 이메일 | Resend |
| 결제 | 계좌이체 (신한은행) + 관리자 수동승인 |
| 푸시 알림 | Web Push |
| AI | Anthropic SDK (자기소개 생성, 자동 콘텐츠) |
| UI | Tailwind CSS 4 + Radix UI + shadcn |
| E2E 테스트 | Playwright 1.58.2 |
| 유효성 검증 | Zod 4.3.6 |
| 개발서버 | localhost:3001 |

---

## 2. 사용자 역할 (3종)

| 역할 | 설명 | 접근 가능 영역 |
|------|------|---------------|
| **JOBSEEKER** | 구직자 (유흥업소 여성) | 공개 + /jobseeker/* |
| **BUSINESS** | 사장님 (유흥업소 + 제휴업체 공통) | 공개 + /business/* |
| **ADMIN** | 관리자 | 전체 접근 |

> **주의**: BUSINESS 역할은 유흥업소와 제휴업체가 공통. 가입 시점에 구분 불가.

---

## 3. 전체 페이지 (79개)

### 3-1. 공개 페이지 (23개)
| 경로 | 설명 |
|------|------|
| `/` | 홈페이지 (지역 필터 + 배너 + 추천 + 급구 + 일반 공고) |
| `/jobs` | 채용정보 리스트 (지역/업종/검색 필터) |
| `/jobs/[id]` | 공고 상세 |
| `/resumes` | 이력서 리스트 (BUSINESS만 열람) |
| `/community` | 커뮤니티 게시판 |
| `/community/new` | 글쓰기 |
| `/community/[id]` | 게시글 상세 |
| `/community/[id]/edit` | 게시글 수정 |
| `/partner` | 제휴업체 리스트 |
| `/partner/[id]` | 제휴업체 상세 |
| `/partner/pay/[token]` | 제휴업체 결제 (토큰 기반) |
| `/partner/pay/[token]/success` | 제휴업체 결제 성공 |
| `/partner/pay/[token]/fail` | 제휴업체 결제 실패 |
| `/pricing` | 요금제 안내 |
| `/notice` | 공지사항 리스트 |
| `/notice/[id]` | 공지사항 상세 |
| `/notifications` | 알림 목록 (로그인 필요) |
| `/messages` | 쪽지함 (로그인 필요) |
| `/messages/[userId]` | 1:1 쪽지 대화 |
| `/about` | 소개 페이지 |
| `/privacy` | 개인정보처리방침 |
| `/terms` | 이용약관 |
| `/verify-age/callback` | 성인인증 콜백 |

### 3-2. 인증 페이지 (8개)
| 경로 | 설명 |
|------|------|
| `/login` | 로그인 |
| `/register` | 회원가입 선택 (구직자/사장님) |
| `/register/jobseeker` | 구직자 회원가입 |
| `/register/business` | 사장님 회원가입 |
| `/forgot-password` | 비밀번호 찾기 |
| `/reset-password` | 비밀번호 재설정 |
| `/find-email` | 이메일 찾기 |
| `/verify-email` | 이메일 인증 |

### 3-3. 구직자 페이지 (5개)
| 경로 | 설명 |
|------|------|
| `/jobseeker/my-resume` | 내 이력서 관리 |
| `/jobseeker/applications` | 지원 내역 |
| `/jobseeker/scraps` | 스크랩한 공고 |
| `/jobseeker/reviews` | 내 리뷰 관리 |
| `/jobseeker/profile` | 프로필 설정 |

### 3-4. 사장님 페이지 (16개)
| 경로 | 설명 |
|------|------|
| `/business/dashboard` | 대시보드 (내 광고 현황) |
| `/business/ads/new` | 새 광고 등록 |
| `/business/ads/new/success` | 결제 성공 |
| `/business/ads/new/fail` | 결제 실패 |
| `/business/ads/[id]` | 광고 상세 |
| `/business/ads/[id]/edit` | 광고 수정 |
| `/business/ads/[id]/payment` | 광고 결제 |
| `/business/ads/[id]/stats` | 광고 통계 |
| `/business/ads/[id]/upgrade` | 등급 업그레이드 |
| `/business/ads/[id]/renew` | 광고 연장 |
| `/business/payments` | 결제 내역 |
| `/business/resumes` | 이력서 열람 |
| `/business/resumes/[id]` | 이력서 상세 열람 |
| `/business/profile` | 업체 프로필 |
| `/business/partner` | 내 제휴업체 관리 |
| `/business/partner/[id]/edit` | 제휴업체 수정 |

### 3-5. 관리자 페이지 (26개)
| 경로 | 설명 |
|------|------|
| `/admin` | 관리자 홈 (리다이렉트) |
| `/admin/dashboard` | 관리자 대시보드 |
| `/admin/ads` | 광고 관리 |
| `/admin/ads/[id]` | 광고 상세/심사 |
| `/admin/users` | 회원 관리 |
| `/admin/resumes` | 이력서 관리 |
| `/admin/resumes/[id]` | 이력서 상세 |
| `/admin/payments` | 결제 관리 (입금확인) |
| `/admin/posts` | 게시글 관리 |
| `/admin/reviews` | 리뷰 관리 |
| `/admin/reports` | 신고 관리 |
| `/admin/notices` | 공지사항 관리 |
| `/admin/notices/new` | 공지사항 작성 |
| `/admin/notices/[id]/edit` | 공지사항 수정 |
| `/admin/partners` | 제휴업체 관리 |
| `/admin/partners/[id]` | 제휴업체 상세 |
| `/admin/partners/new` | 제휴업체 등록 |
| `/admin/events` | 이벤트 관리 |
| `/admin/verification` | 사업자 인증 관리 |
| `/admin/settings` | 사이트 설정 |
| `/admin/auto-content` | 자동 콘텐츠 관리 |
| `/admin/auto-content/keywords` | 키워드 관리 |
| `/admin/cafe-sync` | 카페 연동 |
| `/admin/banned` | 차단 회원 관리 |
| `/admin/spam` | 스팸 단어 관리 |
| `/admin/trash` | 휴지통 |

### 3-6. 설정 페이지 (1개)
| 경로 | 설명 |
|------|------|
| `/settings/notifications` | 알림 설정 |

---

## 4. 전체 API 엔드포인트 (105개)

### 4-1. 인증 (12개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | - | NextAuth 핸들러 |
| `/api/auth/register` | POST | 비회원 | 회원가입 |
| `/api/auth/verify-email` | GET | - | 이메일 인증 |
| `/api/auth/verify-age` | POST | 로그인 | 성인인증 요청 |
| `/api/auth/verify-age/status` | GET | 로그인 | 성인인증 상태 |
| `/api/auth/verify-business` | POST | BUSINESS | 사업자 인증 |
| `/api/auth/find-email` | POST | - | 이메일 찾기 |
| `/api/auth/forgot-password` | POST | - | 비밀번호 찾기 |
| `/api/auth/reset-password` | POST | - | 비밀번호 재설정 |
| `/api/auth/change-password` | POST | 로그인 | 비밀번호 변경 |
| `/api/auth/update-profile` | POST | 로그인 | 프로필 수정 |
| `/api/auth/delete-account` | POST | 로그인 | 회원탈퇴 |

### 4-2. 광고 (8개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/ads` | GET/POST | GET:공개, POST:BUSINESS | 광고 목록/등록 |
| `/api/ads/[id]` | GET/PUT/DELETE | GET:공개, PUT/DELETE:소유자 | 광고 상세/수정/삭제 |
| `/api/ads/[id]/jump` | POST | BUSINESS(소유자) | 수동 점프 |
| `/api/ads/[id]/apply` | POST | JOBSEEKER | 지원하기 |
| `/api/ads/[id]/stats` | GET | BUSINESS(소유자) | 광고 통계 |
| `/api/ads/[id]/renew` | POST | BUSINESS(소유자) | 광고 연장 |
| `/api/ads/[id]/upgrade` | POST | BUSINESS(소유자) | 등급 업그레이드 |
| `/api/ads/upload-image` | POST | BUSINESS | 광고 이미지 업로드 |

### 4-3. 결제 (5개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/payments/confirm` | POST | BUSINESS | 결제 신청 (계좌번호 발급 + 증빙서류 저장) |
| `/api/payments/webhook` | POST | - | 비활성화 (404 반환) |
| `/api/admin/payments/[id]/approve` | POST | ADMIN | 관리자 입금확인 |
| `/api/admin/payments/[id]/cancel` | POST | ADMIN | 관리자 결제 취소 |
| `/api/admin/payments/export` | GET | ADMIN | 세금계산서 엑셀 다운로드 |

### 4-4. 이력서 (6개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/resumes` | GET/POST | GET:BUSINESS, POST:JOBSEEKER | 이력서 목록/등록 |
| `/api/resumes/mine` | GET | JOBSEEKER | 내 이력서 |
| `/api/resumes/bump` | POST | JOBSEEKER | 이력서 끌어올리기 |
| `/api/resumes/refresh` | POST | JOBSEEKER | 이력서 갱신 |
| `/api/resumes/generate-intro` | POST | JOBSEEKER | AI 자기소개 생성 |
| `/api/resumes/[id]/contact` | POST | BUSINESS | 이력서 연락처 열람 |

### 4-5. 커뮤니티 (11개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/posts` | GET/POST | GET:공개, POST:로그인 | 게시글 목록/작성 |
| `/api/posts/[id]` | GET/PUT/DELETE | GET:공개, PUT/DELETE:작성자 | 게시글 상세/수정/삭제 |
| `/api/posts/[id]/like` | POST | 로그인 | 좋아요 토글 |
| `/api/posts/[id]/comments` | GET/POST | GET:공개, POST:로그인 | 댓글 목록/작성 |
| `/api/posts/[id]/comments/[commentId]` | DELETE | 작성자 | 댓글 삭제 |
| `/api/posts/[id]/comments/[commentId]/edit` | PUT | 작성자 | 댓글 수정 |
| `/api/posts/[id]/comments/[commentId]/like` | POST | 로그인 | 댓글 좋아요 |
| `/api/posts/anonymous-status` | GET | 로그인 | 익명 상태 확인 |
| `/api/posts/upload-image` | POST | 로그인 | 게시글 이미지 업로드 |
| `/api/users/[id]/posts` | GET | 공개 | 유저별 게시글 |
| `/api/upload` | POST | 로그인 | 범용 이미지 업로드 |

### 4-6. 쪽지 (5개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/messages` | GET | 로그인 | 대화 목록 |
| `/api/messages/[userId]` | GET/POST | 로그인 | 대화 읽기/보내기 |
| `/api/messages/[userId]/read` | POST | 로그인 | 읽음 처리 |
| `/api/messages/unread-count` | GET | 로그인 | 안읽은 수 |
| `/api/messages/can-send` | GET | 로그인 | 쪽지 가능 여부 |
| `/api/messages/block` | POST | 로그인 | 차단/해제 |

### 4-7. 알림/푸시 (4개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/notifications` | GET | 로그인 | 알림 목록 |
| `/api/notifications/[id]` | PATCH/DELETE | 로그인 | 읽음/삭제 |
| `/api/notifications/settings` | GET/PUT | 로그인 | 알림 설정 |
| `/api/push/subscribe` | POST | 로그인 | 푸시 구독 |
| `/api/push/unsubscribe` | POST | 로그인 | 푸시 해제 |

### 4-8. 리뷰/스크랩/신고 (5개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/reviews` | GET/POST | POST:JOBSEEKER | 리뷰 목록/작성 |
| `/api/reviews/[id]` | PUT/DELETE | 작성자 | 리뷰 수정/삭제 |
| `/api/scraps` | GET/POST/DELETE | 로그인 | 스크랩 관리 |
| `/api/reports` | POST | 로그인 | 신고 접수 |
| `/api/reports/[id]` | PATCH | ADMIN | 신고 처리 |

### 4-9. 제휴업체 (7개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/partners` | GET | 공개 | 제휴업체 목록 |
| `/api/partners/[id]` | GET | 공개 | 제휴업체 상세 |
| `/api/partners/[id]/renew` | POST | BUSINESS(소유자) | 제휴업체 연장 |
| `/api/partners/pay/[token]` | GET | 공개(토큰) | 결제 정보 조회 |
| `/api/partners/pay/[token]/confirm` | POST | 공개(토큰) | 결제 확인 |
| `/api/business/partners/[id]` | GET/PUT | BUSINESS(소유자) | 내 제휴업체 관리 |
| `/api/verification` | POST | BUSINESS | 사업자 인증 요청 |

### 4-10. 공지/이벤트 (3개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/notices` | GET | 공개 | 공지 목록 |
| `/api/notices/[id]` | GET | 공개 | 공지 상세 |
| `/api/events/active` | GET | 공개 | 현재 활성 이벤트 |

### 4-11. 관리자 - 회원/콘텐츠 (12개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/admin/users/[id]` | GET/PATCH | ADMIN | 회원 상세/수정 |
| `/api/admin/users/[id]/credits` | POST | ADMIN | 크레딧 지급 |
| `/api/admin/ads/[id]` | GET/PATCH | ADMIN | 광고 관리 |
| `/api/admin/ads/[id]/approve` | POST | ADMIN | 광고 승인 |
| `/api/admin/ads/[id]/reject` | POST | ADMIN | 광고 거절 |
| `/api/admin/resumes/[id]` | GET/DELETE | ADMIN | 이력서 관리 |
| `/api/admin/posts/[id]/hide` | POST | ADMIN | 게시글 숨김 |
| `/api/admin/reviews/[id]` | DELETE | ADMIN | 리뷰 삭제 |
| `/api/admin/verification/[id]` | PATCH | ADMIN | 사업자 인증 처리 |
| `/api/admin/banned` | GET/POST/DELETE | ADMIN | 차단 회원 관리 |
| `/api/admin/spam` | GET/POST/DELETE | ADMIN | 스팸 단어 관리 |
| `/api/admin/trash` | GET/DELETE | ADMIN | 휴지통 관리 |

### 4-12. 관리자 - 제휴업체 (4개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/admin/partners` | GET/POST | ADMIN | 제휴업체 목록/등록 |
| `/api/admin/partners/[id]` | GET/PATCH/DELETE | ADMIN | 제휴업체 관리 |
| `/api/admin/partners/[id]/status` | PATCH | ADMIN | 상태 변경 |
| `/api/admin/partners/[id]/regenerate-link` | POST | ADMIN | 결제 링크 재생성 |

### 4-13. 관리자 - 이벤트/설정 (2개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/admin/events` | GET/POST/PUT/DELETE | ADMIN | 이벤트 CRUD |
| `/api/admin/ai-usage` | GET | ADMIN | AI 사용량 통계 |

### 4-14. 관리자 - 자동 콘텐츠 (6개)
| 엔드포인트 | 메서드 | 권한 | 설명 |
|------------|--------|------|------|
| `/api/admin/auto-content/config` | GET/PUT | ADMIN | 자동 콘텐츠 설정 |
| `/api/admin/auto-content/generate` | POST | ADMIN | 수동 생성 |
| `/api/admin/auto-content/pool` | GET/DELETE | ADMIN | 콘텐츠 풀 관리 |
| `/api/admin/auto-content/stats` | GET | ADMIN | 생성 통계 |
| `/api/admin/auto-content/ghost-users` | GET/POST/DELETE | ADMIN | 유령 계정 관리 |
| `/api/admin/auto-content/extract-keywords` | POST | ADMIN | 키워드 추출 |

### 4-15. 크론잡 (13개)
| 엔드포인트 | 스케줄 | 설명 |
|------------|--------|------|
| `/api/cron/auto-jump` | `*/10 * * * *` (10분) | 자동 점프 실행 |
| `/api/cron/auto-publish` | `*/30 * * * *` (30분) | 자동 콘텐츠 발행 |
| `/api/cron/boost-community-views` | `0 * * * *` (매시) | 커뮤니티 조회수 부스트 |
| `/api/cron/expire-ads` | `0 * * * *` (매시) | 유료→FREE 자동전환 + 무료광고 90일 미활동 EXPIRED |
| `/api/cron/expire-pending` | `0 * * * *` (매시) | 미결제 광고 만료 |
| `/api/cron/expire-partners` | `0 * * * *` (매시) | 제휴업체 만료 + 3일 자동시작 |
| `/api/cron/notify-expiry` | `0 9 * * *` (매일 09시) | 유료광고 만료 임박 알림 (D-3, D-1, D-0) |
| `/api/cron/notify-free-expiry` | `0 2 * * *` (매일 KST 11시) | **무료광고 D-7 SMS 알림 (90일 미활동)** |
| `/api/cron/reset-manual-jump` | `0 15 * * *` (매일 자정 KST) | 수동점프 횟수 리셋 |
| `/api/cron/cleanup-old-messages` | `0 3 * * *` (매일 03시) | 오래된 쪽지 정리 |
| `/api/cron/boost-views` | 미등록 | 조회수 부스트 (수동) |
| `/api/cron/cleanup-age-tokens` | 미등록 | 만료 성인인증 토큰 정리 |
| `/api/cron/check-blob-usage` | 미등록 | Blob 사용량 체크 |

> vercel.json에 등록된 크론: 10개 / 미등록(수동 전용): 3개

### 4-16. 테스트 (2개)
| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/test/promote-admin` | POST | 관리자 승격 (개발용) |
| `/api/test/cleanup` | POST | 테스트 데이터 정리 |

---

## 5. 유료 상품 구조

### 5-1. 광고 상품 (8등급)

| 등급 | 이름 | 30일 | 60일 | 90일 | 자동점프/일 | 수동점프/일 | 수정 | 지역 |
|------|------|------|------|------|------------|------------|------|------|
| FREE | 무료등록 | 0 | 0 | 0 | 0 | 3 | 무제한 | 1 |
| LINE | 줄광고 | 7만 | 13만 | 17만 | 12 | 3 | 1 | 1 |
| RECOMMEND | 추천 | 10만 | 19만 | 24만 | 24 | 3 | 1 | 2 |
| URGENT | 급구 | 13만 | 24만 | 31만 | 24 | 5 | 1 | 2 |
| SPECIAL | 스페셜 | 15만 | 27만 | 36만 | 28 | 8 | 2 | 2 |
| PREMIUM | 프리미엄 | 18만 | 33만 | 43만 | 36 | 12 | 2 | 3 |
| VIP | VIP | 23만 | 42만 | 55만 | 42 | 18 | 3 | 3 |
| BANNER | 노블레스 | 35만 | 65만 | 90만 | 48 | 24 | 5 | 전국 |

**노출 위치** (rank 순):
1. **BANNER** (rank 1): 사이트 전체 최상단 배너 (슬롯 제한 없음)
2. **VIP** (rank 2): 메인 중단 최고 위치
3. **PREMIUM** (rank 3): 메인 우대 하단 프리미엄 영역
4. **SPECIAL** (rank 4): 채용/지역별 페이지 중단
5. **URGENT** (rank 5): 메인 좌측 하단 (강조)
6. **RECOMMEND** (rank 6): 메인 하단 추천 영역
7. **LINE** (rank 99): 채용정보 리스트
8. **FREE** (rank 100): 채용정보 리스트 최하단

**등급별 추가 포함 혜택**:
- RECOMMEND 이상: 이력서 열람 포함
- URGENT: 아이콘 무료
- PREMIUM 이상: 이력서 알림 포함
- VIP: 카페 연동 1회
- BANNER: 카페 연동 2회, 아이콘 무료

### 5-2. 부가옵션 (4종)

| 옵션 | 이름 | 30일 | 60일 | 90일 | 설명 |
|------|------|------|------|------|------|
| BOLD | 굵은글씨 | 3만 | 5만 | 7만 | 제목 굵게 |
| ICON | 아이콘 | 3만 | 5만 | 7만 | 10종 아이콘 중 선택 |
| HIGHLIGHT | 형광펜 | 3만 | 5만 | 7만 | 8종 형광색 배경 |
| KAKAO_ALERT | 이력서 알림 | 5만 | 8만 | 12만 | 신규 이력서 알림 (준비중) |

### 5-3. 이벤트 보너스 일수

| 기간 | 보너스 | 합계 |
|------|--------|------|
| 30일 | +10일 | 40일 |
| 60일 | +30일 | 90일 |
| 90일 | +60일 | 150일 |

> 이벤트는 admin에서 ON/OFF. 업그레이드/연장에는 보너스 미적용.

### 5-4. 제휴업체 상품 (4등급)

| 등급 | 가격 | 색상 | 메인 노출 | 설명 |
|------|------|------|-----------|------|
| A | 300만 | 골드(#D4A853) | O | 메인 최상단 골드 카드 |
| B | 200만 | 실버(#9CA3AF) | O | 메인 실버 카드 |
| C | 100만 | 일반(#78716C) | O | 메인 일반 카드 |
| D | 50만 | 다크(#444) | X | /partner 페이지만 노출 |

**카테고리**: 성형/시술, 미용/네일, 렌탈, 금융, 기타

---

## 6. 데이터 생애주기

### 6-1. 광고 생애주기

```
DRAFT → PENDING_DEPOSIT (결제 신청) → [사용자 입금] → [관리자 입금확인] → ACTIVE → EXPIRED
                                                                          ↑
                                                                   연장(renew) / 업그레이드(upgrade)
```

| 상태 | 설명 |
|------|------|
| DRAFT | 작성 중 |
| PENDING_DEPOSIT | 입금 대기 (계좌번호 안내됨) |
| ACTIVE | 활성 (노출 중) |
| PAUSED | 일시 정지 |
| EXPIRED | 만료 |
| REJECTED | 거절됨 |
| CANCELLED | 취소됨 |

### 6-2. 결제 흐름 (계좌이체)

**계좌이체 + 관리자 수동승인**
```
사용자 → PaymentWidget (계좌 안내 + 증빙서류 선택)
→ POST /api/payments/confirm → Payment 생성(PENDING) + Ad PENDING_DEPOSIT + SMS 입금안내 발송
→ /business/ads/[id]/payment (입금 안내 페이지)
→ 사용자 실제 입금
→ 관리자 /admin/payments → 입금확인
→ POST /api/admin/payments/[id]/approve → Payment APPROVED + activateAd() → Ad ACTIVE
```

**무료 광고권**
```
사용자 → 무료 광고권 사용 → Ad 즉시 ACTIVE (freeAdCredits 차감)
```

> `activateAd()` 공통 함수 사용 (`src/lib/payment/activate-ad.ts`)
> 계좌: 신한은행 110-626-143675 (박상만) / 고유 입금자명: orderId 마지막 4자리

### 6-3. 제휴업체 생애주기

```
관리자 등록 → PENDING_PAYMENT → [결제 링크로 결제] → ACTIVE
                                                      ↓
                                              3일 후 endDate 자동설정 (크론)
                                                      ↓
                                                   EXPIRED (크론)
                                                      ↓
                                                   연장(renew)
```

### 6-4. 사용자 인증 흐름

```
회원가입 → 이메일 인증 → 로그인
                           ↓
              BUSINESS: 사업자 인증 (선택)
              JOBSEEKER: 성인인증 (선택, 이력서 열람 시 필요)
```

---

## 7. 미들웨어 라우트 보호

```typescript
matcher: [
  "/business/:path*",      // BUSINESS or ADMIN
  "/jobseeker/:path*",     // JOBSEEKER or ADMIN
  "/notifications",        // 로그인 필요
  "/messages",             // 로그인 필요
  "/messages/:path*",      // 로그인 필요
  "/settings/:path*",      // 로그인 필요
  "/admin/:path*",         // ADMIN only
  "/login",                // 이미 로그인 → 홈 리다이렉트
  "/register",             // 이미 로그인 → 홈 리다이렉트
  "/register/business",    // 이미 로그인 → 홈 리다이렉트
]
```

**JWT 토큰 저장 정보**: id, role, phone, businessName, isVerifiedBiz, ageVerified

---

## 8. DB 스키마 요약

### 8-1. 주요 모델 (37개)

| 모델 | 설명 | 주요 관계 |
|------|------|-----------|
| **User** | 사용자 | → Ad[], Resume[], Post[], Review[], Payment[] |
| **Ad** | 광고 | → User, AdOption[], Payment[], AdApplication[] |
| **AdOption** | 부가옵션 | → Ad |
| **Payment** | 결제 | → User, Ad |
| **Resume** | 이력서 | → User |
| **Review** | 리뷰 | → User(작성자), User(대상) |
| **Post** | 게시글 | → User, Comment[], PostImage[] |
| **Comment** | 댓글 | → Post, User, parentComment |
| **Message** | 쪽지 | → User(sender), User(receiver) |
| **Notification** | 알림 | → User |
| **Partner** | 제휴업체 | → User |
| **Report** | 신고 | → User(신고자) |
| **JumpLog** | 점프 로그 | → Ad |
| **AdDailyMetric** | 일별 통계 | → Ad |
| **Scrap** | 스크랩 | → User, Ad |
| **AdApplication** | 지원 내역 | → Ad, User |
| **ResumeViewLog** | 열람 로그 | → Resume, User(열람자) |
| **ResumeContact** | 연락처 열람 | → Resume, User(열람자) |
| **ContentPool** | 자동 콘텐츠 풀 | - |
| **AutoContentConfig** | 자동 콘텐츠 설정 | - |
| **AiUsageLog** | AI 사용 로그 | - |
| **Notice** | 공지사항 | - |
| **PushSubscription** | 푸시 구독 | → User |
| **EventConfig** | 이벤트 설정 | - |
| **Account** | OAuth 계정 | → User |
| **Session** | 세션 | → User |
| **VerificationToken** | 인증 토큰 | - |
| **PasswordResetToken** | 비밀번호 리셋 | - |
| **AgeVerification** | 성인인증 | → User |
| **PostImage** | 게시글 이미지 | → Post |
| **PostLike** | 게시글 좋아요 | → Post, User |
| **CommentLike** | 댓글 좋아요 | → Comment, User |
| **SuspensionLog** | 정지 로그 | → User |
| **MessageBlock** | 쪽지 차단 | → User(blocker), User(blocked) |
| **BannedUser** | 차단 회원 | - |
| **BusinessBlacklist** | 사업자 블랙리스트 | - |
| **SpamWord** | 스팸 단어 | - |

### 8-2. Enum 목록 (16개)

| Enum | 값 |
|------|----|
| UserRole | JOBSEEKER, BUSINESS, ADMIN |
| AdStatus | DRAFT, PENDING_PAYMENT, PENDING_DEPOSIT, PENDING_REVIEW, ACTIVE, PAUSED, EXPIRED, REJECTED, CANCELLED |
| PaymentStatus | PENDING, APPROVED, FAILED, CANCELLED, REFUNDED |
| PaymentMethod | CARD, BANK_TRANSFER, KAKAO_PAY, FREE_CREDIT |
| AdProductId | FREE, LINE, RECOMMEND, URGENT, SPECIAL, PREMIUM, VIP, BANNER |
| AdOptionId | BOLD, ICON, HIGHLIGHT, KAKAO_ALERT |
| JumpType | AUTO, MANUAL |
| GhostPersonality | CHATTY, ADVISOR, QUESTIONER, EMOJI_LOVER, CALM, SASSY, CUSTOM |
| ContentType | POST, COMMENT, REPLY |
| ReportReason | ABUSE, OBSCENE, SPAM, PRIVACY, OTHER |
| ReportStatus | PENDING, RESOLVED, DISMISSED |
| BusinessType | KARAOKE, ROOM_SALON, TEN_CAFE, SHIRT_ROOM, LEGGINGS_ROOM, PUBLIC_BAR, HYPER_PUBLIC, BAR_LOUNGE, CLUB, MASSAGE, GUANRI, OTHER |
| PartnerStatus | PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED |
| PartnerGrade | A, B, C, D |
| PartnerCategory | PLASTIC_SURGERY, BEAUTY, RENTAL, FINANCE, OTHER |
| Region | NATIONWIDE + 17개 시도 |

---

## 9. 핵심 라이브러리 파일

| 파일 | 역할 |
|------|------|
| `src/lib/auth.ts` | NextAuth 인스턴스 (auth, signIn, signOut) |
| `src/lib/auth.config.ts` | 인증 콜백 (authorized, jwt, session) |
| `src/lib/prisma.ts` | Prisma 클라이언트 |
| `src/lib/constants/bank-account.ts` | 계좌 정보 상수 |
| `src/lib/payment/activate-ad.ts` | 결제 후 광고 활성화 공통 함수 |
| `src/components/payment/PaymentWidget.tsx` | 계좌이체 결제 위젯 |
| `src/lib/event.ts` | 이벤트 보너스 계산 |
| `src/lib/rate-limit.ts` | Upstash Redis Rate Limiting |
| `src/lib/constants/products.ts` | 광고 상품 8등급 정의 |
| `src/lib/constants/partners.ts` | 제휴업체 등급/카테고리 정의 |
| `src/lib/utils/cron-auth.ts` | 크론잡 인증 (CRON_SECRET) |

---

## 10. 주요 비즈니스 로직 정리

### 자동 점프 (auto-jump)
- 10분마다 실행, ACTIVE 광고 대상
- 상품별 `autoJumpPerDay` 횟수만큼 하루에 자동 점프
- 점프 = `lastJumpedAt` 갱신 → 리스트 상단 노출

### 수동 점프 리셋 (reset-manual-jump)
- 매일 자정(KST, UTC 15시) 실행
- `manualJumpUsedToday` → 0 리셋

### 광고 만료 (expire-ads)
- 매시간 실행
- 유료 ACTIVE + endDate 경과 → 무료(FREE) 자동 전환 (status는 ACTIVE 유지, 무료영역 노출)
- ACTIVE FREE + 사장 `lastBusinessActivityAt` 90일 경과 → EXPIRED (시드/스탭 제외)

### 미결제 만료 (expire-pending)
- 매시간, 24시간 경과한 PENDING_PAYMENT → CANCELLED

### 만료 임박 알림 (notify-expiry)
- 매일 09시 UTC, 유료광고 D-3/D-1/D-0 알림 (이메일 + 사이트 알림 + D-1 SMS)

### 무료광고 미활동 D-7 SMS (notify-free-expiry)
- 매일 KST 11시 (UTC 02시) 실행
- 사장 `lastBusinessActivityAt` 83~90일 사이 + 활성 무료광고 보유 + 시드/스탭 제외
- userId GROUP BY로 사장당 1통 (광고 N건이면 본문에 묶음 표기)
- 발송 후 `lastFreeExpiryNotifiedAt` 90일 lock (중복 방지)
- 환경변수 `FREE_EXPIRY_DRY_RUN=1`이면 발송 대상자만 로그
- 사장이 SMS 후 사이트 방문 시 `touchBusinessActivity()`가 D-Day 리셋 + 30일 이내 EXPIRED 자동 복구

### 제휴업체 만료 (expire-partners)
- 매시간, endDate 지난 ACTIVE → EXPIRED
- 3일 경과 후 endDate 자동 설정 (소재 업로드 유예)

### 자동 콘텐츠 (auto-publish)
- 30분마다, AI 생성 커뮤니티 글 자동 발행
- 유령 계정(GhostPersonality) 사용

### 커뮤니티 조회수 부스트 (boost-community-views)
- 매시간, 일정 범위 내 랜덤 조회수 증가

---

## 11. 런칭 대기 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| 성인인증 SMS | 승인 대기 | SMS 인증 연동 |
| 카카오맵 API | 거절 → Google Maps 전환 완료 | 커밋 92197c0 |

**현재 결제**: 계좌이체 (신한은행 110-626-143675, 박상만) + 관리자 수동승인
**본인인증**: PortOne SDK (성인인증 전용)

---

## 12. 외부 통합 — 텔레그램 공식 채널

### 개요
여시잡 공식 텔레그램 채널 `@yeosijob`을 통해 신규 이력서 등록 시 사장님들에게 실시간 푸시 알림을 제공. 경쟁 업소보다 먼저 연락하도록 속도 경쟁력을 제공하는 마케팅 훅.

### 핵심 정보
| 항목 | 값 |
|---|---|
| 채널 핸들 | `@yeosijob` |
| 채널 URL | `https://t.me/yeosijob` (환경변수: `NEXT_PUBLIC_TELEGRAM_INVITE_URL`) |
| 채널 공개 여부 | **Public** (누구나 링크로 구독 가능) |
| 봇 토큰 | `TELEGRAM_BOT_TOKEN` (env) |
| 채널 ID | `TELEGRAM_CHANNEL_ID` (env, `@yeosijob` 또는 chat_id) |
| 알림 발송 조건 | 신규 이력서 등록 시 자동 발송 |
| 알림 포함 정보 | **지역 · 업종 · 연령대 · 경력 · 희망급여 형태만** (이름/사진/연락처 **제외** → 개인정보 보호) |
| 구독자 비용 | **무료** |
| 상세 열람 | 이력서 상세는 여시잡 사이트 내 **유료 광고 등록 회원**만 가능 |

### 관련 파일
| 파일 | 역할 |
|---|---|
| `src/lib/telegram.ts` | 텔레그램 봇 API 호출 유틸 (`sendChannelMessage` 등) |
| `src/app/api/resumes/route.ts` | 신규 이력서 등록 시 텔레그램 알림 트리거 |
| `src/app/business/notifications/telegram/page.tsx` | 사장님용 텔레그램 구독 안내 페이지 (혜택 설명 + 구독 버튼) |
| `src/components/business/TelegramPromoBanner.tsx` | 사장님 대시보드 상단 배너 (NEW 뱃지, 닫기 후 localStorage) |
| `src/app/business/layout.tsx` | 사장님 레이아웃에서 `TelegramPromoBanner` 렌더링 |
| `src/app/welcome/business/page.tsx` | 마케팅 쿠션 랜딩의 6번째 베네핏 카드 (2026-04-06 추가) |

### 사용자 유입 채널
1. **기존 사장님**: 대시보드 배너(`TelegramPromoBanner`) → 상세 안내 페이지 → 구독
2. **DM 수신자**: 쿠션 랜딩(`/welcome/business`) 베네핏 카드 → 직접 구독 링크
3. **공고 등록자**: (향후) 공고 등록 완료 페이지에서도 홍보 가능

### 개인정보 컴플라이언스 체크
- 채널 메시지에는 **개인 식별 정보 없음** (이름/사진/전화번호 미포함)
- "지역 · 업종 · 연령대" 등 일반 메타데이터만 노출
- 구직자 개인정보 활용 동의서에 텔레그램 알림 관련 조항은 **미포함** (일반 메타정보만 나가므로 동의 대상이 아님)

### 운영 규칙
- 채널 = 읽기 전용 (구독자 메시지 전송 불가)
- 구독자 수는 초반에는 비공개로 유지 권장 (사회적 증거 효과를 위해 일정 수치 도달 후 공개)
- 트래픽 급증 시 채널 외에도 봇 기반 양방향 상담 고려 가능
