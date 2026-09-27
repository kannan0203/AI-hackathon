import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from services.data_loader import detect_columns

def detect_anomalies(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    product_col = col_map.get("product")
    region_col = col_map.get("region")
    date_col = col_map.get("date")

    anomalies = []

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors='coerce').dropna()
        if len(series) < 4:
            continue

        Q1 = series.quantile(0.25)
        Q3 = series.quantile(0.75)
        IQR = Q3 - Q1

        if IQR == 0:
            continue

        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR

        anomaly_mask = (
            df[col].apply(lambda x: pd.to_numeric(x, errors='coerce')) < lower
        ) | (
            df[col].apply(lambda x: pd.to_numeric(x, errors='coerce')) > upper
        )

        anomaly_indices = df[anomaly_mask].index.tolist()

        for idx in anomaly_indices[:20]:  # limit to 20 per column
            row = df.loc[idx]
            val = pd.to_numeric(row[col], errors='coerce')

            if pd.isna(val):
                continue

            severity = "high" if (val > upper * 1.5 or val < lower * 1.5) else "medium"

            anomaly = {
                "row_index": int(idx),
                "column": col,
                "value": float(val),
                "lower_bound": round(float(lower), 2),
                "upper_bound": round(float(upper), 2),
                "severity": severity,
                "source_row": {k: str(v) for k, v in row.to_dict().items()}
            }

            if date_col and date_col in df.columns:
                anomaly["date"] = str(row.get(date_col, ""))
            if product_col and product_col in df.columns:
                anomaly["product"] = str(row.get(product_col, ""))
            if region_col and region_col in df.columns:
                anomaly["region"] = str(row.get(region_col, ""))

            anomalies.append(anomaly)

    # Remove duplicates by row_index keeping only highest severity
    seen = {}
    for a in anomalies:
        idx = a["row_index"]
        if idx not in seen or a["severity"] == "high":
            seen[idx] = a

    return list(seen.values())[:50]  # limit total anomalies
