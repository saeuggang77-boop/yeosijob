import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_WIDTH = 1200;
const QUALITY = 80;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일을 선택해주세요" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, GIF, WEBP 형식의 이미지만 업로드 가능합니다" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하만 가능합니다" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress and convert to WebP using sharp
    let processedBuffer: Buffer;
    const contentType = "image/webp";

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if width exceeds MAX_WIDTH
      if (metadata.width && metadata.width > MAX_WIDTH) {
        processedBuffer = await image
          .resize(MAX_WIDTH, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer();
      } else {
        processedBuffer = await image.webp({ quality: QUALITY }).toBuffer();
      }
    } catch (error) {
      console.error("Image processing error:", error);
      return NextResponse.json(
        { error: "이미지 처리 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // Generate blob path
    const timestamp = Date.now();
    const blobPath = `posts/${session.user.id}/${timestamp}.webp`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, processedBuffer, {
      access: "public",
      contentType,
    });

    return NextResponse.json({
      url: blob.url,
      blobPath: blobPath,
      size: processedBuffer.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
