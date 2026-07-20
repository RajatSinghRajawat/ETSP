import { Box } from '@mui/material';

/**
 * Decorative animated SVG layer for the login page's left promo panel.
 * Veterinary-themed: a looping heartbeat / ECG pulse, floating paw prints,
 * pulsing rings, an orbiting glow and twinkling sparkles.
 * Pure SVG + CSS keyframes — no extra dependencies. Purely decorative.
 */
const LoginAnimation: React.FC = () => {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.4,
        pointerEvents: 'none',
        overflow: 'hidden',
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important' },
        },
      }}
    >
      <svg
        viewBox="0 0 600 900"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="loginEcgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="loginDotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Reusable paw print */}
          <g id="loginPaw">
            <ellipse cx="0" cy="6" rx="11" ry="9" />
            <ellipse cx="-11" cy="-7" rx="4.2" ry="5.5" />
            <ellipse cx="-3.5" cy="-12" rx="4.2" ry="5.5" />
            <ellipse cx="5" cy="-12" rx="4.2" ry="5.5" />
            <ellipse cx="12" cy="-6" rx="4.2" ry="5.5" />
          </g>

          <style>{`
            @keyframes loginEcgDraw {
              0%   { stroke-dashoffset: 900; }
              60%  { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes loginRingPulse {
              0%   { transform: scale(0.5); opacity: 0.5; }
              80%  { opacity: 0; }
              100% { transform: scale(1.7); opacity: 0; }
            }
            @keyframes loginPawRise {
              0%   { transform: translateY(0) scale(0.9) rotate(var(--rot,0deg)); opacity: 0; }
              15%  { opacity: 0.6; }
              80%  { opacity: 0.45; }
              100% { transform: translateY(-260px) scale(1.05) rotate(var(--rot,0deg)); opacity: 0; }
            }
            @keyframes loginTwinkle {
              0%, 100% { opacity: 0.15; transform: scale(0.7); }
              50%      { opacity: 1;    transform: scale(1.2); }
            }
            @keyframes loginOrbit {
              0%   { transform: rotate(0deg) translateX(60px) rotate(0deg); }
              100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
            }
          `}</style>
        </defs>

        {/* Pulsing rings */}
        {[
          { cx: 120, cy: 180, r: 55, delay: '0s', color: 'rgba(255,255,255,0.40)' },
          { cx: 470, cy: 660, r: 80, delay: '1.4s', color: 'rgba(255,215,0,0.40)' },
          { cx: 500, cy: 200, r: 45, delay: '2.6s', color: 'rgba(255,255,255,0.45)' },
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
              animation: `loginRingPulse 3.6s ease-out ${ring.delay} infinite`,
            }}
          />
        ))}

        {/* Heartbeat / ECG line */}
        <path
          d="M -20 470 L 120 470 L 150 470 L 176 405 L 220 550 L 258 310 L 298 600 L 340 470 L 620 470"
          fill="none"
          stroke="url(#loginEcgGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="900"
          style={{ animation: 'loginEcgDraw 4.5s ease-in-out infinite' }}
        />

        {/* Orbiting glow dot */}
        <g style={{ transform: 'translate(300px, 320px)' }}>
          <circle r="3.5" fill="rgba(255,255,255,0.6)" />
          <circle
            r="18"
            fill="url(#loginDotGlow)"
            style={{ transformOrigin: '0px 0px', animation: 'loginOrbit 6s linear infinite' }}
          />
        </g>

        {/* Floating paw prints */}
        {[
          { x: 90, y: 820, scale: 1.1, rot: -12, delay: '0s', dur: '10s', fill: 'rgba(255,255,255,0.26)' },
          { x: 250, y: 880, scale: 0.8, rot: 8, delay: '2.4s', dur: '12s', fill: 'rgba(255,215,0,0.30)' },
          { x: 420, y: 850, scale: 1.0, rot: -6, delay: '1.2s', dur: '11s', fill: 'rgba(255,255,255,0.22)' },
          { x: 540, y: 890, scale: 0.7, rot: 14, delay: '3.6s', dur: '13s', fill: 'rgba(255,255,255,0.20)' },
        ].map((p, i) => (
          <g
            key={i}
            style={{
              // @ts-expect-error custom property for keyframe rotation
              '--rot': `${p.rot}deg`,
              transformOrigin: `${p.x}px ${p.y}px`,
              animation: `loginPawRise ${p.dur} ease-in ${p.delay} infinite`,
            }}
          >
            <use
              href="#loginPaw"
              fill={p.fill}
              style={{ transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale})` }}
            />
          </g>
        ))}

        {/* Twinkling sparkles */}
        {[
          { cx: 200, cy: 120, r: 3, delay: '0s' },
          { cx: 480, cy: 320, r: 2.5, delay: '0.6s' },
          { cx: 90, cy: 460, r: 2, delay: '1.2s' },
          { cx: 540, cy: 480, r: 3, delay: '0.9s' },
          { cx: 360, cy: 140, r: 2.2, delay: '1.8s' },
          { cx: 150, cy: 640, r: 2.6, delay: '2.4s' },
        ].map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#fff"
            style={{
              transformOrigin: `${s.cx}px ${s.cy}px`,
              animation: `loginTwinkle 2.8s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </svg>
    </Box>
  );
};

export default LoginAnimation;
