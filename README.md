# 🧠 BizInsight AI
### *From Raw Data to Explainable Decisions.*

> An AI-powered business data analysis platform that transforms your CSV/Excel data into explainable, evidence-backed business insights.

---

## 🎯 Problem Statement

Business leaders often receive AI-generated insights they can't verify. Black-box AI recommendations create mistrust and lead to poor decisions. **BizInsight AI** solves this by making every AI insight fully explainable — showing the exact calculations, source data, and evidence behind every answer.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📁 Smart Upload | CSV/Excel drag-and-drop with auto column detection |
| 📊 Executive Dashboard | Real-time KPI cards, trend charts, product & region analysis |
| 💬 AI Business Chat | Natural language questions with traceable, evidence-backed answers |
| 🔍 Explainable AI | Every answer shows calculations, source rows, business impact |
| ⚠️ Anomaly Detection | IQR-based statistical outlier detection |
| 💡 Auto Insights | 3-5 automatic insights generated from your dataset |
| 🧭 Decision Assistant | Data-backed strategic recommendations |
| 🎮 Demo Mode | Fully functional without an OpenAI API key |

---

## 🏗️ Architecture

```
User Browser (React + TypeScript + Vite)
        ↓ REST API calls
FastAPI Backend (Python)
        ↓ File parsing
Pandas / NumPy (Data processing)
        ↓ Aggregated evidence
OpenAI GPT-3.5 (Explanation only - no number invention)
        ↓ Structured response
SQLite (Query history + dataset metadata)
```

**Key Design Principle:** Python/Pandas does ALL calculations. The LLM only explains the pre-calculated results.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Recharts (charts)
- React Router v6
- React Dropzone

**Backend:**
- Python 3.9+
- FastAPI + Uvicorn
- Pandas + NumPy
- OpenPyXL (Excel support)
- SQLAlchemy + SQLite
- OpenAI SDK

---

## 📁 Project Structure

```
bizinsight-ai/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── main.py              # FastAPI app + endpoints
│   ├── database.py          # SQLite models
│   ├── models.py            # Pydantic schemas
│   ├── requirements.txt
│   ├── services/
│   │   ├── data_loader.py   # File loading + column detection
│   │   ├── data_analyzer.py # Pandas KPI calculations
│   │   ├── ai_engine.py     # OpenAI integration + demo mode
│   │   ├── chart_engine.py  # Chart data generation
│   │   └── anomaly_detector.py  # IQR anomaly detection
│   └── data/
│       └── sample_business_data.csv
│
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.9+ 
- Node.js 18+
- npm or yarn

### 1. Clone / Download the project

```bash
cd "d:\krish project\bizinsight-ai"
```

### 2. Environment Variables

```bash
# Copy the example file
copy .env.example .env

# Edit .env and add your OpenAI key (optional - app works without it)
# OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

API docs at: http://localhost:8000/docs

### 4. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 🎮 Demo Instructions

### Full Demo Flow (Hackathon Presentation)

**STEP 1:** Open http://localhost:5173

**STEP 2:** Click **"Try Demo"** button on the landing page

**STEP 3:** Sample data loads automatically (120 rows of business data)

**STEP 4:** View the **Executive Dashboard** with:
- Total Revenue KPI
- Average Transaction Value
- Top Product
- Best Region
- Revenue Trend chart
- Sales by Product chart
- Regional Sales distribution

**STEP 5:** Navigate to **AI Analyst** tab

**STEP 6:** Ask: *"Which product is performing worst?"*
- See the traceable answer with Evidence, Calculation, Source Data, and Recommendation

**STEP 7:** Ask: *"Why did sales decrease?"*
- See a trend chart and month-over-month analysis

**STEP 8:** Navigate to **Anomalies** tab
- See statistical outliers with IQR bounds and source rows

**STEP 9:** Navigate to **Decision Assistant** tab
- Ask: *"What should I focus on next month?"*
- See data-backed strategic recommendation

**STEP 10:** Navigate to **Insights** tab
- See 5 auto-generated insights with expandable evidence

---

## 💬 Test Questions for AI Analyst

```
Revenue Questions:
- "What is my total revenue?"
- "What is the average transaction value?"

Product Questions:
- "Which product is performing best?"
- "Which product is performing worst?"
- "What are my top 5 products?"
- "Which products need attention?"

Regional Questions:
- "Which region is performing best?"
- "Which region should I focus on?"

Trend Questions:
- "Why did sales decrease?"
- "Show me the revenue trend"
- "What is the month-over-month growth?"

Anomaly Questions:
- "Are there any unusual transactions?"
- "Show me outliers in the data"
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health + demo mode status |
| POST | `/api/upload` | Upload CSV/XLSX file |
| POST | `/api/load-sample` | Load sample dataset |
| GET | `/api/dataset` | Get current dataset info |
| GET | `/api/profile` | Data quality profile |
| GET | `/api/dashboard` | KPIs + charts data |
| GET | `/api/insights` | Auto-generated insights |
| GET | `/api/anomalies` | Anomaly detection results |
| POST | `/api/query` | Natural language query |
| POST | `/api/decision` | Decision assistant |
| GET | `/api/history` | Query history |

Full interactive API docs: http://localhost:8000/docs

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | No | OpenAI API key. Leave empty for Demo Mode. |
| `BACKEND_HOST` | No | Backend host (default: localhost) |
| `BACKEND_PORT` | No | Backend port (default: 8000) |
| `VITE_API_URL` | No | Frontend API URL |

---

## 🐳 Docker Setup (Optional)

```bash
# From the project root
docker-compose up --build
```

This starts both frontend and backend containers.

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Make sure you're in the backend directory with venv activated
cd backend
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend can't connect to backend
- Make sure backend is running on port 8000
- The Vite proxy forwards `/api` to `http://localhost:8000`
- Check `vite.config.ts` proxy settings

### File upload fails
- Ensure file is CSV, XLSX, or XLS format
- Max file size: 50MB
- File must not be empty

### Demo Mode showing
- App works in Demo Mode without an API key
- To enable AI: add `OPENAI_API_KEY=your_key` to `.env`
- Restart the backend after adding the key

### Python import errors
```bash
pip install -r requirements.txt
```

---

## 🤖 AI Architecture

```
User Question
     ↓
Question Type Detection (keyword matching)
     ↓
Pandas Calculation (local, no AI)
     ↓
Evidence Summary (compact, no raw data)
     ↓
OpenAI GPT-3.5 (explanation only)
     ↓
Structured Response (answer + evidence + recommendation)
```

**Why this approach?**
1. **Accuracy:** Pandas never invents numbers
2. **Cost:** Only small evidence summaries sent to OpenAI
3. **Privacy:** Raw business data never leaves your server
4. **Speed:** Local calculations are instant

---

## 🔮 Future Improvements

- [ ] User authentication & multi-tenant support
- [ ] Real-time data connectors (PostgreSQL, BigQuery, Salesforce)
- [ ] Forecasting with Prophet/ARIMA
- [ ] PDF/Excel report export
- [ ] Slack/Teams integration for alerts
- [ ] Custom dashboard builder
- [ ] Multi-dataset comparison
- [ ] Scheduled automatic reports
- [ ] GPT-4 support with larger context
- [ ] Column mapping UI for custom datasets

---

## 👥 Built For

This project was built as a **hackathon MVP** demonstrating:
- Explainable AI in business intelligence
- Evidence-based decision making
- No-code data analysis for business users

---

*BizInsight AI — "From Raw Data to Explainable Decisions."*
