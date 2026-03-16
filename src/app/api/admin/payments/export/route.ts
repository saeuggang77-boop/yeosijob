import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);
    const type = searchParams.get("type") || "TAX_INVOICE"; // TAX_INVOICE | CASH_RECEIPT | ALL

    // 해당 월의 시작/끝
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 승인된 결제 중 해당 증빙 타입 필터
    const where: Record<string, unknown> = {
      status: "APPROVED",
      paidAt: { gte: startDate, lt: endDate },
    };

    if (type === "TAX_INVOICE") {
      where.receiptType = "TAX_INVOICE";
    } else if (type === "CASH_RECEIPT") {
      where.receiptType = "CASH_RECEIPT";
    }
    // ALL이면 receiptType 필터 없음 (전체 승인 건)

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paidAt: "asc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            businessName: true,
            businessNumber: true,
            bizOwnerName: true,
          },
        },
        ad: { select: { title: true, businessName: true } },
        partner: { select: { name: true } },
      },
    });

    // 엑셀 데이터 생성
    const rows = payments.map((p, i) => {
      const snapshot = p.itemSnapshot as {
        product?: { name: string };
        duration?: number;
      } | null;

      const supplyAmount = Math.round(p.amount / 1.1);
      const vat = p.amount - supplyAmount;

      const receiptLabel =
        p.receiptType === "TAX_INVOICE"
          ? "세금계산서"
          : p.receiptType === "CASH_RECEIPT"
            ? "현금영수증"
            : p.receiptType === "NONE"
              ? "미발행"
              : "-";

      return {
        "No": i + 1,
        "주문번호": p.orderId,
        "거래일자": p.paidAt ? p.paidAt.toLocaleDateString("ko-KR") : "-",
        "업체명": p.ad?.businessName || p.partner?.name || p.user?.businessName || "-",
        "사업자등록번호": p.user?.businessNumber || "-",
        "대표자명": p.user?.bizOwnerName || "-",
        "증빙유형": receiptLabel,
        "이메일": p.receiptType === "TAX_INVOICE" ? (p.taxEmail || "-") : (p.receiptType === "CASH_RECEIPT" ? "-" : "-"),
        "현금영수증번호": p.receiptType === "CASH_RECEIPT" ? (p.cashReceiptNo || "-") : "-",
        "상품명": snapshot?.product?.name || "-",
        "기간(일)": snapshot?.duration || "-",
        "공급가액": supplyAmount,
        "세액": vat,
        "합계금액": p.amount,
      };
    });

    // 합계 행 추가
    if (rows.length > 0) {
      const totalSupply = rows.reduce((s, r) => s + (typeof r["공급가액"] === "number" ? r["공급가액"] : 0), 0);
      const totalVat = rows.reduce((s, r) => s + (typeof r["세액"] === "number" ? r["세액"] : 0), 0);
      const totalAmount = rows.reduce((s, r) => s + (typeof r["합계금액"] === "number" ? r["합계금액"] : 0), 0);

      rows.push({
        "No": "" as unknown as number,
        "주문번호": "",
        "거래일자": "",
        "업체명": "",
        "사업자등록번호": "",
        "대표자명": "",
        "증빙유형": "",
        "이메일": "",
        "현금영수증번호": "",
        "상품명": `합계 (${payments.length}건)`,
        "기간(일)": "" as unknown as number,
        "공급가액": totalSupply,
        "세액": totalVat,
        "합계금액": totalAmount,
      });
    }

    // 엑셀 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // 열 너비 설정
    ws["!cols"] = [
      { wch: 5 },   // No
      { wch: 28 },  // 주문번호
      { wch: 12 },  // 거래일자
      { wch: 20 },  // 업체명
      { wch: 15 },  // 사업자등록번호
      { wch: 10 },  // 대표자명
      { wch: 10 },  // 증빙유형
      { wch: 25 },  // 이메일
      { wch: 15 },  // 현금영수증번호
      { wch: 15 },  // 상품명
      { wch: 8 },   // 기간
      { wch: 12 },  // 공급가액
      { wch: 10 },  // 세액
      { wch: 12 },  // 합계금액
    ];

    const typeLabel = type === "TAX_INVOICE" ? "세금계산서" : type === "CASH_RECEIPT" ? "현금영수증" : "전체";
    const sheetName = `${year}년${month}월_${typeLabel}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = encodeURIComponent(`여시잡_${typeLabel}_${year}년${String(month).padStart(2, "0")}월.xlsx`);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
      },
    });
  } catch (error) {
    console.error("Payment export error:", error);
    return NextResponse.json({ error: "엑셀 생성에 실패했습니다" }, { status: 500 });
  }
}
