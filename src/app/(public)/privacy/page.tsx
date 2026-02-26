export const metadata = {
  title: "개인정보처리방침",
  description: "여시잡 개인정보처리방침",
  openGraph: {
    title: "개인정보처리방침 | 여시잡",
    description: "여시잡 개인정보처리방침",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10">
      <h1 className="text-3xl font-bold">개인정보처리방침</h1>
      <p className="mt-3 text-muted-foreground">최종 수정일: 2025년 2월 1일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">1. 개인정보의 수집 및 이용 목적</h2>
          <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별</li>
            <li>서비스 제공: 구인구직 정보 제공, 광고 등록 및 관리</li>
            <li>결제 처리: 유료 광고 서비스 결제 및 환불 처리</li>
            <li>고충 처리: 민원인의 신원 확인, 민원사항 확인, 처리결과 통보</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">2. 수집하는 개인정보 항목</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong className="text-foreground">필수항목:</strong> 이메일, 비밀번호, 이름(닉네임)</li>
            <li><strong className="text-foreground">사업자 회원:</strong> 업소명, 연락처, 사업자등록번호</li>
            <li><strong className="text-foreground">구직자 회원:</strong> 이름, 연락처, 이력서 정보</li>
            <li><strong className="text-foreground">자동 수집:</strong> IP 주소, 접속 로그, 쿠키, 서비스 이용 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우
            해당 법령에서 정한 기간 동안 보존합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
            <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
            다만, 이용자가 사전에 동의한 경우 또는 법령의 규정에 의한 경우에는 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">5. 개인정보의 파기</h2>
          <p>
            보유 기간이 경과하거나 처리 목적이 달성된 경우, 해당 개인정보를 지체 없이 파기합니다.
            전자적 파일은 복구 불가능한 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">6. 이용자의 권리</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>개인정보 열람, 정정, 삭제, 처리정지 요구 권리</li>
            <li>회원탈퇴를 통한 개인정보 수집 및 이용 동의 철회 권리</li>
            <li>권리 행사는 서비스 내 설정 또는 고객센터를 통해 가능합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">7. 쿠키의 사용</h2>
          <p>
            회사는 로그인 상태 유지 및 서비스 이용 편의를 위해 쿠키를 사용합니다.
            이용자는 브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">8. 개인정보 보호책임자</h2>
          <ul data-nosnippet="" className="list-disc space-y-1 pl-5">
            <li>성명: 박상만</li>
            <li>직위: 대표</li>
            <li>연락처: 1588-7928</li>
            <li>이메일: samsungcu&#64;naver.com</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">부칙</h2>
          <p>이 개인정보처리방침은 2025년 2월 1일부터 시행합니다.</p>
        </section>
      </div>
    </div>
  );
}
