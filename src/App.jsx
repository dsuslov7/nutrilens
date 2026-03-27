import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Constants ────────────────────────────────────────────────────────────────
const GRAD = {
  p: "linear-gradient(90deg,#00c97a,#3dffa0)",
  f: "linear-gradient(90deg,#ff3a5c,#ff9a6b)",
  c: "linear-gradient(90deg,#f7a800,#ffd166)",
  k: "linear-gradient(90deg,#5b4fff,#c06aff)",
};
const COLORS = { p: "#3dffa0", f: "#ff6b6b", c: "#ffd166", k: "#a080ff" };

function todayKey() { return new Date().toISOString().slice(0, 10); }
function formatDate(k) {
  return new Date(k + "T12:00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

// ── Canvas Charts ────────────────────────────────────────────────────────────
function DonutCanvas({ p, f, c }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 8, inner = R * 0.62;
    ctx.clearRect(0, 0, W, H);
    const total = p + f + c || 3;
    const slices = [
      { val: p || 1, c1: "#00c97a", c2: "#3dffa0" },
      { val: f || 1, c1: "#ff3a5c", c2: "#ff9a6b" },
      { val: c || 1, c1: "#f7a800", c2: "#ffd166" },
    ];
    let angle = -Math.PI / 2;
    slices.forEach(s => {
      const sweep = (s.val / total) * Math.PI * 2;
      const grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      grad.addColorStop(0, s.c1); grad.addColorStop(1, s.c2);
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, angle, angle + sweep); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      angle += sweep;
    });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = "#12121a"; ctx.fill();
    if (p + f + c > 0) {
      ctx.fillStyle = "#e8e8f0"; ctx.font = "bold 13px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(p + f + c)}г`, cx, cy);
    }
  }, [p, f, c]);
  return <canvas ref={ref} width={180} height={180} style={{ display: "block", margin: "0 auto" }} />;
}

function BarCanvas({ meals }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, pad = 32, bpad = 20;
    ctx.clearRect(0, 0, W, H);
    if (!meals.length) {
      ctx.fillStyle = "#5a5a7a"; ctx.font = "13px monospace";
      ctx.textAlign = "center"; ctx.fillText("Немає даних", W / 2, H / 2); return;
    }
    const sorted = [...meals].sort((a, b) => a.time.localeCompare(b.time));
    const maxVal = Math.max(...sorted.map(m => m.p + m.f + m.c), 1);
    const chartH = H - pad - bpad, chartW = W - pad * 2;
    const gap = chartW / sorted.length;
    const bw = Math.min(48, gap - 8);
    [0.25, 0.5, 0.75, 1].forEach(t => {
      const y = pad + chartH * (1 - t);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    });
    sorted.forEach((m, i) => {
      const x = pad + gap * i + gap / 2 - bw / 2;
      let yOff = 0;
      [{ val: m.p, c1: "#00c97a", c2: "#3dffa0" }, { val: m.f, c1: "#ff3a5c", c2: "#ff9a6b" }, { val: m.c, c1: "#f7a800", c2: "#ffd166" }].forEach(s => {
        const sh = (s.val / maxVal) * chartH;
        const y = pad + chartH - yOff - sh;
        const grad = ctx.createLinearGradient(0, y, 0, y + sh);
        grad.addColorStop(0, s.c1); grad.addColorStop(1, s.c2 + "88");
        ctx.beginPath(); ctx.roundRect(x, y, bw, sh, [4, 4, 0, 0]);
        ctx.fillStyle = grad; ctx.fill();
        yOff += sh;
      });
      ctx.fillStyle = "#5a5a7a"; ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(m.time, pad + gap * i + gap / 2, H - 4);
    });
  }, [meals]);
  return <canvas ref={ref} width={560} height={200} style={{ width: "100%", height: 200 }} />;
}

