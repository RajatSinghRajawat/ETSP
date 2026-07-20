import { Box } from '@mui/material';

/**
 * Decorative animated SVG layer for the hero section.
 * Veterinary-themed: a looping heartbeat / ECG line, floating paw prints,
 * pulsing rings, an orbiting dot and twinkling sparkles.
 * Pure SVG + CSS keyframes — no extra dependencies. Purely decorative.
 */
const HeroAnimation: React.FC = () => {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important' },
        },
      }}
    >
      <svg
        viewBox="0 0 1440 900"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ab6a2" stopOpacity="0" />
            <stop offset="40%" stopColor="#0ab6a2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>

          {/* Reusable paw print */}
          <g id="paw">
            <ellipse cx="0" cy="6" rx="11" ry="9" />
            <ellipse cx="-11" cy="-7" rx="4.2" ry="5.5" />
            <ellipse cx="-3.5" cy="-12" rx="4.2" ry="5.5" />
            <ellipse cx="5" cy="-12" rx="4.2" ry="5.5" />
            <ellipse cx="12" cy="-6" rx="4.2" ry="5.5" />
          </g>

          <style>{`
            @keyframes ecgDraw {
              0%   { stroke-dashoffset: 1200; }
              60%  { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes ringPulse {
              0%   { transform: scale(0.5); opacity: 0.55; }
              80%  { opacity: 0; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            @keyframes pawRise {
              0%   { transform: translateY(0) scale(0.9) rotate(var(--rot,0deg)); opacity: 0; }
              15%  { opacity: 0.7; }
              80%  { opacity: 0.5; }
              100% { transform: translateY(-220px) scale(1.05) rotate(var(--rot,0deg)); opacity: 0; }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.15; transform: scale(0.7); }
              50%      { opacity: 1;    transform: scale(1.2); }
            }
            @keyframes orbit {
              0%   { transform: rotate(0deg) translateX(70px) rotate(0deg); }
              100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
            }
            @keyframes driftSlow {
              0%   { transform: translate(0,0); }
              100% { transform: translate(30px,-25px); }
            }
          `}</style>
        </defs>

        {/* Slow drifting soft grid of constellation lines */}
        <g stroke="rgba(255,255,255,0.10)" strokeWidth="1.2" style={{ animation: 'driftSlow 16s ease-in-out infinite alternate' }}>
          <line x1="180" y1="200" x2="360" y2="120" />
          <line x1="360" y1="120" x2="520" y2="240" />
          <line x1="1120" y1="640" x2="1280" y2="540" />
          <line x1="1280" y1="540" x2="1360" y2="700" />
        </g>

        {/* Pulsing rings */}
        {[
          { cx: 300, cy: 160, r: 60, delay: '0s', color: 'rgba(255,255,255,0.45)' },
          { cx: 1180, cy: 600, r: 80, delay: '1.4s', color: 'rgba(255,215,0,0.45)' },
          { cx: 1300, cy: 180, r: 50, delay: '2.6s', color: 'rgba(10,182,162,0.55)' },
        ].map((ring, i) => (
          <circle
            key={i}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            fill="none"
            stroke={ring.color}
            strokeWidth="2"
            style={{
              transformOrigin: `${ring.cx}px ${ring.cy}px`,
              animation: `ringPulse 3.4s ease-out ${ring.delay} infinite`,
            }}
          />
        ))}

        {/* Heartbeat / ECG line */}
        <g style={{ transform: 'translateY(40px)' }}>
          <path
            d="M -40 460 L 280 460 L 320 460 L 348 390 L 392 540 L 430 300 L 470 600 L 512 460 L 720 460 L 760 460 L 788 400 L 832 520 L 870 330 L 910 560 L 952 460 L 1480 460"
            fill="none"
            stroke="url(#ecgGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1200"
            style={{ animation: 'ecgDraw 4.5s ease-in-out infinite' }}
          />
        </g>

        {/* Orbiting glow dot around a small hub */}
        <g style={{ transform: 'translate(720px, 230px)' }}>
          <circle r="4" fill="rgba(255,255,255,0.6)" />
          <circle
            r="22"
            fill="url(#dotGlow)"
            style={{ transformOrigin: '0px 0px', animation: 'orbit 6s linear infinite' }}
          />
        </g>

        {/* Floating paw prints */}
        {[
          { x: 220, y: 760, scale: 1.1, rot: -12, delay: '0s',   dur: '9s',  fill: 'rgba(255,255,255,0.30)' },
          { x: 520, y: 820, scale: 0.8, rot: 8,   delay: '2.2s', dur: '11s', fill: 'rgba(255,215,0,0.28)' },
          { x: 980, y: 800, scale: 1.0, rot: -6,  delay: '1.1s', dur: '10s', fill: 'rgba(255,255,255,0.26)' },
          { x: 1240, y: 840, scale: 0.7, rot: 14, delay: '3.4s', dur: '12s', fill: 'rgba(10,182,162,0.40)' },
          { x: 740, y: 860, scale: 0.9, rot: 4,   delay: '4.5s', dur: '10.5s', fill: 'rgba(255,255,255,0.22)' },
        ].map((p, i) => (
          <g
            key={i}
            style={{
              // @ts-expect-error custom property for keyframe rotation
              '--rot': `${p.rot}deg`,
              transformOrigin: `${p.x}px ${p.y}px`,
              animation: `pawRise ${p.dur} ease-in ${p.delay} infinite`,
            }}
          >
            <use
              href="#paw"
              fill={p.fill}
              style={{ transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale})` }}
            />
          </g>
        ))}

        {/* Twinkling sparkles */}
        {[
          { cx: 420, cy: 140, r: 3, delay: '0s' },
          { cx: 1100, cy: 220, r: 2.5, delay: '0.6s' },
          { cx: 200, cy: 420, r: 2, delay: '1.2s' },
          { cx: 1320, cy: 420, r: 3, delay: '0.9s' },
          { cx: 640, cy: 120, r: 2.2, delay: '1.8s' },
          { cx: 900, cy: 700, r: 2.6, delay: '2.4s' },
          { cx: 1000, cy: 120, r: 2, delay: '1.5s' },
        ].map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#fff"
            style={{
              transformOrigin: `${s.cx}px ${s.cy}px`,
              animation: `twinkle 2.8s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </svg>
    </Box>
  );
};

export default HeroAnimation;
