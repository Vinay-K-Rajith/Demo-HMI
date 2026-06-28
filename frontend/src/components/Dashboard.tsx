import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, animate, Variants } from 'framer-motion';
import {
  AlertTriangle, Battery, ChevronRight, ClipboardCheck, ClipboardList,
  Clock, Coffee, Compass, Eye, FileText, Fuel, Gauge, Home, Menu,
  MessageSquare, MoreHorizontal, Navigation, RotateCw, Satellite, Scale,
  Signal, Sliders, Thermometer,
} from 'lucide-react';
import { VoiceAssistant } from './VoiceAssistant';

// ═════════════════════════════════════════════════════════════════════
// Animation Variants
// ═════════════════════════════════════════════════════════════════════
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const slideUp: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};

// ═════════════════════════════════════════════════════════════════════
// Animated Number Counter (spring-based)
// ═════════════════════════════════════════════════════════════════════
function AnimatedValue({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const ctrl = animate(prev.current, value, {
      duration: 0.6, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Number(v.toFixed(decimals))),
    });
    prev.current = value;
    return () => ctrl.stop();
  }, [value, decimals]);
  return <>{display}</>;
}

// ═════════════════════════════════════════════════════════════════════
// Interactive 3D Tilt Card
// ═════════════════════════════════════════════════════════════════════
interface TiltCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  variants?: Variants;
}

