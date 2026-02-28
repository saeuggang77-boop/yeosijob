import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = [
  "notifyMessage",
  "notifyComment",
  "notifyNotice",
  "notifyLike",
  "notifyResume",
  "quietHoursStart",
  "quietHoursEnd",
] as const;

const BOOLEAN_FIELDS = ["notifyMessage", "notifyComment", "notifyNotice", "notifyLike", "notifyResume"];

// GET: 현재 사용자의 알림 설정 반환
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        notifyMessage: true,
        notifyComment: true,
        notifyNotice: true,
        notifyLike: true,
        notifyResume: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Notification settings GET error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH: 알림 설정 업데이트 (부분 업데이트 가능)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Record<string, boolean | number | null> = {};

    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        const value = body[field];

        if (BOOLEAN_FIELDS.includes(field)) {
          if (typeof value !== "boolean") {
            return NextResponse.json(
              { error: `${field}는 true/false 값이어야 합니다` },
              { status: 400 }
            );
          }
          updateData[field] = value;
        } else {
          // quietHoursStart / quietHoursEnd
          if (value !== null && (typeof value !== "number" || value < 0 || value > 23)) {
            return NextResponse.json(
              { error: `${field}는 0-23 사이 숫자 또는 null이어야 합니다` },
              { status: 400 }
            );
          }
          updateData[field] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "변경할 설정이 없습니다" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        notifyMessage: true,
        notifyComment: true,
        notifyNotice: true,
        notifyLike: true,
        notifyResume: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Notification settings PATCH error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
