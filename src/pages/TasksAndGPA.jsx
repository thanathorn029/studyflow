// ═══════════════════════════════════════════════════════════
// TASKS PAGE — ครบทุกอย่าง
// Deadline + Priority + Sub-tasks + Categories
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "../supabase";

// ─── PRIORITY CONFIG ──────────────────────────────────────
const PRIORITY = {
  urgent: { label: "ด่วนมาก", color: "#f43f5e", bg: "rgba(244,63,94,0.12)", emoji: "🔴" },
  high:   { label: "สำคัญ",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", emoji: "🟡" },
  normal: { label: "ปกติ",    color: "#6366f1", bg: "rgba(99,102,241,0.12)", emoji: "🔵" },
  low:    { label: "ไม่รีบ",  color: "#10d9a0", bg: "rgba(16,217,160,0.12)", emoji: "🟢" },
};

const CATEGORIES = [
  { id: "all",  label: "ทั้งหมด", emoji: "📋" },
  { id: "hw",   label: "การบ้าน", emoji: "📝" },
  { id: "exam", label: "สอบ",     emoji: "📚" },
  { id: "proj", label: "โปรเจกต์", emoji: "💻" },
  { id: "other",label: "อื่นๆ",   emoji: "📌" },
];

// ─── UTILS ────────────────────────────────────────────────
const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: diff < 0 };
};

const deadlineColor = (dl, t) => {
  if (!dl) return t.ink2;
  const { days, expired } = getDaysLeft(dl);
  if (expired) return t.red;
  if (days <= 1) return t.red;
  if (days <= 3) return t.yellow;
  return t.green;
};

const deadlineLabel = (dl) => {
  if (!dl) return null;
  const { days, hours, expired } = getDaysLeft(dl);
  if (expired) return "หมดเขตแล้ว!";
  if (days === 0) return `อีก ${hours} ชม.`;
  if (days === 1) return "พรุ่งนี้!";
  return `อีก ${days} วัน`;
};

