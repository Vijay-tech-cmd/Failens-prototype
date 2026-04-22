from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from report_gen import generate_bias_report
import pandas as pd
import joblib
import io

from bias_engine import run_bias_audit

app = FastAPI(title="FairLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
    model = joblib.load(io.BytesIO(model_bytes))

    results = run_bias_audit(df, model, sensitive_col, label_col)
    results["ai_report"] = generate_bias_report(results)
    return results
