import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { TasksPage, GPAPage } from "./TasksAndGPA";

// ─── THEME ────────────────────────────────────────────────────────
const themes = {
  dark: {
    bg: "#0f1117", bg2: "#161b27", card: "#1a2035", cardHover: "#1e2640",
    border: "#2a3352", ink: "#e8eeff", ink2: "#7b8db5", ink3: "#3d4f75",
    accent: "#6366f1", accentLight: "rgba(99,102,241,0.15)", accentGlow: "rgba(99,102,241,0.3)",
    green: "#10d9a0", greenLight: "rgba(16,217,160,0.12)",
    red: "#f43f5e", redLight: "rgba(244,63,94,0.12)",
    yellow: "#f59e0b", yellowLight: "rgba(245,158,11,0.12)",
    blue: "#38bdf8", blueLight: "rgba(56,189,248,0.12)",
    purple: "#a855f7", purpleLight: "rgba(168,85,247,0.12)",
    shadow: "0 4px 24px rgba(0,0,0,0.4)", shadowLg: "0 8px 48px rgba(0,0,0,0.5)",
  },
  light: {
    bg: "#f8f9fe", bg2: "#f0f2fa", card: "#ffffff", cardHover: "#f8f9fe",
    border: "#e2e6f3", ink: "#1a1f36", ink2: "#5c6898", ink3: "#b0b9d8",
    accent: "#6366f1", accentLight: "rgba(99,102,241,0.08)", accentGlow: "rgba(99,102,241,0.2)",
    green: "#059669", greenLight: "rgba(5,150,105,0.08)",
    red: "#e11d48", redLight: "rgba(225,29,72,0.08)",
    yellow: "#d97706", yellowLight: "rgba(217,119,6,0.08)",
    blue: "#0284c7", blueLight: "rgba(2,132,199,0.08)",
    purple: "#7c3aed", purpleLight: "rgba(124,58,237,0.08)",
    shadow: "0 2px 12px rgba(0,0,0,0.06)", shadowLg: "0 8px 32px rgba(0,0,0,0.1)",
  }
};

const getCSS = (t) => `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${t.bg}; color: ${t.ink}; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 99px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes popIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes countdown { from{opacity:0;transform:scale(1.1)} to{opacity:1;transform:scale(1)} }
  @keyframes celebrate { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }
  @keyframes progress { from{width:0} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  
  .nav-btn:hover { background: ${t.accentLight} !important; color: ${t.accent} !important; }
  .card-hover { transition: all 0.2s ease; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: ${t.shadowLg} !important; }
  .input-field:focus { border-color: ${t.accent} !important; box-shadow: 0 0 0 3px ${t.accentGlow} !important; outline: none; }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-ghost:hover { border-color: ${t.ink2} !important; color: ${t.ink} !important; }
  .habit-btn:hover { transform: scale(1.1); }
  .leaderboard-row:hover { background: ${t.accentLight} !important; }

  .bottom-nav { display: none; }
  .sidebar { display: flex !important; }
  @media (max-width: 768px) {
    .sidebar { display: none !important; }
    .bottom-nav { display: flex !important; }
    .main-area { padding: 14px !important; padding-bottom: 76px !important; }
    .stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .home-grid { grid-template-columns: 1fr !important; }
    .gpa-top { grid-template-columns: 1fr 1fr !important; }
    .timer-wrap { grid-template-columns: 1fr !important; }
  }
`;

// ─── UTILS ────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, "0");

