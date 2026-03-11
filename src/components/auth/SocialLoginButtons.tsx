"use client";

import { signIn } from "next-auth/react";

interface SocialLoginButtonsProps {
  mode: "login" | "register";
  role?: "JOBSEEKER" | "BUSINESS";
}

export function SocialLoginButtons({ mode, role }: SocialLoginButtonsProps) {
  const handleSocialLogin = (provider: "kakao" | "google") => {
    if (mode === "register" && role) {
      // 회원가입 모드: 역할 쿠키 설정
      document.cookie = `register-role=${role}; path=/; max-age=300; SameSite=Lax`;
    } else {
      // 로그인 모드: 쿠키 클리어
      document.cookie = "register-role=; path=/; max-age=0";
    }
    signIn(provider, { callbackUrl: "/" });
  };

  const buttonText = {
    kakao: mode === "login" ? "카카오 로그인" : "카카오로 가입",
    google: mode === "login" ? "Google 로그인" : "Google로 가입",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleSocialLogin("kakao")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] text-sm font-medium text-[#000000D9] transition-colors hover:bg-[#FDD835]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#000000D9"
            d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.42 4.07 3.56 5.14l-.91 3.34c-.08.28.24.5.48.34l3.96-2.62c.29.03.59.05.91.05 4.42 0 8-2.79 8-6.25S13.42 1 9 1z"
          />
        </svg>
        {buttonText.kakao}
      </button>

      <button
        type="button"
        onClick={() => handleSocialLogin("google")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.17.28-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        {buttonText.google}
      </button>
    </>
  );
}
