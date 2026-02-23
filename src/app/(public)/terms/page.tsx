export const metadata = {
  title: "이용약관 - 여시알바",
  description: "여시알바 이용약관",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10">
      <h1 className="text-3xl font-bold">이용약관</h1>
      <p className="mt-3 text-muted-foreground">최종 수정일: 2025년 2월 1일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제1조 (목적)</h2>
          <p>
            이 약관은 여시알바(이하 &quot;회사&quot;)가 제공하는 인터넷 관련 서비스(이하 &quot;서비스&quot;)의
            이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제2조 (정의)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>&quot;서비스&quot;란 회사가 제공하는 구인구직 정보 제공 플랫폼을 말합니다.</li>
            <li>&quot;이용자&quot;란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>&quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제3조 (약관의 효력과 변경)</h2>
          <p>
            이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
            회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제4조 (서비스의 제공)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>구인구직 정보 제공</li>
            <li>채용 광고 등록 및 관리</li>
            <li>이력서 등록 및 관리</li>
            <li>기타 회사가 정하는 서비스</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제5조 (회원가입)</h2>
          <p>
            이용자는 회사가 정한 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써
            회원가입을 신청합니다. 회사는 회원가입 신청자가 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제6조 (회원 탈퇴 및 자격 상실)</h2>
          <p>
            회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.
            허위 정보 등록, 타인의 서비스 이용 방해, 법령 위반 시 회원 자격이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제7조 (이용자의 의무)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원정보 변경 시 즉시 수정해야 합니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
            <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 해서는 안 됩니다.</li>
            <li>서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제8조 (면책조항)</h2>
          <p>
            회사는 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우에는
            서비스 제공에 관한 책임이 면제됩니다. 회사는 이용자의 귀책사유로 인한 서비스 이용의
            장애에 대하여 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">부칙</h2>
          <p>이 약관은 2025년 2월 1일부터 시행합니다.</p>
        </section>
      </div>
    </div>
  );
}
