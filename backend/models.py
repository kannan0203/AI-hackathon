from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class UploadResponse(BaseModel):
    success: bool
    filename: str
    file_size: int
    rows: int
    columns: int
    column_names: List[str]
    preview: List[Dict[str, Any]]
    message: str

class DataProfile(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: int
    duplicate_rows: int
    numeric_columns: List[str]
    categorical_columns: List[str]
    date_columns: List[str]
    data_quality_score: float

class KPIData(BaseModel):
    total_revenue: Optional[float] = None
    avg_revenue: Optional[float] = None
    total_quantity: Optional[int] = None
    top_product: Optional[str] = None
    best_region: Optional[str] = None
    num_customers: Optional[int] = None
    growth_pct: Optional[float] = None
    revenue_trend: Optional[List[Dict]] = None
    sales_by_product: Optional[List[Dict]] = None
    sales_by_region: Optional[List[Dict]] = None
    top5_products: Optional[List[Dict]] = None

class QueryRequest(BaseModel):
    question: str
    dataset_name: Optional[str] = None

class QueryResponse(BaseModel):
    question: str
    answer: str
    evidence: Dict[str, Any]
    calculation: str
    source_data: List[Dict[str, Any]]
    business_impact: str
    recommendation: str
    chart_data: Optional[Dict] = None

class Anomaly(BaseModel):
    row_index: int
    column: str
    value: float
    lower_bound: float
    upper_bound: float
    severity: str
    date: Optional[str] = None
    product: Optional[str] = None
    region: Optional[str] = None
    source_row: Dict[str, Any] = {}

class Insight(BaseModel):
    title: str
    description: str
    evidence: Dict[str, Any]
    category: str
    importance: str

class DecisionRequest(BaseModel):
    question: str
    dataset_name: Optional[str] = None

class DecisionResponse(BaseModel):
    question: str
    analysis: str
    key_findings: List[str]
    recommendation: str
    confidence: str
    supporting_data: Dict[str, Any]
