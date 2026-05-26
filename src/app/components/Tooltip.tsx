"use client"

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

interface Position {
  top: number;
  left: number;
}

/**
 * Lightweight tooltip rendered via React Portal so it can escape any
 * `overflow-hidden` / `overflow-clip` ancestor (e.g. the LK requests table
 * wrapper). Position is computed from the trigger's `getBoundingClientRect`
 * on hover-in.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const computePosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, []);

  // Hide on scroll/resize while visible — the cached position would otherwise
  // drift relative to the trigger.
  useEffect(() => {
    if (!pos) return;
    const hide = () => setPos(null);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [pos]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={computePosition}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {mounted && pos && createPortal(
        <div
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
          className="px-3 py-1.5 bg-[#323c54] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-1000 pointer-events-none animate-in fade-in zoom-in duration-200"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-[#323c54]" />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
