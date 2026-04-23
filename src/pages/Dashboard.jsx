import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg: "#080810", bg2: "#0e0e1a",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.08)",
  ink: "#f0eeff", ink2: "#8888aa",
  accent: "#7c5cfc", accentGlow: "rgba(124,92,252,0.35)",
  green: "#00e5a0", red: "#ff4d6d",
  yellow: "#ffd166", blue: "#4db8ff",
};

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.ink}; font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* Mobile Bottom Nav */
  .bottom-nav { display: none; }
  .sidebar { display: flex; }

  @media (max-width: 768px) {
    .sidebar { display: none !important; }
    .bottom-nav { display: flex !important; }
    .main-content { padding: 16px !important; padding-bottom: 80px !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .main-row { grid-template-columns: 1fr !important; }
    .gpa-grid { grid-template-columns: 1fr !important; }
    .timer-modes { grid-template-columns: 1fr 1fr 1fr !important; }
    .pro-grid { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .hero-title { font-size: 1.6rem !important; }
  }
`;

// ─── HOOKS ────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

// ─── COMPONENTS ───────────────────────────────────────────────────
const Card = ({ children, style = {}, glow = false, className = "" }) => (
  <div className={className} style={{
    background: C.glass,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(20px)",
    animation: "fadeUp 0.4s ease both",
    boxShadow: glow ? `0 0 40px ${C.accentGlow}, 0 4px 24px rgba(0,0,0,0.4)` : "0 4px 24px rgba(0,0,0,0.3)",
    ...style
  }}>{children}</div>
);

const Chip = ({ label, color = C.accent }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 99,
    background: `${color}18`, border: `1px solid ${color}30`,
    color, fontSize: "0.62rem", fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500,
  }}>{label}</span>
);

const Btn = ({ children, variant = "primary", onClick, disabled, style = {}, fullWidth = false }) => {
  const variants = {
    primary: { background: C.accent, color: "#fff", border: "none", boxShadow: `0 4px 20px ${C.accentGlow}` },
    ghost: { background: C.glass, color: C.ink2, border: `1px solid ${C.glassBorder}` },
    danger: { background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}30` },
    pro: { background: `linear-gradient(135deg, ${C.accent}, #a855f7)`, color: "#fff", border: "none", boxShadow: `0 4px 20px ${C.accentGlow}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 20px", borderRadius: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "0.82rem",
      transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
      width: fullWidth ? "100%" : "auto",
      ...variants[variant], ...style
    }}>{children}</button>
  );
};

// ─── PRO GATE COMPONENT ───────────────────────────────────────────
function ProGate({ children, isPro, feature = "ฟีเจอร์นี้" }) {
  if (isPro) return children;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        background: "rgba(8,8,16,0.8)", borderRadius: 16, backdropFilter: "blur(4px)",
      }}>
        <div style={{ fontSize: 32 }}>⚡</div>
        <div style={{ fontWeight: 700, fontSize: "1rem", textAlign: "center" }}>{feature}</div>
        <div style={{ fontSize: "0.78rem", color: C.ink2, textAlign: "center" }}>สำหรับสมาชิก Pro เท่านั้น</div>
        <Btn variant="pro" onClick={() => document.getElementById("upgrade-modal")?.classList.remove("hidden")}
          style={{ padding: "8px 20px", fontSize: "0.8rem" }}>
          ✨ อัปเกรดเป็น Pro — 49฿/เดือน
        </Btn>
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL ────────────────────────────────────────────────
function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // TODO: เชื่อม Stripe จริงๆ
    setTimeout(() => {
      alert("🚀 กำลังเปิดหน้าชำระเงิน Stripe...\n\n(จะเชื่อมต่อ Stripe จริงๆ ในขั้นตอนต่อไปครับ)");
      setLoading(false);
    }, 1000);
  };

  return (
    <div id="upgrade-modal" style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0e0e1a", border: `1px solid ${C.glassBorder}`,
        borderRadius: 20, padding: 32, maxWidth: 420, width: "100%",
        animation: "slideUp 0.3s ease",
        boxShadow: `0 0 60px ${C.accentGlow}`,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            อัปเกรดเป็น <span style={{ color: C.accent }}>Pro</span>
          </h2>
          <p style={{ color: C.ink2, fontSize: "0.85rem", marginTop: 6 }}>ปลดล็อคทุกฟีเจอร์ ไม่มีข้อจำกัด</p>
        </div>

        {/* Pricing Toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <div style={{ padding: 16, borderRadius: 12, border: `2px solid ${C.accent}`, background: `${C.accent}10`, textAlign: "center" }}>
            <Chip label="ยอดนิยม" color={C.accent} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 500, color: C.accent, margin: "8px 0" }}>49฿</div>
            <div style={{ fontSize: "0.72rem", color: C.ink2 }}>ต่อเดือน</div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${C.glassBorder}`, background: C.glass, textAlign: "center" }}>
            <Chip label="ประหยัด 32%" color={C.green} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 500, color: C.green, margin: "8px 0" }}>399฿</div>
            <div style={{ fontSize: "0.72rem", color: C.ink2 }}>ต่อปี</div>
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "✨ AI Study Coach วิเคราะห์การเรียน",
            "📚 วิชาและงานไม่จำกัด",
            "📊 สถิติละเอียดรายสัปดาห์",
            "📄 Export PDF รายงานการเรียน",
            "🔔 แจ้งเตือน Deadline อัตโนมัติ",
            "⚡ Priority Support",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: C.ink2 }}>
              <span style={{ color: C.green }}>✓</span> {f}
            </div>
          ))}
        </div>

        <Btn variant="pro" onClick={handleUpgrade} disabled={loading} fullWidth style={{ padding: 14, fontSize: "0.95rem" }}>
          {loading ? "⏳ กำลังโหลด..." : "🚀 อัปเกรดตอนนี้เลย"}
        </Btn>
        <p style={{ textAlign: "center", fontSize: "0.68rem", color: C.ink2, marginTop: 12 }}>
          ทดลองใช้ฟรี 30 วัน • ยกเลิกได้ทุกเมื่อ • รองรับ PromptPay + บัตรเครดิต
        </p>
        <button onClick={onClose} style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: C.ink2, cursor: "pointer", fontSize: "0.78rem", padding: 8 }}>
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

