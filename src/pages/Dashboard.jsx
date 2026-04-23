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

// ─── STYLES ───────────────────────────────────────────────────────
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

  .hidden { display: none !important; }

  @media (max-width: 768px) {
    .sidebar { display: none !important; }
    .bottom-nav { display: flex !important; }
    .main-content { padding: 16px !important; padding-bottom: 80px !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

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

// ─── UPGRADE MODAL ────────────────────────────────────────────────
function UpgradeModal({ onClose }) {
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
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>อัปเกรดเป็น <span style={{ color: C.accent }}>Pro</span></h2>
          <p style={{ color: C.ink2, fontSize: "0.85rem", marginTop: 6 }}>ปลดล็อคขีดจำกัด AI และการจัดการงาน</p>
        </div>
        <Btn variant="pro" fullWidth onClick={() => alert("กำลังเชื่อมต่อระบบชำระเงิน...")}>
          เริ่มต้นใช้งาน Pro — 49฿/เดือน
        </Btn>
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
    
    const prompt = `คุณเป็น AI โค้ชการเรียนสำหรับนักศึกษาไทย วิเคราะห์ข้อมูลนี้แล้วสรุปสั้นๆ (3-4 ประโยค): เวลาเรียนวันนี้ ${todayMin} นาที, งานค้าง: ${pending}, วิชา: ${subs}`;

    try {
      const API_KEY = "AIzaSyBzrcZrKW1pPdLEwT-a70xWRg92PPMgB3s";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AIzaSyBzrcZrKW1pPdLEwT-a70xWRg92PPMgB3s}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setSummary(aiResponse || "สรุปผลเรียบร้อยครับ");
    } catch (err) {
      setSummary("⚠️ ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{globalStyle}</style>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <Card glow style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>AI Study Coach</div>
            <div style={{ fontSize: "0.68rem", color: C.ink2 }}>{isPro ? "วิเคราะห์ผลการเรียน" : "🔒 เฉพาะสมาชิก Pro"}</div>
          </div>
          <Btn onClick={generate} disabled={loading} variant={isPro ? "primary" : "pro"} style={{ fontSize: "0.7rem" }}>
            {loading ? "วิเคราะห์..." : "✨ วิเคราะห์"}
          </Btn>
        </div>
        {visible && summary && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${C.glassBorder}`, paddingTop: 16 }}>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>{summary}</p>
          </div>
        )}
      </Card>
    </>
  );
}

export default AISummary;