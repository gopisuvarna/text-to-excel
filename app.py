"""
app.py — FastAPI entry point for the Inventory AI Agent.
"""

import logging
import os
import shutil
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

# Load environment variables before importing services
load_dotenv()

from services.excel_manager import _get_excel_path
from services.groq_extractor import extract_records
from services.parser import read_text_file

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("inventory_agent")

# ---------------------------------------------------------------------------
# Upload directory
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Inventory AI Agent",
    description=(
        "Converts .txt inventory/logistics files into a continuously updated "
        "Excel workbook using Groq LLM for structured extraction."
    ),
    version="1.0.0",
)

# Allow origins from .env — comma-separated list of allowed origins
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@app.post("/upload", summary="Upload one or more .txt files for processing")
async def upload_files(files: list[UploadFile] = File(...)):
    """
    Accept one or more .txt files, extract inventory records via Groq LLM,
    and append them to the master Excel workbook.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    total_records_added = 0
    all_new_columns: list[str] = []
    file_summaries: list[dict] = []
    errors: list[str] = []

    for upload in files:
        filename = upload.filename or "unknown.txt"
        logger.info("File uploaded: %s", filename)

        # ── Validate extension ──────────────────────────────────────────────
        if not filename.lower().endswith(".txt"):
            msg = f"Skipped '{filename}': only .txt files are accepted."
            logger.warning(msg)
            errors.append(msg)
            continue

        # ── Save temporarily ────────────────────────────────────────────────
        tmp_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
        try:
            with tmp_path.open("wb") as f:
                shutil.copyfileobj(upload.file, f)

            # ── Read ─────────────────────────────────────────────────────────
            try:
                text = read_text_file(str(tmp_path))
            except (FileNotFoundError, ValueError) as exc:
                msg = f"Failed to read '{filename}': {exc}"
                logger.error(msg)
                errors.append(msg)
                continue

            # ── Extract via Groq ─────────────────────────────────────────────
            try:
                records = extract_records(text)
            except EnvironmentError as exc:
                raise HTTPException(status_code=500, detail=str(exc))
            except (RuntimeError, ValueError) as exc:
                msg = f"Extraction failed for '{filename}': {exc}"
                logger.error(msg)
                errors.append(msg)
                continue

            logger.info("Records extracted from '%s': %d", filename, len(records))

            if not records:
                msg = f"No records found in '{filename}'."
                logger.warning(msg)
                errors.append(msg)
                continue

            # ── Update Excel ──────────────────────────────────────────────────
            from services.excel_manager import update_excel  # local import to keep load_dotenv first

            result = update_excel(records)
            added = result["records_added"]
            new_cols = result["new_columns_added"]

            total_records_added += added
            for col in new_cols:
                if col not in all_new_columns:
                    all_new_columns.append(col)

            logger.info(
                "Excel updated for '%s' — added: %d, new cols: %s",
                filename, added, new_cols,
            )

            file_summaries.append({
                "file": filename,
                "records_extracted": len(records),
                "records_added": added,
                "new_columns_added": new_cols,
            })

        finally:
            # Always clean up the temp file
            if tmp_path.exists():
                tmp_path.unlink()

    response: dict = {
        "status": "success" if not errors or total_records_added > 0 else "failed",
        "records_added": total_records_added,
        "new_columns_added": all_new_columns,
        "files": file_summaries,
    }

    if errors:
        response["warnings"] = errors

    return JSONResponse(content=response)


# ---------------------------------------------------------------------------
# GET /download
# ---------------------------------------------------------------------------
@app.get("/download", summary="Download the master inventory Excel file")
def download_excel():
    """Return the master_inventory.xlsx file as a downloadable attachment."""
    excel_path = _get_excel_path()

    if not excel_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Master Excel file not found. Upload files first to generate it.",
        )

    return FileResponse(
        path=str(excel_path),
        filename="master_inventory.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# GET /schema — return columns currently in master Excel
# ---------------------------------------------------------------------------
@app.get("/schema", summary="Get current Excel schema columns")
def get_schema():
    from services.excel_manager import load_existing_data
    excel_path = _get_excel_path()
    _, columns = load_existing_data(excel_path)
    return {"columns": columns}


# ---------------------------------------------------------------------------
# GET /stats — aggregate stats from the master Excel
# ---------------------------------------------------------------------------
@app.get("/stats", summary="Get inventory statistics")
def get_stats():
    import pandas as pd
    from services.schema_manager import MASTER_SCHEMA
    excel_path = _get_excel_path()
    if not excel_path.exists():
        return {
            "total_records": 0,
            "files_processed": 0,
            "total_columns": len(MASTER_SCHEMA),
            "new_columns_added": 0,
        }
    try:
        df = pd.read_excel(excel_path, dtype=str, engine="openpyxl")
        cols = list(df.columns)
        new_cols = len([c for c in cols if c not in MASTER_SCHEMA])
        return {
            "total_records":     len(df),
            "files_processed":   0,          # session-agnostic; frontend tracks this
            "total_columns":     len(cols),
            "new_columns_added": new_cols,
        }
    except Exception as exc:
        logger.error("Stats error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not read stats from Excel.")


# ---------------------------------------------------------------------------
# Run directly
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
