import { useState, useEffect, useMemo } from "react";

// ====== قواعد عصام ======
const MIN_VOLUME = 5000; // حد أدنى $5K
const DOMAINS = {
  all: { label: "كل المجالات", keys: [] },
  btc: {
    label: "₿ بيتكوين وكريبتو",
    keys: ["bitcoin", "btc", "crypto", "ethereum", "eth ", "solana"],
  },
  energy: {
    label: "🛢️ طاقة وجيوسياسة",
    keys: ["oil", "opec", "energy", "iran", "strait", "gas", "saudi arabia", "barrel", "brent", "nuclear", "israel", "gulf"],
  },
  saudi: {
    label: "⚽ كرة قدم / السعودية",
    keys: ["saudi", "al-hilal", "al hilal", "al-nassr", "al nassr", "ronaldo", "pro league", "afc", "asian cup", "world cup", "champions league"],
  },
};

const fmtMoney = (n) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + Math.round(n);
};

const fmtPct = (p) => (p * 100).toFixed(0) + "%";

// درجة الفرصة: سيولة جيدة + سعر في منطقة 60-80% (منطقة عصام المفضلة)
function edgeScore(m) {
  let s = 0;
  const p = m.price;
  if (p >= 0.6 && p <= 0.8) s += 40;
  else if (p >= 0.5 && p < 0.6) s += 25;
  else if (p > 0.8 && p <= 0.9) s += 15;
  if (m.volume24h > 50000) s += 30;
  else if (m.volume24h > 20000) s += 20;
  else if (m.volume24h > 5000) s += 10;
  if (m.spread !== null && m.spread < 0.02) s += 20;
  else if (m.spread !== null && m.spread < 0.05) s += 10;
  return s;
}

