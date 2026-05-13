"use client"

import { ReactNode, useState } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#323c54] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in duration-200">
          {content}
          {/* Down arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
            <div className="border-4 border-transparent border-t-[#323c54]" />
          </div>
        </div>
      )}
    </div>
  );
}
