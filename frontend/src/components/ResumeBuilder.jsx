import { useState } from "react";
import { buildResume } from "../lib/api";

// ── Templates config ─────────────────────────────────────────────────────────
// Each template defines: which sections to show, their order, hints, and focus areas
const TEMPLATES = [
  {
    id: "fresher",
    label: "🎓 Fresher / Student",
    desc: "No work experience? Start here",
    color: "rgba(0,200,255,0.15)",
    border: "rgba(0,200,255,0.4)",
    highlight: "#00c8ff",
    sections: ["contact","summary","education","skills","projects","certifications"],
    hints: {
      summary: "Focus on your passion, relevant coursework, and what you want to achieve",
      education: "Include CGPA, relevant subjects, achievements",
      skills: "List all technical skills you know even from self-learning",
      projects: "Academic and personal projects are very important here",
      certifications: "Online courses, bootcamps, hackathons all count",
      experience: "Add internships if any",
    },
    tips: [
      "🎯 Projects matter most for freshers — add at least 2-3",
      "📚 Mention relevant coursework if you lack projects",
      "🏆 Include hackathons, competitions, open source contributions",
      "📜 Certifications from Coursera, Udemy etc. add value",
    ],
    placeholders: {
      education: "e.g. B.Tech Computer Science | Delhi University | 2020-2024 | CGPA: 8.5",
      projects: "e.g. Chat App | React, Node.js, Socket.io | Real-time messaging app with 50+ users",
      certifications: "e.g. Full Stack Web Dev | Udemy | 2023",
      experience: "e.g. Web Dev Intern | StartupXYZ | May-Jul 2023 | Built landing pages, improved load time by 30%",
    }
  },
  {
    id: "experienced",
    label: "💼 Experienced (2-7 yrs)",
    desc: "Mid-level professional",
    color: "rgba(0,255,136,0.1)",
    border: "rgba(0,255,136,0.4)",
    highlight: "#00ff88",
    sections: ["contact","summary","experience","skills","projects","education","certifications"],
    hints: {
      summary: "Highlight years of experience, key achievements, and your specialization",
      experience: "Focus on impact — use numbers like 'increased performance by 40%'",
      skills: "List both technical and soft skills relevant to your role",
      projects: "Include significant work projects or side projects",
      education: "Keep it brief — just degree, college, year",
      certifications: "Industry certifications carry more weight at this level",
    },
    tips: [
      "📈 Use numbers in experience — '40% faster', '10k users', '$2M revenue'",
      "💡 Lead with your strongest achievement in summary",
      "🏢 Experience section is most important here",
      "⚡ Keep education brief — just degree and college",
    ],
    placeholders: {
      experience: "e.g. Senior Developer | Google | Jan 2022-Present | Led team of 5, shipped 3 major features, reduced API latency by 45%",
      projects: "e.g. Microservices Migration | Docker, Kubernetes | Migrated monolith to microservices, reducing deployment time by 60%",
      education: "e.g. B.Tech CSE | IIT Bombay | 2016-2020",
      certifications: "e.g. AWS Solutions Architect | Amazon | 2022",
    }
  },
  {
    id: "data",
    label: "📊 Data Science / ML",
    desc: "AI, ML, Data roles",
    color: "rgba(180,0,255,0.1)",
    border: "rgba(180,0,255,0.4)",
    highlight: "#b400ff",
    sections: ["contact","summary","skills","experience","projects","education","certifications"],
    hints: {
      summary: "Mention your ML expertise, tools, and business impact of your models",
      skills: "List ML frameworks, languages, tools, cloud platforms separately",
      experience: "Mention model accuracy, dataset sizes, business metrics improved",
      projects: "Include Kaggle competitions, research papers, open source ML work",
      education: "M.Tech/PhD in relevant field adds value — mention thesis if applicable",
      certifications: "deeplearning.ai, Coursera ML, Google certifications are valued",
    },
    tips: [
      "🤖 Always mention model accuracy and dataset size",
      "📊 Business impact matters — 'increased sales by 15% using recommendation model'",
      "🔬 Include Kaggle rankings or competition results",
      "📝 Research papers or publications are a big plus",
    ],
    placeholders: {
      skills: "e.g. Python, TensorFlow, PyTorch, Scikit-learn, Pandas, SQL, AWS SageMaker",
      experience: "e.g. ML Engineer | Amazon | 2022-Present | Built recommendation engine, 89% accuracy, increased CTR by 22%",
      projects: "e.g. Sentiment Analysis | BERT, Python, FastAPI | Processed 1M+ reviews, 94% accuracy, deployed as API",
      education: "e.g. M.Tech Data Science | IIT Hyderabad | 2020-2022 | CGPA: 9.1 | Thesis: NLP for Medical Records",
      certifications: "e.g. Deep Learning Specialization | deeplearning.ai (Coursera) | 2022",
    }
  },
  {
    id: "blank",
    label: "✏️ Start Fresh",
    desc: "Build from scratch",
    color: "rgba(255,200,0,0.08)",
    border: "rgba(255,200,0,0.3)",
    highlight: "#ffd700",
    sections: ["contact","summary","experience","education","skills","projects","certifications"],
    hints: {},
    tips: ["Fill in all sections for best results"],
    placeholders: {}
  }
];

