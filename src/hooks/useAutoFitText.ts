import { RefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

export interface UseAutoFitTextOptions {
  /** Smallest size (px) the text may shrink to before it is simply clipped. */
  minFontSize?: number;
  /** Largest size (px) the text will ever render at. */
  maxFontSize?: number;
  /** Binary-search steps. 10 resolves any sane range to well under a pixel. */
  maxIterations?: number;
}

export interface AutoFitText<C extends HTMLElement, T extends HTMLElement> {
  /** Attach to the box the text has to fit inside. Must have a bounded size. */
  containerRef: RefObject<C | null>;
  /** Attach to the element that carries the text (font size is written here). */
  textRef: RefObject<T | null>;
  /** Manual re-measure, for changes the hook cannot observe on its own. */
  refit: () => void;
}

/** Sub-pixel rounding slack so a perfect fit is not rejected. */
const FIT_TOLERANCE_PX = 1;

/**
 * Measurement-based text auto-fit.
 *
 * Binary-searches the largest font size at which `textRef` overflows its
 * `containerRef` in neither dimension, then re-runs whenever the text changes
 * or the container is resized. The container must be size-bounded by its own
 * layout (e.g. `flex-1 min-h-0 overflow-hidden`) — if it grows with its
 * content there is nothing to fit against.
 */
export function useAutoFitText<
  C extends HTMLElement = HTMLDivElement,
  T extends HTMLElement = HTMLDivElement
>(content: string, options: UseAutoFitTextOptions = {}): AutoFitText<C, T> {
  const { minFontSize = 8, maxFontSize = 96, maxIterations = 10 } = options;

  const containerRef = useRef<C | null>(null);
  const textRef = useRef<T | null>(null);
  // Size the last fit was computed for; lets the observer ignore the reflows
  // our own font-size writes may cause.
  const fittedSizeRef = useRef({ width: 0, height: 0 });

  const fitText = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;
    fittedSizeRef.current = { width: availableWidth, height: availableHeight };

    // Nothing to measure against yet (collapsed panel, hidden modal, popout
    // that has not laid out). Bail rather than divide the range down to zero.
    if (availableWidth <= 0 || availableHeight <= 0) return;

    const lowerBound = Math.max(1, Math.min(minFontSize, maxFontSize));
    const upperBound = Math.max(lowerBound, maxFontSize);

    // Empty slides have nothing to shrink; skip straight to the top size.
    if (!content || !content.trim()) {
      text.style.fontSize = `${upperBound}px`;
      return;
    }

    const fitsAt = (size: number) => {
      text.style.fontSize = `${size}px`;
      return (
        text.scrollHeight <= availableHeight + FIT_TOLERANCE_PX &&
        text.scrollWidth <= availableWidth + FIT_TOLERANCE_PX
      );
    };

    // Fast path: most slides are short enough to render at full size.
    if (fitsAt(upperBound)) return;

    let low = lowerBound;
    let high = upperBound;
    let best = lowerBound;

    for (let i = 0; i < maxIterations && high - low > 0.5; i++) {
      const mid = (low + high) / 2;
      if (fitsAt(mid)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    text.style.fontSize = `${best}px`;
  }, [content, minFontSize, maxFontSize, maxIterations]);

  // Fit before paint so operators never see a frame of overflowing text.
  useLayoutEffect(() => {
    fitText();
  }, [fitText]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      const { width, height } = fittedSizeRef.current;
      // Same box as last time: this is our own reflow echoing back.
      if (container.clientWidth === width && container.clientHeight === height) return;
      // One fit per frame, no matter how noisy the resize stream is.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitText);
    });

    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fitText]);

  return { containerRef, textRef, refit: fitText };
}
