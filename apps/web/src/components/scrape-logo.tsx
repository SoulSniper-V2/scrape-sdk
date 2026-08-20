import React from "react";

export function ScrapeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#141412" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#2B2B27" />
      {/* Precision Interlocking Geometric Prism Mark */}
      <path
        d="M10 12.5L16 9L22 12.5L16 16L10 12.5Z"
        fill="#F4F3EF"
      />
      <path
        d="M10 14L16 17.5V23L10 19.5V14Z"
        fill="#92B6FF"
      />
      <path
        d="M22 14L16 17.5V23L22 19.5V14Z"
        fill="#77766F"
      />
    </svg>
  );
}
