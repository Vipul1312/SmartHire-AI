import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#0a0a0f",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)",
      gap: "20px",
    }}>
      <span style={{
        fontSize: "22px", fontWeight: 800,
        background: "linear-gradient(135deg, #00ff88, #7c3aed)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>SmartHire AI</span>
      <SignUp appearance={{
        variables: {
          colorBackground: "#13131a", colorInputBackground: "#1e1e2e",
          colorInputText: "#e8e8f0", colorText: "#e8e8f0",
          colorPrimary: "#00ff88", borderRadius: "12px",
        },
        elements: {
          card: {
            background: "linear-gradient(135deg, #1a2a1f, #1e1a2e)",
            border: "1px solid rgba(0,255,136,0.3)",
            borderRadius: "20px", padding: "32px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          },
          headerTitle: { color: "#e8e8f0", fontWeight: 700 },
          headerSubtitle: { color: "rgba(255,255,255,0.4)" },
          formFieldInput: { background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e8f0", borderRadius: "10px" },
          formFieldLabel: { color: "rgba(255,255,255,0.6)" },
          formButtonPrimary: { background: "linear-gradient(135deg, #00ff88, #00cc6a)", color: "#0a0a0f", fontWeight: 700, borderRadius: "10px" },
          footerActionLink: { color: "#00ff88" },
          socialButtonsBlockButton: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e8f0", borderRadius: "10px" },
        },
      }} />
    </div>
  );
}
