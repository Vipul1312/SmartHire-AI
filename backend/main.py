from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os, re, io, requests, unicodedata
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime
from pymongo import MongoClient

try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

try:
    from bs4 import BeautifulSoup
    BS4_SUPPORT = True
except ImportError:
    BS4_SUPPORT = False

load_dotenv()

app = FastAPI(title="SmartHire AI", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://smart-hire-ai-nu.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_KEY   = os.getenv("GROQ_API_KEY", "")
MONGO_URI  = os.getenv("MONGODB_URI", "")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    gemini = genai.GenerativeModel("gemini-1.5-flash")
else:
    gemini = None


db = None
try:
    if MONGO_URI:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        db = client["smarthire"]
        # Verify connection actually works
        client.admin.command("ping")
        print("✅ MongoDB connected successfully!")
    else:
        print("❌ MONGODB_URI not set in .env")
except Exception as e:
    print(f"❌ MongoDB connection FAILED: {type(e).__name__}: {e}")
    db = None

# ── AI Helpers ────────────────────────────────────────────────────────────────
def call_groq(prompt: str, max_tokens: int = 512) -> str:
    if not GROQ_KEY:
        raise HTTPException(500, "GROQ_API_KEY not set")
    headers = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
    body = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are HireBot, a friendly AI career assistant."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens, "temperature": 0.7,
    }
    for attempt in range(3):
        try:
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body, timeout=30)
            res.raise_for_status()
            return res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            if attempt == 2: raise HTTPException(500, f"Groq error: {e}")
            import time; time.sleep(1)

def call_gemini(prompt: str) -> str:
    if not gemini: raise HTTPException(500, "GEMINI_API_KEY not set")
    try:
        return gemini.generate_content(prompt).text.strip()
    except Exception as e:
        if GROQ_KEY: return call_groq(prompt)
        raise HTTPException(500, f"Gemini error: {e}")

