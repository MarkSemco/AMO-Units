import React from 'react';
import { LMatchSolution } from '../../core/rf-complex';

export interface LMatchSchematicProps {
  solution: LMatchSolution;
  z0: number;
  zL: { re: number; im: number };
}

export const LMatchSchematic: React.FC<LMatchSchematicProps> = ({
  solution,
  z0,
  zL
}) => {
  const isSeriesFirst = solution.order === 'source-series-shunt-load';
  const seriesEl = isSeriesFirst ? solution.elements.sourceSide : solution.elements.loadSide;
  const shuntEl = isSeriesFirst ? solution.elements.loadSide : solution.elements.sourceSide;

  const zLDisplay = `${zL.re.toFixed(1)}${zL.im >= 0 ? '+' : '-'}j${Math.abs(zL.im).toFixed(1)}Ω`;

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px 12px',
        backgroundColor: 'var(--color-bg-base)',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--font-size-2xs)',
          color: 'var(--color-text-muted)',
          marginBottom: '4px'
        }}
      >
        <span>
          Circuit Topology: <strong style={{ color: 'var(--color-text-secondary)' }}>{solution.topologyDescription}</strong>
        </span>
        <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>
          Q = {solution.qFactor.toFixed(2)}
        </span>
      </div>

      <svg
        viewBox="0 0 350 94"
        style={{
          width: '100%',
          maxWidth: '380px',
          height: 'auto',
          overflow: 'visible'
        }}
      >
        {/* Source Box & Port */}
        <rect
          x="10"
          y="26"
          width="44"
          height="24"
          rx="3"
          fill="var(--color-bg-surface-elevated)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1"
        />
        <text
          x="32"
          y="37"
          fill="var(--color-text-muted)"
          fontSize="8"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          SOURCE
        </text>
        <text
          x="32"
          y="46"
          fill="var(--color-text-primary)"
          fontSize="8.5"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          fontWeight="bold"
        >
          {z0}Ω
        </text>

        {/* Load Box & Port */}
        <rect
          x="285"
          y="26"
          width="55"
          height="24"
          rx="3"
          fill="var(--color-bg-surface-elevated)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1"
        />
        <text
          x="312"
          y="37"
          fill="var(--color-text-muted)"
          fontSize="8"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          LOAD (Z_L)
        </text>
        <text
          x="312"
          y="46"
          fill="var(--color-text-primary)"
          fontSize="8"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          fontWeight="bold"
        >
          {zLDisplay}
        </text>

        {isSeriesFirst ? (
          /* ==============================================================
             TOPOLOGY 1: Source (30) -> Series Element (100-150) -> Node (195) -> Load (285)
                                                             |
                                                       Shunt Element (195, y: 48-68)
                                                             |
                                                            GND (195, y: 78)
             ============================================================== */
          <g>
            {/* Wire from Source to Series element */}
            <line x1="54" y1="38" x2="100" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Series Element at x: 100 to 160 */}
            {seriesEl.type === 'inductor' ? (
              /* Inductor 4 coils */
              <path
                d="M 100 38 q 7.5 -12 15 0 q 7.5 -12 15 0 q 7.5 -12 15 0 q 7.5 -12 15 0"
                fill="none"
                stroke="var(--color-rf)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              /* Capacitor parallel plates */
              <g>
                <line x1="100" y1="38" x2="126" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />
                <line x1="126" y1="28" x2="126" y2="48" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="134" y1="28" x2="134" y2="48" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="134" y1="38" x2="160" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />
              </g>
            )}

            {/* Series Label above */}
            <text
              x="130"
              y="19"
              fill="var(--color-rf)"
              fontSize="9"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              fontWeight="bold"
            >
              {seriesEl.type === 'inductor' ? 'L_s' : 'C_s'} = {seriesEl.valueDisplay}
            </text>

            {/* Wire from Series to Node (195) */}
            <line x1="160" y1="38" x2="195" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Node dot at 195, 38 */}
            <circle cx="195" cy="38" r="2.5" fill="var(--color-rf)" />

            {/* Wire from Node to Load */}
            <line x1="195" y1="38" x2="285" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Vertical Wire down to Shunt element */}
            <line x1="195" y1="38" x2="195" y2="52" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Shunt Element at x: 195, y: 52 to 70 */}
            {shuntEl.type === 'capacitor' ? (
              /* Capacitor horizontal plates */
              <g>
                <line x1="185" y1="52" x2="205" y2="52" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="185" y1="58" x2="205" y2="58" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="195" y1="58" x2="195" y2="72" stroke="var(--color-border-strong)" strokeWidth="1.5" />
              </g>
            ) : (
              /* Inductor 3 vertical coils */
              <g>
                <path
                  d="M 195 52 q -9 3.3 0 6.6 q -9 3.3 0 6.6 q -9 3.3 0 6.6"
                  fill="none"
                  stroke="var(--color-rf)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Shunt Label to the right */}
            <text
              x="212"
              y="62"
              fill="var(--color-rf)"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
            >
              {shuntEl.type === 'capacitor' ? 'C_p' : 'L_p'} = {shuntEl.valueDisplay}
            </text>

            {/* Ground symbol at 195, y: 72-80 */}
            <g transform="translate(195, 72)">
              <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--color-text-muted)" strokeWidth="1.5" />
              <line x1="-5" y1="3" x2="5" y2="3" stroke="var(--color-text-muted)" strokeWidth="1.2" />
              <line x1="-2" y1="6" x2="2" y2="6" stroke="var(--color-text-muted)" strokeWidth="1" />
            </g>
          </g>
        ) : (
          /* ==============================================================
             TOPOLOGY 2: Source (30) -> Node (105) -> Series Element (145-205) -> Load (285)
                                           |
                                     Shunt Element (105, y: 48-68)
                                           |
                                          GND (105, y: 78)
             ============================================================== */
          <g>
            {/* Wire from Source to Node (105) */}
            <line x1="54" y1="38" x2="105" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Node dot at 105, 38 */}
            <circle cx="105" cy="38" r="2.5" fill="var(--color-rf)" />

            {/* Vertical Wire down to Shunt element */}
            <line x1="105" y1="38" x2="105" y2="52" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Shunt Element at x: 105, y: 52 to 70 */}
            {shuntEl.type === 'capacitor' ? (
              /* Capacitor horizontal plates */
              <g>
                <line x1="95" y1="52" x2="115" y2="52" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="95" y1="58" x2="115" y2="58" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="105" y1="58" x2="105" y2="72" stroke="var(--color-border-strong)" strokeWidth="1.5" />
              </g>
            ) : (
              /* Inductor 3 vertical coils */
              <g>
                <path
                  d="M 105 52 q -9 3.3 0 6.6 q -9 3.3 0 6.6 q -9 3.3 0 6.6"
                  fill="none"
                  stroke="var(--color-rf)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Shunt Label to the right */}
            <text
              x="122"
              y="62"
              fill="var(--color-rf)"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
            >
              {shuntEl.type === 'capacitor' ? 'C_p' : 'L_p'} = {shuntEl.valueDisplay}
            </text>

            {/* Ground symbol at 105, y: 72-80 */}
            <g transform="translate(105, 72)">
              <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--color-text-muted)" strokeWidth="1.5" />
              <line x1="-5" y1="3" x2="5" y2="3" stroke="var(--color-text-muted)" strokeWidth="1.2" />
              <line x1="-2" y1="6" x2="2" y2="6" stroke="var(--color-text-muted)" strokeWidth="1" />
            </g>

            {/* Wire from Node (105) to Series element (160) */}
            <line x1="105" y1="38" x2="160" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />

            {/* Series Element at x: 160 to 220 */}
            {seriesEl.type === 'inductor' ? (
              /* Inductor 4 coils */
              <path
                d="M 160 38 q 7.5 -12 15 0 q 7.5 -12 15 0 q 7.5 -12 15 0 q 7.5 -12 15 0"
                fill="none"
                stroke="var(--color-rf)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              /* Capacitor parallel plates */
              <g>
                <line x1="160" y1="38" x2="186" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />
                <line x1="186" y1="28" x2="186" y2="48" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="194" y1="28" x2="194" y2="48" stroke="var(--color-rf)" strokeWidth="2" />
                <line x1="194" y1="38" x2="220" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />
              </g>
            )}

            {/* Series Label above */}
            <text
              x="190"
              y="19"
              fill="var(--color-rf)"
              fontSize="9"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              fontWeight="bold"
            >
              {seriesEl.type === 'inductor' ? 'L_s' : 'C_s'} = {seriesEl.valueDisplay}
            </text>

            {/* Wire from Series (220) to Load (285) */}
            <line x1="220" y1="38" x2="285" y2="38" stroke="var(--color-border-strong)" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
};
