import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────
const T = {
  void:    "#020408",
  deep:    "#060d14",
  panel:   "rgba(6,20,35,0.85)",
  panelHi: "rgba(10,30,50,0.95)",
  border:  "rgba(0,200,255,0.12)",
  borderHi:"rgba(0,200,255,0.35)",
  cyan:    "#00c8ff",
  cyanDim: "rgba(0,200,255,0.15)",
  cyanGlow:"rgba(0,200,255,0.4)",
  violet:  "#7b2fff",
  violetDi:"rgba(123,47,255,0.2)",
  green:   "#00ff9d",
  greenDim:"rgba(0,255,157,0.12)",
  red:     "#ff2d55",
  amber:   "#ffb800",
  ink:     "#cde8ff",
  ink2:    "#4a7a9b",
  ink3:    "#1e4060",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${T.void};
    color: ${T.ink};
    font-family: 'Rajdhani', sans-serif;
    overflow: hidden;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.cyanDim}; border-radius: 99px; }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes pulse-cyan {
    0%, 100% { opacity: 1; box-shadow: 0 0 8px ${T.cyanGlow}; }
    50% { opacity: 0.4; box-shadow: 0 0 2px ${T.cyanGlow}; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes glitch {
    0%, 100% { clip-path: inset(0 0 100% 0); }
    10% { clip-path: inset(30% 0 50% 0); transform: translate(-3px); }
    20% { clip-path: inset(70% 0 10% 0); transform: translate(3px); }
    30% { clip-path: inset(0 0 100% 0); }
  }
  @keyframes wave {
    0%, 100% { d: path("M0,50 Q25,20 50,50 Q75,80 100,50"); }
    50% { d: path("M0,50 Q25,80 50,50 Q75,20 100,50"); }
  }
  @keyframes blink { 0%, 90%, 100% { opacity: 1; } 95% { opacity: 0; } }
  @keyframes gridFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .sidebar-nav button:hover { background: rgba(0,200,255,0.06) !important; color: ${T.cyan} !important; }

  /* Mobile */
  .bottom-nav { display: none; }
  .sidebar-nav { display: flex; }

  @media (max-width: 768px) {
    .sidebar-nav { display: none !important; }
    .bottom-nav { display: flex !important; }
    .main-scroll { padding: 12px !important; padding-bottom: 72px !important; }
    .stat-row { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .home-grid { grid-template-columns: 1fr !important; }
    .gpa-top { grid-template-columns: 1fr !important; }
  }
`;

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────

// Scanline overlay
const Scanline = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
    overflow: "hidden", opacity: 0.03,
  }}>
    <div style={{
      position: "absolute", left: 0, right: 0, height: "2px",
      background: `linear-gradient(transparent, ${T.cyan}, transparent)`,
      animation: "scanline 4s linear infinite",
    }} />
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,255,0.03) 2px, rgba(0,200,255,0.03) 4px)`,
    }} />
  </div>
);

// Corner decorations
const Corner = ({ pos }) => {
  const isTop = pos.includes("top");
  const isLeft = pos.includes("left");
  return (
    <div style={{
      position: "absolute",
      [isTop ? "top" : "bottom"]: 0,
      [isLeft ? "left" : "right"]: 0,
      width: 16, height: 16,
      borderTop: isTop ? `1px solid ${T.cyan}` : "none",
      borderBottom: !isTop ? `1px solid ${T.cyan}` : "none",
      borderLeft: isLeft ? `1px solid ${T.cyan}` : "none",
      borderRight: !isLeft ? `1px solid ${T.cyan}` : "none",
      opacity: 0.6,
    }} />
  );
};

// Panel with corners
const Panel = ({ children, style = {}, glow = false, className = "" }) => (
  <div className={className} style={{
    background: T.panel,
    border: `1px solid ${glow ? T.borderHi : T.border}`,
    borderRadius: 2,
    backdropFilter: "blur(24px)",
    position: "relative",
    animation: "fadeIn 0.4s ease both",
    boxShadow: glow
      ? `0 0 40px ${T.cyanDim}, inset 0 0 40px rgba(0,200,255,0.02)`
      : `0 4px 32px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,200,255,0.01)`,
    ...style,
  }}>
    <Corner pos="top-left" />
    <Corner pos="top-right" />
    <Corner pos="bottom-left" />
    <Corner pos="bottom-right" />
    {children}
  </div>
);

// Mono label
const Label = ({ children, color = T.ink2, style = {} }) => (
  <span style={{
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color,
    ...style,
  }}>{children}</span>
);

