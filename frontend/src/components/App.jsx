import { useState, useEffect } from "react";
import { UserButton, useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { analyzeResume, syncUser } from "../lib/api";
import InputForm from "./InputForm";
import ResultsDashboard from "./ResultsDashboard";
import LoadingScreen from "./LoadingScreen";
import ChatBot from "./ChatBot";
import ThemeToggle from "./ThemeToggle";
import Dashboard from "./Dashboard";
import MockInterview from "./MockInterview";
import ResumeBuilder from "./ResumeBuilder";
import SalaryEstimator from "./SalaryEstimator";
import InterviewRoadmap from "./InterviewRoadmap";
import LandingPage from "./LandingPage";

const TABS = [
  { id: "analyze", label: "Resume Analyzer", icon: "🎯" },
  { id: "builder", label: "Resume Builder", icon: "📝" },
  { id: "interview", label: "Mock Interview", icon: "🎤" },
  { id: "salary", label: "Salary", icon: "💰" },
  { id: "roadmap", label: "Interview Roadmap", icon: "🗺" },
  { id: "history", label: "My History", icon: "📊" },
];

export default function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState("analyze");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      syncUser(user.id, user.fullName || user.firstName || "User", user.primaryEmailAddress?.emailAddress);
    }
  }, [user]);

  const handleAnalyze = async (resumeText, jobDescription, candidateName) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await analyzeResume(resumeText, jobDescription, candidateName, user?.id, user?.primaryEmailAddress?.emailAddress);
      setResults(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  const navStyle = {
    tab: (active) => ({
      background: active ? "rgba(0,255,136,0.12)" : "transparent",
      border: active ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent",
      color: active ? "var(--accent-text)" : "var(--text-dim)",
      borderRadius: "8px",
      padding: "6px 14px",
      fontSize: "13px",
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      whiteSpace: "nowrap",
    }),
  };

  if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid var(--nav-border)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: 800 }} className="gradient-text">SmartHire AI</span>
          <span className="tag text-xs" style={{ background: "rgba(0,100,50,0.2)", color: "var(--accent-text)", border: "1px solid rgba(0,100,50,0.3)", padding: "2px 8px", borderRadius: "20px", fontSize: "11px" }}>Beta</span>
        </div>

        {/* Tab Navigation */}
        {isLoaded && isSignedIn && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResults(null); setError(null); }} style={navStyle.tab(activeTab === tab.id)}>
                <span>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle />
          {isLoaded && isSignedIn ? (
            <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
          ) : (
            <>
              <SignInButton mode="redirect">
                <button style={{ background: "transparent", border: "1px solid var(--accent-text)", color: "var(--accent-text)", borderRadius: "8px", padding: "6px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Sign In</button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)", border: "none", color: "#0a0a0f", borderRadius: "8px", padding: "6px 16px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Sign Up</button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Content */}
      {activeTab === "analyze" && (
        <>
          {!results && !loading && (
            <>
              <section className="text-center pt-14 pb-8 px-6 bg-grid relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)" }} />
                <div className="relative z-10 max-w-2xl mx-auto">
                  <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 tracking-tight">
                    Land Your <span className="gradient-text">Dream Job</span><br />With AI
                  </h1>
                  <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-dim)" }}>
                    Upload resume + job description. Get match score, ATS analysis, cover letter, salary estimate & more.
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
                    {["Match Score", "ATS Analysis", "Cover Letter", "Salary Estimate", "Interview Prep"].map((s) => (
                      <span key={s} className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--accent-text)" }}>✦ {s}</span>
                    ))}
                  </div>
                </div>
              </section>
              <InputForm onSubmit={handleAnalyze} error={error} />
            </>
          )}
          {loading && <LoadingScreen />}
          {results && <ResultsDashboard results={results} onReset={() => setResults(null)} />}
        </>
      )}

      {activeTab === "builder" && <ResumeBuilder />}
      {activeTab === "interview" && <MockInterview resumeText="" />}
            {activeTab === "salary" && <SalaryEstimator />}
      {activeTab === "history" && <Dashboard />}
      {activeTab === "roadmap" && <InterviewRoadmap />}

      <ChatBot />
    </main>
  );
}