# ── PDF Parser ────────────────────────────────────────────────────────────────
def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r'[^\x20-\x7E\n]', ' ', text)
    text = re.sub(r'/[a-zA-Z]+', ' ', text)
    text = re.sub(r'\|\s*[A-Za-z]{1,3}\s+(?=[a-zA-Z0-9])', '| ', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_pdf(data: bytes) -> str:
    if not PDF_SUPPORT: raise HTTPException(500, "PyPDF2 not installed")
    reader = PyPDF2.PdfReader(io.BytesIO(data))
    raw = "".join(p.extract_text() + "\n" for p in reader.pages)
    return clean_text(raw)

# ── Skills Database ───────────────────────────────────────────────────────────
SKILLS = {
    "python","java","javascript","typescript","c++","c#","golang","rust","kotlin","swift","php","ruby","scala","bash",
    "react","angular","vue","nextjs","next.js","html","css","tailwind","bootstrap","sass","webpack","vite","redux","svelte",
    "node.js","nodejs","fastapi","django","flask","spring","express","graphql","rest","api","microservices",
    "sql","mysql","postgresql","mongodb","redis","firebase","firestore","supabase","dynamodb","sqlite","elasticsearch",
    "aws","gcp","azure","docker","kubernetes","terraform","git","github","gitlab","ci/cd","linux","nginx","jenkins",
    "machine learning","deep learning","nlp","tensorflow","pytorch","scikit-learn","pandas","numpy","keras","llm",
    "blockchain","android","ios","flutter","react native","kafka","spark","agile","scrum","jira","figma",
    "algorithms","data structures","system design","devops","testing","debugging",
}

INFER = {
    "react": {"webpack","vite","jsx","redux","bootstrap"},
    "next.js": {"react","webpack","node.js"}, "nextjs": {"react","webpack","node.js"},
    "node.js": {"npm","rest","api","express","firebase"}, "nodejs": {"npm","rest","api","express"},
    "tailwind": {"css","html"}, "css": {"scss","bootstrap"}, "javascript": {"html","css"},
    "aws": {"cloud","docker","firebase"}, "devops": {"ci/cd","linux","docker","kubernetes"},
    "docker": {"linux","devops","ci/cd"}, "typescript": {"javascript","html","css"},
    "flutter": {"dart","ios","android"}, "react native": {"react","javascript","ios","android"},
}

COURSES = {
    "python": "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
    "javascript": "https://www.youtube.com/watch?v=W6NZfCO5SIk",
    "react": "https://www.youtube.com/watch?v=bMknfKXIFA8",
    "node.js": "https://www.youtube.com/watch?v=Oe421EPjeBE",
    "mongodb": "https://www.youtube.com/watch?v=ExcRbA7fy_A",
    "sql": "https://www.youtube.com/watch?v=HXV3zeQKqGY",
    "docker": "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    "aws": "https://www.youtube.com/watch?v=ulprqHHWlng",
    "git": "https://www.youtube.com/watch?v=RGOj5yH7evk",
    "machine learning": "https://www.youtube.com/watch?v=NWONeJKn6kc",
    "typescript": "https://www.youtube.com/watch?v=BwuLxPH8IDs",
    "django": "https://www.youtube.com/watch?v=PtQiiknWUcI",
    "kubernetes": "https://www.youtube.com/watch?v=X48VuDVv0do",
}

# ── Salary Data (Indian Market) ───────────────────────────────────────────────
# Year-wise salary ranges (min, max) in LPA — Indian market 2024-25
# Role/Skill based data
SALARY_BY_YEAR = {
    # Frontend
    "react":              {0:(3.5,6), 1:(5,8), 2:(7,12), 3:(9,15), 4:(12,18), 5:(15,22), 6:(18,27), 7:(22,32), 8:(26,38), 9:(30,44), 10:(35,50)},
    "angular":            {0:(3.5,6), 1:(5,8), 2:(7,11), 3:(9,14), 4:(11,17), 5:(14,21), 6:(17,25), 7:(20,29), 8:(23,34), 9:(27,40), 10:(32,46)},
    "vue":                {0:(3,5.5), 1:(4.5,7), 2:(6,10), 3:(8,13), 4:(10,16), 5:(13,19), 6:(16,23), 7:(19,27), 8:(22,31), 9:(25,36), 10:(29,42)},
    "javascript":         {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(10,15), 5:(13,19), 6:(16,24), 7:(19,28), 8:(22,32), 9:(26,38), 10:(30,45)},
    "typescript":         {0:(3.5,6), 1:(5,8), 2:(7,11), 3:(9,14), 4:(12,17), 5:(15,21), 6:(18,26), 7:(21,30), 8:(25,36), 9:(29,42), 10:(34,48)},
    # Full Stack
    "full stack":         {0:(4,7), 1:(5.5,9), 2:(8,13), 3:(10,16), 4:(13,20), 5:(16,24), 6:(20,30), 7:(24,35), 8:(28,42), 9:(33,48), 10:(38,56)},
    "next.js":            {0:(3.5,6), 1:(5,8), 2:(7,12), 3:(9,15), 4:(12,18), 5:(15,22), 6:(18,27), 7:(22,32), 8:(26,38), 9:(30,44), 10:(35,50)},
    "nodejs":             {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(10,16), 5:(13,19), 6:(16,23), 7:(19,27), 8:(22,32), 9:(25,37), 10:(29,44)},
    "mern":               {0:(4,7), 1:(5.5,9), 2:(8,13), 3:(10,16), 4:(13,20), 5:(16,24), 6:(20,30), 7:(24,35), 8:(28,42), 9:(33,48), 10:(38,56)},
    # Backend
    "python":             {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(11,16), 5:(14,20), 6:(17,25), 7:(20,30), 8:(24,36), 9:(28,40), 10:(32,50)},
    "java":               {0:(3.5,6), 1:(5,8), 2:(7,12), 3:(9,15), 4:(12,18), 5:(15,22), 6:(18,27), 7:(21,32), 8:(25,38), 9:(29,44), 10:(34,52)},
    "django":             {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(10,16), 5:(13,19), 6:(16,23), 7:(19,28), 8:(22,32), 9:(26,38), 10:(30,45)},
    "fastapi":            {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(10,16), 5:(13,19), 6:(16,23), 7:(19,28), 8:(22,32), 9:(26,38), 10:(30,45)},
    "spring":             {0:(3.5,6), 1:(5,8), 2:(7,12), 3:(9,15), 4:(12,18), 5:(15,22), 6:(18,27), 7:(21,32), 8:(25,38), 9:(29,44), 10:(34,52)},
    "golang":             {0:(4,7), 1:(6,10), 2:(8,14), 3:(11,17), 4:(14,21), 5:(17,26), 6:(21,32), 7:(25,38), 8:(30,44), 9:(35,50), 10:(40,58)},
    # Mobile
    "android":            {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(10,16), 5:(13,20), 6:(16,24), 7:(19,28), 8:(22,32), 9:(25,37), 10:(29,44)},
    "ios":                {0:(3.5,6), 1:(5,8), 2:(7,11), 3:(9,14), 4:(11,17), 5:(14,21), 6:(17,25), 7:(20,29), 8:(23,34), 9:(27,40), 10:(32,48)},
    "flutter":            {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,12), 4:(10,15), 5:(12,18), 6:(15,22), 7:(18,26), 8:(21,30), 9:(24,35), 10:(28,42)},
    "react native":       {0:(3,5), 1:(4,7), 2:(6,10), 3:(8,13), 4:(10,16), 5:(13,19), 6:(16,23), 7:(19,27), 8:(22,32), 9:(25,37), 10:(29,44)},
    "kotlin":             {0:(3.5,6), 1:(5,8), 2:(7,11), 3:(9,14), 4:(11,17), 5:(14,21), 6:(17,25), 7:(20,29), 8:(23,34), 9:(27,40), 10:(32,48)},
    # AI/ML/Data
    "machine learning":   {0:(4,7), 1:(6,10), 2:(9,14), 3:(12,18), 4:(15,22), 5:(18,27), 6:(22,33), 7:(26,38), 8:(30,44), 9:(35,50), 10:(40,60)},
    "deep learning":      {0:(4.5,8), 1:(7,11), 2:(10,15), 3:(13,19), 4:(16,24), 5:(20,29), 6:(24,35), 7:(28,42), 8:(33,48), 9:(38,55), 10:(44,65)},
    "data science":       {0:(4,7), 1:(6,10), 2:(9,14), 3:(12,18), 4:(15,22), 5:(18,27), 6:(22,33), 7:(26,38), 8:(30,44), 9:(35,50), 10:(40,60)},
    "nlp":                {0:(4.5,8), 1:(7,11), 2:(10,15), 3:(13,19), 4:(16,24), 5:(20,29), 6:(24,35), 7:(28,42), 8:(33,48), 9:(38,55), 10:(44,65)},
    "tensorflow":         {0:(4,7), 1:(6,10), 2:(9,14), 3:(12,18), 4:(15,22), 5:(18,27), 6:(22,33), 7:(26,38), 8:(30,44), 9:(35,50), 10:(40,60)},
    "pytorch":            {0:(4.5,8), 1:(7,11), 2:(10,15), 3:(13,19), 4:(16,24), 5:(20,29), 6:(24,35), 7:(28,42), 8:(33,48), 9:(38,55), 10:(44,65)},
    # Cloud/DevOps
    "devops":             {0:(4,7), 1:(5,9), 2:(8,13), 3:(10,16), 4:(13,19), 5:(16,23), 6:(19,28), 7:(22,33), 8:(26,38), 9:(30,44), 10:(35,50)},
    "aws":                {0:(4,7), 1:(5.5,9), 2:(8,13), 3:(11,17), 4:(14,20), 5:(17,25), 6:(21,30), 7:(25,36), 8:(29,42), 9:(34,48), 10:(39,56)},
    "docker":             {0:(3.5,6), 1:(5,8), 2:(7,11), 3:(9,14), 4:(11,17), 5:(14,21), 6:(17,25), 7:(20,29), 8:(23,34), 9:(27,40), 10:(32,46)},
    "kubernetes":         {0:(4,7), 1:(6,10), 2:(8,13), 3:(11,17), 4:(14,20), 5:(17,25), 6:(21,30), 7:(25,36), 8:(29,42), 9:(34,48), 10:(39,56)},
    "azure":              {0:(4,7), 1:(5.5,9), 2:(8,13), 3:(11,17), 4:(14,20), 5:(17,25), 6:(21,30), 7:(25,36), 8:(29,42), 9:(34,48), 10:(39,56)},
    "gcp":                {0:(4,7), 1:(5.5,9), 2:(8,13), 3:(11,17), 4:(14,20), 5:(17,25), 6:(21,30), 7:(25,36), 8:(29,42), 9:(34,48), 10:(39,56)},
    # Other
    "blockchain":         {0:(4,8), 1:(6,11), 2:(9,15), 3:(12,19), 4:(15,24), 5:(19,29), 6:(23,35), 7:(27,41), 8:(32,48), 9:(37,55), 10:(43,64)},
    "cybersecurity":      {0:(4,7), 1:(5.5,9), 2:(8,13), 3:(10,16), 4:(13,20), 5:(16,24), 6:(20,29), 7:(24,34), 8:(28,40), 9:(32,46), 10:(37,54)},
    "sql":                {0:(2.5,4.5), 1:(3.5,6), 2:(5,8), 3:(6.5,10), 4:(8,12), 5:(10,15), 6:(12,18), 7:(14,21), 8:(17,25), 9:(20,29), 10:(23,35)},
    "default":            {0:(2.5,4.5), 1:(3.5,6), 2:(5,8), 3:(6.5,10), 4:(8,12), 5:(10,15), 6:(12,18), 7:(14,21), 8:(17,25), 9:(20,29), 10:(23,35)},
}

