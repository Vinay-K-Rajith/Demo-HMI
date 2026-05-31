import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BoundingBoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  sub: string;
}

function BoundingBox({ x, y, w, h, color, label, sub }: BoundingBoxProps) {
  // bracketed 3D-ish box: a rounded body + corner brackets + floating label
  const b = 8; // bracket length
  const stroke = color;
  return (
    <motion.g
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 60, damping: 15, mass: 0.8 }}
      style={{ pointerEvents: 'none' }}
    >
      {/* shadow on ground */}
      <ellipse cx={0} cy={h / 2 + 4} rx={w * 0.55} ry={6} fill="rgba(0,0,0,0.5)" />
      
      {/* vehicle body */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={6}
        fill="rgba(19,26,36,0.94)"
        stroke={stroke}
        strokeWidth="1.4"
        opacity="0.95"
      />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h * 0.42}
        rx={6}
        fill={stroke}
        opacity="0.14"
      />

      {/* corner brackets */}
      {([
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const).map(([sx, sy], i) => {
        const cx = sx * (w / 2);
        const cy = sy * (h / 2);
        return (
          <path
            key={i}
            d={`M ${cx - sx * b} ${cy} L ${cx} ${cy} L ${cx} ${cy - sy * b}`}
            stroke={stroke}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {/* label chip */}
      <g transform={`translate(${w / 2 + 8}, ${-h / 2})`}>
        <rect
          x="0"
          y="0"
          width="54"
          height="30"
          rx="5"
          fill="rgba(4,6,10,0.85)"
          stroke={stroke}
          strokeWidth="1"
        />
        <text
          x="8"
          y="13"
          fill={stroke}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="11"
          fontWeight="600"
        >
          {label}
        </text>
        <text
          x="8"
          y="25"
          fill="#9ba8b8"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9"
        >
          {sub}
        </text>
      </g>
    </motion.g>
  );
}

interface SensorVisualizerProps {
  engaged: boolean;
  speed: number;
}

export function SensorVisualizer({ engaged, speed }: SensorVisualizerProps) {
  // Dynamic state for vehicles to simulate active road movement
  const [vehicles, setVehicles] = useState([
    { id: 1, baseDist: 14, x: 183, y: 330, w: 56, h: 64, color: '#ffb224', sub: 'cut-in', label: '14.0 m' },
    { id: 2, baseDist: 31, x: 286, y: 236, w: 44, h: 50, color: '#3d82ff', sub: '62 km/h', label: '31.0 m' },
    { id: 3, baseDist: 22, x: 392, y: 300, w: 50, h: 58, color: '#3d82ff', sub: '58 km/h', label: '22.0 m' },
  ]);

  // Simulate environmental vehicle adjustments relative to speed
  useEffect(() => {
    let time = 0;
    const interval = setInterval(() => {
      const velocityFactor = speed > 0 ? (speed / 60) : 1;
      time += 0.15 * velocityFactor;

      setVehicles((prev) =>
        prev.map((v) => {
          let dx = 0;
          let dy = 0;
          let distChange = 0;

          if (v.id === 1) {
            dx = Math.sin(time * 1.2) * 11;
            distChange = Math.cos(time * 0.8) * 1.6;
          } else if (v.id === 2) {
            distChange = Math.sin(time * 0.5) * 3.2;
            dy = distChange * -0.5;
          } else if (v.id === 3) {
            dx = Math.sin(time * 0.8) * 5.5;
            distChange = Math.cos(time * 0.6) * 2.0;
          }

          const currentDist = Math.max(8, v.baseDist + distChange);

          const baseX = v.id === 1 ? 183 : v.id === 2 ? 286 : 392;
          const baseY = v.id === 1 ? 330 : v.id === 2 ? 236 : 300;

          return {
            ...v,
            x: baseX + dx,
            y: baseY + dy,
            label: `${currentDist.toFixed(1)} m`,
          };
        })
      );
    }, 150);

    return () => clearInterval(interval);
  }, [speed]);

  const trajColor = engaged ? '#3d82ff' : '#5e6b7c';
  const duration = speed > 0 ? `${(200 / speed) * 0.55}s` : '0s';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Inline styles for CSS keyframe animations to keep the component portable */}
      <style>{`
        @keyframes laneFlowAnimation {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes trajFlowAnimation {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 40; }
        }
        .flowing-lane-1 {
          animation: ${speed > 0 ? `laneFlowAnimation ${duration} linear infinite` : 'none'};
        }
        .flowing-traj {
          animation: ${speed > 0 ? `trajFlowAnimation ${duration} linear infinite` : 'none'};
        }
      `}</style>

      <svg
        viewBox="0 0 560 560"
        width="100%"
        height="100%"
        style={{ display: 'block', background: 'transparent' }}
      >
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

          {/* Sensor Sweep cone mask for Radar ripples */}
          <clipPath id="sensorConeClip">
            <path d="M280 498 L100 100 L460 100 Z" />
          </clipPath>
        </defs>

        <rect x="0" y="0" width="560" height="560" fill="url(#floorGlow)" />

        {/* road surface */}
        <path d="M60 545 L500 545 L310 92 L250 92 Z" fill="url(#roadFill)" />
        {/* road edges */}
        <path d="M60 545 L250 92" stroke="#2a3647" strokeWidth="2" fill="none" />
        <path d="M500 545 L310 92" stroke="#2a3647" strokeWidth="2" fill="none" />

        {/* detected lane lines (cyan, dashed, flowing via CSS) */}
        <path
          className="flowing-lane-1"
          d="M206.7 545 L270 92"
          stroke="#34e0e8"
          strokeWidth="3"
          fill="none"
          strokeDasharray="22 18"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(52,224,232,0.6))' }}
        />
        <path
          className="flowing-lane-1"
          d="M353.3 545 L290 92"
          stroke="#34e0e8"
          strokeWidth="3"
          fill="none"
          strokeDasharray="22 18"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(52,224,232,0.6))' }}
        />

        {/* Radar Sweep concentric ripples inside LiDAR cone */}
        {engaged && (
          <g clipPath="url(#sensorConeClip)">
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx="280"
                cy="498"
                r={0}
                fill="none"
                stroke="rgba(52,224,232,0.22)"
                strokeWidth="1.5"
                animate={{ r: [0, 420], opacity: [0.65, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1.0,
                  ease: 'linear',
                }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(52,224,232,0.35))' }}
              />
            ))}
          </g>
        )}

        {/* predicted trajectory */}
        <path
          className="flowing-traj"
          d="M280 470 C 280 380, 268 300, 280 150"
          stroke="url(#trajFade)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2 16"
          style={{ filter: `drop-shadow(0 0 6px ${trajColor})` }}
        />

        {/* tracked vehicles (perspective: smaller = farther, animated via motion.g) */}
        {vehicles.map((v) => (
          <BoundingBox
            key={v.id}
            x={v.x}
            y={v.y}
            w={v.w}
            h={v.h}
            color={v.color}
            label={v.label || `${v.baseDist} m`}
            sub={v.sub}
          />
        ))}

        {/* ego vehicle */}
        <g>
          <ellipse cx="280" cy="512" rx="52" ry="10" fill="rgba(0,0,0,0.55)" />
          <rect
            x="244"
            y="452"
            width="72"
            height="92"
            rx="14"
            fill="#131a24"
            stroke="#34e0e8"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 10px rgba(52,224,232,0.45))' }}
          />
          <rect x="252" y="462" width="56" height="30" rx="7" fill="rgba(52,224,232,0.18)" />
          <rect x="252" y="505" width="56" height="26" rx="7" fill="rgba(52,224,232,0.10)" />
        </g>

        {/* sensor sweep cone when engaged */}
        {engaged && (
          <path
            d="M280 498 L150 150 L410 150 Z"
            fill="rgba(52,224,232,0.04)"
            stroke="rgba(52,224,232,0.12)"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* ADAS Status overlay */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span
          className="eyebrow"
          style={{
            background: 'rgba(52, 224, 232, 0.08)',
            padding: '4px 10px',
            borderRadius: 'var(--r-xs)',
            border: '1px solid rgba(52, 224, 232, 0.2)',
          }}
        >
          ADAS {engaged ? 'ACTIVE' : 'STANDBY'}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 'var(--t-caption)',
            color: 'var(--fg-2)',
            background: 'var(--obsidian-700)',
            padding: '4px 10px',
            borderRadius: 'var(--r-xs)',
            border: '1px solid var(--line-2)',
          }}
        >
          LiDAR & Radar Connected
        </span>
      </div>
    </div>
  );
}