// ─── BASE COMPONENTS ──────────────────────────────────────────────
const Btn = ({ children, variant = "primary", onClick, disabled, style = {}, fullWidth, size = "md" }) => {
  const sizes = { sm: "6px 14px", md: "10px 20px", lg: "13px 28px" };
  const v = {
    primary: { background: "#6366f1", color: "#fff", border: "none" },
    ghost: { background: "transparent", border: "1px solid currentColor" },
    danger: { background: "transparent", border: "1px solid #f43f5e", color: "#f43f5e" },
    pro: { background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#fff", border: "none" },
    success: { background: "linear-gradient(135deg, #10d9a0, #059669)", color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`btn-${variant}`} style={{
      padding: sizes[size], borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem",
      transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
      width: fullWidth ? "100%" : "auto", ...v[variant], ...style,
    }}>{children}</button>
  );
};

const Ring = ({ value = 0, max = 100, color, size = 80, strokeWidth = 6, children }) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / max, 1));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}20`} strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

function Clock({ t }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", color: t.accent, letterSpacing: "0.05em", lineHeight: 1 }}>
        {pad(now.getHours())}:{pad(now.getMinutes())}<span style={{ opacity: 0.4 }}>:{pad(now.getSeconds())}</span>
      </div>
      <div style={{ fontSize: "0.72rem", color: t.ink2, marginTop: 3 }}>
        {now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "short" })}
      </div>
    </div>
  );
}

function MiniChart({ data = [], color, height = 32 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 3, height: `${Math.max((v/max)*100, 8)}%`, background: i === data.length-1 ? color : `${color}40`, transition: "height 0.6s ease" }} />
      ))}
    </div>
  );
}

// ─── UPGRADE MODAL ────────────────────────────────────────────────
function UpgradeModal({ onClose, t }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("monthly");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 24, padding: 32, maxWidth: 440, width: "100%", animation: "popIn 0.3s ease", boxShadow: t.shadowLg }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px", boxShadow: `0 8px 24px ${t.accentGlow}` }}>⚡</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: t.ink }}>อัปเกรดเป็น Pro</div>
          <p style={{ color: t.ink2, fontSize: "0.85rem", marginTop: 6 }}>ปลดล็อคทุกฟีเจอร์ ไม่มีข้อจำกัด</p>
        </div>
        <div style={{ display: "flex", background: t.bg2, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[["monthly","รายเดือน","49฿"], ["yearly","รายปี","399฿"]].map(([id, label, price]) => (
            <button key={id} onClick={() => setPlan(id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 9, border: "none", cursor: "pointer", background: plan === id ? t.card : "transparent", color: plan === id ? t.ink : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: plan === id ? 600 : 400, fontSize: "0.82rem", boxShadow: plan === id ? t.shadow : "none", transition: "all 0.2s" }}>
              {label} <span style={{ color: t.accent, fontFamily: "'JetBrains Mono', monospace" }}>{price}</span>
              {id === "yearly" && <span style={{ marginLeft: 6, fontSize: "0.6rem", color: t.green, background: t.greenLight, padding: "1px 6px", borderRadius: 99 }}>-32%</span>}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {["✨ AI Study Coach วิเคราะห์การเรียน","🏆 Leaderboard แข่งกับเพื่อน","📅 Habit Tracker ไม่จำกัด","⏰ Exam Countdown ทุกวิชา","📚 วิชาและงานไม่จำกัด","📊 สถิติเชิงลึกรายสัปดาห์"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.84rem", color: t.ink2 }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, background: t.greenLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: t.green, flexShrink: 0 }}>✓</div>
              {f}
            </div>
          ))}
        </div>
        <Btn variant="pro" fullWidth onClick={() => { setLoading(true); setTimeout(() => { alert("🚀 Stripe Checkout — เร็วๆ นี้!"); setLoading(false); }, 800); }} disabled={loading} size="lg" style={{ borderRadius: 12, fontSize: "0.9rem" }}>
          {loading ? "⏳ กำลังโหลด..." : `🚀 อัปเกรด ${plan === "monthly" ? "49฿/เดือน" : "399฿/ปี"}`}
        </Btn>
        <p style={{ textAlign: "center", fontSize: "0.68rem", color: t.ink2, marginTop: 10 }}>ทดลองใช้ฟรี 30 วัน • ยกเลิกได้ทุกเมื่อ • PromptPay + บัตรเครดิต</p>
        <button onClick={onClose} style={{ display: "block", margin: "8px auto 0", background: "none", border: "none", color: t.ink2, cursor: "pointer", fontSize: "0.78rem" }}>ยกเลิก</button>
      </div>
    </div>
  );
}

// ─── EXAM COUNTDOWN ───────────────────────────────────────────────
function ExamCountdown({ t }) {
  const [exams, setExams] = useState(() => {
    try { return JSON.parse(localStorage.getItem("studyflow_exams") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", subject: "" });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem("studyflow_exams", JSON.stringify(exams));
  }, [exams]);

  const addExam = () => {
    if (!form.name || !form.date) return;
    setExams(prev => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: "", date: "", subject: "" });
    setShowAdd(false);
  };

  const getDiff = (dateStr) => {
    const target = new Date(dateStr);
    const diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, mins, secs, diff };
  };

  const urgencyColor = (diff) => {
    if (!diff) return t.ink2;
    const days = diff.days;
    if (days <= 1) return t.red;
    if (days <= 7) return t.yellow;
    return t.green;
  };

  const upcoming = exams
    .map(e => ({ ...e, diff: getDiff(e.date) }))
    .filter(e => e.diff)
    .sort((a, b) => a.diff.diff - b.diff.diff);

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>⏰ นับถอยหลังสอบ</div>
          <div style={{ fontSize: "0.7rem", color: t.ink2, marginTop: 2 }}>{upcoming.length} วิชาที่กำลังจะสอบ</div>
        </div>
        <Btn onClick={() => setShowAdd(!showAdd)} size="sm" style={{ borderRadius: 8 }}>+ เพิ่มสอบ</Btn>
      </div>

      {showAdd && (
        <div style={{ background: t.bg2, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="ชื่อการสอบ เช่น Midterm CS211" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="input-field"
            style={{ padding: "9px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", width: "100%", outline: "none" }} />
          <input placeholder="วิชา (ไม่บังคับ)" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
            className="input-field"
            style={{ padding: "9px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", width: "100%", outline: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="input-field"
              style={{ flex: 1, padding: "9px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
            <Btn onClick={addExam} style={{ borderRadius: 10 }}>บันทึก</Btn>
          </div>
        </div>
      )}

      {upcoming.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: t.ink2, fontSize: "0.85rem" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
          ยังไม่มีสอบที่ตั้งไว้
        </div>
      ) : upcoming.slice(0, 3).map((exam, i) => {
        const color = urgencyColor(exam.diff);
        const isUrgent = exam.diff.days <= 1;
        return (
          <div key={exam.id} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${color}30`, background: `${color}08`, marginBottom: 8, animation: isUrgent ? "celebrate 2s ease infinite" : `fadeUp 0.3s ease ${i*0.05}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: t.ink }}>{exam.name}</div>
                {exam.subject && <div style={{ fontSize: "0.7rem", color: t.ink2, marginTop: 2 }}>{exam.subject}</div>}
              </div>
              <button onClick={() => setExams(prev => prev.filter(e => e.id !== exam.id))} style={{ background: "none", border: "none", cursor: "pointer", color: t.ink3, fontSize: "0.75rem" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["วัน", exam.diff.days], ["ชม.", exam.diff.hours], ["นาที", exam.diff.mins], ["วิ", exam.diff.secs]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center", background: t.card, borderRadius: 8, padding: "8px 4px", border: `1px solid ${color}30` }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 500, color, lineHeight: 1, animation: "countdown 0.3s ease" }}>{String(val).padStart(2, "0")}</div>
                  <div style={{ fontSize: "0.58rem", color: t.ink2, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
            {isUrgent && (
              <div style={{ marginTop: 8, padding: "5px 10px", background: t.redLight, borderRadius: 8, fontSize: "0.72rem", color: t.red, fontWeight: 600, textAlign: "center", animation: "pulse 1s ease infinite" }}>
                🚨 สอบพรุ่งนี้แล้ว! รีบอ่านด้วยนะ!
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── HABIT TRACKER ────────────────────────────────────────────────
function HabitTracker({ t }) {
  const defaultHabits = [
    { id: 1, name: "อ่านหนังสือ 1 ชม.", icon: "📚", color: "#6366f1" },
    { id: 2, name: "ทบทวนบทเรียน", icon: "📝", color: "#10d9a0" },
    { id: 3, name: "ออกกำลังกาย", icon: "🏃", color: "#f59e0b" },
    { id: 4, name: "นอนก่อนเที่ยงคืน", icon: "😴", color: "#38bdf8" },
  ];

  const today = new Date().toISOString().split("T")[0];
  const [habits, setHabits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("studyflow_habits") || JSON.stringify(defaultHabits)); } catch { return defaultHabits; }
  });
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("studyflow_habit_logs") || "{}"); } catch { return {}; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState("");

  useEffect(() => { localStorage.setItem("studyflow_habits", JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem("studyflow_habit_logs", JSON.stringify(logs)); }, [logs]);

  const toggle = (habitId) => {
    const key = `${today}_${habitId}`;
    setLogs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isDone = (habitId) => !!logs[`${today}_${habitId}`];

  // สร้าง 7 วันย้อนหลัง
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const doneToday = habits.filter(h => isDone(h.id)).length;
  const pct = habits.length ? Math.round(doneToday / habits.length * 100) : 0;

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const emojis = ["⭐", "💪", "🎯", "✅", "🔥", "📖"];
    setHabits(prev => [...prev, { id: Date.now(), name: newHabit.trim(), icon: emojis[Math.floor(Math.random()*emojis.length)], color: "#6366f1" }]);
    setNewHabit(""); setShowAdd(false);
  };

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>🔥 Habit Tracker</div>
          <div style={{ fontSize: "0.7rem", color: t.ink2, marginTop: 2 }}>วันนี้ทำได้ {doneToday}/{habits.length} อย่าง</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 600, color: pct === 100 ? t.green : t.accent }}>{pct}%</div>
          <Btn onClick={() => setShowAdd(!showAdd)} size="sm" style={{ borderRadius: 8 }}>+</Btn>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: t.border, borderRadius: 99, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, ${t.green}, #059669)` : `linear-gradient(90deg, ${t.accent}, ${t.purple})`, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>

      {showAdd && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input placeholder="เพิ่ม habit ใหม่..." value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === "Enter" && addHabit()}
            className="input-field"
            style={{ flex: 1, padding: "8px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
          <Btn onClick={addHabit} size="sm" style={{ borderRadius: 8 }}>เพิ่ม</Btn>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {habits.map(habit => {
          const done = isDone(habit.id);
          return (
            <div key={habit.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Check button */}
              <button className="habit-btn" onClick={() => toggle(habit.id)} style={{
                width: 36, height: 36, borderRadius: 10, border: `2px solid ${done ? habit.color : t.border}`,
                background: done ? habit.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: done ? 16 : 18, cursor: "pointer", transition: "all 0.2s",
                boxShadow: done ? `0 0 12px ${habit.color}50` : "none", flexShrink: 0,
              }}>{done ? "✓" : habit.icon}</button>

              {/* Name */}
              <div style={{ flex: 1, fontSize: "0.84rem", fontWeight: 500, color: done ? t.ink2 : t.ink, textDecoration: done ? "line-through" : "none" }}>
                {habit.name}
              </div>

              {/* 7-day history dots */}
              <div style={{ display: "flex", gap: 3 }}>
                {last7Days.map((day, i) => (
                  <div key={day} title={day} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: logs[`${day}_${habit.id}`] ? habit.color : t.border,
                    opacity: i === 6 ? 1 : 0.6,
                    boxShadow: logs[`${day}_${habit.id}`] && i === 6 ? `0 0 6px ${habit.color}` : "none",
                  }} />
                ))}
              </div>

              <button onClick={() => setHabits(prev => prev.filter(h => h.id !== habit.id))} style={{ background: "none", border: "none", cursor: "pointer", color: t.ink3, fontSize: "0.7rem", flexShrink: 0 }}>✕</button>
            </div>
          );
        })}
      </div>

      {pct === 100 && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: t.greenLight, borderRadius: 10, textAlign: "center", fontSize: "0.85rem", color: t.green, fontWeight: 600, animation: "celebrate 1s ease infinite" }}>
          🎉 เยี่ยมมาก! ทำครบทุก Habit วันนี้แล้ว!
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────
function Leaderboard({ user, todayMin, t, onUpgrade, isPro }) {
  // Mock data + real user
  const userMin = todayMin;
  const mockUsers = [
    { name: "ปลา 🐠", min: 240, avatar: "ป" },
    { name: "มิ้ว 🐱", min: 195, avatar: "ม" },
    { name: "เบียร์ 🍺", min: 180, avatar: "บ" },
    { name: "แนน 🌸", min: 150, avatar: "น" },
    { name: "บอส 💪", min: 120, avatar: "บ" },
  ];

  const me = { name: "คุณ 👤", min: userMin, avatar: (user?.email || "?").charAt(0).toUpperCase(), isMe: true };
  const allUsers = [...mockUsers, me].sort((a, b) => b.min - a.min);
  const maxMin = Math.max(...allUsers.map(u => u.min), 1);
  const myRank = allUsers.findIndex(u => u.isMe) + 1;

  const rankEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const rankColors = [t.yellow, t.ink2, "#cd7f32", t.ink2, t.ink2, t.accent];

  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>🏆 Leaderboard</div>
          <div style={{ fontSize: "0.7rem", color: t.ink2, marginTop: 2 }}>อันดับโฟกัสวันนี้</div>
        </div>
        <div style={{ background: myRank <= 3 ? t.yellowLight : t.accentLight, color: myRank <= 3 ? t.yellow : t.accent, fontSize: "0.78rem", fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>
          {rankEmoji(myRank)} อันดับ {myRank}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {allUsers.map((u, i) => (
          <div key={i} className="leaderboard-row" style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
            background: u.isMe ? t.accentLight : "transparent",
            border: `1px solid ${u.isMe ? t.accent + "40" : "transparent"}`,
            transition: "all 0.2s", cursor: "default",
          }}>
            {/* Rank */}
            <div style={{ width: 28, textAlign: "center", fontSize: i < 3 ? "1.1rem" : "0.82rem", fontFamily: "'JetBrains Mono', monospace", color: rankColors[i] || t.ink2, fontWeight: 600, flexShrink: 0 }}>
              {rankEmoji(i + 1)}
            </div>

            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.isMe ? t.accent : t.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: u.isMe ? "#fff" : t.ink2, flexShrink: 0, border: `2px solid ${u.isMe ? t.accent : t.border}` }}>
              {u.avatar}
            </div>

            {/* Name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: u.isMe ? 700 : 500, color: u.isMe ? t.accent : t.ink, marginBottom: 4 }}>
                {u.name} {u.isMe && <span style={{ fontSize: "0.65rem", color: t.accent }}>← คุณ</span>}
              </div>
              <div style={{ height: 4, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(u.min / maxMin) * 100}%`, background: u.isMe ? t.accent : `${rankColors[i] || t.ink2}80`, borderRadius: 99, transition: "width 0.8s ease" }} />
              </div>
            </div>

            {/* Time */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: u.isMe ? t.accent : t.ink2, fontWeight: u.isMe ? 700 : 400, flexShrink: 0 }}>
              {Math.floor(u.min / 60)}h{u.min % 60 > 0 ? ` ${u.min % 60}m` : ""}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: "8px 12px", background: t.bg2, borderRadius: 10, fontSize: "0.72rem", color: t.ink2, textAlign: "center" }}>
        💡 เรียนให้นานขึ้น อันดับจะขึ้นเองครับ! ตอนนี้คุณเรียน {Math.floor(userMin/60)}h {userMin%60}m แล้ว
      </div>
    </div>
  );
}