// ─── AI SUMMARY ───────────────────────────────────────────────────
function AISummary({ tasks = [], subjects = [], todayMin = 0, isPro }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const generate = async () => {
    if (!isPro) { setShowUpgrade(true); return; }
    setLoading(true); setVisible(true); setSummary("");
    const pending = tasks.filter(t => !t.done).map(t => t.text).join(", ") || "ไม่มีงานค้าง";
    const subs = subjects.map(s => `${s.name}(${s.grade || "?"})`).join(", ") || "ยังไม่มีวิชา";
    const prompt = `คุณเป็น AI โค้ชการเรียนสำหรับนักศึกษาไทย วิเคราะห์ข้อมูลต่อไปนี้แล้วสรุปเป็นภาษาไทย กระชับ ฉลาด ให้กำลังใจ (3-4 ประโยค):
- เวลาเรียนวันนี้: ${(todayMin/60).toFixed(1)} ชั่วโมง
- งานค้าง: ${pending}
- วิชา: ${subs}
วิเคราะห์จุดแข็ง จุดต้องระวัง และคำแนะนำที่เป็นประโยชน์จริงๆ`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setSummary(data.content?.[0]?.text || "ไม่สามารถสร้างสรุปได้ครับ");
    } catch { setSummary("⚠️ ไม่สามารถเชื่อมต่อ AI ได้ตอนนี้ครับ"); }
    finally { setLoading(false); }
  };

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <Card glow style={{ marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.accentGlow} 0%, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: visible ? 16 : 0, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}20`, border: `1px solid ${C.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✨</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>AI Study Coach</div>
                <div style={{ fontSize: "0.68rem", color: C.ink2 }}>
                  {isPro ? "วิเคราะห์การเรียนของคุณ" : "🔒 Pro Feature"}
                </div>
              </div>
            </div>
            <Btn onClick={generate} disabled={loading} style={{ padding: "8px 16px", fontSize: "0.75rem" }} variant={isPro ? "primary" : "pro"}>
              {loading ? "⏳ วิเคราะห์..." : isPro ? "✨ วิเคราะห์ตอนนี้" : "⚡ อัปเกรด Pro"}
            </Btn>
          </div>
          {visible && (
            <div style={{ borderTop: `1px solid ${C.glassBorder}`, paddingTop: 16 }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: C.ink2, fontSize: "0.82rem" }}>AI กำลังวิเคราะห์...</span>
                </div>
              ) : <p style={{ fontSize: "0.88rem", lineHeight: 1.8 }}>{summary}</p>}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────
