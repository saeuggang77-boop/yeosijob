/** Strip HTML tags from user input to prevent stored XSS */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  // 휴대폰 11자리: 010-1234-5678
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  // 서울 10자리: 02-1234-5678
  if (cleaned.length === 10 && cleaned.startsWith("02")) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  // 지방 10자리: 051-802-3313
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  // 서울 9자리: 02-123-5678
  if (cleaned.length === 9 && cleaned.startsWith("02")) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  // 대표번호 8자리: 1588-1234
  if (cleaned.length === 8 && !cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR");
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 네이버 카페 스타일: 오늘 → HH:mm, 이전 → YYYY.MM.DD. */
export function formatDateSmart(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const kst = (dt: Date) => new Date(dt.getTime() + 9 * 60 * 60 * 1000);
  const kstD = kst(d);
  const kstNow = kst(now);

  const isToday =
    kstD.getUTCFullYear() === kstNow.getUTCFullYear() &&
    kstD.getUTCMonth() === kstNow.getUTCMonth() &&
    kstD.getUTCDate() === kstNow.getUTCDate();

  if (isToday) {
    return `${String(kstD.getUTCHours()).padStart(2, "0")}:${String(kstD.getUTCMinutes()).padStart(2, "0")}`;
  }
  return `${kstD.getUTCFullYear()}.${String(kstD.getUTCMonth() + 1).padStart(2, "0")}.${String(kstD.getUTCDate()).padStart(2, "0")}.`;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return formatDate(date);
}
