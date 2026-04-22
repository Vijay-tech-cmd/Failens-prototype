import pandas as pd 
import joblib
from bias_engine import run_bias_audit

df = pd.read_csv('adult_census.csv')
model = joblib.load("demo_model.pkl")

result = run_bias_audit(df, model, 'sex', 'income')

import json 
print(json.dumps(result, indent=2))