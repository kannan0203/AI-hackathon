from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
import pandas as pd
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()

from database import init_db, get_db, QueryHistory, Dataset
from models import QueryRequest, DecisionRequest
from services.data_loader import (
    load_file, get_preview, detect_columns, set_current_dataset,
    get_current_dataset, clean_dataframe, UPLOAD_DIR
)
from services.data_analyzer import (
    profile_dataset, compute_kpis, get_product_analysis,
    get_region_analysis, get_trend_analysis
)
from services.anomaly_detector import detect_anomalies
from services.ai_engine import (
    calculate_for_question, generate_ai_response, generate_insights,
    generate_decision_response, is_demo_mode
)
from services.chart_engine import (
    get_revenue_trend_chart, get_product_chart,
    get_region_chart, get_category_chart
)

app = FastAPI(title="BizInsight AI API", version="1.0.0")

# Allow localhost (dev) + any Vercel URL + custom domains from ALLOWED_ORIGINS env var
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@app.get("/api/health")
async def health_check():
    df, filename, _ = get_current_dataset()
    return {
        "status": "healthy",
        "demo_mode": is_demo_mode(),
        "dataset_loaded": df is not None,
        "dataset_name": filename if filename else None,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Allowed: CSV, XLSX, XLS"
            )

        file_path = os.path.join(UPLOAD_DIR, file.filename)
        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File is empty.")

        with open(file_path, "wb") as f:
            f.write(content)

        df = load_file(file_path)
        df = clean_dataframe(df)

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="File contains no data rows.")

        set_current_dataset(df, file.filename)

        preview = get_preview(df, 10)

        # Save to DB
        db_dataset = Dataset(
            filename=file.filename,
            file_size=len(content),
            rows=len(df),
            columns=len(df.columns),
            storage_path=file_path
        )
        db.add(db_dataset)
        db.commit()

        return {
            "success": True,
            "filename": file.filename,
            "file_size": len(content),
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "preview": preview,
            "message": f"Successfully loaded {len(df)} rows and {len(df.columns)} columns.",
            "detected_columns": detect_columns(df)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.get("/api/dataset")
async def get_dataset():
    df, filename, col_map = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded. Please upload a file first.")

    return {
        "filename": filename,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "detected_columns": col_map,
        "preview": get_preview(df, 10)
    }


@app.get("/api/profile")
async def get_profile():
    df, filename, _ = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    profile = profile_dataset(df)
    return profile


@app.get("/api/dashboard")
async def get_dashboard():
    df, filename, col_map = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    kpis = compute_kpis(df)
    profile = profile_dataset(df)
    anomalies = detect_anomalies(df)

    return {
        "kpis": kpis,
        "profile": profile,
        "anomaly_count": len(anomalies),
        "demo_mode": is_demo_mode(),
        "filename": filename,
        "charts": {
            "revenue_trend": get_revenue_trend_chart(df),
            "sales_by_product": get_product_chart(df),
            "sales_by_region": get_region_chart(df),
            "sales_by_category": get_category_chart(df)
        }
    }


@app.get("/api/insights")
async def get_insights():
    df, filename, _ = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    insights = generate_insights(df)
    return {"insights": insights, "count": len(insights)}


@app.get("/api/anomalies")
async def get_anomalies():
    df, filename, _ = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    anomalies = detect_anomalies(df)
    return {"anomalies": anomalies, "count": len(anomalies)}


@app.post("/api/query")
async def query_data(request: QueryRequest, db: Session = Depends(get_db)):
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    df, filename, _ = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded. Please upload a file first.")

    try:
        # Calculate using pandas first
        calc_result = calculate_for_question(df, request.question)

        # Generate AI explanation
        ai_result = generate_ai_response(request.question, calc_result)

        # Build calculation string
        formula = calc_result["calculations"].get("formula", "Data aggregation and analysis")

        # Save to history
        history_entry = QueryHistory(
            dataset_name=filename,
            question=request.question,
            answer=ai_result["answer"],
            query_type="ai_query"
        )
        db.add(history_entry)
        db.commit()

        return {
            "question": request.question,
            "answer": ai_result["answer"],
            "evidence": calc_result["calculations"],
            "calculation": formula,
            "source_data": calc_result["source_rows"],
            "business_impact": ai_result["business_impact"],
            "recommendation": ai_result["recommendation"],
            "chart_data": calc_result.get("chart_data"),
            "demo_mode": is_demo_mode()
        }
    except Exception as e:
        print(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/api/decision")
async def make_decision(request: DecisionRequest, db: Session = Depends(get_db)):
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    df, filename, _ = get_current_dataset()
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    try:
        result = generate_decision_response(df, request.question)

        history_entry = QueryHistory(
            dataset_name=filename,
            question=request.question,
            answer=result["recommendation"],
            query_type="decision"
        )
        db.add(history_entry)
        db.commit()

        return result
    except Exception as e:
        print(f"Decision error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating decision: {str(e)}")


@app.get("/api/history")
async def get_history(db: Session = Depends(get_db)):
    history = db.query(QueryHistory).order_by(QueryHistory.timestamp.desc()).limit(50).all()
    return {
        "history": [
            {
                "id": h.id,
                "question": h.question,
                "answer": h.answer,
                "timestamp": h.timestamp.isoformat() if h.timestamp else None,
                "dataset_name": h.dataset_name,
                "query_type": h.query_type
            }
            for h in history
        ]
    }


@app.post("/api/load-sample")
async def load_sample_data(db: Session = Depends(get_db)):
    sample_path = os.path.join("data", "sample_business_data.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample data file not found.")

    try:
        df = load_file(sample_path)
        df = clean_dataframe(df)
        set_current_dataset(df, "sample_business_data.csv")

        file_size = os.path.getsize(sample_path)

        db_dataset = Dataset(
            filename="sample_business_data.csv",
            file_size=file_size,
            rows=len(df),
            columns=len(df.columns),
            storage_path=sample_path
        )
        db.add(db_dataset)
        db.commit()

        return {
            "success": True,
            "filename": "sample_business_data.csv",
            "file_size": file_size,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "preview": get_preview(df, 10),
            "message": f"Sample data loaded: {len(df)} rows, {len(df.columns)} columns.",
            "detected_columns": detect_columns(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading sample data: {str(e)}")
