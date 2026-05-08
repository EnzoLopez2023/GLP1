// scenes.jsx — All animation scenes for the Lumen GLP1 prototype
// Loaded after animations.jsx; uses globals: Sprite, useTime, useTimeline, useSprite,
// Easing, interpolate, animate, clamp.

const COLORS = {
  bg: '#f5f3ee',
  bgDark: '#0f1419',
  ink: '#0f1419',
  paper: '#ffffff',
  sage: 'oklch(0.72 0.08 155)',
  sageDeep: 'oklch(0.52 0.09 155)',
  sageSoft: 'oklch(0.93 0.04 155)',
  coral: 'oklch(0.68 0.14 35)',
  coralSoft: 'oklch(0.94 0.04 35)',
  muted: '#8a8578',
  line: '#e3dfd6',
  glucose: 'oklch(0.65 0.13 250)',
  weight: 'oklch(0.62 0.12 305)',
  meds: 'oklch(0.68 0.14 35)',
};

const FONTS = {
  display: '"Inter Tight", Inter, system-ui, sans-serif',
  ui: 'Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

// ─── Phone shell helpers ────────────────────────────────────────────
// Centered iPhone-shaped surface (no real status bar — keeps it clean for video)
function PhoneShell({ children, bg = COLORS.bg, dark = false, w = 390, h = 780 }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      width: w, height: h,
      transform: 'translate(-50%, -50%)',
      borderRadius: 54,
      background: bg,
      overflow: 'hidden',
      boxShadow: '0 60px 120px rgba(15,20,25,0.18), 0 0 0 1px rgba(15,20,25,0.06)',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 110, height: 32, borderRadius: 20,
        background: '#0a0d10', zIndex: 100,
      }}/>
      {/* status time */}
      <div style={{
        position: 'absolute', top: 18, left: 32, zIndex: 100,
        fontFamily: FONTS.ui, fontWeight: 600, fontSize: 15,
        color: dark ? '#fff' : COLORS.ink,
      }}>9:41</div>
      {/* status icons */}
      <div style={{
        position: 'absolute', top: 20, right: 32, zIndex: 100,
        display: 'flex', gap: 5, alignItems: 'center',
        color: dark ? '#fff' : COLORS.ink,
      }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <rect x="0" y="6" width="3" height="5" rx="0.6"/>
          <rect x="4.5" y="4" width="3" height="7" rx="0.6"/>
          <rect x="9" y="2" width="3" height="9" rx="0.6"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.6"/>
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.4"/>
          <rect x="2" y="2" width="15" height="7" rx="1.2" fill="currentColor"/>
          <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.4"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%',
        transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3,
        background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(15,20,25,0.3)',
        zIndex: 100,
      }}/>
    </div>
  );
}

// ─── 1. INTRO ANIMATION ────────────────────────────────────────────
// Beat 1 (0–1s): backdrop drifts in, single seed dot appears
// Beat 2 (1–2.5s): dot multiplies into orbital data points around center
// Beat 3 (2.5–4s): points migrate inward and fuse into the Lumen mark (a stylized capsule)
// Beat 4 (4–5.5s): wordmark types/wipes in below; tagline fades up
// Beat 5 (5.5–7s): zoom out reveal — the logo sits on a dashboard tile

function IntroScene() {
  const time = useTime();
  return (
    <>
      {/* Background gradient drift */}
      <Sprite start={0} end={7} keepMounted>
        {({ progress }) => (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(80% 60% at 50% ${50 - progress * 8}%, ${COLORS.sageSoft} 0%, ${COLORS.bg} 60%)`,
          }}/>
        )}
      </Sprite>

      {/* Orbital data points → fuse into capsule */}
      <Sprite start={0.4} end={4.2} keepMounted>
        {({ localTime }) => <OrbitDots t={localTime}/>}
      </Sprite>

      {/* Capsule logo mark */}
      <Sprite start={2.6} end={7} keepMounted>
        {({ localTime }) => <LumenMark t={localTime}/>}
      </Sprite>

      {/* Wordmark */}
      <Sprite start={3.8} end={7} keepMounted>
        {({ localTime }) => <Wordmark t={localTime}/>}
      </Sprite>

      {/* Tagline */}
      <Sprite start={4.6} end={7} keepMounted>
        {({ localTime }) => {
          const o = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
          return (
            <div style={{
              position: 'absolute',
              left: '50%', top: '60%',
              transform: `translate(-50%, ${(1 - o) * 8}px)`,
              opacity: o,
              fontFamily: FONTS.ui, fontSize: 17,
              color: COLORS.muted, letterSpacing: '0.04em',
            }}>
              Reset to baseline. Every week.
            </div>
          );
        }}
      </Sprite>

      {/* Zoom-out reveal: a phone outline drawing in around the logo */}
      <Sprite start={5.5} end={7} keepMounted>
        {({ localTime }) => {
          const t = Easing.easeInOutCubic(clamp(localTime / 1.3, 0, 1));
          // scales and moves the logo into a "tile" — actually we just fade in a phone outline
          const o = t;
          return (
            <div style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(-50%, -50%) scale(${0.94 + 0.06 * t})`,
              opacity: o,
              width: 320, height: 580,
              border: `1.5px solid ${COLORS.line}`,
              borderRadius: 44,
              pointerEvents: 'none',
            }}/>
          );
        }}
      </Sprite>
    </>
  );
}

