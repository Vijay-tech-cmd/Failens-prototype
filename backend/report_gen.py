from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_bias_report(audit_results: dict) -> str:
    dp = audit_results.get("demographic_parity", {})
    eo = audit_results.get("equalized_odds", {})
    grps = dp.get("group_rates", {})

    prompt = f"""
    You are a responsible AI auditor writing a report for a non-technical business audience.

    BIAS AUDIT REPORT:
    -Demographic Parity Gap: {dp.get('gap_percent')} % Status: {dp.get('status')} Approval rates by group: {grps}
    -Equalized Odds Status: {eo.get('gap_percent')} % Status: {eo.get('status')}

Write a SHORT audit report with exactly 3 paragraphs:
1. What the audit found (plain English, no jargon)
2. Why this matters (real-world harm if deployed)
3. Top 2 fixes the team should implement

Keep it under 180 words. Be direct. No bullet points.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-04-17",
        contents=prompt
    )
    return response.text