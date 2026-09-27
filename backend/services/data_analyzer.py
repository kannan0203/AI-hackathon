import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from services.data_loader import detect_columns

def profile_dataset(df: pd.DataFrame) -> Dict:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    date_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

    # Try to detect date columns from object columns
    for col in categorical_cols[:]:
        try:
            pd.to_datetime(df[col], errors='raise')
            date_cols.append(col)
            categorical_cols.remove(col)
        except Exception:
            pass

    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())
    total = len(df)

    # Quality score
    missing_ratio = missing / (total * len(df.columns)) if total > 0 else 0
    dup_ratio = duplicates / total if total > 0 else 0
    quality_score = max(0, round((1 - missing_ratio - dup_ratio * 0.5) * 100, 1))

    return {
        "total_rows": total,
        "total_columns": len(df.columns),
        "missing_values": missing,
        "duplicate_rows": duplicates,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "date_columns": date_cols,
        "data_quality_score": quality_score,
    }

def compute_kpis(df: pd.DataFrame) -> Dict:
    col_map = detect_columns(df)
    kpis = {}

    sales_col = col_map.get("sales")
    product_col = col_map.get("product")
    region_col = col_map.get("region")
    date_col = col_map.get("date")
    qty_col = col_map.get("quantity")
    customer_col = col_map.get("customer")

    if sales_col and sales_col in df.columns:
        sales_data = pd.to_numeric(df[sales_col], errors='coerce').dropna()
        kpis["total_revenue"] = round(float(sales_data.sum()), 2)
        kpis["avg_revenue"] = round(float(sales_data.mean()), 2)
        kpis["min_revenue"] = round(float(sales_data.min()), 2)
        kpis["max_revenue"] = round(float(sales_data.max()), 2)

    if qty_col and qty_col in df.columns:
        qty_data = pd.to_numeric(df[qty_col], errors='coerce').dropna()
        kpis["total_quantity"] = int(qty_data.sum())

    if product_col and product_col in df.columns and sales_col and sales_col in df.columns:
        df_temp = df.copy()
        df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
        product_sales = df_temp.groupby(product_col)[sales_col].sum().sort_values(ascending=False)
        kpis["top_product"] = str(product_sales.index[0]) if len(product_sales) > 0 else None
        kpis["worst_product"] = str(product_sales.index[-1]) if len(product_sales) > 0 else None

        top5 = product_sales.head(5).reset_index()
        top5.columns = ["product", "sales"]
        kpis["top5_products"] = top5.to_dict(orient="records")

        all_products = product_sales.reset_index()
        all_products.columns = ["product", "sales"]
        kpis["sales_by_product"] = all_products.to_dict(orient="records")

    if region_col and region_col in df.columns and sales_col and sales_col in df.columns:
        df_temp = df.copy()
        df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
        region_sales = df_temp.groupby(region_col)[sales_col].sum().sort_values(ascending=False)
        kpis["best_region"] = str(region_sales.index[0]) if len(region_sales) > 0 else None
        region_data = region_sales.reset_index()
        region_data.columns = ["region", "sales"]
        kpis["sales_by_region"] = region_data.to_dict(orient="records")

    if customer_col and customer_col in df.columns:
        kpis["num_customers"] = int(df[customer_col].nunique())

    if date_col and date_col in df.columns and sales_col and sales_col in df.columns:
        df_temp = df.copy()
        df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
        try:
            df_temp[date_col] = pd.to_datetime(df_temp[date_col], errors='coerce')
            df_temp = df_temp.dropna(subset=[date_col])
            df_temp["month"] = df_temp[date_col].dt.to_period("M").astype(str)
            trend = df_temp.groupby("month")[sales_col].sum().reset_index()
            trend.columns = ["month", "sales"]
            trend = trend.sort_values("month")
            kpis["revenue_trend"] = trend.to_dict(orient="records")

            if len(trend) >= 2:
                last = trend["sales"].iloc[-1]
                prev = trend["sales"].iloc[-2]
                if prev > 0:
                    kpis["growth_pct"] = round(((last - prev) / prev) * 100, 2)
        except Exception as e:
            print(f"Date processing error: {e}")

    return kpis

def get_product_analysis(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    product_col = col_map.get("product")
    qty_col = col_map.get("quantity")

    if not product_col or not sales_col:
        return []

    df_temp = df.copy()
    df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')

    agg = {sales_col: ["sum", "mean", "count"]}
    if qty_col and qty_col in df.columns:
        df_temp[qty_col] = pd.to_numeric(df_temp[qty_col], errors='coerce')
        agg[qty_col] = "sum"

    result = df_temp.groupby(product_col).agg(agg).reset_index()
    result.columns = ["_".join(c).strip("_") if c[1] else c[0] for c in result.columns]
    return result.to_dict(orient="records")

def get_region_analysis(df: pd.DataFrame) -> List[Dict]:
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    region_col = col_map.get("region")

    if not region_col or not sales_col:
        return []

    df_temp = df.copy()
    df_temp[sales_col] = pd.to_numeric(df_temp[sales_col], errors='coerce')
    result = df_temp.groupby(region_col).agg(
        total_sales=(sales_col, "sum"),
        avg_sales=(sales_col, "mean"),
        transaction_count=(sales_col, "count")
    ).reset_index()
    result = result.sort_values("total_sales", ascending=False)
    return result.to_dict(orient="records")

def get_trend_analysis(df: pd.DataFrame) -> List[Dict]:
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
        trend = df_temp.groupby("month")[sales_col].agg(["sum", "mean", "count"]).reset_index()
        trend.columns = ["month", "total_sales", "avg_sales", "transactions"]
        trend = trend.sort_values("month")
        trend["mom_growth"] = trend["total_sales"].pct_change() * 100
        return trend.to_dict(orient="records")
    except Exception as e:
        print(f"Trend analysis error: {e}")
        return []
