import React from "react";

export function PerfumeIcon({
  className = "w-4 h-4",
  strokeWidth = 1.5,
  ...props
}: React.SVGProps<SVGSVGElement> & { strokeWidth?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Atomizer spray pump */}
      <path d="M10 2h4" />
      <path d="M12 2v3" />
      <rect x="9" y="5" width="6" height="3" rx="1" />
      {/* Bottle glass body */}
      <rect x="5" y="8" width="14" height="13" rx="3" />
      {/* Inner label / level lines */}
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="16" x2="16" y2="16" />
      {/* Fragrance spray mist droplets */}
      <path d="M18 4l2-1" />
      <path d="M19 6l2 1" />
    </svg>
  );
}