function TiltCard({ children, style, variants }: TiltCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    setRotateX(-(mouseY / rect.height) * 4);
    setRotateY((mouseX / rect.width) * 4);
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handleMouseLeave = () => { setRotateX(0); setRotateY(0); setIsHovered(false); };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      variants={variants}
      animate={{
        rotateX, rotateY, y: isHovered ? -2 : 0,
        boxShadow: isHovered
          ? '0 12px 32px rgba(0,0,0,0.45), 0 0 35px rgba(52,224,232,0.04)'
          : '0 4px 20px rgba(0,0,0,0.2)',
        borderColor: isHovered ? 'rgba(52,224,232,0.16)' : 'rgba(255,255,255,0.06)',
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      style={{
        perspective: 1000, transformStyle: 'preserve-3d',
        background: 'var(--obsidian-700)', border: '1px solid var(--line-2)',
        borderRadius: 'var(--r-md)', padding: 'var(--s-4)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        ...style,
      }}
    >
      {isHovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
          background: 'radial-gradient(circle 160px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.03), transparent 85%)',
        }} />
      )}
      <div style={{ transform: 'translateZ(8px)', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Ambient Background Particles
// ═════════════════════════════════════════════════════════════════════
function AmbientParticles() {
  const dots = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i, x: 5 + Math.random() * 90, size: 1 + Math.random() * 1.4,
      dur: 24 + Math.random() * 20, delay: Math.random() * 12,
      color: i % 3 === 0 ? '#3d82ff' : '#34e0e8',
      peak: 0.08 + Math.random() * 0.12,
    })), []);
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {dots.map(d => (
        <motion.div key={d.id}
          initial={{ y: '105vh', opacity: 0 }}
          animate={{ y: '-5vh', opacity: [0, d.peak, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', left: `${d.x}%`,
            width: d.size, height: d.size, borderRadius: '50%',
            background: d.color, boxShadow: `0 0 ${d.size * 3}px ${d.color}`,
          }}
        />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SectionTitle helper
// ═════════════════════════════════════════════════════════════════════
function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span className="eyebrow" style={{ fontSize: 10, letterSpacing: '0.16em' }}>{children}</span>
      {right}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Driver Profile Card
// ═════════════════════════════════════════════════════════════════════
function DriverProfile() {
  return (
    <TiltCard variants={slideUp} style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #1c2530, #0d1219)',
          border: '2px solid rgba(52,224,232,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--cyan)',
          boxShadow: '0 0 16px rgba(52,224,232,0.12)',
        }}>MT</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Michael Turner</div>
          <div className="caption" style={{ fontSize: 11, marginTop: 2 }}>Truck ID · <span style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>TRK-214</span></div>
        </div>
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-1)', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="caption" style={{ fontSize: 11 }}>Route</span>
          <span style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            Toronto <ChevronRight size={11} color="var(--fg-3)" /> Chicago
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="caption" style={{ fontSize: 11 }}>Current Status</span>
          <motion.span
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(47,215,155,0.1)', border: '1px solid rgba(47,215,155,0.25)',
              borderRadius: 'var(--r-xs)', padding: '3px 9px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--green)',
              fontFamily: 'var(--font-mono)',
            }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
            DRIVING
          </motion.span>
        </div>
      </div>
    </TiltCard>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Vehicle Status — tile grid
// ═════════════════════════════════════════════════════════════════════
function StatusTile({ icon, label, value, unit, color, accent }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; unit?: string; color?: string; accent?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--obsidian-900)', border: '1px solid var(--line-1)',
      borderRadius: 'var(--r-sm)', padding: '8px 10px', display: 'flex',
      flexDirection: 'column', gap: 4, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: color || 'var(--fg-3)', display: 'flex' }}>{icon}</span>
        <span className="caption" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span className="readout" style={{ fontSize: accent ? 19 : 16, color: color || 'var(--fg-1)', lineHeight: 1, whiteSpace: 'nowrap' }}>{value}</span>
        {unit && <span className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function VehicleStatus({ speed, fuel, odometer }: { speed: number; fuel: number; odometer: number }) {
  const fuelColor = fuel > 25 ? 'var(--green)' : fuel > 12 ? 'var(--amber)' : 'var(--red)';
  return (
    <TiltCard variants={slideUp} style={{ flexShrink: 0 }}>
      <SectionTitle>VEHICLE STATUS</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatusTile icon={<Gauge size={14} />} label="Speed" value={<AnimatedValue value={speed} />} unit="mph" color="var(--cyan)" accent />
        <StatusTile icon={<Fuel size={14} />} label="Fuel" value={<><AnimatedValue value={fuel} />%</>} color={fuelColor} accent />
        <StatusTile icon={<Thermometer size={14} />} label="Engine" value="NORMAL" color="var(--green)" />
        <StatusTile icon={<Navigation size={14} style={{ transform: 'rotate(45deg)' }} />} label="Odometer" value={odometer.toLocaleString()} unit="mi" />
        <div style={{ gridColumn: '1 / -1' }}>
          <StatusTile icon={<Battery size={14} />} label="Battery" value="14.2" unit="V · NORMAL" color="var(--green)" />
        </div>
      </div>
    </TiltCard>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Alerts
// ═════════════════════════════════════════════════════════════════════
const ALERTS = [
  { icon: Coffee, color: 'var(--amber)', text: 'Break required in 1 hour 18 minutes', time: '10:22 AM' },
  { icon: ClipboardList, color: 'var(--blue-bright)', text: 'Pre-trip inspection not submitted for next shift', time: '10:15 AM' },
  { icon: AlertTriangle, color: 'var(--red)', text: 'Low tire pressure detected: trailer axle 2', time: '10:12 AM' },
  { icon: Scale, color: 'var(--cyan)', text: 'Weigh station ahead in 18 miles', time: '10:05 AM' },
];

function Alerts() {
  return (
    <TiltCard variants={slideUp} style={{ flex: 1, minHeight: 0 }}>
      <SectionTitle right={
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: 'var(--red)', color: '#fff', borderRadius: 'var(--r-pill)',
            minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '0 5px',
          }}>{ALERTS.length}</span>
          <span className="mono clickable" style={{ fontSize: 9, color: 'var(--cyan)' }}>VIEW ALL</span>
        </span>
      }>ALERTS</SectionTitle>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        {ALERTS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div key={a.text} className="clickable"
              whileHover={{ x: 3, background: 'var(--obsidian-600)' }}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px',
                background: 'var(--obsidian-900)', border: '1px solid var(--line-1)',
                borderRadius: 'var(--r-sm)', cursor: 'pointer',
              }}>
              <Icon size={16} color={a.color} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, lineHeight: 1.35 }}>{a.text}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{a.time}</span>
                <ChevronRight size={13} color="var(--fg-3)" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </TiltCard>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Hours of Service
