import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      setIsDark(false);
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button onClick={toggle} style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "8px 14px", borderRadius: "10px", cursor: "pointer",
      fontSize: "13px", fontWeight: 600,
      border: `1px solid var(--border)`,
      background: "var(--card)",
      color: "var(--text)",
      transition: "all 0.2s",
    }}>
      <span>{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}