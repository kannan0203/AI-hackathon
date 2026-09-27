import os
import json
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from services.data_loader import detect_columns
from services.data_analyzer import get_product_analysis, get_region_analysis, get_trend_analysis

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


def get_gemini_model():
    """Return a configured Gemini model or None if key missing."""
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key or api_key == "your_google_api_key_here":
        return None
    if not GEMINI_AVAILABLE:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        return None


def is_demo_mode() -> bool:
    api_key = os.getenv("GOOGLE_API_KEY", "")
    return not api_key or api_key == "your_google_api_key_here"


def calculate_for_question(df: pd.DataFrame, question: str) -> Dict[str, Any]:
    """Perform pandas calculations based on question type."""
    question_lower = question.lower()
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    product_col = col_map.get("product")
    region_col = col_map.get("region")
    date_col = col_map.get("date")
    qty_col = col_map.get("quantity")

    result = {
        "question_type": "general",
        "calculations": {},
        "source_rows": [],
        "chart_data": None
    }

    df_work = df.copy()
    if sales_col:
        df_work[sales_col] = pd.to_numeric(df_work[sales_col], errors='coerce')
    if qty_col and qty_col in df_work.columns:
        df_work[qty_col] = pd.to_numeric(df_work[qty_col], errors='coerce')

    # Revenue/Sales questions
    if any(kw in question_lower for kw in ["revenue", "sales", "total", "income", "amount"]):
        if sales_col:
            total = df_work[sales_col].sum()
            avg = df_work[sales_col].mean()
            result["question_type"] = "revenue"
            result["calculations"] = {
                "total_revenue": round(float(total), 2),
                "average_revenue": round(float(avg), 2),
                "min": round(float(df_work[sales_col].min()), 2),
                "max": round(float(df_work[sales_col].max()), 2),
                "count": int(df_work[sales_col].count()),
                "formula": f"SUM({sales_col}) = {round(float(total), 2)}"
            }
            result["source_rows"] = df.head(5).fillna("").astype(str).to_dict(orient="records")

    # Product questions
    if any(kw in question_lower for kw in ["product", "item", "sku"]):
        if product_col and sales_col:
            product_sales = df_work.groupby(product_col)[sales_col].agg(["sum", "mean", "count"])
            product_sales.columns = ["total_sales", "avg_sales", "transactions"]
            product_sales = product_sales.sort_values("total_sales", ascending=False)

            if qty_col and qty_col in df_work.columns:
                qty_by_product = df_work.groupby(product_col)[qty_col].sum()
                product_sales["total_quantity"] = qty_by_product

            result["question_type"] = "product"

            if any(kw in question_lower for kw in ["worst", "lowest", "poor", "bottom", "weak", "bad"]):
                worst = product_sales.iloc[-1]
                result["calculations"] = {
                    "worst_product": str(product_sales.index[-1]),
                    "worst_sales": round(float(worst["total_sales"]), 2),
                    "avg_sales": round(float(worst["avg_sales"]), 2),
                    "transactions": int(worst["transactions"]),
                    "all_products_ranked": product_sales.reset_index().to_dict(orient="records"),
                    "formula": f"MIN(GROUP BY {product_col} SUM {sales_col})"
                }
                worst_data = df[df[product_col] == product_sales.index[-1]].head(5)
                result["source_rows"] = worst_data.fillna("").astype(str).to_dict(orient="records")
            elif any(kw in question_lower for kw in ["best", "top", "highest", "most", "perform"]):
                best = product_sales.iloc[0]
                result["calculations"] = {
                    "best_product": str(product_sales.index[0]),
                    "best_sales": round(float(best["total_sales"]), 2),
                    "avg_sales": round(float(best["avg_sales"]), 2),
                    "transactions": int(best["transactions"]),
                    "all_products_ranked": product_sales.reset_index().to_dict(orient="records"),
                    "formula": f"MAX(GROUP BY {product_col} SUM {sales_col})"
                }
                best_data = df[df[product_col] == product_sales.index[0]].head(5)
                result["source_rows"] = best_data.fillna("").astype(str).to_dict(orient="records")
            else:
                result["calculations"] = {
                    "product_ranking": product_sales.reset_index().to_dict(orient="records"),
                    "total_products": len(product_sales),
                    "formula": f"GROUP BY {product_col}, SUM {sales_col}"
                }
                result["source_rows"] = df.head(5).fillna("").astype(str).to_dict(orient="records")

            chart_data = product_sales.reset_index()
            result["chart_data"] = {
                "type": "bar",
                "data": [
                    {"name": str(row[product_col]), "value": round(float(row["total_sales"]), 2)}
                    for _, row in chart_data.iterrows()
                ]
            }

    # Region questions
    if any(kw in question_lower for kw in ["region", "location", "area", "territory", "where"]):
        if region_col and sales_col:
            region_sales = df_work.groupby(region_col)[sales_col].agg(["sum", "mean", "count"])
            region_sales.columns = ["total_sales", "avg_sales", "transactions"]
            region_sales = region_sales.sort_values("total_sales", ascending=False)

            result["question_type"] = "region"
            result["calculations"] = {
                "region_ranking": region_sales.reset_index().to_dict(orient="records"),
                "best_region": str(region_sales.index[0]),
                "best_region_sales": round(float(region_sales.iloc[0]["total_sales"]), 2),
                "worst_region": str(region_sales.index[-1]),
                "formula": f"GROUP BY {region_col}, SUM {sales_col}"
            }
            result["source_rows"] = df.head(5).fillna("").astype(str).to_dict(orient="records")
            result["chart_data"] = {
                "type": "pie",
                "data": [
                    {"name": str(idx), "value": round(float(row["total_sales"]), 2)}
                    for idx, row in region_sales.iterrows()
                ]
            }

    # Trend/decrease/increase questions
    if any(kw in question_lower for kw in ["trend", "decrease", "decline", "drop", "increase", "grow", "month", "time", "why"]):
        if date_col and sales_col:
            df_work[date_col] = pd.to_datetime(df_work[date_col], errors='coerce')
            df_work = df_work.dropna(subset=[date_col])
            df_work["period"] = df_work[date_col].dt.to_period("M").astype(str)
            trend = df_work.groupby("period")[sales_col].sum().reset_index()
            trend.columns = ["period", "sales"]
            trend = trend.sort_values("period")
            trend["mom_change"] = trend["sales"].diff()
            trend["mom_pct_change"] = trend["sales"].pct_change() * 100

            result["question_type"] = "trend"
            result["calculations"] = {
                "monthly_trend": trend.fillna(0).to_dict(orient="records"),
                "total_periods": len(trend),
                "max_period": str(trend.loc[trend["sales"].idxmax(), "period"]),
                "min_period": str(trend.loc[trend["sales"].idxmin(), "period"]),
                "overall_growth": round(
                    float(((trend["sales"].iloc[-1] - trend["sales"].iloc[0]) / trend["sales"].iloc[0]) * 100), 2
                ) if trend["sales"].iloc[0] > 0 else 0,
                "formula": f"GROUP BY MONTH({date_col}), SUM({sales_col}), LAG() for MoM change"
            }
            result["source_rows"] = df.head(5).fillna("").astype(str).to_dict(orient="records")
            result["chart_data"] = {
                "type": "line",
                "data": [
                    {"name": row["period"], "value": round(float(row["sales"]), 2)}
                    for _, row in trend.iterrows()
                ]
            }

    # Anomaly questions
    if any(kw in question_lower for kw in ["anomal", "unusual", "outlier", "suspicious", "weird"]):
        from services.anomaly_detector import detect_anomalies
        anomalies = detect_anomalies(df)
        result["question_type"] = "anomaly"
        result["calculations"] = {
            "total_anomalies": len(anomalies),
            "anomaly_list": anomalies[:5],
            "formula": "IQR method: outliers = values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]"
        }
        result["source_rows"] = [a["source_row"] for a in anomalies[:5]]

    # If no specific type detected, provide general summary
    if result["question_type"] == "general" and sales_col:
        total = df_work[sales_col].sum()
        result["calculations"] = {
            "total_revenue": round(float(total), 2),
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": list(df.columns),
            "formula": "General dataset summary"
        }
        result["source_rows"] = df.head(5).fillna("").astype(str).to_dict(orient="records")

    return result


