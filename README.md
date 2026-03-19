# SmartHire AI

AI-powered resume analyzer with match scoring, ATS analysis, cover letter generation, and interview prep.

## Setup

### 1. Install root dependencies
```bash
npm install
```

### 2. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cd ..
```

### 4. Run everything
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Project Structure
```
smarthire/
├── package.json          # Root - runs both frontend & backend
├── frontend/
│   ├── src/
│   │   ├── pages/        # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # API calls
│   │   └── styles/       # CSS
│   └── .env.local        # Frontend env vars
└── backend/
    ├── main.py           # FastAPI backend
    ├── requirements.txt
    └── .env              # Backend env vars
```