// ═════════════════════════════════════════════════════════════════════
function HosMetric({ icon, label, value, sub, pct, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; pct: number; color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
        {icon}
        <span className="caption" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, lineHeight: 1, color: 'var(--fg-1)' }}>{value}</div>
      <span className="caption" style={{ fontSize: 10 }}>{sub}</span>
      <div style={{ height: 4, background: 'var(--obsidian-900)', borderRadius: 'var(--r-pill)', overflow: 'hidden', marginTop: 2 }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
          style={{ height: '100%', background: color, borderRadius: 'var(--r-pill)', boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

function HoursOfService() {
  return (
    <TiltCard variants={slideUp} style={{ flexShrink: 0 }}>
      <SectionTitle right={
        <span className="clickable" style={{
          background: 'rgba(61,130,255,0.1)', border: '1px solid rgba(61,130,255,0.25)',
          borderRadius: 'var(--r-xs)', padding: '3px 10px', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.08em', color: 'var(--blue-bright)', fontFamily: 'var(--font-mono)', cursor: 'pointer',
        }}>VIEW HOS</span>
      }>HOURS OF SERVICE</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        <HosMetric icon={<Gauge size={14} />} label="Driving" value="6h 42m" sub="Today" pct={61} color="var(--cyan)" />
        <HosMetric icon={<Clock size={14} />} label="On Duty" value="8h 15m" sub="Today" pct={59} color="var(--amber)" />
        <HosMetric icon={<Coffee size={14} />} label="Break Due In" value="1h 18m" sub="Remaining" pct={26} color="var(--amber-bright)" />
        <HosMetric icon={<RotateCw size={14} />} label="Cycle Remaining" value="21h 40m" sub="70-hr / 8-day" pct={78} color="var(--green)" />
      </div>
    </TiltCard>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Current Route Map
// ═════════════════════════════════════════════════════════════════════
// Map coordinate space: 760 × 400 (aspect ≈ container) so `meet` keeps labels crisp.
const CITIES = [
  { name: 'Chicago', x: 70, y: 330, end: true, anchor: 'start' as const, dx: 12, dy: 5 },
  { name: 'Fort Wayne', x: 210, y: 298, off: true, anchor: 'middle' as const, dx: 0, dy: 22 },
  { name: 'Toledo', x: 330, y: 250, anchor: 'middle' as const, dx: 0, dy: -12 },
  { name: 'Detroit', x: 432, y: 198, anchor: 'start' as const, dx: 14, dy: 6 },
  { name: 'Sarnia', x: 520, y: 150, anchor: 'start' as const, dx: 12, dy: 5 },
  { name: 'Cleveland', x: 575, y: 300, off: true, anchor: 'start' as const, dx: 12, dy: 5 },
  { name: 'Toronto', x: 690, y: 72, end: true, anchor: 'end' as const, dx: -14, dy: 6 },
];
const ROUTE_D = 'M70 330 Q 140 318 210 298 T 330 250 Q 381 224 432 198 T 520 150 Q 605 110 690 72';
const TRUCK_X = [70, 210, 330, 432, 520, 690];
const TRUCK_Y = [330, 298, 250, 198, 150, 72];

function RouteMap() {
  return (
    <TiltCard variants={slideUp} style={{ flex: 1, padding: 0, minHeight: 0 }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Title overlay */}
        <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 4 }}>
          <SectionTitle>CURRENT ROUTE</SectionTitle>
        </div>
        {/* Compass */}
        <div style={{
          position: 'absolute', top: 14, right: 16, zIndex: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'var(--fg-2)',
        }}>
          <Compass size={17} />
          <span className="mono" style={{ fontSize: 8 }}>N</span>
        </div>

        {/* Map */}
        <svg viewBox="0 0 760 400" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#3d82ff" /><stop offset="1" stopColor="#6cf3f8" />
            </linearGradient>
            <radialGradient id="mapBg" cx="50%" cy="38%" r="75%">
              <stop offset="0" stopColor="#0e1521" /><stop offset="1" stopColor="#06090e" />
            </radialGradient>
            <filter id="soften" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          <rect width="760" height="400" fill="url(#mapBg)" />

          {/* Subtle map grid */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="400" stroke="rgba(52,224,232,0.035)" strokeWidth="1" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 80} x2="760" y2={i * 80} stroke="rgba(52,224,232,0.035)" strokeWidth="1" />
          ))}

          {/* Great Lakes — soft stylized water bodies */}
          <g filter="url(#soften)" opacity="0.9">
            <path d="M260 20 Q 420 0 560 50 Q 600 110 470 120 Q 320 110 250 70 Z" fill="rgba(61,130,255,0.10)" />
            <path d="M470 150 Q 620 140 700 210 Q 710 290 580 290 Q 470 270 460 200 Z" fill="rgba(61,130,255,0.09)" />
            <path d="M30 80 Q 120 70 150 200 Q 160 330 70 360 Q -10 320 10 200 Z" fill="rgba(61,130,255,0.10)" />
          </g>

          {/* Route base */}
          <path d={ROUTE_D} fill="none" stroke="#1a2433" strokeWidth="7" strokeLinecap="round" />
          {/* Route gradient + glow */}
          <path d={ROUTE_D} fill="none" stroke="url(#routeGrad)" strokeWidth="3.5" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 5px rgba(61,130,255,0.55))' }} />
          {/* Animated flow */}
          <motion.path d={ROUTE_D} fill="none" stroke="#cff6f9" strokeWidth="1.6" strokeLinecap="round"
            strokeDasharray="2 22" opacity={0.55}
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />

          {/* Cities */}
          {CITIES.map((c) => {
            const col = c.name === 'Toronto' ? 'var(--green)' : 'var(--cyan)';
            return (
              <g key={c.name}>
                {c.end ? (
                  <>
                    <circle cx={c.x} cy={c.y} r="9" fill={col} opacity="0.18" />
                    <circle cx={c.x} cy={c.y} r="4.5" fill={col} stroke="#06090e" strokeWidth="1.5"
                      style={{ filter: `drop-shadow(0 0 5px ${col})` }} />
                  </>
                ) : (
                  <circle cx={c.x} cy={c.y} r={c.off ? 2.5 : 3} fill={c.off ? 'var(--fg-3)' : 'var(--fg-2)'} />
                )}
                <text x={c.x + c.dx} y={c.y + c.dy} textAnchor={c.anchor}
                  fill={c.off ? 'var(--fg-3)' : 'var(--fg-1)'}
                  fontSize={c.end ? 15 : 13} fontFamily="'Sora', sans-serif" fontWeight={c.end ? 600 : 400}
                  style={{ paintOrder: 'stroke', stroke: '#06090e', strokeWidth: 3, strokeLinejoin: 'round' }}>
                  {c.name}
                </text>
              </g>
            );
          })}

          {/* Animated truck marker travelling the route */}
          <motion.g
            animate={{ x: TRUCK_X, y: TRUCK_Y }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.circle r="11" fill="var(--cyan)" opacity="0.18"
              animate={{ scale: [1, 1.5, 1], opacity: [0.18, 0, 0.18] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <circle r="6" fill="var(--cyan)" stroke="#06090e" strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 7px var(--cyan-glow))' }} />
          </motion.g>
        </svg>

        {/* Edge vignette for depth */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: 'inset 0 0 80px 20px rgba(4,6,10,0.55)', borderRadius: 'var(--r-md)',
        }} />

        {/* Footer — next waypoint */}
        <div style={{
          position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(7,10,16,0.82)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '9px 13px',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <Navigation size={13} color="var(--cyan)" style={{ transform: 'rotate(45deg)' }} />
            <span style={{ fontWeight: 600 }}>18 mi</span>
            <span className="caption" style={{ fontSize: 11 }}>to next waypoint · Detroit</span>
          </span>
          <ChevronRight size={15} color="var(--fg-3)" />
        </div>
      </div>
    </TiltCard>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Bottom Navigation
// ═════════════════════════════════════════════════════════════════════
const NAV = [
  { key: 'Dashboard', icon: Home }, { key: 'HOS', icon: Clock },
  { key: 'Logs', icon: FileText }, { key: 'DVIR', icon: ClipboardCheck },
  { key: 'Messages', icon: MessageSquare }, { key: 'More', icon: MoreHorizontal },
];

function BottomNav() {
  const [active, setActive] = useState('Dashboard');
  return (
    <div style={{
      height: 54, flexShrink: 0, borderTop: '1px solid var(--line-1)',
      background: 'var(--obsidian-900)', display: 'flex', alignItems: 'stretch',
      justifyContent: 'space-around', padding: '0 8px', position: 'relative', zIndex: 1,
    }}>
      {NAV.map((n) => {
        const Icon = n.icon;
        const on = active === n.key;
        return (
          <button key={n.key} onClick={() => setActive(n.key)} style={{
            flex: 1, maxWidth: 120, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, color: on ? 'var(--cyan)' : 'var(--fg-3)', position: 'relative',
            transition: 'color var(--dur-fast) ease',
          }}>
            {on && (
              <motion.span layoutId="navActive" style={{
                position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
                background: 'var(--cyan)', borderRadius: 'var(--r-pill)', boxShadow: '0 0 8px var(--cyan-glow)',
              }} />
            )}
            <Icon size={18} />
            <span className="mono" style={{ fontSize: 9, letterSpacing: '0.04em' }}>{n.key}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Dashboard
// ═════════════════════════════════════════════════════════════════════
export function Dashboard() {
  const [speed, setSpeed] = useState(61);
  const [fuel, setFuel] = useState(58);
  const [engaged, setEngaged] = useState(true);
  const [gear] = useState('D');
  const [temp, setTemp] = useState(21.5);
  const [musicTrack] = useState('Highway Drift — Trucker Radio');
  const [range, setRange] = useState(412);
  const [simOpen, setSimOpen] = useState(true);
  const odometer = 428516;

  const [time, setTime] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleSpeed = (v: number) => { setSpeed(v); setRange(Math.round(530 * (fuel / 100) * (1 - (v / 240) * 0.4))); };
  const handleFuel = (v: number) => { setFuel(v); setRange(Math.round(530 * (v / 100) * (1 - (speed / 240) * 0.4))); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', position: 'relative' }}>
      <AmbientParticles />

      {/* ═══ HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: 52, flexShrink: 0, borderBottom: '1px solid var(--line-1)',
          background: 'var(--obsidian-900)', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '0 20px', zIndex: 10, position: 'relative',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Menu size={20} color="var(--fg-2)" className="clickable" style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>ELD Driver Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="caption" style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--green)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} /> Connected
          </span>
          <span className="caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Satellite size={13} /> GPS</span>
          <span className="caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Signal size={13} /> LTE</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{dateStr} &nbsp; {timeStr}</span>
        </div>
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(52,224,232,0.15), rgba(61,130,255,0.15), transparent)',
            backgroundSize: '200% 100%' }}
        />
      </motion.header>

      {/* ═══ MAIN GRID ═══ */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: 10, padding: 10, overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>

        {/* ─── LEFT ─── */}
        <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <DriverProfile />
          <VehicleStatus speed={speed} fuel={fuel} odometer={odometer} />
          <Alerts />
        </motion.div>

        {/* ─── CENTER ─── */}
        <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <HoursOfService />
          <RouteMap />
        </motion.div>

        {/* ─── RIGHT ─── */}
        <motion.div variants={slideUp} style={{ minHeight: 0 }}>
          <VoiceAssistant speed={speed} battery={fuel} range={range} engaged={engaged} gear={gear} temp={temp} musicTrack={musicTrack} />
        </motion.div>
      </motion.div>

      {/* ═══ SIMULATOR STRIP (speed + fuel toggles preserved) ═══ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: simOpen ? 64 : 26 }}
        transition={{ height: { type: 'spring', stiffness: 300, damping: 30 }, y: { delay: 0.3 } }}
        style={{ flexShrink: 0, borderTop: '1px solid var(--line-1)', background: 'var(--obsidian-900)', overflow: 'hidden', padding: simOpen ? '9px 20px' : '4px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: simOpen ? 8 : 0, cursor: 'pointer' }} onClick={() => setSimOpen(!simOpen)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-3)' }}>
            <Sliders size={10} /><span className="eyebrow" style={{ fontSize: 9 }}>SIMULATOR</span><Eye size={10} color="var(--cyan-dim)" />
          </div>
          <span className="caption" style={{ fontSize: 9 }}>{simOpen ? '▾ collapse' : '▸ expand'} · Genie sees slider changes in real-time</span>
        </div>
        <AnimatePresence>
          {simOpen && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto 1fr', gap: 24, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', width: 50, flexShrink: 0 }}>SPEED</span>
                <input type="range" min="0" max="200" value={speed} onChange={(e) => handleSpeed(+e.target.value)} />
                <span className="mono" style={{ fontSize: 11, width: 50, textAlign: 'right' }}>{speed} mph</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', width: 50, flexShrink: 0 }}>FUEL</span>
                <input type="range" min="0" max="100" value={fuel} onChange={(e) => handleFuel(+e.target.value)} />
                <span className="mono" style={{ fontSize: 11, width: 50, textAlign: 'right' }}>{fuel}%</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['ENGAGED', 'STANDBY'] as const).map(m => (
                  <motion.button key={m} onClick={() => setEngaged(m === 'ENGAGED')}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    animate={{ borderColor: (m === 'ENGAGED') === engaged ? '#34e0e8' : 'rgba(255,255,255,0.1)', background: (m === 'ENGAGED') === engaged ? 'rgba(52,224,232,0.1)' : 'transparent', color: (m === 'ENGAGED') === engaged ? '#34e0e8' : '#5e6b7c' }}
                    transition={{ duration: 0.2 }}
                    style={{ border: '1px solid', borderRadius: 'var(--r-xs)', padding: '2px 10px', fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', cursor: 'pointer' }}
                  >{m}</motion.button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', width: 50, flexShrink: 0 }}>CABIN</span>
                <input type="range" min="16" max="28" step="0.5" value={temp} onChange={(e) => setTemp(+e.target.value)} />
                <span className="mono" style={{ fontSize: 11, width: 50, textAlign: 'right' }}>{temp}°C</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ BOTTOM NAV ═══ */}
      <BottomNav />
    </div>
  );
}