// Status dot
const Dot = ({ color = T.green, pulse = true }) => (
  <span style={{
    display: "inline-block",
    width: 6, height: 6,
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 6px ${color}`,
    animation: pulse ? "pulse-dot 2s ease infinite" : "none",
    flexShrink: 0,
  }} />
);

// Button
const Btn = ({ children, variant = "primary", onClick, disabled, style = {}, fullWidth = false }) => {
  const v = {
    primary: { background: T.cyanDim, color: T.cyan, border: `1px solid ${T.borderHi}`, boxShadow: `0 0 16px ${T.cyanDim}` },
    ghost:   { background: "transparent", color: T.ink2, border: `1px solid ${T.border}` },
    danger:  { background: "rgba(255,45,85,0.1)", color: T.red, border: "1px solid rgba(255,45,85,0.3)" },
    pro:     { background: `linear-gradient(135deg, ${T.violet}, #b44dff)`, color: "#fff", border: "none", boxShadow: `0 0 24px ${T.violetDi}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 18px",
      borderRadius: 2,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 600,
      fontSize: "0.82rem",
      letterSpacing: "0.08em",
      transition: "all 0.2s",
      opacity: disabled ? 0.4 : 1,
      width: fullWidth ? "100%" : "auto",
      textTransform: "uppercase",
      ...v[variant], ...style,
    }}>{children}</button>
  );
};

// ─── LIVE CLOCK ───────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = n => String(n).padStart(2, "0");
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "1.4rem", color: T.cyan, letterSpacing: "0.1em", animation: "blink 1s step-end infinite" }}>
        {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())}
      </div>
      <Label color={T.ink3}>{t.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" })}</Label>
    </div>
  );
}

// ─── MINI WAVE CHART ──────────────────────────────────────────────
function WaveChart({ data = [], color = T.cyan, height = 40 }) {
  const w = 200, h = height;
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.85}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`wg${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#wg${color.slice(1)})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

// ─── RADIAL PROGRESS ──────────────────────────────────────────────
function RadialProgress({ value = 0, max = 100, color = T.cyan, size = 90, label, sublabel }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / max);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.ink3} strokeWidth="4" strokeDasharray={circ} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {label && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: size > 80 ? "1rem" : "0.75rem", color, lineHeight: 1 }}>{label}</div>}
        {sublabel && <Label color={T.ink2} style={{ marginTop: 2 }}>{sublabel}</Label>}
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL ────────────────────────────────────────────────
function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Panel onClick={e => e.stopPropagation()} glow style={{ maxWidth: 440, width: "100%", padding: 32, animation: "fadeIn 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: T.cyan, marginBottom: 12 }}>SYSTEM UPGRADE</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.6rem", fontWeight: 900, color: T.ink, letterSpacing: "-0.02em" }}>
            PRO <span style={{ color: T.cyan }}>ACCESS</span>
          </div>
          <p style={{ color: T.ink2, fontSize: "0.85rem", marginTop: 8 }}>ปลดล็อคทุกฟีเจอร์ ไม่มีข้อจำกัด</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[["49฿", "/เดือน", T.cyan, "STANDARD"], ["399฿", "/ปี (ประหยัด 32%)", T.green, "OPTIMAL"]].map(([price, period, color, tag]) => (
            <div key={tag} style={{ padding: 16, borderRadius: 2, border: `1px solid ${color}30`, background: `${color}08`, textAlign: "center" }}>
              <Label color={color}>{tag}</Label>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "1.8rem", color, margin: "8px 0 2px" }}>{price}</div>
              <Label color={T.ink2}>{period}</Label>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          {["✨ AI Study Coach — วิเคราะห์การเรียน", "📚 วิชาและงานไม่จำกัด", "📊 สถิติเชิงลึกรายสัปดาห์", "📄 Export PDF รายงาน", "🔔 แจ้งเตือน Deadline อัตโนมัติ"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: T.ink2 }}>
              <Dot color={T.green} pulse={false} /> {f}
            </div>
          ))}
        </div>
        <Btn variant="pro" fullWidth onClick={() => { setLoading(true); setTimeout(() => { alert("🚀 Stripe Checkout — เร็วๆ นี้!"); setLoading(false); }, 800); }} disabled={loading} style={{ padding: 14, fontSize: "0.9rem" }}>
          {loading ? "INITIALIZING..." : "⚡ UPGRADE NOW"}
        </Btn>
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: T.ink3, cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>
          [ CANCEL ]
        </button>
      </Panel>
    </div>
  );
}

// ─── AI COACH ─────────────────────────────────────────────────────
function AICoach({ tasks, subjects, todayMin, isPro, onUpgrade }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const analyze = async () => {
    if (!isPro) { onUpgrade(); return; }
    setLoading(true); setOpen(true); setText("");
    const pending = tasks.filter(t => !t.done).map(t => t.text).join(", ") || "ไม่มีงานค้าง";
    const subs = subjects.map(s => `${s.name}(${s.grade || "?"})`).join(", ") || "ยังไม่มีวิชา";
    const prompt = `คุณเป็น AI โค้ชการเรียนสำหรับนักศึกษาไทย วิเคราะห์ข้อมูลนี้แล้วสรุปเป็นภาษาไทย กระชับ ฉลาด (3-4 ประโยค):