# Role name aliases — map common role names to salary keys
ROLE_ALIASES = {
    "full stack developer": "full stack", "full stack engineer": "full stack",
    "fullstack": "full stack", "mern developer": "mern", "mean developer": "mern",
    "frontend developer": "react", "frontend engineer": "react",
    "backend developer": "python", "backend engineer": "python",
    "software developer": "full stack", "software engineer": "full stack",
    "web developer": "full stack", "web engineer": "javascript",
    "data scientist": "data science", "ml engineer": "machine learning",
    "ai engineer": "deep learning", "nlp engineer": "nlp",
    "android developer": "android", "ios developer": "ios",
    "mobile developer": "flutter", "react native developer": "react native",
    "devops engineer": "devops", "cloud engineer": "aws",
    "site reliability engineer": "kubernetes", "sre": "kubernetes",
    "blockchain developer": "blockchain", "smart contract developer": "blockchain",
    "security engineer": "cybersecurity", "cybersecurity analyst": "cybersecurity",
    "data analyst": "sql", "business analyst": "sql",
    "java developer": "java", "python developer": "python",
    "golang developer": "golang", "go developer": "golang",
}

CITY_MULTIPLIER = {
    "bangalore":1.3,"mumbai":1.2,"delhi":1.15,"hyderabad":1.1,
    "pune":1.05,"chennai":1.05,"noida":1.1,"gurgaon":1.15,
}

