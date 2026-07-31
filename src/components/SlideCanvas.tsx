import React, { useLayoutEffect, useRef, useState } from 'react';
import { Slide, QuickState } from '../types';
import { THEME_PRESETS } from '../data/mockData';
import { Flame } from 'lucide-react';
import { useAutoFitText } from '../hooks/useAutoFitText';

/**
 * Every slide surface in the app renders through this canvas at one fixed
 * design resolution and is then uniformly scaled to whatever box it sits in.
 * A 160px thumbnail is therefore an exact miniature of the 1920px projector
 * output: same line breaks, same proportions, same fitted font size.
 */
export const SLIDE_DESIGN_WIDTH = 1920;
export const SLIDE_DESIGN_HEIGHT = 1080;

/** All internal geometry in design pixels (i.e. relative to 1920x1080). */
const DESIGN = {
  padding: 72,
  headerFontSize: 48,
  referenceFontSize: 40,
  referencePaddingY: 10,
  referencePaddingX: 24,
  referenceRadius: 12,
  bodyMinFontSize: 40,
  bodyMaxFontSize: 170,
  bulletFontSize: 46,
  bulletGap: 16,
  watermarkFontSize: 26,
  alertFontSize: 44,
  alertPaddingY: 24,
  alertPaddingX: 44,
  alertRadius: 28,
  alertInset: 40,
  rowGap: 28,
  stageHeaderFontSize: 56,
  stageBodyMinFontSize: 44,
  stageBodyMaxFontSize: 190,
  logoIconSize: 120,
  logoTitleFontSize: 88,
  logoSubtitleFontSize: 40
} as const;

export const getThemeClass = (style?: string) => {
  const preset = THEME_PRESETS.find(p => p.id === style);
  return preset ? preset.bgClass : 'bg-slate-900';
};

export interface SlideCanvasProps {
  slide: Slide | null;
  /** 'audience' is the projector look; 'stage' is the high-contrast monitor. */
  variant?: 'audience' | 'stage';
  quickState?: QuickState;
  alertMessage?: string | null;
  /** Shown when there is no slide (already styled at design scale). */
  emptyMessage?: string;
  showWatermark?: boolean;
  /** Extra classes for the outer 16:9 frame (border, ring, rounding, opacity). */
  className?: string;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  variant = 'audience',
  quickState = 'normal',
  alertMessage = null,
  emptyMessage,
  showWatermark = true,
  className = ''
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // Uniform scale: design pixels -> whatever width this surface gives us.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateScale = () => setScale(frame.clientWidth / SLIDE_DESIGN_WIDTH);
    updateScale();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const isStage = variant === 'stage';
  const isBlackout = quickState === 'black';
  const isTextCleared = quickState === 'clearText';
  const isLogo = quickState === 'logo';
  const isBgCleared = quickState === 'clearBg';

  const isScripture = slide?.type === 'scripture';
  const bulletPoints = slide?.bulletPoints || [];

  // Re-fit whenever anything that affects text metrics changes.
  const fitKey = `${variant}|${slide?.type || ''}|${slide?.body || ''}|${bulletPoints.join('')}`;
  const bodyFit = useAutoFitText<HTMLDivElement, HTMLDivElement>(fitKey, {
    minFontSize: isStage ? DESIGN.stageBodyMinFontSize : DESIGN.bodyMinFontSize,
    maxFontSize: isStage ? DESIGN.stageBodyMaxFontSize : DESIGN.bodyMaxFontSize
  });

  const backgroundClass = isStage || isBlackout
    ? 'bg-black'
    : isBgCleared
    ? 'bg-slate-950'
    : slide?.bgImageUrl
    ? 'bg-cover bg-center'
    : getThemeClass(slide?.themeStyle);

  const bodyToneClass = isScripture
    ? 'font-serif italic font-semibold text-amber-100 leading-relaxed tracking-wide'
    : isStage
    ? 'font-black text-slate-100 leading-tight tracking-tight'
    : 'font-extrabold text-slate-100 leading-snug';

