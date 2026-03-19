import { useState, useRef } from "react";
import { parsePDF } from "../lib/api";

export default function InputForm({ onSubmit, error }) {
  const [resumeText, setResumeText] = useState("");
  const [resumeMode, setResumeMode] = useState("upload");
  const [jd, setJd] = useState("");
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  const handlePDF = async (file) => {
    if (!file.name.endsWith(".pdf")) { setUploadError("Only PDF files allowed."); return; }
    setUploading(true);
    setUploadError("");
    try {
      const data = await parsePDF(file);
      setResumeText(data.text);
      setUploadedFile(file.name);
    } catch (e) {
      setUploadError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = resumeText.trim().length > 100 && jd.trim().length > 50;

  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      {/* Name */}
      <div className="mb-5">
        <label className="field-label">Your Name (for cover letter)</label>
        <input type="text" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* Resume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="field-label">Your Resume</label>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--upload-bg)", border: "1px solid var(--border)" }}>
              {["upload", "paste"].map((mode) => (
                <button key={mode} onClick={() => { setResumeMode(mode); setResumeText(""); setUploadedFile(""); setUploadError(""); }}
                  className="text-xs px-3 py-1.5 rounded-md transition-all"
                  style={{ fontWeight: 600, background: resumeMode === mode ? "rgba(0,255,136,0.15)" : "transparent", color: resumeMode === mode ? "var(--toggle-active)" : "var(--toggle-inactive)" }}>
                  {mode === "upload" ? "📎 Upload PDF" : "✏ Paste Text"}
                </button>
              ))}
            </div>
          </div>

          {resumeMode === "upload" && (
            <div>
              <div onClick={() => fileRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePDF(f); }}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center gap-3 cursor-pointer"
                style={{ minHeight: "200px", border: uploadedFile ? "1px solid rgba(0,255,136,0.3)" : "2px dashed rgba(128,128,128,0.3)", borderRadius: "12px", background: uploadedFile ? "rgba(0,255,136,0.04)" : "var(--upload-bg)" }}>
                {uploading ? (
                  <div className="text-center">
                    <div className="text-2xl mb-2 pulse-glow">⟳</div>
                    <p className="text-sm" style={{ color: "var(--upload-text)" }}>Parsing PDF...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="text-center px-4">
                    <div className="text-3xl mb-2" style={{ color: "#00ff88" }}>✓</div>
                    <p className="text-sm font-semibold" style={{ color: "#00ff88" }}>{uploadedFile}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--upload-text-muted)" }}>{resumeText.length} characters extracted</p>
                    <button onClick={(e) => { e.stopPropagation(); setUploadedFile(""); setResumeText(""); }} className="text-xs mt-3 underline" style={{ color: "var(--upload-text-muted)" }}>Remove</button>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <div className="text-4xl mb-3" style={{ color: "var(--upload-icon-color)" }}>📄</div>
                    <p className="text-sm font-semibold" style={{ color: "var(--upload-text)" }}>Click to upload PDF</p>
                    <p className="text-xs mt-1" style={{ color: "var(--upload-text-muted)" }}>or drag and drop here</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePDF(f); }} />
              {uploadError && <p className="text-xs mt-2" style={{ color: "#ff7070" }}>⚠ {uploadError}</p>}
            </div>
          )}

          {resumeMode === "paste" && (
            <div className="relative">
              <textarea rows={14} placeholder="Paste your resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} style={{ minHeight: "300px" }} />
              {resumeText && <span className="absolute bottom-3 right-3 text-xs" style={{ color: "var(--text-muted)" }}>{resumeText.length} chars</span>}
            </div>
          )}
        </div>

        {/* Job Description */}
        <div>
          <label className="field-label">Job Description</label>
          <div className="relative">
            <textarea rows={14} placeholder="Paste the job description here..." value={jd} onChange={(e) => setJd(e.target.value)} style={{ minHeight: "300px" }} />
            {jd && <span className="absolute bottom-3 right-3 text-xs" style={{ color: "var(--text-muted)" }}>{jd.length} chars</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl text-sm" style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff7070" }}>
          ⚠ {error}
        </div>
      )}

      {!canSubmit && (resumeText || jd) && (
        <p className="text-xs mb-4 text-center" style={{ color: "var(--text-muted)" }}>
          {!resumeText || resumeText.length < 100 ? "Resume needs more content" : "Add more job description text"}
        </p>
      )}

      <div className="flex justify-center">
        <button className="btn-primary" onClick={() => onSubmit(resumeText, jd, name || "Candidate")} disabled={!canSubmit}>
          {canSubmit ? "✦ Analyze My Resume" : "Upload Resume + Job Description First"}
        </button>
      </div>
    </section>
  );
}