function Home({ user, isPro }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [todayMin, setTodayMin] = useState(0);
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
      if (sess) setTodayMin(sess.reduce((sum, x) => sum + x.minutes, 0));
    };
    load();
  }, []);

  useEffect(() => {
    if (miniRunning) miniRef.current = setInterval(() => setMiniSecs(s => s > 0 ? s - 1 : 0), 1000);
    else clearInterval(miniRef.current);
    return () => clearInterval(miniRef.current);
  }, [miniRunning]);

  const pad = n => String(n).padStart(2, "0");
  const timeStr = pad(Math.floor(miniSecs / 60)) + ":" + pad(miniSecs % 60);
  const circ = 2 * Math.PI * 40;
  const offset = circ * (miniSecs / total);

  const gradeToGPA = g => ({ A:4, "B+":3.5, B:3, "C+":2.5, C:2, "D+":1.5, D:1, F:0 }[g] || 0);
  const avgGPA = subjects.length > 0 ? (subjects.reduce((s, x) => s + gradeToGPA(x.grade), 0) / subjects.length).toFixed(2) : "0.00";
  const pendingCount = tasks.filter(t => !t.done).length;

  return (
    <div>
      <div style={{ marginBottom: 24, animation: "fadeUp 0.3s ease" }}>
        <div style={{ fontSize: "0.65rem", color: C.ink2, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: "0.1em" }}>
          {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 className="hero-title" style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          สวัสดี, <span style={{ color: C.accent }}>{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</span> 👋
        </h1>
        {!isPro && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, padding: "6px 14px", borderRadius: 99, background: `${C.accent}10`, border: `1px solid ${C.accent}30` }}>
            <span style={{ fontSize: "0.72rem", color: C.accent }}>⚡ อัปเกรดเป็น Pro เพื่อปลดล็อคทุกฟีเจอร์</span>
          </div>
        )}
      </div>

      <AISummary tasks={tasks} subjects={subjects} todayMin={todayMin} isPro={isPro} />

      {/* Stats */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "เวลาเรียน", value: `${(todayMin/60).toFixed(1)}h`, sub: "วันนี้", color: C.accent, icon: "⏱" },
          { label: "งานค้าง", value: pendingCount, sub: "รายการ", color: pendingCount > 3 ? C.red : C.green, icon: "✅" },
          { label: "GPA เฉลี่ย", value: avgGPA, sub: "ปัจจุบัน", color: C.blue, icon: "🎯" },
          { label: "Streak", value: "7🔥", sub: "วัน", color: C.yellow, icon: "⚡" },
        ].map((s, i) => (
          <Card key={i} style={{ padding: "14px 12px", animationDelay: `${i*0.05}s`, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 500, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.62rem", color: C.ink2, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Main Row */}
      <div className="main-row" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700 }}>งานที่ยังค้างอยู่</div>
            <Chip label={`${pendingCount} งาน`} color={pendingCount > 3 ? C.red : C.green} />
          </div>
          {tasks.filter(t => !t.done).slice(0, 4).length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.ink2, fontSize: "0.85rem" }}>🎉 ไม่มีงานค้างแล้ว!</div>
          ) : tasks.filter(t => !t.done).slice(0, 4).map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.glassBorder}`, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: "0.82rem" }}>{t.text}</div>
            </div>
          ))}
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: "0.65rem", color: C.ink2, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Pomodoro</div>
          <div style={{ position: "relative", width: 100, height: 100 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={C.accent} strokeWidth="6"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 8px ${C.accent})` }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 500 }}>{timeStr}</div>
              <div style={{ fontSize: "0.5rem", color: C.ink2, textTransform: "uppercase", letterSpacing: "0.1em" }}>focus</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setMiniRunning(r => !r)} style={{ padding: "8px 14px", fontSize: "0.78rem" }}>
              {miniRunning ? "⏸" : "▶"} {miniRunning ? "หยุด" : "เริ่ม"}
            </Btn>
            <Btn variant="ghost" onClick={() => { setMiniRunning(false); setMiniSecs(total); }} style={{ padding: "8px 12px" }}>↺</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── TIMER ────────────────────────────────────────────────────────