  return (
    <div
      ref={frameRef}
      className={`theme-locked-dark relative w-full aspect-video overflow-hidden select-none ${backgroundClass} ${className}`}
      style={
        !isStage && !isBlackout && !isBgCleared && slide?.bgImageUrl
          ? { backgroundImage: `url(${slide.bgImageUrl})` }
          : undefined
      }
    >
      <div
        className="absolute top-0 left-0 flex flex-col"
        style={{
          width: SLIDE_DESIGN_WIDTH,
          height: SLIDE_DESIGN_HEIGHT,
          padding: DESIGN.padding,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Darkening wash so text stays legible over background imagery */}
        {!isStage && !isBlackout && !isBgCleared && slide?.bgImageUrl && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        {isLogo ? (
          /* Logo quick state */
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center bg-slate-950">
            <div
              className="rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center"
              style={{ padding: DESIGN.padding / 2, marginBottom: DESIGN.rowGap }}
            >
              <Flame style={{ width: DESIGN.logoIconSize, height: DESIGN.logoIconSize }} />
            </div>
            <h2
              className="font-extrabold text-slate-100 tracking-widest uppercase"
              style={{ fontSize: DESIGN.logoTitleFontSize }}
            >
              LOGOS CHURCH
            </h2>
            <p className="text-slate-400 font-semibold" style={{ fontSize: DESIGN.logoSubtitleFontSize }}>
              Welcome to Worship
            </p>
          </div>
        ) : isBlackout ? (
          /* Blackout: audience sees nothing at all */
          <div className="relative z-10 flex-1" />
        ) : slide ? (
          <>
            {/* Top row: header (left) and scripture reference (right) */}
            <div
              className={`relative z-10 shrink-0 flex items-start gap-8 font-bold text-amber-300 ${
                isStage ? 'justify-center' : 'justify-between'
              } ${isTextCleared ? 'invisible' : ''}`}
              style={{ fontSize: isStage ? DESIGN.stageHeaderFontSize : DESIGN.headerFontSize }}
            >
              <span className="uppercase tracking-widest drop-shadow-md truncate">
                {slide.header}
              </span>
              {!isStage && slide.reference && (
                <span
                  className="bg-black/60 border border-white/10 text-slate-100 font-semibold shrink-0"
                  style={{
                    fontSize: DESIGN.referenceFontSize,
                    padding: `${DESIGN.referencePaddingY}px ${DESIGN.referencePaddingX}px`,
                    borderRadius: DESIGN.referenceRadius
                  }}
                >
                  {slide.reference}
                </span>
              )}
            </div>

            {/* Body: auto-fitted once, in design pixels, for every surface */}
            <div
              ref={bodyFit.containerRef}
              className={`relative z-10 flex-1 min-h-0 w-full overflow-hidden flex flex-col items-center justify-center text-center ${
                isTextCleared ? 'invisible' : ''
              }`}
              style={{ paddingTop: DESIGN.rowGap, paddingBottom: DESIGN.rowGap }}
            >
              <div ref={bodyFit.textRef} className="w-full shrink-0">
                <p className={`whitespace-pre-line break-words drop-shadow-lg ${bodyToneClass}`}>
                  {slide.body}
                </p>

                {bulletPoints.length > 0 && (
                  <ul
                    className="text-left mx-auto font-medium text-amber-200"
                    style={{ fontSize: DESIGN.bulletFontSize, marginTop: DESIGN.rowGap }}
                  >
                    {bulletPoints.map((bp, i) => (
                      <li
                        key={i}
                        className="flex items-start drop-shadow"
                        style={{ gap: DESIGN.bulletGap, marginTop: i === 0 ? 0 : DESIGN.bulletGap }}
                      >
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Bottom row: watermark */}
            {showWatermark && !isStage && (
              <div
                className="relative z-10 shrink-0 text-right uppercase tracking-widest font-semibold text-white/50"
                style={{ fontSize: DESIGN.watermarkFontSize }}
              >
                LOGOS AI Live
              </div>
            )}
          </>
        ) : (
          <div className="relative z-10 flex-1 flex items-center justify-center text-center">
            <span
              className="font-extrabold uppercase tracking-widest text-slate-600"
              style={{ fontSize: DESIGN.headerFontSize }}
            >
              {emptyMessage || '[ NO LIVE SLIDE ]'}
            </span>
          </div>
        )}

        {/* Alert banner rides on top of whatever is showing */}
        {alertMessage && (
          <div
            className="absolute z-30 bg-rose-600 border border-rose-400 text-white font-extrabold flex items-center justify-center text-center"
            style={{
              left: DESIGN.alertInset,
              right: DESIGN.alertInset,
              bottom: DESIGN.alertInset,
              fontSize: DESIGN.alertFontSize,
              padding: `${DESIGN.alertPaddingY}px ${DESIGN.alertPaddingX}px`,
              borderRadius: DESIGN.alertRadius
            }}
          >
            {alertMessage}
          </div>
        )}
      </div>
    </div>
  );
};
