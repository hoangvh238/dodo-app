"use client";

import {
  useEffect, useRef, useState, useCallback, useMemo
} from "react";
import Image from "next/image";
import {
  motion, useScroll, useTransform, useInView,
  AnimatePresence, useMotionValue, useSpring,
  useMotionTemplate,
} from "framer-motion";
import Link from "next/link";

// ─── Brand ───
const IND = "#6366f1";
const IND_BRIGHT = "#818cf8";
const BG = "#080810";

// ─── Cursor glow (follows mouse globally) ───
function CursorGlow() {
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const bg = useMotionTemplate`radial-gradient(700px circle at ${x}px ${y}px, rgba(99,102,241,0.055), transparent 40%)`;
  useEffect(() => {
    const h = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, [x, y]);
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30"
      style={{ background: bg }}
    />
  );
}

// ─── Aurora background orbs ───
function Aurora() {
  const orbs = useMemo(() => [
    { color: "rgba(99,102,241,0.16)", w: 700, h: 700, x: ["-30%", "10%", "-20%"], y: ["-20%", "25%", "-20%"], dur: 22 },
    { color: "rgba(139,92,246,0.10)", w: 500, h: 500, x: ["60%", "30%", "60%"], y: ["10%", "40%", "10%"], dur: 28 },
    { color: "rgba(59,130,246,0.08)", w: 600, h: 600, x: ["20%", "55%", "20%"], y: ["50%", "10%", "50%"], dur: 35 },
  ], []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
    </div>
  );
}

