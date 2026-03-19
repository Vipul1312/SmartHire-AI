import { useState } from "react";
import { startInterview, evaluateAnswer } from "../lib/api";

export default function MockInterview({ resumeText = "" }) {
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("setup"); // setup | interview | feedback | summary
  const [listening, setListening] = useState(false);
  const [scores, setScores] = useState([]); // track all scores
  const [skipped, setSkipped] = useState([]); // track skipped questions

  const reset = () => {
    setPhase("setup"); setQuestions([]); setCurrentQ(0);
    setAnswer(""); setFeedback(""); setScores([]); setSkipped([]);
  };

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice not supported. Please use Chrome browser.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setAnswer(prev => prev + " " + e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const handleStart = async () => {
    if (!jobRole.trim()) return alert("Please enter a job role");
    setLoading(true);
    try {
      const res = await startInterview(jobRole, resumeText, difficulty);
      setQuestions(res.questions);
      setCurrentQ(0); setAnswer(""); setFeedback("");
      setScores([]); setSkipped([]);
      setPhase("interview");
    } catch (e) { alert("Failed to start. Check backend."); }
    finally { setLoading(false); }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return alert("Please write or speak your answer first");
    setLoading(true);
    try {
      const res = await evaluateAnswer(questions[currentQ], answer, jobRole);
      // Extract score from feedback text
      const scoreMatch = res.feedback.match(/(\d+)\s*\/\s*10/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
      setScores(prev => [...prev, { q: currentQ, score, skipped: false }]);
      setFeedback(res.feedback);
      setPhase("feedback");
    } catch (e) { alert("Evaluation failed."); }
    finally { setLoading(false); }
  };

  const handleSkip = () => {
    setSkipped(prev => [...prev, currentQ]);
    setScores(prev => [...prev, { q: currentQ, score: null, skipped: true }]);
    goToNext();
  };

  const handleFinish = () => {
    setPhase("summary");
  };

  const goToNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setAnswer(""); setFeedback("");
      setPhase("interview");
    } else {
      setPhase("summary");
    }
  };

  const s = {
    card: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"16px" },
    btn: { background:"linear-gradient(135deg,#00ff88,#00cc6a)", border:"none", color:"#0a0a0f", borderRadius:"10px", padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:"14px" },
    btnGhost: { background:"transparent", border:"1px solid var(--border)", color:"var(--text-dim)", borderRadius:"10px", padding:"10px 20px", fontWeight:600, cursor:"pointer", fontSize:"14px" },
    btnDanger: { background:"rgba(255,100,100,0.1)", border:"1px solid rgba(255,100,100,0.3)", color:"#ff6b6b", borderRadius:"10px", padding:"10px 20px", fontWeight:600, cursor:"pointer", fontSize:"14px" },
    input: { width:"100%", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:"10px", padding:"10px 14px", color:"var(--text)", fontSize:"14px", boxSizing:"border-box" },
  };

  // Progress bar
  const Progress = () => (
    <div style={{ marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:"var(--text-dim)", marginBottom:"8px" }}>
        <span>Question {currentQ + 1} of {questions.length}</span>
        <span style={{ color:"var(--accent-text)", fontWeight:600 }}>{jobRole}</span>
      </div>
      <div style={{ height:"4px", background:"var(--border)", borderRadius:"4px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${((currentQ + 1) / questions.length) * 100}%`, background:"linear-gradient(90deg,#00ff88,#00cc6a)", borderRadius:"4px", transition:"width 0.3s" }} />
      </div>
      {/* Question dots */}
      <div style={{ display:"flex", gap:"6px", marginTop:"8px", justifyContent:"center" }}>
        {questions.map((_, i) => {
          const s = scores.find(s => s.q === i);
          const color = i === currentQ ? "#00ff88" : s?.skipped ? "#ffd700" : s ? "#00ff88" : "var(--border)";
          return <div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", background:color, transition:"background 0.3s" }} />;
        })}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:"800px", margin:"0 auto", padding:"32px 16px" }}>
      <h2 style={{ fontSize:"24px", fontWeight:700, marginBottom:"8px", color:"var(--text)" }}>🎤 Mock Interview</h2>
      <p style={{ color:"var(--text-dim)", marginBottom:"24px", fontSize:"14px" }}>Practice with AI questions and get instant feedback</p>

      {/* SETUP */}
      {phase === "setup" && (
        <div style={s.card}>
          <div style={{ marginBottom:"16px" }}>
            <label style={{ display:"block", marginBottom:"6px", fontSize:"13px", color:"var(--text-dim)" }}>Job Role *</label>
            <input style={s.input} placeholder="e.g. Frontend Developer, Data Scientist..." value={jobRole} onChange={e => setJobRole(e.target.value)} onKeyDown={e => e.key==="Enter" && handleStart()} />
          </div>
          <div style={{ marginBottom:"20px" }}>
            <label style={{ display:"block", marginBottom:"8px", fontSize:"13px", color:"var(--text-dim)" }}>Difficulty</label>
            <div style={{ display:"flex", gap:"10px" }}>
              {["easy","medium","hard"].map(d => (
                <button key={d} onClick={() => setDifficulty(d)} style={{ ...s.btn, flex:1, background: difficulty===d ? "linear-gradient(135deg,#00ff88,#00cc6a)" : "transparent", color: difficulty===d ? "#0a0a0f" : "var(--text-dim)", border:"1px solid var(--border)" }}>
                  {d==="easy"?"😊 Easy":d==="medium"?"💼 Medium":"🔥 Hard"}
                </button>
              ))}
            </div>
          </div>
          <button style={{ ...s.btn, width:"100%", padding:"13px" }} onClick={handleStart} disabled={loading}>
            {loading ? "Generating questions..." : "🚀 Start Interview"}
          </button>
        </div>
      )}

      {/* INTERVIEW */}
      {phase === "interview" && questions.length > 0 && (
        <div>
          <Progress />

          {/* Question */}
          <div style={{ ...s.card, borderColor:"rgba(0,255,136,0.3)" }}>
            <div style={{ fontSize:"12px", color:"var(--text-dim)", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>
              {skipped.includes(currentQ) ? "⏭ Skipped — Answer Now" : "Question"}
            </div>
            <p style={{ fontSize:"17px", fontWeight:600, color:"var(--text)", lineHeight:1.6 }}>{questions[currentQ]}</p>
          </div>

          {/* Answer */}
          <div style={s.card}>
            <label style={{ display:"block", marginBottom:"8px", fontSize:"13px", color:"var(--text-dim)" }}>Your Answer</label>
            <textarea style={{ ...s.input, minHeight:"120px", resize:"vertical" }}
              placeholder="Type your answer here..." value={answer} onChange={e => setAnswer(e.target.value)} />

            {/* Action Buttons */}
            <div style={{ display:"flex", gap:"10px", marginTop:"16px", flexWrap:"wrap" }}>
              <button style={s.btn} onClick={handleSubmitAnswer} disabled={loading}>
                {loading ? "Evaluating..." : "✓ Submit Answer"}
              </button>
              <button onClick={startVoice} disabled={listening} style={{ ...s.btn, background: listening ? "#ff6b6b" : "rgba(0,255,136,0.1)", color: listening ? "#fff" : "var(--accent-text)", border:"1px solid var(--accent-text)" }}>
                {listening ? "🎤 Listening..." : "🎤 Voice Input"}
              </button>
              <button style={s.btnGhost} onClick={handleSkip}>
                ⏭ Skip Question
              </button>
              <button style={s.btnDanger} onClick={handleFinish}>
                🏁 Finish Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK */}
      {phase === "feedback" && (
        <div>
          <Progress />
          <div style={{ ...s.card, borderColor:"rgba(0,255,136,0.3)" }}>
            <h3 style={{ fontSize:"15px", fontWeight:700, marginBottom:"12px", color:"var(--accent-text)" }}>🤖 AI Feedback</h3>
            <pre style={{ whiteSpace:"pre-wrap", fontSize:"14px", color:"var(--text)", lineHeight:1.7, fontFamily:"inherit" }}>{feedback}</pre>
          </div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <button style={s.btn} onClick={goToNext}>
              {currentQ < questions.length - 1 ? `Next Question →` : "See Summary →"}
            </button>
            <button style={s.btnDanger} onClick={handleFinish}>
              🏁 Finish Interview
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === "summary" && (
        <div>
          <div style={{ ...s.card, borderColor:"rgba(0,255,136,0.4)", textAlign:"center" }}>
            <div style={{ fontSize:"32px", marginBottom:"8px" }}>🎉</div>
            <h3 style={{ fontSize:"20px", fontWeight:800, color:"var(--text)", marginBottom:"4px" }}>Interview Complete!</h3>
            <p style={{ color:"var(--text-dim)", fontSize:"14px" }}>{jobRole} — {difficulty} difficulty</p>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"16px" }}>
            {[
              ["Attempted", scores.filter(s=>!s.skipped).length],
              ["Skipped", scores.filter(s=>s.skipped).length],
              ["Avg Score", (() => { const sc = scores.filter(s=>!s.skipped && s.score!==null).map(s=>s.score); return sc.length ? (sc.reduce((a,b)=>a+b,0)/sc.length).toFixed(1)+"/10" : "N/A"; })()],
            ].map(([l,v]) => (
              <div key={l} style={{ ...s.card, textAlign:"center", padding:"16px", marginBottom:0 }}>
                <div style={{ fontSize:"24px", fontWeight:800, color:"var(--accent-text)" }}>{v}</div>
                <div style={{ fontSize:"12px", color:"var(--text-dim)", marginTop:"4px" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Question Summary */}
          <div style={s.card}>
            <h3 style={{ fontSize:"15px", fontWeight:700, marginBottom:"16px", color:"var(--text)" }}>Question Summary</h3>
            {questions.map((q, i) => {
              const sc = scores.find(s => s.q === i);
              return (
                <div key={i} style={{ display:"flex", gap:"12px", alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"50%", background: sc?.skipped ? "rgba(255,210,0,0.15)" : sc ? "rgba(0,255,136,0.15)" : "var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0 }}>
                    {sc?.skipped ? "⏭" : sc ? "✓" : "○"}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:"13px", color:"var(--text)", marginBottom:"2px" }}>{q}</p>
                    <p style={{ fontSize:"12px", color: sc?.skipped ? "#ffd700" : sc?.score ? "var(--accent-text)" : "var(--text-dim)" }}>
                      {sc?.skipped ? "Skipped" : sc?.score ? `Score: ${sc.score}/10` : "Not attempted"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button style={{ ...s.btn, width:"100%", padding:"13px" }} onClick={reset}>
            🔄 Start New Interview
          </button>
        </div>
      )}
    </div>
  );
}