"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

const LOGIN_URL = "/login";

/**
 * Smart Hide 헤더 (헤드룸 패턴)
 * - 페이지 최상단(스크롤 < 10px): 항상 표시
 * - 스크롤 다운: 헤더 숨김 (translateY(-100%))
 * - 스크롤 업: 헤더 다시 표시
 */
export default function SmartHeader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setHidden(false);
      } else if (currentY > lastY + 4) {
        setHidden(true);
      } else if (currentY < lastY - 4) {
        setHidden(false);
      }
      lastY = currentY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`${styles.siteHeader} ${hidden ? styles.siteHeaderHidden : ""}`}
    >
      <div className={styles.siteLogo}>여시잡</div>
      <Link href={LOGIN_URL} className={styles.headerBtn}>
        로그인
      </Link>
    </div>
  );
}