def generate_ai_response(question: str, calc_result: Dict, demo_mode: bool = False) -> Dict:
    """Generate AI response using calculated data via Google Gemini."""

    if demo_mode or is_demo_mode():
        return generate_demo_response(question, calc_result)

    model = get_gemini_model()
    if not model:
        return generate_demo_response(question, calc_result)

    # Build a compact evidence summary (NOT the full dataset)
    evidence_summary = json.dumps(calc_result["calculations"], indent=2, default=str)
    question_type = calc_result["question_type"]

    prompt = f"""You are a business intelligence analyst. You analyze calculated data and provide clear, explainable business insights.

IMPORTANT RULES:
1. NEVER invent numbers. All numbers come from the provided calculations.
2. Always reference the specific calculated values in your response.
3. Use cautious language: 'The data suggests...', 'Based on the analysis...'
4. If data is insufficient, say so clearly.
5. Be concise and actionable.

User Question: {question}
Question Type: {question_type}

Calculated Results (from Python/Pandas - DO NOT modify these numbers):
{evidence_summary}

Respond ONLY with valid JSON (no markdown, no code fences) with these exact fields:
{{
  "answer": "Clear 2-3 sentence explanation referencing the calculated values",
  "business_impact": "Why this matters for the business",
  "recommendation": "Data-backed actionable recommendation"
}}"""

    try:
        response = model.generate_content(prompt)
        content = response.text.strip()
        # Strip markdown code fences if Gemini wraps in ```json
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        try:
            parsed = json.loads(content)
            return {
                "answer": parsed.get("answer", content),
                "business_impact": parsed.get("business_impact", "See evidence for details."),
                "recommendation": parsed.get("recommendation", "Review the calculated data above.")
            }
        except json.JSONDecodeError:
            return {
                "answer": content,
                "business_impact": "Review the calculated evidence for business context.",
                "recommendation": "Analyze the source data to make informed decisions."
            }
    except Exception as e:
        print(f"Gemini error: {e}")
        return generate_demo_response(question, calc_result)