เวลาเรียนวันนี้: ${(todayMin/60).toFixed(1)}h | งานค้าง: ${pending} | วิชา: ${subs}
วิเคราะห์จุดแข็ง จุดเสี่ยง และคำแนะนำที่ใช้ได้จริง`;
    try {
      const key = process.env.REACT_APP_GEMINI_API_KEY;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const d = await res.json();
      setText(d.candidates?.[0]?.content?.parts?.[0]?.text || "ไม่สามารถวิเคราะห์ได้ครับ");
    } catch { setText("⚠️ CONNECTION FAILED — ตรวจสอบ API Key ครับ"); }
    finally { setLoading(false); }
  };

  return (
    <Panel glow style={{ padding: 20, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 40% at 0% 50%, ${T.violetDi} 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 2, border: `1px solid ${T.violet}60`, background: T.violetDi, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✨</div>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", fontWeight: 700, color: T.ink, letterSpacing: "0.1em" }}>AI STUDY COACH</div>
              <Label color={isPro ? T.violet : T.ink3}>{isPro ? "NEURAL ANALYSIS READY" : "🔒 PRO ACCESS REQUIRED"}</Label>
            </div>
          </div>
          <Btn onClick={analyze} disabled={loading} variant={isPro ? "primary" : "pro"} style={{ fontSize: "0.72rem" }}>
            {loading ? "ANALYZING..." : isPro ? "▶ ANALYZE" : "⚡ UPGRADE"}
          </Btn>
        </div>
        {open && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${T.cyan}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <Label color={T.ink2}>NEURAL PROCESSING...</Label>
              </div>
            ) : (
              <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: T.ink, whiteSpace: "pre-wrap" }}>{text}</p>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────
function Home({ user, isPro, onUpgrade }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [todayMin, setTodayMin] = useState(0);
  const [weekData, setWeekData] = useState([12, 25, 18, 40, 30, 15, 0]);
  const [miniSecs, setMiniSecs] = useState(25 * 60);
  const [miniRunning, setMiniRunning] = useState(false);
  const miniRef = useRef(null);
  const total = 25 * 60;

  useEffect(() => {
    const load = async () => {
      const { data: t } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      const { data: s } = await supabase.from("subjects").select("*");
      const today = new Date().toISOString().split("T")[0];
      const { data: sess } = await supabase.from("sessions").select("minutes").gte("created_at", today);
      if (t) setTasks(t);
      if (s) setSubjects(s);
      if (sess) {
        const min = sess.reduce((sum, x) => sum + x.minutes, 0);
        setTodayMin(min);
        setWeekData(prev => { const n = [...prev]; n[6] = min; return n; });
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (miniRunning) miniRef.current = setInterval(() => setMiniSecs(s => s > 0 ? s - 1 : 0), 1000);
    else clearInterval(miniRef.current);
    return () => clearInterval(miniRef.current);
  }, [miniRunning]);

  const pad = n => String(n).padStart(2, "0");
  const gradeToGPA = g => ({ A: 4, "B+": 3.5, B: 3, "C+": 2.5, C: 2, "D+": 1.5, D: 1, F: 0 }[g] || 0);
  const avgGPA = subjects.length > 0 ? (subjects.reduce((s, x) => s + gradeToGPA(x.grade), 0) / subjects.length).toFixed(2) : "0.00";
  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  const streak = 7;
  const focusH = (todayMin / 60).toFixed(1);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Label color={T.ink3} style={{ display: "block", marginBottom: 4 }}>WELCOME BACK, OPERATOR</Label>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 900, color: T.ink, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "STUDENT"}
            <span style={{ color: T.cyan }}>_</span>
          </div>
        </div>
        <LiveClock />
      </div>

      {/* AI Coach */}
      <AICoach tasks={tasks} subjects={subjects} todayMin={todayMin} isPro={isPro} onUpgrade={onUpgrade} />

      {/* Stats row */}
      <div className="stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "FOCUS TIME", value: `${focusH}H`, sub: "TODAY", color: T.cyan, chart: weekData },
          { label: "TASKS DONE", value: done, sub: `${pending} PENDING`, color: T.green, chart: [2,4,3,6,5,8,done] },
          { label: "GPA INDEX", value: avgGPA, sub: "CURRENT", color: parseFloat(avgGPA) >= 3 ? T.green : T.amber, chart: [3.0,3.1,3.2,3.3,3.2,3.4,parseFloat(avgGPA)||0] },
          { label: "STREAK", value: `${streak}🔥`, sub: "DAYS ACTIVE", color: T.amber, chart: [1,2,3,4,5,6,7] },
        ].map((s, i) => (
          <Panel key={i} style={{ padding: 14, animationDelay: `${i * 0.06}s` }}>
            <Label color={T.ink3}>{s.label}</Label>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", color: s.color, margin: "6px 0 2px", filter: `drop-shadow(0 0 8px ${s.color})` }}>{s.value}</div>
            <Label color={T.ink2}>{s.sub}</Label>
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              <WaveChart data={s.chart} color={s.color} height={28} />
            </div>
          </Panel>
        ))}
      </div>

      {/* Main grid */}
      <div className="home-grid" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12 }}>
        {/* Tasks */}
        <Panel style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Dot color={pending > 3 ? T.red : T.green} />
              <Label color={T.ink2}>MISSION QUEUE</Label>
            </div>
            <Label color={pending > 3 ? T.red : T.green}>{pending} ACTIVE</Label>
          </div>
          {tasks.filter(t => !t.done).slice(0, 5).length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: T.ink2, fontSize: "0.85rem" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
              ALL MISSIONS COMPLETE
            </div>
          ) : tasks.filter(t => !t.done).slice(0, 5).map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 6, borderRadius: 2, background: "rgba(0,200,255,0.03)", border: `1px solid ${T.border}`, animation: `slideRight 0.3s ease ${i * 0.05}s both` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.cyan, flexShrink: 0, boxShadow: `0 0 6px ${T.cyan}` }} />
              <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500 }}>{t.text}</div>
              <Label color={T.ink3}>#{String(i + 1).padStart(2, "0")}</Label>
            </div>
          ))}
        </Panel>

        {/* Pomodoro */}
        <Panel style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <Label color={T.ink3}>FOCUS PROTOCOL</Label>
          <RadialProgress
            value={miniSecs} max={total}
            color={T.cyan} size={110}
            label={`${pad(Math.floor(miniSecs / 60))}:${pad(miniSecs % 60)}`}
            sublabel="FOCUS"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setMiniRunning(r => !r)} style={{ padding: "7px 14px", fontSize: "0.72rem" }}>
              {miniRunning ? "⏸ PAUSE" : "▶ START"}
            </Btn>
            <Btn variant="ghost" onClick={() => { setMiniRunning(false); setMiniSecs(total); }} style={{ padding: "7px 10px" }}>↺</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, width: "100%" }}>
            {[["25m", "FOCUS"], ["5m", "SHORT"], ["15m", "LONG"]].map(([t2, l]) => (
              <button key={l} onClick={() => { setMiniRunning(false); const m = parseInt(t2); setMiniSecs(m * 60); }} style={{ padding: "5px 4px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 2, color: T.ink2, fontFamily: "'Share Tech Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.05em", cursor: "pointer" }}>
                {t2}<br />{l}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── TIMER PAGE ───────────────────────────────────────────────────
function TimerPage() {
  const [secs, setSecs] = useState(25 * 60);
  const [total, setTotal] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("FOCUS");
  const [sessions, setSessions] = useState(0);
  const [history, setHistory] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(prev => {
        if (prev <= 1) {
          clearInterval(ref.current); setRunning(false);
          if (mode === "FOCUS") {
            setSessions(n => n + 1);
            const min = Math.floor(total / 60);
            setHistory(h => [{ time: new Date().toLocaleTimeString("th"), min }, ...h.slice(0, 4)]);
            supabase.from("sessions").insert({ minutes: min });
          }
          return 0;
        }
        return prev - 1;
      }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running, mode, total]);

  const pad = n => String(n).padStart(2, "0");
  const modes = [
    { label: "FOCUS", mins: 25, color: T.cyan },
    { label: "SHORT BREAK", mins: 5, color: T.green },
    { label: "LONG BREAK", mins: 15, color: T.violet },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Label color={T.ink3} style={{ display: "block", marginBottom: 6 }}>FOCUS PROTOCOL</Label>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.5rem", fontWeight: 900, marginBottom: 20 }}>POMODORO SYSTEM</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16, maxWidth: 500 }}>
        {modes.map(m => (
          <Panel key={m.label} onClick={() => { clearInterval(ref.current); setRunning(false); setTotal(m.mins * 60); setSecs(m.mins * 60); setMode(m.label); }}
            style={{ padding: 12, textAlign: "center", cursor: "pointer", border: `1px solid ${mode === m.label ? m.color : T.border}`, background: mode === m.label ? `${m.color}08` : T.panel, boxShadow: mode === m.label ? `0 0 20px ${m.color}20` : "none" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "1.2rem", color: mode === m.label ? m.color : T.ink2, marginBottom: 4 }}>{String(m.mins).padStart(2,"0")}:00</div>
            <Label color={mode === m.label ? m.color : T.ink3}>{m.label}</Label>
          </Panel>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, maxWidth: 700 }}>
        <Panel glow style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${T.cyanDim} 0%, transparent 70%)`, pointerEvents: "none" }} />
          <RadialProgress value={secs} max={total} color={T.cyan} size={180} label={`${pad(Math.floor(secs/60))}:${pad(secs%60)}`} sublabel={mode} />
          <Label color={T.ink2}>SESSION {sessions + 1} — {sessions} COMPLETED TODAY</Label>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setRunning(r => !r)} style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
              {running ? "⏸ PAUSE" : "▶ INITIATE"}
            </Btn>
            <Btn variant="ghost" onClick={() => { clearInterval(ref.current); setRunning(false); setSecs(total); }} style={{ padding: "10px 14px" }}>↺ RESET</Btn>
          </div>
        </Panel>

        <Panel style={{ padding: 16 }}>
          <Label color={T.ink3} style={{ display: "block", marginBottom: 12 }}>SESSION LOG</Label>
          {history.length === 0 ? (
            <div style={{ color: T.ink3, fontSize: "0.78rem", textAlign: "center", padding: "20px 0" }}>NO SESSIONS YET</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <Label color={T.ink2}>{h.time}</Label>
              <Label color={T.cyan}>{h.min}m</Label>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: T.cyanDim, borderRadius: 2 }}>
            <Label color={T.ink2} style={{ display: "block", marginBottom: 4 }}>TODAY TOTAL</Label>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "1.4rem", color: T.cyan }}>
              {history.reduce((s, h) => s + h.min, 0)}m
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── TASKS PAGE ───────────────────────────────────────────────────
function TasksPage({ isPro }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const add = async () => {
    if (!input.trim()) return;
    if (!isPro && tasks.length >= 10) { alert("🔒 FREE LIMIT: 10 MISSIONS\nUpgrade to Pro for unlimited!"); return; }
    const { data } = await supabase.from("tasks").insert({ text: input.trim(), done: false }).select().single();
    if (data) setTasks(prev => [data, ...prev]);
    setInput("");
  };

  const toggle = async (id, done) => {
    await supabase.from("tasks").update({ done: !done }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  };

  const del = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const filters = ["ALL", "ACTIVE", "DONE"];
  const filtered = filter === "ALL" ? tasks : filter === "ACTIVE" ? tasks.filter(t => !t.done) : tasks.filter(t => t.done);
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Label color={T.ink3} style={{ display: "block", marginBottom: 6 }}>MISSION CONTROL</Label>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.5rem", fontWeight: 900, marginBottom: 6 }}>TASK MATRIX</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Label color={T.ink2}>{done}/{tasks.length} COMPLETE</Label>
        <div style={{ flex: 1, height: 2, background: T.ink3, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.cyan}, ${T.green})`, boxShadow: `0 0 8px ${T.cyan}`, transition: "width 0.6s ease" }} />
        </div>
        <Label color={T.cyan}>{pct}%</Label>
      </div>

      <Panel style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="ADD NEW MISSION..."
            style={{ flex: 1, padding: "10px 14px", background: "rgba(0,200,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 2, color: T.ink, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem", outline: "none", letterSpacing: "0.05em" }} />
          <Btn onClick={add} style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>+ ADD</Btn>
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 14px", borderRadius: 2, border: `1px solid ${filter === f ? T.cyan : T.border}`,
            background: filter === f ? T.cyanDim : "transparent",
            color: filter === f ? T.cyan : T.ink2,
            fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer",
          }}>{f}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: T.ink2 }}>LOADING MISSIONS...</div>
        : filtered.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: T.ink2 }}>NO MISSIONS IN THIS SECTOR</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((t, i) => (
              <div key={t.id} onClick={() => toggle(t.id, t.done)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                borderRadius: 2, cursor: "pointer", transition: "all 0.2s",
                border: `1px solid ${t.done ? T.green + "30" : T.border}`,
                background: t.done ? `${T.green}05` : "rgba(0,200,255,0.02)",
                animation: `slideRight 0.3s ease ${i * 0.03}s both`,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: 2, border: `1px solid ${t.done ? T.green : T.border}`, background: t.done ? T.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.void, flexShrink: 0, boxShadow: t.done ? `0 0 8px ${T.green}` : "none" }}>
                  {t.done ? "✓" : ""}
                </div>
                <Label color={T.ink3} style={{ width: 28 }}>#{String(i + 1).padStart(2,"0")}</Label>
                <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500, textDecoration: t.done ? "line-through" : "none", color: t.done ? T.ink2 : T.ink }}>{t.text}</div>
                <button onClick={e => { e.stopPropagation(); del(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.ink3, fontSize: "0.72rem", padding: "2px 6px", fontFamily: "'Share Tech Mono', monospace" }}>DEL</button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── GPA PAGE ─────────────────────────────────────────────────────
function GPAPage({ isPro }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("subjects").select("*").order("created_at");
    if (data) setSubjects(data);
    setLoading(false);
  };

  const gradeMap = { A: 4, "B+": 3.5, B: 3, "C+": 2.5, C: 2, "D+": 1.5, D: 1, F: 0 };
  const gpa = g => gradeMap[g] || 0;
  const gColor = g => { const v = gpa(g); return v >= 3.5 ? T.green : v >= 2.5 ? T.cyan : v >= 2 ? T.amber : T.red; };
  const avg = subjects.length ? (subjects.reduce((s, x) => s + gpa(x.grade), 0) / subjects.length).toFixed(2) : "0.00";
  const avgColor = parseFloat(avg) >= 3.5 ? T.green : parseFloat(avg) >= 3 ? T.cyan : parseFloat(avg) >= 2 ? T.amber : T.red;

  const addSubject = async () => {
    if (!form.name) return;
    if (!isPro && subjects.length >= 5) { alert("🔒 FREE LIMIT: 5 SUBJECTS\nUpgrade to Pro!"); return; }
    const { data } = await supabase.from("subjects").insert(form).select().single();
    if (data) setSubjects(prev => [...prev, data]);
    setForm({ name: "", grade: "" }); setShowForm(false);
  };

  const del = async (id) => {
    await supabase.from("subjects").delete().eq("id", id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Label color={T.ink3} style={{ display: "block", marginBottom: 6 }}>ACADEMIC ANALYTICS</Label>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.5rem", fontWeight: 900, marginBottom: 20 }}>GPA COMMAND</div>

      <div className="gpa-top" style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Panel glow style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Label color={T.ink3}>GRADE POINT AVG</Label>
          <RadialProgress value={parseFloat(avg)} max={4} color={avgColor} size={110} label={avg} sublabel="GPA" />
          <div style={{ height: 3, width: "100%", background: T.ink3, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(parseFloat(avg)/4)*100}%`, background: avgColor, boxShadow: `0 0 8px ${avgColor}`, transition: "width 1s ease" }} />
          </div>
        </Panel>
        {[
          { num: subjects.length, label: "SUBJECTS", color: T.cyan, icon: "📚" },
          { num: subjects.filter(s => gpa(s.grade) >= 3.5).length, label: "GRADE A", color: T.green, icon: "⭐" },
          { num: subjects.filter(s => gpa(s.grade) < 2 && s.grade).length, label: "WARNING", color: T.red, icon: "⚠️" },
        ].map((s, i) => (
          <Panel key={i} style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "2.2rem", color: s.color, filter: `drop-shadow(0 0 10px ${s.color})` }}>{s.num}</div>
            <Label color={T.ink2}>{s.label}</Label>
          </Panel>
        ))}
      </div>

      <Panel style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dot color={T.cyan} />
            <Label color={T.ink2}>SUBJECT DATABASE {!isPro && `— ${subjects.length}/5 FREE`}</Label>
          </div>
          <Btn onClick={() => setShowForm(!showForm)} style={{ padding: "6px 14px", fontSize: "0.72rem" }}>+ ADD SUBJECT</Btn>
        </div>

        {showForm && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", padding: 12, background: T.cyanDim, borderRadius: 2, border: `1px solid ${T.border}` }}>
            <input placeholder="SUBJECT NAME (e.g. CS211)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ flex: 2, minWidth: 120, padding: "8px 12px", background: "rgba(0,0,0,0.4)", border: `1px solid ${T.border}`, borderRadius: 2, color: T.ink, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", outline: "none" }} />
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
              style={{ flex: 1, minWidth: 80, padding: "8px 10px", background: T.deep, border: `1px solid ${T.border}`, borderRadius: 2, color: T.ink, fontFamily: "'Share Tech Mono', monospace", fontSize: "0.8rem" }}>
              <option value="">GRADE</option>
              {Object.keys(gradeMap).map(g => <option key={g}>{g}</option>)}
            </select>
            <Btn onClick={addSubject} style={{ padding: "8px 14px" }}>SAVE</Btn>
          </div>
        )}

        {loading ? <div style={{ textAlign: "center", padding: 20, color: T.ink2 }}>LOADING DATABASE...</div>
          : subjects.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: T.ink2 }}>NO SUBJECTS REGISTERED</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subjects.map((s, i) => (
                <div key={i} style={{ padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: 2, background: "rgba(0,200,255,0.02)", animation: `slideRight 0.3s ease ${i*0.04}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Label color={T.ink3}>#{String(i+1).padStart(2,"0")}</Label>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.85rem", color: gColor(s.grade), padding: "2px 10px", border: `1px solid ${gColor(s.grade)}40`, background: `${gColor(s.grade)}10` }}>
                        {s.grade || "?"} · {gpa(s.grade).toFixed(1)}
                      </div>
                      <button onClick={() => del(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.ink3, fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem" }}>DEL</button>
                    </div>
                  </div>
                  <div style={{ height: 2, background: T.ink3, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(gpa(s.grade)/4)*100}%`, background: gColor(s.grade), boxShadow: `0 0 6px ${gColor(s.grade)}`, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}

// ─── PRO PAGE ─────────────────────────────────────────────────────
function ProPage({ isPro, onUpgrade }) {
  if (isPro) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "3rem", color: T.cyan, marginBottom: 12, filter: `drop-shadow(0 0 20px ${T.cyan})` }}>⚡</div>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: 900, color: T.green }}>PRO ACCESS GRANTED</div>
      <p style={{ color: T.ink2, marginTop: 8, fontSize: "0.85rem" }}>ขอบคุณที่สนับสนุน StudyFlow ครับ</p>
    </div>
  );
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Label color={T.ink3} style={{ display: "block", marginBottom: 6 }}>SYSTEM UPGRADE</Label>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.5rem", fontWeight: 900, marginBottom: 20 }}>
        PRO <span style={{ color: T.cyan }}>ACCESS</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 560, marginBottom: 20 }}>
        {[["49฿", "PER MONTH", T.cyan], ["399฿", "PER YEAR — SAVE 32%", T.green]].map(([p, l, c]) => (
          <Panel key={l} style={{ padding: 24, border: `1px solid ${c}30`, cursor: "pointer" }} onClick={onUpgrade}>
            <Label color={c}>{l}</Label>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "2.5rem", color: c, margin: "10px 0 4px", filter: `drop-shadow(0 0 10px ${c})` }}>{p}</div>
            <Btn variant={c === T.cyan ? "primary" : "ghost"} fullWidth style={{ marginTop: 12 }}>SELECT PLAN</Btn>
          </Panel>
        ))}
      </div>
      <Panel style={{ padding: 20, maxWidth: 560 }}>
        <Label color={T.ink2} style={{ display: "block", marginBottom: 12 }}>PRO CAPABILITIES</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["✨","AI STUDY COACH","Neural analysis"], ["📚","UNLIMITED SUBJECTS","Free: 5 only"], ["✅","UNLIMITED TASKS","Free: 10 only"], ["📊","DEEP ANALYTICS","Weekly/monthly"], ["📄","PDF EXPORT","Full reports"], ["🔔","AUTO ALERTS","Deadline warnings"]].map(([icon, title, sub]) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 2, background: "rgba(0,200,255,0.02)" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.7rem", color: T.ink, letterSpacing: "0.05em" }}>{title}</div>
                <Label color={T.ink3}>{sub}</Label>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [isPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login"); else setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/login"); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const logout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const nav = [
    { id: "home",  icon: "⬡", label: "COMMAND" },
    { id: "timer", icon: "◎", label: "FOCUS" },
    { id: "tasks", icon: "≡", label: "MISSIONS" },
    { id: "gpa",   icon: "◈", label: "ANALYTICS" },
    { id: "pro",   icon: "⚡", label: "PRO" },
  ];

  const pages = {
    home:  <Home user={user} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />,
    timer: <TimerPage />,
    tasks: <TasksPage isPro={isPro} />,
    gpa:   <GPAPage isPro={isPro} />,
    pro:   <ProPage isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />,
  };

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.void, flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", color: T.cyan, letterSpacing: "0.3em", animation: "pulse-dot 1s ease infinite" }}>INITIALIZING SYSTEM...</div>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${T.cyan}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <Scanline />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 50% at 15% 30%, rgba(0,200,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 70%, rgba(123,47,255,0.04) 0%, transparent 60%)`,
      }}>
        {/* Grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.4 }} />
      </div>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* Sidebar */}
        <div className="sidebar-nav" style={{ width: 220, background: "rgba(2,4,8,0.95)", borderRight: `1px solid ${T.border}`, padding: "20px 12px", flexDirection: "column", gap: 2, flexShrink: 0 }}>

          {/* Brand */}
          <div style={{ padding: "12px 8px 20px", borderBottom: `1px solid ${T.border}`, marginBottom: 12 }}>
            <Label color={T.ink3} style={{ display: "block", marginBottom: 4 }}>SYSTEM CORE</Label>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: 900, color: T.ink, letterSpacing: "0.05em" }}>
              STUDY<span style={{ color: T.cyan }}>FLOW</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Dot color={T.green} />
              <Label color={T.green}>v1.0 · ONLINE</Label>
            </div>
          </div>

          {/* Nav */}
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 2, cursor: "pointer", border: "none", width: "100%", textAlign: "left",
              background: page === n.id ? T.cyanDim : "transparent",
              color: page === n.id ? T.cyan : n.id === "pro" ? T.amber : T.ink2,
              fontFamily: "'Share Tech Mono', monospace", fontWeight: 400, fontSize: "0.72rem",
              letterSpacing: "0.1em",
              borderLeft: `2px solid ${page === n.id ? T.cyan : "transparent"}`,
              boxShadow: page === n.id ? `inset 0 0 20px ${T.cyanDim}` : "none",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "1rem", width: 20, textAlign: "center", color: page === n.id ? T.cyan : T.ink3 }}>{n.icon}</span>
              {n.label}
              {n.id === "pro" && !isPro && <span style={{ marginLeft: "auto", fontSize: "0.55rem", color: T.amber, border: `1px solid ${T.amber}40`, padding: "1px 6px" }}>NEW</span>}
              {page === n.id && <div style={{ marginLeft: "auto", width: 4, height: 4, background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />}
            </button>
          ))}

          {/* User */}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <div style={{ padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 2, marginBottom: 8, background: "rgba(0,200,255,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 2, background: T.cyanDim, border: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.8rem", color: T.cyan }}>
                  {(user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                  </div>
                  <Label color={isPro ? T.cyan : T.ink3}>{isPro ? "PRO ACCESS" : "FREE TIER"}</Label>
                </div>
              </div>
            </div>
            {!isPro && (
              <Btn variant="pro" fullWidth onClick={() => setShowUpgrade(true)} style={{ marginBottom: 6, padding: "8px 12px", fontSize: "0.68rem" }}>
                ⚡ UPGRADE TO PRO
              </Btn>
            )}
            <button onClick={logout} style={{ width: "100%", padding: "8px 12px", borderRadius: 2, border: `1px solid rgba(255,45,85,0.2)`, background: "rgba(255,45,85,0.05)", color: T.red, cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
              [ LOGOUT ]
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="main-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {pages[page]}
        </div>

        {/* Mobile nav */}
        <div className="bottom-nav" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(2,4,8,0.97)", borderTop: `1px solid ${T.border}`,
          padding: "8px 4px 12px", justifyContent: "space-around", alignItems: "center",
        }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
              color: page === n.id ? T.cyan : T.ink3,
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              <span style={{ fontSize: "1.1rem" }}>{n.icon}</span>
              <span style={{ fontSize: "0.5rem", letterSpacing: "0.08em" }}>{n.label}</span>
              {page === n.id && <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />}
            </button>
          ))}
        </div>

      </div>
    </>
  );
}