# ── NLP Functions ─────────────────────────────────────────────────────────────
def extract_entities(text: str) -> dict:
    # Pure regex — no spaCy dependency needed
    emails   = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    phones   = re.findall(r'[\+\d][\d\s\-]{9,}', text)
    linkedin = re.findall(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)

    # Extract name — first capitalized line (usually candidate name)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    name = []
    for line in lines[:5]:
        if re.match(r'^[A-Z][a-z]+ [A-Z][a-z]+', line) and len(line.split()) <= 4:
            name = [line.strip()]
            break

    # Extract organizations via common patterns
    orgs = re.findall(r'(?:at|@|with|for)\s+([A-Z][A-Za-z0-9\s&.,-]{2,30}?)(?:\s*[,|\n]|$)', text)
    orgs = list(set([o.strip() for o in orgs if len(o.strip()) > 2]))[:5]

    # Extract locations
    locations = re.findall(r'\b(Mumbai|Delhi|Bangalore|Hyderabad|Chennai|Pune|Kolkata|Noida|Gurgaon|India|Remote)\b', text, re.IGNORECASE)
    locations = list(set(locations))[:3]

    # Detect sections
    sections = []
    lower = text.lower()
    for sec, kws in {
        "experience": ["experience", "work", "internship"],
        "education": ["education", "degree", "university"],
        "skills": ["skills", "technologies"],
        "projects": ["projects"],
        "certifications": ["certifications", "certificates"]
    }.items():
        if any(k in lower for k in kws):
            sections.append(sec)

    return {
        "name": name,
        "organizations": orgs,
        "locations": locations,
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "linkedin": linkedin[0] if linkedin else None,
        "sections_found": sections,
    }

def detect_level(text: str) -> str:
    lower = text.lower()
    years = sum(int(y) for y in re.findall(r'(\d+)\+?\s*year', lower)) if re.findall(r'(\d+)\+?\s*year', lower) else 0
    if any(k in lower for k in ["senior","lead","manager","architect","principal"]) or years >= 5:
        return "Senior (5+ years)"
    elif any(k in lower for k in ["mid","intermediate"]) or 2 <= years < 5:
        return "Mid-Level (2-5 years)"
    return "Fresher / Entry-Level (0-2 years)"

def extract_skills(text: str) -> set:
    lower = " ".join(l for l in text.split("\n") if not any(k in l.lower() for k in ["location","duration","salary","remote","hybrid"])).lower()
    return {s for s in SKILLS if re.search(r'\b' + re.escape(s) + r'\b', lower)}

def expand_skills(skills: set) -> set:
    expanded = skills.copy()
    for s in skills:
        if s in INFER: expanded.update(INFER[s])
    return expanded

def match_score(resume: str, jd: str):
    # Pure skill-based matching (no heavy ML model needed)
    r_skills = expand_skills(extract_skills(resume))
    j_skills = extract_skills(jd)
    matched = r_skills & j_skills
    missing = j_skills - r_skills
    ratio = len(missing) / len(j_skills) if j_skills else 0
    bonus = 25 if ratio<=0.1 else 20 if ratio<=0.2 else 15 if ratio<=0.3 else 10 if ratio<=0.4 else 5
    score = min(100, max(0, (len(matched)/len(j_skills)*100 if j_skills else 0) + bonus))
    return round(score, 1), sorted(matched), sorted(missing)

def ats_score(resume: str, matched: list, missing: list) -> dict:
    lower = resume.lower()
    total = len(matched) + len(missing)
    kw = (len(matched)/total*100) if total else 0
    has_email = 1 if re.search(r'[\w.-]+@[\w.-]+\.\w+', resume) else 0
    has_phone = 1 if re.search(r'[\+\d][\d\s\-]{9,}', resume) else 0
    secs = sum([1 if any(w in lower for w in ws) else 0 for ws in [["experience","work"],["education","degree"],["skills","technologies"],["project"]]])
    fmt = min(30, (has_email + has_phone)*15 + secs*10)
    wc = len(resume.split())
    length = 15 if 400<=wc<=800 else 10 if 300<=wc<=1000 else 5
    verbs = ["developed","built","designed","implemented","managed","led","created","improved","deployed","optimized","launched"]
    verb_score = min(15, sum(1 for v in verbs if v in lower)*2)
    total_score = min(100, round(kw*0.4 + fmt + length + verb_score, 1))
    tips = []
    if not has_email: tips.append("Add your email address.")
    if not has_phone: tips.append("Add your phone number.")
    if secs < 3: tips.append("Add clear section headers: Experience, Education, Skills, Projects.")
    if wc < 300: tips.append("Resume too short — add more detail.")
    if wc > 1000: tips.append("Resume too long — keep to 1 page for fresher roles.")
    if len(missing) > 3: tips.append(f"Add missing keywords: {', '.join(missing[:4])}.")
    return {"ats_score": total_score, "ats_breakdown": {"keyword_match": round(kw*0.4,1), "formatting": fmt, "length": length, "action_verbs": verb_score}, "ats_tips": tips[:5]}

def skill_roadmap(missing: list) -> list:
    priority = ["python","javascript","react","node.js","sql","git","docker","aws","machine learning","typescript"]
    sorted_m = sorted(missing, key=lambda x: priority.index(x) if x in priority else 999)
    return [{"skill": s, "priority": "High" if s in priority[:5] else "Medium", "estimated_time": "1-2 weeks", "free_course": COURSES.get(s, f"https://www.youtube.com/results?search_query={s.replace(' ','+')}+tutorial"), "platform": "YouTube (Free)"} for s in sorted_m[:8]]

