from google import genai
from dotenv import load_dotenv
import os

load_dotenv()


def generate_bias_report(audit_results: dict) -> str:
    # Ensure environment variables are loaded if not already
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        return "AI report generation failed: GEMINI_API_KEY not found in environment."

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        return f"AI report generation failed to initialize client: {str(e)}"

    dp = audit_results.get("demographic_parity", {})
    eo = audit_results.get("equalized_odds", {})
    grps = dp.get("group_rates", {})

    prompt = f"""
    You are a professional AI auditor. Analyze these bias audit metrics and write a clear, 3-paragraph summary for a business audience.
    
    - Demographic Parity Gap: {dp.get('gap_percent')}% (Status: {dp.get('status')})
    - Group Approval Rates: {grps}
    - Equalized Odds Gap: {eo.get('gap_percent')}% (Status: {eo.get('status')})

    Structure your report:
    Paragraph 1: Summary of the findings in simple terms.
    Paragraph 2: Potential real-world ethical risks if this model is used.
    Paragraph 3: Recommendations for the data science team.

    Keep it concise (150-200 words). Do not use bullet points or code. Use plain text only.
    """

    # Use only models that actually exist to prevent 404 errors. 
    models_to_try = [
        "gemini-1.5-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.5-pro"
    ]
    
    last_errors = []
    for model_name in models_to_try:
        try:
            print(f"Trying model: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as e:
            err_msg = str(e)
            print(f"Failed with {model_name}: {err_msg}")
            last_errors.append(f"{model_name}: {err_msg}")
            continue
            
    return f"AI report generation unavailable. Tried models: {', '.join(last_errors)}. Please check your Google AI Studio quota or API key status."