def generate_demo_response(question: str, calc_result: Dict) -> Dict:
    """Generate template-based responses for demo mode."""
    question_lower = question.lower()
    calcs = calc_result.get("calculations", {})
    q_type = calc_result.get("question_type", "general")

    if q_type == "revenue" or "revenue" in question_lower or "total" in question_lower:
        total = calcs.get("total_revenue", 0)
        avg = calcs.get("average_revenue", 0)
        return {
            "answer": (
                f"Based on the dataset analysis, the total revenue is ${total:,.2f} with an average of "
                f"${avg:,.2f} per transaction. This calculation is based on all {calcs.get('count', 0)} "
                f"records in the dataset."
            ),
            "business_impact": (
                f"Total revenue of ${total:,.2f} represents the complete business performance captured in "
                f"this dataset. Monitoring this metric helps track overall business health."
            ),
            "recommendation": (
                "Focus on increasing transaction frequency and average order value. Consider identifying "
                "the top-performing products and regions to replicate their success."
            )
        }

    elif q_type == "product":
        if any(kw in question_lower for kw in ["worst", "lowest", "poor"]):
            worst = calcs.get("worst_product", "Unknown")
            worst_sales = calcs.get("worst_sales", 0)
            return {
                "answer": (
                    f"Based on the sales calculations, '{worst}' is the worst-performing product with total "
                    f"sales of ${worst_sales:,.2f}. This product has the lowest revenue contribution compared "
                    f"to all other products in the dataset."
                ),
                "business_impact": (
                    f"'{worst}' generating only ${worst_sales:,.2f} indicates potential issues with demand, "
                    f"pricing, or market fit. This could be dragging overall portfolio performance."
                ),
                "recommendation": (
                    f"Investigate '{worst}' further. Consider whether pricing adjustments, marketing campaigns, "
                    f"or discontinuation would be more beneficial. Compare its cost structure against revenue generated."
                )
            }
        else:
            best = calcs.get("best_product", "Unknown")
            best_sales = calcs.get("best_sales", 0)
            return {
                "answer": (
                    f"Based on the sales calculations, '{best}' is the top-performing product with total "
                    f"sales of ${best_sales:,.2f}. This product leads all others in revenue contribution."
                ),
                "business_impact": (
                    f"'{best}' generating ${best_sales:,.2f} shows strong market demand. This product should "
                    f"be prioritized for inventory and marketing investment."
                ),
                "recommendation": (
                    f"Invest more in '{best}' — increase inventory, expand to new regions, and use it as a "
                    f"flagship product in marketing campaigns."
                )
            }

    elif q_type == "region":
        best_region = calcs.get("best_region", "Unknown")
        best_sales = calcs.get("best_region_sales", 0)
        worst_region = calcs.get("worst_region", "Unknown")
        return {
            "answer": (
                f"Based on regional sales analysis, {best_region} is the best-performing region with total "
                f"sales of ${best_sales:,.2f}. The data shows significant variation in performance across all regions."
            ),
            "business_impact": (
                f"{best_region} driving ${best_sales:,.2f} in sales makes it a critical market. The underperforming "
                f"{worst_region} region represents a growth opportunity."
            ),
            "recommendation": (
                f"Analyze what makes {best_region} successful and apply those strategies to {worst_region}. "
                f"Consider targeted promotions or additional sales staff in underperforming regions."
            )
        }

    elif q_type == "trend":
        trend_data = calcs.get("monthly_trend", [])
        growth = calcs.get("overall_growth", 0)
        max_p = calcs.get("max_period", "")
        min_p = calcs.get("min_period", "")
        return {
            "answer": (
                f"The sales trend analysis shows {len(trend_data)} periods of data. Peak performance occurred "
                f"in {max_p}, while the lowest performance was in {min_p}. Overall growth rate stands at {growth:.1f}%."
            ),
            "business_impact": (
                f"A {growth:.1f}% overall growth rate indicates {'positive' if growth > 0 else 'concerning'} "
                f"business momentum. Understanding sales patterns helps with inventory and resource planning."
            ),
            "recommendation": (
                "Identify the factors driving peak performance periods and replicate them. For decline periods, "
                "investigate external factors, competitor activity, or internal operational issues."
            )
        }

    elif q_type == "anomaly":
        count = calcs.get("total_anomalies", 0)
        return {
            "answer": (
                f"Statistical analysis detected {count} potential anomalies in the dataset using the IQR "
                f"(Interquartile Range) method. These are values that fall outside the expected statistical range."
            ),
            "business_impact": (
                "Anomalous transactions may indicate data entry errors, exceptional business events, or genuine "
                "outliers that require investigation."
            ),
            "recommendation": (
                "Review each flagged transaction individually. Verify data accuracy and investigate whether these "
                "represent genuine business events or errors requiring correction."
            )
        }

    else:
        return {
            "answer": (
                f"Analysis of your dataset with {calcs.get('row_count', 0)} rows and "
                f"{calcs.get('column_count', 0)} columns has been completed. The data contains the following "
                f"columns: {', '.join(str(c) for c in calcs.get('columns', [])[:5])}."
            ),
            "business_impact": (
                "Understanding your data structure is the first step to extracting actionable business insights."
            ),
            "recommendation": (
                "Try asking specific questions like 'What is my total revenue?', "
                "'Which product performed best?', or 'Show me the sales trend.'"
            )
        }