def get_salary(skills_set: set, experience_years: int = 0, location: str = "India", role: str = "") -> dict:
    yr = min(int(experience_years), 10)

    if yr >= 8: level = "Principal / Staff Engineer"
    elif yr >= 5: level = "Senior Engineer"
    elif yr >= 3: level = "Mid-Senior"
    elif yr >= 2: level = "Mid Level"
    elif yr == 1: level = "Junior"
    else: level = "Fresher"

    # Step 1: Try role name match first
    matched_key = None
    if role:
        role_lower = role.lower().strip()
        # Direct alias lookup
        if role_lower in ROLE_ALIASES:
            matched_key = ROLE_ALIASES[role_lower]
        else:
            # Partial match in role name
            for alias, key in ROLE_ALIASES.items():
                if alias in role_lower or role_lower in alias:
                    matched_key = key
                    break
            # Direct skill name in role
            if not matched_key:
                for skill in SALARY_BY_YEAR.keys():
                    if skill != "default" and skill in role_lower:
                        matched_key = skill
                        break

    # Step 2: Fall back to skills set
    if not matched_key:
        priority = ["deep learning","nlp","pytorch","machine learning","data science","tensorflow",
                    "golang","kubernetes","aws","azure","gcp","blockchain","cybersecurity",
                    "full stack","mern","next.js","react","angular","vue","typescript",
                    "spring","java","django","fastapi","python","nodejs",
                    "kotlin","ios","react native","flutter","android",
                    "devops","docker","javascript","sql"]
        for skill in priority:
            if skill in skills_set:
                matched_key = skill
                break

    if not matched_key:
        matched_key = "default"

    skill_data = SALARY_BY_YEAR.get(matched_key, SALARY_BY_YEAR["default"])
    low, high = skill_data[yr]

    loc = location.lower()
    multiplier = next((v for k,v in CITY_MULTIPLIER.items() if k in loc), 1.0)

    progression = []
    for y in range(11):
        d = skill_data[y]
        progression.append({
            "year": y,
            "min": round(d[0] * multiplier, 1),
            "max": round(d[1] * multiplier, 1),
            "avg": round(((d[0]+d[1])/2) * multiplier, 1),
        })

    return {
        "experience_years": yr,
        "level": level,
        "role": role if role else matched_key.title(),
        "primary_skill": matched_key if matched_key != "default" else "General IT",
        "min_lpa": round(low * multiplier, 1),
        "max_lpa": round(high * multiplier, 1),
        "avg_lpa": round(((low+high)/2) * multiplier, 1),
        "location": location,
        "currency": "LPA (Lakhs Per Annum)",
        "progression": progression,
        "note": "Based on Indian job market 2024-25. Actual salary depends on company, skills, and negotiation."
    }

# ── MongoDB Helpers ───────────────────────────────────────────────────────────
def save_user(clerk_id, name, email=None):
    if db is None:
        print("save_user: db is None, skipping")
        return
    try:
        db.users.update_one(
            {"clerk_user_id": clerk_id},
            {
                "$set": {"clerk_user_id": clerk_id, "name": name, "email": email, "updated_at": datetime.utcnow()},
                "$setOnInsert": {"created_at": datetime.utcnow(), "total_analyses": 0}
            },
            upsert=True
        )
        db.users.update_one({"clerk_user_id": clerk_id}, {"$inc": {"total_analyses": 1}})
        print(f"save_user SUCCESS: {clerk_id}")
    except Exception as e:
        print(f"save_user ERROR: {type(e).__name__}: {e}")

def save_analysis(clerk_id, name, resume, jd, result):
    if db is None:
        print("save_analysis: db is None, skipping")
        return None
    try:
        doc = {
            "clerk_user_id": clerk_id,
            "candidate_name": name,
            "resume_snippet": resume[:500],
            "jd_snippet": jd[:300],
            "match_score": float(result.get("match_score", 0)),
            "ats_score": float(result.get("ats_score", 0)),
            "matched_keywords": result.get("matched_keywords", [])[:20],
            "missing_keywords": result.get("missing_keywords", [])[:20],
            "candidate_level": result.get("candidate_level", ""),
            "created_at": datetime.utcnow()
        }
        inserted = db.analyses.insert_one(doc)
        print(f"save_analysis SUCCESS: {inserted.inserted_id}")
        return str(inserted.inserted_id)
    except Exception as e:
        print(f"save_analysis ERROR: {type(e).__name__}: {e}")
        return None

# ── Basic Routes ──────────────────────────────────────────────────────────────
@app.get("/")
def root(): return {"status": "ok", "message": "SmartHire AI v2.0 Running"}

@app.get("/health")
def health(): return {"status": "ok", "mongodb": "connected" if db is not None else "not connected"}

