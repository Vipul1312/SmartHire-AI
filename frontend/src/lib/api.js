const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeResume(resumeText, jobDescription, candidateName, clerkUserId, userEmail) {
  const formData = new FormData();
  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);
  formData.append("candidate_name", candidateName);
  if (clerkUserId) formData.append("clerk_user_id", clerkUserId);
  if (userEmail) formData.append("user_email", userEmail);
  const res = await fetch(`${API_URL}/analyze`, { method: "POST", body: formData });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Analysis failed"); }
  return res.json();
}

export async function parsePDF(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/parse-pdf`, { method: "POST", body: formData });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "PDF parse failed"); }
  return res.json();
}

export async function syncUser(clerkUserId, name, email) {
  try {
    await fetch(`${API_URL}/sync-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerk_user_id: clerkUserId, name, email }),
    });
  } catch (e) { console.error("Sync user failed:", e); }
}

export async function sendChatMessage(message, history) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("Chat failed");
  return res.json();
}

export async function getDashboard(clerkUserId) {
  const res = await fetch(`${API_URL}/dashboard/${clerkUserId}`);
  if (!res.ok) throw new Error("Dashboard failed");
  return res.json();
}

export async function buildResume(data) {
  const res = await fetch(`${API_URL}/build-resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Resume build failed"); }
  return res.json();
}

export async function startInterview(jobRole, resumeText, difficulty) {
  const res = await fetch(`${API_URL}/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_role: jobRole, resume_text: resumeText, difficulty }),
  });
  if (!res.ok) throw new Error("Interview start failed");
  return res.json();
}

export async function evaluateAnswer(question, answer, jobRole) {
  const res = await fetch(`${API_URL}/interview/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, job_role: jobRole }),
  });
  if (!res.ok) throw new Error("Evaluation failed");
  return res.json();
}


export async function getInterviewRoadmap(company, role, experienceYears, resumeText = "") {
  const res = await fetch(`${API_URL}/interview-roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, role, experience_years: experienceYears, resume_text: resumeText }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Roadmap generation failed"); }
  return res.json();
}

export async function estimateSalary(skills, experienceYears, location, role = "") {
  const res = await fetch(`${API_URL}/salary-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills, experience_years: experienceYears, location, role }),
  });
  if (!res.ok) throw new Error("Salary estimate failed");
  return res.json();
}