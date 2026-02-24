"use client";

export function FloatingChatButton() {
  return (
    <a
      href="https://pf.kakao.com/_zEqYG/chat"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-[#FEE500] px-4 py-3 font-medium text-[#3C1E1E] shadow-lg transition-transform hover:scale-105 md:bottom-6"
      aria-label="카카오톡 상담"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
        <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.66 6.6l-.86 3.18c-.05.2.17.36.34.25l3.77-2.5c.67.1 1.36.16 2.09.16 5.52 0 10-3.58 10-7.99S17.52 3 12 3z"/>
      </svg>
      <span className="hidden text-sm font-bold sm:inline">고객센터</span>
    </a>
  );
}