const EMPTY = { name:"", email:"", phone:"", location:"", linkedin:"", github:"", summary:"", skills:[], experience:[], education:[], projects:[], certifications:[] };

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  card: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"16px" },
  input: { width:"100%", background:"var(--input-bg)", border:"1px solid var(--input-border)", borderRadius:"10px", padding:"10px 14px", color:"var(--input-text)", fontSize:"14px", boxSizing:"border-box" },
  label: { display:"block", marginBottom:"6px", fontSize:"13px", color:"var(--text-dim)", fontWeight:500 },
  btn: { background:"linear-gradient(135deg,#00ff88,#00cc6a)", border:"none", color:"#0a0a0f", borderRadius:"10px", padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:"14px" },
  btnGhost: { background:"transparent", border:"1px solid var(--border)", color:"var(--text-dim)", borderRadius:"10px", padding:"10px 20px", fontWeight:600, cursor:"pointer", fontSize:"14px" },
  sectionTitle: { fontSize:"15px", fontWeight:700, color:"var(--text)", marginBottom:"16px", display:"flex", alignItems:"center", gap:"8px" },
  addBtn: { background:"rgba(0,255,136,0.08)", border:"1px dashed rgba(0,255,136,0.4)", color:"var(--accent-text)", borderRadius:"10px", padding:"8px 16px", fontWeight:600, cursor:"pointer", fontSize:"13px", width:"100%" },
  removeBtn: { background:"rgba(255,100,100,0.08)", border:"1px solid rgba(255,100,100,0.2)", color:"#ff6b6b", borderRadius:"8px", padding:"8px 12px", cursor:"pointer", fontSize:"13px", flexShrink:0 },
};

