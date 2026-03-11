import { TOSS_API_URL, TOSS_SECRET_KEY, assertTossKeys } from "./client";

interface ConfirmPaymentParams {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  card?: {
    company: string;
    number: string;
    receiptUrl: string;
  };
  easyPay?: {
    provider: string;
  };
  receipt?: {
    url: string;
  };
  virtualAccount?: {
    accountNumber: string;
    bank: string;
    customerName: string;
    dueDate: string;
    expired: boolean;
    bankCode: string;
  };
}

export async function confirmTossPayment(
  params: ConfirmPaymentParams
): Promise<TossPaymentResponse> {
  assertTossKeys();
  const { paymentKey, orderId, amount } = params;

  const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "결제 승인에 실패했습니다");
  }

  return response.json();
}