@app.post("/parse-pdf")
async def parse_pdf_route(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"): raise HTTPException(400, "Only PDF files allowed")
    content = await file.read()
    text = parse_pdf(content)
    if len(text) < 50: raise HTTPException(400, "Could not extract text from PDF.")
    return {"text": text, "chars": len(text)}

@app.post("/sync-user")
async def sync_user(req: dict):
    save_user(req.get("clerk_user_id"), req.get("name"), req.get("email"))
    return {"status": "ok"}

@app.get("/history/{clerk_id}")
async def get_history(clerk_id: str):
    if db is None: return {"analyses": []}
    try:
        analyses = list(db.analyses.find({"clerk_user_id": clerk_id}, {"resume_text": 0, "job_description": 0}).sort("created_at", -1).limit(20))
        for a in analyses: a["_id"] = str(a["_id"])
        return {"analyses": analyses}
    except Exception as e: raise HTTPException(500, str(e))

# ── Main Analyze ──────────────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    candidate_name: str = Form("Candidate"),
    clerk_user_id: str = Form(None),
    user_email: str = Form(None),
):
    resume = resume_text.strip()
    jd = job_description.strip()
    name = candidate_name.strip() or "Candidate"
    if len(resume) < 100: raise HTTPException(400, "Resume text too short")
    if len(jd) < 50: raise HTTPException(400, "Job description too short")

    score, matched, missing = match_score(resume, jd)
    entities = extract_entities(resume)
    level = detect_level(resume)
    ats = ats_score(resume, matched, missing)
    roadmap = skill_roadmap(missing)
    salary = get_salary(set(matched))

    imp = call_gemini(f"Give exactly 5 resume improvement suggestions.\nRESUME: {resume[:2000]}\nJOB: {jd[:1500]}\nMISSING: {', '.join(missing[:8])}\nFormat: 5 bullet points only.")
    improvements = [l.strip().lstrip("•-").strip() for l in imp.split("\n") if l.strip()][:5]
    cover = call_gemini(f"Write a professional cover letter for {name}.\nRESUME: {resume[:1500]}\nJOB: {jd[:1000]}\nRules: 3 paragraphs, start with Dear Hiring Manager.")
    iq = call_gemini(f"Generate 7 interview questions.\nJOB: {jd[:1200]}\nCANDIDATE: {resume[:800]}\nFormat: numbered 1-7.")
    questions = [re.sub(r'^\d+\.\s*', '', l.strip()) for l in iq.split("\n") if re.match(r'^\d+\.', l.strip())][:7]
    feedback = call_gemini(f"2-sentence honest assessment. Match: {score}%. One strength and one gap.")
    bullets_raw = call_gemini(f"Rewrite 3 weak resume bullets.\nRESUME: {resume[:1500]}\nJOB: {jd[:800]}\nShow BEFORE and AFTER for each. Number 1-3.")
    bullets = [l.strip() for l in bullets_raw.split("\n") if l.strip() and (l.strip()[0].isdigit() or "before" in l.lower() or "after" in l.lower() or l.strip().startswith("•"))][:12]
    personal = call_gemini(f"3 personalized tips for a {level} candidate. Match: {score}%.\nRESUME: {resume[:1000]}\nJOB: {jd[:600]}\nBe friendly and practical.")
    tech_q = call_gemini(f"4 technical interview questions.\nJOB: {jd[:800]}\nFormat: numbered 1-4.")
    hr_q = call_gemini(f"3 HR behavioral questions.\nJOB: {jd[:600]}\nFormat: numbered 1-3.")
    parse_q = lambda t: [re.sub(r'^\d+\.\s*', '', l.strip()) for l in t.split("\n") if re.match(r'^\d+\.', l.strip())]

    result = {
        "match_score": score, "matched_keywords": matched, "missing_keywords": missing,
        "resume_entities": entities, "resume_sections": entities.get("sections_found", []),
        "candidate_level": level, "resume_improvements": improvements,
        "cover_letter": cover, "interview_questions": questions,
        "overall_feedback": feedback, "rewritten_bullets": bullets,
        "personalized_feedback": personal,
        "ats_score": ats["ats_score"], "ats_breakdown": ats["ats_breakdown"], "ats_tips": ats["ats_tips"],
        "skill_roadmap": roadmap,
        "salary_estimate": salary,
        "mock_interview": {"technical_questions": parse_q(tech_q)[:4], "hr_questions": parse_q(hr_q)[:3]},
    }

    if clerk_user_id and db is not None:
        save_user(clerk_user_id, name, user_email)
        result["analysis_id"] = save_analysis(clerk_user_id, name, resume, jd, result)

    return result

# ── 1. Resume Builder ─────────────────────────────────────────────────────────
class ResumeBuilderRequest(BaseModel):
    name: str
    email: str
    phone: str
    location: str = ""
    linkedin: str = ""
    github: str = ""
    summary: str = ""
    experience: list = []
    education: list = []
    skills: list = []
    projects: list = []
    certifications: list = []
    template: str = "fresher"  # fresher | experienced | datascience | fresh