export default function ResumeBuilder() {
  const [step, setStep] = useState("template"); // template | form | preview
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [skillInput, setSkillInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("contact");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const sk = skillInput.trim();
    if (sk && !form.skills.includes(sk)) { set("skills", [...form.skills, sk]); setSkillInput(""); }
  };

  const addItem = (section) => set(section, [...form[section], ""]);
  const updateItem = (section, i, v) => { const arr = [...form[section]]; arr[i] = v; set(section, arr); };
  const removeItem = (section, i) => set(section, form[section].filter((_, idx) => idx !== i));
  const moveItem = (section, i, dir) => {
    const arr = [...form[section]];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set(section, arr);
  };

  const handleBuild = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setActiveSection("contact");
      return alert("Please fill Name, Email and Phone");
    }
    setLoading(true);
    try {
      const res = await buildResume(form);
      setResult(res);
      setStep("preview");
    } catch (e) { alert("Failed: " + e.message); }
    finally { setLoading(false); }
  };

  const copyResume = () => {
    if (!result) return;
    const { contact, summary, skills, experience, education, projects, certifications } = result.resume_sections;
    let text = `${contact.name}\n`;
    text += [contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean).join(" | ");
    text += `\n\nPROFESSIONAL SUMMARY\n${summary}`;
    if (skills?.length) text += `\n\nSKILLS\n${skills.join(", ")}`;
    if (experience?.length) text += `\n\nWORK EXPERIENCE\n${experience.map(e => `• ${e}`).join("\n")}`;
    if (education?.length) text += `\n\nEDUCATION\n${education.map(e => `• ${e}`).join("\n")}`;
    if (projects?.length) text += `\n\nPROJECTS\n${projects.map(p => `• ${p}`).join("\n")}`;
    if (certifications?.length) text += `\n\nCERTIFICATIONS\n${certifications.map(c => `• ${c}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── SECTIONS CONFIG ────────────────────────────────────────────────────────
  const SECTIONS = [
    { id:"contact", label:"👤 Contact Info" },
    { id:"summary", label:"📝 Summary" },
    { id:"skills", label:"🛠 Skills" },
    { id:"experience", label:"💼 Experience" },
    { id:"education", label:"🎓 Education" },
    { id:"projects", label:"🚀 Projects" },
    { id:"certifications", label:"📜 Certifications" },
  ];

  const PLACEHOLDERS = {
    experience: "e.g. Software Engineer | Google | Jan 2022 - Present | Built scalable APIs handling 1M+ requests/day",
    education: "e.g. B.Tech Computer Science | IIT Delhi | 2018-2022 | CGPA: 8.5",
    projects: "e.g. E-Commerce App | React, Node.js, MongoDB | Built full-stack platform with 500+ active users",
    certifications: "e.g. AWS Cloud Practitioner | Amazon Web Services | 2023",
  };

  // ── STEP 1: Template Selection ────────────────────────────────────────────
  if (step === "template") return (
    <div style={{ maxWidth:"860px", margin:"0 auto", padding:"32px 16px" }}>
      <h2 style={{ fontSize:"24px", fontWeight:700, marginBottom:"8px", color:"var(--text)" }}>📝 Resume Builder</h2>
      <p style={{ color:"var(--text-dim)", marginBottom:"28px", fontSize:"14px" }}>Choose a template to start, or begin from scratch</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"16px" }}>
        {TEMPLATES.map(t => (
          <div key={t.id} onClick={() => {
              setForm({...EMPTY});
              setSelectedTemplate(t);
              setActiveSection(t.sections[0]);
              setStep("form");
            }}
            style={{ ...S.card, cursor:"pointer", transition:"all 0.2s", marginBottom:0, borderColor: t.border, background: t.color }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${t.border}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ fontSize:"32px", marginBottom:"10px" }}>{t.label.split(" ")[0]}</div>
            <div style={{ fontWeight:700, color:"var(--text)", marginBottom:"6px", fontSize:"15px" }}>{t.label.split(" ").slice(1).join(" ")}</div>
            <div style={{ fontSize:"13px", color:"var(--text-dim)", marginBottom:"14px" }}>{t.desc}</div>
            {/* Sections preview */}
            <div style={{ marginBottom:"14px" }}>
              <div style={{ fontSize:"11px", color:"var(--text-dim)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Sections included:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                {t.sections.map(sec => (
                  <span key={sec} style={{ fontSize:"11px", background:"rgba(255,255,255,0.06)", borderRadius:"4px", padding:"2px 7px", color:t.highlight }}>
                    {sec}
                  </span>
                ))}
              </div>
            </div>
            {/* Tips preview */}
            {t.tips?.length > 0 && t.id !== "blank" && (
              <div style={{ fontSize:"11px", color:"var(--text-dim)" }}>{t.tips[0]}</div>
            )}
            <div style={{ marginTop:"14px", fontSize:"13px", color:t.highlight, fontWeight:700 }}>Use this template →</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── STEP 2: Form ──────────────────────────────────────────────────────────
  if (step === "form") return (
    <div style={{ maxWidth:"860px", margin:"0 auto", padding:"32px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontSize:"22px", fontWeight:700, color:"var(--text)", marginBottom:"4px" }}>
            {selectedTemplate?.label || "📝"} Resume
          </h2>
          <p style={{ color:"var(--text-dim)", fontSize:"13px" }}>Fill in your details — AI will enhance your summary automatically</p>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button style={S.btnGhost} onClick={() => setStep("template")}>← Templates</button>
          <button style={S.btn} onClick={handleBuild} disabled={loading}>
            {loading ? "Building..." : "✨ Build Resume"}
          </button>
        </div>
      </div>

      {/* Template Tips */}
      {selectedTemplate?.tips?.length > 0 && selectedTemplate.id !== "blank" && (
        <div style={{ background: selectedTemplate.color, border:`1px solid ${selectedTemplate.border}`, borderRadius:"12px", padding:"14px 18px", marginBottom:"16px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color: selectedTemplate.highlight, marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            Tips for {selectedTemplate.label}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            {selectedTemplate.tips.map((tip, i) => (
              <div key={i} style={{ fontSize:"13px", color:"var(--text-dim)" }}>{tip}</div>
            ))}
          </div>
        </div>
      )}

      {/* Section Tabs — show only template sections */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"20px" }}>
        {(selectedTemplate ? SECTIONS.filter(s => selectedTemplate.sections.includes(s.id)) : SECTIONS).map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            style={{ ...S.btnGhost, padding:"6px 14px", fontSize:"13px",
              background: activeSection===sec.id ? (selectedTemplate ? selectedTemplate.color : "rgba(0,255,136,0.1)") : "transparent",
              color: activeSection===sec.id ? (selectedTemplate?.highlight || "var(--accent-text)") : "var(--text-dim)",
              border: activeSection===sec.id ? `1px solid ${selectedTemplate?.border || "rgba(0,255,136,0.4)"}` : "1px solid var(--border)" }}>
            {sec.label}
          </button>
        ))}
      </div>

      {/* CONTACT */}
      {activeSection === "contact" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>👤 Contact Information</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            {[
              ["name","Full Name *","e.g. Rahul Sharma"],
              ["email","Email Address *","e.g. rahul@gmail.com"],
              ["phone","Phone Number *","e.g. +91-9876543210"],
              ["location","Location","e.g. Delhi, India"],
              ["linkedin","LinkedIn URL","e.g. linkedin.com/in/rahul"],
              ["github","GitHub URL","e.g. github.com/rahul"],
            ].map(([k, l, ph]) => (
              <div key={k}>
                <label style={S.label}>{l}</label>
                <input style={S.input} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:"16px", display:"flex", justifyContent:"flex-end" }}>
            <button style={S.btn} onClick={() => setActiveSection("summary")}>Next: Summary →</button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {activeSection === "summary" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>📝 Professional Summary</div>
          <label style={S.label}>Write your summary (leave blank for AI to generate automatically)</label>
          <textarea style={{ ...S.input, minHeight:"100px", resize:"vertical" }}
            value={form.summary} onChange={e => set("summary", e.target.value)}
            placeholder="e.g. Passionate Full Stack Developer with 2 years of experience building scalable web applications. Strong in React and Node.js..." />
          <p style={{ fontSize:"12px", color:"var(--text-dim)", marginTop:"8px" }}>
            💡 {selectedTemplate?.hints?.summary || "AI will automatically improve your summary. You can also leave it blank."}
          </p>
          <div style={{ marginTop:"16px", display:"flex", justifyContent:"space-between" }}>
            <button style={S.btnGhost} onClick={() => setActiveSection("contact")}>← Back</button>
            <button style={S.btn} onClick={() => setActiveSection("skills")}>Next: Skills →</button>
          </div>
        </div>
      )}

      {/* SKILLS */}
      {activeSection === "skills" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>🛠 Skills</div>
          <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
            <input style={{ ...S.input, flex:1 }} value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && addSkill()}
              placeholder="Type a skill and press Enter or click Add" />
            <button style={S.btn} onClick={addSkill}>Add</button>
          </div>
          {form.skills.length > 0 ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"12px" }}>
              {form.skills.map((sk, i) => (
                <span key={i} onClick={() => set("skills", form.skills.filter((_,idx) => idx!==i))}
                  style={{ background:"rgba(0,255,136,0.1)", border:"1px solid rgba(0,255,136,0.3)", color:"var(--accent-text)", borderRadius:"20px", padding:"5px 14px", fontSize:"13px", cursor:"pointer", userSelect:"none" }}
                  title="Click to remove">
                  {sk} ✕
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color:"var(--text-dim)", fontSize:"13px", marginBottom:"12px" }}>No skills added yet. Type above and press Enter.</p>
          )}
          <p style={{ fontSize:"12px", color:"var(--text-dim)" }}>💡 Click on a skill tag to remove it</p>
          <div style={{ marginTop:"16px", display:"flex", justifyContent:"space-between" }}>
            <button style={S.btnGhost} onClick={() => setActiveSection("summary")}>← Back</button>
            <button style={S.btn} onClick={() => setActiveSection("experience")}>Next: Experience →</button>
          </div>
        </div>
      )}

      {/* DYNAMIC SECTIONS: experience, education, projects, certifications */}
      {["experience","education","projects","certifications"].map(section => (
        activeSection === section && (
          <div key={section} style={S.card}>
            <div style={S.sectionTitle}>
              {section==="experience"?"💼 Work Experience":section==="education"?"🎓 Education":section==="projects"?"🚀 Projects":"📜 Certifications"}
              <span style={{ fontSize:"12px", color:"var(--text-dim)", fontWeight:400 }}>({form[section].length} added)</span>
            </div>

            {form[section].length === 0 && (
              <div style={{ textAlign:"center", padding:"24px", color:"var(--text-dim)", fontSize:"14px" }}>
                No entries yet. Click "+ Add" to start.
              </div>
            )}

            {form[section].map((item, i) => (
              <div key={i} style={{ marginBottom:"12px", background:"rgba(0,0,0,0.15)", borderRadius:"12px", padding:"14px", border:"1px solid var(--border)" }}>
                <div style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"11px", color:"var(--text-dim)", marginBottom:"6px", fontWeight:600 }}>Entry #{i+1}</div>
                    <textarea style={{ ...S.input, minHeight:"60px", resize:"vertical" }}
                      value={item} onChange={e => updateItem(section, i, e.target.value)}
                      placeholder={selectedTemplate?.placeholders?.[section] || PLACEHOLDERS[section]} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    <button onClick={() => moveItem(section, i, -1)} disabled={i===0} style={{ ...S.btnGhost, padding:"6px 10px", fontSize:"12px", opacity: i===0 ? 0.4 : 1 }}>↑</button>
                    <button onClick={() => moveItem(section, i, 1)} disabled={i===form[section].length-1} style={{ ...S.btnGhost, padding:"6px 10px", fontSize:"12px", opacity: i===form[section].length-1 ? 0.4 : 1 }}>↓</button>
                    <button onClick={() => removeItem(section, i)} style={S.removeBtn}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            <button style={S.addBtn} onClick={() => addItem(section)}>
              + Add {section==="experience"?"Experience":section==="education"?"Education":section==="projects"?"Project":"Certification"}
            </button>

            <p style={{ fontSize:"12px", color:"var(--text-dim)", marginTop:"10px" }}>
              💡 {selectedTemplate?.hints?.[section] || "Format: Role | Company | Duration | Key achievement with numbers"}
            </p>

            <div style={{ marginTop:"16px", display:"flex", justifyContent:"space-between" }}>
              <button style={S.btnGhost} onClick={() => setActiveSection(
                section==="experience"?"skills":section==="education"?"experience":section==="projects"?"education":"projects"
              )}>← Back</button>
              {section !== "certifications" ? (
                <button style={S.btn} onClick={() => setActiveSection(
                  section==="experience"?"education":section==="education"?"projects":"certifications"
                )}>Next →</button>
              ) : (
                <button style={S.btn} onClick={handleBuild} disabled={loading}>
                  {loading ? "Building..." : "✨ Build Resume"}
                </button>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  );

  // ── STEP 3: Preview ───────────────────────────────────────────────────────
  if (step === "preview" && result) {
    const { contact, summary, skills, experience, education, projects, certifications } = result.resume_sections;
    return (
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"32px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h2 style={{ fontSize:"22px", fontWeight:700, color:"var(--text)", marginBottom:"4px" }}>✅ Your Resume is Ready!</h2>
            <p style={{ color:"var(--text-dim)", fontSize:"13px" }}>AI has enhanced your summary. Copy and paste into Word/Google Docs.</p>
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <button style={S.btnGhost} onClick={() => setStep("form")}>✏ Edit</button>
            <button style={S.btnGhost} onClick={() => setStep("template")}>🔄 New Resume</button>
            <button style={S.btn} onClick={copyResume}>{copied ? "✓ Copied!" : "📋 Copy Resume"}</button>
          </div>
        </div>

        {/* ATS Score */}
        <div style={{ ...S.card, borderColor:"rgba(0,255,136,0.4)", display:"flex", alignItems:"center", gap:"24px", flexWrap:"wrap" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"42px", fontWeight:900, color:"var(--accent-text)" }}>{result.ats_preview_score}%</div>
            <div style={{ fontSize:"12px", color:"var(--text-dim)" }}>ATS Score</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, color:"var(--text)", marginBottom:"8px", fontSize:"14px" }}>Tips to improve ATS score:</div>
            {result.ats_tips?.length > 0
              ? result.ats_tips.map((t, i) => <p key={i} style={{ fontSize:"13px", color:"var(--text-dim)", marginBottom:"4px" }}>• {t}</p>)
              : <p style={{ fontSize:"13px", color:"#00ff88" }}>✓ Your resume looks great!</p>}
          </div>
        </div>

        {/* Resume Preview */}
        <div style={{ ...S.card, fontFamily:"'Georgia', serif" }}>
          {/* Header */}
          <div style={{ borderBottom:"2px solid var(--accent-text)", paddingBottom:"16px", marginBottom:"20px" }}>
            <h1 style={{ fontSize:"26px", fontWeight:800, color:"var(--text)", margin:0 }}>{contact.name}</h1>
            <p style={{ fontSize:"13px", color:"var(--text-dim)", marginTop:"6px" }}>
              {[contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean).join("  |  ")}
            </p>
          </div>

          {/* Summary */}
          {summary && (
            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--accent-text)", marginBottom:"8px" }}>Professional Summary</div>
              <p style={{ fontSize:"14px", color:"var(--text)", lineHeight:1.7 }}>{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills?.length > 0 && (
            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--accent-text)", marginBottom:"8px" }}>Skills</div>
              <p style={{ fontSize:"14px", color:"var(--text)", lineHeight:1.7 }}>{skills.join("  •  ")}</p>
            </div>
          )}

          {/* Dynamic Sections */}
          {[["Work Experience", experience],["Education", education],["Projects", projects],["Certifications", certifications]].map(([title, items]) =>
            items?.length > 0 && (
              <div key={title} style={{ marginBottom:"20px" }}>
                <div style={{ fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--accent-text)", marginBottom:"10px" }}>{title}</div>
                {items.map((item, i) => {
                  const parts = item.split("|").map(p => p.trim());
                  return (
                    <div key={i} style={{ marginBottom:"12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"4px" }}>
                        <span style={{ fontWeight:700, color:"var(--text)", fontSize:"14px" }}>{parts[0]}</span>
                        {parts[2] && <span style={{ fontSize:"13px", color:"var(--text-dim)" }}>{parts[2]}</span>}
                      </div>
                      {parts[1] && <div style={{ fontSize:"13px", color:"var(--accent-text)", marginTop:"2px" }}>{parts[1]}</div>}
                      {parts[3] && <div style={{ fontSize:"13px", color:"var(--text-dim)", marginTop:"4px", lineHeight:1.5 }}>{parts[3]}</div>}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return null;
}