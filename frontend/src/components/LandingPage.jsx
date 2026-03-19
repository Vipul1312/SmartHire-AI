import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

const FEATURES = [
  { icon: "🎯", title: "Resume Analyzer", desc: "AI-powered match score, ATS analysis & keyword optimization", color: "var(--accent-text)" },
  { icon: "📝", title: "Resume Builder", desc: "Build ATS-optimized resumes with smart templates", color: "#00ccff" },
  { icon: "🎤", title: "Mock Interview", desc: "Practice with AI questions & get instant feedback", color: "#ff9900" },
  { icon: "🗺", title: "Interview Roadmap", desc: "Personalized prep plan for any company & role", color: "#b400ff" },
  { icon: "💰", title: "Salary Estimator", desc: "Year-wise salary data for Indian job market", color: "#ff6b6b" },
  { icon: "📊", title: "Progress Dashboard", desc: "Track your improvement across all analyses", color: "#ffd700" },
];

const STATS = [
  { value: "93%", label: "Average Match Score Improvement" },
  { value: "6+", label: "AI-Powered Features" },
  { value: "10s", label: "Analysis Time" },
  { value: "Free", label: "To Get Started" },
];

const STEPS = [
  { num: "01", title: "Upload Your Resume", desc: "Upload PDF or paste your resume text" },
  { num: "02", title: "Add Job Description", desc: "Paste the JD you want to apply for" },
  { num: "03", title: "Get AI Analysis", desc: "Receive match score, improvements & cover letter" },
  { num: "04", title: "Land the Interview", desc: "Use roadmap & mock interview to prepare" },
];

export default function LandingPage({ onGetStarted }) {
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "sans-serif", overflowX: "hidden", minHeight: "100vh" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "var(--card)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s",
      }}>
        <span style={{ fontSize: "20px", fontWeight: 800, background: "linear-gradient(135deg, var(--accent-text), #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SmartHire AI
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <ThemeToggle />
          {isSignedIn ? (
            <button onClick={onGetStarted} style={{ background: "linear-gradient(135deg,#00aa55,#008844)", border: "none", color: "#0a0a0f", borderRadius: "10px", padding: "9px 22px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <SignInButton mode="redirect">
                <button style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "10px", padding: "8px 20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button style={{ background: "linear-gradient(135deg,#00aa55,#008844)", border: "none", color: "#0a0a0f", borderRadius: "10px", padding: "9px 22px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                  Get Started Free
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(0,255,136,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "20%", width: "400px", height: "400px", background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "100px", padding: "6px 16px", marginBottom: "28px", fontSize: "13px", color: "var(--accent-text)", fontWeight: 600 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00aa55", display: "inline-block", animation: "pulse 2s infinite" }} />
          AI-Powered Career Platform
        </div>

        <h1 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-0.03em", maxWidth: "900px" }}>
          Land Your{" "}
          <span style={{ background: "linear-gradient(135deg, var(--accent-text) 0%, #7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Dream Job
          </span>
          <br />With AI
        </h1>

        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text)", maxWidth: "600px", lineHeight: 1.7, marginBottom: "40px" }}>
          Upload your resume, get instant AI analysis, build a perfect resume,
          practice interviews & get company-specific prep roadmaps — all in one place.
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "64px" }}>
          {isSignedIn ? (
            <button onClick={onGetStarted} style={{ background: "linear-gradient(135deg,#00aa55,#008844)", border: "none", color: "#0a0a0f", borderRadius: "14px", padding: "16px 36px", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 8px 32px rgba(0,255,136,0.3)" }}>
              Analyze My Resume →
            </button>
          ) : (
            <>
              <SignUpButton mode="redirect">
                <button style={{ background: "linear-gradient(135deg,#00aa55,#008844)", border: "none", color: "#0a0a0f", borderRadius: "14px", padding: "16px 36px", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 8px 32px rgba(0,255,136,0.3)" }}>
                  Get Started Free →
                </button>
              </SignUpButton>
              <SignInButton mode="redirect">
                <button style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "14px", padding: "16px 36px", fontWeight: 600, fontSize: "16px", cursor: "pointer" }}>
                  Sign In
                </button>
              </SignInButton>
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap", justifyContent: "center" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--accent-text)" }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "var(--text)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.02em" }}>
            Everything You Need to{" "}
            <span style={{ background: "linear-gradient(135deg, var(--accent-text), #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Get Hired
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text)", maxWidth: "500px", margin: "0 auto" }}>
            6 powerful AI tools working together to maximize your chances
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + "44"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${f.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: `radial-gradient(ellipse, ${f.color}12 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>{f.desc}</p>
              <div style={{ marginTop: "16px", fontSize: "13px", color: f.color, fontWeight: 600, opacity: 0.9 }}>Explore →</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "80px 24px", background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.02em" }}>
              How It Works
            </h2>
            <p style={{ fontSize: "16px", color: "var(--text)" }}>Get results in under 60 seconds</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ textAlign: "center", padding: "24px 16px", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: "32px", right: "-12px", width: "24px", height: "2px", background: "rgba(0,255,136,0.2)", display: "none" }} />
                )}
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "18px", fontWeight: 900, color: "var(--accent-text)", fontFamily: "monospace" }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>{step.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, marginBottom: "20px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Ready to Land Your{" "}
            <span style={{ background: "linear-gradient(135deg, var(--accent-text), #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dream Job?
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text)", marginBottom: "36px", lineHeight: 1.7 }}>
            Join thousands of job seekers using SmartHire AI to get more interviews and better offers.
          </p>
          {isSignedIn ? (
            <button onClick={onGetStarted} style={{ background: "linear-gradient(135deg,#00aa55,#008844)", border: "none", color: "#0a0a0f", borderRadius: "14px", padding: "18px 48px", fontWeight: 800, fontSize: "18px", cursor: "pointer", boxShadow: "0 8px 32px rgba(0,255,136,0.3)" }}>
              Go to Dashboard →
            </button>
          ) : (
            <SignUpButton mode="redirect">
              <button style={{ background: "linear-gradient(135deg,#00aa55,#008844)", border: "none", color: "#0a0a0f", borderRadius: "14px", padding: "18px 48px", fontWeight: 800, fontSize: "18px", cursor: "pointer", boxShadow: "0 8px 32px rgba(0,255,136,0.3)" }}>
                Start Free — No Credit Card →
              </button>
            </SignUpButton>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <span style={{ fontWeight: 700, background: "linear-gradient(135deg, var(--accent-text), #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SmartHire AI</span>
        <span style={{ fontSize: "13px", color: "var(--text)" }}>Built with ❤️ for job seekers</span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}