function Timer() {
  const [secs, setSecs] = useState(25 * 60);
  const [total, setTotal] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("โฟกัส");
  const [sessions, setSessions] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(prev => {
        if (prev <= 1) {
          clearInterval(ref.current); setRunning(false);
          if (mode === "โฟกัส") { setSessions(n => n+1); supabase.from("sessions").insert({ minutes: Math.floor(total/60) }); }
          alert("⏰ หมดเวลา! " + (mode === "โฟกัส" ? "พักสักครู่นะ 😊" : "กลับมาโฟกัส!"));
          return 0;
        }
        return prev - 1;
      }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running, mode, total]);

  const pad = n => String(n).padStart(2, "0");
  const timeStr = pad(Math.floor(secs / 60)) + ":" + pad(secs % 60);
  const circ = 2 * Math.PI * 80;
  const offset = circ * (secs / total);

  const modes = [
    { mins: 25, label: "โฟกัส", icon: "🧠", color: C.accent },
    { mins: 5, label: "พักสั้น", icon: "☕", color: C.green },
    { mins: 15, label: "พักยาว", icon: "🌿", color: C.blue },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em" }}>⏱ จับเวลาเรียน</h1>
        <p style={{ color: C.ink2, fontSize: "0.82rem", marginTop: 4 }}>Session วันนี้: <span style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}>{sessions}</span> ครั้ง</p>
      </div>

      <div className="timer-modes" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20, maxWidth: 520 }}>
        {modes.map(m => (
          <div key={m.label} onClick={() => { clearInterval(ref.current); setRunning(false); setTotal(m.mins*60); setSecs(m.mins*60); setMode(m.label); }} style={{
            padding: "14px 10px", borderRadius: 12, textAlign: "center", cursor: "pointer",
            background: mode === m.label ? `${m.color}15` : C.glass,
            border: `1px solid ${mode === m.label ? m.color : C.glassBorder}`,
            boxShadow: mode === m.label ? `0 0 20px ${m.color}20` : "none",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", fontWeight: 500, color: mode === m.label ? m.color : C.ink }}>{String(m.mins).padStart(2,"0")}:00</div>
            <div style={{ fontSize: "0.6rem", color: C.ink2, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <Card glow style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", maxWidth: 520, marginBottom: 20 }}>
        <div style={{ position: "relative", width: 180, height: 180, marginBottom: 24 }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="90" cy="90" r="80" fill="none" stroke={C.accent} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 12px ${C.accent})` }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 500 }}>{timeStr}</div>
            <div style={{ fontSize: "0.65rem", color: C.ink2, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 4 }}>{mode}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => setRunning(r => !r)} style={{ padding: "12px 28px", fontSize: "0.9rem" }}>
            {running ? "⏸ หยุด" : "▶ เริ่มเรียน"}
          </Btn>
          <Btn variant="ghost" onClick={() => { clearInterval(ref.current); setRunning(false); setSecs(total); }} style={{ padding: "12px 16px" }}>↺</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────
function Tasks({ isPro }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const addTask = async () => {
    if (!input.trim()) return;
    // Free limit: 10 tasks
    if (!isPro && tasks.length >= 10) {
      alert("🔒 Free plan จำกัด 10 งาน\nอัปเกรดเป็น Pro เพื่อเพิ่มงานไม่จำกัดครับ!");
      return;
    }
    const { data } = await supabase.from("tasks").insert({ text: input.trim(), done: false }).select().single();
    if (data) setTasks(prev => [data, ...prev]);
    setInput("");
  };

  const toggleTask = async (id, done) => {
    await supabase.from("tasks").update({ done: !done }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const filtered = filter === "all" ? tasks : filter === "pending" ? tasks.filter(t => !t.done) : tasks.filter(t => t.done);
  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em" }}>✅ งานที่ต้องทำ</h1>
        <p style={{ color: C.ink2, fontSize: "0.82rem", marginTop: 4 }}>
          เสร็จแล้ว {doneCount}/{tasks.length} รายการ
          {!isPro && <span style={{ color: C.accent, marginLeft: 8 }}>({tasks.length}/10 Free)</span>}
        </p>
      </div>

      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: tasks.length ? `${(doneCount/tasks.length)*100}%` : "0%", background: `linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius: 99, transition: "width 0.5s" }} />
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="เพิ่มงานใหม่... กด Enter"
            style={{ flex: 1, padding: "11px 14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, borderRadius: 10, color: C.ink, fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem", outline: "none" }} />
          <Btn onClick={addTask} style={{ padding: "11px 18px", whiteSpace: "nowrap" }}>+ เพิ่ม</Btn>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["all","ทั้งหมด"], ["pending","ค้างอยู่"], ["done","เสร็จแล้ว"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: filter === v ? `${C.accent}20` : C.glass,
            color: filter === v ? C.accent : C.ink2,
            fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.78rem", fontWeight: filter === v ? 600 : 400,
            border: `1px solid ${filter === v ? C.accent+"40" : C.glassBorder}`,
          }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: C.ink2 }}>⏳ กำลังโหลด...</div>
        : filtered.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.ink2 }}>🎉 ไม่มีงานในหมวดนี้!</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id, t.done)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 12, border: `1px solid ${t.done ? C.green+"25" : C.glassBorder}`,
                background: t.done ? `${C.green}05` : C.glass, cursor: "pointer", transition: "all 0.2s",
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: t.done ? C.green : "transparent", border: `2px solid ${t.done ? C.green : C.glassBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", boxShadow: t.done ? `0 0 10px ${C.green}40` : "none" }}>{t.done ? "✓" : ""}</div>
                <div style={{ flex: 1, fontSize: "0.85rem", textDecoration: t.done ? "line-through" : "none", color: t.done ? C.ink2 : C.ink }}>{t.text}</div>
                <button onClick={e => { e.stopPropagation(); deleteTask(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink2, fontSize: "0.75rem", opacity: 0.5, padding: "4px 8px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── GPA ──────────────────────────────────────────────────────────
function GPA({ isPro }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "" });

  useEffect(() => { loadSubjects(); }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const { data } = await supabase.from("subjects").select("*").order("created_at");
    if (data) setSubjects(data);
    setLoading(false);
  };

  const gradeMap = { "A":4, "B+":3.5, "B":3, "C+":2.5, "C":2, "D+":1.5, "D":1, "F":0 };
  const gradeToGPA = g => gradeMap[g] || 0;
  const gradeColor = g => { const v = gradeToGPA(g); return v >= 3.5 ? C.green : v >= 2.5 ? C.blue : v >= 2 ? C.yellow : C.red; };
  const avgGPA = subjects.length > 0 ? (subjects.reduce((s, x) => s + gradeToGPA(x.grade), 0) / subjects.length).toFixed(2) : "0.00";
  const gpaColor = parseFloat(avgGPA) >= 3.5 ? C.green : parseFloat(avgGPA) >= 3 ? C.blue : parseFloat(avgGPA) >= 2 ? C.yellow : C.red;

  const addSubject = async () => {
    if (!form.name) return;
    if (!isPro && subjects.length >= 5) { alert("🔒 Free plan จำกัด 5 วิชา\nอัปเกรด Pro เพื่อเพิ่มไม่จำกัด!"); return; }
    const { data } = await supabase.from("subjects").insert(form).select().single();
    if (data) setSubjects(prev => [...prev, data]);
    setForm({ name: "", grade: "" }); setShowForm(false);
  };

  const deleteSubject = async (id) => {
    await supabase.from("subjects").delete().eq("id", id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em" }}>🎯 เป้าหมาย GPA</h1>
        <p style={{ color: C.ink2, fontSize: "0.82rem", marginTop: 4 }}>
          {!isPro && <span style={{ color: C.accent }}>{subjects.length}/5 วิชา (Free) · </span>}
          ติดตามผลการเรียนรายวิชา
        </p>
      </div>

      <div className="gpa-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <Card glow style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: "0.62rem", color: C.ink2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>GPA เฉลี่ย</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3.5rem", fontWeight: 500, color: gpaColor, lineHeight: 1, filter: `drop-shadow(0 0 16px ${gpaColor})` }}>{avgGPA}</div>
          <div style={{ marginTop: 14, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(parseFloat(avgGPA)/4)*100}%`, background: gpaColor, borderRadius: 99, boxShadow: `0 0 8px ${gpaColor}` }} />
          </div>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: 18 }}>
          {[{ num: subjects.length, label: "วิชาทั้งหมด", color: C.blue }, { num: subjects.filter(s => gradeToGPA(s.grade) >= 3.5).length, label: "เกรด A", color: C.green }].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.8rem", color: item.color }}>{item.num}</div>
              <div style={{ fontSize: "0.65rem", color: C.ink2 }}>{item.label}</div>
            </div>
          ))}
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: 18 }}>
          {[{ num: subjects.filter(s => gradeToGPA(s.grade) < 2).length, label: "ต้องระวัง", color: C.red }, { num: subjects.filter(s => !s.grade).length, label: "ยังไม่มีเกรด", color: C.yellow }].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.8rem", color: item.color }}>{item.num}</div>
              <div style={{ fontSize: "0.65rem", color: C.ink2 }}>{item.label}</div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700 }}>วิชาทั้งหมด</div>
          <Btn onClick={() => setShowForm(!showForm)} style={{ padding: "7px 14px", fontSize: "0.75rem" }}>+ เพิ่มวิชา</Btn>
        </div>

        {showForm && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid ${C.glassBorder}` }}>
            <input placeholder="ชื่อวิชา เช่น CS211" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ flex: 2, minWidth: 120, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, borderRadius: 8, color: C.ink, fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.82rem", outline: "none" }} />
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
              style={{ flex: 1, minWidth: 80, padding: "9px 10px", background: "#0e0e1a", border: `1px solid ${C.glassBorder}`, borderRadius: 8, color: C.ink, fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.82rem" }}>
              <option value="">เกรด</option>
              {Object.keys(gradeMap).map(g => <option key={g}>{g}</option>)}
            </select>
            <Btn onClick={addSubject} style={{ padding: "9px 14px" }}>บันทึก</Btn>
          </div>
        )}

        {loading ? <div style={{ textAlign: "center", padding: 20, color: C.ink2 }}>⏳</div>
          : subjects.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: C.ink2, fontSize: "0.85rem" }}>กด "+ เพิ่มวิชา" เพื่อเริ่มต้น</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subjects.map((sub, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.glassBorder}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>{sub.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Chip label={`${sub.grade || "?"} · ${gradeToGPA(sub.grade).toFixed(1)}`} color={gradeColor(sub.grade)} />
                      <button onClick={() => deleteSubject(sub.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink2, fontSize: "0.75rem", opacity: 0.5 }}>✕</button>
                    </div>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(gradeToGPA(sub.grade)/4)*100}%`, background: gradeColor(sub.grade), borderRadius: 99, boxShadow: `0 0 6px ${gradeColor(sub.grade)}` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
      </Card>
    </div>
  );
}

