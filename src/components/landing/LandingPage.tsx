"use client";

import {
  useEffect, useRef, useState, useCallback, useMemo
} from "react";
import Image from "next/image";
import {
  motion, useScroll, useTransform, useInView,
  AnimatePresence, useMotionValue, useSpring,
  useMotionTemplate, useMotionValueEvent, type MotionValue, type TargetAndTransition,
} from "framer-motion";
import Link from "next/link";
import {
  Download, Keyboard, SquareDashedMousePointer, Sparkles, ScanText,
  ListOrdered, UsersRound, Network, MessageSquareText, History,
  Code2, GraduationCap, Mail, PenTool, Star, ArrowRight, ArrowUp,
  Check, X, Lightbulb, Layers, Languages, RefreshCw, MousePointerClick, Eye,
  HelpCircle, Reply, FileText, WandSparkles, SpellCheck, GitPullRequest, Bug, Wrench, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { LanguageProvider, useLang, useT, type Lang } from "@/lib/landing-i18n";

// Brand
const IND = "#6366f1";
const IND_BRIGHT = "#818cf8";
const SPARK = "#fbbf24";        // amber "aha" spark accent
const SPARK_BRIGHT = "#fcd34d";
const BG = "#080810";

// Wordmark: "Snap" (white) + "Aha" (amber spark)
function Wordmark({ size = 14 }: { size?: number }) {
  return (
    <span className="font-bold text-white" style={{ fontSize: size, letterSpacing: "-0.4px" }}>
      Snap
      <span style={{
        background: `linear-gradient(135deg, ${SPARK_BRIGHT} 0%, ${SPARK} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>Aha</span>
    </span>
  );
}

// Film-grain overlay (premium texture, barely-there)
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] mix-blend-overlay"
      style={{
        opacity: 0.04,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

// Reading-progress bar: a thin gradient line that tracks scroll. A quiet
// premium cue that the page is a guided journey, not an endless wall.
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[70] origin-left"
      style={{
        height: 2.5,
        scaleX,
        background: `linear-gradient(90deg, ${IND} 0%, #8b5cf6 55%, ${SPARK} 100%)`,
        boxShadow: "0 0 12px rgba(99,102,241,0.6)",
      }}
    />
  );
}

// Signature "scan" sheen: a light streak sweeps once through a heading as it
// enters view, echoing the hero's highlight gesture. Repeating this motif on
// every section turns the whole page into one coherent "snap then understand"
// story, which is what makes a brand stick (consistency + repetition).
function ShimmerText({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-90px" });
  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      style={{
        ...style,
        backgroundImage: `linear-gradient(110deg, #fff 0%, #fff 38%, ${IND_BRIGHT} 50%, #fff 62%, #fff 100%)`,
        backgroundSize: "260% auto",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}
      initial={{ backgroundPosition: "0% center" }}
      animate={inView ? { backgroundPosition: "-165% center" } : {}}
      transition={{ duration: 1.15, ease: "easeInOut", delay: 0.15 }}
    >
      {children}
    </motion.span>
  );
}

// Consistent, animated section eyebrow. The pulsing dot gives every section
// the same calm heartbeat, which builds familiarity as the user scrolls.
function SectionEyebrow({ children, center = true }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex mb-5 ${center ? "justify-center" : ""}`}>
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: IND_BRIGHT, letterSpacing: "0.14em" }}
      >
        <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: IND_BRIGHT, boxShadow: `0 0 8px ${IND_BRIGHT}` }}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }} />
        {children}
      </motion.span>
    </div>
  );
}

// Cursor glow — two-layer: large ambient halo + tight bright core.
// The core makes the effect feel physically present; the halo tints the scene.
function CursorGlow() {
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const xs = useSpring(x, { stiffness: 120, damping: 22 });
  const ys = useSpring(y, { stiffness: 120, damping: 22 });
  const bgAmbient = useMotionTemplate`radial-gradient(900px circle at ${xs}px ${ys}px, rgba(99,102,241,0.10), transparent 45%)`;
  const bgCore    = useMotionTemplate`radial-gradient(160px circle at ${xs}px ${ys}px, rgba(139,92,246,0.18), transparent 70%)`;
  useEffect(() => {
    const h = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, [x, y]);
  return (
    <>
      <motion.div className="pointer-events-none fixed inset-0 z-30" style={{ background: bgAmbient }} />
      <motion.div className="pointer-events-none fixed inset-0 z-30" style={{ background: bgCore }} />
    </>
  );
}

// Global parallax star-field + shooting stars.
// Stars drift at 0.08× scroll speed (barely perceptible = feels "premium").
// Shooting stars fire randomly on a staggered loop.
function StarField() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 6000], [0, -480]);
  const stars = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: (i * 79 + 13) % 100,
      top: (i * 67 + 7) % 100,
      size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.4,
      opBase: 0.08 + (i % 6) * 0.05,
      dur: 3.5 + (i % 7) * 1.3,
      delay: i * 0.14,
    })),
    []
  );
  const shooters = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      startX: 8 + i * 15,
      startY: 3 + (i % 3) * 10,
      angle: -25 - (i % 3) * 5,
      length: 100 + i * 20,
      dur: 0.7 + i * 0.08,
      repeatDelay: 5 + i * 3.5,
      delay: i * 2.2 + 0.5,
    })),
    []
  );
  return (
    <motion.div className="pointer-events-none fixed inset-0 z-[5]" style={{ y }} aria-hidden>
      {stars.map((s) => (
        <motion.div key={s.id} className="absolute rounded-full"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, background: "rgba(255,255,255,0.95)" }}
          animate={{ opacity: [s.opBase * 0.4, s.opBase * 2.2, s.opBase * 0.4] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}
      {shooters.map((s) => (
        <motion.div key={`sh${s.id}`}
          style={{
            position: "absolute", left: `${s.startX}%`, top: `${s.startY}%`,
            width: s.length, height: 1.5,
            background: "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(129,140,248,0.6), transparent)",
            transform: `rotate(${s.angle}deg)`, transformOrigin: "left center", borderRadius: 2,
          }}
          initial={{ opacity: 0, scaleX: 0, x: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 0], x: [0, s.length * 1.5] }}
          transition={{ duration: s.dur, repeat: Infinity, repeatDelay: s.repeatDelay, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

// Aurora background orbs (accepts an optional parallax MotionValue)
function Aurora({ y }: { y?: MotionValue<number> }) {
  const orbs = useMemo(() => [
    { color: "rgba(99,102,241,0.16)", w: 700, h: 700, x: ["-30%", "10%", "-20%"], y: ["-20%", "25%", "-20%"], dur: 22 },
    { color: "rgba(139,92,246,0.10)", w: 500, h: 500, x: ["60%", "30%", "60%"], y: ["10%", "40%", "10%"], dur: 28 },
    { color: "rgba(59,130,246,0.08)", w: 600, h: 600, x: ["20%", "55%", "20%"], y: ["50%", "10%", "50%"], dur: 35 },
  ], []);

  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={y ? { y } : undefined}>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: o.w,
            height: o.h,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
          animate={{ x: o.x, y: o.y }}
          transition={{ duration: o.dur, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        />
      ))}
    </motion.div>
  );
}

// Particle field (optional parallax MotionValue)
function Particles({ count = 40, y }: { count?: number; y?: MotionValue<number> }) {
  const ps = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      dur: Math.random() * 15 + 10,
      delay: Math.random() * 8,
      opMax: Math.random() * 0.35 + 0.1,
    })),
    [count]
  );
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={y ? { y } : undefined}>
      {ps.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: IND_BRIGHT }}
          animate={{ opacity: [0, p.opMax, 0], y: [0, -30, -60], scale: [1, 1.2, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

// Perspective floor grid — converging SVG lines give the hero an infinite
// 3D-space feel. Single highest-impact visual element on the page.
function PerspectiveGrid({ yOffset }: { yOffset: MotionValue<number> }) {
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y: yOffset }} aria-hidden>
      <motion.svg
        viewBox="0 0 1440 900"
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "68%" }}
        preserveAspectRatio="xMidYMax slice"
        animate={{ opacity: [0.13, 0.21, 0.13] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="pgFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={IND} stopOpacity="0" />
            <stop offset="38%" stopColor={IND} stopOpacity="0.75" />
            <stop offset="100%" stopColor={IND} stopOpacity="0.18" />
          </linearGradient>
        </defs>
        {/* Radial lines only — clean vanishing-point rays, no horizontal clutter */}
        {Array.from({ length: 28 }, (_, i) => {
          const xBase = (i / 27) * 1440;
          return <line key={`pv${i}`} x1={xBase} y1={900} x2={720} y2={0} stroke="url(#pgFade)" strokeWidth={i === 13 || i === 14 ? 0.9 : 0.45} />;
        })}
      </motion.svg>
    </motion.div>
  );
}

// 3D floating geometry — diamond, ring, hexagon, cross shapes at different
// parallax depths. Each has its own rotation and float animation.
function FloatingGeometry({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -170]);
  const yMid  = useTransform(scrollYProgress, [0, 1], [0, -95]);
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const rot1  = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rot2  = useTransform(scrollYProgress, [0, 1], [0, -90]);

  const shapes = useMemo(() => [
    { id: 0, yMv: "fast", rotMv: "r1", pos: { right: "7%",  top: "18%" }, size: 90,  color: IND,       type: "diamond", floatAmt: 14, floatDur: 6.2 },
    { id: 1, yMv: "mid",  rotMv: "r2", pos: { left:  "6%",  top: "44%" }, size: 66,  color: "#8b5cf6",  type: "ring",    floatAmt: 10, floatDur: 7.8 },
    { id: 2, yMv: "slow", rotMv: "r1", pos: { left:  "17%", top: "21%" }, size: 38,  color: SPARK,      type: "diamond", floatAmt: 7,  floatDur: 5.1 },
    { id: 3, yMv: "mid",  rotMv: "r2", pos: { right: "17%", top: "62%" }, size: 56,  color: IND_BRIGHT, type: "hex",     floatAmt: 11, floatDur: 7.3 },
    { id: 4, yMv: "fast", rotMv: "r1", pos: { right: "36%", top: "79%" }, size: 28,  color: IND_BRIGHT, type: "ring",    floatAmt: 6,  floatDur: 4.6 },
    { id: 5, yMv: "slow", rotMv: "r2", pos: { left:  "41%", top: "11%" }, size: 44,  color: "#8b5cf6",  type: "cross",   floatAmt: 9,  floatDur: 6.8 },
    { id: 6, yMv: "mid",  rotMv: "r1", pos: { left:  "3%",  top: "75%" }, size: 52,  color: IND,        type: "hex",     floatAmt: 8,  floatDur: 8.1 },
    { id: 7, yMv: "fast", rotMv: "r2", pos: { right: "5%",  top: "38%" }, size: 34,  color: SPARK,      type: "diamond", floatAmt: 12, floatDur: 5.5 },
  ], []);

  const yMap = { fast: yFast, mid: yMid, slow: ySlow };
  const rMap = { r1: rot1, r2: rot2 };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ perspective: "1200px" }} aria-hidden>
      {shapes.map((s) => (
        <motion.div key={s.id}
          style={{ position: "absolute", ...s.pos, y: yMap[s.yMv as keyof typeof yMap], rotate: rMap[s.rotMv as keyof typeof rMap], willChange: "transform", transformStyle: "preserve-3d" }}>
          <motion.div
            animate={{ y: [0, -s.floatAmt, 0], rotateX: [0, 12, 0, -8, 0], rotateZ: [0, 3, 0, -3, 0] }}
            transition={{ duration: s.floatDur, repeat: Infinity, ease: "easeInOut", delay: s.id * 0.55 }}
            style={{ transformStyle: "preserve-3d" }}>
            {s.type === "diamond" && (
              <motion.div
                style={{ width: s.size, height: s.size, border: `1.5px solid ${s.color}55`, background: `linear-gradient(135deg, ${s.color}12 0%, transparent 60%)`, transform: "rotate(45deg)" }}
                animate={{ boxShadow: [`0 0 ${s.size * 0.3}px ${s.color}20`, `0 0 ${s.size * 0.75}px ${s.color}58`, `0 0 ${s.size * 0.3}px ${s.color}20`] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: s.id * 0.4 }}
              />
            )}
            {s.type === "ring" && (
              <motion.div
                style={{ width: s.size, height: s.size, borderRadius: "50%", border: `1.5px solid ${s.color}50` }}
                animate={{ boxShadow: [`0 0 ${s.size * 0.4}px ${s.color}15`, `0 0 ${s.size * 0.9}px ${s.color}52`, `0 0 ${s.size * 0.4}px ${s.color}15`] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: s.id * 0.3 }}
              />
            )}
            {s.type === "hex" && (
              <svg width={s.size} height={s.size} viewBox="0 0 100 100">
                <motion.polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke={s.color} strokeWidth="1.5"
                  animate={{ strokeOpacity: [0.22, 0.72, 0.22], filter: [`drop-shadow(0 0 4px ${s.color}25)`, `drop-shadow(0 0 14px ${s.color}65)`, `drop-shadow(0 0 4px ${s.color}25)`] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: s.id * 0.35 }}
                />
              </svg>
            )}
            {s.type === "cross" && (
              <svg width={s.size} height={s.size} viewBox="0 0 100 100">
                <motion.line x1="50" y1="8" x2="50" y2="92" stroke={s.color} strokeWidth="1.5"
                  animate={{ strokeOpacity: [0.18, 0.68, 0.18] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
                <motion.line x1="8" y1="50" x2="92" y2="50" stroke={s.color} strokeWidth="1.5"
                  animate={{ strokeOpacity: [0.18, 0.68, 0.18] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
              </svg>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}


// Scroll-to-top button — appears after first scroll, springs back to top.
function ScrollToTop() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setVisible(v > 400));
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed z-[80] bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${IND} 0%, #7c3aed 100%)`, boxShadow: "0 0 28px rgba(99,102,241,0.6)", border: "1px solid rgba(129,140,248,0.35)" }}
          whileHover={{ scale: 1.14, boxShadow: "0 0 44px rgba(99,102,241,0.85)" }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll to top"
        >
          <ArrowUp size={17} color="white" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Multi-layer parallax background — self-contained (absolute inset-0, so it tracks
// its parent section's scroll naturally). Drop it as the first child of any
// `relative overflow-hidden` section to get instant 3D depth.
function ParallaxBg({
  orb1Color = "rgba(99,102,241,0.18)",
  orb2Color = "rgba(139,92,246,0.12)",
  orb3Color = "rgba(59,130,246,0.09)",
  particleCount = 11,
  showRings = false,
  showBeams = false,
}: {
  orb1Color?: string;
  orb2Color?: string;
  orb3Color?: string;
  particleCount?: number;
  showRings?: boolean;
  showBeams?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y1 = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["-22%", "22%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["-36%", "36%"]);
  const x1 = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  const rot = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const sc  = useTransform(scrollYProgress, [0, 0.5, 1], [0.82, 1.12, 0.82]);

  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      px: 5 + (i * 83 + 17) % 90,
      py: 5 + (i * 67 + 11) % 90,
      size: 1.5 + (i % 3 === 0 ? 2 : 1),
      dur: 3.5 + (i % 5) * 1.3,
      delay: i * 0.65,
    })),
    [particleCount]
  );
  const beamData = useMemo(
    () => Array.from({ length: 3 }, (_, i) => ({
      id: i, left: 15 + i * 32,
      skew: i % 2 === 0 ? -14 : 14,
      color: [IND, "#8b5cf6", IND_BRIGHT][i],
      dur: 4 + i * 1.2, delay: i * 1.8,
    })),
    []
  );

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Deep slow orb — top-left */}
      <motion.div style={{ y: y1, x: x1, position: "absolute", width: 960, height: 960, left: "-28%", top: "-35%", borderRadius: "50%", background: `radial-gradient(circle, ${orb1Color} 0%, transparent 62%)`, filter: "blur(120px)", willChange: "transform" }} />
      {/* Mid orb — right */}
      <motion.div style={{ y: y2, x: x2, position: "absolute", width: 640, height: 640, right: "-14%", top: "0%", borderRadius: "50%", background: `radial-gradient(circle, ${orb2Color} 0%, transparent 68%)`, filter: "blur(90px)", willChange: "transform" }} />
      {/* Fast fg orb — bottom-left */}
      <motion.div style={{ y: y3, position: "absolute", width: 520, height: 520, left: "3%", bottom: "-20%", borderRadius: "50%", background: `radial-gradient(circle, ${orb3Color} 0%, transparent 70%)`, filter: "blur(75px)", willChange: "transform" }} />
      {/* Fourth orb — bottom-right for balance */}
      <motion.div style={{ y: y2, x: x1, position: "absolute", width: 400, height: 400, right: "-8%", bottom: "-10%", borderRadius: "50%", background: `radial-gradient(circle, ${orb1Color} 0%, transparent 65%)`, filter: "blur(70px)", willChange: "transform" }} />
      {/* Rotating decorative ring */}
      <motion.div style={{ y: y2, rotate: rot, scale: sc, position: "absolute", width: 360, height: 360, right: "16%", bottom: "10%", borderRadius: "50%", border: "1px solid rgba(99,102,241,0.14)", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%)", willChange: "transform" }} />
      {/* Smaller depth ring */}
      <motion.div style={{ y: y1, rotate: rot, position: "absolute", width: 220, height: 220, left: "28%", top: "12%", borderRadius: "50%", border: "1px solid rgba(139,92,246,0.1)", willChange: "transform" }} />
      {showRings && (
        <motion.div style={{ y: y2 }} className="absolute inset-0 flex items-center justify-center">
          <div style={{ position: "relative", width: 580, height: 580 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(99,102,241,0.09)" }} />
            <div style={{ position: "absolute", inset: "14%", borderRadius: "50%", border: "1px solid rgba(139,92,246,0.07)" }} />
            <div style={{ position: "absolute", inset: "29%", borderRadius: "50%", border: "1px solid rgba(99,102,241,0.05)" }} />
          </div>
        </motion.div>
      )}
      <motion.div style={{ y: y3 }} className="absolute inset-0">
        {particles.map((p) => (
          <motion.div key={p.id} className="absolute rounded-full"
            style={{ left: `${p.px}%`, top: `${p.py}%`, width: p.size, height: p.size, background: IND_BRIGHT }}
            animate={{ opacity: [0.05, 0.65, 0.05], y: [0, -32, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Magnetic button
function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xS = useSpring(x, { stiffness: 350, damping: 25 });
  const yS = useSpring(y, { stiffness: 350, damping: 25 });

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  }, [x, y, strength]);

  const handleLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div ref={ref} style={{ x: xS, y: yS, display: "inline-block" }}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </motion.div>
  );
}

// Premium CTA gloss: a light streak periodically sweeps across the button.
// Movement on an idle primary button draws the eye back to the one action.
function Shine() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0 w-1/3 -skew-x-12"
      style={{ background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.4), transparent)" }}
      initial={{ left: "-45%" }}
      animate={{ left: ["-45%", "150%"] }}
      transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" }}
    />
  );
}

// Spotlight card
function SpotlightCard({ children, className = "", style = {}, whileHover }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; whileHover?: TargetAndTransition;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bg = useMotionTemplate`radial-gradient(280px circle at ${mx}px ${my}px, rgba(99,102,241,0.12), transparent)`;

  return (
    <motion.div
      className={className}
      style={style}
      whileHover={whileHover}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
    >
      <motion.div
        style={{
          background: bg,
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

// 3-D tilt card
function TiltCard({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxS = useSpring(rx, { stiffness: 400, damping: 30 });
  const ryS = useSpring(ry, { stiffness: 400, damping: 30 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    ry.set(nx * 20);
    rx.set(-ny * 20);
  };

  // Dynamic z-depth shadow that follows the tilt — sells the 3D lift
  const shadowX = useTransform(ryS, [-20, 20], [-18, 18]);
  const shadowY = useTransform(rxS, [-20, 20], [18, -18]);
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)`;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX: rxS, rotateY: ryS, transformPerspective: 700, boxShadow }}
      onMouseMove={handleMove}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      whileHover={{ scale: 1.03, z: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

// Language toggle (segmented EN / VI pill)
function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  const opts: { id: Lang; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "vi", label: "VI" },
  ];
  return (
    <div
      className="relative flex items-center p-0.5 rounded-full"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      role="group"
      aria-label="Language"
    >
      {opts.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setLang(o.id)}
            className="relative z-10 rounded-full font-bold transition-colors"
            style={{
              padding: compact ? "4px 9px" : "5px 11px",
              fontSize: compact ? 10 : 11,
              letterSpacing: "0.3px",
              color: active ? "#fff" : "rgba(255,255,255,0.5)",
            }}
            aria-pressed={active}
          >
            {active && (
              <motion.span
                layoutId={compact ? "langpill-compact" : "langpill"}
                className="absolute inset-0 rounded-full -z-10"
                style={{ background: IND, boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Avatar stack (social proof)
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#a78bfa)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#ec4899,#f472b6)",
  "linear-gradient(135deg,#3b82f6,#60a5fa)",
];
function AvatarStack() {
  return (
    <div className="flex items-center">
      {AVATAR_GRADIENTS.map((g, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.9 + i * 0.06, type: "spring", stiffness: 320 }}
          className="rounded-full"
          style={{
            width: 26, height: 26, background: g,
            border: "2px solid #080810",
            marginLeft: i === 0 ? 0 : -9,
            zIndex: AVATAR_GRADIENTS.length - i,
          }}
        />
      ))}
    </div>
  );
}

function Stars({ size = 13 }: { size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, j) => (
        <Star key={j} size={size} fill={SPARK} stroke={SPARK} strokeWidth={1} />
      ))}
    </div>
  );
}

//
// GRAPHICS-FIRST MICRO-ANIMATIONS
// The product is communicated by motion, not paragraphs. Each loops
// forever so a "lazy reader" understands the whole flow at a glance.
//

// Problem → solution as a wordless "speed race": the old way crawls,
// SnapAha zips. The fill-speed contrast is the whole argument.
function SpeedRace() {
  const t = useT();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const rows = [
    { label: t.problem.without, time: t.problem.withoutTime, color: "#f87171", track: "rgba(239,68,68,0.1)", fill: "linear-gradient(90deg,#ef4444,#fb7185)", dur: 3.4, ease: "linear" as const, icon: <X size={15} color="#f87171" />, to: "94%" },
    { label: t.problem.withApp, time: t.problem.withTime, color: IND_BRIGHT, track: "rgba(99,102,241,0.1)", fill: `linear-gradient(90deg,${IND},#8b5cf6)`, dur: 0.7, ease: [0.22, 1, 0.36, 1] as const, icon: <Check size={15} color={IND_BRIGHT} strokeWidth={3} />, to: "100%" },
  ];
  return (
    <div ref={ref} className="max-w-2xl mx-auto space-y-7">
      {rows.map((r, i) => (
        <Fade key={i} delay={i * 0.12}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: r.color, letterSpacing: "0.04em" }}>
              {r.icon} {r.label}
            </span>
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{r.time}</span>
          </div>
          <div className="h-3.5 rounded-full overflow-hidden" style={{ background: r.track, border: "1px solid rgba(255,255,255,0.05)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: r.fill, boxShadow: i === 1 ? "0 0 20px rgba(99,102,241,0.5)" : "none" }}
              initial={{ width: 0 }}
              animate={inView ? { width: r.to } : {}}
              transition={{ duration: r.dur, ease: r.ease, delay: 0.25 }} />
          </div>
        </Fade>
      ))}
    </div>
  );
}

// Hero value-flow: 3 glowing pictograms + a light that travels the path.
// Communicates the entire product wordlessly in ~2 seconds.
const FLOW_ICONS: LucideIcon[] = [Eye, SquareDashedMousePointer, Sparkles];
function HeroFlow() {
  const t = useT();
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {t.hero.flow.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5 sm:gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + i * 0.12 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className="rounded-2xl flex items-center justify-center"
              style={{ width: 46, height: 46, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.28)" }}
              animate={{
                boxShadow: ["0 0 0 rgba(99,102,241,0)", "0 0 26px rgba(99,102,241,0.45)", "0 0 0 rgba(99,102,241,0)"],
                borderColor: ["rgba(99,102,241,0.28)", "rgba(129,140,248,0.7)", "rgba(99,102,241,0.28)"],
              }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
            >
              {(() => { const Ic = FLOW_ICONS[i]; return <Ic size={20} color={i === 2 ? SPARK : IND_BRIGHT} strokeWidth={1.8} />; })()}
            </motion.div>
            <span className="text-[11px] sm:text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "-0.2px" }}>{label}</span>
          </motion.div>
          {i < 2 && (
            <div className="relative h-px w-7 sm:w-14 mb-5" style={{ background: "rgba(99,102,241,0.25)" }}>
              <motion.div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ background: IND_BRIGHT, boxShadow: `0 0 10px ${IND_BRIGHT}` }}
                animate={{ left: ["-4px", "100%"], opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Always-on hero device mock (used when no gallery media exists), a
// self-playing loop of: read a doc → snap selection → aha answer.
function MiniFlowMock() {
  const t = useT();
  const [p, setP] = useState(0); // 0 idle · 1 selecting · 2 answer
  useEffect(() => {
    const id = setInterval(() => setP((x) => (x + 1) % 3), 1800);
    return () => clearInterval(id);
  }, []);
  const showSel = p >= 1;
  const showAns = p === 2;
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        aspectRatio: "16 / 10",
        background: "linear-gradient(160deg,#0d1117 0%,#0a0d13 100%)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px rgba(99,102,241,0.15)",
      }}>
      {/* chrome */}
      <div className="flex items-center gap-2 px-4 h-9"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        <span className="ml-3 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.demo.windowApp}</span>
      </div>
      {/* doc */}
      <div className="relative px-6 py-5" style={{ height: "calc(100% - 36px)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em" }}>4.2 · Cell biology</p>
        {t.demo.code.slice(0, 4).map((line, i) => (
          <div key={i} className="leading-relaxed" style={{ fontSize: "clamp(12px,1.8vw,15px)", color: i < 2 ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.36)" }}>{line}</div>
        ))}
        <AnimatePresence>
          {showSel && (
            <motion.div initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute rounded-md"
              style={{ left: 18, right: 18, top: 44, height: 56, border: `1.5px solid ${IND_BRIGHT}`, background: "rgba(99,102,241,0.12)", boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}>
              <span className="absolute -top-2 -left-1 w-2 h-2 rounded-full" style={{ background: IND_BRIGHT }} />
              <span className="absolute -bottom-2 -right-1 w-2 h-2 rounded-full" style={{ background: IND_BRIGHT }} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {p < 2 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-2 rounded-xl"
              style={{ bottom: 16, background: "rgba(12,12,22,0.92)", border: "1px solid rgba(99,102,241,0.4)", boxShadow: "0 0 30px rgba(99,102,241,0.35)" }}>
              <Keyboard size={15} color={IND_BRIGHT} />
              <span className="text-[11px] font-semibold text-white">{t.demo.shortcut}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showAns && (
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="absolute rounded-xl overflow-hidden"
              style={{ right: 14, bottom: 14, width: "min(64%,330px)", background: "rgba(13,13,24,0.96)", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 50px rgba(99,102,241,0.2)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Image src="/icon.png" alt="" width={16} height={16} className="rounded" />
                <Wordmark size={11} />
                <span className="ml-auto"><Sparkles size={12} color={SPARK} /></span>
              </div>
              <p className="px-3 py-3 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{t.demo.ahaShort}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Scroll-scrubbed cinematic for "How it works". The section is pinned while
// the user scrolls, and scroll progress itself drives the whole flow on one
// big screen: highlight the confusing text, fire the shortcut, the answer
// lands. The user literally scrolls the product into happening, which is the
// kind of embodied, controllable motion that imprints far deeper than a video.
function HowItWorksScroll() {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(v < 0.34 ? 0 : v < 0.64 ? 1 : 2);
  });

  const hlClip = useTransform(scrollYProgress, [0.06, 0.3], ["inset(0 100% 0 0 round 6px)", "inset(0 0% 0 0 round 6px)"]);
  const hlOpacity = useTransform(scrollYProgress, [0.04, 0.1, 0.64, 0.74], [0, 1, 1, 0]);
  const scanX = useTransform(scrollYProgress, [0.34, 0.54], ["-14%", "114%"]);
  const scanOpacity = useTransform(scrollYProgress, [0.32, 0.36, 0.56, 0.62], [0, 1, 1, 0]);
  const keyOpacity = useTransform(scrollYProgress, [0.32, 0.38, 0.54, 0.6], [0, 1, 1, 0]);
  const keyScale = useTransform(scrollYProgress, [0.32, 0.38], [0.85, 1]);
  const ansOpacity = useTransform(scrollYProgress, [0.64, 0.76], [0, 1]);
  const ansY = useTransform(scrollYProgress, [0.64, 0.76], [26, 0]);
  const ansScale = useTransform(scrollYProgress, [0.64, 0.76], [0.94, 1]);
  const railFill = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "100%"]);

  // Extra parallax layers driven by how-it-works scroll
  const bgOrb1X = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const bgOrb1Y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const bgOrb2X = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const bgOrb2Y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const bgRingRot = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const bgRingScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.8]);

  return (
    <section ref={ref} id="how-it-works" style={{ height: "340vh", background: BG }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-5 overflow-hidden">
        {/* Deep parallax orbs driven by section scroll */}
        <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.div style={{ x: bgOrb1X, y: bgOrb1Y, position: "absolute", width: 650, height: 650, left: "-20%", top: "-25%", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)", filter: "blur(100px)", willChange: "transform" }} />
          <motion.div style={{ x: bgOrb2X, y: bgOrb2Y, position: "absolute", width: 400, height: 400, right: "-10%", bottom: "0%", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)", filter: "blur(70px)", willChange: "transform" }} />
          <motion.div style={{ rotate: bgRingRot, scale: bgRingScale, position: "absolute", width: 340, height: 340, right: "12%", top: "15%", borderRadius: "50%", border: "1px solid rgba(99,102,241,0.1)", willChange: "transform" }} />
          <motion.div style={{ x: bgOrb1X, position: "absolute", width: 200, height: 200, left: "25%", bottom: "8%", borderRadius: "50%", border: "1px solid rgba(139,92,246,0.07)", willChange: "transform" }} />
        </motion.div>
        {/* soft moving glow tied to nothing but ambience */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(99,102,241,0.1), transparent 65%)" }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>{t.how.eyebrow}</SectionEyebrow>
            <h2 className="font-bold text-white" style={{ fontSize: "clamp(26px, 4.5vw, 48px)", letterSpacing: "-0.045em" }}>
              <ShimmerText>{t.how.head}</ShimmerText>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Step rail (fills as you scroll) */}
            <div className="relative pl-9 order-2 md:order-1">
              <div className="absolute left-3 top-1 bottom-1 w-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div className="absolute top-0 left-0 w-full rounded-full"
                  style={{ height: railFill, background: `linear-gradient(${IND}, #8b5cf6)`, boxShadow: "0 0 12px rgba(99,102,241,0.5)" }} />
              </div>
              {t.how.steps.map((s, i) => (
                <motion.div key={i} className="relative mb-7 last:mb-0"
                  animate={{ opacity: active === i ? 1 : 0.38, x: active === i ? 0 : -2 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                  <motion.span className="absolute -left-[26px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    animate={{
                      background: active >= i ? IND : "rgba(255,255,255,0.1)",
                      boxShadow: active === i ? "0 0 16px rgba(99,102,241,0.7)" : "0 0 0 rgba(0,0,0,0)",
                      scale: active === i ? 1.15 : 1,
                    }}>
                    {active > i ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </motion.span>
                  <h3 className="font-semibold text-white mb-1" style={{ fontSize: 18, letterSpacing: "-0.4px" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* The screen that the scroll drives */}
            <div className="order-1 md:order-2 relative rounded-2xl overflow-hidden"
              style={{ aspectRatio: "16 / 11", background: "linear-gradient(160deg,#0d1117 0%,#0a0d13 100%)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 40px 90px rgba(0,0,0,0.7), 0 0 70px rgba(99,102,241,0.14)" }}>
              <div className="flex items-center gap-2 px-4 h-8" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                <span className="ml-3 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.demo.windowApp}</span>
              </div>
              <div className="relative px-5 py-4" style={{ height: "calc(100% - 32px)" }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em" }}>4.2 · Cell biology</p>
                {t.demo.code.slice(0, 4).map((line, i) => (
                  <div key={i} className="leading-relaxed" style={{ fontSize: "clamp(11px,1.5vw,14px)", color: i < 2 ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.36)" }}>{line}</div>
                ))}

                {/* highlight selection drawn by scroll */}
                <motion.div className="absolute rounded-md overflow-hidden"
                  style={{ left: 18, right: 18, top: 38, height: 48, border: `1.5px solid ${IND_BRIGHT}`, background: "rgba(99,102,241,0.12)", boxShadow: "0 0 26px rgba(99,102,241,0.3)", clipPath: hlClip, opacity: hlOpacity }}>
                  <motion.span className="absolute inset-y-0 w-10" style={{ left: scanX, opacity: scanOpacity, background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.6),transparent)" }} />
                </motion.div>

                {/* shortcut chip */}
                <motion.div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-2 rounded-xl"
                  style={{ top: "46%", opacity: keyOpacity, scale: keyScale, background: "rgba(12,12,22,0.92)", border: "1px solid rgba(99,102,241,0.4)", boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}>
                  <Keyboard size={15} color={IND_BRIGHT} />
                  <span className="text-[11px] font-semibold text-white">{t.demo.shortcut}</span>
                </motion.div>

                {/* the answer lands */}
                <motion.div className="absolute rounded-xl overflow-hidden"
                  style={{ right: 14, bottom: 14, width: "min(66%,340px)", opacity: ansOpacity, y: ansY, scale: ansScale, background: "rgba(13,13,24,0.96)", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 50px rgba(99,102,241,0.2)", backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <Image src="/icon.png" alt="" width={15} height={15} className="rounded" />
                    <Wordmark size={11} />
                    <span className="ml-auto"><Sparkles size={12} color={SPARK} /></span>
                  </div>
                  <p className="px-3 py-2.5 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{t.demo.ahaShort}</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* scroll hint */}
          <motion.p className="text-center text-[11px] mt-8 inline-flex items-center justify-center gap-1.5 w-full"
            style={{ color: "rgba(255,255,255,0.28)" }}
            animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
            <MousePointerClick size={12} /> {t.demo.tryHint}
          </motion.p>
        </div>
      </div>
    </section>
  );
}

//
// INTERACTIVE SCREEN DEMO, "experience SnapAha before you install"
// Replays the real flow: shortcut → scan selection → AI answer.
// Visitors can click an action and watch the answer change live.
//
type DemoPhase = "idle" | "shortcut" | "scanning" | "thinking" | "answer";
const ACTION_ICONS: LucideIcon[] = [Lightbulb, Layers, Languages];

function ScreenDemo() {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  // Section-scroll parallax: 4 distinct layers at different depths.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const cardY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const glowY = useTransform(scrollYProgress, [0, 1], [80, -140]);
  const cardRotX = useTransform(scrollYProgress, [0, 0.5, 1], [6, 0, -6]);
  const orb1X = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const orb2X = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const ringRot = useTransform(scrollYProgress, [0, 1], [-15, 15]);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [action, setAction] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  // Auto-play the sequence once, the first time it scrolls into view.
  useEffect(() => {
    if (!inView || hasRun) return;
    setHasRun(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("shortcut"), 600));
    timers.push(setTimeout(() => setPhase("scanning"), 1500));
    timers.push(setTimeout(() => setPhase("thinking"), 2900));
    timers.push(setTimeout(() => setPhase("answer"), 4100));
    return () => timers.forEach(clearTimeout);
  }, [inView, hasRun]);

  const replay = useCallback(() => {
    setPhase("idle");
    setAction(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("shortcut"), 250));
    timers.push(setTimeout(() => setPhase("scanning"), 1100));
    timers.push(setTimeout(() => setPhase("thinking"), 2500));
    timers.push(setTimeout(() => setPhase("answer"), 3700));
  }, []);

  const pickAction = useCallback((i: number) => {
    setAction(i);
    setPhase("thinking");
    const tm = setTimeout(() => setPhase("answer"), 750);
    return () => clearTimeout(tm);
  }, []);

  const showScan = phase === "scanning" || phase === "thinking" || phase === "answer";
  const showPopup = phase === "thinking" || phase === "answer";

  return (
    <section ref={ref} className="relative py-24 px-5 overflow-hidden" style={{ background: "#090912" }}>
      {/* Layer 1 — deep slow glow */}
      <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y: glowY }} aria-hidden>
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(99,102,241,0.14) 0%, transparent 65%)" }} />
        <div className="absolute left-[12%] top-[30%] w-40 h-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.12), transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute right-[10%] bottom-[18%] w-52 h-52 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14), transparent 70%)", filter: "blur(50px)" }} />
      </motion.div>
      {/* Layer 2 — mid depth, opposing horizontal drift */}
      <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div style={{ x: orb1X, y: orb1Y, position: "absolute", width: 600, height: 600, left: "-15%", top: "-20%", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)", filter: "blur(90px)", willChange: "transform" }} />
        <motion.div style={{ x: orb2X, y: orb2Y, position: "absolute", width: 380, height: 380, right: "-8%", bottom: "-5%", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(65px)", willChange: "transform" }} />
        <motion.div style={{ rotate: ringRot, position: "absolute", width: 260, height: 260, left: "60%", top: "20%", borderRadius: "50%", border: "1px solid rgba(99,102,241,0.1)", willChange: "transform" }} />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <Fade className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-5 inline-flex items-center gap-2" style={{ color: IND_BRIGHT, letterSpacing: "0.1em" }}>
            <Sparkles size={13} /> {t.demo.eyebrow}
          </p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em", lineHeight: 1.08 }}>
            <ShimmerText>{t.demo.head}</ShimmerText>
          </h2>
          <p className="max-w-xl mx-auto" style={{ fontSize: 17, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", letterSpacing: "-0.2px" }}>
            {t.demo.sub}
          </p>
        </Fade>

        <Fade delay={0.1}>
         <motion.div style={{ y: cardY, rotateX: cardRotX, transformPerspective: 1200 }}>
          <TiltCard
            className="relative rounded-2xl overflow-hidden mx-auto"
            style={{
              aspectRatio: "16 / 10",
              maxWidth: 760,
              background: "linear-gradient(160deg,#0d1117 0%,#0a0d13 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.12)",
            }}
          >
            {/* Fake window chrome */}
            <div className="flex items-center gap-2 px-4 h-9 shrink-0"
              style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
              <span className="ml-3 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.demo.windowApp}</span>
            </div>

            {/* Document body (a page of study material the reader is stuck on) */}
            <div className="relative px-6 py-5 select-none" style={{ height: "calc(100% - 36px)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
                4.2 · Cell biology
              </p>
              {t.demo.code.map((line, i) => (
                <div key={i} className="leading-relaxed"
                  style={{ fontSize: "clamp(12px,1.8vw,16px)", color: i < 3 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.4)" }}>
                  {line}
                </div>
              ))}

              {/* Scan selection rectangle over the error lines */}
              <AnimatePresence>
                {showScan && (
                  <motion.div
                    initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                    animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute rounded-md"
                    style={{
                      left: 18, right: 18, top: 44, height: 74,
                      border: `1.5px solid ${IND_BRIGHT}`,
                      background: "rgba(99,102,241,0.12)",
                      boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                    }}
                  >
                    <span className="absolute -top-2 -left-1 w-2 h-2 rounded-full" style={{ background: IND_BRIGHT }} />
                    <span className="absolute -bottom-2 -right-1 w-2 h-2 rounded-full" style={{ background: IND_BRIGHT }} />
                    {phase === "scanning" && (
                      <motion.div
                        className="absolute inset-y-0 w-12"
                        initial={{ left: "-10%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        style={{ background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.5),transparent)" }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shortcut key flash */}
              <AnimatePresence>
                {phase === "shortcut" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl"
                    style={{ background: "rgba(12,12,22,0.92)", border: "1px solid rgba(99,102,241,0.4)", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
                  >
                    <Keyboard size={16} color={IND_BRIGHT} />
                    <span className="text-xs font-semibold text-white">{t.demo.shortcut}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SnapAha answer popup */}
              <AnimatePresence>
                {showPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="absolute rounded-xl overflow-hidden"
                    style={{
                      right: 14, bottom: 14, width: "min(60%, 340px)",
                      background: "rgba(13,13,24,0.96)",
                      border: "1px solid rgba(99,102,241,0.35)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 50px rgba(99,102,241,0.2)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <Image src="/icon.png" alt="" width={16} height={16} className="rounded" />
                      <Wordmark size={11} />
                      <span className="ml-auto"><Sparkles size={12} color={SPARK} /></span>
                    </div>
                    <div className="px-3 py-3 font-sans" style={{ minHeight: 96 }}>
                      {phase === "thinking" ? (
                        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {[0, 1, 2].map((d) => (
                            <motion.span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: IND_BRIGHT }}
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                              transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
                          ))}
                          <span className="ml-1">{t.demo.thinking}</span>
                        </div>
                      ) : (
                        <motion.p
                          key={action}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs leading-relaxed whitespace-pre-line"
                          style={{ color: "rgba(255,255,255,0.82)" }}
                        >
                          {t.demo.actions[action].answer}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TiltCard>
         </motion.div>
        </Fade>

        {/* Action chips, clickable, drive the live answer */}
        <Fade delay={0.18} className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
          {t.demo.actions.map((a, i) => {
            const Icon = ACTION_ICONS[i];
            const active = phase === "answer" && action === i;
            return (
              <motion.button
                key={i}
                onClick={() => pickAction(i)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: active ? IND : "rgba(99,102,241,0.08)",
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                  border: `1px solid ${active ? IND : "rgba(99,102,241,0.2)"}`,
                  boxShadow: active ? "0 0 24px rgba(99,102,241,0.35)" : "none",
                }}
              >
                <Icon size={14} /> {a.label}
              </motion.button>
            );
          })}
          <motion.button
            onClick={replay}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <RefreshCw size={14} /> {t.demo.replay}
          </motion.button>
        </Fade>

        <Fade delay={0.22} className="text-center mt-4">
          <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.32)" }}>
            <MousePointerClick size={12} /> {t.demo.tryHint}
          </p>
        </Fade>
      </div>
    </section>
  );
}

// Beta countdown hook
function useCountdown(targetDate: string | null | undefined) {
  const calc = useCallback(() => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [targetDate]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    setTime(calc());
    if (!targetDate) return;
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate, calc]);

  return time;
}

// Countdown digit block
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.div className="flex flex-col items-center gap-2" whileHover={{ scale: 1.05 }}>
      <div
        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.3)",
          boxShadow: "0 0 30px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="font-bold text-white font-mono"
            style={{ fontSize: "clamp(22px,4vw,30px)", letterSpacing: "-2px" }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>
        {label}
      </span>
    </motion.div>
  );
}

// Beta launch section
interface BetaConfig {
  phase: string;
  launch_date: string | null;
  announcement: string | null;
  beta_slots: number;
}

function BetaSection({ downloadUrl, betaConfig }: { downloadUrl: string; betaConfig: BetaConfig | null }) {
  const t = useT();
  const time = useCountdown(betaConfig?.launch_date);
  const hasCountdown = !!time;
  const [betaUsers, setBetaUsers] = useState(2_412);

  useEffect(() => {
    const tm = setInterval(() => setBetaUsers(p => p + (Math.random() > 0.5 ? 1 : 0)), 8000);
    return () => clearInterval(tm);
  }, []);

  return (
    <section className="relative py-24 px-5 overflow-hidden" style={{ background: "#06060e" }}>
      <ParallaxBg orb1Color="rgba(99,102,241,0.12)" orb2Color="rgba(34,197,94,0.05)" orb3Color="rgba(139,92,246,0.08)" particleCount={10} />
      {/* BG radial glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 62%)" }} />
      <div className="pointer-events-none absolute inset-0 grid-bg" style={{ opacity: 0.35 }} />
      <Particles count={18} />


      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
          style={{
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.22)",
            color: "#4ade80",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          {t.beta.badge}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
            {t.beta.joined(betaUsers.toLocaleString())}
          </span>
        </motion.div>

        {/* Heading */}
        <Fade>
          <h2 className="font-bold text-white mb-5"
            style={{ fontSize: "clamp(32px, 6vw, 68px)", letterSpacing: "-0.045em", lineHeight: 1.06 }}>
            {hasCountdown ? (
              <>
                {t.beta.closesIn.a}{" "}
                <span style={{
                  background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, #a78bfa 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>{t.beta.closesIn.b}</span>
              </>
            ) : (
              <>
                {t.beta.freeLimited.a}{" "}
                <span style={{
                  background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, #a78bfa 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>{t.beta.freeLimited.b}</span>
              </>
            )}
          </h2>

          {betaConfig?.announcement && (
            <p className="max-w-lg mx-auto mb-10 text-lg" style={{ color: "rgba(255,255,255,0.48)", letterSpacing: "-0.2px" }}>
              {betaConfig.announcement}
            </p>
          )}
        </Fade>

        {/* Countdown */}
        {hasCountdown && time && (
          <Fade delay={0.1} className="flex items-end justify-center gap-3 sm:gap-5 mb-12">
            <CountdownUnit value={time.days} label={t.beta.days} />
            <span className="font-bold mb-6 sm:mb-8" style={{ fontSize: "clamp(24px,4vw,36px)", color: "rgba(255,255,255,0.18)" }}>:</span>
            <CountdownUnit value={time.hours} label={t.beta.hours} />
            <span className="font-bold mb-6 sm:mb-8" style={{ fontSize: "clamp(24px,4vw,36px)", color: "rgba(255,255,255,0.18)" }}>:</span>
            <CountdownUnit value={time.minutes} label={t.beta.mins} />
            <span className="font-bold mb-6 sm:mb-8" style={{ fontSize: "clamp(24px,4vw,36px)", color: "rgba(255,255,255,0.18)" }}>:</span>
            <CountdownUnit value={time.seconds} label={t.beta.secs} />
          </Fade>
        )}

        {!hasCountdown && <div className="mb-10" />}

        {/* Perks */}
        <Fade delay={0.15} className="flex flex-wrap justify-center gap-2.5 mb-10">
          {t.beta.perks.map(perk => (
            <motion.span
              key={perk}
              whileHover={{ scale: 1.04, borderColor: "rgba(99,102,241,0.45)" }}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full cursor-default transition-colors"
              style={{
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.18)",
                color: "rgba(255,255,255,0.68)",
              }}
            >
              <Check size={14} color={IND_BRIGHT} /> {perk}
            </motion.span>
          ))}
        </Fade>

        {/* CTA */}
        <Fade delay={0.2} className="flex flex-col items-center gap-3">
          <Magnetic strength={0.4}>
            <motion.a
              href={downloadUrl}
              whileHover={{ scale: 1.06, boxShadow: "0 0 80px rgba(99,102,241,0.7)" }}
              whileTap={{ scale: 0.93 }}
              className="relative overflow-hidden flex items-center gap-3 px-9 py-4 rounded-full font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${IND} 0%, #7c3aed 100%)`,
                fontSize: "clamp(14px,1.8vw,16px)",
                boxShadow: "0 0 45px rgba(99,102,241,0.45)",
                letterSpacing: "-0.25px",
              }}
            >
              <Shine />
              <Download size={17} /> {t.beta.cta}
            </motion.a>
          </Magnetic>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            {t.beta.fine}
          </p>
        </Fade>

      </div>
    </section>
  );
}

// Number scramble counter
const CHARS = "0123456789";
function ScrambleCounter({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const sp = useSpring(mv, { damping: 25, stiffness: 70 });

  useEffect(() => { if (inView) mv.set(to); }, [inView, mv, to]);
  useEffect(() => sp.on("change", (v) => {
    if (!ref.current) return;
    const base = v.toFixed(decimals);
    if (v >= to * 0.85) { ref.current.textContent = base + suffix; return; }
    const arr = base.split("");
    ref.current.textContent = arr.map((c, i) =>
      i < arr.length - 2 ? CHARS[Math.floor(Math.random() * 10)] : c
    ).join("") + suffix;
  }), [sp, decimals, suffix, to]);

  return <span ref={ref}>0{suffix}</span>;
}

// Fade-up on scroll
function Fade({ children, className = "", delay = 0, y = 36 }: {
  children: React.ReactNode; className?: string; delay?: number; y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// Hero gallery

interface GalleryItem {
  id: string;
  title: string | null;
  file_url: string;
  file_type: string;
  sort_order: number;
}

const VIDEO_TYPES = ["mp4", "webm", "mov"];
const isVideoItem = (it: GalleryItem) => VIDEO_TYPES.includes(it.file_type);

function HeroGallery({ items }: { items: GalleryItem[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // Per-item measured video durations (ms). Falls back to 6s for images/gifs.
  const [durations, setDurations] = useState<Record<string, number>>({});
  // Keep a stable handle to every mounted <video> so we can play/pause without remounting.
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const item = items[current];
  const slideDuration = (item && durations[item.id]) || 6000;

  // Play only the active video; pause the rest but KEEP them mounted so the
  // browser reuses its buffer instead of re-downloading from Supabase each loop.
  useEffect(() => {
    items.forEach((it, i) => {
      const v = videoRefs.current[it.id];
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        if (!paused) v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current, paused, items]);

  // Auto-advance, uses setTimeout so it reacts to per-slide duration updates.
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setTimeout(() => setCurrent(c => (c + 1) % items.length), slideDuration);
    return () => clearTimeout(t);
  }, [current, slideDuration, items.length, paused]);

  const handleVideoMeta = useCallback((id: string, e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    if (d && isFinite(d)) setDurations(prev => ({ ...prev, [id]: Math.round(d * 0.95 * 1000) }));
  }, []);

  // No admin media yet → show the always-on self-playing product mock so the
  // hero ALWAYS demonstrates what SnapAha does (no dead placeholder).
  if (items.length === 0) {
    return <MiniFlowMock />;
  }

  const durationSec = slideDuration / 1000;

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        aspectRatio: "16 / 10",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px rgba(99,102,241,0.15)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* All media stay mounted; we only cross-fade opacity. This keeps each
          video buffered after its first download, killing the per-loop lag. */}
      {items.map((it, i) => {
        const active = i === current;
        // Eagerly buffer the active slide + the next one; lazily fetch the rest.
        const preload = active || i === (current + 1) % items.length ? "auto" : "metadata";
        return (
          <motion.div
            key={it.id}
            initial={false}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{ zIndex: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}
          >
            {isVideoItem(it) ? (
              <video
                ref={(el) => { videoRefs.current[it.id] = el; }}
                src={it.file_url}
                muted playsInline loop={items.length === 1}
                preload={preload}
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) => handleVideoMeta(it.id, e)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.file_url} alt={it.title ?? "SnapAha demo"} loading={active ? "eager" : "lazy"} className="w-full h-full object-cover" />
            )}
          </motion.div>
        );
      })}

      {/* Title overlay */}
      {item.title && (
        <div
          className="absolute bottom-0 inset-x-0 px-5 pb-4 pt-8 pointer-events-none z-10"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
        >
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{item.title}</p>
        </div>
      )}

      {/* Dot nav */}
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setPaused(true); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                background: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar, width animation driven by slideDuration */}
      {!paused && items.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 z-10" style={{ background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            key={`${current}-${slideDuration}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: durationSec, ease: "linear" }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${IND}, #8b5cf6)` }}
          />
        </div>
      )}
    </div>
  );
}

// Nav
function Nav({ downloadUrl }: { downloadUrl: string }) {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#how-it-works", label: t.nav.how },
    { href: "#use-cases", label: t.nav.useCases },
    { href: "#pricing", label: t.nav.pricing },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-400"
      style={{
        height: 56,
        background: scrolled ? "rgba(8,8,16,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(200%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.055)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div className="rounded-xl overflow-hidden shrink-0" style={{ width: 32, height: 32 }}
            animate={{ boxShadow: ["0 0 10px rgba(99,102,241,0.4)", "0 0 22px rgba(99,102,241,0.75)", "0 0 10px rgba(99,102,241,0.4)"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
            <Image src="/icon.png" alt="SnapAha" width={32} height={32} className="rounded-xl" />
          </motion.div>
          <Wordmark size={17} />
        </div>
        <div className="hidden md:flex gap-7">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              className="text-xs text-white/55 hover:text-white transition-colors" style={{ letterSpacing: "-0.1px" }}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <Magnetic>
            <motion.a href={downloadUrl} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-full"
              style={{ background: IND, boxShadow: "0 0 20px rgba(99,102,241,0.35)", letterSpacing: "-0.1px" }}>
              <Download size={13} /> {t.nav.download}
            </motion.a>
          </Magnetic>
        </div>
      </div>
    </motion.nav>
  );
}

// Sticky download bar (appears after the hero, conversion lever)
function StickyCTA({ downloadUrl, version }: { downloadUrl: string; version: string }) {
  const t = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > window.innerHeight * 0.9);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-4 inset-x-0 z-50 px-4 flex justify-center pointer-events-none"
        >
          <div
            className="pointer-events-auto flex items-center gap-3 sm:gap-4 pl-4 pr-2 py-2 rounded-full max-w-[min(94vw,560px)] w-full sm:w-auto"
            style={{
              background: "rgba(12,12,22,0.82)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 16px 50px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.12)",
            }}
          >
            <Image src="/icon.png" alt="SnapAha" width={30} height={30} className="rounded-lg shrink-0" />
            <div className="min-w-0 flex-1 hidden sm:block">
              <p className="text-sm font-semibold text-white leading-tight">SnapAha</p>
              <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                v{version}-beta · {t.hero.trust}
              </p>
            </div>
            <Magnetic strength={0.25}>
              <motion.a
                href={downloadUrl}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white text-sm whitespace-nowrap"
                style={{ background: IND, boxShadow: "0 0 24px rgba(99,102,241,0.4)", letterSpacing: "-0.2px" }}
              >
                <Shine />
                <Download size={14} /> {t.nav.download}
              </motion.a>
            </Magnetic>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// The headline performs the product on itself: the question gets HIGHLIGHTED
// (the exact SnapAha gesture, indigo selection + scan sweep), then the amber
// answer IGNITES, the way an "aha" lands. The most-viewed element becomes a
// 2-second product demo, so the core promise is impossible to forget.
function HeadlineLine({ text, amber, highlight, baseDelay }: {
  text: string; amber?: boolean; highlight?: boolean; baseDelay: number;
}) {
  const words = text.split(" ");
  const flareAt = baseDelay + (words.length - 1) * 0.09 + 0.45;
  const hlAt = baseDelay + words.length * 0.09 + 0.2;
  return (
    <span className="block">
      <span className="relative inline-block" style={{ overflow: "visible"}}>
        {/* highlighter selection sweeping across the question */}
        {highlight && (
          <motion.span aria-hidden className="absolute rounded-md overflow-hidden -z-10"
            style={{ left: "-0.18em", right: "-0.18em", top: "0.1em", bottom: "0.08em", background: "rgba(99,102,241,0.26)", border: "1px solid rgba(129,140,248,0.55)" }}
            initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
            animate={{ clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)"], opacity: [0, 1, 1, 0] }}
            transition={{ delay: hlAt, duration: 1.15, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }}
          >
            <motion.span className="absolute inset-y-0 w-1/4"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }}
              initial={{ left: "-30%" }} animate={{ left: "130%" }}
              transition={{ delay: hlAt, duration: 0.55, ease: "easeInOut" }} />
          </motion.span>
        )}
        {/* amber ignition flare behind the answer */}
        {amber && (
          <motion.span aria-hidden className="pointer-events-none absolute inset-0 -z-10"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 0], scale: [0.7, 1.15, 1.3] }}
            transition={{ delay: flareAt, duration: 1, ease: "easeOut" }}
            style={{ background: `radial-gradient(ellipse 65% 130% at 50% 50%, ${SPARK} 0%, transparent 68%)`, filter: "blur(24px)" }} />
        )}
        {words.map((w, wi) => (
          <span key={wi} className="inline-block whitespace-nowrap" style={{ marginRight: "0.22em" }}>
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 40, rotateX: -55, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
              transition={{ delay: baseDelay + wi * 0.09, type: "spring", stiffness: 180, damping: 16 }}
              style={{ transformPerspective: 600, transformOrigin: "bottom" }}
            >
              {amber ? (
                <motion.span
                  style={{
                    display: "inline-block",
                    backgroundImage: `linear-gradient(110deg, ${SPARK} 0%, ${SPARK_BRIGHT} 25%, #fff7e0 50%, ${SPARK_BRIGHT} 75%, ${SPARK} 100%)`,
                    backgroundSize: "220% auto",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}
                  animate={{ backgroundPosition: ["0% center", "220% center"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  {w}
                </motion.span>
              ) : (
                <span className="text-white">{w}</span>
              )}
            </motion.span>
          </span>
        ))}
      </span>
    </span>
  );
}

function TypedHeadline() {
  const t = useT();
  return (
    <h1 className="font-bold overflow-visible" style={{ fontSize: "clamp(44px, 8vw, 96px)", letterSpacing: "-0.045em", lineHeight: 1.3 }}>
      <HeadlineLine text={t.hero.line1} highlight baseDelay={0.2} />
      <HeadlineLine text={t.hero.line2} amber baseDelay={1.25} />
    </h1>
  );
}

// Feature card
function FeatureCard({ Icon, title, desc, badge, delay }: {
  Icon: LucideIcon; title: string; desc: string; badge?: string; delay: number;
}) {
  return (
    <Fade delay={delay} className="h-full">
      <TiltCard className="h-full">
        <SpotlightCard
          className="p-5 rounded-2xl h-full relative flex flex-col"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          whileHover={{ borderColor: "rgba(99,102,241,0.45)", boxShadow: "0 16px 44px rgba(99,102,241,0.16)" }}
        >
          <div className="flex items-start gap-2 mb-4">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)" }}
              whileHover={{ scale: 1.12, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon size={18} color={IND_BRIGHT} strokeWidth={1.7} />
            </motion.div>
            {badge && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.14)", color: IND_BRIGHT, border: `1px solid rgba(99,102,241,0.25)` }}>
                {badge}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white mb-2" style={{ fontSize: 15, letterSpacing: "-0.35px" }}>{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{desc}</p>
        </SpotlightCard>
      </TiltCard>
    </Fade>
  );
}

// Use case tabs
const USE_CASE_ICONS: LucideIcon[] = [GraduationCap, Mail, PenTool, Code2];
// Per-persona action icons (by index, language-independent).
const USE_CASE_ACTION_ICONS: LucideIcon[][] = [
  [Lightbulb, Layers, Languages, HelpCircle],       // Student
  [Reply, Languages, FileText, WandSparkles],        // Office
  [RefreshCw, WandSparkles, Sparkles, SpellCheck],   // Creator
  [Bug, Wrench, BookOpen, GitPullRequest],           // Developer
];
// Content tint per persona, subtle visual cue of "their kind of content".
const USE_CASE_TINT = ["rgba(129,140,248,0.4)", "rgba(96,165,250,0.4)", "rgba(244,114,182,0.4)", "rgba(52,211,153,0.4)"];

// Wordless persona scene: their content gets highlighted → the action pops out.
function UseCaseScene({ active, action0, ActionIcon }: { active: number; action0: string; ActionIcon: LucideIcon }) {
  const bars = ["88%", "70%", "94%", "58%"];
  const tint = USE_CASE_TINT[active];
  return (
    <div className="relative rounded-2xl p-6 h-full flex flex-col justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(99,102,241,0.08), rgba(139,92,246,0.03))", border: "1px solid rgba(99,102,241,0.18)", minHeight: 230 }}>
      {/* the user's content */}
      <div className="relative">
        {bars.map((w, i) => (
          <div key={i} className="h-3 rounded-full mb-3.5" style={{ width: w, background: i < 2 ? tint : "rgba(255,255,255,0.09)" }} />
        ))}
        {/* highlight box + scanning sweep over the top lines */}
        <div className="absolute rounded-md overflow-hidden" style={{ left: -6, top: -5, right: "10%", height: 34, border: `1.5px solid ${IND_BRIGHT}`, background: "rgba(99,102,241,0.12)" }}>
          <motion.div className="absolute inset-y-0 w-12"
            style={{ background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.6),transparent)" }}
            animate={{ x: ["-48px", "260px"] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </div>
      {/* → instant result chip */}
      <motion.div key={active}
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 22 }}
        className="mt-7 self-start flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
        style={{ background: "rgba(13,13,24,0.88)", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 0 32px rgba(99,102,241,0.25)" }}>
        <ActionIcon size={16} color={IND_BRIGHT} strokeWidth={1.8} />
        <span className="text-sm font-semibold text-white">{action0}</span>
        <Sparkles size={13} color={SPARK} />
      </motion.div>
    </div>
  );
}

function UseCaseTabs() {
  const t = useT();
  const cases = t.useCases.cases;
  const [active, setActive] = useState(0);
  const uc = cases[active];
  const actIcons = USE_CASE_ACTION_ICONS[active];
  return (
    <Fade>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {cases.map((c, i) => {
          const Icon = USE_CASE_ICONS[i];
          return (
            <motion.button key={i} onClick={() => setActive(i)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: active === i ? IND : "rgba(255,255,255,0.05)",
                color: active === i ? "white" : "rgba(255,255,255,0.5)",
                border: active === i ? `1px solid ${IND}` : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease",
                boxShadow: active === i ? "0 0 24px rgba(99,102,241,0.3)" : "none",
              }}>
              <Icon size={15} /> {c.label}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -18, filter: "blur(4px)" }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

          {/* LEFT, animated scene + the one-line emotional hook */}
          <div className="flex flex-col gap-4">
            <UseCaseScene active={active} action0={uc.actions[0]} ActionIcon={actIcons[0]} />
            <h3 className="font-bold" style={{ fontSize: "clamp(20px,3vw,26px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
              <span style={{ background: `linear-gradient(135deg, #fff 0%, ${IND_BRIGHT} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {uc.highlight}
              </span>
            </h3>
          </div>

          {/* RIGHT, actions as a graphic 2×2 grid (icons carry meaning) */}
          <div className="grid grid-cols-2 gap-3 content-start">
            {uc.actions.map((a, i) => {
              const Ic = actIcons[i];
              return (
                <motion.div key={a}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, borderColor: "rgba(99,102,241,0.45)", boxShadow: "0 14px 36px rgba(99,102,241,0.18)" }}
                  className="flex flex-col gap-2.5 p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)" }}>
                    <Ic size={17} color={IND_BRIGHT} strokeWidth={1.7} />
                  </span>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.82)", letterSpacing: "-0.2px" }}>{a}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </Fade>
  );
}

// Pricing
function PricingCard({ plan, price, period, features, cta, highlighted, badge, downloadUrl = "#" }: {
  plan: string; price: string; period: string; features: string[]; cta: string; highlighted?: boolean; badge?: string; downloadUrl?: string;
}) {
  return (
    <TiltCard className="h-full">
      <SpotlightCard
        className="relative p-6 rounded-2xl flex flex-col h-full"
        style={{
          background: highlighted ? "linear-gradient(145deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.07) 100%)" : "rgba(255,255,255,0.03)",
          border: highlighted ? "1px solid rgba(99,102,241,0.45)" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: highlighted ? "0 0 80px rgba(99,102,241,0.18)" : "none",
        }}
        whileHover={{ borderColor: "rgba(99,102,241,0.6)", boxShadow: highlighted ? "0 24px 70px rgba(99,102,241,0.3)" : "0 16px 44px rgba(99,102,241,0.16)" }}>
        {badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
            style={{ background: IND, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
            {badge}
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{plan}</p>
        <div className="flex items-end gap-1 mb-1">
          <span className="font-bold text-white" style={{ fontSize: 40, letterSpacing: "-2px" }}>{price}</span>
          {period && <span className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>{period}</span>}
        </div>
        <div className="h-px my-4" style={{ background: "rgba(255,255,255,0.07)" }} />
        <ul className="space-y-3 mb-7 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.68)" }}>
              <span className="shrink-0 mt-0.5 w-[15px] h-[15px] rounded-full flex items-center justify-center"
                style={{ background: highlighted ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)" }}>
                <Check size={10} color={highlighted ? IND_BRIGHT : "rgba(255,255,255,0.4)"} strokeWidth={2.5} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <Magnetic>
          <motion.a href={highlighted ? downloadUrl : "#pricing"} whileTap={{ scale: 0.95 }}
            className="block w-full py-3 px-4 rounded-full text-sm font-semibold text-center"
            style={{
              background: highlighted ? IND : "rgba(255,255,255,0.07)",
              color: highlighted ? "white" : "rgba(255,255,255,0.65)",
              border: highlighted ? "none" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: highlighted ? "0 0 30px rgba(99,102,241,0.35)" : "none",
              letterSpacing: "-0.2px",
            }}>
            {cta}
          </motion.a>
        </Magnetic>
      </SpotlightCard>
    </TiltCard>
  );
}

// Page body (inside LanguageProvider so hooks can read context)
const FEATURE_ICONS: LucideIcon[] = [ScanText, UsersRound, MessageSquareText, History, ListOrdered, Network];

function LandingBody() {
  const t = useT();
  const heroRef = useRef<HTMLElement>(null);

  // Hero-local scroll progress drives the multi-layer parallax.
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity  = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const auroraY      = useTransform(scrollYProgress, [0, 1], [0, 340]);   // deepest — barely moves
  const perspGridY   = useTransform(scrollYProgress, [0, 1], [0, 65]);    // floor grid — slow
  const gridY        = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const particlesY   = useTransform(scrollYProgress, [0, 1], [0, 190]);
  const copyY        = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const copyScale    = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const demoY        = useTransform(scrollYProgress, [0, 1], [0, 170]);
  const demoRotate   = useTransform(scrollYProgress, [0, 1], [0, -4]);
  const demoScale    = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  // 3D scroll tilt: hero copy tilts forward as you scroll out
  const copyRotX     = useTransform(scrollYProgress, [0, 0.6], [0, 18]);
  const copyZ        = useTransform(scrollYProgress, [0, 0.6], [0, -60]);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Dynamic download URL + version from /api/version
  const [downloadUrl, setDownloadUrl] = useState<string>("#");
  const [latestVersion, setLatestVersion] = useState<string>("1.0");
  const [betaConfig, setBetaConfig] = useState<BetaConfig | null>(null);

  useEffect(() => {
    fetch("/api/version")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.downloadUrl) setDownloadUrl(d.downloadUrl);
        if (d?.latestVersion) setLatestVersion(d.latestVersion);
      })
      .catch(() => {});

    fetch("/api/beta-config")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBetaConfig(d); })
      .catch(() => {});

    fetch("/api/hero-gallery")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d)) setGalleryItems(d); })
      .catch(() => {});
  }, []);

  // Live query counter
  const [liveCount, setLiveCount] = useState(2_318_441);
  useEffect(() => {
    const tm = setInterval(() => setLiveCount(p => p + Math.floor(Math.random() * 3) + 1), 1800);
    return () => clearInterval(tm);
  }, []);

  const statMeta = [
    { n: 12000, s: "+", d: 0 },
    { n: 2.3, s: "M", d: 1 },
    { n: 4.8, s: "/5", d: 1 },
    { n: 98, s: "%", d: 0 },
  ];

  return (
    <div style={{ background: BG, color: "#f8fafc", fontFamily: "var(--font-inter)" }}>
      <GrainOverlay />
      <ScrollProgress />
      <StarField />
      <CursorGlow />
      <ScrollToTop />
      <Nav downloadUrl={downloadUrl} />
      <StickyCTA downloadUrl={downloadUrl} version={latestVersion} />

      {/* HERO */}
      <section ref={heroRef} className="relative flex flex-col items-center justify-center text-center overflow-hidden min-h-screen px-5 pt-24 pb-20"
        style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0a14 60%, ${BG} 100%)`, perspective: "1200px", perspectiveOrigin: "50% 40%" }}>
        <Aurora y={auroraY} />
        <PerspectiveGrid yOffset={perspGridY} />
        <Particles count={65} y={particlesY} />
        <FloatingGeometry scrollYProgress={scrollYProgress} />
        {/* Grid (mid parallax layer) */}
        <motion.div className="pointer-events-none absolute inset-0 grid-bg" style={{ y: gridY }} />

        <motion.div style={{ opacity: heroOpacity, y: copyY, scale: copyScale, rotateX: copyRotX, z: copyZ, transformPerspective: 1000 }} className="relative z-10 w-full max-w-4xl mx-auto">

          {/* ── SnapAha brand mark ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-3.5 mb-8"
          >
            {/* App icon with breathing glow ring */}
            <motion.div className="relative shrink-0"
              animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
              <motion.div className="absolute -inset-1 rounded-2xl"
                style={{ background: `radial-gradient(circle, ${IND}70 0%, transparent 70%)`, filter: "blur(8px)" }}
                animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
              <div className="relative rounded-2xl overflow-hidden"
                style={{ width: 54, height: 54, boxShadow: `0 0 0 1px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.5)` }}>
                <Image src="/icon.png" alt="SnapAha" width={54} height={54} className="rounded-2xl" />
              </div>
            </motion.div>

            {/* Name + tagline */}
            <div className="text-left">
              <motion.p className="font-bold leading-none mb-1" style={{ fontSize: 30, letterSpacing: "-1px" }}>
                <span className="text-white">Snap</span>
                <motion.span
                  style={{ backgroundImage: `linear-gradient(110deg, ${SPARK_BRIGHT} 0%, ${SPARK} 45%, ${SPARK_BRIGHT} 100%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}>Aha</motion.span>
              </motion.p>
              <p className="text-[11px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                AI OVERLAY · WINDOWS
              </p>
            </div>
          </motion.div>
          {/* ────────────────────────────────────────────────────────────── */}

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: IND_BRIGHT }}
          >
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ background: IND_BRIGHT }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            {t.hero.badge(liveCount.toLocaleString())}
            <motion.span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: IND, color: "white" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {t.hero.free}
            </motion.span>
          </motion.div>

          <TypedHeadline />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto mt-6 mb-9"
            style={{ fontSize: "clamp(16px, 2.2vw, 20px)", lineHeight: 1.65, letterSpacing: "-0.25px", color: "rgba(255,255,255,0.52)" }}
          >
            {t.hero.sub}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.65 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-6"
          >
            <Magnetic strength={0.4}>
              <motion.a
                href={downloadUrl}
                whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.93 }}
                className="relative overflow-hidden flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white text-sm"
                style={{ background: IND, letterSpacing: "-0.2px", boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
              >
                <Shine />
                <Download size={15} /> {t.hero.cta}
              </motion.a>
            </Magnetic>
            <motion.a href="#demo"
              whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", letterSpacing: "-0.2px" }}>
              {t.hero.secondary}
              <ArrowRight size={13} />
            </motion.a>
          </motion.div>

          {/* Wordless value flow: See → Snap → Get (understand in 2 seconds) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-7"
          >
            <HeroFlow />
          </motion.div>

          {/* Trust row: avatars + rating */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-3"
          >
            <AvatarStack />
            <div className="flex items-center gap-2">
              <Stars />
              <span className="text-xs font-semibold text-white">{t.hero.rating}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>· {t.hero.usersLove}</span>
            </div>
          </motion.div>

          {/* Risk-reversal pills: each reassurance gets a green check (positive affirmation) */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2">
            {t.hero.trust.split(" · ").map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                <Check size={12} color="#4ade80" strokeWidth={3} /> {item}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", color: IND_BRIGHT }}>
              beta v{latestVersion}
            </span>
          </motion.div>
        </motion.div>

        {/* Demo (parallax foreground) */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: demoY, rotate: demoRotate, scale: demoScale }}
          className="relative z-10 w-full max-w-[800px] mx-auto mt-14 px-4"
        >
          {/* Ambient halo that breathes with the device, for premium depth */}
          <motion.div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px]"
            style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.22), transparent 70%)", filter: "blur(40px)" }}
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
          {/* Gentle hover/float gives the screen a weightless, premium feel */}
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <HeroGallery items={galleryItems} />
          </motion.div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
            style={{ background: `linear-gradient(to top, ${BG}, transparent)` }} />
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-xs"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
              <rect x="1" y="1" width="12" height="20" rx="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
              <motion.rect x="6.5" y="5" width="1" height="5" rx="0.5" fill="rgba(255,255,255,0.4)"
                animate={{ y: [0, 7, 0], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }} />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* INTERACTIVE DEMO, experience before you install */}
      <div id="demo">
        <ScreenDemo />
      </div>

      {/* BETA LAUNCH */}
      <BetaSection downloadUrl={downloadUrl} betaConfig={betaConfig} />

      {/* PROBLEM */}
      <section className="py-24 px-5 relative overflow-hidden" style={{ background: "#0b0b16" }}>
        <ParallaxBg orb1Color="rgba(239,68,68,0.07)" orb2Color="rgba(99,102,241,0.1)" orb3Color="rgba(139,92,246,0.06)" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Fade>
            <SectionEyebrow>{t.problem.eyebrow}</SectionEyebrow>
            <h2 className="font-bold text-white mb-6" style={{ fontSize: "clamp(28px, 5vw, 56px)", letterSpacing: "-0.045em", lineHeight: 1.1 }}>
              {t.problem.headPre}{" "}
              <span style={{ background: `linear-gradient(135deg, ${IND_BRIGHT}, #a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                <ScrambleCounter to={8.7} suffix={t.problem.daysUnit} decimals={1} />
              </span>
              {" "}{t.problem.headPost}
            </h2>
            <p className="max-w-2xl mx-auto mb-14" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.48)", letterSpacing: "-0.2px" }}>
              {t.problem.sub.a}
              <strong style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{t.problem.sub.bold}</strong>
              {t.problem.sub.b}
            </p>
          </Fade>
          <SpeedRace />
        </div>
      </section>

      {/* HOW IT WORKS, scroll-scrubbed cinematic */}
      <HowItWorksScroll />

      {/* FEATURES */}
      <section id="features" className="py-24 px-5 relative overflow-hidden" style={{ background: "#0b0b16" }}>
        <ParallaxBg orb1Color="rgba(99,102,241,0.14)" orb2Color="rgba(139,92,246,0.09)" showRings showBeams />
        <div className="max-w-5xl mx-auto relative z-10">
          <Fade className="text-center mb-12">
            <SectionEyebrow>{t.features.eyebrow}</SectionEyebrow>
            <h2 className="font-bold text-white" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              <ShimmerText>{t.features.head1}</ShimmerText><br /><ShimmerText>{t.features.head2}</ShimmerText>
            </h2>
          </Fade>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.features.items.map((f, i) => (
              <FeatureCard key={i} delay={i * 0.05} badge={f.badge} title={f.title} desc={f.desc} Icon={FEATURE_ICONS[i]} />
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="py-24 px-5 relative overflow-hidden" style={{ background: BG }}>
        <ParallaxBg orb1Color="rgba(99,102,241,0.11)" orb2Color="rgba(251,191,36,0.06)" orb3Color="rgba(139,92,246,0.07)" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Fade className="text-center mb-10">
            <SectionEyebrow>{t.useCases.eyebrow}</SectionEyebrow>
            <h2 className="font-bold text-white" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              <ShimmerText>{t.useCases.head1}</ShimmerText><br /><ShimmerText>{t.useCases.head2}</ShimmerText>
            </h2>
          </Fade>
          <UseCaseTabs />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24 px-5 relative overflow-hidden" style={{ background: "#0b0b16" }}>
        <ParallaxBg orb1Color="rgba(251,191,36,0.07)" orb2Color="rgba(99,102,241,0.1)" orb3Color="rgba(16,185,129,0.05)" particleCount={12} showRings showBeams />
        <div className="max-w-5xl mx-auto relative z-10">
          <Fade className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {statMeta.map((stat, i) => (
              <TiltCard key={i}>
                <SpotlightCard className="p-5 rounded-2xl text-center"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
                  whileHover={{ borderColor: "rgba(99,102,241,0.5)", boxShadow: "0 14px 40px rgba(99,102,241,0.2)" }}>
                  <p className="font-bold text-white mb-1" style={{ fontSize: 34, letterSpacing: "-1.8px" }}>
                    <ScrambleCounter to={stat.n} suffix={stat.s} decimals={stat.d} />
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.social.stats[i].label}</p>
                </SpotlightCard>
              </TiltCard>
            ))}
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.social.testimonials.map((tm, i) => (
              <Fade key={i} delay={i * 0.08} className="h-full">
                <TiltCard className="h-full">
                  <SpotlightCard className="p-5 rounded-2xl h-full flex flex-col"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    whileHover={{ borderColor: "rgba(99,102,241,0.4)", boxShadow: "0 16px 44px rgba(99,102,241,0.15)" }}>
                    <div className="mb-3"><Stars /></div>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.68)" }}>&ldquo;{tm.q}&rdquo;</p>
                    <div className="flex items-center gap-2.5 mt-auto">
                      <div className="rounded-full shrink-0" style={{ width: 30, height: 30, background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }} />
                      <div>
                        <p className="text-xs font-semibold text-white">{tm.a}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{tm.r}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                </TiltCard>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-5 relative overflow-hidden" style={{ background: BG }}>
        <ParallaxBg orb1Color="rgba(99,102,241,0.16)" orb2Color="rgba(139,92,246,0.1)" orb3Color="rgba(59,130,246,0.07)" showRings showBeams />
        <div className="max-w-5xl mx-auto relative z-10">
          <Fade className="text-center mb-12">
            <SectionEyebrow>{t.pricing.eyebrow}</SectionEyebrow>
            <h2 className="font-bold text-white mb-3" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              <ShimmerText>{t.pricing.head}</ShimmerText>
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.4)" }}>{t.pricing.sub}</p>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {t.pricing.plans.map((p, i) => (
              <Fade key={i} delay={i * 0.08} className="h-full">
                <PricingCard
                  plan={p.plan}
                  price={["$0", "$9", "$19"][i]}
                  period={p.period}
                  highlighted={i === 1}
                  badge={p.badge}
                  cta={p.cta}
                  downloadUrl={downloadUrl}
                  features={p.features}
                />
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-28 px-5 text-center relative overflow-hidden" style={{ background: "#07070f" }}>
        <ParallaxBg orb1Color="rgba(99,102,241,0.22)" orb2Color="rgba(139,92,246,0.16)" orb3Color="rgba(99,102,241,0.12)" particleCount={16} showRings showBeams />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(99,102,241,0.16) 0%, transparent 68%)" }} />
        <Aurora />
        <div className="relative z-10 max-w-xl mx-auto">
          <Fade>
            <motion.div className="mx-auto mb-8 rounded-2xl flex items-center justify-center"
              style={{ width: 72, height: 72, boxShadow: "0 0 80px rgba(99,102,241,0.5)" }}
              animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}>
              <Image src="/icon.png" alt="SnapAha" width={72} height={72} className="rounded-2xl" />
            </motion.div>
            <h2 className="font-bold text-white mb-5" style={{ fontSize: "clamp(36px, 6vw, 72px)", letterSpacing: "-0.045em", lineHeight: 1.04 }}>
              {t.footerCta.line1}<br />
              <span style={{ background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, ${IND} 50%, #a78bfa 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {t.footerCta.line2}
              </span>
            </h2>
            <p className="mb-10 text-lg" style={{ color: "rgba(255,255,255,0.42)", letterSpacing: "-0.25px" }}>
              {t.footerCta.sub}
            </p>
            <Magnetic strength={0.3}>
              <motion.a href={downloadUrl}
                whileHover={{ scale: 1.07, boxShadow: "0 0 70px rgba(99,102,241,0.7)" }}
                whileTap={{ scale: 0.93 }}
                className="relative overflow-hidden inline-flex items-center gap-3 px-9 py-4 rounded-full font-bold text-white text-base"
                style={{ background: IND, boxShadow: "0 0 40px rgba(99,102,241,0.45)", letterSpacing: "-0.25px" }}>
                <Shine />
                <Download size={17} /> {t.footerCta.cta}
              </motion.a>
            </Magnetic>
            <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              {t.footerCta.fine} · v{latestVersion}-beta
            </p>
          </Fade>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-5" style={{ background: "#060609", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="SnapAha" width={28} height={28} className="rounded-lg" style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.45))" }} />
            <Wordmark size={16} />
            <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.2)" }}>
              {t.footer.tagline}
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {t.footer.links.map((l) => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                {l}
              </a>
            ))}
            <Link href="/admin" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
              {t.footer.admin}
            </Link>
            <LanguageToggle compact />
          </nav>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>{t.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}

// Main (provides language context)
export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingBody />
    </LanguageProvider>
  );
}
