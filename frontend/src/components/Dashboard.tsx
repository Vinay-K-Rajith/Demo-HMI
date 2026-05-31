import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, animate, Variants } from 'framer-motion';
import {
  AlertTriangle, Battery, ChevronRight, Compass, Eye,
  Lock, Music, Navigation, Pause, Play, SkipForward,
  Sliders, Sun, Thermometer, Unlock, Zap,
} from 'lucide-react';
import { SensorVisualizer } from './SensorVisualizer';
import { VoiceAssistant } from './VoiceAssistant';

// ═════════════════════════════════════════════════════════════════════
// Animation Variants
// ═════════════════════════════════════════════════════════════════════
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const slideUp: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};

// ═════════════════════════════════════════════════════════════════════
// Animated Number Counter (spring-based, for SOC & Range)
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
// Odometer Reel (rolling spring digits, for Speedometer)
// ═════════════════════════════════════════════════════════════════════
function Digit({ digit }: { digit: string }) {
  const num = parseInt(digit, 10);
  if (isNaN(num)) {
    return <span style={{ width: '0.4em', display: 'inline-block', textAlign: 'center' }}>{digit}</span>;
  }
  return (
    <span style={{ display: 'inline-block', height: 56, overflow: 'hidden', width: 34, position: 'relative', textAlign: 'center' }}>
      <motion.span
        animate={{ y: -num * 56 }}
        transition={{ type: 'spring', stiffness: 100, damping: 16, mass: 0.6 }}
        style={{ display: 'flex', flexDirection: 'column', position: 'absolute', top: 0, left: 0, right: 0 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function RollingOdometer({ value }: { value: number }) {
  const digits = String(value).padStart(3, '0').split('');
  return (
    <span style={{ display: 'inline-flex', overflow: 'hidden', height: 56, lineHeight: 1 }}>
      {digits.map((d, i) => (
        <Digit key={i} digit={d} />
      ))}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Interactive 3D Tilt Card Component
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
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    // Limit vertical/horizontal tilt to 5 degrees max
    const rX = -(mouseY / height) * 6;
    const rY = (mouseX / width) * 6;
    setRotateX(rX);
    setRotateY(rY);

    // Track mouse coordinates dynamically on the parent container
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      variants={variants}
      animate={{
        rotateX,
        rotateY,
        y: isHovered ? -2 : 0,
        boxShadow: isHovered 
          ? '0 12px 32px rgba(0,0,0,0.45), 0 0 35px rgba(52,224,232,0.04)'
          : '0 4px 20px rgba(0,0,0,0.2)',
        borderColor: isHovered ? 'rgba(52,224,232,0.18)' : 'rgba(255,255,255,0.06)',
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        background: 'var(--obsidian-700)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--r-md)',
        padding: 'var(--s-4)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* specularity overlay */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle 140px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.035), transparent 85%)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
      <div style={{ transform: 'translateZ(8px)', height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Media Audio Equalizer Visualizer
// ═════════════════════════════════════════════════════════════════════
function MediaVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12, width: 14 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: isPlaying ? [2, 12, 4, 10, 2] : 2,
          }}
          transition={{
            duration: 0.6 + i * 0.12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.06,
          }}
          style={{
            width: 2,
            backgroundColor: '#a855f7',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Ambient Background Particles
// ═════════════════════════════════════════════════════════════════════
function AmbientParticles() {
  const dots = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i, x: 5 + Math.random() * 90, size: 1 + Math.random() * 1.4,
      dur: 22 + Math.random() * 20, delay: Math.random() * 12,
      color: i % 3 === 0 ? '#3d82ff' : '#34e0e8',
      peak: 0.1 + Math.random() * 0.15,
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
// Gauge Constants
// ═════════════════════════════════════════════════════════════════════
const GR = 86, GCX = 100, GCY = 100;
const GCIRC = 2 * Math.PI * GR;
const GARC = GCIRC * 0.75;
const MAXSPD = 200;

function gpt(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: GCX + r * Math.cos(rad), y: GCY + r * Math.sin(rad) };
}

function WindIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Dashboard
// ═════════════════════════════════════════════════════════════════════
export function Dashboard() {
  const [speed, setSpeed] = useState(62);
  const [battery, setBattery] = useState(78);
  const [engaged, setEngaged] = useState(true);
  const [gear, setGear] = useState('D');
  const [temp, setTemp] = useState(21.5);
  const [musicTrack] = useState('Electric Waves — Synthwave');
  const [isPlaying, setIsPlaying] = useState(true);
  const [range, setRange] = useState(412);
  const [isLocked, setIsLocked] = useState(true);
  const [isHazardOn, setIsHazardOn] = useState(false);
  const [isDefogOn, setIsDefogOn] = useState(false);
  const [isHighBeamOn, setIsHighBeamOn] = useState(false);
  const [simOpen, setSimOpen] = useState(true);

  const [time, setTime] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const handleSpeed = (v: number) => { setSpeed(v); setRange(Math.round(530 * (battery / 100) * (1 - (v / 240) * 0.4))); };
  const handleBattery = (v: number) => { setBattery(v); setRange(Math.round(530 * (v / 100) * (1 - (speed / 240) * 0.4))); };

  // Gauge
  const sf = Math.min(speed / MAXSPD, 1);
  const gaugeOff = GARC - sf * GARC;
  const tipPt = gpt(135 + sf * 270, GR);
  const gCol = speed > 160 ? '#ff5470' : speed > 100 ? '#ffb224' : '#34e0e8';
  const gGlow = speed > 160 ? 'rgba(255,84,112,0.5)' : speed > 100 ? 'rgba(255,178,36,0.4)' : 'rgba(52,224,232,0.45)';
  const bCol = battery > 20 ? '#2fd79b' : battery > 10 ? '#ffb224' : '#ff5470';
  const bGlow = battery > 20 ? 'rgba(47,215,155,0.4)' : battery > 10 ? 'rgba(255,178,36,0.4)' : 'rgba(255,84,112,0.4)';

  const ticks = useMemo(() => {
    const r: { x1: number; y1: number; x2: number; y2: number; m: boolean; v: number; lx: number; ly: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = 135 + (i / 20) * 270;
      const m = i % 4 === 0;
      const inner = gpt(a, m ? GR - 14 : GR - 8);
      const outer = gpt(a, GR);
      const lbl = gpt(a, GR + 14);
      r.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, m, v: i * 10, lx: lbl.x, ly: lbl.y });
    }
    return r;
  }, []);

  const quickCtrls = [
    { key: 'LOCKS', icon: isLocked ? Lock : Unlock, active: !isLocked, color: '#ffb224', bg: 'rgba(255,178,36,0.08)', toggle: () => setIsLocked(!isLocked) },
    { key: 'HAZARD', icon: AlertTriangle, active: isHazardOn, color: '#ff5470', bg: 'rgba(255,84,112,0.08)', toggle: () => setIsHazardOn(!isHazardOn) },
    { key: 'DEFOG', icon: WindIcon, active: isDefogOn, color: '#3d82ff', bg: 'rgba(61,130,255,0.08)', toggle: () => setIsDefogOn(!isDefogOn) },
    { key: 'BEAMS', icon: Sun, active: isHighBeamOn, color: '#34e0e8', bg: 'rgba(52,224,232,0.08)', toggle: () => setIsHighBeamOn(!isHighBeamOn) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', position: 'relative' }}>
      <AmbientParticles />

      {/* ═══ HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: 48, flexShrink: 0, borderBottom: '1px solid var(--line-1)',
          background: 'var(--obsidian-900)', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '0 20px', zIndex: 10, position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="22" height="22" viewBox="0 0 120 120" fill="none">
            <defs><linearGradient id="vmark" x1="28" y1="28" x2="92" y2="96" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6cf3f8" /><stop offset="1" stopColor="#3d82ff" />
            </linearGradient></defs>
            <path d="M30 30 L60 92 L90 30" stroke="url(#vmark)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M64 50 L52 70 L60 70 L56 84 L72 60 L63 60 Z" fill="#34e0e8" />
          </svg>
          <span className="readout" style={{ fontSize: 15, letterSpacing: '0.12em' }}>VOLTA-HMI</span>
          <span className="eyebrow" style={{ background: 'rgba(61,130,255,0.08)', border: '1px solid rgba(61,130,255,0.15)', padding: '1px 8px', borderRadius: 'var(--r-xs)', color: 'var(--blue-bright)', fontSize: 9 }}>OS v4.12</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Thermometer size={12} /> EXT 28°C</div>
          <div className="caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Compass size={12} /> NW</div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{timeStr}</span>
        </div>
        {/* Animated header line */}
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
        style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 10, padding: 10, overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>

        {/* ─── LEFT ─── */}
        <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

          {/* Speed Gauge (3D Tilt Card) */}
          <TiltCard variants={slideUp}
            style={{ flex: 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
            <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>SPEEDOMETER</span>
            <div style={{ position: 'relative', width: 200, height: 200, margin: '-4px 0' }}>
              {/* Breathing inner glow */}
              <motion.div
                animate={{ opacity: [0.03, 0.08, 0.03], scale: [0.95, 1.02, 0.95] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: `radial-gradient(circle, ${gGlow}, transparent 70%)` }}
              />
              <svg width="200" height="200" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#6cf3f8" /><stop offset="1" stopColor="#3d82ff" />
                  </linearGradient>
                </defs>
                <circle cx={GCX} cy={GCY} r={GR} className="gauge-track" strokeWidth="12"
                  strokeDasharray={`${GARC} ${GCIRC}`} transform={`rotate(135 ${GCX} ${GCY})`} />
                {/* Animated gauge arc */}
                <motion.circle cx={GCX} cy={GCY} r={GR} fill="none" strokeWidth="12" strokeLinecap="round"
                  stroke={speed > 160 ? '#ff5470' : 'url(#gg)'}
                  strokeDasharray={`${GARC} ${GCIRC}`}
                  animate={{ strokeDashoffset: gaugeOff }}
                  transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                  transform={`rotate(135 ${GCX} ${GCY})`}
                  style={{ filter: `drop-shadow(0 0 10px ${gGlow})` }}
                />
                {/* Tick marks */}
                {ticks.map((t, i) => (
                  <g key={i}>
                    <motion.line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                      animate={{ stroke: t.v <= speed ? gCol : '#232d3d' }}
                      transition={{ duration: 0.3 }}
                      strokeWidth={t.m ? 2 : 1} strokeLinecap="round" />
                    {t.m && <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="central"
                      fill="var(--fg-3)" fontSize="8" fontFamily="'JetBrains Mono', monospace">{t.v}</text>}
                  </g>
                ))}
                {/* Glowing tip dot */}
                <motion.circle r={4} fill={gCol}
                  animate={{ cx: tipPt.x, cy: tipPt.y, opacity: [0.7, 1, 0.7] }}
                  transition={{
                    cx: { type: 'spring', stiffness: 50, damping: 14 },
                    cy: { type: 'spring', stiffness: 50, damping: 14 },
                    opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{ filter: `drop-shadow(0 0 8px ${gGlow})` }}
                />
              </svg>
              {/* Center mechanical reel odometer readout */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 56, color: 'var(--fg-1)', lineHeight: 1 }}>
                  <RollingOdometer value={speed} />
                </span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em', marginTop: 2 }}>KM / H</span>
              </div>
            </div>
            {/* Gear Selector */}
            <div style={{ display: 'flex', gap: 6, background: 'var(--obsidian-900)', padding: 4, borderRadius: 'var(--r-sm)', border: '1px solid var(--line-1)' }}>
              {['P', 'R', 'N', 'D'].map((g) => (
                <motion.button key={g} onClick={() => setGear(g)}
                  whileTap={{ scale: 0.9 }}
                  animate={{ background: gear === g ? '#34e0e8' : 'transparent', color: gear === g ? '#04060a' : '#5e6b7c' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ border: 'none', width: 30, height: 28, borderRadius: 'var(--r-xs)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >{g}</motion.button>
              ))}
            </div>
          </TiltCard>

          {/* Battery (3D Tilt Card) */}
          <TiltCard variants={slideUp}
            style={{ flex: 0.6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="eyebrow">BATTERY</span>
              <Battery size={14} color={bCol} style={{ filter: `drop-shadow(0 0 4px ${bGlow})` }} />
            </div>
            <div className="battery-shell">
              <motion.div className="battery-fill"
                animate={{ width: `${battery}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                style={{ background: `linear-gradient(90deg, #34e0e8, ${bCol})`, boxShadow: `0 0 12px ${bGlow}` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="readout" style={{ fontSize: 26 }}><AnimatedValue value={battery} /></span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>%</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="readout" style={{ fontSize: 22, color: '#3d82ff' }}>
                  <AnimatedValue value={range} /> <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>km</span>
                </span>
                <div className="caption" style={{ fontSize: 10 }}>est. range</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--line-1)' }}>
              <Zap size={10} color="#34e0e8" />
              <span className="mono" style={{ fontSize: 10 }}>{engaged ? '12.4' : '0.0'} kW flow</span>
            </div>
          </TiltCard>

          {/* Quick Controls (3D Tilt Card) */}
          <TiltCard variants={slideUp}
            style={{ flex: 0.35, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'center' }}>
            {quickCtrls.map((c) => {
              const Icon = c.icon;
              return (
                <motion.button key={c.key} onClick={c.toggle}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                  animate={{
                    borderColor: c.active ? c.color : 'rgba(255,255,255,0.1)',
                    background: c.active ? c.bg : '#131a24',
                    color: c.active ? c.color : '#5e6b7c',
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ flex: '1 0 45%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 'var(--r-xs)', border: '1px solid', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                ><Icon size={12} />{c.key}</motion.button>
              );
            })}
          </TiltCard>
        </motion.div>

        {/* ─── CENTER ─── */}
        <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {/* Visualizer (3D Tilt Card) */}
          <TiltCard variants={slideUp}
            style={{ flex: 1.5, padding: 0, position: 'relative', overflow: 'hidden' }}>
            <SensorVisualizer engaged={engaged} speed={speed} />
            {/* Animated scan line */}
            <motion.div
              animate={{ top: ['-2%', '102%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(52,224,232,0.12), transparent)', pointerEvents: 'none' }}
            />
          </TiltCard>

          {/* Nav + Media */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 10, flex: 0.45 }}>
            {/* Navigation Card */}
            <TiltCard variants={slideUp}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
              <motion.div
                whileHover={{ scale: 1.08, boxShadow: '0 0 16px rgba(61,130,255,0.3)' }}
                style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', flexShrink: 0, background: 'rgba(61,130,255,0.1)', border: '1px solid rgba(61,130,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d82ff' }}>
                <Navigation size={20} style={{ transform: 'rotate(45deg)' }} />
              </motion.div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="eyebrow" style={{ color: 'var(--blue-bright)', fontSize: 9 }}>NAVIGATION</span>
                <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, margin: '1px 0' }}>In 14.8 km <ChevronRight size={12} color="var(--fg-3)" /></div>
                <span className="caption" style={{ fontSize: 11 }}>Merge onto Route 101 → Volta HQ</span>
              </div>
              <svg width="80" height="50" viewBox="0 0 80 50" style={{ flexShrink: 0, opacity: 0.8 }}>
                <path d="M5 35 Q 35 5, 50 30 T 75 15" fill="none" stroke="var(--obsidian-400)" strokeWidth="4" strokeLinecap="round" />
                <path d="M5 35 Q 35 5, 50 30 T 75 15" fill="none" stroke="#3d82ff" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(61,130,255,0.4))' }} />
                <motion.circle r="3" cx="5" cy="35" fill="#6fa4ff" animate={{ cx: [5, 75], cy: [35, 15] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                <circle cx="75" cy="15" r="3" fill="#34e0e8" />
              </svg>
            </TiltCard>

            {/* Media Card */}
            <TiltCard variants={slideUp}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.div
                  animate={{ rotate: isPlaying ? [0, 360] : 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 36, height: 36, borderRadius: 'var(--r-xs)', flexShrink: 0, background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(168,85,247,0.25)' }}>
                  <Music size={16} color="white" />
                </motion.div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{musicTrack}</span>
                    <MediaVisualizer isPlaying={isPlaying} />
                  </div>
                  <span className="caption" style={{ fontSize: 10 }}>01:42 / 03:55</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <motion.button onClick={() => setIsPlaying(!isPlaying)} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
                  style={{ border: 'none', background: 'none', color: 'var(--fg-1)', display: 'flex', cursor: 'pointer', padding: 0 }}>
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </motion.button>
                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
                  style={{ border: 'none', background: 'none', color: 'var(--fg-3)', display: 'flex', cursor: 'pointer', padding: 0 }}><SkipForward size={12} /></motion.button>
                <div style={{ flex: 1, height: 2, background: 'var(--obsidian-400)', borderRadius: 999, position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: isPlaying ? '100%' : '44%' }}
                    transition={{ duration: isPlaying ? 135 : 0.3 }}
                    style={{ height: '100%', background: '#a855f7', borderRadius: 999, width: '44%' }}
                  />
                </div>
              </div>
            </TiltCard>
          </div>
        </motion.div>

        {/* ─── RIGHT ─── */}
        <motion.div variants={slideUp} style={{ minHeight: 0 }}>
          <VoiceAssistant speed={speed} battery={battery} range={range} engaged={engaged} gear={gear} temp={temp} musicTrack={musicTrack} />
        </motion.div>
      </motion.div>

      {/* ═══ SIMULATOR STRIP ═══ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: simOpen ? 68 : 28 }}
        transition={{ height: { type: 'spring', stiffness: 300, damping: 30 }, y: { delay: 0.3 } }}
        style={{ flexShrink: 0, borderTop: '1px solid var(--line-1)', background: 'var(--obsidian-900)', overflow: 'hidden', padding: simOpen ? '10px 20px' : '4px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: simOpen ? 8 : 0, cursor: 'pointer' }} onClick={() => setSimOpen(!simOpen)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-3)' }}>
            <Sliders size={10} /><span className="eyebrow" style={{ fontSize: 9 }}>COCKPIT SIMULATOR</span><Eye size={10} color="var(--cyan-dim)" />
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
                <span className="mono" style={{ fontSize: 11, width: 42, textAlign: 'right' }}>{speed}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', width: 50, flexShrink: 0 }}>SOC</span>
                <input type="range" min="0" max="100" value={battery} onChange={(e) => handleBattery(+e.target.value)} />
                <span className="mono" style={{ fontSize: 11, width: 42, textAlign: 'right' }}>{battery}%</span>
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
                <span className="mono" style={{ fontSize: 11, width: 42, textAlign: 'right' }}>{temp}°C</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
