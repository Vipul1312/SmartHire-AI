import { useState, useEffect } from "react";

const steps = [
  { icon: "◎", text: "Parsing your resume with NLP..." },
  { icon: "◈", text: "Extracting keywords and skills..." },
  { icon: "∿", text: "Computing semantic similarity..." },
  { icon: "✦", text: "Calculating match score..." },
  { icon: "◐", text: "Generating improvement suggestions..." },
  { icon: "✉", text: "Writing your cover letter..." },
  { icon: "◑", text: "Preparing interview questions..." },
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((p) => p < steps.length - 1 ? p + 1 : p), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="relative mb-12">
        <div className="w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,255,136,0.3), transparent)", animation: "pulse-glow 2s ease-in-out infinite" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl" style={{ color: "var(--accent)" }}>{steps[step].icon}</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Analyzing Your Resume</h2>
      <p className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.35)" }}>AI is working on your results. This takes ~15 seconds.</p>
      <div className="w-full max-w-sm space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 transition-all duration-500"
            style={{ opacity: i <= step ? 1 : 0.2, transform: i === step ? "translateX(6px)" : "translateX(0)" }}>
            <span className="text-sm w-5 text-center" style={{ color: i < step ? "#00ff88" : i === step ? "var(--accent)" : "rgba(255,255,255,0.2)" }}>
              {i < step ? "✓" : s.icon}
            </span>
            <span className="text-sm" style={{ color: i <= step ? (i < step ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)") : "rgba(255,255,255,0.15)" }}>
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