@app.post("/build-resume")
async def build_resume(req: ResumeBuilderRequest):
    skills_str = ", ".join(req.skills[:12]) if req.skills else "various technologies"
    template = req.template or "fresher"

    # ── Template-specific AI prompts ──────────────────────────────
    # Normalize template IDs
    if template in ["data", "datascience", "data-science"]:
        template = "datascience"
    elif template in ["blank", "fresh", "start-fresh"]:
        template = "fresh"

    if template == "fresher":
        if req.summary:
            enhanced_summary = call_gemini(
                f"Improve this fresher/student summary in 3 sentences. Focus on passion, learning ability, academic projects, and career goals. ATS-friendly:\n{req.summary}"
            )
        else:
            enhanced_summary = call_gemini(
                f"Write a 3-sentence professional summary for a fresher/student named {req.name} with skills: {skills_str}. "
                f"Focus on: enthusiasm for technology, academic background, project work, and eagerness to contribute. "
                f"Do NOT mention years of experience. ATS-friendly."
            )

    elif template == "experienced":
        if req.summary:
            enhanced_summary = call_gemini(
                f"Improve this experienced professional summary in 3-4 sentences. Highlight years of experience, key achievements with metrics, leadership, and business impact. ATS-friendly:\n{req.summary}"
            )
        else:
            enhanced_summary = call_gemini(
                f"Write a 3-4 sentence professional summary for an experienced software engineer named {req.name} with skills: {skills_str}. "
                f"Focus on: proven track record, technical expertise, team leadership, and measurable business impact. "
                f"Use strong action words. ATS-friendly."
            )

    elif template == "datascience":
        if req.summary:
            enhanced_summary = call_gemini(
                f"Improve this Data Science/ML professional summary in 3-4 sentences. Highlight ML models built, datasets worked on, accuracy metrics, and business impact. ATS-friendly:\n{req.summary}"
            )
        else:
            enhanced_summary = call_gemini(
                f"Write a 3-4 sentence professional summary for a Data Scientist/ML Engineer named {req.name} with skills: {skills_str}. "
                f"Focus on: ML model development, data analysis, model accuracy metrics, Python/ML frameworks expertise. "
                f"ATS-friendly for AI/ML roles."
            )

    else:  # fresh/scratch
        if req.summary:
            enhanced_summary = call_gemini(
                f"Improve this professional summary in 3-4 sentences. Make it compelling and ATS-friendly:\n{req.summary}"
            )
        else:
            enhanced_summary = call_gemini(
                f"Write a compelling 3-sentence professional summary for {req.name} with skills: {skills_str}. ATS-friendly."
            )

    # ── Template-specific section ordering ────────────────────────
    # Normalize template IDs
    if template in ["data", "datascience", "data-science"]:
        template = "datascience"
    elif template in ["blank", "fresh", "start-fresh"]:
        template = "fresh"

    if template == "fresher":
        section_order = ["contact", "summary", "education", "skills", "projects", "experience", "certifications"]
    elif template == "experienced":
        section_order = ["contact", "summary", "experience", "skills", "projects", "education", "certifications"]
    elif template == "datascience":
        section_order = ["contact", "summary", "skills", "projects", "experience", "education", "certifications"]
    else:
        section_order = ["contact", "summary", "experience", "education", "skills", "projects", "certifications"]

    # Enhance experience bullets for experienced template
    enhanced_experience = req.experience
    if template in ["experienced"] and req.experience:
        exp_text = "\n".join(req.experience[:5])
        enhanced_raw = call_gemini(
            f"Rewrite these work experience bullet points for an experienced professional. "
            f"Add metrics, numbers, and strong action verbs. Keep each bullet under 2 lines.\n{exp_text}"
        )
        enhanced_experience = [l.strip().lstrip("•-").strip() for l in enhanced_raw.split("\n") if l.strip()][:8]

    # Enhance project bullets for fresher/datascience
    enhanced_projects = req.projects
    if template in ["fresher", "data"] and req.projects:
        proj_text = "\n".join(req.projects[:5])
        enhanced_raw = call_gemini(
            f"Rewrite these project descriptions to be more impactful. "
            f"For {'fresher' if template=='fresher' else 'Data Science/ML'} roles. Add tech stack used and impact/results.\n{proj_text}"
        )
        enhanced_projects = [l.strip().lstrip("•-").strip() for l in enhanced_raw.split("\n") if l.strip()][:8]

    sections = {
        "contact": {"name": req.name, "email": req.email, "phone": req.phone, "location": req.location, "linkedin": req.linkedin, "github": req.github},
        "summary": enhanced_summary,
        "experience": enhanced_experience,
        "education": req.education,
        "skills": req.skills,
        "projects": enhanced_projects,
        "certifications": req.certifications,
        "section_order": section_order,
        "template": template,
    }

    full_text = f"{req.name} {req.email} {req.phone} {enhanced_summary} {' '.join(req.skills)}"
    ats = ats_score(full_text, list(extract_skills(full_text)), [])
    return {"resume_sections": sections, "ats_preview_score": ats["ats_score"], "ats_tips": ats["ats_tips"]}

# ── 3. Mock Interview ──────────────────────────────────────────────────────────
class InterviewStartRequest(BaseModel):
    job_role: str
    resume_text: str = ""
    difficulty: str = "medium"

@app.post("/interview/start")
async def start_interview(req: InterviewStartRequest):
    prompt = f"""Generate 5 interview questions for a {req.job_role} role.
Difficulty: {req.difficulty}
{"Resume context: " + req.resume_text[:500] if req.resume_text else ""}
Mix: 2 technical, 2 behavioral, 1 situational.
Format: numbered 1-5. Just questions."""
    raw = call_gemini(prompt)
    questions = [re.sub(r'^\d+\.\s*', '', l.strip()) for l in raw.split("\n") if re.match(r'^\d+\.', l.strip())][:5]
    return {"questions": questions, "job_role": req.job_role, "difficulty": req.difficulty}

class InterviewEvalRequest(BaseModel):
    question: str
    answer: str
    job_role: str = ""

