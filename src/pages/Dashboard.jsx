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

// ─── GLOBAL STYLES ───────────────────────────────────────────────
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.ink}; font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }

  .main-container { display: flex; min-height: 100vh; }
  .sidebar { width: 260px; background: ${C.bg2}; border-right: 1px solid ${C.glassBorder}; padding: 30px 20px; display: flex; flex-direction: column; position: fixed; height: 100vh; }
  .main-content { flex: 1; padding: 40px; margin-left: 260px; max-width: 1200px; }
  .nav-item { padding: 12px 16px; borderRadius: 12px; cursor: pointer; display: flex; items-center: center; gap: 12px; transition: 0.2s; color: ${C.ink2}; margin-bottom: 8px; }
  .nav-item.active { background: ${C.accent}15; color: ${C.accent}; font-weight: 600; }
  .bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: ${C.bg2}; border-top: 1px solid ${C.glassBorder}; padding: 12px; justify-content: space-around; z-index: 100; backdrop-filter: blur(10px); }

  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main-content { margin-left: 0; padding: 20px; padding-bottom: 100px; }
    .bottom-nav { display: flex; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .main-row { grid-template-columns: 1fr !important; }
    .gpa-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────
const Card = ({ children, style = {}, glow = false, className = "" }) => (
  <div className={className} style={{
    background: C.glass, border: `1px solid ${C.glassBorder}`,
    borderRadius: 16, padding: 20, backdropFilter: "blur(20px)",
    animation: "fadeUp 0.4s ease both",
    boxShadow: glow ? `0 0 40px ${C.accentGlow}, 0 4px 24px rgba(0,0,0,0.4)` : "0 4px 24px rgba(0,0,0,0.3)",
    ...style
  }}>{children}</div>
);

const Btn = ({ children, variant = "primary", onClick, disabled, style = {}, fullWidth = false }) => {
  const variants = {
    primary: { background: C.accent, color: "#fff", border: "none", boxShadow: `0 4px 20px ${C.accentGlow}` },
    ghost: { background: C.glass, color: C.ink2, border: `1px solid ${C.glassBorder}` },
    danger: { background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}30` },
    pro: { background: `linear-gradient(135deg, ${C.accent}, #a855f7)`, color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 20px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 600, fontSize: "0.82rem", transition: "0.2s", width: fullWidth ? "100%" : "auto",
      ...variants[variant], ...style
    }}>{children}</button>
  );
};

const Chip = ({ label, color = C.accent }) => (
  <span style={{
    padding: "3px 10px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}30`,
    color, fontSize: "0.62rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
  }}>{label}</span>
);

// ─── UPGRADE MODAL ────────────────────────────────────────────────
function UpgradeModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ maxWidth: 400, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40 }}>⚡</div>
        <h2 style={{ margin: "10px 0" }}>StudyFlow <span style={{ color: C.accent }}>Pro</span></h2>
        <p style={{ color: C.ink2, fontSize: "0.85rem", marginBottom: 20 }}>ปลดล็อค AI วิเคราะห์ส่วนตัว และบันทึกข้อมูลไม่จำกัด</p>
        <Btn variant="pro" fullWidth onClick={() => alert("ระบบชำระเงินกำลังมาเร็วๆ นี้!")}>อัปเกรดเพียง 49฿ / เดือน</Btn>
        <button onClick={onClose} style={{ marginTop: 15, background: "none", border: "none", color: C.ink2, cursor: "pointer" }}>ไว้วันหลัง</button>
      </Card>
    </div>
  );
}

// ─── AI SUMMARY ───────────────────────────────────────────────────
function AISummary({ tasks = [], subjects = [], todayMin = 0, isPro }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const generate = async () => {
    if (!isPro) { setShowUpgrade(true); return; }
    setLoading(true);
    const pending = tasks.filter(t => !t.done).map(t => t.text).join(", ");
    const prompt = `วิเคราะห์ข้อมูลการเรียน: เวลาวันนี้ ${(todayMin/60).toFixed(1)}ชม., งานค้าง: ${pending || 'ไม่มี'}. ให้คำแนะนำสั้นๆ 3 ประโยคในฐานะโค้ช`;

    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      setSummary(data.candidates?.[0]?.content?.parts?.[0]?.text || "AI ไม่ว่างตอบตอนนี้ครับ");
    } catch { setSummary("⚠️ เชื่อมต่อ AI ไม่ได้"); } finally { setLoading(false); }
  };

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <Card glow style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>AI Study Coach ✨</div>
            <div style={{ fontSize: "0.7rem", color: C.ink2 }}>{isPro ? "พร้อมวิเคราะห์ข้อมูล" : "เฉพาะสมาชิก Pro เท่านั้น"}</div>
          </div>
          <Btn onClick={generate} variant={isPro ? "primary" : "pro"} disabled={loading}>
            {loading ? "..." : "วิเคราะห์"}
          </Btn>
        </div>
        {summary && <div style={{ marginTop: 15, fontSize: "0.85rem", borderTop: `1px solid ${C.glassBorder}`, paddingTop: 10 }}>{summary}</div>}
      </Card>
    </>
  );
}

