import { useState } from "react";
import { estimateSalary } from "../lib/api";

export default function SalaryEstimator() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [years, setYears] = useState(0);
  const [location, setLocation] = useState("India");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const sk = skillInput.trim().toLowerCase();
    if (sk && !skills.includes(sk)) { setSkills([...skills, sk]); setSkillInput(""); }
  };

  const handleEstimate = async () => {
    if (skills.length === 0) return alert("Add at least one skill");
    setLoading(true);
    try {
      const res = await estimateSalary(skills, parseInt(years), location, role);
      setResult(res);
    } catch (e) { alert("Failed: " + e.message); }
    finally { setLoading(false); }
  };

  const CITIES = ["India","Bangalore","Mumbai","Delhi","Hyderabad","Pune","Chennai","Noida","Gurgaon"];

  const s = {
    card: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"16px" },
    input: { width:"100%", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:"10px", padding:"10px 14px", color:"var(--text)", fontSize:"14px", boxSizing:"border-box" },
    btn: { background:"linear-gradient(135deg,#00ff88,#00cc6a)", border:"none", color:"#0a0a0f", borderRadius:"10px", padding:"10px 24px", fontWeight:700, cursor:"pointer", fontSize:"14px" },
    label: { display:"block", marginBottom:"6px", fontSize:"13px", color:"var(--text-dim)", fontWeight:500 },
  };

  // Simple bar chart using divs
  const maxAvg = result ? Math.max(...result.progression.map(p => p.max)) : 1;

  return (
    <div style={{ maxWidth:"800px", margin:"0 auto", padding:"32px 16px" }}>
      <h2 style={{ fontSize:"24px", fontWeight:700, marginBottom:"8px", color:"var(--text)" }}>💰 Salary Estimator</h2>
      <p style={{ color:"var(--text-dim)", marginBottom:"24px", fontSize:"14px" }}>Year-wise salary progression — Indian market 2024-25</p>

      <div style={s.card}>
        {/* Role */}
        <div style={{ marginBottom:"16px" }}>
          <label style={s.label}>Job Role / Designation</label>
          <input style={s.input} value={role} onChange={e => setRole(e.target.value)}
            placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer..." />
          <p style={{ fontSize:"12px", color:"var(--text-dim)", marginTop:"6px" }}>
            💡 Enter your role for more accurate estimate. Skills are optional.
          </p>
        </div>

        {/* Skills */}
        <div style={{ marginBottom:"16px" }}>
          <label style={s.label}>Your Skills (optional)</label>
          <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
            <input style={{ ...s.input, flex:1 }} value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key==="Enter" && addSkill()} placeholder="e.g. React, Python, Machine Learning..." />
            <button style={s.btn} onClick={addSkill}>Add</button>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {skills.map(sk => (
              <span key={sk} onClick={() => setSkills(skills.filter(x => x!==sk))} style={{ background:"rgba(0,255,136,0.1)", border:"1px solid rgba(0,255,136,0.3)", color:"var(--accent-text)", borderRadius:"20px", padding:"4px 12px", fontSize:"13px", cursor:"pointer" }}>
                {sk} ✕
              </span>
            ))}
          </div>
        </div>

        {/* Experience Slider */}
        <div style={{ marginBottom:"16px" }}>
          <label style={s.label}>
            Years of Experience: <strong style={{ color:"var(--accent-text)" }}>{years} year{years!=1?"s":""}</strong>
            {years == 0 && <span style={{ color:"var(--text-dim)", fontWeight:400 }}> (Fresher)</span>}
            {years >= 1 && years < 3 && <span style={{ color:"var(--text-dim)", fontWeight:400 }}> (Junior)</span>}
            {years >= 3 && years < 5 && <span style={{ color:"var(--text-dim)", fontWeight:400 }}> (Mid-Senior)</span>}
            {years >= 5 && years < 8 && <span style={{ color:"var(--text-dim)", fontWeight:400 }}> (Senior)</span>}
            {years >= 8 && <span style={{ color:"var(--text-dim)", fontWeight:400 }}> (Principal)</span>}
          </label>
          <input type="range" min="0" max="10" value={years} onChange={e => setYears(e.target.value)} style={{ width:"100%", accentColor:"#00ff88" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"var(--text-dim)", marginTop:"4px" }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(y => <span key={y}>{y}</span>)}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom:"20px" }}>
          <label style={s.label}>Location</label>
          <select style={s.input} value={location} onChange={e => setLocation(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button style={{ ...s.btn, width:"100%", padding:"12px" }} onClick={handleEstimate} disabled={loading}>
          {loading ? "Calculating..." : "💰 Estimate Salary"}
        </button>
      </div>

      {result && (
        <>
          {/* Current Salary Card */}
          <div style={{ ...s.card, borderColor:"rgba(0,255,136,0.4)" }}>
            <div style={{ textAlign:"center", marginBottom:"20px" }}>
              <div style={{ fontSize:"13px", color:"var(--text-dim)", marginBottom:"6px" }}>
                At {result.experience_years} year{result.experience_years!==1?"s":""} — {result.level}
              </div>
              <div style={{ fontSize:"44px", fontWeight:900, color:"var(--accent-text)" }}>
                {result.min_lpa} – {result.max_lpa} <span style={{ fontSize:"18px" }}>LPA</span>
              </div>
              <div style={{ fontSize:"16px", color:"var(--text)", marginTop:"4px" }}>
                Average: ₹{result.avg_lpa} LPA
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
              {[["Top Skill", result.primary_skill],["Location", result.location],["Level", result.level]].map(([l,v]) => (
                <div key={l} style={{ textAlign:"center", background:"rgba(0,255,136,0.05)", borderRadius:"10px", padding:"12px" }}>
                  <div style={{ fontSize:"11px", color:"var(--text-dim)" }}>{l}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"var(--text)", textTransform:"capitalize", marginTop:"4px" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Year-wise Progression Chart */}
          <div style={s.card}>
            <h3 style={{ fontWeight:700, marginBottom:"20px", color:"var(--text)", fontSize:"16px" }}>📈 Year-wise Salary Progression</h3>
            <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"160px", marginBottom:"8px" }}>
              {result.progression.map((p, i) => {
                const isCurrentYear = p.year === result.experience_years;
                const barHeight = Math.round((p.avg / maxAvg) * 140);
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                    <div style={{ fontSize:"9px", color: isCurrentYear ? "var(--accent-text)" : "var(--text-dim)", fontWeight: isCurrentYear ? 700 : 400 }}>
                      {p.avg}
                    </div>
                    <div style={{ width:"100%", height:`${barHeight}px`, background: isCurrentYear ? "linear-gradient(180deg,#00ff88,#00cc6a)" : "rgba(0,255,136,0.2)", borderRadius:"4px 4px 0 0", position:"relative", transition:"height 0.3s" }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              {result.progression.map((p, i) => (
                <div key={i} style={{ flex:1, textAlign:"center", fontSize:"10px", color: p.year===result.experience_years ? "var(--accent-text)" : "var(--text-dim)", fontWeight: p.year===result.experience_years ? 700 : 400 }}>
                  {p.year}yr
                </div>
              ))}
            </div>
            <div style={{ marginTop:"12px", display:"flex", gap:"16px", justifyContent:"center" }}>
              <span style={{ fontSize:"12px", color:"var(--text-dim)" }}>
                <span style={{ display:"inline-block", width:"10px", height:"10px", background:"linear-gradient(#00ff88,#00cc6a)", borderRadius:"2px", marginRight:"4px" }}/>
                Your current year
              </span>
              <span style={{ fontSize:"12px", color:"var(--text-dim)" }}>
                <span style={{ display:"inline-block", width:"10px", height:"10px", background:"rgba(0,255,136,0.2)", borderRadius:"2px", marginRight:"4px" }}/>
                Other years
              </span>
            </div>
          </div>

          {/* Min/Max table */}
          <div style={s.card}>
            <h3 style={{ fontWeight:700, marginBottom:"16px", color:"var(--text)", fontSize:"15px" }}>Detailed Breakdown (LPA)</h3>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Year","Level","Min","Avg","Max"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:"var(--text-dim)", fontWeight:600, fontSize:"12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.progression.map((p, i) => {
                    const lvl = p.year===0?"Fresher":p.year===1?"Junior":p.year<3?"Junior+":p.year<5?"Mid Level":p.year<8?"Senior":"Principal";
                    const isCurrent = p.year === result.experience_years;
                    return (
                      <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background: isCurrent ? "rgba(0,255,136,0.06)" : "transparent" }}>
                        <td style={{ padding:"8px 12px", color: isCurrent ? "var(--accent-text)" : "var(--text)", fontWeight: isCurrent ? 700 : 400 }}>{p.year} yr {isCurrent ? "← You" : ""}</td>
                        <td style={{ padding:"8px 12px", color:"var(--text-dim)" }}>{lvl}</td>
                        <td style={{ padding:"8px 12px", color:"var(--text)" }}>{p.min}</td>
                        <td style={{ padding:"8px 12px", color: isCurrent ? "var(--accent-text)" : "var(--text)", fontWeight: isCurrent ? 700 : 400 }}>{p.avg}</td>
                        <td style={{ padding:"8px 12px", color:"var(--text)" }}>{p.max}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:"11px", color:"var(--text-dim)", marginTop:"12px", fontStyle:"italic" }}>{result.note}</p>
          </div>
        </>
      )}
    </div>
  );
}