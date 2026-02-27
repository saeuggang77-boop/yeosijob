"use client";

import { useEffect, useRef } from "react";
import { BANNER_COLORS } from "@/lib/constants/banner-themes";
import { getBannerImageUrl } from "@/lib/constants/banner-images";

interface BannerProps {
  title?: string | null;
  subtitle?: string | null;
  businessName: string;
  businessIcon?: string;
  businessLabel?: string;
  businessType?: string;
  salaryText: string;
  regionLabel?: string;
  template: number;
  colorIndex: number;
  size: "sm" | "lg";
}

/* ------------------------------------------------------------------ */
/*  Keyframes (injected once via <style>)                             */
/* ------------------------------------------------------------------ */
const KEYFRAMES = `
@keyframes bn-twinkle{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes bn-aurora-shift{0%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(30px,-20px) rotate(8deg)}100%{transform:translate(0,0) rotate(0deg)}}
@keyframes bn-neon-flicker{0%,19%,21%,23%,25%,54%,56%,100%{text-shadow:0 0 4px var(--banner-main),0 0 11px var(--banner-main),0 0 19px var(--banner-main),0 0 40px var(--banner-sub)}20%,24%,55%{text-shadow:none}}
@keyframes bn-float-up{0%{transform:translateY(100%) scale(.5);opacity:0}50%{opacity:1}100%{transform:translateY(-20px) scale(1);opacity:0}}
@keyframes bn-shine-sweep{0%{left:-30%}100%{left:130%}}
@keyframes bn-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes bn-holo-bg{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes bn-prism-move{0%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(30%,-30%) scale(1.5)}100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes bn-scan{0%{top:-10%}100%{top:110%}}
@keyframes bn-glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-2px)}}
@keyframes bn-orb{0%{transform:translate(0,0) scale(1)}33%{transform:translate(20px,-15px) scale(1.2)}66%{transform:translate(-15px,10px) scale(0.8)}100%{transform:translate(0,0) scale(1)}}
@keyframes bn-spotlight{0%{transform:translate(-50%,-50%) scale(1);opacity:.25}50%{transform:translate(-40%,-40%) scale(1.3);opacity:.35}100%{transform:translate(-50%,-50%) scale(1);opacity:.25}}
@keyframes bn-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes bn-pulse{0%,100%{opacity:.15}50%{opacity:.35}}
@keyframes bn-meteor{0%{transform:translate(0,0);opacity:1}100%{transform:translate(300px,100px);opacity:0}}
@keyframes bn-node-pulse{0%,100%{r:2}50%{r:4}}
@keyframes bn-mesh-shift{0%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.1) rotate(3deg)}100%{transform:scale(1) rotate(0deg)}}
@keyframes bn-edge-glow{0%{box-shadow:inset 0 0 15px var(--banner-main),0 0 15px var(--banner-main)}50%{box-shadow:inset 0 0 25px var(--banner-sub),0 0 25px var(--banner-sub)}100%{box-shadow:inset 0 0 15px var(--banner-main),0 0 15px var(--banner-main)}}
@keyframes bn-flame{0%{transform:scaleY(1) translateY(0);opacity:.8}50%{transform:scaleY(1.4) translateY(-8px);opacity:.5}100%{transform:scaleY(1) translateY(0);opacity:.8}}
@keyframes bn-frost-sparkle{0%,100%{opacity:.3}50%{opacity:.8}}
@keyframes bn-circuit-pulse{0%,100%{stroke-dashoffset:0}50%{stroke-dashoffset:20}}
@keyframes bn-rays{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes bn-particle-float{0%{transform:translate(0,0);opacity:.6}25%{transform:translate(10px,-20px);opacity:1}50%{transform:translate(-5px,-35px);opacity:.6}75%{transform:translate(15px,-50px);opacity:.3}100%{transform:translate(0,-70px);opacity:0}}
@keyframes bn-ribbon-wave{0%{transform:skewX(-5deg)}50%{transform:skewX(5deg)}100%{transform:skewX(-5deg)}}
@keyframes bn-smoke{0%{transform:translateY(0) scale(1);opacity:.3}50%{transform:translateY(-30px) scale(1.5);opacity:.15}100%{transform:translateY(-60px) scale(2);opacity:0}}
@keyframes bn-prism-split{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
`;

let stylesInjected = false;

