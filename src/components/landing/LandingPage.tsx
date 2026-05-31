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

// ─── Multi-scenario App Demo ───

interface Cmd { icon: string; label: string; shortcut: string; highlight?: boolean }
interface ScenarioDef {
  id: string; tabIcon: string; tabLabel: string; audience: string;
  appName: string; titleBarBg: string; appBg: string; isDark: boolean;
  selTop: number; selHeight: number;
  popupTop: number; popupLeft: number;
  commands: Cmd[]; response: string; profile: string; copyLabel: string;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: "pdf", tabIcon: "📚", tabLabel: "Student", audience: "Students",
    appName: "Deep Learning — Chapter 4.pdf",
    titleBarBg: "#e8e5de", appBg: "#f9f6ef", isDark: false,
    selTop: 112, selHeight: 68, popupTop: 184, popupLeft: 12,
    commands: [
      { icon: "📋", label: "Summarize", shortcut: "↵", highlight: true },
      { icon: "🗣️", label: "Simplify", shortcut: "2" },
      { icon: "🃏", label: "Make Flashcard", shortcut: "3" },
      { icon: "🌐", label: "Translate VN", shortcut: "4" },
    ],
    profile: "Study Buddy",
    response: "**In plain English:**\n\nBackpropagation is how a neural network learns from its mistakes.\n\nIt calculates how much each weight contributed to the error, then nudges every weight in the direction that reduces it.\n\nRepeat millions of times → the network gets smarter.",
    copyLabel: "Save as flashcard",
  },
  {
    id: "translate", tabIcon: "🌐", tabLabel: "Translate", audience: "Everyone",
    appName: "The Verge — Chrome",
    titleBarBg: "#e8eaf6", appBg: "#ffffff", isDark: false,
    selTop: 100, selHeight: 60, popupTop: 165, popupLeft: 10,
    commands: [
      { icon: "🇻🇳", label: "Translate to VN", shortcut: "↵", highlight: true },
      { icon: "📋", label: "Summarize", shortcut: "2" },
      { icon: "🔤", label: "Define Terms", shortcut: "3" },
      { icon: "📝", label: "Rewrite Simpler", shortcut: "4" },
    ],
    profile: "Language Coach",
    response: "**Bản dịch tiếng Việt:**\n\nCác mô hình AI thế hệ tiếp theo đã đạt được hiệu suất vượt ngưỡng con người trong 5 lĩnh vực cốt lõi, theo báo cáo được công bố hôm nay.\n\nĐây là lần đầu tiên các hệ thống này vượt qua chuyên gia ở cả ngôn ngữ lẫn lập luận logic.",
    copyLabel: "Copy translation",
  },
  {
    id: "email", tabIcon: "📧", tabLabel: "Office", audience: "Office Workers",
    appName: "Inbox — Outlook",
    titleBarBg: "#0078d4", appBg: "#ffffff", isDark: false,
    selTop: 108, selHeight: 72, popupTop: 185, popupLeft: 10,
    commands: [
      { icon: "✍️", label: "Draft Reply", shortcut: "↵", highlight: true },
      { icon: "📋", label: "Summarize", shortcut: "2" },
      { icon: "🎯", label: "Extract Actions", shortcut: "3" },
      { icon: "🌐", label: "Translate", shortcut: "4" },
    ],
    profile: "Office Pro",
    response: "Dear Sarah,\n\nThank you for following up on the Q4 timeline.\n\nI can confirm we are on schedule — 87% of milestones are complete and the December 15th delivery date is firm.\n\nI'll send a detailed status report by Friday.\n\nBest regards,",
    copyLabel: "Copy to clipboard",
  },
  {
    id: "image", tabIcon: "🖼️", tabLabel: "Image AI", audience: "Everyone",
    appName: "Screenshot — Physics Lecture Notes",
    titleBarBg: "#1e1e2e", appBg: "#13131f", isDark: true,
    selTop: 90, selHeight: 130, popupTop: 224, popupLeft: 8,
    commands: [
      { icon: "🔍", label: "Explain Diagram", shortcut: "↵", highlight: true },
      { icon: "📝", label: "Summarize Notes", shortcut: "2" },
      { icon: "❓", label: "Quiz Me", shortcut: "3" },
      { icon: "🌐", label: "Translate", shortcut: "4" },
    ],
    profile: "Study Buddy",
    response: "**What this diagram shows:**\n\nThis is a free-body diagram for an inclined plane problem.\n\nForces shown:\n• Weight (mg) pointing down\n• Normal force (N) perpendicular to surface\n• Friction (f) opposing motion up the slope\n\n**To solve:** decompose mg into components parallel and perpendicular to the slope.",
    copyLabel: "Save explanation",
  },
  {
    id: "code", tabIcon: "💻", tabLabel: "Developer", audience: "Developers",
    appName: "fetchUser.ts — VS Code",
    titleBarBg: "#161b22", appBg: "#0d1117", isDark: true,
    selTop: 120, selHeight: 48, popupTop: 172, popupLeft: 6,
    commands: [
      { icon: "⚡", label: "Explain Error", shortcut: "↵", highlight: true },
      { icon: "🔧", label: "Fix Code", shortcut: "2" },
      { icon: "📖", label: "Search Docs", shortcut: "3" },
      { icon: "📋", label: "Copy Stacktrace", shortcut: "4" },
    ],
    profile: "General",
    response: "This TypeError happens because `db.query()` is async but you forgot **await**.\n\nVariable `rows` holds a Promise — not real data — so `rows.length` is undefined.\n\n**Fix:**\nAdd `await` before db.query(). Done.",
    copyLabel: "Copy fix",
  },
];

