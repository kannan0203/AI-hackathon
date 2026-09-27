import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from services.data_loader import detect_columns

def get_revenue_trend_chart(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    date_col = col_map.get("date")

    if not date_col or not sales_col:
        return []

    df_temp = df.copy()
    df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
    try:
        df_temp[date_col] = pd.to_datetime(df_temp[date_col], errors='coerce')
        df_temp = df_temp.dropna(subset=[date_col])
        df_temp["month"] = df_temp[date_col].dt.to_period("M").astype(str)
        trend = df_temp.groupby("month")[sales_col].sum().reset_index()
        trend.columns = ["month", "revenue"]
        return trend.sort_values("month").to_dict(orient="records")
    except Exception:
        return []

def get_product_chart(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    product_col = col_map.get("product")

    if not product_col or not sales_col:
        return []

    df_temp = df.copy()
    df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
    result = df_temp.groupby(product_col)[sales_col].sum().reset_index()
    result.columns = ["product", "revenue"]
    return result.sort_values("revenue", ascending=False).to_dict(orient="records")

def get_region_chart(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    region_col = col_map.get("region")

    if not region_col or not sales_col:
        return []

    df_temp = df.copy()
    df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
    result = df_temp.groupby(region_col)[sales_col].sum().reset_index()
    result.columns = ["region", "revenue"]
    return result.sort_values("revenue", ascending=False).to_dict(orient="records")

def get_category_chart(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    category_col = col_map.get("category")

    if not category_col or not sales_col:
        return []

    df_temp = df.copy()
    df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
    result = df_temp.groupby(category_col)[sales_col].sum().reset_index()
    result.columns = ["category", "revenue"]
    return result.sort_values("revenue", ascending=False).to_dict(orient="records")
