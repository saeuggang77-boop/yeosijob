import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // Get or create singleton config
    let config = await prisma.eventConfig.findUnique({
      where: { id: "singleton" },
    });

    if (!config) {
      config = await prisma.eventConfig.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Event config fetch error:", error);
    return NextResponse.json(
      { error: "설정을 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const {
      enabled,
      eventName,
      startDate,
      endDate,
      bonus30,
      bonus60,
      bonus90,
      targetNewOnly,
    } = body;

    const updateData: {
      enabled?: boolean;
      eventName?: string;
      startDate?: Date | null;
      endDate?: Date | null;
      bonus30?: number;
      bonus60?: number;
      bonus90?: number;
      targetNewOnly?: boolean;
    } = {};

    if (typeof enabled === "boolean") updateData.enabled = enabled;
    if (typeof eventName === "string") updateData.eventName = eventName;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (typeof bonus30 === "number") updateData.bonus30 = bonus30;
    if (typeof bonus60 === "number") updateData.bonus60 = bonus60;
    if (typeof bonus90 === "number") updateData.bonus90 = bonus90;
    if (typeof targetNewOnly === "boolean") updateData.targetNewOnly = targetNewOnly;

    const config = await prisma.eventConfig.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        enabled: enabled ?? false,
        eventName: eventName ?? "기간 추가 이벤트",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        bonus30: bonus30 ?? 10,
        bonus60: bonus60 ?? 30,
        bonus90: bonus90 ?? 60,
        targetNewOnly: targetNewOnly ?? true,
      },
      update: updateData,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Event config update error:", error);
    return NextResponse.json(
      { error: "설정 저장에 실패했습니다" },
      { status: 500 }
    );
  }
}