def generate_insights(df: pd.DataFrame) -> List[Dict]:
    """Generate automatic insights from dataset."""
    insights = []
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    product_col = col_map.get("product")
    region_col = col_map.get("region")
    date_col = col_map.get("date")

    df_work = df.copy()
    if sales_col:
        df_work[sales_col] = pd.to_numeric(df_work[sales_col], errors='coerce')

    # Insight 1: Revenue summary
    if sales_col:
        total = df_work[sales_col].sum()
        insights.append({
            "title": "Total Revenue Overview",
            "description": f"Total revenue across all records is ${total:,.2f} from {len(df)} transactions.",
            "evidence": {"total_revenue": round(float(total), 2), "transaction_count": len(df)},
            "category": "revenue",
            "importance": "high"
        })

    # Insight 2: Top product
    if product_col and sales_col:
        product_sales = df_work.groupby(product_col)[sales_col].sum().sort_values(ascending=False)
        if len(product_sales) > 0:
            top_product = product_sales.index[0]
            top_sales = product_sales.iloc[0]
            share = (top_sales / df_work[sales_col].sum()) * 100 if df_work[sales_col].sum() > 0 else 0
            insights.append({
                "title": f"Top Product: {top_product}",
                "description": (
                    f"'{top_product}' leads with ${top_sales:,.2f} in sales, representing "
                    f"{share:.1f}% of total revenue."
                ),
                "evidence": {
                    "product": str(top_product),
                    "sales": round(float(top_sales), 2),
                    "share_pct": round(float(share), 1)
                },
                "category": "product",
                "importance": "high"
            })

    # Insight 3: Best region
    if region_col and sales_col:
        region_sales = df_work.groupby(region_col)[sales_col].sum().sort_values(ascending=False)
        if len(region_sales) > 0:
            top_region = region_sales.index[0]
            top_region_sales = region_sales.iloc[0]
            insights.append({
                "title": f"Best Region: {top_region}",
                "description": (
                    f"'{top_region}' is the top-performing region with ${top_region_sales:,.2f} in total sales."
                ),
                "evidence": {"region": str(top_region), "sales": round(float(top_region_sales), 2)},
                "category": "region",
                "importance": "medium"
            })

    # Insight 4: Growth trend
    if date_col and sales_col:
        try:
            df_work[date_col] = pd.to_datetime(df_work[date_col], errors='coerce')
            df_work = df_work.dropna(subset=[date_col])
            df_work["period"] = df_work[date_col].dt.to_period("M").astype(str)
            trend = df_work.groupby("period")[sales_col].sum().sort_index()
            if len(trend) >= 2:
                last = trend.iloc[-1]
                prev = trend.iloc[-2]
                growth = ((last - prev) / prev) * 100 if prev > 0 else 0
                direction = "increased" if growth > 0 else "decreased"
                insights.append({
                    "title": f"Month-over-Month Growth: {growth:.1f}%",
                    "description": (
                        f"Revenue {direction} by {abs(growth):.1f}% in the most recent period "
                        f"({trend.index[-1]}) compared to the previous period ({trend.index[-2]})."
                    ),
                    "evidence": {
                        "current_period": str(trend.index[-1]),
                        "previous_period": str(trend.index[-2]),
                        "current_sales": round(float(last), 2),
                        "previous_sales": round(float(prev), 2),
                        "growth_pct": round(float(growth), 2)
                    },
                    "category": "trend",
                    "importance": "high" if abs(growth) > 10 else "medium"
                })
        except Exception as e:
            print(f"Trend insight error: {e}")

    # Insight 5: Anomalies
    from services.anomaly_detector import detect_anomalies
    anomalies = detect_anomalies(df)
    if anomalies:
        insights.append({
            "title": f"{len(anomalies)} Potential Anomalies Detected",
            "description": (
                f"{len(anomalies)} transactions were flagged as statistical outliers using the IQR method. "
                f"These may warrant further investigation."
            ),
            "evidence": {
                "anomaly_count": len(anomalies),
                "method": "IQR (Q1 - 1.5*IQR to Q3 + 1.5*IQR)"
            },
            "category": "anomaly",
            "importance": "medium"
        })

    return insights


