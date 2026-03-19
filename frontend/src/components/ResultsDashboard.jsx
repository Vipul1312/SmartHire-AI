import { useState } from "react";

const TABS = [
  { id: "overview", label: "◎ Overview" },
  { id: "ats", label: "⚡ ATS Score" },
  { id: "improvements", label: "◐ Improvements" },
  { id: "rewrite", label: "✦ Bullet Rewriter" },
  { id: "roadmap", label: "◈ Skill Roadmap" },
  { id: "interview", label: "◉ Interview Prep" },
  { id: "cover", label: "✉ Cover Letter" },
];

export default function ResultsDashboard({ results, onReset }) {
  const [tab, setTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  const score = results.match_score;
  const atsScore = results.ats_score ?? 0;
  const C = 2 * Math.PI * 90;
  const scoreColor = score >= 75 ? "#00ff88" : score >= 50 ? "#fbbf24" : "#ff7070";
  const atsColor = atsScore >= 75 ? "#00ff88" : atsScore >= 50 ? "#fbbf24" : "#ff7070";

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const levelColor = (l) => l?.includes("Senior") ? "#a78bfa" : l?.includes("Mid") ? "#fbbf24" : "#00ff88";

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <h2 className="text-3xl font-bold">Your Results</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>AI · NLP · ML analysis complete</p>
        </div>
        <button className="btn-secondary" onClick={onReset}>← New Analysis</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap fade-in">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? "tab-active" : "tab-inactive"}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6 fade-in">
          {results.candidate_level && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <span>👤</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Detected Level</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: levelColor(results.candidate_level) }}>{results.candidate_level}</p>
              </div>
              {results.resume_entities?.sections_found?.length > 0 && (
                <div className="ml-auto flex gap-2 flex-wrap justify-end">
                  {results.resume_entities.sections_found.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-md capitalize" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card flex flex-col items-center glow-green">
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>Resume Match Score</p>
              <svg width="220" height="220" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle cx="110" cy="110" r="90" fill="none" stroke={scoreColor} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (score / 100) * C} transform="rotate(-90 110 110)"
                  style={{ filter: `drop-shadow(0 0 8px ${scoreColor})`, transition: "stroke-dashoffset 1.5s" }} />
                <text x="110" y="100" textAnchor="middle" fill={scoreColor} fontSize="48" fontWeight="800">{score}</text>
                <text x="110" y="128" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">out of 100</text>
              </svg>
              <p className="text-sm mt-4 text-center px-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                {score >= 75 ? "Great match! Strong candidate." : score >= 50 ? "Decent match. Some improvements recommended." : "Low match. Follow improvement tips."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="card">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>AI Assessment</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{results.overall_feedback}</p>
              </div>
              {results.personalized_feedback && (
                <div className="card" style={{ background: "rgba(167,139,250,0.05)", borderColor: "rgba(167,139,250,0.1)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>✦ Personalized Advice</p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{results.personalized_feedback}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>✓ Matched Keywords ({results.matched_keywords.length})</p>
              <div className="flex flex-wrap gap-2">
                {results.matched_keywords.map((k) => <span key={k} className="tag tag-green">{k}</span>)}
              </div>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>✗ Missing Keywords ({results.missing_keywords.length})</p>
              <div className="flex flex-wrap gap-2">
                {results.missing_keywords.map((k) => <span key={k} className="tag tag-red">{k}</span>)}
                {results.missing_keywords.length === 0 && <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No major keywords missing! 🎉</p>}
              </div>
            </div>
          </div>


        </div>
      )}

      {/* ATS */}
      {tab === "ats" && (
        <div className="space-y-6 fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card flex flex-col items-center">
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>ATS Compatibility Score</p>
              <svg width="220" height="220" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle cx="110" cy="110" r="90" fill="none" stroke={atsColor} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (atsScore / 100) * C} transform="rotate(-90 110 110)"
                  style={{ filter: `drop-shadow(0 0 8px ${atsColor})`, transition: "stroke-dashoffset 1.5s" }} />
                <text x="110" y="100" textAnchor="middle" fill={atsColor} fontSize="48" fontWeight="800">{atsScore}</text>
                <text x="110" y="128" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">out of 100</text>
              </svg>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>Score Breakdown</p>
              <div className="space-y-4">
                {results.ats_breakdown && Object.entries({ "Keyword Match": results.ats_breakdown.keyword_match, "Formatting": results.ats_breakdown.formatting, "Length": results.ats_breakdown.length, "Action Verbs": results.ats_breakdown.action_verbs }).map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                      <span style={{ color: "#00ff88" }}>{val}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (val / 40) * 100)}%`, background: "#00ff88" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {results.ats_tips?.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>⚡ ATS Tips</p>
              <div className="space-y-3">
                {results.ats_tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
                    <span style={{ color: "#fbbf24" }}>⚠</span>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* IMPROVEMENTS */}
      {tab === "improvements" && (
        <div className="card fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>AI Resume Improvements</p>
          <div className="space-y-4">
            {results.resume_improvements.map((tip, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.08)" }}>
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>{i + 1}</span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BULLET REWRITER */}
      {tab === "rewrite" && (
        <div className="card fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>✦ AI Bullet Rewriter</p>
          <div className="space-y-3">
            {results.rewritten_bullets?.length > 0 ? results.rewritten_bullets.map((line, i) => {
              const isAfter = line.toLowerCase().includes("after");
              const isBefore = line.toLowerCase().includes("before");
              const isNum = /^\d+\./.test(line);
              return (
                <div key={i} className="p-3 rounded-xl" style={{ background: isAfter ? "rgba(0,255,136,0.05)" : isBefore ? "rgba(255,80,80,0.04)" : isNum ? "rgba(255,255,255,0.03)" : "transparent", border: isAfter ? "1px solid rgba(0,255,136,0.1)" : isBefore ? "1px solid rgba(255,80,80,0.1)" : "none" }}>
                  <p className="text-sm leading-relaxed" style={{ color: isAfter ? "#00ff88" : isBefore ? "#ff7070" : isNum ? "#a78bfa" : "rgba(255,255,255,0.6)", fontWeight: isNum ? 700 : 400 }}>{line}</p>
                </div>
              );
            }) : <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No rewritten bullets available.</p>}
          </div>
        </div>
      )}

      {/* ROADMAP */}
      {tab === "roadmap" && (
        <div className="card fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>◈ Skill Gap Roadmap</p>
          {results.skill_roadmap?.length > 0 ? (
            <div className="space-y-3">
              {results.skill_roadmap.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-bold capitalize" style={{ color: "rgba(255,255,255,0.85)" }}>{item.skill}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: item.priority === "High" ? "rgba(255,80,80,0.15)" : "rgba(251,191,36,0.15)", color: item.priority === "High" ? "#ff7070" : "#fbbf24" }}>{item.priority} Priority</span>
                    </div>
                  </div>
                  <a href={item.free_course} target="_blank" rel="noopener noreferrer" className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}>Free Course →</a>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>🎉 No skill gaps found!</p>}
        </div>
      )}

      {/* INTERVIEW */}
      {tab === "interview" && (
        <div className="space-y-6 fade-in">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>⚙ Technical Questions</p>
            <div className="space-y-3">
              {(results.mock_interview?.technical_questions ?? results.interview_questions ?? []).map((q, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.08)" }}>
                  <div className="flex gap-3">
                    <span className="text-xs font-bold mt-0.5" style={{ color: "#00ff88" }}>T{i + 1}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{q}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {results.mock_interview?.hr_questions?.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>👤 HR Questions</p>
              <div className="space-y-3">
                {results.mock_interview.hr_questions.map((q, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.1)" }}>
                    <div className="flex gap-3">
                      <span className="text-xs font-bold mt-0.5" style={{ color: "#a78bfa" }}>H{i + 1}</span>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{q}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COVER LETTER */}
      {tab === "cover" && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>✉ Your Cover Letter</p>
            <button className="copy-btn" onClick={() => copy(results.cover_letter)}>{copied ? "✓ Copied!" : "Copy"}</button>
          </div>
          <div className="p-5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", lineHeight: "1.8" }}>
            {results.cover_letter}
          </div>
        </div>
      )}
    </div>
  );
}