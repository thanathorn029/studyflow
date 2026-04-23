import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("กรอกข้อมูลให้ครบด้วยนะครับ");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.message.includes("Invalid login")) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้องครับ");
      } else if (err.message.includes("already registered")) {
        setError("อีเมลนี้สมัครไว้แล้วครับ");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={styles.page}>

        <div style={styles.left}>
          <div style={styles.leftInner}>
            <div style={styles.brand}>
              <div style={styles.brandLogo}>📚</div>
              <div style={styles.brandName}>StudyFlow</div>
            </div>
            <h1 style={styles.leftTitle}>
              เรียนให้ได้<br />
              <span style={{ color: "#e8ff3c" }}>GPA ที่ใฝ่ฝัน</span>
            </h1>
            <p style={styles.leftSub}>
              แอปจัดการการเรียนครบวงจร<br />
              ตารางเรียน จับเวลา ติดตาม GPA ในที่เดียว
            </p>
            <div style={styles.featureList}>
              {[
                { icon: "⏱", text: "Pomodoro Timer จับเวลาเรียน" },
                { icon: "✅", text: "ติดตาม Deadline ไม่ลืมส่งงาน" },
                { icon: "🎯", text: "ติดตาม GPA รายวิชา" },
                { icon: "🔥", text: "Streak สร้างนิสัยเรียนที่ดี" },
              ].map((f, i) => (
                <div key={i} style={styles.featureItem}>
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <span style={styles.featureText}>{f.text}</span>
                </div>
              ))}
            </div>
            <div style={styles.statsRow}>
              <div style={styles.statItem}>
                <div style={styles.statNum}>500+</div>
                <div style={styles.statLabel}>นักศึกษา</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <div style={styles.statNum}>4.9★</div>
                <div style={styles.statLabel}>Rating</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <div style={styles.statNum}>49฿</div>
                <div style={styles.statLabel}>ต่อเดือน</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.card}>
            <div style={styles.toggle}>
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                style={{ ...styles.toggleBtn, ...(isLogin ? styles.toggleActive : {}) }}
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                style={{ ...styles.toggleBtn, ...(!isLogin ? styles.toggleActive : {}) }}
              >
                สมัครสมาชิก
              </button>
            </div>

            <h2 style={styles.cardTitle}>
              {isLogin ? "ยินดีต้อนรับกลับ 👋" : "เริ่มต้นฟรีเลย 🚀"}
            </h2>
            <p style={styles.cardSub}>
              {isLogin ? "Login เพื่อเข้าใช้งาน StudyFlow" : "สมัครฟรี ไม่ต้องใส่บัตรเครดิต"}
            </p>

            {error && (
              <div style={styles.errorBox}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              {!isLogin && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    placeholder="เช่น สมชาย ใจดี"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={styles.input}
                    onFocus={e => e.target.style.borderColor = "#e84c2e"}
                    onBlur={e => e.target.style.borderColor = "#d8d0c0"}
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>อีเมล</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = "#e84c2e"}
                  onBlur={e => e.target.style.borderColor = "#d8d0c0"}
                />
              </div>

              <div style={styles.inputGroup}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={styles.label}>รหัสผ่าน</label>
                  {isLogin && (
                    <span style={{ fontSize: "0.72rem", color: "#e84c2e", cursor: "pointer" }}>
                      ลืมรหัสผ่าน?
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = "#e84c2e"}
                  onBlur={e => e.target.style.borderColor = "#d8d0c0"}
                />
              </div>

              <button
                type="submit"
                style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? "⏳ กำลังดำเนินการ..." : isLogin ? "เข้าสู่ระบบ →" : "สมัครสมาชิกฟรี →"}
              </button>
            </form>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>หรือ</span>
              <div style={styles.dividerLine} />
            </div>

            <button style={styles.btnGoogle} onClick={() => alert("🔜 Google Login จะเปิดใช้งานเร็วๆ นี้!")}>
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>

            <p style={styles.switchText}>
              {isLogin ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
              <span
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                style={styles.switchLink}
              >
                {isLogin ? "สมัครสมาชิกฟรี" : "เข้าสู่ระบบ"}
              </span>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Kanit', sans-serif" },
  left: { flex: 1, background: "#1a1612", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" },
  leftInner: { maxWidth: 480, width: "100%" },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 40 },
  brandLogo: { width: 36, height: 36, background: "#e84c2e", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  brandName: { fontWeight: 800, fontSize: "1.2rem", color: "#fff", letterSpacing: "-0.02em" },
  leftTitle: { fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.03em" },
  leftSub: { fontSize: "0.95rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, fontWeight: 300, marginBottom: 36 },
  featureList: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 },
  featureItem: { display: "flex", alignItems: "center", gap: 12 },
  featureIcon: { width: 36, height: 36, borderRadius: 8, background: "rgba(232,255,60,0.08)", border: "1px solid rgba(232,255,60,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  featureText: { fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" },
  statsRow: { display: "flex", alignItems: "center", gap: 24, padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.08)" },
  statItem: { textAlign: "center" },
  statNum: { fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 500, color: "#e8ff3c" },
  statLabel: { fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 2 },
  statDivider: { width: 1, height: 32, background: "rgba(255,255,255,0.08)" },
  right: { width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 40px", background: "#f5f0e8" },
  card: { width: "100%", maxWidth: 400 },
  toggle: { display: "flex", background: "#ede8de", borderRadius: 10, padding: 4, marginBottom: 28, gap: 4 },
  toggleBtn: { flex: 1, padding: "9px 12px", borderRadius: 7, border: "none", background: "none", cursor: "pointer", fontFamily: "'Kanit', sans-serif", fontSize: "0.82rem", fontWeight: 500, color: "#6b6355" },
  toggleActive: { background: "#fff", color: "#1a1612", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", fontWeight: 600 },
  cardTitle: { fontSize: "1.5rem", fontWeight: 700, color: "#1a1612", letterSpacing: "-0.02em", marginBottom: 6 },
  cardSub: { fontSize: "0.78rem", color: "#6b6355", marginBottom: 24 },
  errorBox: { background: "rgba(232,76,46,0.08)", border: "1px solid rgba(232,76,46,0.2)", color: "#e84c2e", padding: "10px 14px", borderRadius: 8, fontSize: "0.78rem", marginBottom: 16 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "0.75rem", fontWeight: 600, color: "#1a1612" },
  input: { padding: "11px 14px", border: "1px solid #d8d0c0", borderRadius: 9, fontFamily: "'Kanit', sans-serif", fontSize: "0.85rem", background: "#fff", color: "#1a1612", outline: "none", width: "100%" },
  btnPrimary: { padding: "13px", background: "#e84c2e", color: "#fff", border: "none", borderRadius: 9, fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", marginTop: 4 },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "20px 0" },
  dividerLine: { flex: 1, height: 1, background: "#d8d0c0" },
  dividerText: { fontSize: "0.72rem", color: "#6b6355" },
  btnGoogle: { width: "100%", padding: "12px", background: "#fff", border: "1px solid #d8d0c0", borderRadius: 9, fontFamily: "'Kanit', sans-serif", fontSize: "0.85rem", fontWeight: 500, color: "#1a1612", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  switchText: { textAlign: "center", fontSize: "0.78rem", color: "#6b6355", marginTop: 20 },
  switchLink: { color: "#e84c2e", cursor: "pointer", fontWeight: 600 },
};