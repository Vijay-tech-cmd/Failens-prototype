import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from fairlearn.metrics import (
    demographic_parity_difference,
    MetricFrame
)
from sklearn.metrics import accuracy_score

def run_bias_audit(df, model, sensitive_col, label_col):

    # Step A: Clean string columns
    df = df.copy()
    for col in df.select_dtypes(include=['object', 'str']).columns:
        df[col] = df[col].str.strip()

    # Step B: Binary encode the label column
    # >50K = 1, <=50K = 0
    df[label_col] = (df[label_col] == '>50K').astype(int)

    # Step C: Encode all other text columns for the model
    df_enc = df.copy()
    le = LabelEncoder()
    for col in df_enc.select_dtypes(include=['object', 'str']).columns:
        df_enc[col] = le.fit_transform(df_enc[col].astype(str))

    # Step D: Separate features, labels, groups
    X       = df_enc.drop(columns=[label_col])
    y_true  = df_enc[label_col].values      # 0s and 1s
    groups  = df[sensitive_col].values      # original text: Male / Female

    # Step E: Run the model
    predictions = model.predict(X)

    # Step F: Demographic Parity
    dp_gap = demographic_parity_difference(
        y_true, predictions, sensitive_features=groups
    )

    # Step G: Equalized Odds — compute manually (no pos_label needed)
    def tpr(y_t, y_p):
        # True positive rate = correct positives / all actual positives
        mask = y_t == 1
        if mask.sum() == 0:
            return 0.0
        return (y_p[mask] == 1).mean()

    def fpr(y_t, y_p):
        # False positive rate = wrong positives / all actual negatives
        mask = y_t == 0
        if mask.sum() == 0:
            return 0.0
        return (y_p[mask] == 1).mean()

    groups_unique = df[sensitive_col].unique()
    tpr_vals, fpr_vals = {}, {}
    for g in groups_unique:
        mask = groups == g
        tpr_vals[g] = round(tpr(y_true[mask], predictions[mask]) * 100, 2)
        fpr_vals[g] = round(fpr(y_true[mask], predictions[mask]) * 100, 2)

    eo_gap = max(
        abs(max(tpr_vals.values()) - min(tpr_vals.values())),
        abs(max(fpr_vals.values()) - min(fpr_vals.values()))
    )

    # Step H: Per-group approval rates
    df['prediction'] = predictions
    group_rates = (
        df.groupby(sensitive_col)['prediction']
        .mean()
        .mul(100)
        .round(2)
        .to_dict()
    )

    # Step I: Per-group accuracy
    mf = MetricFrame(
        metrics=accuracy_score,
        y_true=y_true,
        y_pred=predictions,
        sensitive_features=groups
    )
    group_accuracy = {
        k: round(float(v) * 100, 2)
        for k, v in mf.by_group.items()
    }

    return {
        "demographic_parity": {
            "gap_percent": round(abs(dp_gap) * 100, 2),
            "status": "FAIL" if abs(dp_gap) > 0.05 else "PASS",
            "group_rates": group_rates
        },
        "equalized_odds": {
            "gap_percent": round(eo_gap, 2),
            "status": "FAIL" if eo_gap > 5 else "PASS",
            "tpr_by_group": tpr_vals,
            "fpr_by_group": fpr_vals
        },
        "group_accuracy": group_accuracy,
        "total_rows": len(df),
        "sensitive_column": sensitive_col
    }