function LineCanvas({ days, kcals, goalK }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, pad = 36;
    ctx.clearRect(0, 0, W, H);
    if (!days.length) {
      ctx.fillStyle = "#5a5a7a"; ctx.font = "13px monospace";
      ctx.textAlign = "center"; ctx.fillText("Немає даних", W / 2, H / 2); return;
    }
    const chartW = W - pad * 2, chartH = H - pad * 2;
    const maxV = Math.max(...kcals, goalK || 1, 1) * 1.1;
    const pts = kcals.map((v, i) => ({ x: pad + (i / Math.max(days.length - 1, 1)) * chartW, y: pad + chartH - (v / maxV) * chartH }));
    [0.25, 0.5, 0.75, 1].forEach(t => {
      const y = pad + chartH * (1 - t);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    });
    if (goalK) {
      const gy = pad + chartH - (goalK / maxV) * chartH;
      ctx.strokeStyle = "rgba(255,209,102,0.3)"; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
      ctx.setLineDash([]);
    }
    const aGrad = ctx.createLinearGradient(0, pad, 0, pad + chartH);
    aGrad.addColorStop(0, "rgba(124,106,255,0.45)"); aGrad.addColorStop(1, "rgba(124,106,255,0)");
    ctx.beginPath(); ctx.moveTo(pts[0].x, pad + chartH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad + chartH); ctx.closePath();
    ctx.fillStyle = aGrad; ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = "#a080ff"; ctx.lineWidth = 2.5; ctx.stroke();
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = "#a080ff"; ctx.lineWidth = 2; ctx.stroke();
    });
    days.forEach((d, i) => {
      ctx.fillStyle = "#5a5a7a"; ctx.font = "10px monospace"; ctx.textAlign = "center";
      ctx.fillText(formatDate(d), pts[i].x, H - 4);
    });
  }, [days, kcals, goalK]);
  return <canvas ref={ref} width={560} height={200} style={{ width: "100%", height: 200 }} />;
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgBar({ label, cur, goal, unit, type }) {
  const pct = goal ? Math.min((cur / goal) * 100, 100) : 0;
  const over = goal && cur > goal;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ color: COLORS[type], fontWeight: 700 }}>{label}</span>
        <span style={{ color: "#6b6b8a" }}>{Math.round(cur)} / {goal || "?"} {unit}</span>
      </div>
      <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 100, width: pct + "%", background: over ? "linear-gradient(90deg,#c00,#ff3a3a)" : GRAD[type], transition: "width 0.7s cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
    </div>
  );
}

