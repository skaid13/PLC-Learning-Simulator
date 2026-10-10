import type { CSSProperties } from 'react';

const paths = {
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </>
  ),
  book: (
    <>
      <path d="M12 5v16M3 3c4-1 6 0 9 2 3-2 5-3 9-2v16c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  arrow: <path d="m9 5 7 7-7 7" />,
  light: (
    <>
      <path d="M8 15c-6-5-2-12 4-12s10 7 4 12l-1 3H9ZM9 21h6" />
      <path d="M10 14h4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
    </>
  ),
  play: <path d="m8 4 13 8-13 8Z" />,
  stop: <rect x="5" y="5" width="14" height="14" rx="1" />,
  reset: (
    <>
      <path d="M3 10a9 9 0 1 1 1 8M3 4v6h6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  monitor: (
    <>
      <rect x="3" y="3" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-5v5" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  branch: (
    <>
      <path d="M5 4v16m0-8h11m0 0-4-4m4 4-4 4" />
      <circle cx="5" cy="4" r="2" />
    </>
  ),
} as const;

export function Icon({
  name,
  size = 18,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