function OrbitDots({ t }) {
  // 12 dots orbit around center, then collapse inward by t≈3.2s (localTime 2.8)
  const N = 12;
  const dots = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const phaseIn = clamp(t * 1.4 - i * 0.04, 0, 1); // staggered fade-in
    const orbitT = Math.max(0, t - 0.4);
    const collapseStart = 2.0;
    const collapseEnd = 3.0;
    let radius;
    if (t < collapseStart) {
      radius = 80 + 14 * Math.sin(orbitT * 1.4 + i);
    } else if (t < collapseEnd) {
      const ct = Easing.easeInCubic(clamp((t - collapseStart) / (collapseEnd - collapseStart), 0, 1));
      radius = (80 + 14 * Math.sin(orbitT * 1.4 + i)) * (1 - ct);
    } else {
      radius = 0;
    }
    const fadeOut = t > collapseEnd - 0.1 ? clamp(1 - (t - (collapseEnd - 0.1)) / 0.4, 0, 1) : 1;
    const x = Math.cos(angle + orbitT * 0.6) * radius;
    const y = Math.sin(angle + orbitT * 0.6) * radius;
    const op = phaseIn * fadeOut;
    dots.push(
      <div key={i} style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - 4px)`,
        top: `calc(45% + ${y}px - 4px)`,
        width: 8, height: 8, borderRadius: 4,
        background: i % 3 === 0 ? COLORS.coral : COLORS.sageDeep,
        opacity: op,
        boxShadow: `0 0 ${10 * op}px ${i % 3 === 0 ? COLORS.coral : COLORS.sage}`,
      }}/>
    );
  }
  return <>{dots}</>;
}

function LumenMark({ t }) {
  // Capsule mark: two stacked rounded rects merging into a pill
  const appear = Easing.easeOutBack(clamp(t / 0.6, 0, 1));
  const split = clamp((t - 0.6) / 0.5, 0, 1);
  // Inner pulse loop
  const pulse = 1 + 0.04 * Math.sin(t * 3.5);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '45%',
      transform: `translate(-50%, -50%) scale(${appear * pulse})`,
      width: 110, height: 110,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <defs>
          <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLORS.coral}/>
            <stop offset="100%" stopColor={COLORS.sageDeep}/>
          </linearGradient>
        </defs>
        {/* Outer capsule */}
        <rect x="22" y="14" width="66" height="82" rx="33"
              fill="url(#capGrad)"/>
        {/* Splitline */}
        <line x1="22" y1="55" x2="88" y2="55"
              stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"
              strokeDasharray="60" strokeDashoffset={60 - 60 * split}/>
        {/* Inner highlight */}
        <ellipse cx="42" cy="34" rx="10" ry="14" fill="rgba(255,255,255,0.25)"/>
      </svg>
    </div>
  );
}

function Wordmark({ t }) {
  const word = 'tare';
  const perChar = 0.08;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, 0)',
      display: 'flex', gap: 1,
      fontFamily: FONTS.display, fontWeight: 600,
      fontSize: 44, letterSpacing: '-0.04em',
      color: COLORS.ink,
    }}>
      {word.split('').map((c, i) => {
        const local = clamp((t - i * perChar) / 0.4, 0, 1);
        const o = Easing.easeOutCubic(local);
        return (
          <span key={i} style={{
            opacity: o,
            transform: `translateY(${(1 - o) * 14}px)`,
            display: 'inline-block',
          }}>{c}</span>
        );
      })}
    </div>
  );
}

// ─── 2. GRAPH LOAD ANIMATION ────────────────────────────────────────
// Beat 1: skeleton bones fade in (0–0.6s)
// Beat 2: axes draw on (0.6–1.2s)
// Beat 3: data points scatter into place, line traces between them (1.2–3s)
// Beat 4: number ticker counts up + sparkle (3–4.2s)
// Beat 5: hold (4.2–5s)

function GraphLoadScene() {
  return (
    <PhoneShell>
      <GraphPageContent/>
    </PhoneShell>
  );
}

function GraphPageContent() {
  const time = useTime();

  return (
    <>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 70, left: 28,
        fontFamily: FONTS.ui, fontSize: 13,
        color: COLORS.muted, letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>WEIGHT TREND</div>
      <div style={{
        position: 'absolute', top: 92, left: 28,
        fontFamily: FONTS.display, fontSize: 28, fontWeight: 600,
        color: COLORS.ink, letterSpacing: '-0.02em',
      }}>Last 30 days</div>

      {/* Number ticker — large hero number */}
      <Sprite start={3.0} end={5} keepMounted>
        {({ localTime }) => <NumberTicker t={localTime}/>}
      </Sprite>

      {/* Skeleton */}
      <Sprite start={0} end={1.4} keepMounted>
        {({ localTime }) => <Skeleton t={localTime}/>}
      </Sprite>

      {/* Axes */}
      <Sprite start={0.6} end={5} keepMounted>
        {({ localTime }) => <Axes t={localTime}/>}
      </Sprite>

      {/* Line + dots */}
      <Sprite start={1.2} end={5} keepMounted>
        {({ localTime }) => <LineTrace t={localTime}/>}
      </Sprite>

      {/* Caption */}
      <Sprite start={3.6} end={5} keepMounted>
        {({ localTime }) => {
          const o = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));
          return (
            <div style={{
              position: 'absolute', bottom: 80, left: 28, right: 28,
              opacity: o, transform: `translateY(${(1-o)*8}px)`,
              fontFamily: FONTS.ui, fontSize: 14,
              color: COLORS.muted,
            }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                background: COLORS.sage, marginRight: 8,
                verticalAlign: 'middle',
              }}/>
              Down <span style={{ color: COLORS.sageDeep, fontWeight: 600 }}>4.2 lb</span> since this week last month.
            </div>
          );
        }}
      </Sprite>
    </>
  );
}

function Skeleton({ t }) {
  const fade = t < 1.0 ? 1 : clamp(1 - (t - 1.0) / 0.4, 0, 1);
  // shimmer
  const shimmer = (t * 200) % 280;
  return (
    <div style={{
      position: 'absolute', left: 28, right: 28, top: 160,
      height: 240, borderRadius: 18,
      background: COLORS.line,
      opacity: fade * 0.6,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: shimmer - 60, width: 100,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`,
      }}/>
    </div>
  );
}