export default function EdgeScanner() {
  const [markets, setMarkets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [domain, setDomain] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [sweetOnly, setSweetOnly] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=300&order=volume24hr&ascending=false"
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const parsed = data
        .map((m) => {
          let price = null;
          try {
            const prices = JSON.parse(m.outcomePrices || "[]");
            price = parseFloat(prices[0]);
          } catch {}
          return {
            id: m.id,
            q: m.question,
            slug: m.slug,
            price,
            volume24h: parseFloat(m.volume24hr || 0),
            volume: parseFloat(m.volume || 0),
            liquidity: parseFloat(m.liquidity || 0),
            spread: m.spread != null ? parseFloat(m.spread) : null,
            endDate: m.endDate,
          };
        })
        .filter((m) => m.price !== null && !isNaN(m.price));
      setMarkets(parsed);
      setStatus("ok");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = markets.filter((m) => m.volume24h >= MIN_VOLUME || m.volume >= MIN_VOLUME);
    if (domain !== "all") {
      const keys = DOMAINS[domain].keys;
      list = list.filter((m) => {
        const q = m.q.toLowerCase();
        return keys.some((k) => q.includes(k));
      });
    }
    if (sweetOnly) list = list.filter((m) => m.price >= 0.6 && m.price <= 0.8);
    const withScore = list.map((m) => ({ ...m, score: edgeScore(m) }));
    withScore.sort((a, b) =>
      sortBy === "score" ? b.score - a.score : sortBy === "vol" ? b.volume24h - a.volume24h : a.price - b.price
    );
    return withScore;
  }, [markets, domain, sortBy, sweetOnly]);

  return (
    <div dir="rtl" style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=IBM+Plex+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        .row:hover { background: #15202e !important; }
        .chip { cursor: pointer; transition: all .15s; }
        .chip:hover { border-color: #d4a843 !important; }
        button:focus-visible, a:focus-visible { outline: 2px solid #d4a843; outline-offset: 2px; }
      `}</style>

      {/* الهيدر */}
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>أداة عصام — أسواق التنبؤ</div>
          <h1 style={styles.title}>ماسح الفرص</h1>
          <div style={styles.sub}>
            قواعدك مطبّقة: حجم ≥ $5K · منطقة 60–80% مفضّلة · مجالات الـ edge الثلاثة
          </div>
        </div>
        <button onClick={load} style={styles.refresh}>↻ تحديث</button>
      </header>

      {/* الفلاتر */}
      <div style={styles.filters}>
        {Object.entries(DOMAINS).map(([k, d]) => (
          <button
            key={k}
            className="chip"
            onClick={() => setDomain(k)}
            style={{ ...styles.chip, ...(domain === k ? styles.chipActive : {}) }}
          >
            {d.label}
          </button>
        ))}
        <span style={styles.divider} />
        <button
          className="chip"
          onClick={() => setSweetOnly(!sweetOnly)}
          style={{ ...styles.chip, ...(sweetOnly ? styles.chipActive : {}) }}
        >
          🎯 منطقة 60–80% فقط
        </button>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
          <option value="score">ترتيب: درجة الفرصة</option>
          <option value="vol">ترتيب: حجم 24س</option>
          <option value="price">ترتيب: السعر</option>
        </select>
      </div>

      {/* الحالة */}
      {status === "loading" && <div style={styles.note}>جارٍ سحب الأسواق الحية من Polymarket…</div>}
      {status === "error" && (
        <div style={{ ...styles.note, color: "#e07a5f" }}>
          تعذّر الاتصال بـ Polymarket API من المتصفح. جرّب التحديث — وإذا استمرت المشكلة، أخبرني وأحولها لنسخة تشتغل عبر خادم وسيط.
        </div>
      )}
      {status === "ok" && (
        <div style={styles.note}>
          {filtered.length} سوق مطابق لقواعدك من أصل {markets.length} سوق نشط
        </div>
      )}

      {/* الجدول */}
      <div style={styles.table}>
        <div style={{ ...styles.tr, ...styles.thead }}>
          <span>السوق</span>
          <span style={styles.num}>السعر (نعم)</span>
          <span style={styles.num}>حجم 24س</span>
          <span style={styles.num}>السيولة</span>
          <span style={styles.num}>درجة الفرصة</span>
        </div>
        {filtered.slice(0, 40).map((m) => (
          <a
            key={m.id}
            className="row"
            href={"https://polymarket.com/market/" + m.slug}
            target="_blank"
            rel="noreferrer"
            style={styles.tr}
          >
            <span style={styles.q}>{m.q}</span>
            <span style={{ ...styles.num, ...priceStyle(m.price) }}>{fmtPct(m.price)}</span>
            <span style={styles.num}>{fmtMoney(m.volume24h)}</span>
            <span style={styles.num}>{fmtMoney(m.liquidity)}</span>
            <span style={{ ...styles.num, ...scoreStyle(m.score) }}>{m.score}</span>
          </a>
        ))}
        {status === "ok" && filtered.length === 0 && (
          <div style={styles.empty}>ما فيه أسواق مطابقة حالياً — جرّب مجال آخر أو ألغِ فلتر 60–80%.</div>
        )}
      </div>

      <footer style={styles.footer}>
        البيانات من Polymarket Gamma API — حية عند كل تحديث. درجة الفرصة = سعر في منطقتك + سيولة + spread ضيق. القرار النهائي دائماً لك.
      </footer>
    </div>
  );
}

const priceStyle = (p) =>
  p >= 0.6 && p <= 0.8
    ? { color: "#d4a843", fontWeight: 700 }
    : { color: "#9fb3c8" };

const scoreStyle = (s) =>
  s >= 70 ? { color: "#d4a843", fontWeight: 700 } : s >= 40 ? { color: "#7fa8d9" } : { color: "#5a6b7d" };

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0c141d",
    color: "#dde6ee",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    padding: "28px 20px 60px",
    maxWidth: 1000,
    margin: "0 auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 },
  eyebrow: { fontSize: 12, letterSpacing: 2, color: "#d4a843", marginBottom: 6 },
  title: { fontSize: 34, fontWeight: 700, margin: 0 },
  sub: { color: "#8aa0b4", fontSize: 14, marginTop: 8 },
  refresh: {
    background: "transparent",
    border: "1px solid #2a3a4d",
    color: "#dde6ee",
    borderRadius: 8,
    padding: "10px 18px",
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  filters: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 18 },
  chip: {
    background: "transparent",
    border: "1px solid #2a3a4d",
    color: "#b9c8d6",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 14,
    fontFamily: "inherit",
  },
  chipActive: { background: "#1b2838", borderColor: "#d4a843", color: "#d4a843" },
  divider: { width: 1, height: 24, background: "#2a3a4d", margin: "0 4px" },
  select: {
    background: "#101b27",
    border: "1px solid #2a3a4d",
    color: "#dde6ee",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    marginInlineStart: "auto",
  },
  note: { color: "#8aa0b4", fontSize: 14, marginBottom: 12 },
  table: { border: "1px solid #1e2c3c", borderRadius: 12, overflow: "hidden" },
  thead: {
    background: "#101b27",
    color: "#8aa0b4",
    fontSize: 13,
    fontWeight: 500,
    cursor: "default",
  },
  tr: {
    display: "grid",
    gridTemplateColumns: "1fr 90px 100px 100px 90px",
    gap: 10,
    padding: "14px 16px",
    borderBottom: "1px solid #15202e",
    textDecoration: "none",
    color: "inherit",
    alignItems: "center",
    background: "#0e1722",
  },
  q: { fontSize: 14.5, lineHeight: 1.5 },
  num: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, textAlign: "left", direction: "ltr" },
  empty: { padding: 30, textAlign: "center", color: "#8aa0b4" },
  footer: { marginTop: 20, color: "#5a6b7d", fontSize: 12.5, lineHeight: 1.7 },
};
