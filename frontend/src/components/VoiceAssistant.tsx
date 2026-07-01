import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PowerOff, ShieldAlert, Volume2, Wifi, WifiOff } from 'lucide-react';
import { AudioRecorder } from '../utils/audioRecorder';
import { AudioPlayer } from '../utils/audioPlayer';

interface TranscriptItem {
  speaker: 'Genie' | 'System' | 'You';
  text: string;
}

interface VoiceAssistantProps {
  speed: number;
  battery: number;
  range: number;
  engaged: boolean;
  gear: string;
  temp: number;
  musicTrack: string;
}

// ═════════════════════════════════════════════════════════════════════
// 3D Tilt Card wrapper (localized for VoiceAssistant panel portability)
// ═════════════════════════════════════════════════════════════════════
interface TiltCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

function TiltCard({ children, style }: TiltCardProps) {
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
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
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
// Gooey Morphing Assistant Orb
// ═════════════════════════════════════════════════════════════════════
function GooeyOrb({ status }: { status: 'idle' | 'connecting' | 'listening' | 'speaking' | 'ready' }) {
  const colors = {
    idle: ['#178c91', '#131a24', '#0d1219'],
    connecting: ['#ffb224', '#ff5470', '#131a24'],
    ready: ['#34e0e8', '#3d82ff', '#131a24'],
    listening: ['#2fd79b', '#1c8a63', '#131a24'],
    speaking: ['#34e0e8', '#6cf3f8', '#3d82ff'],
  }[status];

  return (
    <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* SVG Gooey Filter definitions */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Gooey container */}
      <div style={{ filter: 'url(#gooey-filter)', width: 72, height: 72, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Core Center Blob */}
        <motion.div
          animate={{
            scale: status === 'speaking' ? [1, 1.15, 0.95, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: status === 'speaking' ? 0.45 : 3.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${colors[0]}, ${colors[1]})`,
            position: 'absolute',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
          }}
        />

        {/* Satellite Blob 1 */}
        <motion.div
          animate={{
            x: status === 'listening' ? [0, 8, -6, 0] : status === 'speaking' ? [0, 12, -10, 0] : [0, 6, -6, 0],
            y: status === 'listening' ? [0, -6, 8, 0] : status === 'speaking' ? [0, -10, 12, 0] : [0, -6, 6, 0],
            scale: status === 'speaking' ? [0.9, 1.15, 0.85, 0.9] : [0.9, 1.02, 0.88, 0.9],
          }}
          transition={{
            duration: status === 'speaking' ? 0.55 : status === 'listening' ? 1.0 : 4.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: colors[1],
            position: 'absolute',
          }}
        />

        {/* Satellite Blob 2 */}
        <motion.div
          animate={{
            x: status === 'listening' ? [0, -8, 6, 0] : status === 'speaking' ? [0, -12, 10, 0] : [0, -6, 6, 0],
            y: status === 'listening' ? [0, 8, -6, 0] : status === 'speaking' ? [0, 10, -12, 0] : [0, 6, -6, 0],
            scale: status === 'speaking' ? [0.8, 1.1, 0.9, 0.8] : [0.8, 0.95, 0.85, 0.8],
          }}
          transition={{
            duration: status === 'speaking' ? 0.5 : status === 'listening' ? 0.9 : 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: colors[2],
            position: 'absolute',
          }}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Active dialogue response visualizer
// ═════════════════════════════════════════════════════════════════════
function ActiveWaveform({ status }: { status: 'idle' | 'connecting' | 'listening' | 'speaking' | 'ready' }) {
  if (status !== 'speaking' && status !== 'listening') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: status === 'speaking' ? [3, 14, 3] : [3, 8, 3],
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.06,
          }}
          style={{
            width: 2,
            backgroundColor: status === 'listening' ? 'var(--green)' : 'var(--cyan)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// VoiceAssistant Component
// ═════════════════════════════════════════════════════════════════════
export function VoiceAssistant({
  speed, battery, range, engaged, gear, temp, musicTrack,
}: VoiceAssistantProps) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'ready'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('genie-transcript') || '[]'); }
    catch { return []; }
  });
  const [genieText, setGenieText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Persist the dialog log so it survives reloads / turn changes.
  useEffect(() => {
    try { localStorage.setItem('genie-transcript', JSON.stringify(transcript.slice(-40))); }
    catch { /* storage full / unavailable — ignore */ }
  }, [transcript]);

  const ws = useRef<WebSocket | null>(null);
  const audioRecorder = useRef<AudioRecorder | null>(null);
  const audioPlayer = useRef<AudioPlayer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentGenieText = useRef('');
  const screenInterval = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    audioPlayer.current = new AudioPlayer(24000);
    return () => {
      // Release microphone lock, stop intervals, and close sockets on unmount (HMR friendly!)
      disconnectGenie();
      audioPlayer.current?.close();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, genieText]);

  const telemetryRef = useRef({ speed, battery, range, engaged, gear, temp, musicTrack });
  useEffect(() => {
    telemetryRef.current = { speed, battery, range, engaged, gear, temp, musicTrack };
  }, [speed, battery, range, engaged, gear, temp, musicTrack]);

  // ─── Canvas Drawing (a faithful mirror of the ELD dashboard Genie "sees") ───
  const drawTelemetryCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const t = telemetryRef.current;
    const W = canvas.width;

    // Background
    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, 0, W, canvas.height);

    const panel = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#0d1219';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    };
    const label = (text: string, x: number, y: number) => {
      ctx.fillStyle = '#9ba8b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(text, x, y);
    };

    // ── Header ──
    ctx.fillStyle = '#34e0e8';
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.fillText('ELD DRIVER DASHBOARD', 20, 28);
    ctx.fillStyle = '#eaf1f7';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('Michael Turner  ·  TRK-214', 20, 50);
    ctx.fillStyle = '#2fd79b';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('● DRIVING', W - 105, 28);
    ctx.fillStyle = '#9ba8b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Route:  Toronto → Chicago', 20, 70);

    // ── Vehicle status tiles ──
    const fuelCol = t.battery > 25 ? '#2fd79b' : t.battery > 12 ? '#ffb224' : '#ff5470';
    const tiles: { label: string; val: string; unit?: string; color: string; big: boolean }[] = [
      { label: 'SPEED', val: String(t.speed), unit: 'mph', color: '#34e0e8', big: true },
      { label: 'FUEL', val: `${t.battery}%`, color: fuelCol, big: true },
      { label: 'ENGINE', val: 'NORMAL', color: '#2fd79b', big: false },
      { label: 'BATTERY', val: '14.2V', color: '#2fd79b', big: false },
    ];
    const tw = 127, tg = 10, ty = 84, th = 78;
    tiles.forEach((tl, i) => {
      const x = 20 + i * (tw + tg);
      panel(x, ty, tw, th);
      label(tl.label, x + 12, ty + 22);
      ctx.fillStyle = tl.color;
      ctx.font = `600 ${tl.big ? 34 : 24}px "Space Grotesk", sans-serif`;
      ctx.fillText(tl.val, x + 12, ty + 60);
      if (tl.unit) {
        const vw = ctx.measureText(tl.val).width;
        ctx.fillStyle = '#5e6b7c';
        ctx.font = '13px sans-serif';
        ctx.fillText(tl.unit, x + 16 + vw, ty + 60);
      }
    });

    // ── Hours of Service ──
    ctx.fillStyle = '#34e0e8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('HOURS OF SERVICE', 20, 190);
    const hos = [
      { l: 'DRIVING', v: '6h 42m' }, { l: 'ON DUTY', v: '8h 15m' },
      { l: 'BREAK DUE', v: '1h 18m' }, { l: 'CYCLE LEFT', v: '21h 40m' },
    ];
    panel(20, 200, W - 40, 62);
    hos.forEach((h, i) => {
      const x = 34 + i * ((W - 68) / 4);
      label(h.l, x, 222);
      ctx.fillStyle = '#eaf1f7';
      ctx.font = '600 22px "Space Grotesk", sans-serif';
      ctx.fillText(h.v, x, 250);
    });

    // ── Active Alerts ──
    ctx.fillStyle = '#ff5470';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ACTIVE ALERTS  (4)', 20, 288);
    const alerts = [
      'Break required in 1h 18m',
      'Pre-trip inspection pending for next shift',
      'Low tire pressure — trailer axle 2',
      'Weigh station ahead in 18 mi',
    ];
    ctx.font = '13px sans-serif';
    alerts.forEach((a, i) => {
      const y = 308 + i * 21;
      ctx.fillStyle = '#ffb224';
      ctx.fillText('▲', 24, y);
      ctx.fillStyle = '#c8d2dc';
      ctx.fillText(a, 42, y);
    });

    // ── Footer status strip (live context) ──
    panel(20, 400, W - 40, 26);
    ctx.fillStyle = '#5e6b7c';
    ctx.font = '11px monospace';
    ctx.fillText(
      `GEAR ${t.gear}  ·  ADAS ${t.engaged ? 'ON' : 'STANDBY'}  ·  CABIN ${t.temp}°C  ·  NEXT WAYPOINT 18mi (Detroit)  ·  GENIE LIVE`,
      30, 417,
    );
  };

  const sendScreenFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    drawTelemetryCanvas();
    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    ws.current.send(JSON.stringify({
      realtimeInput: { video: { mimeType: 'image/jpeg', data: base64 } },
    }));
  };

  // Push a fresh frame the instant the screen changes (debounced), so Genie sees
  // the live dashboard in near real-time instead of waiting for the heartbeat tick.
  useEffect(() => {
    if (!connected) return;
    const id = window.setTimeout(() => sendScreenFrame(), 200);
    return () => window.clearTimeout(id);
  }, [speed, battery, range, engaged, gear, temp, musicTrack, connected]);

  // Commit the in-progress Genie reply to the dialog log, then clear the buffer.
  const flushGenie = (suffix = '') => {
    const text = currentGenieText.current.trim();
    if (text) {
      setTranscript(p => [...p.slice(-40), { speaker: 'Genie', text: text + suffix }]);
    }
    currentGenieText.current = '';
    setGenieText('');
  };

  // ─── WebSocket Connection ───────────────────────────────────────
  const connectGenie = () => {
    if (connected) return;
    setStatus('connecting');
    setErrorMsg('');
    setGenieText('');

    // Synchronously initialize the audio player context on user gesture
    audioPlayer.current?.init();

    // Synchronously initialize the audio recorder context on user gesture
    if (!audioRecorder.current) {
      const handleChunk = (b64: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: b64 } },
          }));
        }
      };
      audioRecorder.current = new AudioRecorder(handleChunk);
    }
    audioRecorder.current.init();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws-live`);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setStatus('ready');
      setErrorMsg('');
      sendScreenFrame();
      // Heartbeat frame so the model always has a recent view even when idle.
      screenInterval.current = window.setInterval(sendScreenFrame, 1000);
      if (!isMuted) startRecording();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) { setErrorMsg(data.error); disconnectGenie(); return; }
        if (data.serverContent) {
          // Driver speech transcript (native STT). Arrives as a complete message,
          // so we commit it straight to the dialog log as a "You" entry.
          if (data.serverContent.inputTranscription?.text) {
            const userText = data.serverContent.inputTranscription.text.trim();
            // Flush any pending Genie reply first (covers transcript that streamed
            // in AFTER turnComplete and would otherwise be overwritten by this turn).
            flushGenie();
            if (userText) {
              setTranscript(p => [...p.slice(-40), { speaker: 'You', text: userText }]);
            }
          }
          // Genie speech transcript (native STT of the audio reply). Streams word-by-word.
          if (data.serverContent.outputTranscription?.text) {
            currentGenieText.current += data.serverContent.outputTranscription.text;
            setGenieText(currentGenieText.current);
          }
          if (data.serverContent.interrupted) {
            audioPlayer.current?.stop();
            setStatus('listening');
            flushGenie('…');
          }
          if (data.serverContent.modelTurn) {
            setStatus('speaking');
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.inlineData) audioPlayer.current?.playChunk(part.inlineData.data);
              if (part.text) { currentGenieText.current += part.text; setGenieText(currentGenieText.current); }
            }
          }
          if (data.serverContent.turnComplete) {
            setStatus('ready');
            flushGenie();
          }
        }
      } catch (_e) { /* ignore parse errors */ }
    };

    socket.onerror = () => { setErrorMsg('Cannot reach Genie backend. Is the server running?'); disconnectGenie(); };
    socket.onclose = () => { disconnectGenie(); };
  };

  const disconnectGenie = () => {
    setConnected(false);
    setStatus('idle');
    stopRecording();
    audioPlayer.current?.stop();
    if (screenInterval.current) { clearInterval(screenInterval.current); screenInterval.current = null; }
    if (ws.current) { if (ws.current.readyState === WebSocket.OPEN) ws.current.close(); ws.current = null; }
  };

  // ─── Audio Recording ───────────────────────────────────────────
  const startRecording = async () => {
    setStatus('listening');
    if (!audioRecorder.current) {
      const handleChunk = (b64: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: b64 } },
          }));
        }
      };
      audioRecorder.current = new AudioRecorder(handleChunk);
      audioRecorder.current.init();
    }
    try { await audioRecorder.current.start(); }
    catch (err) {
      console.error('[VoiceAssistant] startRecording failed:', err);
      setIsMuted(true);
      setStatus('ready');
      setErrorMsg('Microphone startup failed. Please check console logs or permissions.');
    }
  };

  const stopRecording = () => { audioRecorder.current?.stop(); audioRecorder.current = null; };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (connected) { if (next) { stopRecording(); setStatus('ready'); } else startRecording(); }
  };

  // ─── Status config ─────────────────────────────────────────────
  const statusColor = { idle: 'var(--fg-3)', connecting: 'var(--amber)', ready: 'var(--fg-3)', listening: 'var(--green)', speaking: 'var(--cyan)' }[status];
  const statusText = { idle: 'OFFLINE', connecting: 'CONNECTING…', ready: 'STANDBY', listening: 'LISTENING', speaking: 'SPEAKING' }[status];

  return (
    <TiltCard style={{ height: '100%' }}>
      <canvas ref={canvasRef} width={580} height={440} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span className="eyebrow" style={{ fontSize: 9 }}>COCKPIT COMPANION</span>
          <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-display)', marginTop: 1 }}>
            Genie
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={handleToggleMute} style={{
            width: 32, height: 32, borderRadius: 'var(--r-xs)',
            border: `1px solid ${isMuted ? 'var(--red-dim)' : 'var(--line-2)'}`,
            background: isMuted ? 'rgba(255,84,112,0.08)' : 'var(--obsidian-600)',
            color: isMuted ? 'var(--red)' : 'var(--fg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'all var(--dur-fast) ease',
          }}>
            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <button onClick={connected ? disconnectGenie : connectGenie} style={{
            height: 32, borderRadius: 'var(--r-xs)', padding: '0 12px',
            border: `1px solid ${connected ? 'var(--cyan-dim)' : 'var(--line-2)'}`,
            background: connected ? 'rgba(52,224,232,0.08)' : 'var(--obsidian-600)',
            color: connected ? 'var(--cyan)' : 'var(--fg-2)',
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            transition: 'all var(--dur-fast) ease',
          }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'ONLINE' : 'CONNECT'}
          </button>
        </div>
      </div>

      {/* Orb Area */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '12px 0 10px', borderBottom: '1px solid var(--line-1)',
      }}>
        {/* Genie Orb with orbital ring */}
        <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Animated orbital ring with dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: status === 'speaking' ? 3.5 : status === 'listening' ? 5 : 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 82,
              height: 82,
              borderRadius: '50%',
              border: `1px dashed ${status === 'listening' ? 'rgba(47,215,155,0.22)' : 'rgba(52,224,232,0.15)'}`,
              pointerEvents: 'none',
            }}
          >
            {/* Orbital orbiting dots */}
            <div
              style={{
                position: 'absolute',
                top: -3,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: status === 'listening' ? 'var(--green)' : 'var(--cyan)',
                boxShadow: `0 0 6px ${status === 'listening' ? 'var(--green)' : 'var(--cyan)'}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -3,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: status === 'listening' ? 'var(--green)' : 'var(--cyan)',
                boxShadow: `0 0 6px ${status === 'listening' ? 'var(--green)' : 'var(--cyan)'}`,
              }}
            />
          </motion.div>

          <GooeyOrb status={status} />

          {/* Overlaid status icon */}
          <div style={{ position: 'absolute', zIndex: 5, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {connected ? (
              status === 'listening' ? (
                <Mic size={20} color="var(--fg-inverse)" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }} />
              ) : (
                <Volume2 size={20} color="var(--fg-1)" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }} />
              )
            ) : (
              <PowerOff size={20} color="var(--fg-3)" />
            )}
          </div>
        </div>

        {/* Status text & Active Waveform */}
        <div style={{ marginTop: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 16 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: statusColor }}>
              {statusText}
            </div>
            <ActiveWaveform status={status} />
          </div>
          <div style={{
            marginTop: 1, color: 'var(--fg-3)', fontSize: 11, fontStyle: 'italic',
            maxWidth: 260, minHeight: 30,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {genieText || (connected
              ? (isMuted ? 'Mic muted. Tap to unmute.' : 'Ask about speed, battery, obstacles…')
              : 'Connect to summon your cockpit Jarvis.')}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 10, minHeight: 0 }}>
        <span className="eyebrow" style={{ fontSize: 9, color: 'var(--fg-3)', marginBottom: 6 }}>DIALOG LOG</span>

        {errorMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
            background: 'rgba(255,84,112,0.06)', border: '1px solid rgba(255,84,112,0.15)',
            borderRadius: 'var(--r-xs)', padding: '5px 8px', color: 'var(--red)', fontSize: 10,
          }}>
            <ShieldAlert size={12} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          background: 'var(--obsidian-900)', borderRadius: 'var(--r-sm)',
          border: '1px solid var(--line-1)', padding: 8,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {transcript.length === 0 && !genieText ? (
            <div style={{ color: 'var(--fg-3)', fontSize: 11, textAlign: 'center', margin: 'auto' }}>
              No cockpit dialog yet
            </div>
          ) : (
            transcript.map((item, i) => {
              const isUser = item.speaker === 'You';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <span className="mono" style={{ fontSize: 8, color: isUser ? 'var(--green-dim)' : 'var(--cyan-dim)', marginBottom: 1 }}>
                    {item.speaker.toUpperCase()}
                  </span>
                  <span style={{
                    background: isUser ? 'rgba(47,215,155,0.06)' : 'var(--obsidian-700)',
                    border: `1px solid ${isUser ? 'rgba(47,215,155,0.15)' : 'var(--line-1)'}`,
                    borderRadius: 'var(--r-xs)', padding: '4px 8px',
                    fontSize: 11, color: 'var(--fg-1)', maxWidth: '92%', wordBreak: 'break-word', lineHeight: 1.4,
                  }}>{item.text}</span>
                </div>
              );
            })
          )}

          {/* Live, in-progress Genie transcription (streams word-by-word, small font) */}
          {genieText && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="mono" style={{ fontSize: 8, color: 'var(--cyan-dim)', marginBottom: 1 }}>
                GENIE
              </span>
              <span style={{
                background: 'var(--obsidian-700)', border: '1px dashed var(--cyan-dim)',
                borderRadius: 'var(--r-xs)', padding: '4px 8px',
                fontSize: 10, color: 'var(--fg-2)', fontStyle: 'italic',
                maxWidth: '92%', wordBreak: 'break-word', lineHeight: 1.4,
              }}>{genieText}<span style={{ opacity: 0.6 }}>▍</span></span>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </TiltCard>
  );
}