function Axes({ t }) {
  const draw = Easing.easeOutCubic(clamp(t / 0.6, 0, 1));
  const X0 = 28, Y0 = 160;
  const W = 334, H = 240;
  const labels = ['Apr 7', 'Apr 14', 'Apr 21', 'Apr 28', 'May 5'];
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <svg width="100%" height="100%" viewBox={`0 0 390 780`} style={{ position: 'absolute', inset: 0 }}>
        {/* Horizontal gridlines */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={X0} x2={X0 + W * draw}
                y1={Y0 + (H * (i + 1)) / 4 - 30}
                y2={Y0 + (H * (i + 1)) / 4 - 30}
                stroke={COLORS.line} strokeWidth="1" strokeDasharray="2 4"/>
        ))}
      </svg>
      {/* X labels */}
      <div style={{ position: 'absolute', left: X0, top: Y0 + H - 22, width: W,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted, opacity: clamp((t - 0.4) / 0.4, 0, 1) }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

// Path data: weekly weights, 5 points
const WEIGHTS = [192.4, 191.0, 189.8, 188.5, 188.2];

function LineTrace({ t }) {
  const X0 = 28, Y0 = 160;
  const W = 334, H = 210;
  const xAt = (i) => X0 + (W * i) / (WEIGHTS.length - 1);
  const yAt = (v) => Y0 + H * (1 - (v - 187) / 7);

  // Dots scatter in (0–0.6s), staggered
  // Then line traces (0.6–1.5s)
  const dotIn = (i) => Easing.easeOutBack(clamp((t - i * 0.08) / 0.4, 0, 1));
  const lineProg = Easing.easeInOutCubic(clamp((t - 0.6) / 0.9, 0, 1));

  // Build polyline path up to lineProg
  const totalSegs = WEIGHTS.length - 1;
  const segActive = lineProg * totalSegs;

  let pathD = `M ${xAt(0)} ${yAt(WEIGHTS[0])}`;
  for (let i = 1; i < WEIGHTS.length; i++) {
    if (segActive >= i) {
      pathD += ` L ${xAt(i)} ${yAt(WEIGHTS[i])}`;
    } else if (segActive > i - 1) {
      const seg = segActive - (i - 1);
      const x1 = xAt(i - 1), y1 = yAt(WEIGHTS[i - 1]);
      const x2 = xAt(i), y2 = yAt(WEIGHTS[i]);
      pathD += ` L ${x1 + (x2 - x1) * seg} ${y1 + (y2 - y1) * seg}`;
    }
  }

  // Filled area below line
  const areaD = pathD + ` L ${xAt(Math.min(WEIGHTS.length - 1, Math.floor(segActive)))} ${Y0 + H} L ${xAt(0)} ${Y0 + H} Z`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 390 780`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.sage} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={COLORS.sage} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {lineProg > 0 && (
        <>
          <path d={areaD} fill="url(#areaGrad)" opacity={lineProg}/>
          <path d={pathD} stroke={COLORS.sageDeep} strokeWidth="2.5" fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
        </>
      )}
      {WEIGHTS.map((v, i) => {
        const o = dotIn(i);
        const yJump = (1 - o) * -10; // pop in from above
        return (
          <g key={i} opacity={o}
             transform={`translate(${xAt(i)}, ${yAt(v) + yJump})`}>
            <circle r={6} fill="#fff" stroke={COLORS.sageDeep} strokeWidth="2"/>
          </g>
        );
      })}
    </svg>
  );
}

function NumberTicker({ t }) {
  const target = 188.2;
  const start = 192.4;
  const tt = Easing.easeOutQuart(clamp(t / 1.0, 0, 1));
  const val = start + (target - start) * tt;
  const o = Easing.easeOutCubic(clamp(t / 0.4, 0, 1));
  return (
    <div style={{
      position: 'absolute', top: 124, right: 28,
      opacity: o, transform: `translateY(${(1 - o) * 8}px)`,
      textAlign: 'right',
    }}>
      <div style={{
        fontFamily: FONTS.display, fontSize: 36, fontWeight: 600,
        color: COLORS.ink, letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {val.toFixed(1)}<span style={{ fontSize: 16, color: COLORS.muted, marginLeft: 4 }}>lb</span>
      </div>
    </div>
  );
}

// ─── 3. MEDS PAGE TRANSITION ────────────────────────────────────────
// Concept: a single capsule pill enters from off-screen, settles in the
// hero area, splits in half revealing dose info; a list of upcoming doses
// staggers in below; a checkmark pulses on the most recent dose.

function MedsScene() {
  const time = useTime();
  return (
    <PhoneShell>
      {/* Page label header */}
      <Sprite start={0.2} end={6} keepMounted>
        {({ localTime }) => {
          const o = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));
          return (
            <>
              <div style={{
                position: 'absolute', top: 68, left: 28,
                opacity: o, transform: `translateY(${(1-o)*8}px)`,
                fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>MEDS</div>
              <div style={{
                position: 'absolute', top: 92, left: 28,
                opacity: o, transform: `translateY(${(1-o)*10}px)`,
                fontFamily: FONTS.display, fontSize: 32, fontWeight: 600,
                color: COLORS.ink, letterSpacing: '-0.02em',
              }}>This week</div>
            </>
          );
        }}
      </Sprite>

      {/* Capsule that flies in, then settles/splits */}
      <Sprite start={0.4} end={6} keepMounted>
        {({ localTime }) => <FlyingCapsule t={localTime}/>}
      </Sprite>

      {/* Dose card content (revealed under capsule) */}
      <Sprite start={2.4} end={6} keepMounted>
        {({ localTime }) => <DoseHeroCard t={localTime}/>}
      </Sprite>

      {/* Upcoming dose list */}
      <Sprite start={3.0} end={6} keepMounted>
        {({ localTime }) => <DoseList t={localTime}/>}
      </Sprite>
    </PhoneShell>
  );
}

function FlyingCapsule({ t }) {
  // Phase A 0–1.2: fly in from top-right, rotating and settling
  // Phase B 1.2–2.0: settle into hero area
  // Phase C 2.0–2.6: split open (top half slides up, bottom slides down)
  // Phase D 2.6+: stay split as background of hero card
  const flyT = Easing.easeOutCubic(clamp(t / 1.2, 0, 1));
  const settleT = Easing.easeInOutCubic(clamp((t - 1.2) / 0.8, 0, 1));
  const splitT = Easing.easeInOutCubic(clamp((t - 2.0) / 0.6, 0, 1));

  const startX = 320, startY = -120;
  const endX = 195, endY = 240;
  const x = startX + (endX - startX) * flyT;
  const y = startY + (endY - startY) * flyT;
  const rot = -45 + 45 * flyT + (1 - settleT) * 5;

  // Split offsets
  const splitOff = splitT * 14;

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        left: x, top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
      }}>
        <svg width="180" height="80" viewBox="0 0 180 80">
          <defs>
            <linearGradient id="capA" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.coral}/>
              <stop offset="100%" stopColor="oklch(0.78 0.12 35)"/>
            </linearGradient>
            <linearGradient id="capB" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.97 0.01 35)"/>
              <stop offset="100%" stopColor="oklch(0.92 0.02 35)"/>
            </linearGradient>
          </defs>
          {/* Top half (coral) */}
          <g transform={`translate(${-splitOff}, 0)`}>
            <path d="M 40 0 L 90 0 L 90 80 L 40 80 A 40 40 0 0 1 40 0 Z" fill="url(#capA)"/>
            <ellipse cx="55" cy="22" rx="12" ry="6" fill="rgba(255,255,255,0.25)"/>
          </g>
          {/* Bottom half (cream) */}
          <g transform={`translate(${splitOff}, 0)`}>
            <path d="M 90 0 L 140 0 A 40 40 0 0 1 140 80 L 90 80 Z" fill="url(#capB)" stroke={COLORS.line} strokeWidth="0.5"/>
          </g>
        </svg>
      </div>
    </div>
  );
}

function DoseHeroCard({ t }) {
  const o = Easing.easeOutCubic(clamp(t / 0.5, 0, 1));
  return (
    <div style={{
      position: 'absolute', left: 24, right: 24, top: 168,
      height: 144,
      background: COLORS.coralSoft,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 24,
      padding: '20px 24px',
      opacity: o,
      transform: `translateY(${(1-o)*12}px)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: FONTS.ui, fontSize: 12, color: COLORS.coral,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
        }}>Next dose</div>
        <div style={{
          marginTop: 4,
          fontFamily: FONTS.display, fontSize: 24, fontWeight: 600,
          color: COLORS.ink, letterSpacing: '-0.02em',
        }}>Semaglutide · 1.0 mg</div>
        <div style={{
          fontFamily: FONTS.ui, fontSize: 14, color: COLORS.muted, marginTop: 2,
        }}>Sunday · 8:30 AM · Left thigh</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{
          padding: '8px 16px', borderRadius: 999,
          background: COLORS.ink, color: '#fff', border: 'none',
          fontFamily: FONTS.ui, fontSize: 13, fontWeight: 500,
        }}>Log dose</button>
        <button style={{
          padding: '8px 16px', borderRadius: 999,
          background: 'transparent', color: COLORS.ink,
          border: `1px solid ${COLORS.line}`,
          fontFamily: FONTS.ui, fontSize: 13, fontWeight: 500,
        }}>Snooze</button>
      </div>
    </div>
  );
}