// ─── SUB-PAGES (HOME, TIMER, TASKS, GPA) ──────────────────────────
function Home({ user, isPro }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [todayMin, setTodayMin] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: t } = await supabase.from("tasks").select("*");
      const { data: s } = await supabase.from("subjects").select("*");
      if (t) setTasks(t); if (s) setSubjects(s);
    };
    load();
  }, []);

  const avgGPA = subjects.length > 0 ? (subjects.reduce((s, x) => s + ({A:4,"B+":3.5,B:3,"C+":2.5,C:2,"D+":1.5,D:1,F:0}[x.grade]||0), 0) / subjects.length).toFixed(2) : "0.00";

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>สวัสดี, {user?.email?.split("@")[0]} 👋</h1>
      <AISummary tasks={tasks} subjects={subjects} todayMin={todayMin} isPro={isPro} />
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 15, marginBottom: 20 }}>
        <Card style={{ textAlign: "center" }}><div style={{ fontSize: "1.5rem" }}>🎯</div><div>{avgGPA}</div><div style={{ fontSize: "0.7rem" }}>GPA</div></Card>
        <Card style={{ textAlign: "center" }}><div style={{ fontSize: "1.5rem" }}>✅</div><div>{tasks.filter(t => !t.done).length}</div><div style={{ fontSize: "0.7rem" }}>งานค้าง</div></Card>
        <Card style={{ textAlign: "center" }}><div style={{ fontSize: "1.5rem" }}>🔥</div><div>7</div><div style={{ fontSize: "0.7rem" }}>Streak</div></Card>
        <Card style={{ textAlign: "center" }}><div style={{ fontSize: "1.5rem" }}>⏱</div><div>0h</div><div style={{ fontSize: "0.7rem" }}>วันนี้</div></Card>
      </div>
    </div>
  );
}

function Timer() {
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) intervalRef.current = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const timeStr = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;

  return (
    <Card style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }} glow>
      <h2>Pomodoro</h2>
      <div style={{ fontSize: "4rem", margin: "20px 0", fontFamily: "JetBrains Mono" }}>{timeStr}</div>
      <Btn onClick={() => setRunning(!running)} fullWidth>{running ? "Pause" : "Start Focus"}</Btn>
    </Card>
  );
}

function Tasks({ isPro }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    supabase.from("tasks").select("*").order("created_at", {ascending: false}).then(({data}) => data && setTasks(data));
  }, []);

  const add = async () => {
    if (!input || (!isPro && tasks.length >= 10)) return alert("Free จำกัด 10 งาน");
    const { data } = await supabase.from("tasks").insert({ text: input }).select().single();
    if (data) setTasks([data, ...tasks]);
    setInput("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: C.glass, color: C.ink }} value={input} onChange={e => setInput(e.target.value)} placeholder="เพิ่มงานใหม่..." />
        <Btn onClick={add}>เพิ่ม</Btn>
      </div>
      {tasks.map(t => (
        <Card key={t.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
          <span>{t.text}</span>
          <input type="checkbox" checked={t.done} onChange={async () => {
            await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
            setTasks(tasks.map(x => x.id === t.id ? {...x, done: !x.done} : x));
          }} />
        </Card>
      ))}
    </div>
  );
}

function GPA({ isPro }) {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ name: "", grade: "" });

  useEffect(() => {
    supabase.from("subjects").select("*").then(({data}) => data && setSubjects(data));
  }, []);

  const add = async () => {
    const { data } = await supabase.from("subjects").insert(form).select().single();
    if (data) setSubjects([...subjects, data]);
    setForm({ name: "", grade: "" });
  };

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <input placeholder="วิชา" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
          <option value="">เกรด</option>
          {["A","B+","B","C+","C","D+","D","F"].map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <Btn onClick={add}>เพิ่มวิชา</Btn>
      </Card>
      {subjects.map(s => <Card key={s.id} style={{ marginBottom: 10 }}>{s.name}: {s.grade}</Card>)}
    </div>
  );
}

// ─── MAIN APP COMPONENT ───────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false); // ปรับเป็น true เพื่อทดสอบ AI

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const NavContent = () => (
    <>
      <div className={`nav-item ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>🏠 หน้าหลัก</div>
      <div className={`nav-item ${tab === "timer" ? "active" : ""}`} onClick={() => setTab("timer")}>⏱ จับเวลา</div>
      <div className={`nav-item ${tab === "tasks" ? "active" : ""}`} onClick={() => setTab("tasks")}>✅ งานค้าง</div>
      <div className={`nav-item ${tab === "gpa" ? "active" : ""}`} onClick={() => setTab("gpa")}>🎯 เกรดเฉลี่ย</div>
    </>
  );

  return (
    <div className="main-container">
      <style>{globalStyle}</style>
      
      <div className="sidebar">
        <h2 style={{ marginBottom: 40, color: C.accent }}>StudyFlow</h2>
        <NavContent />
      </div>

      <div className="main-content">
        {tab === "home" && <Home user={user} isPro={isPro} />}
        {tab === "timer" && <Timer />}
        {tab === "tasks" && <Tasks isPro={isPro} />}
        {tab === "gpa" && <GPA isPro={isPro} />}
      </div>

      <div className="bottom-nav">
        <NavContent />
      </div>
    </div>
  );
}