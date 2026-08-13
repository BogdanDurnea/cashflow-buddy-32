import React from "react";

type Name = "lock" | "globe" | "wifi" | "doc" | "warn";

const paths: Record<Name, React.ReactNode> = {
  lock: (
    <>
      <rect x={5} y={11} width={14} height={9} rx={2.5} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx={12} cy={15.5} r={1.4} />
    </>
  ),
  globe: (
    <>
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9.5a15 15 0 0 1 19 0M5.5 13a10.5 10.5 0 0 1 13 0M8.5 16.5a6 6 0 0 1 7 0" />
      <circle cx={12} cy={20} r={1.2} />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3 22 20H2z" />
      <path d="M12 9v5M12 17.2v.1" />
    </>
  ),
};

export const Icon: React.FC<{ name: Name; size?: number; color?: string; stroke?: number }> = ({
  name,
  size = 48,
  color = "#f4f1ea",
  stroke = 1.7,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths[name]}
  </svg>
);