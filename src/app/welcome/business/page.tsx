import Link from "next/link";
import styles from "./page.module.css";

const REGISTER_URL = "/register/business";
const LOGIN_URL = "/login";
const TELEGRAM_INVITE_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_INVITE_URL || "https://t.me/yeosijob";

export default function WelcomeBusinessPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* 상단 헤더 */}
        <div className={styles.siteHeader}>
          <div className={styles.siteLogo}>여시잡</div>
          <Link href={LOGIN_URL} className={styles.headerBtn}>
            로그인
          </Link>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>✨ 무료 광고 등록 가능</div>
          <div className={styles.heroTitle}>
            사람이 없는 게 아닙니다.
            <br />
            <span className={styles.heroTitleGold}>
              찾는 곳이 달라졌을 뿐입니다
            </span>
          </div>
          <div className={styles.heroSub}>
            업계 여성종사자 전용 카페 회원 <strong>20,538명</strong>
            <br />
            매달 수백 명씩 새로운 구직자가 유입됩니다
            <br />
            먼저 등록한 사장님만 연락받습니다
          </div>
          <Link href={REGISTER_URL} className={styles.heroCta}>
            무료로 광고 올리기 →
          </Link>
          <div className={styles.heroUrl}>yeosijob.com</div>
        </div>

        {/* 신뢰 블록 */}
        <div className={styles.trustBlock}>
          <div className={styles.trustHeader}>
            <div className={styles.trustIcon}>🤝</div>
            <div className={styles.trustTitle}>
              업계 여성종사자 2만+ 커뮤니티 단독 제휴
            </div>
          </div>
          <div className={styles.trustStats}>
            <div className={styles.trustStat}>
              <div className={styles.trustStatNum}>20,538</div>
              <div className={styles.trustStatLabel}>카페 회원</div>
            </div>
            <div className={styles.trustStat}>
              <div className={styles.trustStatNum}>8,825</div>
              <div className={styles.trustStatLabel}>일 평균 방문</div>
            </div>
            <div className={styles.trustStat}>
              <div className={styles.trustStatNum}>614명</div>
              <div className={styles.trustStatLabel}>월 평균 가입</div>
            </div>
          </div>
        </div>

        {/* 카페 회원 13개월 성장 차트 */}
        <div className={styles.chartSection}>
          <div className={styles.cumulativeChart}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>📈 밤여시 카페 회원 성장</div>
              <div className={styles.chartTotalBadge}>+8,207명 · 13개월</div>
            </div>
            <svg
              viewBox="0 0 480 200"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.chartSvg}
              role="img"
              aria-label="밤여시 카페 회원 13개월 성장 추이 - 12,331명에서 20,538명으로 증가"
            >
              <defs>
                <linearGradient
                  id="yeosijobCumulativeArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#D4A853" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#D4A853" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* 그리드 라인 */}
              <line
                x1="40"
                y1="160"
                x2="460"
                y2="160"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              <line
                x1="40"
                y1="90"
                x2="460"
                y2="90"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <line
                x1="40"
                y1="20"
                x2="460"
                y2="20"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />

              {/* Y축 라벨 */}
              <text
                x="34"
                y="164"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="end"
              >
                12K
              </text>
              <text
                x="34"
                y="94"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="end"
              >
                16.5K
              </text>
              <text
                x="34"
                y="24"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="end"
              >
                21K
              </text>

              {/* 영역 (12,928 → 20,538) */}
              <path
                d="M 40 145.6 L 75 137.5 L 110 125.2 L 145 114.2 L 180 103.6 L 215 91.8 L 250 80.7 L 285 70.1 L 320 60.4 L 355 51.6 L 390 42.1 L 425 34.8 L 460 27.2 L 460 160 L 40 160 Z"
                fill="url(#yeosijobCumulativeArea)"
              />

              {/* 라인 */}
              <path
                d="M 40 145.6 L 75 137.5 L 110 125.2 L 145 114.2 L 180 103.6 L 215 91.8 L 250 80.7 L 285 70.1 L 320 60.4 L 355 51.6 L 390 42.1 L 425 34.8 L 460 27.2"
                stroke="#D4A853"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 시작점 강조 */}
              <circle cx="40" cy="145.6" r="7" fill="#D4A853" fillOpacity="0.18" />
              <circle cx="40" cy="145.6" r="3.5" fill="#D4A853" />

              {/* 시작점 수치 */}
              <text
                x="48"
                y="158"
                fill="rgba(255,255,255,0.7)"
                fontSize="10"
                fontWeight="600"
                textAnchor="start"
              >
                12,928명
              </text>

              {/* 끝점 강조 */}
              <circle cx="460" cy="27.2" r="8" fill="#D4A853" fillOpacity="0.22" />
              <circle cx="460" cy="27.2" r="4" fill="#D4A853" />

              {/* 끝점 수치 */}
              <text
                x="455"
                y="17"
                fill="#D4A853"
                fontSize="12"
                fontWeight="800"
                textAnchor="end"
              >
                20,538명
              </text>
            </svg>
            <div className={styles.chartAxisLabels}>
              <span>2025.03</span>
              <span>2025.09</span>
              <span>2026.03</span>
            </div>
            <div className={styles.chartCaption}>
              밤여시 카페 회원 수 · 13개월간 <strong>8,207명이 새로 가입했습니다</strong> (2025.03 → 2026.03)
            </div>
          </div>

          {/* 밤여시 카페 검증 링크 */}
          <a
            href="https://cafe.naver.com/3giphone"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cafeVerifyCard}
          >
            <div className={styles.cafeVerifyBadge}>N</div>
            <div className={styles.cafeVerifyText}>
              <div className={styles.cafeVerifyTitle}>
                거짓말 아닙니다. 직접 보세요
              </div>
              <div className={styles.cafeVerifyDesc}>
                밤여시 카페 회원 수·신규 가입 현황 실시간 공개
              </div>
            </div>
            <div className={styles.cafeVerifyArrow}>↗</div>
          </a>
        </div>

        {/* 왜 여시잡 */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>왜 여시잡인가</div>
          <div className={styles.sectionTitle}>
            다른 사이트와
            <br />
            무엇이 다른가요?
          </div>

          <div className={`${styles.benefitCard} ${styles.benefitCardHighlight}`}>
            <div className={styles.benefitIconBox}>💎</div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitTitle}>
                업계 여성종사자 2만+ 전용 커뮤니티 단독 제휴
              </div>
              <div className={styles.benefitDesc}>
                <strong>유흥업소에서 일하는 여성만 가입할 수 있는 전용 카페</strong>
                (회원 <strong>20,538명</strong>, 월 평균 <strong>614명 신규 가입</strong>,
                최근 13개월 <strong>+8,207명 성장</strong>)와 단독 제휴하고 있습니다.
                이 커뮤니티에서 구직을 원하는 여성들이 여시잡으로 유입됩니다.
                타 사이트에는 없는 여시잡만의 구직자 풀입니다.
              </div>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconBox}>🆓</div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitTitle}>무료 상품이 있습니다</div>
              <div className={styles.benefitDesc}>
                경쟁업체에는 없는 여시잡만의 무료 광고. 부담 없이 먼저 올려보세요.
              </div>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconBox}>💰</div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitTitle}>경쟁업체 대비 15~25% 저렴</div>
              <div className={styles.benefitDesc}>
                모든 유료 상품이 경쟁사 대비 더 저렴한 가격입니다.
              </div>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconBox}>🔝</div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitTitle}>자동 점프 상위 노출</div>
              <div className={styles.benefitDesc}>
                설정한 간격마다 자동으로 리스트 상단으로 올라갑니다.
              </div>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconBox}>👀</div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitTitle}>이력서 열람 &amp; 직접 쪽지</div>
              <div className={styles.benefitDesc}>
                구직자 이력서를 확인하고 마음에 드는 분께 직접 연락하세요.
              </div>
            </div>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconBox}>📢</div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitTitleRow}>
                <div className={styles.benefitTitle}>
                  텔레그램 실시간 이력서 알림
                </div>
                <span className={styles.newBadge}>NEW</span>
              </div>
              <div className={styles.benefitDesc}>
                여시잡 공식 텔레그램 채널에서 신규 이력서 등록 즉시 푸시 알림을 받아보세요.
                경쟁 업소보다 한발 먼저 연락 → 우수 인재 확보. 무료 · 광고 없음.
              </div>
              <a
                href={TELEGRAM_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.benefitLink}
              >
                @yeosijob 구독하기 →
              </a>
            </div>
          </div>
        </div>

        {/* 등록 순서 */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>등록 순서</div>
          <div className={styles.sectionTitle}>이렇게 등록됩니다</div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepTitle}>회원가입</div>
              <div className={styles.stepDesc}>
                업체명, 이메일, 휴대폰 번호로 간단 가입
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepTitle}>사업자 인증</div>
              <div className={styles.stepDesc}>
                사업자등록번호 · 대표자명 입력 후 즉시 인증 완료
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepTitle}>광고 등록</div>
              <div className={styles.stepDesc}>
                인증 후 바로 등록 가능 · 업소 정보 · 급여 · 사진 입력 후 상품 선택 → 무료는 즉시 게시
              </div>
            </div>
          </div>
        </div>

        {/* 가격표 */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>광고 상품 가격</div>
          <div className={styles.sectionTitle}>
            8종의 상품
            <br />
            무료부터 시작
          </div>

          <div className={styles.priceTable}>
            <div className={`${styles.priceRow} ${styles.priceRowFree}`}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#888" }} />
                <span className={styles.priceLabel}>무료등록</span>
              </div>
              <div className={`${styles.priceValue} ${styles.priceValueFreeTag}`}>
                무료
              </div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#4FC3F7" }} />
                <span className={styles.priceLabel}>줄광고</span>
              </div>
              <div className={styles.priceValue}>7만원</div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#81C784" }} />
                <span className={styles.priceLabel}>추천</span>
              </div>
              <div className={styles.priceValue}>10만원</div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#FFB74D" }} />
                <span className={styles.priceLabel}>급구</span>
              </div>
              <div className={styles.priceValue}>13만원</div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#E57373" }} />
                <span className={styles.priceLabel}>스페셜</span>
              </div>
              <div className={styles.priceValue}>15만원</div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#BA68C8" }} />
                <span className={styles.priceLabel}>프리미엄</span>
              </div>
              <div className={styles.priceValue}>18만원</div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#F06292" }} />
                <span className={styles.priceLabel}>VIP</span>
              </div>
              <div className={styles.priceValue}>23만원</div>
            </div>
            <div className={styles.priceRow}>
              <div className={styles.priceName}>
                <span className={styles.priceDot} style={{ background: "#D4A853" }} />
                <span className={styles.priceLabel}>노블레스</span>
              </div>
              <div className={styles.priceValue}>35만원</div>
            </div>
          </div>

          <div className={styles.priceNote}>
            30일 기준 · VAT 포함
            <br />
            60일 · 90일 장기등록 시 <strong>할인</strong> 적용
          </div>
        </div>

        {/* FAQ */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>자주 묻는 질문</div>
          <div className={styles.sectionTitle}>
            사장님들이
            <br />
            많이 물어보세요
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQ}>정말 무료로 광고를 올릴 수 있나요?</div>
            <div className={styles.faqA}>
              네, 무료등록 상품은 비용 없이 광고를 게시할 수 있습니다. 유료 상품은 노출 우선순위와 디자인이 더 강조됩니다.
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>결제는 어떻게 하나요?</div>
            <div className={styles.faqA}>
              무통장 입금(계좌이체)으로 진행됩니다. 입금 확인 후 광고가 활성화됩니다.
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>사업자등록증이 꼭 있어야 하나요?</div>
            <div className={styles.faqA}>
              네, 허위 업소 방지를 위해 모든 광고에 사업자 인증이 필요합니다. 사업자등록번호와 대표자명 입력 후 즉시 인증되며, 바로 광고를 등록하실 수 있습니다.
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>구직자는 얼마나 있나요?</div>
            <div className={styles.faqA}>
              여시잡은 유흥업소 여성종사자 전용 커뮤니티(회원 20,538명, 월 평균 614명 신규 가입)와 단독 제휴하고 있습니다. 이 커뮤니티 구직자들이 여시잡을 통해 공고를 확인하고 사장님께 직접 연락드리는 구조입니다.
            </div>
          </div>
        </div>

        {/* 최하단 CTA */}
        <div className={styles.bottomCta}>
          <div className={styles.bottomCtaTitle}>
            지금 무료로
            <br />
            광고 올려보세요
          </div>
          <div className={styles.bottomCtaSub}>
            업계 여성종사자 2만+ 커뮤니티 단독 제휴
            <br />
            무료부터 시작 · 언제든 상위 상품으로 업그레이드
          </div>
          <Link href={REGISTER_URL} className={styles.bottomCtaBtn}>
            무료 광고 등록 시작 →
          </Link>
          <div className={styles.bottomCtaUrl}>yeosijob.com</div>
          <div className={styles.bottomCtaSmall}>
            이미 계정이 있으시면 로그인 후 등록 가능합니다
          </div>
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <div className={styles.footerText}>
            여시잡 © 2026
            <br />
            유흥업소 전문 구인구직 플랫폼
          </div>
        </div>
      </div>
    </div>
  );
}
