import type { Simulator } from '../engine/useSimulator';
export function PlantDrawing({ simulator }: { simulator: Simulator }) {
  const { state } = simulator,
    id = state.program.experimentId,
    p = state.plant,
    v = state.scan.values;
  const on = (n: number) => v[`output:O-${String(n).padStart(2, '0')}`] === true;
  const fill = (n: number, color = '#35b391') => (on(n) ? color : '#d4dfdc');
  const light = (n: number, x: number, y: number, label: string, color?: string) => (
    <g key={n}>
      <circle cx={x} cy={y} r="12" fill={fill(n, color)} stroke="#829b95" />
      <text x={x} y={y + 27} textAnchor="middle" fontSize="11" fill="#415a58">
        {label}
      </text>
    </g>
  );
  const segmentPaths = [
    'M119 35H181',
    'M190 44V96',
    'M190 119V171',
    'M119 181H181',
    'M110 119V171',
    'M110 44V96',
    'M119 108H181',
  ];
  return (
    <svg
      className="plant-view"
      viewBox="0 0 300 230"
      role="img"
      aria-label={`${id} 输出驱动装置示意图`}
    >
      <rect x="1" y="1" width="298" height="228" rx="12" fill="#f1f6f4" stroke="#d9e4df" />
      {id.startsWith('starter-') && (
        <>
          <circle
            cx="150"
            cy="100"
            r="48"
            fill={fill(0, '#f0c45b')}
            stroke="#708b87"
            strokeWidth="3"
          />
          <text x="150" y="108" textAnchor="middle" fontSize="20" fill="#243e38">
            {on(0) ? '亮' : '灭'}
          </text>
          <text x="150" y="182" textAnchor="middle" fontSize="14" fill="#415a58">
            指示灯 · SIM_OUT_00
          </text>
          <text x="150" y="205" textAnchor="middle" fontSize="12" fill="#415a58">
            扫描后按你的程序更新
          </text>
        </>
      )}
      {(id === 'led' || id === 'vending') && (
        <>
          <rect x="87" y="16" width="126" height="185" rx="8" fill="#213a37" />
          {segmentPaths.map((d, i) => (
            <g key={d}>
              <path
                d={d}
                stroke={on(i) ? '#71f0b9' : '#3a514c'}
                strokeWidth="10"
                strokeLinecap="round"
              />
              <text
                x={[150, 208, 208, 150, 94, 94, 150][i]}
                y={[24, 76, 150, 198, 150, 76, 102][i]}
                textAnchor="middle"
                fontSize="9"
                fill="#62857a"
              >
                {'ABCDEFG'[i]}
              </text>
            </g>
          ))}
          {id === 'led' ? (
            <circle cx="226" cy="181" r="7" fill={fill(7)} />
          ) : (
            <text x="150" y="220" textAnchor="middle" fontSize="12" fill="#416a5d">
              余额段码 · 出货 {p.delivered} 次
            </text>
          )}
        </>
      )}
      {id === 'stepper' && (
        <>
          <circle cx="150" cy="110" r="70" fill="#e4ebe8" stroke="#6b8a80" strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M150 43v8" stroke="#839f94" transform={`rotate(${i * 30} 150 110)`} />
          ))}
          <g transform={`rotate(${p.angle} 150 110)`}>
            <path d="M150 110V58" stroke="#23a77f" strokeWidth="8" strokeLinecap="round" />
            <circle cx="150" cy="110" r="15" fill="#426f60" />
          </g>
          <text x="150" y="204" textAnchor="middle" fontSize="13" fill="#416a5d">
            {p.angle.toFixed(2)}° · {p.pulses} 有效脉冲
          </text>
        </>
      )}
      {id === 'tower' && (
        <>
          <path d="M150 30L50 185H250Z" stroke="#aec6bb" strokeWidth="3" fill="none" />
          {[
            [150, 42],
            [120, 82],
            [180, 82],
            [150, 120],
            [75, 175],
            [125, 175],
            [175, 175],
            [225, 175],
          ].map(([x, y], i) => light(i, x, y, `L${i + 1}`))}
        </>
      )}
      {id === 'traffic' && (
        <>
          <path d="M0 85H300V145H0ZM120 0H180V230H120Z" fill="#c2cec9" />
          <path
            d="M0 115H110M190 115H300M150 0V75M150 155V230"
            stroke="#f9fcfa"
            strokeWidth="2"
            strokeDasharray="10 7"
          />
          <g>
            {[0, 1, 2].map((n, i) =>
              light(
                n,
                40 + i * 32,
                43,
                ['东 R', '东 Y', '东 G'][i],
                ['#ef6a65', '#edc65a', '#35b391'][i],
              ),
            )}
            {[5, 4, 3].map((n, i) =>
              light(
                n,
                201 + i * 32,
                181,
                ['南 R', '南 Y', '南 G'][i],
                ['#ef6a65', '#edc65a', '#35b391'][i],
              ),
            )}
          </g>
          {on(2) && (
            <path
              d={`M${30 + ((p.flow * 20) % 250)} 104h18l-5-5m5 5-5 5`}
              stroke="#257657"
              strokeWidth="4"
            />
          )}
          {on(3) && (
            <path
              d={`M163 ${30 + ((p.flow * 20) % 160)}v18l-5-5m5 5 5-5`}
              stroke="#257657"
              strokeWidth="4"
            />
          )}
        </>
      )}
      {id === 'arm' && (
        <>
          <path d="M40 185V35H260V185" fill="none" stroke="#9ab3a9" strokeWidth="9" />
          <path d={`M${55 + p.x * 190} 35V${65 + p.y * 100}`} stroke="#668d7e" strokeWidth="8" />
          <path
            d={`M${43 + p.x * 190} ${60 + p.y * 100}v18h24V${60 + p.y * 100}`}
            stroke={on(1) ? '#26a77c' : '#52756b'}
            fill="none"
            strokeWidth="5"
          />
          <rect
            x={44 + p.pieceX * 190}
            y={77 + p.pieceY * 100}
            width="22"
            height="17"
            rx="3"
            fill="#dbb56e"
          />
          <text x="55" y="214" textAnchor="middle" fill="#53766a">
            A 取件
          </text>
          <text x="245" y="214" textAnchor="middle" fill="#53766a">
            B 放件
          </text>
          <text x="150" y="22" textAnchor="middle" fontSize="11" fill="#53766a">
            {p.held ? '已夹持工件' : '夹爪放松'}
          </text>
        </>
      )}
      {id === 'elevator' && (
        <>
          <rect x="105" y="20" width="90" height="190" rx="3" fill="#e0e9e5" stroke="#a4bdb1" />
          {[1, 2, 3].map((f) => (
            <g key={f}>
              <path d={`M40 ${205 - (f - 1) * 67}H260`} stroke="#b2c6bb" />
              <text x="55" y={187 - (f - 1) * 67} fill="#527565">
                {f}F
              </text>
            </g>
          ))}
          <rect
            x="115"
            y={154 - (p.floor - 1) * 67}
            width="70"
            height="48"
            rx="4"
            fill="#71b39c"
            stroke="#3d7a61"
          />
          <path d={`M150 ${159 - (p.floor - 1) * 67}v38`} stroke="#e1f3e9" />
          <text x="150" y="224" textAnchor="middle" fontSize="11" fill="#527565">
            轿厢位置 {p.floor.toFixed(2)} 层
          </text>
        </>
      )}
      {id === 'water' && (
        <>
          <rect x="25" y="95" width="100" height="105" rx="5" fill="#e1eae6" stroke="#83a597" />
          <rect x="28" y={197 - p.pool * 98} width="94" height={p.pool * 98} fill="#6bbacb" />
          <rect x="175" y="25" width="100" height="150" rx="5" fill="#e1eae6" stroke="#83a597" />
          <rect x="178" y={172 - p.tower * 142} width="94" height={p.tower * 142} fill="#6bbacb" />
          <path
            d="M125 165h25V60h25M25 110H10V55h45"
            stroke={on(0) ? '#2792ac' : '#a5bbb1'}
            strokeWidth="7"
            fill="none"
          />
          <circle cx="150" cy="165" r="11" fill={fill(0)} />
          <text x="75" y="220" textAnchor="middle" fontSize="12" fill="#456d61">
            水池 {Math.round(p.pool * 100)}%
          </text>
          <text x="225" y="193" textAnchor="middle" fontSize="12" fill="#456d61">
            水塔 {Math.round(p.tower * 100)}%
          </text>
          {light(1, 57, 43, '水阀 Y')}
        </>
      )}
      {id === 'mix' && (
        <>
          <path d="M90 45V190H220V45" fill="#e1eae6" stroke="#83a597" strokeWidth="3" />
          <rect
            x="93"
            y={187 - p.level * 137}
            width="124"
            height={p.level * 137}
            fill={on(3) ? '#85bc9f' : '#76b8cb'}
          />
          <path d="M110 25v42m90-42v42M155 190v25" stroke="#719b88" strokeWidth="7" />
          {light(0, 110, 23, 'A')}
          {light(1, 200, 23, 'B')}
          <path
            d={`M155 75V150m-22 ${on(3) ? '-10' : '0'}h44`}
            stroke={on(3) ? '#267954' : '#9fb7ab'}
            strokeWidth="5"
          />
          {[0.15, 0.55, 0.9].map((level, i) => (
            <g key={i}>
              <path d={`M225 ${187 - level * 137}h16`} stroke="#5d8273" />
              <text x="245" y={191 - level * 137} fontSize="10" fill="#527565">
                SL{3 - i}
              </text>
            </g>
          ))}
          <text x="40" y="185" fontSize="12" fill="#456d61">
            {Math.round(p.level * 100)}%
          </text>
        </>
      )}
      {id === 'assembly' && (
        <>
          <path d="M25 100H275" stroke="#b0c5ba" strokeWidth="25" />
          {Array.from({ length: 8 }, (_, i) =>
            light(i, 25 + i * 35, 100, ['D', 'A', 'E', 'B', 'F', 'C', 'G', 'H'][i]),
          )}
          <rect x={17 + p.position * 35} y="61" width="16" height="20" rx="2" fill="#d5ae65" />
          <text x="150" y="185" textAnchor="middle" fontSize="12" fill="#456d61">
            传送定时 · 加工等待移位
          </text>
        </>
      )}
      {id === 'conveyor' && (
        <>
          <path d="M22 25h55l-15 32H37Z" fill="#c4d2ca" stroke="#87a895" />
          {Array.from({ length: 4 }, (_, i) => (
            <g key={i}>
              <rect
                x={15 + i * 68}
                y={80 + i * 19}
                width="63"
                height="25"
                rx="10"
                fill={fill(i + 1)}
                stroke="#7b9f8b"
              />
              {[0, 1, 2, 3].map((j) => (
                <circle key={j} cx={25 + i * 68 + j * 13} cy={93 + i * 19} r="4" fill="#e7f0e9" />
              ))}
              <text
                x={47 + i * 68}
                y={122 + i * 19}
                textAnchor="middle"
                fontSize="11"
                fill="#527565"
              >
                M{i + 1}
              </text>
            </g>
          ))}
          <rect
            x={20 + (p.position % 4) * 68}
            y={64 + Math.floor(p.position % 4) * 19}
            width="12"
            height="12"
            fill="#c49e54"
          />
          <text x="150" y="219" textAnchor="middle" fontSize="11" fill="#456d61">
            物料只在所在段电机运行时移动
          </text>
        </>
      )}
    </svg>
  );
}
