/* global React */
// SensorVisualizer — the autonomous-driving stack visualizer that sits at the
// center of the instrument cluster. Perspective road, color-coded lane
// detection, 3D bounding boxes on tracked vehicles, and a predicted trajectory.
// Cosmetic recreation — values are illustrative, not a real perception stack.

const { useEffect, useRef } = React;

function BoundingBox({ x, y, w, h, color, label, sub }) {
  // bracketed 3D-ish box: a rounded body + corner brackets + floating label
  const b = 10; // bracket length
  const stroke = color;
  return (
    <g>
      {/* shadow on ground */}
      <ellipse cx={x} cy={y + h / 2 + 4} rx={w * 0.55} ry={6} fill="rgba(0,0,0,0.5)" />
      {/* vehicle body */}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
            fill="rgba(19,26,36,0.92)" stroke={stroke} strokeWidth="1.4" opacity="0.95" />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h * 0.42} rx={6}
            fill={stroke} opacity="0.14" />
      {/* corner brackets */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => {
        const cx = x + sx * (w / 2);
        const cy = y + sy * (h / 2);
        return (
          <path key={i}
            d={`M ${cx - sx * b} ${cy} L ${cx} ${cy} L ${cx} ${cy - sy * b}`}
            stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        );
      })}
      {/* label chip */}
      <g transform={`translate(${x + w / 2 + 8}, ${y - h / 2})`}>
        <rect x="0" y="0" width="52" height="30" rx="5" fill="rgba(4,6,10,0.85)" stroke={stroke} strokeWidth="1" />
        <text x="8" y="13" fill={stroke} fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="600">{label}</text>
        <text x="8" y="25" fill="#9ba8b8" fontFamily="'JetBrains Mono', monospace" fontSize="9">{sub}</text>
      </g>
    </g>
  );
}

function SensorVisualizer({ engaged }) {
  const trajRef = useRef(null);

  // flow the lane dashes + trajectory dashes downward to imply motion
  useEffect(() => {
    let raf, off = 0;
    const tick = () => {
      off = (off + 1.2) % 64;
      document.querySelectorAll('.lane-flow').forEach((el) => {
        el.style.strokeDashoffset = String(off);
      });
      if (trajRef.current) trajRef.current.style.strokeDashoffset = String(-off * 1.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const trajColor = engaged ? '#3d82ff' : '#5e6b7c';

  return (
    <svg viewBox="0 0 560 560" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="floorGlow" cx="50%" cy="78%" r="60%">
          <stop offset="0%" stopColor="rgba(61,130,255,0.16)" />
          <stop offset="100%" stopColor="rgba(61,130,255,0)" />
        </radialGradient>
        <linearGradient id="roadFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#11161f" />
          <stop offset="100%" stopColor="#070a0f" />
        </linearGradient>
        <linearGradient id="trajFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={trajColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={trajColor} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="560" height="560" fill="url(#floorGlow)" />

      {/* road surface */}
      <path d="M60 545 L500 545 L310 92 L250 92 Z" fill="url(#roadFill)" />
      {/* road edges */}
      <path d="M60 545 L250 92" stroke="#2a3647" strokeWidth="2" fill="none" />
      <path d="M500 545 L310 92" stroke="#2a3647" strokeWidth="2" fill="none" />

      {/* detected lane lines (cyan, dashed, flowing) */}
      <path className="lane-flow" d="M206.7 545 L270 92" stroke="#34e0e8" strokeWidth="3"
            fill="none" strokeDasharray="22 18" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(52,224,232,0.6))' }} />
      <path className="lane-flow" d="M353.3 545 L290 92" stroke="#34e0e8" strokeWidth="3"
            fill="none" strokeDasharray="22 18" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(52,224,232,0.6))' }} />

      {/* predicted trajectory */}
      <path ref={trajRef} d="M280 470 C 280 380, 268 300, 280 150" stroke="url(#trajFade)"
            strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="2 16"
            style={{ filter: `drop-shadow(0 0 6px ${trajColor})` }} />

      {/* tracked vehicles (perspective: smaller = farther) */}
      <BoundingBox x={183} y={330} w={56} h={64} color="#ffb224" label="14 m" sub="cut-in" />
      <BoundingBox x={286} y={236} w={44} h={50} color="#3d82ff" label="31 m" sub="62 km/h" />
      <BoundingBox x={392} y={300} w={50} h={58} color="#3d82ff" label="22 m" sub="58 km/h" />

      {/* ego vehicle */}
      <g>
        <ellipse cx="280" cy="512" rx="52" ry="10" fill="rgba(0,0,0,0.55)" />
        <rect x="244" y="452" width="72" height="92" rx="14"
              fill="#131a24" stroke="#34e0e8" strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 10px rgba(52,224,232,0.45))' }} />
        <rect x="252" y="462" width="56" height="30" rx="7" fill="rgba(52,224,232,0.18)" />
        <rect x="252" y="505" width="56" height="26" rx="7" fill="rgba(52,224,232,0.10)" />
      </g>

      {/* sensor sweep cone when engaged */}
      {engaged && (
        <path d="M280 498 L150 150 L410 150 Z" fill="rgba(52,224,232,0.05)"
              stroke="rgba(52,224,232,0.15)" strokeWidth="1" />
      )}
    </svg>
  );
}

window.SensorVisualizer = SensorVisualizer;
