/** 本课的输入、逻辑指令与装置符号。颜色由真实选择/扫描状态的父元素提供。 */
export function LearningSymbol({
  kind,
}: {
  kind: 'input' | 'contact' | 'contactClosed' | 'coil' | 'lamp';
}) {
  return (
    <svg
      className="learning-symbol"
      viewBox="0 0 80 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {kind === 'input' && (
        <>
          <rect x="22" y="13" width="36" height="26" rx="5" />
          <path d="M31 13V8h18v5M32 26h16M40 21v10" />
        </>
      )}
      {(kind === 'contact' || kind === 'contactClosed') && (
        <path d="M7 24h25m0-13v26m16-26v26m0-13h25" />
      )}
      {kind === 'contactClosed' && <path d="m28 37 24-26" />}
      {kind === 'coil' && (
        <>
          <path d="M7 24h20m26 0h20M34 10a18 18 0 0 0 0 28m12-28a18 18 0 0 1 0 28" />
        </>
      )}
      {kind === 'lamp' && (
        <>
          <circle cx="40" cy="24" r="13" />
          <path d="m31 15 18 18m0-18L31 33M40 4V1m0 46v-3M20 24h-5m50 0h-5" />
        </>
      )}
    </svg>
  );
}