// ── Auth screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const handleSubmit = async () => {
    setLoading(true); setError(""); setMsg("");
    const fn = isLogin ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error: err } = await supabase.auth[isLogin ? "signInWithPassword" : "signUp"]({ email, password });
    if (err) setError(err.message);
    else if (!isLogin) setMsg("Перевір пошту — надіслали підтвердження!");
    setLoading(false);
  };

  const inp = { background: "#1a1a26", border: "1px solid #2a2a3d", color: "#e8e8f0", fontFamily: "monospace", fontSize: 15, padding: "11px 14px", borderRadius: 10, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ background: "#12121a", border: "1px solid #2a2a3d", borderRadius: 20, padding: 36, width: "100%", maxWidth: 380 }}>
        <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 4, letterSpacing: "-0.04em" }}>
          Nutri<span style={{ color: "#7c6aff" }}>Lens</span>
        </div>
        <div style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 28 }}>Трекер БЖВ з аналізом фото</div>

        <button onClick={handleGoogle} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "1px solid #2a2a3d", background: "#1a1a26", color: "#e8e8f0", fontSize: 14, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.9C9.8 39.8 16.5 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.6l6.2 5.2C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Увійти через Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#2a2a3d" }} />
          <span style={{ color: "#6b6b8a", fontSize: 12 }}>або</span>
          <div style={{ flex: 1, height: 1, background: "#2a2a3d" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inp} />
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 13, color: "#ff6b6b" }}>❌ {error}</div>}
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: "#3dffa0" }}>✓ {msg}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c6aff,#b06aff)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {loading ? "..." : isLogin ? "Увійти" : "Зареєструватись"}
        </button>

        <button onClick={() => { setIsLogin(!isLogin); setError(""); setMsg(""); }} style={{ marginTop: 12, width: "100%", background: "none", border: "none", color: "#6b6b8a", fontSize: 13, cursor: "pointer" }}>
          {isLogin ? "Немає акаунту? Зареєструватись" : "Вже є акаунт? Увійти"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [meals, setMeals] = useState({});      // { date: [meal] }
  const [goals, setGoals] = useState({ p: 0, f: 0, c: 0, k: 0 });
  const [goalInputs, setGoalInputs] = useState({ p: "", f: "", c: "", k: "" });
  const [photos, setPhotos] = useState([]);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [saveMsg, setSaveMsg] = useState(false);
  const dropRef = useRef();

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load user data from Supabase when logged in
  useEffect(() => {
    if (!session) return;
    loadUserData();
  }, [session]);

  async function loadUserData() {
    const { data, error } = await supabase
      .from("user_data")
      .select("meals, goals")
      .eq("user_id", session.user.id)
      .single();
    if (data) {
      setMeals(data.meals || {});
      setGoals(data.goals || { p: 0, f: 0, c: 0, k: 0 });
      setGoalInputs(data.goals || { p: "", f: "", c: "", k: "" });
    }
  }

  async function persistData(newMeals, newGoals) {
    const payload = { user_id: session.user.id, meals: newMeals ?? meals, goals: newGoals ?? goals };
    await supabase.from("user_data").upsert(payload, { onConflict: "user_id" });
  }

  // File handling
  const readFile = (file) => new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
  const addFiles = async (files, type) => {
    const newPh = await Promise.all(Array.from(files).map(async f => ({ dataUrl: await readFile(f), type })));
    setPhotos(prev => [...prev, ...newPh]);
    setResult(null); setAnalyzeError("");
  };

  // Analyze via our proxy
  async function analyze() {
    if (!photos.length) return;
    setAnalyzing(true); setAnalyzeError(""); setResult(null);
    try {
      const imgBlocks = photos.map(ph => ({ type: "image", source: { type: "base64", media_type: ph.dataUrl.split(";")[0].split(":")[1], data: ph.dataUrl.split(",")[1] } }));
      const foodN = photos.filter(p => p.type === "food").length;
      const nutN = photos.filter(p => p.type === "nutrition").length;
      let prompt = "Визнач БЖВ.\n";
      if (foodN) prompt += `Фото страви: ${foodN} шт.\n`;
      if (nutN) prompt += `Фото етикетки: ${nutN} шт. — пріоритет даним з неї.\n`;
      if (weight) prompt += `Вага порції: ${weight} г.\n`;
      if (notes) prompt += `Примітки: «${notes}».\n`;
      prompt += "Поверни ТІЛЬКИ JSON об'єкт.";

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          system: `Ти нутриціолог. Відповідай ТІЛЬКИ валідним JSON без markdown:\n{"name":"...","protein":0,"fat":0,"carbs":0,"kcal":0,"desc":"..."}`,
          messages: [{ role: "user", content: [...imgBlocks, { type: "text", text: prompt }] }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw = data.content.map(b => b.text || "").join("").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Не вдалось розібрати відповідь");
      const p = JSON.parse(match[0]);
      setResult({ name: p.name, p: Math.round(+p.protein), f: Math.round(+p.fat), c: Math.round(+p.carbs), k: Math.round(+p.kcal), desc: p.desc || "" });
    } catch (e) {
      setAnalyzeError(e.message);
    }
    setAnalyzing(false);
  }

  async function addMeal() {
    if (!result) return;
    const key = todayKey();
    const time = new Date().toTimeString().slice(0, 5);
    const thumb = photos.find(p => p.type === "food")?.dataUrl || null;
    const newMeal = { ...result, time, thumb, notes, weight: weight ? +weight : null };
    const newMeals = { ...meals, [key]: [...(meals[key] || []), newMeal] };
    setMeals(newMeals);
    await persistData(newMeals, null);
    setPhotos([]); setResult(null); setNotes(""); setWeight(""); setAnalyzeError("");
    setTab("dashboard");
  }

  async function deleteMeal(idx) {
    const key = todayKey();
    const newMeals = { ...meals, [key]: (meals[key] || []).filter((_, i) => i !== idx) };
    setMeals(newMeals);
    await persistData(newMeals, null);
  }

  async function saveGoals() {
    const g = { p: +goalInputs.p || 0, f: +goalInputs.f || 0, c: +goalInputs.c || 0, k: +goalInputs.k || 0 };
    setGoals(g);
    await persistData(null, g);
    setSaveMsg(true); setTimeout(() => setSaveMsg(false), 2500);
  }

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6b8a", fontFamily: "monospace" }}>Завантаження...</div>;
  if (!session) return <AuthScreen onAuth={setSession} />;

  const todayMeals = meals[todayKey()] || [];
  const totals = todayMeals.reduce((a, m) => ({ p: a.p + m.p, f: a.f + m.f, c: a.c + m.c, k: a.k + m.k }), { p: 0, f: 0, c: 0, k: 0 });
  const histDays = Object.keys(meals).sort().slice(-7);
  const histKcals = histDays.map(d => (meals[d] || []).reduce((s, m) => s + m.k, 0));

  const S = {
    card: { background: "#12121a", border: "1px solid #2a2a3d", borderRadius: 16, padding: 24 },
    inp: { background: "#1a1a26", border: "1px solid #2a2a3d", color: "#e8e8f0", fontFamily: "monospace", fontSize: 15, padding: "10px 14px", borderRadius: 10, outline: "none", width: "100%", boxSizing: "border-box" },
    lbl: { fontSize: 11, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 16, display: "block" },
  };

  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", color: "#e8e8f0", fontFamily: "monospace", backgroundImage: "linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }}>

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #2a2a3d", padding: "20px 20px 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.04em" }}>
              Nutri<span style={{ color: "#7c6aff" }}>Lens</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#6b6b8a" }}>{session.user.email}</span>
              <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: "#6b6b8a", background: "none", border: "1px solid #2a2a3d", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>Вийти</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["dashboard","📊 Сьогодні"], ["upload","📸 Фото"], ["history","📅 Історія"], ["settings","⚙️ Норма"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 100, border: "none", cursor: "pointer", background: tab === id ? "#7c6aff" : "transparent", color: tab === id ? "#fff" : "#6b6b8a", transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {!goals.k && <div style={{ gridColumn: "1/-1", background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ffd166" }}>⚠️ Встанови норму БЖВ у розділі «Норма»</div>}
            <div style={S.card}>
              <span style={S.lbl}>Прогрес до норми</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <ProgBar label="Білки" cur={totals.p} goal={goals.p} unit="г" type="p" />
                <ProgBar label="Жири" cur={totals.f} goal={goals.f} unit="г" type="f" />
                <ProgBar label="Вуглеводи" cur={totals.c} goal={goals.c} unit="г" type="c" />
                <ProgBar label="Калорії" cur={totals.k} goal={goals.k} unit="ккал" type="k" />
              </div>
            </div>
            <div style={S.card}>
              <span style={S.lbl}>Розподіл БЖВ</span>
              <DonutCanvas p={totals.p} f={totals.f} c={totals.c} />
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14, fontSize: 12 }}>
                {[["Б", COLORS.p], ["Ж", COLORS.f], ["В", COLORS.c]].map(([l, c]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ ...S.card, gridColumn: "1/-1" }}>
              <span style={S.lbl}>Прийоми їжі за день</span>
              <BarCanvas meals={todayMeals} />
            </div>
            <div style={{ ...S.card, gridColumn: "1/-1" }}>
              <span style={S.lbl}>Що я їв сьогодні</span>
              {!todayMeals.length
                ? <div style={{ textAlign: "center", padding: "32px 0", color: "#6b6b8a", fontSize: 13 }}>🍽️ Ще нічого не додано</div>
                : todayMeals.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "#1a1a26", border: "1px solid #2a2a3d", marginBottom: 8 }}>
                    {m.thumb ? <img src={m.thumb} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: "#2a2a3d", display: "flex", alignItems: "center", justifyContent: "center" }}>🍽️</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}{m.weight ? <span style={{ color: "#6b6b8a", fontSize: 12, marginLeft: 6 }}>{m.weight}г</span> : ""}</div>
                      <div style={{ fontSize: 12, color: "#6b6b8a" }}>{m.time} · Б:{Math.round(m.p)}г Ж:{Math.round(m.f)}г В:{Math.round(m.c)}г{m.notes ? <span style={{ color: "#ffd166" }}> · {m.notes}</span> : ""}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#a080ff", fontSize: 14 }}>{Math.round(m.k)} ккал</div>
                    <button onClick={() => deleteMeal(i)} style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {tab === "upload" && (
          <div>
            <div ref={dropRef}
              onDragOver={e => { e.preventDefault(); dropRef.current.style.borderColor = "#7c6aff"; }}
              onDragLeave={() => { dropRef.current.style.borderColor = "#2a2a3d"; }}
              onDrop={async e => { e.preventDefault(); dropRef.current.style.borderColor = "#2a2a3d"; await addFiles(e.dataTransfer.files, "food"); }}
              style={{ border: "2px dashed #2a2a3d", borderRadius: 16, padding: "40px 24px", textAlign: "center", background: "#12121a", cursor: "pointer", position: "relative" }}>
              <input type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files, "food")} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
              <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Додай фото страви</div>
              <div style={{ fontSize: 13, color: "#6b6b8a" }}>Перетягни або клікни · можна декілька</div>
            </div>

            {photos.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {photos.map((ph, i) => (
                    <div key={i} style={{ position: "relative", width: 130, height: 110, borderRadius: 12, overflow: "hidden", border: "1px solid #2a2a3d" }}>
                      <img src={ph.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 8px", background: "rgba(10,10,15,0.85)", fontSize: 10, fontWeight: 700, color: ph.type === "food" ? "#3dffa0" : "#ffd166" }}>
                        {ph.type === "food" ? "🍽 СТРАВА" : "🏷 СКЛАД"}
                      </div>
                      <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(10,10,15,0.85)", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  {[["📸 Ще фото страви", "food"], ["🏷️ Фото етикетки", "nutrition"]].map(([label, type]) => (
                    <label key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "1px dashed #2a2a3d", color: "#9090b0", cursor: "pointer", fontSize: 13 }}>
                      <input type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files, type)} style={{ display: "none" }} />
                      {label}
                    </label>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 140 }}>
                    <label style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Вага (г)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="350" style={S.inp} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Примітки</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="без цукру, без масла…" style={S.inp} />
                  </div>
                </div>

                <button onClick={analyze} disabled={analyzing} style={{ marginTop: 18, background: analyzing ? "#2a2a3d" : "linear-gradient(135deg,#7c6aff,#b06aff)", color: "#fff", border: "none", cursor: analyzing ? "default" : "pointer", fontWeight: 700, fontSize: 15, padding: "13px 32px", borderRadius: 12 }}>
                  {analyzing ? "⏳ Аналізую..." : "🔍 Аналізувати"}
                </button>
              </div>
            )}

            {analyzeError && <div style={{ marginTop: 16, background: "rgba(255,58,58,0.1)", border: "1px solid rgba(255,58,58,0.3)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ff6b6b" }}>❌ {analyzeError}</div>}

            {result && (
              <div style={{ ...S.card, marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>🍽️ {result.name}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  {[["Білки", result.p, "г", "p"], ["Жири", result.f, "г", "f"], ["Вуглеводи", result.c, "г", "c"], ["Калорії", result.k, "ккал", "k"]].map(([label, val, unit, t]) => (
                    <div key={t} style={{ flex: 1, minWidth: 90, padding: "12px 14px", borderRadius: 12, background: `${COLORS[t]}11`, border: `1px solid ${COLORS[t]}33` }}>
                      <div style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontWeight: 800, fontSize: 20, color: COLORS[t] }}>{val}{unit}</div>
                    </div>
                  ))}
                </div>
                {result.desc && <div style={{ fontSize: 13, color: "#9090b0", lineHeight: 1.6, marginBottom: 16 }}>{result.desc}</div>}
                <button onClick={addMeal} style={{ background: "transparent", border: "1px solid #3dffa0", color: "#3dffa0", cursor: "pointer", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10 }}>
                  + Додати до щоденника
                </button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={S.card}>
              <span style={S.lbl}>Калорії за тиждень</span>
              <LineCanvas days={histDays} kcals={histKcals} goalK={goals.k} />
            </div>
            {!histDays.length
              ? <div style={{ textAlign: "center", padding: 40, color: "#6b6b8a" }}>📅 Історія порожня</div>
              : histDays.slice().reverse().map(d => {
                const ms = meals[d] || [];
                const tot = ms.reduce((a, m) => ({ p: a.p + m.p, f: a.f + m.f, c: a.c + m.c, k: a.k + m.k }), { p: 0, f: 0, c: 0, k: 0 });
                const mx = Math.max(tot.p, tot.f, tot.c, 1);
                return (
                  <div key={d} style={{ ...S.card, display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" }}>
                    <div style={{ fontWeight: 700, minWidth: 80, fontSize: 14 }}>{formatDate(d)}</div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      {[[tot.p, GRAD.p], [tot.f, GRAD.f], [tot.c, GRAD.c]].map(([v, g], i) => (
                        <div key={i} style={{ height: 6, borderRadius: 3, background: g, width: `${(v / mx) * 100}%`, minWidth: 4 }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: "#9090b0", minWidth: 80, textAlign: "right" }}>
                      {Math.round(tot.k)} ккал<br /><span style={{ fontSize: 11, color: "#6b6b8a" }}>{ms.length} страв</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Твоя норма БЖВ</div>
            <div style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 24 }}>Введи денну норму у грамах</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[["p","Білки (г)"], ["f","Жири (г)"], ["c","Вуглеводи (г)"], ["k","Калорії (ккал)"]].map(([key, label]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <label style={{ fontSize: 11, color: COLORS[key], letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{label}</label>
                  <input type="number" value={goalInputs[key]} onChange={e => setGoalInputs(g => ({ ...g, [key]: e.target.value }))} style={S.inp} />
                </div>
              ))}
            </div>
            <button onClick={saveGoals} style={{ marginTop: 20, background: "#7c6aff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, padding: "12px 28px", borderRadius: 10 }}>
              Зберегти норму
            </button>
            {saveMsg && <div style={{ marginTop: 12, fontSize: 13, color: "#3dffa0" }}>✓ Збережено!</div>}
          </div>
        )}
      </div>
    </div>
  );
}