// ─── AI COACH ─────────────────────────────────────────────────────
function AICoach({ tasks, subjects, todayMin, isPro, onUpgrade, t }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const analyze = async () => {
    if (!isPro) { onUpgrade(); return; }
    setLoading(true); setOpen(true); setText("");
    const pending = tasks.filter(x => !x.done).map(x => x.text).join(", ") || "ไม่มีงานค้าง";
    const subs = subjects.map(s => `${s.name}(${s.grade || "?"})`).join(", ") || "ยังไม่มีวิชา";
    const prompt = `คุณเป็น AI โค้ชการเรียนสำหรับนักศึกษาไทย วิเคราะห์ข้อมูลนี้แล้วสรุปเป็นภาษาไทย กระชับ ให้กำลังใจ (3-4 ประโยค):
เวลาเรียนวันนี้: ${(todayMin/60).toFixed(1)}h | งานค้าง: ${pending} | วิชา: ${subs}
วิเคราะห์จุดแข็ง จุดเสี่ยง คำแนะนำที่ใช้ได้จริง`;
    try {
      const key = process.env.REACT_APP_GEMINI_API_KEY;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const d = await res.json();
      setText(d.candidates?.[0]?.content?.parts?.[0]?.text || "ไม่สามารถวิเคราะห์ได้ครับ");
    } catch { setText("⚠️ ไม่สามารถเชื่อมต่อ AI ได้ตอนนี้ครับ"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: `linear-gradient(135deg, ${t.accent}15, ${t.purple}10)`, border: `1px solid ${t.accent}30`, borderRadius: 16, padding: 20, marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${t.accent}, ${t.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 4px 16px ${t.accentGlow}`, animation: "float 3s ease infinite" }}>✨</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: t.ink }}>AI Study Coach</div>
            <div style={{ fontSize: "0.72rem", color: isPro ? t.accent : t.ink2 }}>{isPro ? "พร้อมวิเคราะห์การเรียนของคุณ" : "🔒 เฉพาะสมาชิก Pro"}</div>
          </div>
        </div>
        <Btn onClick={analyze} disabled={loading} variant={isPro ? "primary" : "pro"} style={{ borderRadius: 10 }}>
          {loading ? "⏳ วิเคราะห์..." : isPro ? "✨ วิเคราะห์ตอนนี้" : "⚡ อัปเกรด Pro"}
        </Btn>
      </div>
      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.accent}20` }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${t.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <span style={{ color: t.ink2, fontSize: "0.82rem" }}>AI กำลังวิเคราะห์...</span>
            </div>
          ) : <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: t.ink, animation: "fadeUp 0.4s ease" }}>{text}</p>}
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────
function Home({ user, isPro, onUpgrade, t }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [todayMin, setTodayMin] = useState(0);
  const [weekData, setWeekData] = useState([30, 45, 20, 60, 50, 25, 0]);
  const [miniSecs, setMiniSecs] = useState(25 * 60);
  const [miniRun, setMiniRun] = useState(false);
  const ref = useRef(null);
  const total = 25 * 60;

  useEffect(() => {
    (async () => {
      const { data: tk } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      const { data: sb } = await supabase.from("subjects").select("*");
      const today = new Date().toISOString().split("T")[0];
      const { data: ss } = await supabase.from("sessions").select("minutes").gte("created_at", today);
      if (tk) setTasks(tk);
      if (sb) setSubjects(sb);
      if (ss) { const m = ss.reduce((s, x) => s + x.minutes, 0); setTodayMin(m); setWeekData(p => { const n=[...p]; n[6]=m; return n; }); }
    })();
  }, []);

  useEffect(() => {
    if (miniRun) ref.current = setInterval(() => setMiniSecs(s => s > 0 ? s - 1 : 0), 1000);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [miniRun]);

  const gpa = g => ({ A:4, "B+":3.5, B:3, "C+":2.5, C:2, "D+":1.5, D:1, F:0 }[g] || 0);
  const avgGPA = subjects.length ? (subjects.reduce((s, x) => s + gpa(x.grade), 0) / subjects.length).toFixed(2) : "0.00";
  const pending = tasks.filter(x => !x.done).length;
  const done = tasks.filter(x => x.done).length;

  const stats = [
    { label: "เวลาเรียนวันนี้", value: `${(todayMin/60).toFixed(1)}h`, sub: "เป้า 4h/วัน", color: t.accent, pct: Math.min((todayMin/60)/4*100, 100), chart: weekData },
    { label: "งานค้าง", value: pending, sub: `${done} เสร็จแล้ว`, color: pending > 3 ? t.red : t.green, pct: tasks.length ? done/tasks.length*100 : 0, chart: [2,3,5,4,6,7,done] },
    { label: "GPA เฉลี่ย", value: avgGPA, sub: "เป้า 3.60", color: t.blue, pct: parseFloat(avgGPA)/4*100, chart: [3.0,3.1,3.2,3.3,3.2,3.4,parseFloat(avgGPA)||0] },
    { label: "Streak", value: "7🔥", sub: "วันติดต่อกัน", color: t.yellow, pct: 7/30*100, chart: [1,2,3,4,5,6,7] },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: t.ink2, marginBottom: 4 }}>{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: t.ink, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            สวัสดี, <span style={{ color: t.accent }}>{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</span> 👋
          </div>
        </div>
        <Clock t={t} />
      </div>

      <AICoach tasks={tasks} subjects={subjects} todayMin={todayMin} isPro={isPro} onUpgrade={onUpgrade} t={t} />

      {/* Stats */}
      <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {stats.map((s, i) => (
          <div key={i} className="card-hover" style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 16, boxShadow: t.shadow, animation: `fadeUp 0.4s ease ${i*0.05}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: "0.72rem", color: t.ink2, fontWeight: 500 }}>{s.label}</div>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.6rem", fontWeight: 500, color: s.color, lineHeight: 1, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: "0.68rem", color: t.ink2, marginBottom: 8 }}>{s.sub}</div>
            <div style={{ height: 3, background: t.border, borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 99, transition: "width 1s ease" }} />
            </div>
            <MiniChart data={s.chart} color={s.color} height={28} />
          </div>
        ))}
      </div>

      {/* 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Tasks preview */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 18, boxShadow: t.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>📋 งานค้าง</div>
            <div style={{ background: pending > 3 ? t.redLight : t.greenLight, color: pending > 3 ? t.red : t.green, fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>{pending}</div>
          </div>
          {tasks.filter(x => !x.done).slice(0, 4).length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: t.ink2, fontSize: "0.8rem" }}>🎉 ไม่มีงานค้าง!</div>
          ) : tasks.filter(x => !x.done).slice(0, 4).map((task, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: t.bg2, marginBottom: 5, animation: `slideIn 0.3s ease ${i*0.05}s both` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.text}</div>
            </div>
          ))}
          {/* Pomodoro mini */}
          <div style={{ marginTop: 12, padding: "10px", background: t.bg2, borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", color: t.accent, marginBottom: 6 }}>
              {pad(Math.floor(miniSecs/60))}:{pad(miniSecs%60)}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              <Btn onClick={() => setMiniRun(r => !r)} size="sm" style={{ borderRadius: 8, fontSize: "0.72rem" }}>
                {miniRun ? "⏸" : "▶"} {miniRun ? "หยุด" : "เริ่ม"}
              </Btn>
              <Btn variant="ghost" onClick={() => { setMiniRun(false); setMiniSecs(total); }} size="sm" style={{ borderRadius: 8, color: t.ink2, borderColor: t.border, fontSize: "0.72rem" }}>↺</Btn>
            </div>
          </div>
        </div>

        {/* Habit Tracker */}
        <HabitTracker t={t} />

        {/* Leaderboard */}
        <Leaderboard user={user} todayMin={todayMin} t={t} onUpgrade={onUpgrade} isPro={isPro} />
      </div>

      {/* Exam Countdown full width */}
      <ExamCountdown t={t} />
    </div>
  );
}

// ─── TIMER PAGE ───────────────────────────────────────────────────
function TimerPage({ t }) {
  const [secs, setSecs] = useState(25 * 60);
  const [total, setTotal] = useState(25 * 60);
  const [run, setRun] = useState(false);
  const [mode, setMode] = useState("โฟกัส");
  const [sessions, setSessions] = useState(0);
  const [history, setHistory] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (run) {
      ref.current = setInterval(() => setSecs(p => {
        if (p <= 1) {
          clearInterval(ref.current); setRun(false);
          if (mode === "โฟกัส") {
            setSessions(n => n + 1);
            const m = Math.floor(total / 60);
            setHistory(h => [{ time: new Date().toLocaleTimeString("th-TH", {hour:"2-digit",minute:"2-digit"}), min: m }, ...h.slice(0, 6)]);
            supabase.from("sessions").insert({ minutes: m });
          }
          return 0;
        }
        return p - 1;
      }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [run, mode, total]);

  const modes = [
    { label: "โฟกัส", mins: 25, color: t.accent, emoji: "🧠" },
    { label: "พักสั้น", mins: 5, color: t.green, emoji: "☕" },
    { label: "พักยาว", mins: 15, color: t.blue, emoji: "🌿" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>⏱ จับเวลาเรียน</div>
      <div style={{ color: t.ink2, fontSize: "0.82rem", marginBottom: 20 }}>วันนี้ทำไปแล้ว <span style={{ color: t.accent, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{sessions}</span> session</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16, maxWidth: 500 }}>
        {modes.map(m => (
          <div key={m.label} className="card-hover" onClick={() => { clearInterval(ref.current); setRun(false); setTotal(m.mins*60); setSecs(m.mins*60); setMode(m.label); }} style={{
            padding: 14, borderRadius: 14, textAlign: "center", cursor: "pointer",
            background: mode === m.label ? `${m.color}15` : t.card,
            border: `1px solid ${mode === m.label ? m.color : t.border}`,
            boxShadow: mode === m.label ? `0 0 20px ${m.color}20` : t.shadow,
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{m.emoji}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 500, color: mode === m.label ? m.color : t.ink }}>{String(m.mins).padStart(2,"0")}:00</div>
            <div style={{ fontSize: "0.68rem", color: t.ink2, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="timer-wrap" style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, maxWidth: 680 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, boxShadow: t.shadowLg }}>
          <Ring value={secs} max={total} color={t.accent} size={200} strokeWidth={8}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 500, color: t.ink }}>{pad(Math.floor(secs/60))}:{pad(secs%60)}</div>
            <div style={{ fontSize: "0.7rem", color: t.ink2, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{mode}</div>
          </Ring>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setRun(r => !r)} size="lg" style={{ borderRadius: 12, minWidth: 120 }}>
              {run ? "⏸ หยุด" : "▶ เริ่มเรียน"}
            </Btn>
            <Btn variant="ghost" onClick={() => { clearInterval(ref.current); setRun(false); setSecs(total); }} size="lg" style={{ borderRadius: 12, color: t.ink2, borderColor: t.border }}>↺</Btn>
          </div>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 20, boxShadow: t.shadow }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 14 }}>📋 ประวัติวันนี้</div>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: t.ink2, fontSize: "0.8rem" }}>ยังไม่มี session<br />เริ่มเรียนได้เลยครับ!</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "0.75rem", color: t.ink2 }}>{h.time}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: t.accent, fontWeight: 500 }}>{h.min} นาที</div>
            </div>
          ))}
          {history.length > 0 && (
            <div style={{ marginTop: 14, padding: 12, background: t.accentLight, borderRadius: 10 }}>
              <div style={{ fontSize: "0.68rem", color: t.ink2, marginBottom: 4 }}>รวมวันนี้</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", color: t.accent }}>{history.reduce((s, h) => s + h.min, 0)} นาที</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TASKS PAGE ───────────────────────────────────────────────────
function TasksPage({ isPro, onUpgrade, t }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const add = async () => {
    if (!input.trim()) return;
    if (!isPro && tasks.length >= 10) { onUpgrade(); return; }
    const { data } = await supabase.from("tasks").insert({ text: input.trim(), done: false }).select().single();
    if (data) setTasks(p => [data, ...p]);
    setInput("");
  };

  const toggle = async (id, done) => {
    await supabase.from("tasks").update({ done: !done }).eq("id", id);
    setTasks(p => p.map(x => x.id === id ? { ...x, done: !done } : x));
  };

  const del = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(p => p.filter(x => x.id !== id));
  };

  const filtered = filter === "all" ? tasks : filter === "pending" ? tasks.filter(x => !x.done) : tasks.filter(x => x.done);
  const done = tasks.filter(x => x.done).length;
  const pct = tasks.length ? Math.round(done/tasks.length*100) : 0;

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>✅ งานที่ต้องทำ</div>
      <div style={{ color: t.ink2, fontSize: "0.82rem", marginBottom: 16 }}>เสร็จแล้ว {done}/{tasks.length} รายการ {!isPro && <span style={{ color: t.accent }}>· {tasks.length}/10 Free</span>}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 6, background: t.border, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${t.accent}, ${t.green})`, borderRadius: 99, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: t.accent, fontWeight: 500 }}>{pct}%</div>
      </div>

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: t.shadow }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="เพิ่มงานใหม่... กด Enter"
            className="input-field"
            style={{ flex: 1, padding: "10px 14px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none", transition: "all 0.2s" }} />
          <Btn onClick={add} style={{ borderRadius: 10, whiteSpace: "nowrap" }}>+ เพิ่ม</Btn>
        </div>
      </div>

      <div style={{ display: "flex", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 4, marginBottom: 14, width: "fit-content", boxShadow: t.shadow }}>
        {[["all","ทั้งหมด",tasks.length], ["pending","ค้างอยู่",tasks.filter(x=>!x.done).length], ["done","เสร็จแล้ว",done]].map(([v, l, count]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: filter === v ? t.accent : "transparent", color: filter === v ? "#fff" : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.78rem", fontWeight: filter === v ? 600 : 400, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
            {l}
            <span style={{ background: filter === v ? "rgba(255,255,255,0.25)" : t.border, color: filter === v ? "#fff" : t.ink2, borderRadius: 99, padding: "0px 6px", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: t.ink2 }}>⏳ กำลังโหลด...</div>
        : filtered.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: t.ink2 }}>🎉 ไม่มีงานในหมวดนี้!</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((task, i) => (
              <div key={task.id} className="task-row card-hover" onClick={() => toggle(task.id, task.done)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: `1px solid ${task.done ? t.green+"30" : t.border}`, background: task.done ? t.greenLight : t.card, cursor: "pointer", transition: "all 0.2s", boxShadow: t.shadow, animation: `slideIn 0.3s ease ${i*0.03}s both` }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${task.done ? t.green : t.border}`, background: task.done ? t.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0, transition: "all 0.2s", boxShadow: task.done ? `0 0 10px ${t.green}50` : "none" }}>{task.done ? "✓" : ""}</div>
                <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500, textDecoration: task.done ? "line-through" : "none", color: task.done ? t.ink2 : t.ink }}>{task.text}</div>
                <button onClick={e => { e.stopPropagation(); del(task.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: t.ink3, fontSize: "0.75rem", padding: "4px 8px", borderRadius: 6 }}>✕</button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── GPA PAGE ─────────────────────────────────────────────────────
function GPAPage({ isPro, onUpgrade, t }) {
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

  const gradeMap = { A:4, "B+":3.5, B:3, "C+":2.5, C:2, "D+":1.5, D:1, F:0 };
  const gpa = g => gradeMap[g] || 0;
  const gColor = g => { const v = gpa(g); return v >= 3.5 ? t.green : v >= 2.5 ? t.blue : v >= 2 ? t.yellow : t.red; };
  const avg = subjects.length ? (subjects.reduce((s, x) => s + gpa(x.grade), 0) / subjects.length).toFixed(2) : "0.00";
  const avgColor = parseFloat(avg) >= 3.5 ? t.green : parseFloat(avg) >= 3 ? t.blue : parseFloat(avg) >= 2 ? t.yellow : t.red;

  const addSub = async () => {
    if (!form.name) return;
    if (!isPro && subjects.length >= 5) { onUpgrade(); return; }
    const { data } = await supabase.from("subjects").insert(form).select().single();
    if (data) setSubjects(p => [...p, data]);
    setForm({ name: "", grade: "" }); setShowForm(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>🎯 เป้าหมาย GPA</div>
      <div style={{ color: t.ink2, fontSize: "0.82rem", marginBottom: 20 }}>ติดตามผลการเรียนรายวิชา {!isPro && `· ${subjects.length}/5 วิชา`}</div>

      <div className="gpa-top" style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: t.shadow }}>
          <Ring value={parseFloat(avg)} max={4} color={avgColor} size={110} strokeWidth={7}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", fontWeight: 500, color: avgColor }}>{avg}</div>
            <div style={{ fontSize: "0.55rem", color: t.ink2, textTransform: "uppercase", letterSpacing: "0.1em" }}>GPA</div>
          </Ring>
          <div style={{ fontSize: "0.72rem", color: t.ink2 }}>GPA เฉลี่ย</div>
        </div>
        {[
          { num: subjects.length, label: "วิชาทั้งหมด", color: t.blue, icon: "📚" },
          { num: subjects.filter(s => gpa(s.grade) >= 3.5).length, label: "ได้เกรด A", color: t.green, icon: "⭐" },
          { num: subjects.filter(s => gpa(s.grade) < 2 && s.grade).length, label: "ต้องระวัง", color: t.red, icon: "⚠️" },
        ].map((s, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: t.shadow }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 500, color: s.color }}>{s.num}</div>
            <div style={{ fontSize: "0.72rem", color: t.ink2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>รายวิชา</div>
          <Btn onClick={() => setShowForm(!showForm)} size="sm" style={{ borderRadius: 8 }}>+ เพิ่มวิชา</Btn>
        </div>

        {showForm && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", padding: 14, background: t.bg2, borderRadius: 12 }}>
            <input placeholder="ชื่อวิชา เช่น CS211" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field"
              style={{ flex: 2, minWidth: 120, padding: "9px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none" }} />
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
              style={{ flex: 1, minWidth: 90, padding: "9px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem" }}>
              <option value="">เกรด</option>
              {Object.keys(gradeMap).map(g => <option key={g}>{g}</option>)}
            </select>
            <Btn onClick={addSub} style={{ borderRadius: 10 }}>บันทึก</Btn>
          </div>
        )}

        {loading ? <div style={{ textAlign: "center", padding: 20, color: t.ink2 }}>⏳</div>
          : subjects.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: t.ink2, fontSize: "0.85rem" }}>กด "+ เพิ่มวิชา" เพื่อเริ่มต้นครับ</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subjects.map((s, i) => (
                <div key={i} style={{ padding: "14px 16px", background: t.bg2, borderRadius: 12, border: `1px solid ${t.border}`, animation: `slideIn 0.3s ease ${i*0.04}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: gColor(s.grade), background: `${gColor(s.grade)}15`, padding: "3px 10px", borderRadius: 99, fontWeight: 500 }}>{s.grade || "?"} · {gpa(s.grade).toFixed(1)}</div>
                      <button onClick={async () => { await supabase.from("subjects").delete().eq("id", s.id); setSubjects(p => p.filter(x => x.id !== s.id)); }} style={{ background: "none", border: "none", cursor: "pointer", color: t.ink3, fontSize: "0.75rem" }}>✕</button>
                    </div>
                  </div>
                  <div style={{ height: 4, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(gpa(s.grade)/4)*100}%`, background: gColor(s.grade), borderRadius: 99, transition: "width 1s ease", boxShadow: `0 0 6px ${gColor(s.grade)}50` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── PRO PAGE ─────────────────────────────────────────────────────
function ProPage({ isPro, onUpgrade, t }) {
  if (isPro) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>⚡</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: t.green }}>คุณเป็นสมาชิก Pro แล้ว!</div>
      <p style={{ color: t.ink2, marginTop: 8 }}>ขอบคุณที่สนับสนุน StudyFlow ครับ 🙏</p>
    </div>
  );
  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>⚡ Pro Access</div>
      <div style={{ color: t.ink2, fontSize: "0.82rem", marginBottom: 24 }}>ปลดล็อคทุกฟีเจอร์ ไม่มีข้อจำกัด</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 560, marginBottom: 24 }}>
        {[["49฿","ต่อเดือน",t.accent,false],["399฿","ต่อปี · ประหยัด 32%",t.green,true]].map(([price, period, color, pop]) => (
          <div key={period} className="card-hover" style={{ background: t.card, border: `2px solid ${pop ? color : t.border}`, borderRadius: 16, padding: 24, cursor: "pointer", position: "relative", boxShadow: pop ? `0 8px 32px ${color}20` : t.shadow }} onClick={onUpgrade}>
            {pop && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: color, color: "#fff", fontSize: "0.62rem", fontWeight: 700, padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap" }}>ประหยัดสุด</div>}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.5rem", fontWeight: 500, color, marginBottom: 4 }}>{price}</div>
            <div style={{ fontSize: "0.78rem", color: t.ink2, marginBottom: 20 }}>{period}</div>
            <Btn variant={pop ? "pro" : "ghost"} fullWidth style={{ borderRadius: 10, borderColor: pop ? "transparent" : t.border, color: pop ? "#fff" : t.ink2 }}>เลือกแผนนี้</Btn>
          </div>
        ))}
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, maxWidth: 560, boxShadow: t.shadow }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Pro ได้อะไรบ้าง?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["✨","AI Study Coach","วิเคราะห์การเรียน"],["🏆","Leaderboard","แข่งกับเพื่อน"],["🔥","Habit ไม่จำกัด","Free: 4 อย่าง"],["⏰","Exam Countdown","ทุกวิชา ไม่จำกัด"],["📚","วิชาไม่จำกัด","Free: 5 วิชา"],["📊","สถิติเชิงลึก","รายสัปดาห์/เดือน"]].map(([icon, title, sub]) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: t.bg2, borderRadius: 10, border: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: t.ink }}>{title}</div>
                <div style={{ fontSize: "0.68rem", color: t.ink2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────
export default function Dashboard() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [isPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();
  const t = isDark ? themes.dark : themes.light;

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
    { id: "home",  icon: "🏠", label: "หน้าหลัก" },
    { id: "timer", icon: "⏱", label: "จับเวลา" },
    { id: "tasks", icon: "✅", label: "งาน" },
    { id: "gpa",   icon: "🎯", label: "GPA" },
    { id: "pro",   icon: "⚡", label: "Pro" },
  ];

  const pages = {
    home:  <Home user={user} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} t={t} />,
    timer: <TimerPage t={t} />,
    tasks: <TasksPage isPro={isPro} onUpgrade={() => setShowUpgrade(true)} t={t} />,
    gpa:   <GPAPage isPro={isPro} onUpgrade={() => setShowUpgrade(true)} t={t} />,
    pro:   <ProPage isPro={isPro} onUpgrade={() => setShowUpgrade(true)} t={t} />,
  };

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: themes.dark.bg, flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${themes.dark.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: "0.82rem", color: themes.dark.ink2 }}>กำลังโหลด...</div>
    </div>
  );

  return (
    <>
      <style>{getCSS(t)}</style>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} t={t} />}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: isDark ? `radial-gradient(ellipse 80% 50% at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.04) 0%, transparent 60%)` : "none" }} />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1, background: t.bg }}>

        {/* Sidebar */}
        <div className="sidebar" style={{ width: 240, background: isDark ? "rgba(15,17,23,0.98)" : t.card, borderRight: `1px solid ${t.border}`, padding: "20px 14px", flexDirection: "column", gap: 3, flexShrink: 0, boxShadow: isDark ? "4px 0 24px rgba(0,0,0,0.3)" : t.shadow }}>
          <div style={{ padding: "12px 10px 20px", borderBottom: `1px solid ${t.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${t.accent}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 4px 16px ${t.accentGlow}` }}>📚</div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: t.ink, letterSpacing: "-0.02em" }}>StudyFlow</div>
                <div style={{ fontSize: "0.6rem", color: t.ink2 }}>v1.0 · AI-Powered</div>
              </div>
            </div>
          </div>

          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} className="nav-btn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, cursor: "pointer", border: "none", width: "100%", textAlign: "left", background: page === n.id ? t.accentLight : "transparent", color: page === n.id ? t.accent : n.id === "pro" ? t.yellow : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: page === n.id ? 600 : 500, fontSize: "0.85rem", transition: "all 0.15s" }}>
              <span style={{ width: 22, textAlign: "center" }}>{n.icon}</span>
              {n.label}
              {n.id === "pro" && !isPro && <span style={{ marginLeft: "auto", fontSize: "0.58rem", color: t.yellow, background: t.yellowLight, padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>NEW</span>}
              {page === n.id && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: t.accent, boxShadow: `0 0 8px ${t.accent}` }} />}
            </button>
          ))}

          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            <button onClick={() => setIsDark(d => !d)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.border}`, background: "transparent", cursor: "pointer", width: "100%", marginBottom: 8, color: t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500 }}>
              <span>{isDark ? "☀️" : "🌙"}</span>
              {isDark ? "Light Mode" : "Dark Mode"}
              <div style={{ marginLeft: "auto", width: 32, height: 18, borderRadius: 99, background: isDark ? t.accent : t.border, position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: isDark ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: t.bg2, border: `1px solid ${t.border}`, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{(user?.email || "U").charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.78rem", color: t.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
                <div style={{ fontSize: "0.62rem", color: isPro ? t.accent : t.ink2, fontWeight: 600 }}>{isPro ? "⚡ PRO" : "FREE"}</div>
              </div>
            </div>

            {!isPro && <Btn variant="pro" fullWidth onClick={() => setShowUpgrade(true)} style={{ marginBottom: 8, borderRadius: 12, fontSize: "0.78rem" }}>⚡ อัปเกรด Pro</Btn>}
            <Btn variant="ghost" fullWidth onClick={logout} style={{ borderRadius: 12, fontSize: "0.78rem", color: t.red, borderColor: `${t.red}30` }}>ออกจากระบบ</Btn>
          </div>
        </div>

        {/* Main */}
        <div className="main-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {pages[page]}
        </div>

        {/* Mobile bottom nav */}
        <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: isDark ? "rgba(15,17,23,0.98)" : t.card, borderTop: `1px solid ${t.border}`, padding: "8px 4px 12px", justifyContent: "space-around", alignItems: "center", backdropFilter: "blur(20px)" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 4px", color: page === n.id ? t.accent : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span style={{ fontSize: "1.2rem" }}>{n.icon}</span>
              <span style={{ fontSize: "0.58rem", fontWeight: page === n.id ? 700 : 400 }}>{n.label}</span>
              {page === n.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.accent, boxShadow: `0 0 6px ${t.accent}` }} />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}