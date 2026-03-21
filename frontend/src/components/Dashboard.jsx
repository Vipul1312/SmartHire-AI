import { useState, useEffect } from "react";
import { getDashboard } from "../lib/api";
import { useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    getDashboard(user.id)
      .then(res => setData(res))
      .catch(e => setError(e.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, [user, isLoaded]);

  if (!isLoaded || loading) return (
    <div style={{ textAlign:"center", padding:"60px", color:"var(--text-dim)" }}>
      <div style={{ fontSize:"32px", marginBottom:"12px" }}>⏳</div>
      <p>Loading your history...</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign:"center", padding:"60px", color:"#ff7070" }}>
      <div style={{ fontSize:"32px", marginBottom:"12px" }}>⚠️</div>
      <p style={{ fontWeight:600 }}>Could not load history</p>
      <p style={{ fontSize:"13px", marginTop:"8px", color:"var(--text-dim)" }}>{error}</p>
    </div>
  );

  if (!data || !data.analyses || data.analyses.length === 0) return (
    <div style={{ textAlign:"center", padding:"60px", color:"var(--text-dim)" }}>
      <div style={{ fontSize:"48px", marginBottom:"16px" }}>📂</div>
      <p style={{ fontSize:"18px", fontWeight:600, color:"var(--text)" }}>No analyses yet</p>
      <p style={{ marginTop:"8px" }}>Analyze your first resume to see your progress here!</p>
    </div>
  );

  const { stats, analyses } = data;

  // ── Score History Chart ──────────────────────────────────────────
  const ScoreChart = () => {
    const chartData = [...analyses].reverse(); // oldest first
    const maxVal = 100;
    const chartH = 140;
    const chartW = 400;
    const pad = 32;
    const innerW = chartW - pad * 2;
    const innerH = chartH - 20;
    const n = chartData.length;

    if (n < 2) return (
      <div style={{ textAlign:"center", padding:"20px", color:"var(--text-dim)", fontSize:"13px" }}>
        Analyze at least 2 resumes to see progress chart
      </div>
    );

    const getX = (i) => pad + (i / (n - 1)) * innerW;
    const getY = (val) => 10 + (1 - val / maxVal) * innerH;

    const matchPoints = chartData.map((a, i) => `${getX(i)},${getY(a.match_score)}`).join(" ");
    const atsPoints = chartData.map((a, i) => `${getX(i)},${getY(a.ats_score)}`).join(" ");

    return (
      <div style={{ overflowX:"auto" }}>
        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ maxWidth:"100%" }}>
          {/* Grid lines */}
          {[25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1={pad} y1={getY(v)} x2={chartW - pad} y2={getY(v)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4"/>
              <text x={pad - 6} y={getY(v) + 4} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="end">{v}</text>
            </g>
          ))}

          {/* Match Score line */}
          <polyline points={matchPoints} fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* ATS Score line */}
          <polyline points={atsPoints} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3"/>

          {/* Data points */}
          {chartData.map((a, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(a.match_score)} r="4" fill="#00ff88"/>
              <circle cx={getX(i)} cy={getY(a.ats_score)} r="4" fill="#7c3aed"/>
            </g>
          ))}

          {/* X axis labels */}
          {chartData.map((a, i) => (
            <text key={i} x={getX(i)} y={chartH - 2} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle">
              {i + 1}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div style={{ display:"flex", gap:"20px", justifyContent:"center", marginTop:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"var(--text-dim)" }}>
            <div style={{ width:"16px", height:"3px", background:"#00ff88", borderRadius:"2px" }}/>
            Match Score
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"var(--text-dim)" }}>
            <div style={{ width:"16px", height:"3px", background:"#7c3aed", borderRadius:"2px", borderTop:"2px dashed #7c3aed" }}/>
            ATS Score
          </div>
        </div>
      </div>
    );
  };

  // ── Circular Progress Ring ────────────────────────────────────────
  const Ring = ({ value, color, label, size = 80 }) => {
    const r = size / 2 - 8;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - value / 100);
    return (
      <div style={{ textAlign:"center" }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition:"stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ marginTop:"4px", fontSize:"18px", fontWeight:800, color }}>{value}%</div>
        <div style={{ fontSize:"11px", color:"var(--text-dim)", marginTop:"2px" }}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto", padding:"32px 16px" }}>
      <h2 style={{ fontSize:"24px", fontWeight:700, marginBottom:"24px", color:"var(--text)" }}>
        📊 Your Progress Dashboard
      </h2>

      {/* Stats Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:"16px", marginBottom:"28px" }}>
        {[
          { label:"Total Analyses", value:stats.total_analyses, icon:"🔍" },
          { label:"Best Match", value:`${stats.best_match}%`, icon:"🏆" },
          { label:"Improvement", value:stats.improvement > 0 ? `+${stats.improvement}%` : `${stats.improvement}%`, icon:"📈" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign:"center", padding:"20px" }}>
            <div style={{ fontSize:"28px", marginBottom:"8px" }}>{s.icon}</div>
            <div style={{ fontSize:"22px", fontWeight:800, color:"var(--accent-text)" }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"var(--text-dim)", marginTop:"4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Avg Score Rings */}
      <div className="card" style={{ marginBottom:"24px", padding:"24px" }}>
        <h3 style={{ fontSize:"15px", fontWeight:700, marginBottom:"20px", color:"var(--text)" }}>Average Scores</h3>
        <div style={{ display:"flex", justifyContent:"center", gap:"48px", flexWrap:"wrap" }}>
          <Ring value={stats.avg_match_score} color="#00ff88" label="Avg Match"/>
          <Ring value={stats.avg_ats_score} color="#7c3aed" label="Avg ATS"/>
          <Ring value={stats.best_match} color="#ffd700" label="Best Match"/>
        </div>
      </div>

      {/* Score History Chart */}
      <div className="card" style={{ marginBottom:"24px", padding:"24px" }}>
        <h3 style={{ fontSize:"15px", fontWeight:700, marginBottom:"16px", color:"var(--text)" }}>📈 Score Progress Over Time</h3>
        <ScoreChart/>
      </div>

      {/* Recent Analyses */}
      <h3 style={{ fontSize:"16px", fontWeight:600, marginBottom:"16px", color:"var(--text)" }}>Recent Analyses</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {analyses.map((a) => (
          <div key={a._id} className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px" }}>
            <div>
              <div style={{ fontWeight:600, color:"var(--text)" }}>{a.candidate_name || "Resume"}</div>
              <div style={{ fontSize:"12px", color:"var(--text-dim)", marginTop:"4px" }}>
                {a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
              </div>
            </div>
            <div style={{ display:"flex", gap:"20px", alignItems:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"20px", fontWeight:800, color:a.match_score>=70?"#00ff88":a.match_score>=50?"#ffd700":"#ff6b6b" }}>
                  {a.match_score}%
                </div>
                <div style={{ fontSize:"11px", color:"var(--text-dim)" }}>Match</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"20px", fontWeight:800, color:"#7c3aed" }}>{a.ats_score}%</div>
                <div style={{ fontSize:"11px", color:"var(--text-dim)" }}>ATS</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}