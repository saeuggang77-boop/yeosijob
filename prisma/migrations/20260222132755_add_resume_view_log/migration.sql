-- CreateTable
CREATE TABLE "resume_view_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_view_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_view_logs_userId_viewedAt_idx" ON "resume_view_logs"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "resume_view_logs_resumeId_idx" ON "resume_view_logs"("resumeId");

-- AddForeignKey
ALTER TABLE "resume_view_logs" ADD CONSTRAINT "resume_view_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_view_logs" ADD CONSTRAINT "resume_view_logs_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
