export const metadata = {
  title: "이용약관",
  description: "여시잡 이용약관",
  openGraph: {
    title: "이용약관 | 여시잡",
    description: "여시잡 이용약관",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "여시잡 - 유흥알바 No.1 구인구직" }],
  },
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10">
      <h1 className="text-3xl font-bold">이용약관</h1>
      <p className="mt-3 text-muted-foreground">최종 수정일: 2026년 3월 25일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제1조 (목적)</h2>
          <p>
            이 약관은 여시잡(이하 &quot;회사&quot;)가 제공하는 인터넷 관련 서비스(이하 &quot;서비스&quot;)의
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
          <h2 className="mb-3 text-lg font-semibold text-foreground">제5조 (이용 자격 및 연령 제한)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>본 서비스는 만 19세 이상의 성인만 이용할 수 있습니다.</li>
            <li>회원가입 시 만 19세 이상임을 확인하는 절차에 동의해야 합니다.</li>
            <li>미성년자가 허위로 연령을 기재하여 가입한 경우, 회사는 해당 계정을 즉시 삭제할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제6조 (회원가입)</h2>
          <p>
            이용자는 회사가 정한 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써
            회원가입을 신청합니다. 회사는 회원가입 신청자가 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제7조 (회원 탈퇴 및 자격 상실)</h2>
          <p>
            회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.
            허위 정보 등록, 타인의 서비스 이용 방해, 법령 위반 시 회원 자격이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제8조 (이용자의 의무)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원정보 변경 시 즉시 수정해야 합니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
            <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 해서는 안 됩니다.</li>
            <li>서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제9조 (금지 콘텐츠)</h2>
          <p>이용자는 다음 각 호에 해당하는 콘텐츠를 게시하거나 전송할 수 없습니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>성매매를 알선, 권유, 유인 또는 강요하는 내용</li>
            <li>음란물 또는 선정적인 표현이 포함된 구인·구직 게시물</li>
            <li>허가되지 않은 불법 업소의 광고</li>
            <li>청소년 고용을 유도하거나 연령을 속이도록 하는 내용</li>
            <li>타인의 명예를 훼손하거나 개인정보를 침해하는 내용</li>
            <li>기타 관련 법령에 위반되는 내용</li>
          </ul>
          <p className="mt-2">
            회사는 위 각 호에 해당하는 게시물을 사전 통보 없이 삭제할 수 있으며,
            해당 이용자의 서비스 이용을 제한할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제10조 (결제 및 환불)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>유료 광고 서비스는 무통장 입금(계좌이체) 방식으로 결제할 수 있습니다.</li>
            <li>결제 후 광고가 게재되기 전(입금 대기 상태): 전액 환불이 가능합니다.</li>
            <li>광고가 게재(활성화)된 이후: 환불이 불가합니다.</li>
            <li>회사의 귀책사유로 서비스가 제공되지 않은 경우: 전액 환불합니다.</li>
            <li>환불 신청은 고객센터(1588-7928)로 연락해주시기 바랍니다.</li>
            <li>환불 처리 기간은 신청일로부터 영업일 기준 7일 이내입니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제11조 (플랫폼 중개자의 지위)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회사는 구인·구직 정보를 중개하는 플랫폼을 제공할 뿐이며, 이용자가 등록한 구인·구직 정보의
              진실성, 정확성 및 적법성을 보증하지 않습니다.
            </li>
            <li>
              구인 업체가 제공한 사업자 정보, 업종, 근무조건 등의 정확성에 대한 책임은 해당 게시자에게 있으며,
              회사의 사업자등록번호 인증은 해당 번호의 진위 여부 확인에 한합니다.
            </li>
            <li>
              이용자는 구인·구직 게시물의 내용을 스스로 판단하여야 하며, 게시물의 내용을 신뢰하여
              발생한 손해에 대해 회사는 책임을 지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제12조 (게시물에 대한 책임)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              이용자가 등록한 광고, 이력서, 게시글 등 모든 게시물의 내용에 대한 법적 책임은
              해당 게시물을 작성한 이용자에게 있습니다.
            </li>
            <li>
              회사는 이용자의 게시물이 관련 법령을 준수하는지 사전에 심사할 의무가 없으나,
              관련 법령 위반이 의심되는 게시물에 대해서는 삭제, 이동, 등록 거부 등의 조치를 취할 수 있습니다.
            </li>
            <li>
              회사는 다음 각 호의 사유가 있는 경우 게시물을 삭제하거나 게시자의 서비스 이용을 제한할 수 있습니다.
            </li>
          </ul>
          <ul className="mt-1 list-disc space-y-1 pl-10">
            <li>다른 이용자 또는 제3자의 신고가 접수된 경우</li>
            <li>수사기관, 방송통신위원회 등 공공기관의 요청이 있는 경우</li>
            <li>제9조(금지 콘텐츠)에 해당하는 내용이 확인된 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제13조 (신고 및 조치)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              이용자는 불법 또는 부적절한 게시물을 발견한 경우 회사에 신고할 수 있으며,
              회사는 신고 접수일로부터 합리적인 기간(영업일 기준 3일) 내에 검토 및 조치합니다.
            </li>
            <li>
              회사는 신고 접수 및 처리 내역을 기록·보관하며, 관련 법령에 따른 요청 시 이를 제공할 수 있습니다.
            </li>
            <li>
              이용자가 허위 신고를 반복하는 경우, 회사는 해당 이용자의 서비스 이용을 제한할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제14조 (이용자 간 분쟁)</h2>
          <p>
            이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 회사는 개입할 의무가 없으며,
            이로 인한 손해를 배상할 책임이 없습니다. 다만 회사는 분쟁 해결을 위해 필요한 범위에서
            관련 정보를 제공하는 등 협조할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제15조 (면책조항)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              회사는 천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우에는
              서비스 제공에 관한 책임이 면제됩니다.
            </li>
            <li>
              회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.
            </li>
            <li>
              회사는 이용자가 서비스를 통해 기대하는 수익을 얻지 못하거나 서비스를 통해 얻은
              정보로 인해 발생한 손해에 대해 책임을 지지 않습니다.
            </li>
            <li>
              회사는 이용자가 게시한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해서는 책임을 지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제16조 (준거법 및 관할법원)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>이 약관의 해석 및 회사와 이용자 간의 분쟁에 대해서는 대한민국 법률을 적용합니다.</li>
            <li>서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사의 본사 소재지를 관할하는 법원을 합의관할법원으로 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">부칙</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>이 약관은 2025년 2월 1일부터 시행합니다.</li>
            <li>2026년 3월 25일 개정된 약관(제11조~제16조 추가)은 2026년 3월 25일부터 시행합니다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
