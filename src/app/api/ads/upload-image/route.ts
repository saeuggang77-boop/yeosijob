import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_WIDTH = 1200;
const QUALITY = 80;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "BUSINESS") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { success } = checkRateLimit(`ad-upload:${session.user.id}`, 20, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일을 선택해주세요" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하만 가능합니다" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress and convert to WebP
    let processedBuffer: Buffer;
    let contentType: string;
    let ext: string;

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (metadata.width && metadata.width > MAX_WIDTH) {
        processedBuffer = await image
          .resize(MAX_WIDTH, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer();
      } else {
        processedBuffer = await image.webp({ quality: QUALITY }).toBuffer();
      }
      contentType = "image/webp";
      ext = "webp";
    } catch {
      processedBuffer = buffer;
      contentType = file.type;
      ext = file.name.split(".").pop() || "jpg";
    }

    const timestamp = Date.now();
    const blobPath = `ads/${session.user.id}/${timestamp}.${ext}`;

    const blob = await put(blobPath, processedBuffer, {
      access: "public",
      contentType,
    });

    return NextResponse.json({
      url: blob.url,
      size: processedBuffer.length,
    });
  } catch (error) {
    console.error("Ad image upload error:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