function DoseList({ t }) {
  const items = [
    { date: 'Apr 28', dose: '1.0 mg', site: 'Right thigh', done: true },
    { date: 'Apr 21', dose: '1.0 mg', site: 'Left abdomen', done: true },
    { date: 'Apr 14', dose: '0.5 mg', site: 'Right abdomen', done: true },
    { date: 'Apr 7',  dose: '0.5 mg', site: 'Left thigh', done: true },
  ];
  return (
    <div style={{ position: 'absolute', left: 24, right: 24, top: 340 }}>
      <div style={{
        fontFamily: FONTS.ui, fontSize: 12, color: COLORS.muted,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        fontWeight: 600, marginBottom: 8, padding: '0 4px',
      }}>RECENT</div>
      {items.map((it, i) => {
        const local = clamp((t - i * 0.1) / 0.4, 0, 1);
        const o = Easing.easeOutCubic(local);
        return (
          <div key={i} style={{
            opacity: o,
            transform: `translateX(${(1-o) * 16}px)`,
            display: 'flex', alignItems: 'center',
            padding: '14px 16px',
            borderBottom: i < items.length - 1 ? `1px solid ${COLORS.line}` : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              background: it.done ? COLORS.sageSoft : COLORS.line,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 14,
            }}>
              {it.done && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3 3 7-7" stroke={COLORS.sageDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.ui, fontSize: 15, color: COLORS.ink, fontWeight: 500 }}>{it.dose} · {it.date}</div>
              <div style={{ fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted, marginTop: 1 }}>{it.site}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 4. GLUCOSE PAGE TRANSITION ─────────────────────────────────────
// Concept: a single droplet falls from top, ripples into a circle,
// the circle becomes a "current reading" gauge with the number ticking up,
// then the day's glucose curve traces in below.

function GlucoseScene() {
  return (
    <PhoneShell>
      <Sprite start={0.2} end={6} keepMounted>
        {({ localTime }) => {
          const o = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));
          return (
            <>
              <div style={{
                position: 'absolute', top: 68, left: 28,
                opacity: o, transform: `translateY(${(1-o)*8}px)`,
                fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>GLUCOSE</div>
              <div style={{
                position: 'absolute', top: 92, left: 28,
                opacity: o, transform: `translateY(${(1-o)*10}px)`,
                fontFamily: FONTS.display, fontSize: 32, fontWeight: 600,
                color: COLORS.ink, letterSpacing: '-0.02em',
              }}>Today</div>
            </>
          );
        }}
      </Sprite>

      {/* Falling droplet */}
      <Sprite start={0.5} end={1.8}>
        {({ localTime, duration }) => {
          const t = clamp(localTime / 1.2, 0, 1);
          const y = -40 + (300 - (-40)) * Easing.easeInQuad(t);
          const stretch = 0.8 + 0.5 * Math.sin(t * Math.PI);
          return (
            <div style={{
              position: 'absolute', left: '50%', top: y,
              transform: `translate(-50%, 0) scaleY(${stretch}) scaleX(${2 - stretch})`,
              width: 28, height: 36,
            }}>
              <svg width="28" height="36" viewBox="0 0 28 36">
                <path d="M14 2 C 4 16, 4 30, 14 34 C 24 30, 24 16, 14 2 Z"
                      fill={COLORS.glucose}/>
                <ellipse cx="10" cy="14" rx="3" ry="6" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
          );
        }}
      </Sprite>

      {/* Ripple from impact */}
      <Sprite start={1.5} end={2.6}>
        {({ localTime }) => {
          const t = clamp(localTime / 1.0, 0, 1);
          const r1 = 20 + 80 * Easing.easeOutCubic(t);
          const r2 = 20 + 120 * Easing.easeOutCubic(Math.max(0, t - 0.15));
          const o1 = 1 - t;
          const o2 = Math.max(0, 0.6 - t * 0.6);
          return (
            <svg style={{ position: 'absolute', left: '50%', top: 270, transform: 'translateX(-50%)' }}
                 width="280" height="280" viewBox="-140 -140 280 280">
              <circle cx="0" cy="0" r={r1} fill="none" stroke={COLORS.glucose} strokeWidth="2" opacity={o1}/>
              <circle cx="0" cy="0" r={r2} fill="none" stroke={COLORS.glucose} strokeWidth="1.5" opacity={o2}/>
            </svg>
          );
        }}
      </Sprite>

      {/* Gauge that grows out of impact */}
      <Sprite start={1.9} end={6} keepMounted>
        {({ localTime }) => <GlucoseGauge t={localTime}/>}
      </Sprite>

      {/* Glucose curve */}
      <Sprite start={3.4} end={6} keepMounted>
        {({ localTime }) => <GlucoseCurve t={localTime}/>}
      </Sprite>
    </PhoneShell>
  );
}

function GlucoseGauge({ t }) {
  const grow = Easing.easeOutBack(clamp(t / 0.7, 0, 1));
  const arcT = Easing.easeOutCubic(clamp((t - 0.5) / 1.0, 0, 1));
  const numT = clamp((t - 0.5) / 1.0, 0, 1);
  const val = Math.round(60 + (108 - 60) * Easing.easeOutQuart(numT));

  // Range labels: 70-180 healthy
  const arcStart = -120; // degrees
  const arcEnd = 120;
  const arcSweep = arcEnd - arcStart;
  const valueAngle = arcStart + ((108 - 40) / (200 - 40)) * arcSweep * arcT;

  const cx = 195, cy = 270, R = 86;

  // arc path from arcStart to valueAngle
  const toRad = (d) => (d - 90) * Math.PI / 180;
  const arcPath = (a1, a2) => {
    const x1 = cx + R * Math.cos(toRad(a1));
    const y1 = cy + R * Math.sin(toRad(a1));
    const x2 = cx + R * Math.cos(toRad(a2));
    const y2 = cy + R * Math.sin(toRad(a2));
    const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${grow})`, transformOrigin: '50% 270px' }}>
      <svg width="100%" height="100%" viewBox="0 0 390 780" style={{ position: 'absolute', inset: 0 }}>
        {/* track */}
        <path d={arcPath(arcStart, arcEnd)}
              stroke={COLORS.line} strokeWidth="10" fill="none" strokeLinecap="round"/>
        {/* value arc */}
        <path d={arcPath(arcStart, valueAngle)}
              stroke={COLORS.glucose} strokeWidth="10" fill="none" strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 220,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: FONTS.display, fontSize: 64, fontWeight: 600,
          color: COLORS.ink, letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>
          {val}
        </div>
        <div style={{
          marginTop: 6,
          fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted,
          letterSpacing: '0.04em',
        }}>mg/dL · in range</div>
      </div>
    </div>
  );
}

function GlucoseCurve({ t }) {
  const X0 = 28, Y0 = 430, W = 334, H = 130;
  const pts = [82, 96, 142, 168, 134, 108, 122, 146, 188, 152, 124, 108];
  const xAt = (i) => X0 + (W * i) / (pts.length - 1);
  const yAt = (v) => Y0 + H * (1 - (v - 60) / 160);

  const o = Easing.easeOutCubic(clamp(t / 0.4, 0, 1));
  const drawT = Easing.easeInOutCubic(clamp((t - 0.2) / 1.4, 0, 1));
  const segActive = drawT * (pts.length - 1);

  let pathD = `M ${xAt(0)} ${yAt(pts[0])}`;
  for (let i = 1; i < pts.length; i++) {
    if (segActive >= i) {
      // smooth curve via mid points
      const x1 = xAt(i - 1), y1 = yAt(pts[i - 1]);
      const x2 = xAt(i), y2 = yAt(pts[i]);
      const mx = (x1 + x2) / 2;
      pathD += ` C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    } else if (segActive > i - 1) {
      const seg = segActive - (i - 1);
      const x1 = xAt(i - 1), y1 = yAt(pts[i - 1]);
      const x2 = xAt(i), y2 = yAt(pts[i]);
      const mx = (x1 + x2) / 2;
      const tx = x1 + (x2 - x1) * seg;
      const ty = y1 + (y2 - y1) * seg;
      pathD += ` C ${mx} ${y1}, ${mx} ${ty}, ${tx} ${ty}`;
    }
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 390 780"
         style={{ position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none' }}>
      {/* in-range band */}
      <rect x={X0} y={yAt(180)} width={W} height={yAt(70) - yAt(180)}
            fill={COLORS.glucose} fillOpacity="0.06" rx="6"/>
      <line x1={X0} x2={X0+W} y1={yAt(180)} y2={yAt(180)}
            stroke={COLORS.glucose} strokeOpacity="0.3" strokeDasharray="2 4"/>
      <line x1={X0} x2={X0+W} y1={yAt(70)} y2={yAt(70)}
            stroke={COLORS.glucose} strokeOpacity="0.3" strokeDasharray="2 4"/>
      <path d={pathD} stroke={COLORS.glucose} strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── 5. WEIGHT PAGE TRANSITION ──────────────────────────────────────
// Concept: a "weight scale" platform slides up from bottom; an animated
// dial-needle swings to settle on the current weight; current weight
// number scales in; trend chip slides up from below.

function WeightScene() {
  return (
    <PhoneShell>
      <Sprite start={0.2} end={6} keepMounted>
        {({ localTime }) => {
          const o = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));
          return (
            <>
              <div style={{
                position: 'absolute', top: 68, left: 28,
                opacity: o, transform: `translateY(${(1-o)*8}px)`,
                fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>WEIGHT</div>
              <div style={{
                position: 'absolute', top: 92, left: 28,
                opacity: o, transform: `translateY(${(1-o)*10}px)`,
                fontFamily: FONTS.display, fontSize: 32, fontWeight: 600,
                color: COLORS.ink, letterSpacing: '-0.02em',
              }}>Today</div>
            </>
          );
        }}
      </Sprite>

      {/* Scale slides up */}
      <Sprite start={0.5} end={6} keepMounted>
        {({ localTime }) => <ScaleDial t={localTime}/>}
      </Sprite>

      {/* Big number */}
      <Sprite start={2.4} end={6} keepMounted>
        {({ localTime }) => <WeightNumber t={localTime}/>}
      </Sprite>

      {/* Trend strip + sparkline */}
      <Sprite start={3.2} end={6} keepMounted>
        {({ localTime }) => <TrendStrip t={localTime}/>}
      </Sprite>
    </PhoneShell>
  );
}

function ScaleDial({ t }) {
  // 0–0.8: slide up from bottom
  // 0.8–2.0: needle swings (oscillates and settles)
  const slideT = Easing.easeOutCubic(clamp(t / 0.8, 0, 1));
  const y = 540 - 360 * slideT; // ends at 180

  // Needle
  let angle = -90; // pointing left
  if (t > 0.7) {
    const swingT = clamp((t - 0.7) / 1.6, 0, 1);
    // damped oscillation toward target ~30deg
    const target = 30;
    const damp = Math.exp(-3 * swingT);
    angle = target + Math.sin(swingT * 8) * 60 * damp;
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: y,
      transform: 'translate(-50%, 0)',
    }}>
      <svg width="280" height="200" viewBox="0 0 280 200">
        {/* base */}
        <ellipse cx="140" cy="180" rx="120" ry="10" fill={COLORS.line}/>
        {/* dial */}
        <circle cx="140" cy="100" r="86" fill={COLORS.paper} stroke={COLORS.line} strokeWidth="1"/>
        <circle cx="140" cy="100" r="86" fill="none" stroke={COLORS.weight} strokeOpacity="0.15" strokeWidth="2" strokeDasharray="2 6"/>
        {/* tick marks */}
        {Array.from({length: 21}).map((_, i) => {
          const a = -120 + (240 / 20) * i;
          const r1 = 70, r2 = i % 5 === 0 ? 60 : 66;
          const rad = (a - 90) * Math.PI / 180;
          const x1 = 140 + r1 * Math.cos(rad);
          const y1 = 100 + r1 * Math.sin(rad);
          const x2 = 140 + r2 * Math.cos(rad);
          const y2 = 100 + r2 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.muted} strokeWidth={i % 5 === 0 ? 1.5 : 0.8} opacity={0.6}/>;
        })}
        {/* needle */}
        <g transform={`rotate(${angle} 140 100)`}>
          <line x1="140" y1="100" x2="140" y2="36" stroke={COLORS.weight} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="140" cy="100" r="6" fill={COLORS.weight}/>
        </g>
        {/* center label */}
        <text x="140" y="140" textAnchor="middle"
              fontFamily={FONTS.ui} fontSize="10"
              fill={COLORS.muted} letterSpacing="2">LB</text>
      </svg>
    </div>
  );
}

function WeightNumber({ t }) {
  const o = Easing.easeOutCubic(clamp(t / 0.5, 0, 1));
  const numT = Easing.easeOutQuart(clamp(t / 0.9, 0, 1));
  const val = 192.0 + (188.2 - 192.0) * numT;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 410,
      textAlign: 'center',
      opacity: o,
      transform: `scale(${0.92 + 0.08 * o})`,
    }}>
      <div style={{
        fontFamily: FONTS.display, fontSize: 72, fontWeight: 600,
        color: COLORS.ink, letterSpacing: '-0.04em',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {val.toFixed(1)}
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: FONTS.ui, fontSize: 14, color: COLORS.muted,
      }}>pounds · this morning</div>
    </div>
  );
}

function TrendStrip({ t }) {
  const o = Easing.easeOutCubic(clamp(t / 0.5, 0, 1));
  const sparkT = Easing.easeInOutCubic(clamp((t - 0.3) / 1.0, 0, 1));
  // sparkline pts
  const pts = [192.4, 191.8, 191.0, 190.5, 189.8, 189.2, 188.5, 188.2];
  const W = 120, H = 40;
  const xAt = (i) => (W * i) / (pts.length - 1);
  const yAt = (v) => H * (1 - (v - 187.5) / 5.5);
  const segActive = sparkT * (pts.length - 1);
  let pathD = `M ${xAt(0)} ${yAt(pts[0])}`;
  for (let i = 1; i < pts.length; i++) {
    if (segActive >= i) pathD += ` L ${xAt(i)} ${yAt(pts[i])}`;
    else if (segActive > i - 1) {
      const seg = segActive - (i - 1);
      const x1 = xAt(i - 1), y1 = yAt(pts[i - 1]);
      const x2 = xAt(i), y2 = yAt(pts[i]);
      pathD += ` L ${x1 + (x2 - x1) * seg} ${y1 + (y2 - y1) * seg}`;
    }
  }
  return (
    <div style={{
      position: 'absolute', left: 24, right: 24, top: 552,
      opacity: o, transform: `translateY(${(1-o)*14}px)`,
      background: COLORS.paper,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 20, padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: FONTS.ui, fontSize: 12,
          color: COLORS.muted, letterSpacing: '0.08em',
          textTransform: 'uppercase', fontWeight: 600,
        }}>30-day trend</div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: FONTS.display, fontSize: 24, fontWeight: 600,
            color: COLORS.weight, letterSpacing: '-0.02em',
          }}>−4.2</span>
          <span style={{ fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted }}>lb</span>
        </div>
      </div>
      <svg width={W} height={H + 4}>
        <path d={pathD} stroke={COLORS.weight} strokeWidth="2" fill="none"
              strokeLinecap="round" strokeLinejoin="round"/>
        {sparkT > 0.95 && (
          <circle cx={xAt(pts.length - 1)} cy={yAt(pts[pts.length - 1])}
                  r="3" fill={COLORS.weight}/>
        )}
      </svg>
    </div>
  );
}

// ─── 6. DASHBOARD TRANSITION ────────────────────────────────────────
// Concept: a hub view with stagger-in tiles. Each tile (Meds, Glucose,
// Weight, Steps) animates in with a unique micro-icon.

function DashboardScene() {
  return (
    <PhoneShell>
      <Sprite start={0.2} end={6} keepMounted>
        {({ localTime }) => {
          const o = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));
          return (
            <>
              <div style={{
                position: 'absolute', top: 68, left: 28,
                opacity: o, transform: `translateY(${(1-o)*8}px)`,
                fontFamily: FONTS.ui, fontSize: 13, color: COLORS.muted,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>WEDNESDAY · MAY 7</div>
              <div style={{
                position: 'absolute', top: 92, left: 28,
                opacity: o, transform: `translateY(${(1-o)*10}px)`,
                fontFamily: FONTS.display, fontSize: 32, fontWeight: 600,
                color: COLORS.ink, letterSpacing: '-0.02em',
              }}>Good morning, Sam</div>
            </>
          );
        }}
      </Sprite>

      <Sprite start={0.6} end={6} keepMounted>
        {({ localTime }) => <DashboardTiles t={localTime}/>}
      </Sprite>

      {/* Bottom tab bar */}
      <Sprite start={1.2} end={6} keepMounted>
        {({ localTime }) => <TabBar t={localTime}/>}
      </Sprite>
    </PhoneShell>
  );
}

function DashboardTiles({ t }) {
  const tiles = [
    { id: 'meds', label: 'NEXT DOSE', value: 'Sun 8:30', sub: 'Semaglutide · 1.0 mg', color: COLORS.coral, soft: COLORS.coralSoft },
    { id: 'weight', label: 'WEIGHT', value: '188.2', sub: 'lb · −4.2 this month', color: COLORS.weight, soft: 'oklch(0.95 0.03 305)' },
    { id: 'glucose', label: 'GLUCOSE', value: '108', sub: 'mg/dL · in range', color: COLORS.glucose, soft: 'oklch(0.95 0.03 250)' },
    { id: 'steps', label: 'ACTIVITY', value: '6,420', sub: 'steps · 64% of goal', color: COLORS.sageDeep, soft: COLORS.sageSoft },
  ];

  return (
    <div style={{
      position: 'absolute', left: 24, right: 24, top: 168,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    }}>
      {tiles.map((tile, i) => {
        const local = clamp((t - i * 0.12) / 0.6, 0, 1);
        const o = Easing.easeOutCubic(local);
        const scale = 0.94 + 0.06 * Easing.easeOutBack(local);
        return (
          <div key={tile.id} style={{
            background: tile.soft,
            borderRadius: 22,
            padding: '18px 18px 22px',
            opacity: o,
            transform: `translateY(${(1-o)*16}px) scale(${scale})`,
            transformOrigin: 'center',
            height: 132,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
          }}>
            <TileIcon kind={tile.id} t={local} color={tile.color}/>
            <div>
              <div style={{
                fontFamily: FONTS.ui, fontSize: 11, color: tile.color,
                letterSpacing: '0.1em', fontWeight: 600,
              }}>{tile.label}</div>
              <div style={{
                marginTop: 2,
                fontFamily: FONTS.display, fontSize: 22, fontWeight: 600,
                color: COLORS.ink, letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>{tile.value}</div>
              <div style={{
                marginTop: 1,
                fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted,
              }}>{tile.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TileIcon({ kind, t, color }) {
  // small animated glyph in top-right
  const o = Easing.easeOutCubic(clamp(t * 1.5, 0, 1));
  const wrap = (children) => (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      width: 36, height: 36, borderRadius: 12,
      background: 'rgba(255,255,255,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: o, transform: `scale(${0.7 + 0.3 * o})`,
    }}>{children}</div>
  );

  if (kind === 'meds') {
    return wrap(
      <svg width="22" height="22" viewBox="0 0 22 22">
        <rect x="3" y="7" width="16" height="8" rx="4" fill={color}/>
        <line x1="11" y1="7" x2="11" y2="15" stroke="rgba(255,255,255,0.8)" strokeWidth="1"/>
      </svg>
    );
  }
  if (kind === 'weight') {
    return wrap(
      <svg width="22" height="22" viewBox="0 0 22 22">
        <rect x="3" y="6" width="16" height="11" rx="3" fill="none" stroke={color} strokeWidth="1.6"/>
        <line x1="11" y1="9" x2="11" y2="14" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    );
  }
  if (kind === 'glucose') {
    return wrap(
      <svg width="22" height="22" viewBox="0 0 22 22">
        <path d="M11 3 C 5 11, 5 16, 11 19 C 17 16, 17 11, 11 3 Z" fill={color}/>
      </svg>
    );
  }
  if (kind === 'steps') {
    return wrap(
      <svg width="22" height="22" viewBox="0 0 22 22">
        <ellipse cx="7" cy="9" rx="3" ry="4" fill={color}/>
        <ellipse cx="14" cy="14" rx="3" ry="4" fill={color}/>
      </svg>
    );
  }
  return null;
}

function TabBar({ t }) {
  const o = Easing.easeOutCubic(clamp(t / 0.6, 0, 1));
  const tabs = ['Today', 'Meds', 'Glucose', 'Weight', 'You'];
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 22,
      height: 64, borderRadius: 999,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${COLORS.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      opacity: o, transform: `translateY(${(1-o)*20}px)`,
      boxShadow: '0 8px 24px rgba(15,20,25,0.08)',
    }}>
      {tabs.map((tab, i) => (
        <div key={tab} style={{
          fontFamily: FONTS.ui, fontSize: 11, fontWeight: 600,
          color: i === 0 ? COLORS.ink : COLORS.muted,
          padding: '10px 12px',
          borderRadius: 999,
          background: i === 0 ? COLORS.bg : 'transparent',
          letterSpacing: '0.02em',
        }}>{tab}</div>
      ))}
    </div>
  );
}

Object.assign(window, {
  COLORS, FONTS,
  IntroScene, GraphLoadScene, MedsScene, GlucoseScene, WeightScene, DashboardScene,
});
