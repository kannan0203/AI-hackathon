import pandas as pd
import numpy as np
import os
from typing import Tuple, Optional

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SALES_COLS = ["sales", "revenue", "amount", "total_sales", "total_revenue", "income", "price", "total", "value"]
PRODUCT_COLS = ["product", "product_name", "item", "item_name", "product_id", "sku", "name"]
REGION_COLS = ["region", "location", "area", "territory", "city", "state", "country", "zone"]
DATE_COLS = ["date", "order_date", "transaction_date", "month", "year", "period", "time", "datetime", "created_at"]
QTY_COLS = ["quantity", "qty", "units", "count", "volume", "number", "num"]
CATEGORY_COLS = ["category", "type", "segment", "group", "class", "department"]
CUSTOMER_COLS = ["customer", "customer_type", "client", "buyer", "user", "customer_id", "customer_segment"]

def find_column(df: pd.DataFrame, candidates: list) -> Optional[str]:
    cols_lower = {c.lower(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in cols_lower:
            return cols_lower[candidate.lower()]
    return None

def detect_columns(df: pd.DataFrame) -> dict:
    return {
        "sales": find_column(df, SALES_COLS),
        "product": find_column(df, PRODUCT_COLS),
        "region": find_column(df, REGION_COLS),
        "date": find_column(df, DATE_COLS),
        "quantity": find_column(df, QTY_COLS),
        "category": find_column(df, CATEGORY_COLS),
        "customer": find_column(df, CUSTOMER_COLS),
    }

def load_file(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(file_path)
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
    return df

def get_preview(df: pd.DataFrame, n: int = 10) -> list:
    preview = df.head(n).copy()
    for col in preview.columns:
        preview[col] = preview[col].astype(str)
    return preview.to_dict(orient="records")

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in df.columns:
        if df[col].dtype == object:
            try:
                df[col] = pd.to_datetime(df[col])
            except (ValueError, TypeError):
                pass
    return df

current_df: Optional[pd.DataFrame] = None
current_filename: str = ""
current_col_map: dict = {}

def set_current_dataset(df: pd.DataFrame, filename: str):
    global current_df, current_filename, current_col_map
    current_df = df
    current_filename = filename
    current_col_map = detect_columns(df)

def get_current_dataset():
    return current_df, current_filename, current_col_map
