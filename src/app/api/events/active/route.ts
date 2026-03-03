import { getActiveEvent } from "@/lib/event";
import { NextResponse } from "next/server";

export async function GET() {
  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({
    active: true,
    eventName: event.eventName,
    bonus30: event.bonus30,
    bonus60: event.bonus60,
    bonus90: event.bonus90,
    endDate: event.endDate?.toISOString() || null,
  });
}