def generate_decision_response(df: pd.DataFrame, question: str) -> Dict:
    """Generate decision assistant response."""
    question_lower = question.lower()
    col_map = detect_columns(df)
    sales_col = col_map.get("sales")
    product_col = col_map.get("product")
    region_col = col_map.get("region")
    date_col = col_map.get("date")

    df_work = df.copy()
    if sales_col:
        df_work[sales_col] = pd.to_numeric(df_work[sales_col], errors='coerce')

    supporting_data: Dict[str, Any] = {}
    key_findings: List[str] = []

    # Gather relevant data
    if sales_col:
        total_revenue = df_work[sales_col].sum()
        supporting_data["total_revenue"] = round(float(total_revenue), 2)

    if product_col and sales_col:
        product_sales = df_work.groupby(product_col)[sales_col].sum().sort_values(ascending=False)
        top_product = str(product_sales.index[0])
        worst_product = str(product_sales.index[-1])
        supporting_data["top_product"] = {"name": top_product, "sales": round(float(product_sales.iloc[0]), 2)}
        supporting_data["worst_product"] = {"name": worst_product, "sales": round(float(product_sales.iloc[-1]), 2)}
        key_findings.append(f"'{top_product}' is the top revenue driver with ${product_sales.iloc[0]:,.2f} in sales")
        key_findings.append(f"'{worst_product}' needs attention with only ${product_sales.iloc[-1]:,.2f} in sales")

    if region_col and sales_col:
        region_sales = df_work.groupby(region_col)[sales_col].sum().sort_values(ascending=False)
        top_region = str(region_sales.index[0])
        supporting_data["top_region"] = {"name": top_region, "sales": round(float(region_sales.iloc[0]), 2)}
        key_findings.append(f"'{top_region}' region contributes the most revenue")

    from services.anomaly_detector import detect_anomalies
    anomalies = detect_anomalies(df)
    if anomalies:
        supporting_data["anomaly_count"] = len(anomalies)
        key_findings.append(f"{len(anomalies)} potential anomalies detected that may require investigation")

    # Generate response based on question type
    if any(kw in question_lower for kw in ["focus", "next month", "priority"]):
        recommendation = (
            f"Based on the data analysis: Focus on scaling "
            f"'{supporting_data.get('top_product', {}).get('name', 'top products')}' which drives the most revenue. "
            f"Investigate and address the underperformance of "
            f"'{supporting_data.get('worst_product', {}).get('name', 'bottom products')}'. "
            f"Expand successful strategies from "
            f"{supporting_data.get('top_region', {}).get('name', 'top regions')} to other regions."
        )
    elif any(kw in question_lower for kw in ["risk", "problem", "issue"]):
        recommendation = (
            f"Data-identified risks: The worst-performing product "
            f"'{supporting_data.get('worst_product', {}).get('name', 'unknown')}' shows concerning revenue figures. "
            f"{len(anomalies) if anomalies else 0} statistical anomalies detected that may indicate data issues "
            f"or unusual business events. Monitor month-over-month trends for early warning signals."
        )
    elif any(kw in question_lower for kw in ["revenue", "losing", "loss"]):
        worst_product = supporting_data.get('worst_product', {})
        recommendation = (
            f"Revenue optimization opportunities: "
            f"'{worst_product.get('name', 'certain products')}' with "
            f"${worst_product.get('sales', 0):,.2f} in sales represents potential revenue loss. "
            f"Underperforming regions need strategic attention."
        )
    else:
        recommendation = (
            f"Based on the available dataset with {len(df)} records: "
            f"Prioritize top-performing products and regions. Monitor trend changes and investigate "
            f"statistical anomalies. Ensure data quality for better insights."
        )

    analysis = (
        f"The data suggests {len(key_findings)} key focus areas based on analysis of {len(df)} records. "
        f"The available dataset indicates clear patterns in product and regional performance."
    )

    model = get_gemini_model()
    if model and not is_demo_mode():
        try:
            prompt = f"""Based on these calculated business metrics, answer the user's question:

Question: {question}

Key Findings: {json.dumps(key_findings)}
Supporting Data: {json.dumps(supporting_data, default=str)}

Provide a data-backed response using cautious language like 'The data suggests...', 'Based on the analysis...', 
'The available dataset indicates...'. If data is insufficient, say so clearly. Never fabricate numbers.

Response format: 2-3 paragraphs with specific data references."""

            response = model.generate_content(prompt)
            recommendation = response.text.strip()
        except Exception as e:
            print(f"Gemini decision error: {e}")

    return {
        "question": question,
        "analysis": analysis,
        "key_findings": key_findings,
        "recommendation": recommendation,
        "confidence": "moderate" if len(df) > 50 else "low",
        "supporting_data": supporting_data
    }
