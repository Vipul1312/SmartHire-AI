import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../lib/api";

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", text: "Hey! 👋 I'm HireBot — your AI career assistant. Ask me anything!", time: getTime() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text: text.trim(), time: getTime() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
      const data = await sendChatMessage(text.trim(), history);
      setMessages((p) => [...p, { role: "bot", text: data.reply, time: getTime() }]);
    } catch {
      setMessages((p) => [...p, { role: "bot", text: "Sorry, couldn't connect. Make sure backend is running! 🔌", time: getTime() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button onClick={() => setOpen((o) => !o)} style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 1000, width: "58px", height: "58px", borderRadius: "50%", background: open ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00ff88, #00cc6a)", border: open ? "1px solid rgba(255,255,255,0.15)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: open ? "none" : "0 4px 24px rgba(0,255,136,0.4)", transition: "all 0.3s" }}>
        {open ? <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }}>✕</span> : <span>🤖</span>}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{ position: "fixed", bottom: "100px", right: "28px", zIndex: 999, width: "360px", height: "520px", background: "#13131a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          {/* Header */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,255,136,0.04)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #00ff88, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#e8e8f0" }}>HireBot</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>AI Career Assistant · Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #00ff88, #00cc6a)" : "rgba(255,255,255,0.06)", color: msg.role === "user" ? "#0a0a0f" : "#e8e8f0", fontSize: "13px", lineHeight: "1.5", border: msg.role === "bot" ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>{msg.time}</span>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex" }}>
                <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "4px" }}>
                  {[0,1,2].map((i) => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff88", animation: "pulse-glow 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "8px", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
            <input ref={inputRef} type="text" placeholder="Ask HireBot anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(input); }} disabled={loading}
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "9px 13px", color: "#e8e8f0", fontSize: "13px", outline: "none" }} />
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              style={{ width: "36px", height: "36px", borderRadius: "10px", background: input.trim() && !loading ? "linear-gradient(135deg, #00ff88, #00cc6a)" : "rgba(255,255,255,0.05)", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
