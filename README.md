# MailFlow — AI Email Automation Tool

An internal email automation tool. Upload a spreadsheet of leads, configure your Resend API key, personalize email templates, and fire off campaigns — all from a clean, minimal UI.

---

## Tech Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, TailwindCSS v3, Axios, React Query |
| Backend   | FastAPI, Python 3.11, SQLAlchemy, SQLite, Pandas, Resend API |
| Deploy    | Vercel (frontend) + Render (backend)     |

---

## Local Development — Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Resend](https://resend.com) account and API key

---

### 1. Clone / Open Project

```bash
cd "d:/SortyX Projects/mail automation"
```

---

### 2. Backend Setup

```bash
# Create virtual environment (in the project root)
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Start backend from the project root directly!
python backend/app/main.py
```

Backend runs at: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Project Structure

```
mail automation/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   │   ├── leads.py
│   │   │   ├── templates.py
│   │   │   ├── settings.py
│   │   │   ├── campaign.py
│   │   │   └── logs.py
│   │   ├── models/        # SQLAlchemy ORM models
│   │   │   ├── lead.py
│   │   │   └── email_log.py
│   │   ├── services/      # Business logic
│   │   │   ├── excel_parser.py
│   │   │   ├── template_engine.py
│   │   │   ├── email_sender.py
│   │   │   ├── campaign_runner.py
│   │   │   └── settings_service.py
│   │   ├── database.py
│   │   └── main.py
│   ├── templates/
│   │   ├── subject.txt    # Email subject template
│   │   └── body.txt       # Email body template
│   ├── config/
│   │   └── settings.json  # Sender email, API key, delay
│   ├── uploads/           # Uploaded spreadsheet files
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Templates.tsx
│   │   │   └── Logs.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── LeadTable.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StatusCard.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Configuration

### Resend API Key

1. Go to [resend.com](https://resend.com) → API Keys → Create Key
2. Open the app → **Dashboard** → enter your sender email and API key → **Save Settings**

> **Important:** Your sender domain must be verified in Resend before emails will deliver.

### Email Templates

Go to **Templates** page. Use these variables in your subject/body:

| Variable      | Replaced with           |
|---------------|-------------------------|
| `{{name}}`    | Lead's full name        |
| `{{email}}`   | Lead's email address    |
| `{{company}}` | Lead's company name     |

### Spreadsheet Format

The importer is highly flexible and accepts spreadsheets in any format as long as they contain an email column. It will automatically detect columns:
- **Email**: Searches for columns containing `email` or `mail`, or scans values for valid email addresses.
- **Name** (Optional): Searches for columns containing `name`, `contact`, or `lead`. If missing, it will automatically default to the name prefix of the email (e.g. `john` from `john@gmail.com`).
- **Company** (Optional): Searches for columns containing `company`, `org`, `firm`, or `business`. If missing, it defaults to empty.

---

## API Endpoints

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/api/leads/upload`       | Upload CSV/XLSX          |
| GET    | `/api/leads`              | List leads               |
| DELETE | `/api/leads/{id}`         | Delete lead              |
| GET    | `/api/templates`          | Get templates            |
| POST   | `/api/templates/save`     | Save templates           |
| POST   | `/api/templates/preview`  | Preview with sample data |
| GET    | `/api/settings`           | Get settings             |
| POST   | `/api/settings/save`      | Save settings            |
| POST   | `/api/campaign/start`     | Start campaign           |
| POST   | `/api/campaign/stop`      | Stop campaign            |
| GET    | `/api/campaign/status`    | Get campaign status      |
| GET    | `/api/logs`               | Get email logs           |

---

## Docker Deployment

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## Deploy to Vercel (Frontend)

1. Push `frontend/` to a GitHub repo
2. Import to [vercel.com](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable if needed:
   - `VITE_API_URL=https://your-backend.onrender.com`

Then update `frontend/src/services/api.ts` baseURL to your Render backend URL.

---

## Deploy to Render (Backend)

1. Push `backend/` to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
4. Add a persistent disk (mount path: `/app`) for SQLite + uploads

---

## Campaign Flow

```
Upload CSV/XLSX → Validate Leads → Save Templates → Configure Settings
       ↓
   Start Campaign
       ↓
   For each pending lead:
     - Render subject + body with {{variables}}
     - Send via Resend API
     - Retry once on failure
     - Wait N seconds (configurable delay)
     - Log result
       ↓
   Campaign Complete / Stopped
```

---

## License

Internal use only.