// ─── Content renderers per scenario ───
function CodeAppContent() {
  const lines = [
    [{ t: "import ", c: "keyword" }, { t: "{ db }", c: "" }, { t: " from ", c: "keyword" }, { t: "'./database'", c: "string" }],
    [] as { t: string; c: string }[],
    [{ t: "async function ", c: "keyword" }, { t: "fetchUser", c: "function" }, { t: "(id: number) {", c: "" }],
    [{ t: "  const ", c: "keyword" }, { t: "rows", c: "" }, { t: " = db.", c: "" }, { t: "query", c: "function" }, { t: "('SELECT * FROM users WHERE id=$1', [id]);", c: "string" }],
    [{ t: "  if (!", c: "" }, { t: "rows", c: "error" }, { t: ".length) throw new ", c: "" }, { t: "Error", c: "function" }, { t: "(", c: "" }, { t: "'Not found'", c: "string" }, { t: ");", c: "" }],
    [{ t: "  return ", c: "keyword" }, { t: "rows[0];", c: "" }],
    [{ t: "}", c: "" }],
    [] as { t: string; c: string }[],
    [{ t: "// 💥 TypeError: Cannot read properties of undefined", c: "error" }],
    [{ t: "//    reading 'length'  at fetchUser (app.ts:5:9)", c: "error" }],
  ];
  return (
    <div className="flex h-full" style={{ fontFamily: "monospace", fontSize: 12.5 }}>
      <div className="pt-3.5 text-right pr-3 select-none shrink-0" style={{ color: "#3d4450", minWidth: 36 }}>
        {lines.map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
      </div>
      <div className="flex-1 pt-3.5 px-2 overflow-hidden">
        {lines.map((line, i) => (
          <div key={i} className="leading-6 whitespace-nowrap">
            {line.map((tok, j) => (
              <span key={j} className={
                tok.c === "keyword" ? "code-keyword" : tok.c === "function" ? "code-function" :
                tok.c === "string" ? "code-string" : tok.c === "error" ? "code-error" : "text-slate-300"
              }>{tok.t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PDFAppContent() {
  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 11.5, color: "#2a2a2a", padding: "16px 20px", lineHeight: 1.7 }}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>Chapter 4 · Optimization Algorithms</p>
        <p style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>4.2 Backpropagation and Gradient Descent</p>
      </div>
      <p style={{ textAlign: "justify", marginBottom: 8, color: "#444" }}>
        The backpropagation algorithm, introduced by Rumelhart, Hinton and Williams (1986), provides an efficient method for computing the gradient of the loss function with respect to all weights in the network using the chain rule of calculus.
      </p>
      <p style={{ textAlign: "justify", background: "rgba(255,220,50,0.25)", padding: "4px 2px", borderRadius: 2 }}>
        Formally, given a loss L and weight wᵢⱼ, the update rule is: Δwᵢⱼ = −η · ∂L/∂wᵢⱼ where η denotes the learning rate. This partial derivative is computed by propagating error signals backwards through each layer, hence the name &ldquo;backpropagation.&rdquo;
      </p>
      <p style={{ textAlign: "justify", marginTop: 8, color: "#555", fontSize: 10.5 }}>
        In practice, stochastic gradient descent (SGD) and its variants (Adam, RMSProp, AdaGrad) are used to handle large datasets by approximating the true gradient using mini-batches...
      </p>
    </div>
  );
}

function BrowserAppContent() {
  return (
    <div style={{ fontSize: 12, color: "#1a1a1a" }}>
      {/* Browser bar */}
      <div style={{ background: "#f1f3f4", borderBottom: "1px solid #dadce0", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: 20, padding: "3px 12px", fontSize: 11, color: "#5f6368", flex: 1 }}>
          theverge.com/ai/2025/breakthrough-models
        </div>
      </div>
      <div style={{ padding: "14px 18px", background: "#fff" }}>
        <p style={{ fontSize: 11, color: "#5f6368", marginBottom: 5 }}>THE VERGE · AI · May 29, 2025</p>
        <h2 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 10, fontFamily: "system-ui" }}>
          AI Models Surpass Human Performance Across Five Core Domains in New Benchmark
        </h2>
        <p style={{ lineHeight: 1.65, color: "#333", background: "rgba(99,102,241,0.07)", padding: "5px 3px", borderRadius: 3 }}>
          Next-generation AI models have achieved superhuman performance across five core domains — language understanding, logical reasoning, visual analysis, mathematical problem-solving, and code generation — according to a comprehensive report published today by the Stanford AI Lab.
        </p>
        <p style={{ lineHeight: 1.65, color: "#555", marginTop: 8, fontSize: 11.5 }}>
          The findings mark the first time a single system has simultaneously exceeded expert-level benchmarks in all five areas, a milestone researchers call &ldquo;the threshold crossing.&rdquo; Industry implications are expected to be significant...
        </p>
      </div>
    </div>
  );
}

function EmailAppContent() {
  return (
    <div style={{ fontSize: 12, color: "#1a1a1a", background: "#fff" }}>
      {/* Toolbar */}
      <div style={{ background: "#0078d4", padding: "6px 12px", display: "flex", gap: 12 }}>
        {["Reply", "Reply All", "Forward", "Delete"].map(a => (
          <span key={a} style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{a}</span>
        ))}
      </div>
      {/* Email header */}
      <div style={{ borderBottom: "1px solid #edebe9", padding: "10px 14px" }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>RE: Q4 Platform Migration — Delivery Confirmation</p>
        <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", gap: 2, fontSize: 11, color: "#605e5c" }}>
          <span>From:</span><span style={{ color: "#1a1a1a" }}>sarah.chen@acmecorp.com</span>
          <span>To:</span><span style={{ color: "#1a1a1a" }}>you@acmecorp.com</span>
          <span>Date:</span><span>Thu, 29 May 2025 · 3:42 PM</span>
        </div>
      </div>
      {/* Email body */}
      <div style={{ padding: "12px 14px", lineHeight: 1.65, background: "rgba(99,102,241,0.04)" }}>
        <p>Hi team,</p>
        <p style={{ marginTop: 6 }}>I wanted to follow up on our discussion from last Thursday about the Q4 platform migration. The steering committee needs final confirmation on whether the cutover will be completed before the <strong>December 15th board presentation</strong>.</p>
        <p style={{ marginTop: 6, color: "#605e5c", fontSize: 11 }}>Could you also confirm the rollback plan and downtime window? Please reply by EOD Friday. — Sarah</p>
      </div>
    </div>
  );
}

function ImageAppContent() {
  return (
    <div style={{ background: "#1a1a2e", padding: 14, height: "100%" }}>
      {/* Fake "screenshot" of whiteboard/notes */}
      <div style={{ background: "#f0ede6", borderRadius: 8, padding: 14, fontFamily: "sans-serif", minHeight: 220, position: "relative" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 8, borderBottom: "1px solid #ccc", paddingBottom: 4 }}>Physics 101 — Forces on Inclined Plane</p>
        {/* Diagram */}
        <svg width="100%" viewBox="0 0 300 150" style={{ display: "block", marginBottom: 8 }}>
          {/* Inclined plane triangle */}
          <polygon points="30,130 250,130 250,50" fill="none" stroke="#555" strokeWidth="2"/>
          {/* Block on slope */}
          <rect x="130" y="76" width="26" height="20" fill="#6366f1" opacity="0.85" transform="rotate(-18,143,86)"/>
          {/* Weight arrow */}
          <line x1="143" y1="100" x2="143" y2="135" stroke="#e53e3e" strokeWidth="2" markerEnd="url(#a)"/>
          <text x="148" y="128" fontSize="10" fill="#e53e3e" fontWeight="bold">mg</text>
          {/* Normal arrow */}
          <line x1="143" y1="86" x2="118" y2="58" stroke="#2b6cb0" strokeWidth="2"/>
          <text x="100" y="55" fontSize="10" fill="#2b6cb0" fontWeight="bold">N</text>
          {/* Friction arrow */}
          <line x1="155" y1="82" x2="195" y2="68" stroke="#276749" strokeWidth="2"/>
          <text x="194" y="63" fontSize="10" fill="#276749" fontWeight="bold">f</text>
          {/* Angle */}
          <path d="M220,130 A25,25,0,0,0,222,108" fill="none" stroke="#888" strokeWidth="1.5"/>
          <text x="213" y="122" fontSize="9" fill="#666">θ=30°</text>
          <defs><marker id="a" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#e53e3e"/></marker></defs>
        </svg>
        <p style={{ fontSize: 10, color: "#555", lineHeight: 1.5 }}>
          Block mass m=5kg, θ=30°, μₖ=0.2. Find acceleration a down the slope.
        </p>
        <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 9, color: "#aaa" }}>Lecture 7 · Prof. Nguyen</div>
      </div>
    </div>
  );
}

const CONTENT_RENDERERS = [PDFAppContent, BrowserAppContent, EmailAppContent, ImageAppContent, CodeAppContent];

// ─── Streaming response renderer ───
function StreamRenderer({ text, total }: { text: string; total: number }) {
  return (
    <div className="text-xs leading-[1.7]" style={{ color: "rgba(255,255,255,0.82)" }}>
      {text.split("\n").map((line, i) => {
        if (!line) return <br key={i} />;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-bold mt-1.5" style={{ color: IND_BRIGHT }}>{line.replace(/\*\*/g, "")}</p>;
        if (line.startsWith("**"))
          return <p key={i} className="font-semibold mt-1" style={{ color: IND_BRIGHT }}>{line.replace(/\*\*/g, "")}</p>;
        if (line.startsWith("• ") || line.startsWith("- "))
          return <p key={i} className="mt-0.5 pl-2">{line}</p>;
        if (line.startsWith("`") && line.endsWith("`"))
          return <code key={i} className="block mt-1 px-2 py-1 rounded font-mono code-function" style={{ background: "rgba(99,102,241,0.12)", fontSize: 11 }}>{line.replace(/`/g, "")}</code>;
        return <p key={i} className={i > 0 ? "mt-0.5" : ""}>{line}</p>;
      })}
      {text.length < total && (
        <motion.span className="inline-block w-0.5 h-3 ml-0.5 rounded-full align-middle"
          style={{ background: IND_BRIGHT }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.45, repeat: Infinity }} />
      )}
    </div>
  );
}

function AppDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [streamText, setStreamText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(true);
  const scenarioIdxRef = useRef(0);

  const clearAll = useCallback(() => {
    if (streamRef.current) clearInterval(streamRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const runScenario = useCallback((idx: number) => {
    clearAll();
    setPhase(0); setStreamText(""); setElapsed(0); setProgress(0);
    scenarioIdxRef.current = idx;
    setScenarioIdx(idx);

    const sc = SCENARIOS[idx];
    const SCENARIO_DURATION = 13000; // ms total before advancing
    const progressStart = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStart;
      setProgress(Math.min((elapsed / SCENARIO_DURATION) * 100, 100));
    }, 50);

    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1900);
    const t3 = setTimeout(() => setPhase(3), 3100);
    const t4 = setTimeout(() => {
      setPhase(4);
      elapsedRef.current = setInterval(() => setElapsed(p => +(p + 0.1).toFixed(1)), 100);
      let i = 0;
      streamRef.current = setInterval(() => {
        i += 5;
        setStreamText(sc.response.slice(0, i));
        if (i >= sc.response.length) {
          clearInterval(streamRef.current!);
          clearInterval(elapsedRef.current!);
        }
      }, 22);
    }, 3900);

    // Auto-advance after scenario duration
    const tNext = setTimeout(() => {
      if (!activeRef.current) return;
      const next = (scenarioIdxRef.current + 1) % SCENARIOS.length;
      runScenario(next);
    }, SCENARIO_DURATION);

    return () => { [t1, t2, t3, t4, tNext].forEach(clearTimeout); };
  }, [clearAll]);

  useEffect(() => {
    activeRef.current = true;
    const cleanup = runScenario(0);
    return () => {
      activeRef.current = false;
      cleanup?.();
      clearAll();
    };
  }, [runScenario, clearAll]);

  const sc = SCENARIOS[scenarioIdx];
  const ContentRenderer = CONTENT_RENDERERS[scenarioIdx];

  return (
    <div className="select-none" style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Scenario tab pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {SCENARIOS.map((s, i) => (
          <motion.button
            key={s.id}
            onClick={() => { if (i !== scenarioIdx) runScenario(i); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: i === scenarioIdx ? IND : "rgba(255,255,255,0.06)",
              color: i === scenarioIdx ? "white" : "rgba(255,255,255,0.45)",
              border: i === scenarioIdx ? `1px solid ${IND}` : "1px solid rgba(255,255,255,0.08)",
              boxShadow: i === scenarioIdx ? `0 0 16px rgba(99,102,241,0.4)` : "none",
            }}
          >
            <span>{s.tabIcon}</span>
            {s.tabLabel}
          </motion.button>
        ))}
      </div>

      {/* Main window */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 16,
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px rgba(99,102,241,0.15)",
        }}
      >
        {/* Title bar */}
        <AnimatePresence mode="wait">
          <motion.div key={sc.appName}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 px-4 h-9 shrink-0"
            style={{ background: sc.titleBarBg, borderBottom: `1px solid ${sc.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"}` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-3 text-[11px]" style={{ fontFamily: "system-ui", color: sc.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.45)" }}>
              {sc.appName}
            </span>
            <div className="ml-auto flex items-center gap-1.5 text-[10px]"
              style={{ color: sc.isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>
              <motion.div className="w-1.5 h-1.5 rounded-full"
                style={{ background: phase >= 4 ? "#22c55e" : (sc.isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.2)") }}
                animate={phase >= 4 ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {phase >= 4 ? "DoDo · responding" : "DoDo · ready"}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* App content area */}
        <div className="relative overflow-hidden" style={{ minHeight: 270, background: sc.appBg }}>
          <AnimatePresence mode="wait">
            <motion.div key={sc.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "absolute", inset: 0, overflow: "hidden" }}
            >
              <ContentRenderer />
            </motion.div>
          </AnimatePresence>

          {/* DoDo overlay layer */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Hotkey badge */}
            <AnimatePresence>
              {phase >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.75, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -6 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    position: "absolute", top: 8, right: 10,
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 99,
                    background: "rgba(99,102,241,0.18)",
                    border: "1px solid rgba(99,102,241,0.38)",
                    backdropFilter: "blur(14px)",
                    color: IND_BRIGHT, fontSize: 11, fontWeight: 600,
                  }}
                >
                  {["Ctrl", "Shift", "Space"].map((k, ki) => (
                    <motion.kbd key={k}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.12, 1] }}
                      transition={{ delay: ki * 0.09, duration: 0.28 }}
                      style={{
                        padding: "2px 5px", borderRadius: 4, fontSize: 10,
                        background: "rgba(99,102,241,0.28)",
                        border: "1px solid rgba(99,102,241,0.45)",
                      }}>
                      {k}
                    </motion.kbd>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selection rectangle */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div
                  key={`sel-${sc.id}`}
                  initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
                  animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute",
                    top: sc.selTop, left: 4, right: 8, height: sc.selHeight,
                    border: "2px dashed rgba(99,102,241,0.8)",
                    borderRadius: 5,
                    background: "rgba(99,102,241,0.09)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Command popup */}
            <AnimatePresence>
              {phase >= 3 && (
                <motion.div
                  key={`cmd-${sc.id}`}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 520, damping: 30 }}
                  style={{
                    position: "absolute",
                    top: sc.popupTop, left: sc.popupLeft,
                    zIndex: 20, pointerEvents: "auto",
                    background: "rgba(8,8,20,0.97)",
                    backdropFilter: "blur(32px)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 12, padding: 6, minWidth: 176,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.75), 0 0 28px rgba(99,102,241,0.2)",
                  }}
                >
                  {sc.commands.map((cmd, ci) => (
                    <motion.div key={cmd.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 + ci * 0.055 }}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs"
                      style={{
                        background: cmd.highlight ? "rgba(99,102,241,0.22)" : "transparent",
                        color: cmd.highlight ? IND_BRIGHT : "rgba(255,255,255,0.58)",
                        fontWeight: cmd.highlight ? 600 : 400,
                        cursor: "default",
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{cmd.icon}</span>
                      {cmd.label}
                      <kbd className="ml-auto text-[9px] px-1 py-0.5 rounded opacity-40"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {cmd.shortcut}
                      </kbd>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Response panel */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 270, damping: 30 }}
                style={{
                  position: "absolute", top: 0, right: 0, bottom: 0, width: 252,
                  background: "rgba(6,6,18,0.98)", backdropFilter: "blur(40px)",
                  borderLeft: "1px solid rgba(99,102,241,0.2)",
                  zIndex: 30, display: "flex", flexDirection: "column",
                }}
              >
                {/* Panel header */}
                <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Image src="/icon.png" alt="DoDo" width={15} height={15} className="rounded" />
                  <span className="text-[11px] font-semibold" style={{ color: IND_BRIGHT }}>DoDo · {sc.profile}</span>
                  <div className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    {elapsed.toFixed(1)}s
                  </div>
                </div>
                {/* Streaming text */}
                <div className="flex-1 overflow-auto px-3 py-2.5">
                  <StreamRenderer text={streamText} total={sc.response.length} />
                </div>
                {/* Copy button */}
                {streamText.length >= sc.response.length && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="px-3 pb-2.5 shrink-0">
                    <button className="w-full py-1.5 rounded-lg text-xs font-semibold text-white active:scale-95"
                      style={{ background: IND }}>
                      {sc.copyLabel}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            style={{ height: "100%", background: `linear-gradient(90deg, ${IND}, #8b5cf6)`, width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Scenario description */}
      <AnimatePresence mode="wait">
        <motion.p key={sc.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="text-center text-xs mt-3"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Use case: <strong style={{ color: "rgba(255,255,255,0.5)" }}>{sc.audience}</strong> · {sc.tabIcon} {sc.tabLabel}
        </motion.p>
      </AnimatePresence>
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
  const demoY = useTransform(scrollY, [0, 700], [0, 60]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.4]);

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
          style={{ y: demoY }}
          className="relative z-10 w-full max-w-[800px] mx-auto mt-14 px-4"
        >
          <AppDemo />
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
