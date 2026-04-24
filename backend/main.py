from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from report_gen import generate_bias_report
import pandas as pd
import joblib
import io

from bias_engine import run_bias_audit

app = FastAPI(title="FairLens API")

# Define allowed origins
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://failens-prototype.vercel.app",
    "https://fairlens-prototype.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/")
def home():
    return {"message": "FairLens API is running"}

@app.post("/audit")
async def audit(
    dataset:       UploadFile = File(...),
    model_file:    UploadFile = File(...),
    sensitive_col: str = Form(default="sex"),
    label_col:     str = Form(default="income")
):
    csv_bytes   = await dataset.read()
    model_bytes = await model_file.read()

    df    = pd.read_csv(io.BytesIO(csv_bytes))
    
    # Validation: Check if columns exist (case-insensitive)
    actual_cols = {c.strip().lower(): c for c in df.columns}
    
    # Check Sensitive Column
    s_col_lower = sensitive_col.lower()
    if s_col_lower in actual_cols:
        sensitive_col = actual_cols[s_col_lower]
    elif s_col_lower == 'gender' and 'sex' in actual_cols:
        sensitive_col = actual_cols['sex']
    elif s_col_lower == 'sex' and 'gender' in actual_cols:
        sensitive_col = actual_cols['gender']
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Sensitive column '{sensitive_col}' not found. Available: {list(df.columns)}"
        )

    # Check Label Column
    l_col_lower = label_col.lower()
    if l_col_lower in actual_cols:
        label_col = actual_cols[l_col_lower]
    elif l_col_lower == 'target' and 'income' in actual_cols:
        label_col = actual_cols['income']
    elif l_col_lower == 'income' and 'target' in actual_cols:
        label_col = actual_cols['target']
    else:
        # Fallback: if label_col is default "income" but missing, try to find "target"
        if l_col_lower == 'income' and 'target' in actual_cols:
            label_col = actual_cols['target']
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Label column '{label_col}' not found. Available: {list(df.columns)}"
            )
    
    # Load model bundle (could be dict with encoders or just model)
    bundle = joblib.load(io.BytesIO(model_bytes))
    
    if isinstance(bundle, dict):
        model = bundle.get("model")
        encoders = bundle.get("encoders")
    else:
        model = bundle
        encoders = None

    results = run_bias_audit(df, model, sensitive_col, label_col, encoders=encoders)
    
    try:
        results["ai_report"] = generate_bias_report(results)
    except Exception as e:
        print(f"AI Report generation failed: {e}")
        results["ai_report"] = "AI report generation currently unavailable. Please check backend logs or your Gemini API key."
        
    return results