@app.post("/interview/evaluate")
async def evaluate_answer(req: InterviewEvalRequest):
    prompt = f"""You are an expert interviewer. Evaluate this answer briefly.
Job Role: {req.job_role or "Software Developer"}
Question: {req.question}
Answer: {req.answer}

Give:
1. Score (out of 10)
2. What was good (1 point)
3. What to improve (1 point)
4. Better sample answer (2 sentences)
Keep it short and constructive."""
    feedback = call_gemini(prompt)
    return {"feedback": feedback, "question": req.question}

# ── 5. Salary Estimator ────────────────────────────────────────────────────────
class SalaryRequest(BaseModel):
    skills: list = []
    role: str = ""
    experience_years: int = 0
    location: str = "India"

@app.post("/salary-estimate")
async def salary_estimate(req: SalaryRequest):
    skills_set = set(s.lower() for s in req.skills)
    result = get_salary(skills_set, req.experience_years, req.location, req.role)
    return result

# ── 6. Resume History Dashboard ────────────────────────────────────────────────
@app.get("/dashboard/{clerk_id}")
async def get_dashboard(clerk_id: str):
    if db is None: return {"analyses": [], "stats": {}}
    try:
        analyses = list(db.analyses.find({"clerk_user_id": clerk_id}, {"resume_text": 0, "job_description": 0}).sort("created_at", -1).limit(20))
        for a in analyses: a["_id"] = str(a["_id"])
        total = len(analyses)
        avg_match = round(sum(a.get("match_score", 0) for a in analyses) / total, 1) if total else 0
        avg_ats   = round(sum(a.get("ats_score", 0) for a in analyses) / total, 1) if total else 0
        best = max(analyses, key=lambda x: x.get("match_score", 0)) if analyses else None
        return {
            "analyses": analyses,
            "stats": {
                "total_analyses": total,
                "avg_match_score": avg_match,
                "avg_ats_score": avg_ats,
                "best_match": best.get("match_score") if best else 0,
                "improvement": round(analyses[0].get("match_score", 0) - analyses[-1].get("match_score", 0), 1) if total > 1 else 0,
            }
        }
    except Exception as e: raise HTTPException(500, str(e))

# ── Interview Prep Roadmap ────────────────────────────────────────────────────
class RoadmapRequest(BaseModel):
    company: str
    role: str
    experience_years: int = 0
    resume_text: str = ""

@app.post("/interview-roadmap")
async def interview_roadmap(req: RoadmapRequest):
    if not req.company.strip() or not req.role.strip():
        raise HTTPException(400, "Company and role are required")

    level = "fresher" if req.experience_years < 2 else "mid" if req.experience_years < 5 else "senior"

    prompt = f"""Create interview prep roadmap for {req.company} - {req.role} ({level}).

Use EXACTLY this format:

COMPANY OVERVIEW
- Point 1 about {req.company} culture
- Point 2 about interview process
- Point 3 about what they look for

TECHNICAL TOPICS
- Topic 1 [High]
- Topic 2 [High]
- Topic 3 [Medium]
- Topic 4 [Medium]
- Topic 5 [Medium]
- Topic 6 [Medium]

WEEK-WISE PLAN
Week 1: Task 1. Task 2.
Week 2: Task 1. Task 2.
Week 3: Task 1. Task 2.
Week 4: Task 1. Task 2.

MUST PRACTICE
- Problem 1
- Problem 2
- Problem 3
- Problem 4

INTERVIEW TIPS
- Tip 1 for {req.company}
- Tip 2 for {req.company}
- Tip 3 for {req.company}

No markdown bold, no extra explanation, follow format exactly."""

    roadmap_text = call_groq(prompt, max_tokens=900)

    # Parse sections
    sections = {}
    current_section = None
    current_content = []

    for line in roadmap_text.split("\n"):
        line = line.strip()
        if not line:
            continue
        # Detect section headers
        if any(kw in line.upper() for kw in ['COMPANY OVERVIEW','TECHNICAL TOPICS','WEEK-WISE','MUST PRACTICE','RESOURCES','INTERVIEW TIPS']):
            if current_section:
                sections[current_section] = "\n".join(current_content).strip()
            current_section = line.replace('**','').replace(':','').strip()
            current_content = []
        else:
            current_content.append(line)

    if current_section:
        sections[current_section] = "\n".join(current_content).strip()

    # Estimate time based on experience
    weeks = 2 if req.experience_years >= 3 else 4

    return {
        "company": req.company,
        "role": req.role,
        "experience_years": req.experience_years,
        "level": level,
        "weeks_needed": weeks,
        "sections": sections,
        "raw": roadmap_text
    }

# ── Chat ──────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip(): raise HTTPException(400, "Empty message")
    history = "\n".join(f"{'User' if m['role']=='user' else 'HireBot'}: {m['text']}" for m in req.history[-6:])
    prompt = f"""You are HireBot, a friendly AI career assistant. Help with resumes, ATS, interviews, salary negotiation.
Keep answers 2-4 sentences. Be friendly and actionable.
{history}
User: {req.message}
HireBot:"""
    reply = call_groq(prompt)
    if reply.lower().startswith("hirebot:"): reply = reply[8:].strip()
    return {"reply": reply}