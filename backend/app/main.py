import sys
import pathlib

# Add backend directory to sys.path to allow running from any directory
backend_dir = pathlib.Path(__file__).parent.parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import lead, email_log  # noqa: F401 — ensure models are registered
from app.api import leads, templates, settings, campaign, logs, dashboard, webhooks, tracking

# Run simple SQLite migrations for the new columns if the DB already exists

def run_migrations():
    import sqlite3
    import os
    from app.database import BASE_DIR
    db_path = os.path.join(BASE_DIR, 'email_automation.db')
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        # Check if email_logs table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='email_logs'")
        if not cursor.fetchone():
            return
        
        cursor.execute("PRAGMA table_info(email_logs)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "opened" not in columns:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN opened BOOLEAN DEFAULT 0")
        if "opened_at" not in columns:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN opened_at DATETIME")
        if "resend_email_id" not in columns:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN resend_email_id VARCHAR(255)")
        if "clicked" not in columns:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN clicked BOOLEAN DEFAULT 0")
        if "clicked_at" not in columns:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN clicked_at DATETIME")
        if "click_count" not in columns:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN click_count INTEGER DEFAULT 0")
        conn.commit()
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        conn.close()

run_migrations()

# Create all tables on startup
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Email Automation API",
    version="1.0.0",
    description="Internal email campaign automation tool powered by Resend API.",
)

# CORS — allow frontend dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(campaign.router, prefix="/api/campaign", tags=["Campaign"])
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(tracking.router, prefix="/api/track", tags=["Tracking"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "AI Email Automation API is running."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