// ─── PRO PAGE ─────────────────────────────────────────────────────
function ProPage({ isPro, setShowUpgrade }) {
  if (isPro) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>⚡</div>
      <h2 style={{ fontWeight: 700, fontSize: "1.5rem", color: C.accent }}>คุณเป็นสมาชิก Pro แล้ว!</h2>
      <p style={{ color: C.ink2, marginTop: 8 }}>ขอบคุณที่สนับสนุน StudyFlow ครับ 🙏</p>
    </div>
  );
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          อัปเกรดเป็น <span style={{ color: C.accent }}>Pro</span>
        </h1>
        <p style={{ color: C.ink2, marginTop: 8 }}>ปลดล็อคทุกฟีเจอร์ ไม่มีข้อจำกัด</p>
      </div>

      <div className="pro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 600, margin: "0 auto 32px" }}>
        <Card style={{ border: `2px solid ${C.accent}`, background: `${C.accent}08`, padding: 24 }}>
          <Chip label="ยอดนิยม" color={C.accent} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.5rem", fontWeight: 500, color: C.accent, margin: "12px 0 4px" }}>49฿</div>
          <div style={{ fontSize: "0.78rem", color: C.ink2, marginBottom: 20 }}>ต่อเดือน</div>
          <Btn variant="pro" fullWidth onClick={() => setShowUpgrade(true)}>เลือกแผนนี้</Btn>
        </Card>
        <Card style={{ padding: 24 }}>
          <Chip label="ประหยัด 32%" color={C.green} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.5rem", fontWeight: 500, color: C.green, margin: "12px 0 4px" }}>399฿</div>
          <div style={{ fontSize: "0.78rem", color: C.ink2, marginBottom: 20 }}>ต่อปี</div>
          <Btn variant="ghost" fullWidth onClick={() => setShowUpgrade(true)}>เลือกแผนนี้</Btn>
        </Card>
      </div>

      <Card style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Pro ได้อะไรบ้าง?</div>
        <div className="pro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["✨", "AI Study Coach", "วิเคราะห์การเรียน"],
            ["📚", "วิชาไม่จำกัด", "Free: 5 วิชา"],
            ["✅", "งานไม่จำกัด", "Free: 10 งาน"],
            ["📊", "สถิติละเอียด", "รายสัปดาห์/เดือน"],
            ["📄", "Export PDF", "ส่งออกรายงาน"],
            ["🔔", "แจ้งเตือน", "Deadline อัตโนมัติ"],
          ].map(([icon, title, sub], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.glassBorder}` }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: "0.65rem", color: C.ink2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────
export default function Dashboard() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false); // TODO: เชื่อม Stripe จริงๆ
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const nav = [
    { id: "home", icon: "🏠", label: "หน้าหลัก" },
    { id: "timer", icon: "⏱", label: "Timer" },
    { id: "tasks", icon: "✅", label: "งาน" },
    { id: "gpa", icon: "🎯", label: "GPA" },
    { id: "pro", icon: "⚡", label: "Pro" },
  ];

  const pages = {
    home: <Home user={user} isPro={isPro} />,
    timer: <Timer />,
    tasks: <Tasks isPro={isPro} />,
    gpa: <GPA isPro={isPro} />,
    pro: <ProPage isPro={isPro} setShowUpgrade={setShowUpgrade} />,
  };

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.ink2, fontFamily: "'Space Grotesk', sans-serif", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: "0.82rem" }}>กำลังโหลด...</span>
    </div>
  );

  return (
    <>
      <style>{globalStyle}</style>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse 80% 50% at 20% 20%, ${C.accentGlow} 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(77,184,255,0.08) 0%, transparent 60%)`, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* Desktop Sidebar */}
        <div className="sidebar" style={{ width: 240, background: "rgba(8,8,16,0.9)", backdropFilter: "blur(20px)", borderRight: `1px solid ${C.glassBorder}`, padding: "24px 16px", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px", borderBottom: `1px solid ${C.glassBorder}`, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 4px 16px ${C.accentGlow}` }}>📚</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: C.ink, letterSpacing: "-0.02em" }}>StudyFlow</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: C.ink2 }}>v1.0 · AI-Powered</div>
            </div>
          </div>

          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, cursor: "pointer", border: "none", width: "100%", textAlign: "left",
              background: page === n.id ? `${C.accent}15` : "transparent",
              color: page === n.id ? C.accent : n.id === "pro" ? C.yellow : C.ink2,
              fontWeight: page === n.id ? 600 : 400, fontSize: "0.85rem",
              fontFamily: "'Space Grotesk', sans-serif",
              borderLeft: page === n.id ? `2px solid ${C.accent}` : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{n.icon}</span>
              {n.label}
              {n.id === "pro" && !isPro && <Chip label="NEW" color={C.yellow} />}
              {page === n.id && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />}
            </button>
          ))}

          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.glassBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: C.glass, border: `1px solid ${C.glassBorder}`, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                {(user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: C.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
                <Chip label={isPro ? "PRO ⚡" : "FREE"} color={isPro ? C.accent : C.ink2} />
              </div>
            </div>
            {!isPro && (
              <Btn variant="pro" fullWidth onClick={() => setShowUpgrade(true)} style={{ marginBottom: 8, padding: "9px 12px", fontSize: "0.78rem" }}>
                ⚡ อัปเกรด Pro
              </Btn>
            )}
            <button onClick={handleLogout} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.red}30`, background: `${C.red}10`, color: C.red, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.78rem", fontWeight: 500 }}>
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {pages[page]}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="bottom-nav" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(8,8,16,0.95)", backdropFilter: "blur(20px)",
          borderTop: `1px solid ${C.glassBorder}`,
          padding: "8px 4px 12px", gap: 0, justifyContent: "space-around", alignItems: "center",
        }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
              color: page === n.id ? C.accent : C.ink2,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <span style={{ fontSize: "1.3rem" }}>{n.icon}</span>
              <span style={{ fontSize: "0.58rem", fontWeight: page === n.id ? 600 : 400 }}>{n.label}</span>
              {page === n.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />}
            </button>
          ))}
        </div>

      </div>
    </>
  );
}