import pandas as pd
import re
import io
from typing import List, Dict


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def parse_file(file_bytes: bytes, filename: str) -> List[Dict]:
    """
    Parse CSV or XLSX file bytes and return a list of validated lead dicts.
    Tolerates any column naming structure: searches for the email column, 
    then optionally for name and company columns, defaulting values if missing.
    Invalid/duplicate rows are silently dropped.
    """
    filename_lower = filename.lower()

    if filename_lower.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename_lower.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file type. Please upload a CSV or XLSX file.")

    if df.empty:
        return []

    # Clean the column names (original casing preserved in mapping)
    orig_cols = list(df.columns)
    clean_cols = [str(c).strip().lower() for c in orig_cols]
    
    # 1. Find email column
    email_col_name = None
    
    # Check exact/alias match first
    email_aliases = ["email", "email address", "e-mail", "mail"]
    for alias in email_aliases:
        if alias in clean_cols:
            idx = clean_cols.index(alias)
            email_col_name = orig_cols[idx]
            break
            
    # Check substring match second
    if not email_col_name:
        for idx, col in enumerate(clean_cols):
            if "email" in col or "mail" in col:
                email_col_name = orig_cols[idx]
                break
                
    # Check values containing '@' in first 10 rows third
    if not email_col_name:
        for orig_col in orig_cols:
            sample_vals = df[orig_col].dropna().head(10).astype(str)
            email_count = sum(1 for v in sample_vals if "@" in v and bool(EMAIL_REGEX.match(v.strip())))
            if email_count > 0:
                email_col_name = orig_col
                break

    if not email_col_name:
        raise ValueError(
            "Could not detect an email column in the spreadsheet. "
            "Please ensure your file has an 'email' column or contains valid email addresses."
        )

    # 2. Find name column
    name_col_name = None
    name_aliases = ["name", "full name", "fullname", "contact name", "first name", "last name"]
    for alias in name_aliases:
        if alias in clean_cols:
            idx = clean_cols.index(alias)
            name_col_name = orig_cols[idx]
            break
            
    if not name_col_name:
        for idx, col in enumerate(clean_cols):
            if "name" in col or "contact" in col or "lead" in col:
                name_col_name = orig_cols[idx]
                break

    # 3. Find company column
    company_col_name = None
    company_aliases = ["company", "company name", "organization", "org", "firm", "business"]
    for alias in company_aliases:
        if alias in clean_cols:
            idx = clean_cols.index(alias)
            company_col_name = orig_cols[idx]
            break
            
    if not company_col_name:
        for idx, col in enumerate(clean_cols):
            if "company" in col or "org" in col or "firm" in col or "business" in col:
                company_col_name = orig_cols[idx]
                break

    # Process and build list of dicts
    leads = []
    seen_emails = set()
    
    for _, row in df.iterrows():
        # Get raw email
        email_val = row[email_col_name]
        if pd.isna(email_val):
            continue
        email = str(email_val).strip().lower()
        
        # Validate email format
        if not email or not EMAIL_REGEX.match(email):
            continue
            
        # Deduplicate
        if email in seen_emails:
            continue
        seen_emails.add(email)
        
        # Get name
        name = "Lead"  # default
        if name_col_name is not None and not pd.isna(row[name_col_name]):
            name_val = str(row[name_col_name]).strip()
            if name_val:
                name = name_val
        if name == "Lead" and "@" in email:
            # derive name from email prefix
            name = email.split("@")[0].capitalize()
            
        # Get company
        company = ""
        if company_col_name is not None and not pd.isna(row[company_col_name]):
            company_val = str(row[company_col_name]).strip()
            if company_val:
                company = company_val
                
        leads.append({
            "name": name,
            "email": email,
            "company": company
        })
        
    return leads

