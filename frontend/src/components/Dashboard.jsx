import { useState, useEffect } from "react";
import { getDashboard } from "../lib/api";
import { useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!isLoaded) return;
    // If no user after load, stop
    if (!user) { setLoading(false); return; }

    setLoading(true);
    setError(null);
    getDashboard(user.id)
      .then(res => setData(res))
      .catch(e => setError(e.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, [user, isLoaded]);

  // Clerk still initializing
  if (!isLoaded || loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-dim)" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
      <p>Loading your history...</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#ff7070" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ fontWeight: 600 }}>Could not load history</p>
      <p style={{ fontSize: "13px", marginTop: "8px", color: "var(--text-dim)" }}>{error}</p>
      <p style={{ fontSize: "13px", marginTop: "4px", color: "var(--text-dim)" }}>Make sure backend is running on port 8000</p>
    </div>
  );

  if (!data || !data.analyses || data.analyses.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-dim)" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
      <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>No analyses yet</p>
      <p style={{ marginTop: "8px" }}>Analyze your first resume to see your progress here!</p>
    </div>
  );

  const { stats, analyses } = data;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px", color: "var(--text)" }}>
        📊 Your Progress Dashboard
      </h2>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Total Analyses", value: stats.total_analyses, icon: "🔍" },
          { label: "Avg Match Score", value: `${stats.avg_match_score}%`, icon: "🎯" },
          { label: "Avg ATS Score", value: `${stats.avg_ats_score}%`, icon: "📄" },
          { label: "Best Match", value: `${stats.best_match}%`, icon: "🏆" },
          { label: "Improvement", value: stats.improvement > 0 ? `+${stats.improvement}%` : `${stats.improvement}%`, icon: "📈" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent-text)" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* History List */}
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text)" }}>Recent Analyses</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {analyses.map((a) => (
          <div key={a._id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text)" }}>{a.candidate_name || "Resume"}</div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>
                {a.created_at
                  ? new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: a.match_score >= 70 ? "#00ff88" : a.match_score >= 50 ? "#ffd700" : "#ff6b6b" }}>
                  {a.match_score}%
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Match</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-text)" }}>{a.ats_score}%</div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>ATS</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}