// ─── TASKS PAGE ───────────────────────────────────────────
export function TasksPage({ isPro, onUpgrade, t }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created"); // created | deadline | priority
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ text: "", priority: "normal", deadline: "", category: "hw", note: "" });
  const [subInput, setSubInput] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data.map(t => ({
      ...t,
      subtasks: t.subtasks || [],
      priority: t.priority || "normal",
      category: t.category || "hw",
      note: t.note || "",
    })));
    setLoading(false);
  };

  const add = async () => {
    if (!form.text.trim()) return;
    if (!isPro && tasks.length >= 10) { onUpgrade(); return; }
    const newTask = {
      text: form.text.trim(),
      done: false,
      priority: form.priority,
      deadline: form.deadline || null,
      category: form.category,
      note: form.note,
      subtasks: [],
    };
    const { data } = await supabase.from("tasks").insert(newTask).select().single();
    if (data) setTasks(p => [{ ...data, subtasks: [] }, ...p]);
    setForm({ text: "", priority: "normal", deadline: "", category: "hw", note: "" });
    setShowAdd(false);
  };

  const toggle = async (id, done) => {
    await supabase.from("tasks").update({ done: !done }).eq("id", id);
    setTasks(p => p.map(t => t.id === id ? { ...t, done: !done } : t));
  };

  const del = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(p => p.filter(t => t.id !== id));
  };

  const addSubtask = async (taskId, text) => {
    if (!text.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    const newSubs = [...(task.subtasks || []), { id: Date.now(), text: text.trim(), done: false }];
    await supabase.from("tasks").update({ subtasks: newSubs }).eq("id", taskId);
    setTasks(p => p.map(t => t.id === taskId ? { ...t, subtasks: newSubs } : t));
    setSubInput(p => ({ ...p, [taskId]: "" }));
  };

  const toggleSubtask = async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    const newSubs = task.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s);
    await supabase.from("tasks").update({ subtasks: newSubs }).eq("id", taskId);
    setTasks(p => p.map(t => t.id === taskId ? { ...t, subtasks: newSubs } : t));
  };

  const delSubtask = async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    const newSubs = task.subtasks.filter(s => s.id !== subId);
    await supabase.from("tasks").update({ subtasks: newSubs }).eq("id", taskId);
    setTasks(p => p.map(t => t.id === taskId ? { ...t, subtasks: newSubs } : t));
  };

  // Filter + Sort
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  let filtered = tasks
    .filter(t => filter === "all" ? true : filter === "pending" ? !t.done : t.done)
    .filter(t => catFilter === "all" ? true : t.category === catFilter)
    .filter(t => search ? t.text.toLowerCase().includes(search.toLowerCase()) : true);

  if (sortBy === "deadline") {
    filtered = [...filtered].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  } else if (sortBy === "priority") {
    filtered = [...filtered].sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
  }

  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const urgentCount = tasks.filter(t => !t.done && t.priority === "urgent").length;
  const overdueCount = tasks.filter(t => !t.done && t.deadline && getDaysLeft(t.deadline)?.expired).length;

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>✅ งานที่ต้องทำ</div>
          <div style={{ color: t.ink2, fontSize: "0.78rem", marginTop: 3 }}>
            เสร็จ {done}/{tasks.length} รายการ
            {!isPro && <span style={{ color: t.accent, marginLeft: 8 }}>· {tasks.length}/10 Free</span>}
            {urgentCount > 0 && <span style={{ color: t.red, marginLeft: 8, fontWeight: 600 }}>· 🔴 ด่วน {urgentCount} รายการ</span>}
            {overdueCount > 0 && <span style={{ color: t.red, marginLeft: 8, fontWeight: 600 }}>· ⏰ เกินกำหนด {overdueCount} รายการ</span>}
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
          + เพิ่มงาน
        </button>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 8, background: t.border, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, #10d9a0, #059669)` : `linear-gradient(90deg, #6366f1, #a855f7)`, borderRadius: 99, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: pct === 100 ? t.green : t.accent, fontWeight: 600, minWidth: 40 }}>{pct}%</div>
        {pct === 100 && <span style={{ fontSize: "1.2rem" }}>🎉</span>}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{ background: t.card, border: `2px solid ${t.accent}40`, borderRadius: 16, padding: 20, marginBottom: 16, animation: "fadeUp 0.2s ease" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14, color: t.accent }}>+ เพิ่มงานใหม่</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="ชื่องาน เช่น ทำรายงาน CS211..." value={form.text} onChange={e => setForm({ ...form, text: e.target.value })}
              onKeyDown={e => e.key === "Enter" && add()}
              className="input-field"
              style={{ padding: "11px 14px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.88rem", outline: "none", width: "100%" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {/* Priority */}
              <div>
                <div style={{ fontSize: "0.7rem", color: t.ink2, marginBottom: 6, fontWeight: 600 }}>Priority</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(PRIORITY).map(([key, val]) => (
                    <button key={key} onClick={() => setForm({ ...form, priority: key })} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${form.priority === key ? val.color : t.border}`, background: form.priority === key ? val.bg : "transparent", color: form.priority === key ? val.color : t.ink2, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>
                      {val.emoji} {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: "0.7rem", color: t.ink2, marginBottom: 6, fontWeight: 600 }}>หมวดหมู่</div>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem" }}>
                  {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <div style={{ fontSize: "0.7rem", color: t.ink2, marginBottom: 6, fontWeight: 600 }}>Deadline</div>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="input-field"
                  style={{ width: "100%", padding: "8px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
              </div>
            </div>

            <textarea placeholder="โน้ตเพิ่มเติม (ไม่บังคับ)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              style={{ padding: "10px 14px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none", resize: "none", height: 60, width: "100%" }} />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={add} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 ค้นหางาน..." value={search} onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ flex: 1, minWidth: 180, padding: "8px 14px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.78rem" }}>
          <option value="created">เรียงตาม: ใหม่สุด</option>
          <option value="deadline">เรียงตาม: Deadline</option>
          <option value="priority">เรียงตาม: Priority</option>
        </select>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[["all","ทั้งหมด",tasks.length],["pending","ค้างอยู่",tasks.filter(x=>!x.done).length],["done","เสร็จแล้ว",done]].map(([v,l,count]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 99, border: `1px solid ${filter===v ? t.accent+"60" : t.border}`, background: filter===v ? t.accentLight : "transparent", color: filter===v ? t.accent : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.78rem", fontWeight: filter===v ? 600 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            {l} <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", background: filter===v ? t.accent+"30" : t.border, padding: "1px 6px", borderRadius: 99 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCatFilter(c.id)} style={{ padding: "5px 12px", borderRadius: 99, border: `1px solid ${catFilter===c.id ? t.border : t.border}`, background: catFilter===c.id ? t.bg2 : "transparent", color: catFilter===c.id ? t.ink : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.75rem", fontWeight: catFilter===c.id ? 600 : 400, cursor: "pointer" }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {loading ? <div style={{ textAlign: "center", padding: 40, color: t.ink2 }}>⏳ กำลังโหลด...</div>
        : filtered.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: t.ink2 }}>🎉 ไม่มีงานในหมวดนี้!</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((task, i) => {
              const p = PRIORITY[task.priority] || PRIORITY.normal;
              const cat = CATEGORIES.find(c => c.id === task.category);
              const dl = task.deadline ? getDaysLeft(task.deadline) : null;
              const dlColor = deadlineColor(task.deadline, t);
              const dlLabel = deadlineLabel(task.deadline);
              const isExpanded = expandedId === task.id;
              const subDone = (task.subtasks || []).filter(s => s.done).length;
              const subTotal = (task.subtasks || []).length;
              const isOverdue = dl?.expired && !task.done;

              return (
                <div key={task.id} style={{ borderRadius: 14, border: `1px solid ${isOverdue ? t.red+"40" : task.done ? t.green+"25" : t.border}`, background: isOverdue ? t.redLight : task.done ? t.greenLight : t.card, overflow: "hidden", boxShadow: t.shadow, animation: `slideIn 0.3s ease ${i*0.03}s both` }}>

                  {/* Priority stripe */}
                  <div style={{ height: 3, background: task.done ? t.green : p.color, opacity: task.done ? 0.4 : 1 }} />

                  {/* Main row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
                    {/* Checkbox */}
                    <div onClick={() => toggle(task.id, task.done)} style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${task.done ? t.green : t.border}`, background: task.done ? t.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0, cursor: "pointer", transition: "all 0.2s", marginTop: 2, boxShadow: task.done ? `0 0 10px ${t.green}50` : "none" }}>
                      {task.done ? "✓" : ""}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, textDecoration: task.done ? "line-through" : "none", color: task.done ? t.ink2 : t.ink }}>{task.text}</span>
                        {/* Priority badge */}
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: p.color, background: p.bg, padding: "2px 8px", borderRadius: 99 }}>{p.emoji} {p.label}</span>
                        {/* Category badge */}
                        {cat && <span style={{ fontSize: "0.62rem", color: t.ink2, background: t.bg2, padding: "2px 8px", borderRadius: 99 }}>{cat.emoji} {cat.label}</span>}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {/* Deadline */}
                        {dlLabel && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: dlColor, fontWeight: 600 }}>
                            ⏰ {dlLabel}
                            <span style={{ color: t.ink2, fontWeight: 400 }}>({new Date(task.deadline).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})</span>
                          </div>
                        )}
                        {/* Subtask progress */}
                        {subTotal > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: t.ink2 }}>
                            <div style={{ width: 40, height: 4, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(subDone/subTotal)*100}%`, background: t.accent, borderRadius: 99 }} />
                            </div>
                            {subDone}/{subTotal} subtask
                          </div>
                        )}
                        {/* Note indicator */}
                        {task.note && <span style={{ fontSize: "0.68rem", color: t.ink2 }}>📝 มีโน้ต</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : task.id)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.ink2, fontSize: "0.72rem", cursor: "pointer" }}>
                        {isExpanded ? "▲" : "▼"}
                      </button>
                      <button onClick={() => del(task.id)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${t.red}30`, background: "transparent", color: t.red, fontSize: "0.72rem", cursor: "pointer" }}>✕</button>
                    </div>
                  </div>

                  {/* Expanded: Note + Subtasks */}
                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${t.border}`, paddingTop: 14, animation: "fadeUp 0.2s ease" }}>
                      {task.note && (
                        <div style={{ padding: "10px 12px", background: t.bg2, borderRadius: 10, fontSize: "0.82rem", color: t.ink2, marginBottom: 12, lineHeight: 1.6 }}>
                          📝 {task.note}
                        </div>
                      )}

                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: t.ink2, marginBottom: 8 }}>SUBTASKS ({subDone}/{subTotal})</div>

                      {(task.subtasks || []).map(sub => (
                        <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: t.bg2, marginBottom: 5 }}>
                          <div onClick={() => toggleSubtask(task.id, sub.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sub.done ? t.green : t.border}`, background: sub.done ? t.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
                            {sub.done ? "✓" : ""}
                          </div>
                          <span style={{ flex: 1, fontSize: "0.82rem", textDecoration: sub.done ? "line-through" : "none", color: sub.done ? t.ink2 : t.ink }}>{sub.text}</span>
                          <button onClick={() => delSubtask(task.id, sub.id)} style={{ background: "none", border: "none", cursor: "pointer", color: t.ink3, fontSize: "0.7rem" }}>✕</button>
                        </div>
                      ))}

                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input placeholder="เพิ่ม subtask..." value={subInput[task.id] || ""} onChange={e => setSubInput(p => ({ ...p, [task.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && addSubtask(task.id, subInput[task.id] || "")}
                          className="input-field"
                          style={{ flex: 1, padding: "7px 12px", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.8rem", outline: "none" }} />
                        <button onClick={() => addSubtask(task.id, subInput[task.id] || "")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GPA PAGE — ครบทุกอย่าง
// คะแนนกลางภาค/ปลายภาค + คำนวณ GPA เป้าหมาย + แผนภูมิ
// ═══════════════════════════════════════════════════════════

const gradeMap = { A: 4, "B+": 3.5, B: 3, "C+": 2.5, C: 2, "D+": 1.5, D: 1, F: 0 };
const grades = Object.keys(gradeMap);
const gpa = g => gradeMap[g] || 0;
const gpaToGrade = (val) => {
  if (val >= 3.75) return "A";
  if (val >= 3.25) return "B+";
  if (val >= 2.75) return "B";
  if (val >= 2.25) return "C+";
  if (val >= 1.75) return "C";
  if (val >= 1.25) return "D+";
  if (val >= 0.75) return "D";
  return "F";
};

export function GPAPage({ isPro, onUpgrade, t }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [targetGPA, setTargetGPA] = useState(() => parseFloat(localStorage.getItem("target_gpa") || "3.5"));
  const [form, setForm] = useState({ name: "", grade: "", credit: 3, midScore: "", finalScore: "", midWeight: 40, finalWeight: 60, notes: "" });
  const [tab, setTab] = useState("subjects"); // subjects | calculator | plan

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("subjects").select("*").order("created_at");
    if (data) setSubjects(data.map(s => ({
      ...s,
      credit: s.credit || 3,
      midScore: s.midScore || "",
      finalScore: s.finalScore || "",
      midWeight: s.midWeight || 40,
      finalWeight: s.finalWeight || 60,
      notes: s.notes || "",
    })));
    setLoading(false);
  };

  const addSub = async () => {
    if (!form.name) return;
    if (!isPro && subjects.length >= 5) { onUpgrade(); return; }
    const { data } = await supabase.from("subjects").insert(form).select().single();
    if (data) setSubjects(p => [...p, { ...data, credit: form.credit, midScore: form.midScore, finalScore: form.finalScore }]);
    setForm({ name: "", grade: "", credit: 3, midScore: "", finalScore: "", midWeight: 40, finalWeight: 60, notes: "" });
    setShowForm(false);
  };

  const updateSub = async (id, updates) => {
    await supabase.from("subjects").update(updates).eq("id", id);
    setSubjects(p => p.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const del = async (id) => {
    await supabase.from("subjects").delete().eq("id", id);
    setSubjects(p => p.filter(s => s.id !== id));
  };

  // ── คำนวณ ─────────────────────────────────────────────
  const calcEstimatedGrade = (sub) => {
    const mid = parseFloat(sub.midScore);
    const fin = parseFloat(sub.finalScore);
    if (isNaN(mid) && isNaN(fin)) return sub.grade || null;
    const total = (!isNaN(mid) ? mid * (sub.midWeight / 100) : 0)
      + (!isNaN(fin) ? fin * (sub.finalWeight / 100) : 0);
    if (total >= 80) return "A";
    if (total >= 75) return "B+";
    if (total >= 70) return "B";
    if (total >= 65) return "C+";
    if (total >= 60) return "C";
    if (total >= 55) return "D+";
    if (total >= 50) return "D";
    return "F";
  };

  const totalCredits = subjects.reduce((s, x) => s + (x.credit || 3), 0);
  const weightedSum = subjects.reduce((s, x) => {
    const g = gpa(x.grade || calcEstimatedGrade(x));
    return s + g * (x.credit || 3);
  }, 0);
  const avgGPA = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.00";
  const avgColor = parseFloat(avgGPA) >= 3.5 ? t.green : parseFloat(avgGPA) >= 3 ? t.blue : parseFloat(avgGPA) >= 2 ? t.yellow : t.red;

  // คำนวณว่าต้องได้เท่าไหร่ถึงเป้า
  const calcNeeded = () => {
    const current = subjects.filter(s => s.grade);
    const remaining = subjects.filter(s => !s.grade);
    if (remaining.length === 0) return null;
    const currentCredits = current.reduce((s, x) => s + (x.credit || 3), 0);
    const remainingCredits = remaining.reduce((s, x) => s + (x.credit || 3), 0);
    const currentWeighted = current.reduce((s, x) => s + gpa(x.grade) * (x.credit || 3), 0);
    const needed = (targetGPA * (currentCredits + remainingCredits) - currentWeighted) / remainingCredits;
    return Math.min(Math.max(needed, 0), 4).toFixed(2);
  };

  const neededGPA = calcNeeded();
  const gColor = g => { const v = gpa(g); return v >= 3.5 ? t.green : v >= 2.5 ? t.blue : v >= 2 ? t.yellow : t.red; };

  const tabs = [
    { id: "subjects", label: "📚 รายวิชา" },
    { id: "calculator", label: "🧮 คำนวณคะแนน" },
    { id: "plan", label: "🎯 วางแผน GPA" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>🎯 เป้าหมาย GPA</div>
      <div style={{ color: t.ink2, fontSize: "0.78rem", marginBottom: 20 }}>ติดตามผลการเรียนและวางแผนอย่างชาญฉลาด {!isPro && `· ${subjects.length}/5 วิชา`}</div>

      {/* GPA Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "GPA เฉลี่ย", value: avgGPA, color: avgColor, sub: `จาก ${subjects.length} วิชา`, icon: "🎓" },
          { label: "หน่วยกิต", value: totalCredits, color: t.blue, sub: "ที่ลงทะเบียน", icon: "📊" },
          { label: "ได้เกรด A", value: subjects.filter(s => s.grade === "A").length, color: t.green, sub: "วิชา", icon: "⭐" },
          { label: "ต้องระวัง", value: subjects.filter(s => gpa(s.grade) < 2 && s.grade).length, color: t.red, sub: "วิชา", icon: "⚠️" },
        ].map((card, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "16px 18px", boxShadow: t.shadow, animation: `fadeUp 0.4s ease ${i*0.05}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: "0.72rem", color: t.ink2, fontWeight: 500 }}>{card.label}</div>
              <span style={{ fontSize: "1.2rem" }}>{card.icon}</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 500, color: card.color, lineHeight: 1, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: "0.68rem", color: t.ink2 }}>{card.sub}</div>
            <div style={{ marginTop: 10, height: 3, background: t.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${typeof card.value === "string" ? (parseFloat(card.value)/4)*100 : Math.min(card.value*20, 100)}%`, background: card.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: t.bg2, borderRadius: 12, padding: 4, marginBottom: 16, width: "fit-content", gap: 4 }}>
        {tabs.map(tab2 => (
          <button key={tab2.id} onClick={() => setTab(tab2.id)} style={{ padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === tab2.id ? t.card : "transparent", color: tab === tab2.id ? t.ink : t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: tab === tab2.id ? 600 : 400, fontSize: "0.82rem", boxShadow: tab === tab2.id ? t.shadow : "none", transition: "all 0.2s" }}>
            {tab2.label}
          </button>
        ))}
      </div>

      {/* ── TAB: รายวิชา ── */}
      {tab === "subjects" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>รายวิชาทั้งหมด</div>
            <button onClick={() => setShowForm(!showForm)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>+ เพิ่มวิชา</button>
          </div>

          {showForm && (
            <div style={{ background: t.card, border: `2px solid ${t.accent}40`, borderRadius: 16, padding: 20, marginBottom: 16, animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontWeight: 700, color: t.accent, marginBottom: 14 }}>+ เพิ่มวิชาใหม่</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 10, marginBottom: 10 }}>
                <input placeholder="ชื่อวิชา เช่น CS211" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  style={{ padding: "9px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none" }} />
                <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                  style={{ padding: "9px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem" }}>
                  <option value="">เกรด (ถ้ามีแล้ว)</option>
                  {grades.map(g => <option key={g}>{g}</option>)}
                </select>
                <input type="number" placeholder="หน่วยกิต" value={form.credit} onChange={e => setForm({ ...form, credit: parseInt(e.target.value) || 3 })} min={1} max={6}
                  className="input-field"
                  style={{ padding: "9px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 5 }}>คะแนนกลางภาค ({form.midWeight}%)</div>
                  <input type="number" placeholder="0-100" value={form.midScore} onChange={e => setForm({ ...form, midScore: e.target.value })} min={0} max={100}
                    className="input-field"
                    style={{ width: "100%", padding: "9px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 5 }}>คะแนนปลายภาค ({form.finalWeight}%)</div>
                  <input type="number" placeholder="0-100" value={form.finalScore} onChange={e => setForm({ ...form, finalScore: e.target.value })} min={0} max={100}
                    className="input-field"
                    style={{ width: "100%", padding: "9px 12px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.85rem", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.ink2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>ยกเลิก</button>
                <button onClick={addSub} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>บันทึก</button>
              </div>
            </div>
          )}

          {loading ? <div style={{ textAlign: "center", padding: 20, color: t.ink2 }}>⏳</div>
            : subjects.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: t.ink2, fontSize: "0.85rem" }}>กด "+ เพิ่มวิชา" เพื่อเริ่มต้นครับ</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {subjects.map((sub, i) => {
                  const estGrade = calcEstimatedGrade(sub);
                  const displayGrade = sub.grade || estGrade;
                  const isExpanded = expandedId === sub.id;
                  const totalScore = (parseFloat(sub.midScore) || 0) * (sub.midWeight / 100) + (parseFloat(sub.finalScore) || 0) * (sub.finalWeight / 100);

                  return (
                    <div key={sub.id} style={{ borderRadius: 14, border: `1px solid ${t.border}`, background: t.card, overflow: "hidden", boxShadow: t.shadow, animation: `slideIn 0.3s ease ${i*0.04}s both` }}>
                      {/* Top stripe */}
                      <div style={{ height: 3, background: gColor(displayGrade) }} />

                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{sub.name}</span>
                            <span style={{ fontSize: "0.7rem", color: t.ink2, background: t.bg2, padding: "2px 8px", borderRadius: 99 }}>{sub.credit} หน่วยกิต</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Grade badge */}
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: gColor(displayGrade), background: `${gColor(displayGrade)}15`, padding: "4px 12px", borderRadius: 99, fontWeight: 700 }}>
                              {displayGrade || "?"} · {gpa(displayGrade).toFixed(1)}
                              {!sub.grade && estGrade && <span style={{ fontSize: "0.6rem", opacity: 0.7, marginLeft: 4 }}>(ประมาณ)</span>}
                            </div>
                            <button onClick={() => setExpandedId(isExpanded ? null : sub.id)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.ink2, fontSize: "0.72rem", cursor: "pointer" }}>{isExpanded ? "▲" : "▼"}</button>
                            <button onClick={() => del(sub.id)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${t.red}30`, background: "transparent", color: t.red, fontSize: "0.72rem", cursor: "pointer" }}>✕</button>
                          </div>
                        </div>

                        {/* Score breakdown */}
                        {(sub.midScore || sub.finalScore) && (
                          <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                            {sub.midScore && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: t.ink2 }}>
                                <span>กลางภาค:</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: t.ink, fontWeight: 600 }}>{sub.midScore}/100</span>
                                <span style={{ color: t.ink3 }}>({sub.midWeight}%)</span>
                              </div>
                            )}
                            {sub.finalScore && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: t.ink2 }}>
                                <span>ปลายภาค:</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: t.ink, fontWeight: 600 }}>{sub.finalScore}/100</span>
                                <span style={{ color: t.ink3 }}>({sub.finalWeight}%)</span>
                              </div>
                            )}
                            {sub.midScore && sub.finalScore && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem" }}>
                                <span style={{ color: t.ink2 }}>รวม:</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: gColor(displayGrade), fontWeight: 700 }}>{totalScore.toFixed(1)}/100</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ height: 4, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(gpa(displayGrade)/4)*100}%`, background: gColor(displayGrade), borderRadius: 99, transition: "width 1s ease", boxShadow: `0 0 6px ${gColor(displayGrade)}50` }} />
                        </div>
                      </div>

                      {/* Expanded: edit scores */}
                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: t.ink2, marginBottom: 10 }}>แก้ไขคะแนน</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: "0.68rem", color: t.ink2, marginBottom: 4 }}>เกรดจริง (ถ้ารู้แล้ว)</div>
                              <select value={sub.grade || ""} onChange={e => updateSub(sub.id, { grade: e.target.value })}
                                style={{ width: "100%", padding: "7px 10px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem" }}>
                                <option value="">ยังไม่มีเกรด</option>
                                {grades.map(g => <option key={g}>{g}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.68rem", color: t.ink2, marginBottom: 4 }}>คะแนนกลางภาค</div>
                              <input type="number" placeholder="0-100" value={sub.midScore || ""} onChange={e => updateSub(sub.id, { midScore: e.target.value })} min={0} max={100}
                                className="input-field"
                                style={{ width: "100%", padding: "7px 10px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "0.68rem", color: t.ink2, marginBottom: 4 }}>คะแนนปลายภาค</div>
                              <input type="number" placeholder="0-100" value={sub.finalScore || ""} onChange={e => updateSub(sub.id, { finalScore: e.target.value })} min={0} max={100}
                                className="input-field"
                                style={{ width: "100%", padding: "7px 10px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8, color: t.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* ── TAB: คำนวณคะแนน ── */}
      {tab === "calculator" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* GPA Calculator */}
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>🧮 คำนวณเกรดจากคะแนน</div>
              <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 16 }}>ใส่คะแนนแล้วระบบจะบอกว่าได้เกรดอะไร</div>
              {subjects.map(sub => {
                const estGrade = calcEstimatedGrade(sub);
                const totalScore = (parseFloat(sub.midScore) || 0) * (sub.midWeight/100) + (parseFloat(sub.finalScore) || 0) * (sub.finalWeight/100);
                return (
                  <div key={sub.id} style={{ padding: "10px 12px", background: t.bg2, borderRadius: 10, marginBottom: 8, border: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.84rem" }}>{sub.name}</span>
                      {estGrade && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: gColor(estGrade), fontWeight: 700, background: `${gColor(estGrade)}15`, padding: "2px 10px", borderRadius: 99 }}>
                        {estGrade} ({totalScore.toFixed(1)} คะแนน)
                      </span>}
                    </div>
                    {(sub.midScore || sub.finalScore) ? (
                      <div style={{ display: "flex", gap: 6, fontSize: "0.7rem", color: t.ink2 }}>
                        {sub.midScore && <span>กลางภาค: {sub.midScore} × {sub.midWeight}% = {(parseFloat(sub.midScore) * sub.midWeight / 100).toFixed(1)}</span>}
                        {sub.midScore && sub.finalScore && <span>+</span>}
                        {sub.finalScore && <span>ปลายภาค: {sub.finalScore} × {sub.finalWeight}% = {(parseFloat(sub.finalScore) * sub.finalWeight / 100).toFixed(1)}</span>}
                      </div>
                    ) : <div style={{ fontSize: "0.72rem", color: t.ink3 }}>ยังไม่มีคะแนน — ใส่ได้ในหน้า รายวิชา</div>}
                  </div>
                );
              })}
              {subjects.length === 0 && <div style={{ textAlign: "center", padding: 20, color: t.ink2, fontSize: "0.82rem" }}>เพิ่มวิชาในหน้า รายวิชา ก่อนนะครับ</div>}
            </div>

            {/* GPA Summary */}
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>📊 สรุป GPA Weighted</div>
              <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 16 }}>คำนวณตามหน่วยกิตของแต่ละวิชา</div>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "4rem", fontWeight: 500, color: avgColor, lineHeight: 1, filter: `drop-shadow(0 0 16px ${avgColor}60)` }}>{avgGPA}</div>
                <div style={{ fontSize: "0.78rem", color: t.ink2, marginTop: 6 }}>GPA เฉลี่ย (Weighted) · {totalCredits} หน่วยกิต</div>
              </div>

              {subjects.map(sub => {
                const displayGrade = sub.grade || calcEstimatedGrade(sub);
                return (
                  <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: "0.78rem" }}>{sub.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: "0.68rem", color: t.ink2 }}>{sub.credit} cr</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", color: gColor(displayGrade), fontWeight: 600 }}>{displayGrade || "?"} ({gpa(displayGrade).toFixed(1)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: วางแผน GPA ── */}
      {tab === "plan" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Target GPA */}
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>🎯 ตั้งเป้าหมาย GPA</div>
              <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 20 }}>ระบบจะคำนวณว่าต้องได้เกรดอะไรในวิชาที่เหลือ</div>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 10 }}>เป้าหมาย GPA</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                  <button onClick={() => { const v = Math.max(0, targetGPA - 0.25); setTargetGPA(v); localStorage.setItem("target_gpa", v); }} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${t.border}`, background: t.bg2, color: t.ink, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 500, color: t.accent, minWidth: 100, textAlign: "center" }}>{targetGPA.toFixed(2)}</div>
                  <button onClick={() => { const v = Math.min(4, targetGPA + 0.25); setTargetGPA(v); localStorage.setItem("target_gpa", v); }} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${t.border}`, background: t.bg2, color: t.ink, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                  {[2.0, 2.5, 3.0, 3.5, 4.0].map(v => (
                    <button key={v} onClick={() => { setTargetGPA(v); localStorage.setItem("target_gpa", v.toString()); }} style={{ padding: "4px 10px", borderRadius: 99, border: `1px solid ${targetGPA === v ? t.accent : t.border}`, background: targetGPA === v ? t.accentLight : "transparent", color: targetGPA === v ? t.accent : t.ink2, fontSize: "0.72rem", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>{v.toFixed(1)}</button>
                  ))}
                </div>
              </div>

              {/* Current vs Target */}
              <div style={{ background: t.bg2, borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.78rem", color: t.ink2 }}>GPA ปัจจุบัน</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: avgColor }}>{avgGPA}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.78rem", color: t.ink2 }}>GPA เป้าหมาย</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: t.accent }}>{targetGPA.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", color: t.ink2 }}>ห่างจากเป้า</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: parseFloat(avgGPA) >= targetGPA ? t.green : t.red }}>
                    {parseFloat(avgGPA) >= targetGPA ? "✓ ถึงเป้าแล้ว!" : `${(targetGPA - parseFloat(avgGPA)).toFixed(2)} GPA`}
                  </span>
                </div>
              </div>
            </div>

            {/* Needed per subject */}
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>📋 ต้องได้เท่าไหร่?</div>
              <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 16 }}>วิชาที่ยังไม่มีเกรดต้องได้เฉลี่ยเท่าไหร่</div>

              {neededGPA !== null && (
                <div style={{ background: parseFloat(neededGPA) <= 4 ? t.accentLight : t.redLight, border: `1px solid ${parseFloat(neededGPA) <= 4 ? t.accent+"40" : t.red+"40"}`, borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", color: t.ink2, marginBottom: 6 }}>ต้องได้ GPA เฉลี่ย (วิชาที่เหลือ)</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.5rem", fontWeight: 500, color: parseFloat(neededGPA) <= 4 ? t.accent : t.red }}>
                    {neededGPA}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: t.ink2, marginTop: 6 }}>≈ เกรด {gpaToGrade(parseFloat(neededGPA))}</div>
                  {parseFloat(neededGPA) > 4 && (
                    <div style={{ marginTop: 8, fontSize: "0.78rem", color: t.red, fontWeight: 600 }}>⚠️ เป้าหมายนี้ยากเกินไปแล้วครับ ลองปรับเป้าใหม่</div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {subjects.map(sub => {
                  const hasGrade = !!sub.grade;
                  const displayGrade = sub.grade || calcEstimatedGrade(sub);
                  return (
                    <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 10, background: t.bg2, border: `1px solid ${t.border}` }}>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>{sub.name}</div>
                        <div style={{ fontSize: "0.65rem", color: t.ink2 }}>{sub.credit} หน่วยกิต</div>
                      </div>
                      {hasGrade ? (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: gColor(sub.grade), fontWeight: 700, background: `${gColor(sub.grade)}15`, padding: "3px 10px", borderRadius: 99 }}>
                          ✓ {sub.grade}
                        </div>
                      ) : (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.68rem", color: t.ink2 }}>ต้องได้</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9rem", color: t.accent, fontWeight: 700 }}>{neededGPA ? `≥ ${gpaToGrade(parseFloat(neededGPA))}` : "?"}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}