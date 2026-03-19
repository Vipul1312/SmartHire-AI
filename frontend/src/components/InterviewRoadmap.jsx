import { useState } from "react";
import { getInterviewRoadmap } from "../lib/api";

const POPULAR_COMPANIES = [
  "Google","Amazon","Microsoft","Meta","Apple","Netflix","Flipkart",
  "Swiggy","Zomato","Paytm","CRED","Razorpay","Infosys","TCS","Wipro",
  "Accenture","Deloitte","Goldman Sachs","JP Morgan","Adobe"
];

const WEEK_COLORS = ["#00ff88","#00ccff","#ff9900","#ff6b6b"];

export default function InterviewRoadmap() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!company.trim()) return alert("Please enter company name");
    if (!role.trim()) return alert("Please enter job role");
    setLoading(true);
    setResult(null);
    try {
      const res = await getInterviewRoadmap(company, role, parseInt(years));
      setResult(res);
    } catch (e) { alert("Failed: " + e.message); }
    finally { setLoading(false); }
  };

  const copyRoadmap = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const s = {
    card: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"16px" },
    input: { width:"100%", background:"var(--input-bg)", border:"1px solid var(--input-border)", borderRadius:"10px", padding:"10px 14px", color:"var(--input-text)", fontSize:"14px", boxSizing:"border-box" },
    btn: { background:"linear-gradient(135deg,#00ff88,#00cc6a)", border:"none", color:"#0a0a0f", borderRadius:"10px", padding:"10px 24px", fontWeight:700, cursor:"pointer", fontSize:"14px" },
    btnGhost: { background:"transparent", border:"1px solid var(--border)", color:"var(--text-dim)", borderRadius:"10px", padding:"8px 18px", fontWeight:600, cursor:"pointer", fontSize:"13px" },
    label: { display:"block", marginBottom:"6px", fontSize:"13px", color:"var(--text-dim)", fontWeight:500 },
    sectionCard: (color) => ({ background:`rgba(${color},0.06)`, border:`1px solid rgba(${color},0.2)`, borderRadius:"12px", padding:"18px", marginBottom:"12px" }),
  };

  // Parse week-wise plan into individual weeks
  const parseWeeks = (text) => {
    if (!text) return [];
    const weeks = [];
    text.split("\n").forEach(line => {
      const weekMatch = line.match(/week\s*(\d)/i);
      if (weekMatch) {
        // Format: "Week 1: task1. task2."
        const weekNum = parseInt(weekMatch[1]);
        const rest = line.replace(/week\s*\d+\s*[:\-]?/i, "").trim();
        const items = rest.split(/\.\s+|;\s+/).map(i => i.replace(/^[-•*]\s*/, "").trim()).filter(i => i.length > 3);
        weeks.push({ week: weekNum, items });
      }
    });
    // Sort by week number
    weeks.sort((a, b) => a.week - b.week);
    return weeks;
  };

  // Parse bullet points from section text
  const parseBullets = (text) => {
    if (!text) return [];
    return text.split("\n")
      .map(l => l.replace(/^[-•*\d.]+\s*/, "").replace(/\*\*/g, "").trim())
      .filter(l => l.length > 5 && !l.startsWith("#"));
  };

  const getSectionByKeyword = (keyword) => {
    if (!result?.sections) return null;
    const key = Object.keys(result.sections).find(k => k.toUpperCase().includes(keyword));
    return key ? result.sections[key] : null;
  };

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto", padding:"32px 16px" }}>
      <h2 style={{ fontSize:"24px", fontWeight:700, marginBottom:"8px", color:"var(--text)" }}>🗺 Interview Prep Roadmap</h2>
      <p style={{ color:"var(--text-dim)", marginBottom:"24px", fontSize:"14px" }}>
        Get a personalized week-by-week preparation plan for any company
      </p>

      {/* Input Form */}
      <div style={s.card}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
          <div>
            <label style={s.label}>Company Name *</label>
            <input style={s.input} value={company} onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Google, Amazon, TCS..." list="companies" />
            <datalist id="companies">
              {POPULAR_COMPANIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label style={s.label}>Job Role *</label>
            <input style={s.input} value={role} onChange={e => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Data Scientist..." />
          </div>
        </div>

        <div style={{ marginBottom:"20px" }}>
          <label style={s.label}>
            Your Experience: <strong style={{ color:"var(--accent-text)" }}>{years} year{years!=1?"s":""}</strong>
            <span style={{ color:"var(--text-dim)", fontWeight:400 }}>
              {years == 0 ? " (Fresher)" : years < 3 ? " (Junior)" : years < 5 ? " (Mid)" : " (Senior)"}
            </span>
          </label>
          <input type="range" min="0" max="10" value={years} onChange={e => setYears(e.target.value)}
            style={{ width:"100%", accentColor:"#00ff88", marginTop:"6px" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"var(--text-dim)", marginTop:"4px" }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(y => <span key={y}>{y}</span>)}
          </div>
        </div>

        <button style={{ ...s.btn, width:"100%", padding:"13px" }} onClick={handleGenerate} disabled={loading}>
          {loading ? "⏳ Generating your roadmap..." : "🗺 Generate Roadmap"}
        </button>
      </div>

      {/* Popular Companies Quick Select */}
      {!result && !loading && (
        <div style={s.card}>
          <div style={{ fontSize:"13px", color:"var(--text-dim)", marginBottom:"10px", fontWeight:600 }}>
            Quick select popular companies:
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {POPULAR_COMPANIES.slice(0, 12).map(c => (
              <span key={c} onClick={() => setCompany(c)}
                style={{ background: company===c ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.04)", border: company===c ? "1px solid rgba(0,255,136,0.4)" : "1px solid var(--border)", color: company===c ? "var(--accent-text)" : "var(--text-dim)", borderRadius:"20px", padding:"5px 14px", fontSize:"13px", cursor:"pointer" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ ...s.card, textAlign:"center", padding:"48px" }}>
          <div style={{ fontSize:"40px", marginBottom:"16px" }}>⏳</div>
          <p style={{ color:"var(--text-dim)", fontSize:"15px" }}>
            Generating personalized roadmap for <strong style={{ color:"var(--accent-text)" }}>{company}</strong>...
          </p>
          <p style={{ color:"var(--text-dim)", fontSize:"13px", marginTop:"8px" }}>This may take 10-15 seconds</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Header */}
          <div style={{ ...s.card, borderColor:"rgba(0,255,136,0.3)", background:"rgba(0,255,136,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
              <div>
                <h3 style={{ fontSize:"20px", fontWeight:800, color:"var(--text)", marginBottom:"4px" }}>
                  {result.company} — {result.role}
                </h3>
                <p style={{ fontSize:"13px", color:"var(--text-dim)" }}>
                  {result.level.charAt(0).toUpperCase() + result.level.slice(1)} level • {result.weeks_needed} week preparation plan
                </p>
              </div>
              <div style={{ display:"flex", gap:"10px" }}>
                <button style={s.btnGhost} onClick={copyRoadmap}>{copied ? "✓ Copied!" : "📋 Copy"}</button>
                <button style={s.btnGhost} onClick={() => setResult(null)}>🔄 New</button>
              </div>
            </div>
          </div>

          {/* Company Overview */}
          {getSectionByKeyword("COMPANY") && (
            <div style={s.card}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--accent-text)", marginBottom:"12px" }}>
                🏢 About {result.company}
              </div>
              {parseBullets(getSectionByKeyword("COMPANY")).map((item, i) => (
                <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"8px" }}>
                  <span style={{ color:"var(--accent-text)", flexShrink:0 }}>▸</span>
                  <span style={{ fontSize:"14px", color:"var(--text)", lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Technical Topics */}
          {getSectionByKeyword("TECHNICAL") && (
            <div style={s.card}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#00ccff", marginBottom:"12px" }}>
                💻 Technical Topics to Study
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                {parseBullets(getSectionByKeyword("TECHNICAL")).map((item, i) => {
                  const isHigh = item.toLowerCase().includes("high");
                  return (
                    <div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", background:"rgba(0,204,255,0.05)", borderRadius:"8px", padding:"10px 12px" }}>
                      <span style={{ fontSize:"10px", fontWeight:700, color: isHigh ? "#ff6b6b" : "#ffd700", background: isHigh ? "rgba(255,100,100,0.1)" : "rgba(255,215,0,0.1)", borderRadius:"4px", padding:"2px 6px", flexShrink:0, marginTop:"2px" }}>
                        {isHigh ? "HIGH" : "MED"}
                      </span>
                      <span style={{ fontSize:"13px", color:"var(--text)", lineHeight:1.5 }}>{item.replace(/high|medium|priority/gi, '').trim()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week-wise Plan */}
          {getSectionByKeyword("WEEK") && (
            <div style={s.card}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ff9900", marginBottom:"16px" }}>
                📅 Week-wise Preparation Plan
              </div>
              {parseWeeks(getSectionByKeyword("WEEK")).length > 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"12px" }}>
                  {parseWeeks(getSectionByKeyword("WEEK")).map((w, i) => (
                    <div key={i} style={{ background:`rgba(${i===0?"0,255,136":i===1?"0,204,255":i===2?"255,153,0":"255,107,107"},0.06)`, border:`1px solid rgba(${i===0?"0,255,136":i===1?"0,204,255":i===2?"255,153,0":"255,107,107"},0.2)`, borderRadius:"12px", padding:"16px" }}>
                      <div style={{ fontSize:"13px", fontWeight:800, color: WEEK_COLORS[i] || "var(--accent-text)", marginBottom:"10px" }}>
                        Week {w.week}
                      </div>
                      {w.items.map((item, j) => (
                        <div key={j} style={{ fontSize:"12px", color:"var(--text-dim)", marginBottom:"6px", display:"flex", gap:"6px" }}>
                          <span style={{ color:WEEK_COLORS[i], flexShrink:0 }}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <pre style={{ whiteSpace:"pre-wrap", fontSize:"13px", color:"var(--text-dim)", lineHeight:1.7, fontFamily:"inherit" }}>
                  {getSectionByKeyword("WEEK")}
                </pre>
              )}
            </div>
          )}

          {/* Must Practice */}
          {getSectionByKeyword("PRACTICE") && (
            <div style={s.card}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ff6b6b", marginBottom:"12px" }}>
                🎯 Must Practice
              </div>
              {parseBullets(getSectionByKeyword("PRACTICE")).map((item, i) => (
                <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"10px", background:"rgba(255,107,107,0.05)", borderRadius:"8px", padding:"10px 14px" }}>
                  <span style={{ color:"#ff6b6b", fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                  <span style={{ fontSize:"13px", color:"var(--text)", lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Resources */}
          {getSectionByKeyword("RESOURCE") && (
            <div style={s.card}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ffd700", marginBottom:"12px" }}>
                📚 Free Resources
              </div>
              {parseBullets(getSectionByKeyword("RESOURCE")).map((item, i) => (
                <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"8px" }}>
                  <span style={{ color:"#ffd700", flexShrink:0 }}>▸</span>
                  <span style={{ fontSize:"13px", color:"var(--text)", lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Interview Tips */}
          {getSectionByKeyword("TIP") && (
            <div style={{ ...s.card, borderColor:"rgba(0,255,136,0.3)" }}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--accent-text)", marginBottom:"12px" }}>
                💡 {result.company}-Specific Tips
              </div>
              {parseBullets(getSectionByKeyword("TIP")).map((item, i) => (
                <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"10px" }}>
                  <span style={{ color:"var(--accent-text)", flexShrink:0 }}>✦</span>
                  <span style={{ fontSize:"13px", color:"var(--text)", lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}