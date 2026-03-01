"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BizVerifyModal } from "@/components/business/BizVerifyModal";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerificationStatusProps {
  isVerified: boolean;
}

export function VerificationStatus({ isVerified }: VerificationStatusProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isVerified ? (
                <>
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">사업자 인증 완료</p>
                    <p className="text-xs text-muted-foreground">광고 등록이 가능합니다</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium">미인증</p>
                    <p className="text-xs text-muted-foreground">사업자 인증이 필요합니다</p>
                  </div>
                </>
              )}
            </div>
            {!isVerified && (
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
              >
                인증하기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <BizVerifyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onVerified={() => {
          setShowModal(false);
          router.refresh();
        }}
      />
    </>
  );
}
