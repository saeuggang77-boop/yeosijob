import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeFile, unlink, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const { success } = checkRateLimit(`upload:${session.user.id}`, 10, 60_000);
    if (!success) {
      return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요" }, { status: 429 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "파일을 선택해주세요" }, { status: 400 });
    }
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "파일을 선택해주세요" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다" },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하만 가능합니다" }, { status: 400 });
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), "public/uploads/resumes");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Delete previous photo if exists
    const allFiles = await readdir(uploadDir);
    const previousFiles = allFiles.filter((f) => f.startsWith(`${session.user.id}-`));
    for (const prevFile of previousFiles) {
      try {
        await unlink(path.join(uploadDir, prevFile));
      } catch (error) {
        console.error("Failed to delete previous file:", error);
      }
    }

    // Generate filename
    const ext = path.extname(file.name);
    const timestamp = Date.now();
    const filename = `${session.user.id}-${timestamp}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const url = `/uploads/resumes/${filename}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "파일 업로드 중 오류가 발생했습니다" }, { status: 500 });
  }
}
