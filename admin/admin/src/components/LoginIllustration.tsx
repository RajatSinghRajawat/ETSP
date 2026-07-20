import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Animated "sign in to your computer" illustration.
 * A laptop showing a login screen: the email/password fields get "typed",
 * a cursor blinks, a padlock locks, and a success check appears — then the
 * whole scene gently floats. Driven entirely by GSAP.
 */
export default function LoginIllustration() {
  const rootRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      // Respect reduced-motion preferences.
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      // Initial states
      gsap.set(q('.scene'), { transformOrigin: '50% 50%' });
      gsap.set(q('.laptop'), { opacity: 0, y: 30, scale: 0.9, transformOrigin: '50% 60%' });
      gsap.set(q('.avatar'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
      gsap.set(q('.field-email-fill'), { scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(q('.dot'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
      gsap.set(q('.signin-btn'), { opacity: 0, y: 8 });
      gsap.set(q('.cursor'), { opacity: 0 });
      gsap.set(q('.lock-shackle'), { y: -10, transformOrigin: '50% 100%' });
      gsap.set(q('.lock-group'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
      gsap.set(q('.check'), { strokeDasharray: 40, strokeDashoffset: 40, opacity: 0 });
      gsap.set(q('.envelope'), { opacity: 0, x: 60, y: -20, scale: 0.6 });
      gsap.set(q('.spark'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' });

      if (prefersReduced) {
        gsap.set(
          q('.laptop, .avatar, .signin-btn, .lock-group, .dot, .envelope'),
          { opacity: 1, scale: 1, x: 0, y: 0 }
        );
        gsap.set(q('.field-email-fill'), { scaleX: 1 });
        gsap.set(q('.check'), { strokeDashoffset: 0, opacity: 1 });
        return;
      }

      // Continuous ambient motion
      gsap.to(q('.blob-1'), {
        y: 18, x: 10, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
      gsap.to(q('.blob-2'), {
        y: -22, x: -8, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
      gsap.to(q('.blob-3'), {
        rotation: 360, duration: 40, repeat: -1, ease: 'none', transformOrigin: '50% 50%',
      });
      q('.particle').forEach((p, i) => {
        gsap.to(p, {
          y: i % 2 === 0 ? -16 : 16,
          duration: 3 + (i % 4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3,
        });
      });

      // Blinking cursor (independent loop)
      gsap.to(q('.cursor'), {
        opacity: 1, duration: 0.45, repeat: -1, yoyo: true,
        ease: 'steps(1)', delay: 1.2,
      });

      // Master entrance + "typing" timeline
      const tl = gsap.timeline({ delay: 0.2 });

      tl.to(q('.laptop'), {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)',
      })
        .to(q('.avatar'), {
          opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)',
        }, '-=0.2')
        // Type the email field
        .to(q('.field-email-fill'), {
          scaleX: 1, duration: 0.9, ease: 'steps(12)',
        }, '+=0.1')
        // Type the password (dots pop in one by one)
        .to(q('.dot'), {
          opacity: 1, scale: 1, duration: 0.18, stagger: 0.13, ease: 'back.out(3)',
        }, '+=0.15')
        .to(q('.signin-btn'), {
          opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
        }, '+=0.1')
        // Padlock appears and locks
        .to(q('.lock-group'), {
          opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)',
        }, '-=0.2')
        .to(q('.lock-shackle'), {
          y: 0, duration: 0.4, ease: 'bounce.out',
        })
        // Success check draws in
        .to(q('.check'), {
          opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: 'power2.out',
        }, '+=0.1')
        .to(q('.spark'), {
          opacity: 1, scale: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(3)',
        }, '-=0.3')
        .to(q('.spark'), {
          opacity: 0, scale: 1.6, duration: 0.5, stagger: 0.05, ease: 'power1.out',
        }, '+=0.1')
        // Envelope flies in (OTP delivered)
        .to(q('.envelope'), {
          opacity: 1, x: 0, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)',
        }, '-=0.6');

      // Gentle perpetual float for the whole scene once assembled
      tl.add(() => {
        gsap.to(q('.scene'), {
          y: -10, duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut',
        });
        gsap.to(q('.signin-btn'), {
          scale: 1.04, duration: 1, repeat: -1, yoyo: true,
          ease: 'sine.inOut', transformOrigin: '50% 50%',
        });
        gsap.to(q('.envelope'), {
          y: -8, rotation: 3, duration: 2.4, repeat: -1, yoyo: true,
          ease: 'sine.inOut', transformOrigin: '50% 50%',
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 600 560"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '560px', overflow: 'visible' }}
      role="img"
      aria-label="Animated illustration of signing in to the admin console"
    >
      <defs>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c5283" />
          <stop offset="100%" stopColor="#0ab6a2" />
        </linearGradient>
        <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0c5283" />
          <stop offset="100%" stopColor="#0ab6a2" />
        </linearGradient>
        <linearGradient id="lockGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1ec19a" />
          <stop offset="100%" stopColor="#0ab6a2" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#062944" floodOpacity="0.28" />
        </filter>
        <filter id="lockShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#054e46" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Ambient decorative shapes */}
      <circle className="blob-1" cx="110" cy="120" r="70" fill="rgba(255,255,255,0.08)" />
      <circle className="blob-2" cx="500" cy="420" r="90" fill="rgba(255,255,255,0.06)" />
      <g className="blob-3" opacity="0.18">
        <path
          d="M520 90 l14 26 28 6 -20 20 5 28 -27 -13 -27 13 5 -28 -20 -20 28 -6z"
          fill="rgba(255,255,255,0.5)"
        />
      </g>

      {/* Floating particles */}
      <circle className="particle" cx="80" cy="320" r="6" fill="rgba(255,255,255,0.55)" />
      <circle className="particle" cx="540" cy="180" r="5" fill="rgba(255,255,255,0.45)" />
      <circle className="particle" cx="150" cy="470" r="4" fill="rgba(255,255,255,0.4)" />
      <circle className="particle" cx="470" cy="500" r="7" fill="rgba(255,255,255,0.35)" />
      <circle className="particle" cx="60" cy="220" r="4" fill="rgba(255,255,255,0.4)" />

      <g className="scene">
        {/* Laptop */}
        <g className="laptop" filter="url(#softShadow)">
          {/* Screen body */}
          <rect x="140" y="120" width="320" height="220" rx="18" fill="#0b2236" />
          <rect x="152" y="132" width="296" height="196" rx="12" fill="#0f2c45" />

          {/* Login card on the screen */}
          <rect x="200" y="156" width="200" height="148" rx="14" fill="#ffffff" />

          {/* Avatar */}
          <g className="avatar">
            <circle cx="300" cy="186" r="20" fill="url(#screenGrad)" />
            <circle cx="300" cy="180" r="7" fill="#ffffff" />
            <path d="M288 198 a12 9 0 0 1 24 0 z" fill="#ffffff" />
          </g>

          {/* Email field */}
          <rect x="224" y="220" width="152" height="20" rx="10" fill="#eef3f7" />
          <rect
            className="field-email-fill"
            x="224" y="220" width="152" height="20" rx="10"
            fill="#cfe9ff"
          />
          <circle cx="236" cy="230" r="4" fill="#0c5283" />

          {/* Password field with dots + blinking cursor */}
          <rect x="224" y="248" width="152" height="20" rx="10" fill="#eef3f7" />
          <circle className="dot" cx="240" cy="258" r="3.4" fill="#0c5283" />
          <circle className="dot" cx="252" cy="258" r="3.4" fill="#0c5283" />
          <circle className="dot" cx="264" cy="258" r="3.4" fill="#0c5283" />
          <circle className="dot" cx="276" cy="258" r="3.4" fill="#0c5283" />
          <circle className="dot" cx="288" cy="258" r="3.4" fill="#0c5283" />
          <circle className="dot" cx="300" cy="258" r="3.4" fill="#0c5283" />
          <rect className="cursor" x="308" y="251" width="2" height="14" rx="1" fill="#0c5283" />

          {/* Sign-in button */}
          <rect
            className="signin-btn"
            x="224" y="278" width="152" height="14" rx="7"
            fill="url(#btnGrad)"
          />

          {/* Laptop base */}
          <path d="M120 340 h360 l24 26 h-408 z" fill="#15324a" />
          <rect x="262" y="340" width="76" height="8" rx="4" fill="#0b2236" />
        </g>

        {/* Padlock with success check */}
        <g className="lock-group" filter="url(#lockShadow)">
          <path
            className="lock-shackle"
            d="M455 150 v-14 a26 26 0 0 1 52 0 v14"
            fill="none" stroke="#089482" strokeWidth="11" strokeLinecap="round"
          />
          <rect x="438" y="150" width="86" height="74" rx="16" fill="url(#lockGrad)" />
          <path
            className="check"
            d="M463 188 l12 12 22 -24"
            fill="none" stroke="#ffffff" strokeWidth="7"
            strokeLinecap="round" strokeLinejoin="round"
          />
          {/* success sparks */}
          <circle className="spark" cx="430" cy="160" r="4" fill="#bff3e7" />
          <circle className="spark" cx="532" cy="170" r="4" fill="#bff3e7" />
          <circle className="spark" cx="440" cy="232" r="3" fill="#cfe9ff" />
          <circle className="spark" cx="524" cy="228" r="3" fill="#cfe9ff" />
        </g>

        {/* Envelope (OTP delivered) */}
        <g className="envelope">
          <rect x="120" y="380" width="96" height="68" rx="10" fill="#ffffff" />
          <path
            d="M120 388 l48 34 48 -34"
            fill="none" stroke="#0c5283" strokeWidth="5" strokeLinejoin="round"
          />
          <circle cx="206" cy="384" r="13" fill="#0ab6a2" />
          <text
            x="206" y="389" textAnchor="middle"
            fontSize="14" fontWeight="700" fill="#ffffff"
            fontFamily="Inter, sans-serif"
          >
            ✓
          </text>
        </g>
      </g>
    </svg>
  );
}