export function Banner({
  title,
  subtitle,
  businessName,
  businessIcon,
  businessLabel,
  businessType,
  salaryText,
  regionLabel,
  template,
  colorIndex,
  size,
}: BannerProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (stylesInjected) return;
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    styleRef.current = style;
    stylesInjected = true;
  }, []);

  const color = BANNER_COLORS[Math.min(Math.max(colorIndex, 0), BANNER_COLORS.length - 1)];
  const tpl = Math.min(Math.max(template, 0), 29);
  const isLg = size === "lg";
  const displayTitle = title || businessName;

  const cssVars: React.CSSProperties = {
    "--banner-main": color.main,
    "--banner-sub": color.sub,
    "--banner-bg": color.bg,
  } as React.CSSProperties;

  const h = isLg ? 180 : 120;

  const bgImageUrl = businessType ? getBannerImageUrl(businessType, tpl) : null;

  /* ---------- Template renderer ---------- */
  const bgLayers = getTemplateBg(tpl, color, isLg);
  const overlayEls = getTemplateOverlay(tpl, color, isLg);

  const wrapperBg = bgImageUrl ? { background: '#0a0a0a' } : bgLayers.bg;

  const wrapperBase: React.CSSProperties = {
    ...cssVars,
    height: h,
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
  };

  const contentZIndex: React.CSSProperties = {
    position: "relative",
    zIndex: 10,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: isLg ? "20px 28px" : "12px 16px",
  };

  return (
    <div
      style={{ ...wrapperBase, ...wrapperBg }}
      className="group"
    >
      {/* Background image */}
      {bgImageUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.4) saturate(1.3)",
          }}
        />
      )}
      {/* Dark overlay for text readability */}
      {bgImageUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, rgba(0,0,0,0.5) 0%, ${rgba(color.main, 0.15)} 50%, rgba(0,0,0,0.4) 100%)`,
          }}
        />
      )}

      {/* Background decorations */}
      {bgLayers.elements}

      {/* Overlay effects */}
      {overlayEls}

      {/* Content */}
      <div style={contentZIndex}>
        {isLg ? (
          <LargeContent
            displayTitle={displayTitle}
            subtitle={subtitle}
            businessName={businessName}
            title={title}
            businessIcon={businessIcon}
            businessLabel={businessLabel}
            salaryText={salaryText}
            regionLabel={regionLabel}
            color={color}
          />
        ) : (
          <SmallContent
            displayTitle={displayTitle}
            subtitle={subtitle}
            businessName={businessName}
            title={title}
            color={color}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Content layouts                                                   */
/* ------------------------------------------------------------------ */
function SmallContent({
  displayTitle,
  subtitle,
  businessName,
  title,
  color,
}: {
  displayTitle: string;
  subtitle?: string | null;
  businessName: string;
  title?: string | null;
  color: (typeof BANNER_COLORS)[0];
}) {
  return (
    <>
      <p
        style={{ color: color.main, fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}
        className="truncate"
      >
        {displayTitle}
      </p>
      {title && (
        <p
          style={{ color: color.sub, fontSize: 11, marginTop: 4, opacity: 0.8 }}
          className="truncate"
        >
          {businessName}
        </p>
      )}
      {subtitle && (
        <p
          style={{ color: color.sub, fontSize: 10, marginTop: 2, opacity: 0.7 }}
          className="truncate"
        >
          {subtitle}
        </p>
      )}
    </>
  );
}

function LargeContent({
  displayTitle,
  subtitle,
  businessName,
  title,
  businessIcon,
  businessLabel,
  salaryText,
  regionLabel,
  color,
}: {
  displayTitle: string;
  subtitle?: string | null;
  businessName: string;
  title?: string | null;
  businessIcon?: string;
  businessLabel?: string;
  salaryText: string;
  regionLabel?: string;
  color: (typeof BANNER_COLORS)[0];
}) {
  return (
    <div className="flex h-full items-center justify-between">
      <div className="min-w-0 flex-1">
        {businessLabel && (
          <div className="flex items-center gap-1.5">
            {businessIcon && <span className="text-sm">{businessIcon}</span>}
            <span style={{ color: color.sub, fontSize: 11, opacity: 0.7 }}>{businessLabel}</span>
          </div>
        )}
        <p
          style={{
            color: color.main,
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.2,
            marginTop: 4,
          }}
          className="truncate"
        >
          {displayTitle}
        </p>
        {title && (
          <p
            style={{ color: color.sub, fontSize: 13, marginTop: 2, opacity: 0.7 }}
            className="truncate"
          >
            {businessName}
          </p>
        )}
        {subtitle && (
          <p
            style={{ color: color.sub, fontSize: 12, marginTop: 2, opacity: 0.65 }}
            className="truncate"
          >
            {subtitle}
          </p>
        )}
        {regionLabel && (
          <p style={{ color: `${color.sub}99`, fontSize: 11, marginTop: 4 }} className="truncate">
            {regionLabel}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right pl-4">
        <p style={{ color: color.sub, fontSize: 20, fontWeight: 700 }}>{salaryText}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: color with alpha                                          */
/* ------------------------------------------------------------------ */
function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ------------------------------------------------------------------ */
/*  30 Template backgrounds                                          */
/* ------------------------------------------------------------------ */
type C = (typeof BANNER_COLORS)[0];
interface TplResult {
  bg: React.CSSProperties;
  elements: React.ReactNode;
}

function getTemplateBg(tpl: number, c: C, isLg: boolean): TplResult {
  switch (tpl) {
    /* 0: Aurora ---------------------------------------------------- */
    case 0:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Aurora layers */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  linear-gradient(135deg, ${rgba(c.main, 0.3)} 0%, transparent 50%),
                  linear-gradient(225deg, ${rgba(c.sub, 0.2)} 0%, transparent 50%),
                  linear-gradient(315deg, ${rgba(c.main, 0.15)} 0%, transparent 50%)
                `,
                filter: "blur(30px)",
                animation: "bn-aurora-shift 8s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  linear-gradient(45deg, transparent 30%, ${rgba(c.sub, 0.15)} 50%, transparent 70%)
                `,
                filter: "blur(25px)",
                animation: "bn-aurora-shift 12s ease-in-out infinite reverse",
              }}
            />
            {/* Stars */}
            {[...Array(isLg ? 12 : 6)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: i % 3 === 0 ? 3 : 2,
                  height: i % 3 === 0 ? 3 : 2,
                  borderRadius: "50%",
                  background: "#fff",
                  left: `${10 + (i * 37) % 80}%`,
                  top: `${15 + (i * 23) % 70}%`,
                  animation: `bn-twinkle ${1.5 + (i % 3) * 0.5}s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
            {/* Gradient border via mask */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                padding: 1,
                background: `linear-gradient(135deg, ${c.main}, ${c.sub}, ${c.main})`,
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
          </>
        ),
      };

    /* 1: Neon Glow ------------------------------------------------- */
    case 1:
      return {
        bg: {
          background: `radial-gradient(ellipse at 50% 50%, ${rgba(c.main, 0.08)} 0%, ${c.bg} 70%)`,
        },
        elements: (
          <>
            {/* Neon border */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                border: `2px solid ${c.main}`,
                boxShadow: `0 0 10px ${rgba(c.main, 0.5)}, inset 0 0 10px ${rgba(c.main, 0.1)}, 0 0 30px ${rgba(c.main, 0.2)}`,
              }}
            />
            {/* Glow spots */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "20%",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: rgba(c.main, 0.15),
                filter: "blur(30px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "30%",
                right: "15%",
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: rgba(c.sub, 0.1),
                filter: "blur(25px)",
              }}
            />
            {/* Neon line accents */}
            <div
              style={{
                position: "absolute",
                bottom: 15,
                left: "10%",
                width: "30%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${c.main}, transparent)`,
                boxShadow: `0 0 8px ${c.main}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 15,
                right: "10%",
                width: "20%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${c.sub}, transparent)`,
                boxShadow: `0 0 8px ${c.sub}`,
              }}
            />
          </>
        ),
      };

    /* 2: Luxury ----------------------------------------------------- */
    case 2:
      return {
        bg: {
          background: `linear-gradient(160deg, ${c.bg} 0%, ${rgba(c.main, 0.08)} 100%)`,
        },
        elements: (
          <>
            {/* SVG diamond pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.03,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L20 10L10 20L0 10Z' fill='%23fff'/%3E%3C/svg%3E")`,
                backgroundSize: "20px 20px",
              }}
            />
            {/* Floating particles */}
            {[...Array(isLg ? 8 : 4)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 3 + (i % 3),
                  height: 3 + (i % 3),
                  borderRadius: "50%",
                  background: c.main,
                  left: `${10 + (i * 27) % 80}%`,
                  bottom: 0,
                  opacity: 0.6,
                  animation: `bn-float-up ${3 + i * 0.5}s ease-in ${i * 0.7}s infinite`,
                }}
              />
            ))}
            {/* Shine sweep */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-30%",
                width: "20%",
                height: "100%",
                background: `linear-gradient(90deg, transparent, ${rgba(c.sub, 0.15)}, transparent)`,
                transform: "skewX(-20deg)",
                animation: "bn-shine-sweep 4s ease-in-out infinite",
              }}
            />
            {/* Double frame */}
            <div
              style={{
                position: "absolute",
                inset: 3,
                borderRadius: 10,
                border: `1px solid ${rgba(c.main, 0.25)}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 7,
                borderRadius: 8,
                border: `1px solid ${rgba(c.main, 0.12)}`,
              }}
            />
          </>
        ),
      };

    /* 3: Hologram --------------------------------------------------- */
    case 3:
      return {
        bg: {
          background: `linear-gradient(135deg,
            ${rgba(c.main, 0.15)}, ${rgba(c.sub, 0.1)},
            rgba(100,200,255,0.1), rgba(200,100,255,0.1),
            ${rgba(c.main, 0.15)}, ${rgba(c.sub, 0.1)})`,
          backgroundSize: "400% 400%",
          animation: "bn-holo-bg 6s ease infinite",
        },
        elements: (
          <>
            {/* Prism orb */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: isLg ? 150 : 80,
                height: isLg ? 150 : 80,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${rgba(c.main, 0.2)}, ${rgba(c.sub, 0.15)}, rgba(150,100,255,0.1))`,
                filter: "blur(40px)",
                animation: "bn-prism-move 10s ease-in-out infinite",
              }}
            />
            {/* Rainbow border */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                padding: 2,
                background: `linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #9b59b6, #ff6b6b)`,
                backgroundSize: "300% 300%",
                animation: "bn-holo-bg 4s linear infinite",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            {/* Subtle refraction lines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(135deg, transparent 0px, transparent 30px, ${rgba(c.sub, 0.04)} 30px, ${rgba(c.sub, 0.04)} 31px)`,
              }}
            />
          </>
        ),
      };

    /* 4: Cyberpunk -------------------------------------------------- */
    case 4:
      return {
        bg: {
          background: `linear-gradient(180deg, ${c.bg} 0%, ${rgba(c.main, 0.06)} 100%)`,
        },
        elements: (
          <>
            {/* Scanlines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, ${rgba(c.main, 0.03)} 2px, ${rgba(c.main, 0.03)} 4px)`,
              }}
            />
            {/* Grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `linear-gradient(${rgba(c.main, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(c.main, 0.06)} 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            />
            {/* Scan beam */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "-10%",
                width: "100%",
                height: 3,
                background: `linear-gradient(90deg, transparent, ${rgba(c.main, 0.6)}, transparent)`,
                boxShadow: `0 0 15px ${rgba(c.main, 0.4)}`,
                animation: "bn-scan 3s linear infinite",
              }}
            />
            {/* Corner cuts */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 20,
                height: 2,
                background: c.main,
                boxShadow: `0 0 8px ${c.main}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 2,
                height: 20,
                background: c.main,
                boxShadow: `0 0 8px ${c.main}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 20,
                height: 2,
                background: c.sub,
                boxShadow: `0 0 8px ${c.sub}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 2,
                height: 20,
                background: c.sub,
                boxShadow: `0 0 8px ${c.sub}`,
              }}
            />
            {/* Glowing stripe */}
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: "5%",
                width: "40%",
                height: 2,
                background: `linear-gradient(90deg, ${c.main}, transparent)`,
                boxShadow: `0 0 10px ${rgba(c.main, 0.5)}`,
              }}
            />
          </>
        ),
      };

    /* 5: Glass ------------------------------------------------------ */
    case 5:
      return {
        bg: {
          background: `linear-gradient(135deg, ${rgba(c.main, 0.1)} 0%, ${rgba(c.sub, 0.05)} 100%)`,
        },
        elements: (
          <>
            {/* Glowing orbs */}
            <div
              style={{
                position: "absolute",
                top: "20%",
                left: "15%",
                width: isLg ? 100 : 60,
                height: isLg ? 100 : 60,
                borderRadius: "50%",
                background: rgba(c.main, 0.2),
                filter: "blur(30px)",
                animation: "bn-orb 6s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10%",
                right: "20%",
                width: isLg ? 80 : 50,
                height: isLg ? 80 : 50,
                borderRadius: "50%",
                background: rgba(c.sub, 0.15),
                filter: "blur(25px)",
                animation: "bn-orb 8s ease-in-out 2s infinite",
              }}
            />
            {/* Glass panel */}
            <div
              style={{
                position: "absolute",
                inset: 6,
                borderRadius: 8,
                background: `rgba(255,255,255,0.03)`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${rgba(c.main, 0.15)}`,
                boxShadow: `inset 0 1px 0 ${rgba(c.sub, 0.1)}`,
              }}
            />
          </>
        ),
      };

    /* 6: Spotlight -------------------------------------------------- */
    case 6:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Main spotlight */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isLg ? "35%" : "50%",
                width: isLg ? 250 : 160,
                height: isLg ? 250 : 160,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${rgba(c.main, 0.25)} 0%, ${rgba(c.main, 0.1)} 40%, transparent 70%)`,
                transform: "translate(-50%, -50%)",
                animation: "bn-spotlight 5s ease-in-out infinite",
              }}
            />
            {/* Secondary light */}
            <div
              style={{
                position: "absolute",
                top: "30%",
                right: "10%",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${rgba(c.sub, 0.12)} 0%, transparent 70%)`,
              }}
            />
            {/* Vignette */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse at center, transparent 40%, ${rgba(c.bg, 0.8)} 100%)`,
              }}
            />
          </>
        ),
      };

    /* 7: Diamond ---------------------------------------------------- */
    case 7:
      return {
        bg: {
          background: `linear-gradient(160deg, ${c.bg} 0%, ${rgba(c.main, 0.05)} 100%)`,
        },
        elements: (
          <>
            {/* Diamond pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  linear-gradient(45deg, ${rgba(c.main, 0.04)} 25%, transparent 25%),
                  linear-gradient(-45deg, ${rgba(c.main, 0.04)} 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, ${rgba(c.main, 0.04)} 75%),
                  linear-gradient(-45deg, transparent 75%, ${rgba(c.main, 0.04)} 75%)
                `,
                backgroundSize: "30px 30px",
                backgroundPosition: "0 0, 0 15px, 15px -15px, -15px 0",
              }}
            />
            {/* Ornate frame */}
            <div
              style={{
                position: "absolute",
                inset: 5,
                borderRadius: 8,
                border: `2px solid ${rgba(c.main, 0.3)}`,
              }}
            />
            {/* Corner diamonds */}
            {[
              { top: 2, left: 2 },
              { top: 2, right: 2 },
              { bottom: 2, left: 2 },
              { bottom: 2, right: 2 },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  ...pos,
                  width: 10,
                  height: 10,
                  background: c.main,
                  transform: "rotate(45deg)",
                  opacity: 0.4,
                } as React.CSSProperties}
              />
            ))}
            {/* Shimmer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-30%",
                width: "15%",
                height: "100%",
                background: `linear-gradient(90deg, transparent, ${rgba(c.sub, 0.1)}, transparent)`,
                transform: "skewX(-20deg)",
                animation: "bn-shine-sweep 5s ease-in-out infinite",
              }}
            />
          </>
        ),
      };

    /* 8: Wave ------------------------------------------------------- */
    case 8:
      return {
        bg: {
          background: `linear-gradient(180deg, ${c.bg} 0%, ${rgba(c.main, 0.08)} 100%)`,
        },
        elements: (
          <>
            {/* Wave layers */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: -20 + i * 15,
                  left: "-50%",
                  width: "200%",
                  height: 60,
                  borderRadius: "40%",
                  background: rgba(c.main, 0.06 + i * 0.03),
                  animation: `bn-wave ${8 + i * 2}s linear infinite`,
                  animationDelay: `${i * -2}s`,
                }}
              />
            ))}
            {/* Top accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 2,
                background: `linear-gradient(90deg, transparent, ${c.main}, transparent)`,
              }}
            />
          </>
        ),
      };

    /* 9: Minimal Line ---------------------------------------------- */
    case 9:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Left accent line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "15%",
                width: 4,
                height: "70%",
                borderRadius: 2,
                background: `linear-gradient(180deg, ${c.main}, ${c.sub})`,
                boxShadow: `0 0 12px ${rgba(c.main, 0.4)}`,
              }}
            />
            {/* Subtle dot accent */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: c.main,
                opacity: 0.4,
              }}
            />
            {/* Minimal bottom line */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: 1,
                background: `linear-gradient(90deg, ${c.main}, transparent)`,
                opacity: 0.2,
              }}
            />
          </>
        ),
      };

    /* 10: Split ----------------------------------------------------- */
    case 10:
      return {
        bg: {
          background: `linear-gradient(90deg, ${rgba(c.main, 0.12)} 0%, ${rgba(c.main, 0.12)} 40%, ${c.bg} 40%, ${c.bg} 100%)`,
        },
        elements: (
          <>
            {/* Split line */}
            <div
              style={{
                position: "absolute",
                left: "40%",
                top: "10%",
                width: 2,
                height: "80%",
                background: `linear-gradient(180deg, transparent, ${c.main}, transparent)`,
                boxShadow: `0 0 10px ${rgba(c.main, 0.3)}`,
              }}
            />
            {/* Colored side pattern */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "40%",
                height: "100%",
                backgroundImage: `radial-gradient(circle at 50% 50%, ${rgba(c.sub, 0.1)} 0%, transparent 70%)`,
              }}
            />
            {/* Accent dots on dark side */}
            <div
              style={{
                position: "absolute",
                right: "10%",
                top: "50%",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: c.main,
                opacity: 0.3,
                transform: "translateY(-50%)",
              }}
            />
          </>
        ),
      };

    /* 11: Corner Frame --------------------------------------------- */
    case 11:
      return {
        bg: {
          background: `radial-gradient(ellipse at 50% 50%, ${rgba(c.main, 0.05)} 0%, ${c.bg} 70%)`,
        },
        elements: (
          <>
            {/* Four corner brackets */}
            {/* Top-left */}
            <div style={{ position: "absolute", top: 8, left: 8, width: 24, height: 24 }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: c.main, boxShadow: `0 0 6px ${c.main}` }} />
              <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: "100%", background: c.main, boxShadow: `0 0 6px ${c.main}` }} />
            </div>
            {/* Top-right */}
            <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24 }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "100%", height: 2, background: c.main, boxShadow: `0 0 6px ${c.main}` }} />
              <div style={{ position: "absolute", top: 0, right: 0, width: 2, height: "100%", background: c.main, boxShadow: `0 0 6px ${c.main}` }} />
            </div>
            {/* Bottom-left */}
            <div style={{ position: "absolute", bottom: 8, left: 8, width: 24, height: 24 }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 2, background: c.sub, boxShadow: `0 0 6px ${c.sub}` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: 2, height: "100%", background: c.sub, boxShadow: `0 0 6px ${c.sub}` }} />
            </div>
            {/* Bottom-right */}
            <div style={{ position: "absolute", bottom: 8, right: 8, width: 24, height: 24 }}>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: "100%", height: 2, background: c.sub, boxShadow: `0 0 6px ${c.sub}` }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 2, height: "100%", background: c.sub, boxShadow: `0 0 6px ${c.sub}` }} />
            </div>
            {/* Center glow */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: rgba(c.main, 0.06),
                filter: "blur(30px)",
                transform: "translate(-50%, -50%)",
              }}
            />
          </>
        ),
      };

    /* 12: Stripe ---------------------------------------------------- */
    case 12:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Diagonal stripes */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(
                  -45deg,
                  transparent 0px,
                  transparent 20px,
                  ${rgba(c.main, 0.06)} 20px,
                  ${rgba(c.main, 0.06)} 22px
                )`,
              }}
            />
            {/* Accent stripe */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: isLg ? "25%" : "30%",
                width: isLg ? 60 : 40,
                height: "100%",
                background: `linear-gradient(180deg, ${rgba(c.main, 0.15)}, ${rgba(c.sub, 0.08)})`,
                transform: "skewX(-15deg)",
              }}
            />
            {/* Border accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 3,
                background: `linear-gradient(90deg, ${c.main}, ${c.sub}, ${c.main})`,
              }}
            />
          </>
        ),
      };

    /* 13: Bokeh ---------------------------------------------------- */
    case 13:
      return {
        bg: {
          background: `radial-gradient(ellipse at 30% 50%, ${rgba(c.main, 0.08)} 0%, ${c.bg} 60%)`,
        },
        elements: (
          <>
            {[...Array(isLg ? 10 : 5)].map((_, i) => {
              const size = 15 + (i * 17) % 40;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: i % 2 === 0
                      ? rgba(c.main, 0.08 + (i % 3) * 0.02)
                      : rgba(c.sub, 0.06 + (i % 3) * 0.02),
                    filter: `blur(${4 + (i % 3) * 3}px)`,
                    left: `${5 + (i * 31) % 85}%`,
                    top: `${10 + (i * 23) % 75}%`,
                    animation: `bn-pulse ${3 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
                  }}
                />
              );
            })}
          </>
        ),
      };

    /* 14: Pulse ---------------------------------------------------- */
    case 14:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Pulse rings */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: isLg ? "30%" : "50%",
                  width: (100 + i * 80) * (isLg ? 1 : 0.7),
                  height: (100 + i * 80) * (isLg ? 1 : 0.7),
                  borderRadius: "50%",
                  border: `1px solid ${rgba(c.main, 0.15 - i * 0.04)}`,
                  transform: "translate(-50%, -50%)",
                  animation: `bn-pulse ${2 + i}s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}
            {/* Center glow */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isLg ? "30%" : "50%",
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${rgba(c.main, 0.3)} 0%, transparent 70%)`,
                transform: "translate(-50%, -50%)",
                animation: "bn-pulse 2s ease-in-out infinite",
              }}
            />
          </>
        ),
      };

    /* 15: Meteor --------------------------------------------------- */
    case 15:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Meteor trails */}
            {[...Array(isLg ? 4 : 2)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: `${10 + i * 25}%`,
                  left: `-10%`,
                  width: isLg ? 80 : 50,
                  height: 2,
                  background: `linear-gradient(90deg, ${rgba(c.main, 0.6)}, transparent)`,
                  borderRadius: 1,
                  boxShadow: `0 0 6px ${rgba(c.main, 0.3)}`,
                  animation: `bn-meteor ${2 + i * 0.8}s ease-in ${i * 1.2}s infinite`,
                }}
              />
            ))}
            {/* Star field */}
            {[...Array(isLg ? 8 : 4)].map((_, i) => (
              <div
                key={`s${i}`}
                style={{
                  position: "absolute",
                  width: 2,
                  height: 2,
                  borderRadius: "50%",
                  background: c.sub,
                  left: `${(i * 29) % 90 + 5}%`,
                  top: `${(i * 37) % 80 + 10}%`,
                  opacity: 0.3,
                  animation: `bn-twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}
            {/* Gradient wash */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "40%",
                background: `linear-gradient(0deg, ${rgba(c.main, 0.06)}, transparent)`,
              }}
            />
          </>
        ),
      };

    /* 16: Grid Tech ------------------------------------------------ */
    case 16:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Tech grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  linear-gradient(${rgba(c.main, 0.08)} 1px, transparent 1px),
                  linear-gradient(90deg, ${rgba(c.main, 0.08)} 1px, transparent 1px)
                `,
                backgroundSize: "25px 25px",
              }}
            />
            {/* Glowing nodes */}
            {[...Array(isLg ? 6 : 3)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c.main,
                  boxShadow: `0 0 8px ${c.main}`,
                  left: `${25 * ((i * 2 + 1) % 5)}px`,
                  top: `${25 * ((i * 3 + 1) % 5)}px`,
                  marginLeft: -3,
                  marginTop: -3,
                  opacity: 0.6,
                  animation: `bn-pulse ${2 + i * 0.3}s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}
            {/* Connection lines */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "10%",
                width: "30%",
                height: 1,
                background: `linear-gradient(90deg, ${rgba(c.main, 0.3)}, transparent)`,
                boxShadow: `0 0 4px ${rgba(c.main, 0.2)}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "25%",
                right: "15%",
                width: "20%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${rgba(c.sub, 0.2)})`,
              }}
            />
          </>
        ),
      };

    /* 17: Gradient Mesh -------------------------------------------- */
    case 17:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Mesh blobs */}
            <div
              style={{
                position: "absolute",
                top: "-20%",
                left: "-10%",
                width: "60%",
                height: "80%",
                borderRadius: "50%",
                background: rgba(c.main, 0.15),
                filter: "blur(50px)",
                animation: "bn-mesh-shift 10s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-30%",
                right: "-10%",
                width: "50%",
                height: "90%",
                borderRadius: "50%",
                background: rgba(c.sub, 0.12),
                filter: "blur(45px)",
                animation: "bn-mesh-shift 12s ease-in-out 3s infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "30%",
                left: "40%",
                width: "40%",
                height: "60%",
                borderRadius: "50%",
                background: rgba(c.main, 0.08),
                filter: "blur(40px)",
                animation: "bn-mesh-shift 8s ease-in-out 1s infinite reverse",
              }}
            />
          </>
        ),
      };

    /* 18: Card 3D -------------------------------------------------- */
    case 18:
      return {
        bg: {
          background: `linear-gradient(145deg, ${rgba(c.main, 0.05)} 0%, ${c.bg} 100%)`,
        },
        elements: (
          <>
            {/* 3D card effect with shadow layers */}
            <div
              style={{
                position: "absolute",
                inset: 10,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${rgba(c.main, 0.06)}, transparent)`,
                border: `1px solid ${rgba(c.main, 0.12)}`,
                boxShadow: `
                  4px 4px 0 ${rgba(c.main, 0.08)},
                  8px 8px 0 ${rgba(c.main, 0.04)}
                `,
              }}
            />
            {/* Highlight edge */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                right: 10,
                height: 1,
                background: `linear-gradient(90deg, ${rgba(c.sub, 0.2)}, transparent)`,
              }}
            />
            {/* Depth shadow */}
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: "95%",
                height: 6,
                background: rgba(c.main, 0.05),
                filter: "blur(4px)",
                borderRadius: 4,
              }}
            />
          </>
        ),
      };

    /* 19: Edge Glow ------------------------------------------------ */
    case 19:
      return {
        bg: {
          background: `radial-gradient(ellipse at 50% 50%, ${rgba(c.main, 0.04)} 0%, ${c.bg} 60%)`,
        },
        elements: (
          <>
            {/* Animated edge glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                animation: "bn-edge-glow 3s ease-in-out infinite",
              }}
            />
            {/* Inner subtle border */}
            <div
              style={{
                position: "absolute",
                inset: 4,
                borderRadius: 9,
                border: `1px solid ${rgba(c.main, 0.1)}`,
              }}
            />
          </>
        ),
      };

    /* 20: Flame ---------------------------------------------------- */
    case 20:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Flame layers at bottom */}
            {[...Array(isLg ? 6 : 3)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: -5,
                  left: `${10 + i * (isLg ? 15 : 25)}%`,
                  width: isLg ? 50 : 35,
                  height: isLg ? 60 : 40,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  background: `radial-gradient(ellipse at bottom, ${rgba(c.main, 0.3 - i * 0.03)}, ${rgba(c.sub, 0.1)}, transparent)`,
                  filter: "blur(8px)",
                  animation: `bn-flame ${1.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            {/* Heat distortion effect */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "50%",
                background: `linear-gradient(0deg, ${rgba(c.main, 0.08)}, transparent)`,
              }}
            />
            {/* Ember particles */}
            {[...Array(isLg ? 4 : 2)].map((_, i) => (
              <div
                key={`e${i}`}
                style={{
                  position: "absolute",
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: c.sub,
                  bottom: 20,
                  left: `${20 + i * 25}%`,
                  animation: `bn-float-up ${2.5 + i * 0.5}s ease-out ${i * 0.8}s infinite`,
                  opacity: 0.7,
                }}
              />
            ))}
          </>
        ),
      };

    /* 21: Frost ---------------------------------------------------- */
    case 21:
      return {
        bg: {
          background: `linear-gradient(135deg, ${c.bg} 0%, ${rgba(c.sub, 0.06)} 100%)`,
        },
        elements: (
          <>
            {/* Frost texture overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, ${rgba(c.sub, 0.08)} 0%, transparent 30%),
                  radial-gradient(circle at 80% 60%, ${rgba(c.sub, 0.06)} 0%, transparent 25%),
                  radial-gradient(circle at 50% 80%, ${rgba(c.main, 0.04)} 0%, transparent 35%)
                `,
              }}
            />
            {/* Ice crystals / sparkles */}
            {[...Array(isLg ? 8 : 4)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  background: "#fff",
                  opacity: 0.3,
                  borderRadius: i % 2 === 0 ? "50%" : 0,
                  transform: i % 2 !== 0 ? "rotate(45deg)" : undefined,
                  left: `${8 + (i * 29) % 84}%`,
                  top: `${12 + (i * 23) % 76}%`,
                  animation: `bn-frost-sparkle ${2 + (i % 3) * 0.8}s ease-in-out ${i * 0.4}s infinite`,
                }}
              />
            ))}
            {/* Frosted border */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                border: `1px solid ${rgba(c.sub, 0.2)}`,
                boxShadow: `inset 0 0 20px ${rgba(c.sub, 0.06)}`,
              }}
            />
          </>
        ),
      };

    /* 22: Circuit -------------------------------------------------- */
    case 22:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Circuit paths via SVG */}
            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              <path
                d="M0 100 H80 V50 H160 V100 H240 V150 H320 V100 H400"
                fill="none"
                stroke={c.main}
                strokeWidth="1"
                strokeDasharray="4 4"
                style={{ animation: "bn-circuit-pulse 3s linear infinite" }}
              />
              <path
                d="M0 60 H60 V30 H140 V60 H220 V120 H300 V60 H400"
                fill="none"
                stroke={c.sub}
                strokeWidth="0.8"
                strokeDasharray="3 5"
                style={{ animation: "bn-circuit-pulse 4s linear infinite reverse" }}
              />
              {/* Nodes */}
              {[80, 160, 240, 320].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={i % 2 === 0 ? 50 : 150}
                  r={3}
                  fill={i % 2 === 0 ? c.main : c.sub}
                  style={{ animation: `bn-node-pulse 2s ease-in-out ${i * 0.5}s infinite` }}
                />
              ))}
            </svg>
            {/* Glow at circuit intersections */}
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "40%",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: rgba(c.main, 0.1),
                filter: "blur(15px)",
              }}
            />
          </>
        ),
      };

    /* 23: Rays ----------------------------------------------------- */
    case 23:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Radial rays */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isLg ? "25%" : "50%",
                width: isLg ? 300 : 200,
                height: isLg ? 300 : 200,
                transform: "translate(-50%, -50%)",
                background: `conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  ${rgba(c.main, 0.08)} 15deg,
                  transparent 30deg,
                  transparent 60deg,
                  ${rgba(c.sub, 0.06)} 75deg,
                  transparent 90deg,
                  transparent 120deg,
                  ${rgba(c.main, 0.08)} 135deg,
                  transparent 150deg,
                  transparent 180deg,
                  ${rgba(c.sub, 0.06)} 195deg,
                  transparent 210deg,
                  transparent 240deg,
                  ${rgba(c.main, 0.08)} 255deg,
                  transparent 270deg,
                  transparent 300deg,
                  ${rgba(c.sub, 0.06)} 315deg,
                  transparent 330deg
                )`,
                animation: "bn-rays 20s linear infinite",
                opacity: 0.8,
              }}
            />
            {/* Center glow */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isLg ? "25%" : "50%",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${rgba(c.main, 0.3)}, transparent)`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </>
        ),
      };

    /* 24: Particle ------------------------------------------------- */
    case 24:
      return {
        bg: {
          background: `linear-gradient(180deg, ${c.bg} 0%, ${rgba(c.main, 0.04)} 100%)`,
        },
        elements: (
          <>
            {[...Array(isLg ? 12 : 6)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 2 + (i % 3) * 2,
                  height: 2 + (i % 3) * 2,
                  borderRadius: "50%",
                  background: i % 2 === 0 ? c.main : c.sub,
                  left: `${5 + (i * 23) % 85}%`,
                  bottom: `${5 + (i * 11) % 30}%`,
                  opacity: 0.5,
                  animation: `bn-particle-float ${3 + (i * 0.7)}s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}
            {/* Soft gradient base */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "30%",
                background: `linear-gradient(0deg, ${rgba(c.main, 0.06)}, transparent)`,
              }}
            />
          </>
        ),
      };

    /* 25: Ribbon --------------------------------------------------- */
    case 25:
      return {
        bg: {
          background: `linear-gradient(160deg, ${c.bg} 0%, ${rgba(c.main, 0.04)} 100%)`,
        },
        elements: (
          <>
            {/* Ribbon bands */}
            <div
              style={{
                position: "absolute",
                top: isLg ? 25 : 15,
                left: "-5%",
                width: "110%",
                height: isLg ? 28 : 18,
                background: `linear-gradient(90deg, transparent, ${rgba(c.main, 0.12)}, ${rgba(c.sub, 0.08)}, transparent)`,
                transform: "rotate(-3deg)",
                animation: "bn-ribbon-wave 6s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: isLg ? 30 : 20,
                left: "-5%",
                width: "110%",
                height: isLg ? 20 : 12,
                background: `linear-gradient(90deg, transparent, ${rgba(c.sub, 0.08)}, ${rgba(c.main, 0.1)}, transparent)`,
                transform: "rotate(2deg)",
                animation: "bn-ribbon-wave 8s ease-in-out 1s infinite",
              }}
            />
            {/* Accent ends */}
            <div
              style={{
                position: "absolute",
                top: isLg ? 22 : 12,
                right: 0,
                width: 8,
                height: isLg ? 34 : 24,
                background: rgba(c.main, 0.2),
                clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)",
              }}
            />
          </>
        ),
      };

    /* 26: Double Border -------------------------------------------- */
    case 26:
      return {
        bg: {
          background: `radial-gradient(ellipse at 40% 50%, ${rgba(c.main, 0.05)} 0%, ${c.bg} 60%)`,
        },
        elements: (
          <>
            {/* Outer border */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                border: `2px solid ${rgba(c.main, 0.3)}`,
              }}
            />
            {/* Inner border */}
            <div
              style={{
                position: "absolute",
                inset: 6,
                borderRadius: 8,
                border: `1px solid ${rgba(c.sub, 0.2)}`,
              }}
            />
            {/* Corner accents */}
            <div style={{ position: "absolute", top: -1, left: 20, width: 40, height: 3, background: c.main, borderRadius: "0 0 2px 2px" }} />
            <div style={{ position: "absolute", bottom: -1, right: 20, width: 40, height: 3, background: c.sub, borderRadius: "2px 2px 0 0" }} />
            {/* Subtle inner glow */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "60%",
                height: "60%",
                borderRadius: "50%",
                background: rgba(c.main, 0.04),
                filter: "blur(30px)",
                transform: "translate(-50%, -50%)",
              }}
            />
          </>
        ),
      };

    /* 27: Smoke ---------------------------------------------------- */
    case 27:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Smoke puffs */}
            {[...Array(isLg ? 5 : 3)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: `${15 + i * (isLg ? 18 : 25)}%`,
                  width: isLg ? 80 : 50,
                  height: isLg ? 80 : 50,
                  borderRadius: "50%",
                  background: rgba(c.main, 0.1),
                  filter: "blur(20px)",
                  animation: `bn-smoke ${4 + i * 0.8}s ease-out ${i * 1.2}s infinite`,
                }}
              />
            ))}
            {/* Ambient haze */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "60%",
                background: `linear-gradient(0deg, ${rgba(c.main, 0.05)}, transparent)`,
              }}
            />
            {/* Top border glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${rgba(c.sub, 0.3)}, transparent)`,
              }}
            />
          </>
        ),
      };

    /* 28: Prism ---------------------------------------------------- */
    case 28:
      return {
        bg: { background: c.bg },
        elements: (
          <>
            {/* Prism light dispersion */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isLg ? "20%" : "30%",
                width: 0,
                height: 0,
                borderLeft: "30px solid transparent",
                borderRight: "30px solid transparent",
                borderBottom: `50px solid ${rgba(c.main, 0.12)}`,
                transform: "translateY(-50%)",
              }}
            />
            {/* Light beams */}
            {["#ff4444", "#ff8800", "#ffdd00", "#44ff44", "#4488ff", "#8844ff"].map(
              (clr, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: `${30 + i * 7}%`,
                    left: isLg ? "30%" : "45%",
                    width: isLg ? "60%" : "45%",
                    height: 2,
                    background: `linear-gradient(90deg, ${clr}40, transparent)`,
                    filter: "blur(2px)",
                    animation: `bn-prism-split 8s linear ${i * 0.5}s infinite`,
                    opacity: 0.3,
                  }}
                />
              )
            )}
            {/* Glass reflection */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-20%",
                width: "15%",
                height: "100%",
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)`,
                transform: "skewX(-15deg)",
                animation: "bn-shine-sweep 6s ease-in-out infinite",
              }}
            />
          </>
        ),
      };

    /* 29: Royal ---------------------------------------------------- */
    case 29:
      return {
        bg: {
          background: `linear-gradient(180deg, ${rgba(c.main, 0.08)} 0%, ${c.bg} 30%, ${c.bg} 70%, ${rgba(c.main, 0.05)} 100%)`,
        },
        elements: (
          <>
            {/* Crown symbol */}
            <div
              style={{
                position: "absolute",
                top: isLg ? 10 : 6,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: isLg ? 18 : 14,
                opacity: 0.25,
              }}
            >
              &#x1F451;
            </div>
            {/* Luxury frame */}
            <div
              style={{
                position: "absolute",
                inset: 4,
                borderRadius: 10,
                border: `1.5px solid ${rgba(c.main, 0.25)}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: 7,
                border: `1px solid ${rgba(c.main, 0.1)}`,
              }}
            />
            {/* Top ornament line */}
            <div
              style={{
                position: "absolute",
                top: 4,
                left: "25%",
                width: "50%",
                height: 2,
                background: `linear-gradient(90deg, transparent, ${c.main}, transparent)`,
                opacity: 0.3,
              }}
            />
            {/* Bottom ornament line */}
            <div
              style={{
                position: "absolute",
                bottom: 4,
                left: "25%",
                width: "50%",
                height: 2,
                background: `linear-gradient(90deg, transparent, ${c.sub}, transparent)`,
                opacity: 0.25,
              }}
            />
            {/* Corner ornaments */}
            {[
              { top: 4, left: 4 },
              { top: 4, right: 4 },
              { bottom: 4, left: 4 },
              { bottom: 4, right: 4 },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  ...pos,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: `1px solid ${rgba(c.main, 0.3)}`,
                  background: rgba(c.main, 0.06),
                } as React.CSSProperties}
              />
            ))}
            {/* Shimmer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-30%",
                width: "20%",
                height: "100%",
                background: `linear-gradient(90deg, transparent, ${rgba(c.sub, 0.08)}, transparent)`,
                transform: "skewX(-20deg)",
                animation: "bn-shine-sweep 5s ease-in-out 1s infinite",
              }}
            />
            {/* SVG filigree pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.02,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0 Q25 10 40 10 Q25 15 20 25 Q15 15 0 10 Q15 10 20 0Z' fill='%23fff'/%3E%3C/svg%3E")`,
                backgroundSize: "40px 40px",
              }}
            />
          </>
        ),
      };

    /* Fallback: simple gradient ------------------------------------- */
    default:
      return {
        bg: {
          background: `linear-gradient(135deg, ${c.bg} 0%, ${rgba(c.main, 0.1)} 100%)`,
        },
        elements: null,
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Template overlay effects (hover, etc.)                            */
/* ------------------------------------------------------------------ */
function getTemplateOverlay(tpl: number, c: C, isLg: boolean): React.ReactNode {
  // Hover glow for lg templates
  if (!isLg) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${rgba(c.main, 0.06)} 0%, transparent 70%)`,
      }}
    />
  );
}