// ─── Particle field ───
function Particles({ count = 40 }: { count?: number }) {
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ps.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: IND_BRIGHT }}
          animate={{ opacity: [0, p.opMax, 0], y: [0, -30, -60], scale: [1, 1.2, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Magnetic button ───
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

// ─── Spotlight card ───
function SpotlightCard({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bg = useMotionTemplate`radial-gradient(280px circle at ${mx}px ${my}px, rgba(99,102,241,0.12), transparent)`;

  return (
    <motion.div
      className={className}
      style={style}
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

// ─── 3-D tilt card ───
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
    ry.set(nx * 14);
    rx.set(-ny * 14);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX: rxS, rotateY: ryS, transformPerspective: 900 }}
      onMouseMove={handleMove}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Beta countdown hook ───
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

// ─── Countdown digit block ───
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

// ─── Beta launch section ───
interface BetaConfig {
  phase: string;
  launch_date: string | null;
  announcement: string | null;
  beta_slots: number;
}

const BETA_PERKS = [
  "100% free during beta",
  "Early adopter badge at v1.0",
  "Unlimited queries & features",
  "Shape the product directly",
];

function BetaSection({ downloadUrl, betaConfig }: { downloadUrl: string; betaConfig: BetaConfig | null }) {
  const time = useCountdown(betaConfig?.launch_date);
  const hasCountdown = !!time;
  const [betaUsers, setBetaUsers] = useState(2_412);

  useEffect(() => {
    const t = setInterval(() => setBetaUsers(p => p + (Math.random() > 0.5 ? 1 : 0)), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative py-24 px-5 overflow-hidden" style={{ background: "#06060e" }}>
      {/* BG radial glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 62%)" }} />
      <div className="pointer-events-none absolute inset-0 grid-bg" style={{ opacity: 0.35 }} />
      <Particles count={18} />

      {/* Edge lines */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 5%, rgba(99,102,241,0.55) 50%, transparent 95%)" }} />
      <div className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(99,102,241,0.25) 50%, transparent 90%)" }} />

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
          EARLY ACCESS BETA
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
            {betaUsers.toLocaleString()} joined
          </span>
        </motion.div>

        {/* Heading */}
        <Fade>
          <h2 className="font-bold text-white mb-5"
            style={{ fontSize: "clamp(32px, 6vw, 68px)", letterSpacing: "-0.045em", lineHeight: 1.06 }}>
            {hasCountdown ? (
              <>
                Beta access closes{" "}
                <span style={{
                  background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, #a78bfa 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>in</span>
              </>
            ) : (
              <>
                Free access,{" "}
                <span style={{
                  background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, #a78bfa 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>limited time.</span>
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
            <CountdownUnit value={time.days} label="Days" />
            <span className="font-bold mb-6 sm:mb-8" style={{ fontSize: "clamp(24px,4vw,36px)", color: "rgba(255,255,255,0.18)" }}>:</span>
            <CountdownUnit value={time.hours} label="Hours" />
            <span className="font-bold mb-6 sm:mb-8" style={{ fontSize: "clamp(24px,4vw,36px)", color: "rgba(255,255,255,0.18)" }}>:</span>
            <CountdownUnit value={time.minutes} label="Mins" />
            <span className="font-bold mb-6 sm:mb-8" style={{ fontSize: "clamp(24px,4vw,36px)", color: "rgba(255,255,255,0.18)" }}>:</span>
            <CountdownUnit value={time.seconds} label="Secs" />
          </Fade>
        )}

        {!hasCountdown && <div className="mb-10" />}

        {/* Perks */}
        <Fade delay={0.15} className="flex flex-wrap justify-center gap-2.5 mb-10">
          {BETA_PERKS.map(perk => (
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
              <span style={{ color: IND_BRIGHT }}>✓</span> {perk}
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
              className="flex items-center gap-3 px-9 py-4 rounded-full font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${IND} 0%, #7c3aed 100%)`,
                fontSize: "clamp(14px,1.8vw,16px)",
                boxShadow: "0 0 45px rgba(99,102,241,0.45)",
                letterSpacing: "-0.25px",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 1.5v10M4 8l4.5 5L13 8M1.5 14.5h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download for Windows — Free
            </motion.a>
          </Magnetic>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            Windows 10/11 · No sign-up · No credit card
          </p>
        </Fade>

      </div>
    </section>
  );
}

// ─── Number scramble counter ───
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

// ─── Fade-up on scroll ───
function Fade({ children, className = "", delay = 0, y = 36 }: {
  children: React.ReactNode; className?: string; delay?: number; y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ─── Hero gallery ───

interface GalleryItem {
  id: string;
  title: string | null;
  file_url: string;
  file_type: string;
  sort_order: number;
}

function HeroGallery({ items }: { items: GalleryItem[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // ms: set to 90% of video duration on load, or 6000 for images/gifs
  const [slideDuration, setSlideDuration] = useState(6000);

  // Reset duration to 6s default whenever we change slides
  useEffect(() => {
    const item = items[current];
    const isVid = item && ["mp4", "webm", "mov"].includes(item.file_type);
    if (!isVid) setSlideDuration(6000);
  }, [current, items]);

  // Auto-advance — uses setTimeout so it reacts to slideDuration updates
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setTimeout(() => setCurrent(c => (c + 1) % items.length), slideDuration);
    return () => clearTimeout(t);
  }, [current, slideDuration, items.length, paused]);

  const handleVideoMeta = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    if (d && isFinite(d)) setSlideDuration(Math.round(d * 0.95 * 1000));
  }, []);

  if (items.length === 0) {
    return (
      <div
        className="w-full rounded-2xl flex items-center justify-center"
        style={{
          aspectRatio: "16 / 10",
          background: "rgba(99,102,241,0.04)",
          border: "1px dashed rgba(99,102,241,0.18)",
        }}
      >
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.18)" }}>
          Add media in Admin → Hero Gallery
        </p>
      </div>
    );
  }

  const item = items[current];
  const isVideo = ["mp4", "webm", "mov"].includes(item.file_type);
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
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {isVideo ? (
            <video
              src={item.file_url}
              autoPlay muted playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={handleVideoMeta}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.file_url} alt={item.title ?? "DoDo demo"} className="w-full h-full object-cover" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Title overlay */}
      {item.title && (
        <div
          className="absolute bottom-0 inset-x-0 px-5 pb-4 pt-8 pointer-events-none"
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
              onClick={() => { setCurrent(i); setPaused(true); setSlideDuration(6000); }}
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

      {/* Progress bar — width animation driven by slideDuration */}
      {!paused && items.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
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

// ─── Nav ───
function Nav({ downloadUrl }: { downloadUrl: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

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
          <Image src="/icon.png" alt="DoDo" width={28} height={28} className="rounded-lg" style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.5))" }} />
          <span className="font-bold text-white text-sm" style={{ letterSpacing: "-0.4px" }}>DoDo</span>
        </div>
        <div className="hidden md:flex gap-7">
          {["Features", "How it works", "Use cases", "Pricing"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-xs text-white/55 hover:text-white transition-colors" style={{ letterSpacing: "-0.1px" }}>
              {l}
            </a>
          ))}
        </div>
        <Magnetic>
          <motion.a href={downloadUrl} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-full"
            style={{ background: IND, boxShadow: "0 0 20px rgba(99,102,241,0.35)", letterSpacing: "-0.1px" }}>
            Download Free
          </motion.a>
        </Magnetic>
      </div>
    </motion.nav>
  );
}

// ─── Typing headline ───
function TypedHeadline() {
  const lines = ["Your AI lives", "on your screen now."];
  return (
    <h1 className="font-bold leading-[1.02]" style={{ fontSize: "clamp(44px, 8vw, 96px)", letterSpacing: "-0.045em" }}>
      {lines.map((line, i) => (
        <motion.span key={i} className="block"
          initial={{ opacity: 0, y: 36, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.18 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          {i === 1
            ? (
              <span style={{
                background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, ${IND} 45%, #a78bfa 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {line}
              </span>
            )
            : <span className="text-white">{line}</span>
          }
        </motion.span>
      ))}
    </h1>
  );
}

// ─── Feature card ───
function FeatureCard({ icon, title, desc, badge, delay }: {
  icon: React.ReactNode; title: string; desc: string; badge?: string; delay: number;
}) {
  return (
    <Fade delay={delay}>
      <TiltCard>
        <SpotlightCard
          className="p-5 rounded-2xl h-full relative"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            transition: "border-color 0.2s",
          }}
        >
          <div className="flex items-start gap-2 mb-4">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)" }}
              whileHover={{ scale: 1.12, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {icon}
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

// ─── Step ───
function Step({ n, title, desc, icon, delay }: { n: string; title: string; desc: string; icon: React.ReactNode; delay: number }) {
  return (
    <Fade delay={delay} className="flex flex-col items-center text-center px-4">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative"
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
        whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}
        transition={{ type: "spring", stiffness: 380 }}
      >
        {icon}
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: IND }}>
          {n}
        </span>
      </motion.div>
      <h3 className="font-semibold text-white mb-2" style={{ fontSize: 17, letterSpacing: "-0.4px" }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-44" style={{ color: "rgba(255,255,255,0.48)" }}>{desc}</p>
    </Fade>
  );
}

// ─── Use case tabs ───
const USE_CASES = [
  { id: "dev", icon: "💻", label: "Developer", highlight: "No more IDE interruptions", story: `Reading a long error log in your terminal. Ctrl+Shift+Space → drag over the stacktrace → "Explain Error". DoDo explains root cause and suggests a fix right next to your terminal. Never open Chrome again.`, actions: ["⚡ Explain Error", "🔧 Fix Code", "📚 Search Docs", "👁 Review PR"] },
  { id: "student", icon: "📖", label: "Student", highlight: "Study 3× faster", story: `Dense academic PDF. Difficult abstract paragraph. Drag → "Summarize" → plain English in seconds. Then → "Create Flashcard" → 5 ready-to-study cards. No app switching, no copy-paste.`, actions: ["📋 Summarize", "🃏 Create Flashcard", "🔤 Define Terms", "❓ Quiz Me"] },
  { id: "office", icon: "📧", label: "Office", highlight: "Office Pro profile built-in", story: `Formal English email arrived, need a polished reply. Drag email → "Draft Reply" → DoDo (Office Pro profile) writes a professional, correct-tone draft. Copy, paste, send. Done in 15 seconds.`, actions: ["✍️ Draft Reply", "🌐 Translate", "📊 Summarize Report", "🎯 Reformat"] },
  { id: "creator", icon: "✨", label: "Creator", highlight: "Your brand voice, always", story: `Writing a post. Spotted great competitor copy. Drag → "Rewrite for My Brand" → DoDo rewrites it in your voice. Inspired, not plagiarized.`, actions: ["🔄 Rewrite", "🎨 Improve Tone", "💡 Generate Headline", "✅ Grammar Check"] },
];

function UseCaseTabs() {
  const [active, setActive] = useState(0);
  return (
    <Fade>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {USE_CASES.map((uc, i) => (
          <motion.button key={uc.id} onClick={() => setActive(i)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: active === i ? IND : "rgba(255,255,255,0.05)",
              color: active === i ? "white" : "rgba(255,255,255,0.5)",
              border: active === i ? `1px solid ${IND}` : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.2s ease",
              boxShadow: active === i ? "0 0 24px rgba(99,102,241,0.3)" : "none",
            }}>
            {uc.icon} {uc.label}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -18, filter: "blur(4px)" }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SpotlightCard
            className="p-6 rounded-2xl relative"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{USE_CASES[active].icon}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,0.14)", color: IND_BRIGHT, border: "1px solid rgba(99,102,241,0.25)" }}>
                {USE_CASES[active].highlight}
              </span>
            </div>
            <p className="leading-relaxed" style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>
              &ldquo;{USE_CASES[active].story}&rdquo;
            </p>
          </SpotlightCard>
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Quick actions</p>
            {USE_CASES[active].actions.map((a, i) => (
              <motion.div key={a}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}
                whileHover={{ x: 4 }}
              >
                <span className="text-sm">{a.split(" ")[0]}</span>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>{a.split(" ").slice(1).join(" ")}</span>
                <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>{i + 1}</kbd>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </Fade>
  );
}

// ─── Pricing ───
function PricingCard({ plan, price, period, features, cta, highlighted, badge, downloadUrl = "#" }: {
  plan: string; price: string; period: string; features: string[]; cta: string; highlighted?: boolean; badge?: string; downloadUrl?: string;
}) {
  return (
    <TiltCard>
      <SpotlightCard
        className="relative p-6 rounded-2xl flex flex-col h-full"
        style={{
          background: highlighted ? "linear-gradient(145deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.07) 100%)" : "rgba(255,255,255,0.03)",
          border: highlighted ? "1px solid rgba(99,102,241,0.45)" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: highlighted ? "0 0 80px rgba(99,102,241,0.18)" : "none",
        }}>
        {badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
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
              <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="7" fill={highlighted ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"} />
                <path d="M4.5 7.5l2.5 2.5 4-5" stroke={highlighted ? IND_BRIGHT : "rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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

// ─── Main ───
export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.4]);
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
    const t = setInterval(() => setLiveCount(p => p + Math.floor(Math.random() * 3) + 1), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: BG, color: "#f8fafc", fontFamily: "var(--font-inter)" }}>
      <CursorGlow />
      <Nav downloadUrl={downloadUrl} />

      {/* ═══ HERO ═══ */}
      <section className="relative flex flex-col items-center justify-center text-center overflow-hidden min-h-screen px-5 pt-24 pb-20"
        style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0a14 60%, ${BG} 100%)` }}>
        <Aurora />
        <Particles count={55} />
        {/* Grid */}
        <div className="pointer-events-none absolute inset-0 grid-bg" />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 w-full max-w-4xl mx-auto">
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
            Public beta — {liveCount.toLocaleString()} queries answered
            <motion.span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: IND, color: "white" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              FREE
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
            Press one shortcut. Select any area on your screen. Get instant AI help —
            without leaving what you&apos;re doing.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.65 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-4"
          >
            <Magnetic strength={0.4}>
              <motion.a
                href={downloadUrl}
                whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.93 }}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white text-sm"
                style={{ background: IND, letterSpacing: "-0.2px", boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 1.5v9M3.5 7l4 4.5 4-4.5M1.5 13h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download for Windows — Free
              </motion.a>
            </Magnetic>
            <motion.a href="#features"
              whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", letterSpacing: "-0.2px" }}>
              See how it works
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.a>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Windows 10/11 · v{latestVersion}-beta · No sign-up required
          </motion.p>
        </motion.div>

        {/* Demo */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[800px] mx-auto mt-14 px-4"
        >
          <HeroGallery items={galleryItems} />
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

      {/* ═══ BETA LAUNCH ═══ */}
      <BetaSection downloadUrl={downloadUrl} betaConfig={betaConfig} />

      {/* ═══ PROBLEM ═══ */}
      <section className="py-24 px-5" style={{ background: "#0b0b16" }}>
        <div className="max-w-5xl mx-auto text-center">
          <Fade>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: IND_BRIGHT, letterSpacing: "0.1em" }}>The invisible tax</p>
            <h2 className="font-bold text-white mb-6" style={{ fontSize: "clamp(28px, 5vw, 56px)", letterSpacing: "-0.045em", lineHeight: 1.1 }}>
              You&apos;re wasting{" "}
              <span style={{ background: `linear-gradient(135deg, ${IND_BRIGHT}, #a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                <ScrambleCounter to={8.7} suffix=" days" decimals={1} />
              </span>
              {" "}of focus a year
            </h2>
            <p className="max-w-2xl mx-auto mb-14" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.48)", letterSpacing: "-0.2px" }}>
              50 context switches a day × 60 seconds each × 250 workdays ={" "}
              <strong style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>208 hours</strong>.
              Not counting the time to get your focus back after every interrupt.
            </p>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Fade delay={0.05}>
              <div className="p-5 rounded-2xl text-left h-full"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.14)" }}>
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Without DoDo</p>
                {["Stop what you're doing", "Open browser / new tab", "Navigate to ChatGPT / Claude", "Screenshot or copy-paste content", "Type your question", "Read result, switch context back"].map((s, i) => (
                  <motion.div key={i} className="flex items-center gap-2.5 py-1.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}>
                    <span className="text-red-500/60 font-bold">×</span>
                    {s}
                  </motion.div>
                ))}
                <div className="mt-4 pt-4 text-sm font-semibold text-red-400"
                  style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }}>
                  30–90 seconds · broken focus
                </div>
              </div>
            </Fade>
            <Fade delay={0.1}>
              <div className="p-5 rounded-2xl text-left h-full"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.22)", boxShadow: "0 0 40px rgba(99,102,241,0.1)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: IND_BRIGHT }}>With DoDo</p>
                {["Press Ctrl+Shift+Space", "Drag to select area", "Pick an action, done"].map((s, i) => (
                  <motion.div key={i} className="flex items-center gap-2.5 py-1.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}>
                    <span style={{ color: IND_BRIGHT, fontWeight: "bold" }}>✓</span>
                    {s}
                  </motion.div>
                ))}
                <div className="mt-4 pt-4 text-sm font-semibold"
                  style={{ borderTop: "1px solid rgba(99,102,241,0.18)", color: IND_BRIGHT }}>
                  {"< 5 seconds · never leave your screen"}
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 px-5" style={{ background: BG }}>
        <div className="max-w-4xl mx-auto text-center">
          <Fade>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: IND_BRIGHT, letterSpacing: "0.1em" }}>3 steps · {"<"} 5 seconds</p>
            <h2 className="font-bold text-white mb-16" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              Instant AI. Zero friction.
            </h2>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-7 left-1/4 right-1/4 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.35), transparent)" }} />
            <Step n="1" delay={0} title="Press the shortcut"
              desc="Ctrl+Shift+Space from any app — IDE, browser, PDF, terminal, game."
              icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="5" width="18" height="12" rx="2" stroke={IND_BRIGHT} strokeWidth="1.5" /><rect x="5" y="8" width="3" height="2.5" rx="0.5" fill={IND_BRIGHT} opacity="0.7" /><rect x="9.5" y="8" width="3" height="2.5" rx="0.5" fill={IND_BRIGHT} opacity="0.7" /><rect x="14" y="8" width="3" height="2.5" rx="0.5" fill={IND_BRIGHT} opacity="0.7" /><rect x="7" y="12" width="8" height="2" rx="0.5" fill={IND_BRIGHT} /></svg>}
            />
            <Step n="2" delay={0.1} title="Select any area"
              desc="Drag over text, code, images, video. Any pixel on your screen."
              icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke={IND_BRIGHT} strokeWidth="1.5" strokeDasharray="2 1.8" /><path d="M13.5 12l5.5 5.5" stroke={IND_BRIGHT} strokeWidth="1.5" strokeLinecap="round" /><circle cx="13.5" cy="12" r="2.5" stroke={IND_BRIGHT} strokeWidth="1.5" /></svg>}
            />
            <Step n="3" delay={0.2} title="Get instant answer"
              desc="AI reads via OCR + Vision. Answer streams in a floating window beside you."
              icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 7h16M3 11h12M3 15h8" stroke={IND_BRIGHT} strokeWidth="1.5" strokeLinecap="round" /><circle cx="18" cy="15" r="3.5" stroke={IND_BRIGHT} strokeWidth="1.5" /><path d="M17.3 15l1 1L20 13.5" stroke={IND_BRIGHT} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 px-5" style={{ background: "#0b0b16" }}>
        <div className="max-w-5xl mx-auto">
          <Fade className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: IND_BRIGHT, letterSpacing: "0.1em" }}>Features</p>
            <h2 className="font-bold text-white" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              Everything your AI<br />needs to keep up
            </h2>
          </Fade>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard delay={0} badge="Core" title="Screenshot → AI Instant"
              desc="Tesseract v5 OCR + Claude Vision reads any screen content — PDF, video, locked app. If you can see it, DoDo can answer it."
              icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke={IND_BRIGHT} strokeWidth="1.5" /><path d="M5 9h8M5 6h8M5 12h4" stroke={IND_BRIGHT} strokeWidth="1.4" strokeLinecap="round" /></svg>}
            />
            <FeatureCard delay={0.05} title="Adaptive Commands"
              desc="Commands reorder by your usage frequency. The action you need is always first. Zero scroll, zero hunting."
              icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M3 9h8M3 13h5" stroke={IND_BRIGHT} strokeWidth="1.5" strokeLinecap="round" /><circle cx="14" cy="13" r="3" stroke={IND_BRIGHT} strokeWidth="1.3" /><path d="M13 13l.8.8 1.5-1.6" stroke={IND_BRIGHT} strokeWidth="1.2" strokeLinecap="round" /></svg>}
            />
            <FeatureCard delay={0.1} badge="5 profiles" title="AI Profile System"
              desc="Study Buddy, Office Pro, Research Helper, Language Coach, General — switch in one click inside the popup."
              icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke={IND_BRIGHT} strokeWidth="1.5" /><path d="M2 16c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke={IND_BRIGHT} strokeWidth="1.5" strokeLinecap="round" /></svg>}
            />
            <FeatureCard delay={0.15} badge="MCP" title="MCP Tool Ecosystem"
              desc="DoDo doesn't just answer — it acts. Brave Search, Filesystem, GitHub, Memory. Same standard as Cursor & Claude Desktop."
              icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="9" r="2.5" stroke={IND_BRIGHT} strokeWidth="1.5" /><circle cx="14" cy="4" r="2.5" stroke={IND_BRIGHT} strokeWidth="1.5" /><circle cx="14" cy="14" r="2.5" stroke={IND_BRIGHT} strokeWidth="1.5" /><path d="M6 8l6-3M6 10l6 3" stroke={IND_BRIGHT} strokeWidth="1.3" strokeLinecap="round" /></svg>}
            />
            <FeatureCard delay={0.2} title="QuickChat Mode"
              desc="Floating mini chat always on screen. Type, attach image, multi-step compose. Your AI pinned exactly where you need it."
              icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14v10H2z" stroke={IND_BRIGHT} strokeWidth="1.5" rx="2" /><path d="M5 8h8M5 11h5" stroke={IND_BRIGHT} strokeWidth="1.4" strokeLinecap="round" /></svg>}
            />
            <FeatureCard delay={0.25} title="History Browser"
              desc="Every question, screenshot and answer saved — searchable with thumbnail previews and timestamps."
              icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3h12v12H3z" stroke={IND_BRIGHT} strokeWidth="1.5" rx="2" /><path d="M3 7h12M7 7v8" stroke={IND_BRIGHT} strokeWidth="1.4" strokeLinecap="round" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section id="use-cases" className="py-24 px-5" style={{ background: BG }}>
        <div className="max-w-4xl mx-auto">
          <Fade className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: IND_BRIGHT, letterSpacing: "0.1em" }}>For every workflow</p>
            <h2 className="font-bold text-white" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              Built for how you<br />actually work
            </h2>
          </Fade>
          <UseCaseTabs />
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="py-24 px-5" style={{ background: "#0b0b16" }}>
        <div className="max-w-5xl mx-auto">
          <Fade className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { n: 12000, s: "+", label: "Beta users", d: 0 },
              { n: 2.3, s: "M", label: "Queries answered", d: 1 },
              { n: 4.8, s: "/5", label: "App rating", d: 1 },
              { n: 98, s: "%", label: "Day-7 retention", d: 0 },
            ].map((stat) => (
              <TiltCard key={stat.label}>
                <SpotlightCard className="p-5 rounded-2xl text-center"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <p className="font-bold text-white mb-1" style={{ fontSize: 34, letterSpacing: "-1.8px" }}>
                    <ScrambleCounter to={stat.n} suffix={stat.s} decimals={stat.d} />
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
                </SpotlightCard>
              </TiltCard>
            ))}
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { q: "I use DoDo 40–50 times a day. It feels like having a second brain that's always awake and never interrupts my flow.", a: "Minh T.", r: "Senior Backend Engineer" },
              { q: "As a researcher reading 10 papers a day, DoDo's Summarize + Flashcard cut my reading time by 40%. The profile switching is incredible.", a: "Thu N.", r: "PhD Candidate, CS" },
              { q: "The Office Pro profile writes emails better than I do. Polite, firm, professional. I use it for every difficult reply.", a: "Lan P.", r: "Project Manager" },
            ].map((t, i) => (
              <Fade key={i} delay={i * 0.08}>
                <TiltCard>
                  <SpotlightCard className="p-5 rounded-2xl h-full"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} width="13" height="13" viewBox="0 0 13 13">
                          <path d="M6.5 1.5l1.5 3.2 3.5.5-2.5 2.5.6 3.5-3.1-1.6-3.1 1.6.6-3.5-2.5-2.5 3.5-.5z" fill={IND_BRIGHT} />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.68)" }}>&ldquo;{t.q}&rdquo;</p>
                    <div>
                      <p className="text-xs font-semibold text-white">{t.a}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{t.r}</p>
                    </div>
                  </SpotlightCard>
                </TiltCard>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-24 px-5" style={{ background: BG }}>
        <div className="max-w-5xl mx-auto">
          <Fade className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: IND_BRIGHT, letterSpacing: "0.1em" }}>Pricing</p>
            <h2 className="font-bold text-white mb-3" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.045em" }}>
              Start free. Upgrade when ready.
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.4)" }}>No credit card required · Cancel anytime</p>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            <Fade delay={0}>
              <PricingCard plan="Free" price="$0" period="" cta="Download Free"
                features={["50 queries / month", "2 AI profiles", "Basic commands only", "7-day history", "Windows only"]} />
            </Fade>
            <Fade delay={0.08}>
              <PricingCard plan="Pro" price="$9" period="/mo" highlighted badge="Most popular" cta="Start Pro Trial" downloadUrl={downloadUrl}
                features={["Unlimited queries", "5 profiles + custom", "All MCP tools", "Claude Sonnet & GPT-4o", "Unlimited history", "Priority support"]} />
            </Fade>
            <Fade delay={0.16}>
              <PricingCard plan="Team" price="$19" period="/user/mo" cta="Contact Sales"
                features={["Everything in Pro", "Shared team profiles", "Analytics dashboard", "Admin controls + SSO", "Dedicated support"]} />
            </Fade>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER CTA ═══ */}
      <section className="py-28 px-5 text-center relative overflow-hidden" style={{ background: "#07070f" }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(99,102,241,0.16) 0%, transparent 68%)" }} />
        <Aurora />
        <div className="relative z-10 max-w-xl mx-auto">
          <Fade>
            <motion.div className="mx-auto mb-8 rounded-2xl flex items-center justify-center"
              style={{ width: 72, height: 72, boxShadow: "0 0 80px rgba(99,102,241,0.5)" }}
              animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}>
              <Image src="/icon.png" alt="DoDo" width={72} height={72} className="rounded-2xl" />
            </motion.div>
            <h2 className="font-bold text-white mb-5" style={{ fontSize: "clamp(36px, 6vw, 72px)", letterSpacing: "-0.045em", lineHeight: 1.04 }}>
              Stop switching tabs.<br />
              <span style={{ background: `linear-gradient(135deg, ${IND_BRIGHT} 0%, ${IND} 50%, #a78bfa 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Start doing.
              </span>
            </h2>
            <p className="mb-10 text-lg" style={{ color: "rgba(255,255,255,0.42)", letterSpacing: "-0.25px" }}>
              See something. Ask AI instantly. Right on your screen.
            </p>
            <Magnetic strength={0.3}>
              <motion.a href={downloadUrl}
                whileHover={{ scale: 1.07, boxShadow: "0 0 70px rgba(99,102,241,0.7)" }}
                whileTap={{ scale: 0.93 }}
                className="inline-flex items-center gap-3 px-9 py-4 rounded-full font-bold text-white text-base"
                style={{ background: IND, boxShadow: "0 0 40px rgba(99,102,241,0.45)", letterSpacing: "-0.25px" }}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M8.5 1.5v10M4 8l4.5 5L13 8M1.5 14.5h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download DoDo for Windows — Free
              </motion.a>
            </Magnetic>
            <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              Windows 10/11 · v{latestVersion}-beta · No sign-up required
            </p>
          </Fade>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-10 px-5" style={{ background: "#060609", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="DoDo" width={24} height={24} className="rounded-md opacity-80" />
            <span className="font-bold text-white text-sm">DoDo</span>
            <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.2)" }}>
              See something. Ask AI instantly.
            </span>
          </div>
          <nav className="flex flex-wrap gap-5">
            {["Privacy", "Terms", "Support", "Blog", "Changelog"].map((l) => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                {l}
              </a>
            ))}
            <Link href="/admin" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
              Admin
            </Link>
          </nav>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>© 2025 DoDo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
