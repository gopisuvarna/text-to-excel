"""
app.py — FastAPI entry point for the Inventory AI Agent.
Storage backend: Google Sheets (via sheets_manager.py).
"""

import logging
import os
import shutil
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

load_dotenv()

from services.groq_extractor import extract_records
from services.parser import read_text_file
from services.sheets_manager import (
    export_as_excel,
    get_schema_columns,
    get_stats,
    update_sheets,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("inventory_agent")

# ---------------------------------------------------------------------------
# Upload directory (temp staging only)
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
        "Google Sheet using Groq LLM for structured extraction."
    ),
    version="2.0.0",
)

_raw_origins     = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allowed_origins = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]

# If ALLOWED_ORIGINS is not set at all, allow everything (safe default for debugging)
if not _allowed_origins:
    _allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",   # catch any Vercel preview URL too
    allow_credentials=False,                          # must be False when using wildcard/regex
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------
@app.post("/upload", summary="Upload one or more .txt files for processing")
async def upload_files(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    total_records_added  = 0
    all_new_columns: list[str] = []
    file_summaries: list[dict] = []
    errors: list[str] = []

    for upload in files:
        filename = upload.filename or "unknown.txt"
        logger.info("File uploaded: %s", filename)

        if not filename.lower().endswith(".txt"):
            msg = f"Skipped '{filename}': only .txt files are accepted."
            logger.warning(msg)
            errors.append(msg)
            continue

        tmp_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
        try:
            with tmp_path.open("wb") as f:
                shutil.copyfileobj(upload.file, f)

            try:
                text = read_text_file(str(tmp_path))
            except (FileNotFoundError, ValueError) as exc:
                msg = f"Failed to read '{filename}': {exc}"
                logger.error(msg)
                errors.append(msg)
                continue

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

            # ── Write to Google Sheets ──────────────────────────────────────
            try:
                result = update_sheets(records)
            except EnvironmentError as exc:
                raise HTTPException(status_code=500, detail=str(exc))
            except Exception as exc:
                msg = f"Sheets update failed for '{filename}': {exc}"
                logger.error(msg)
                errors.append(msg)
                continue

            added    = result["records_added"]
            new_cols = result["new_columns_added"]

            total_records_added += added
            for col in new_cols:
                if col not in all_new_columns:
                    all_new_columns.append(col)

            logger.info("Sheets updated for '%s' — added: %d, new cols: %s",
                        filename, added, new_cols)

            file_summaries.append({
                "file":               filename,
                "records_extracted":  len(records),
                "records_added":      added,
                "new_columns_added":  new_cols,
            })

        finally:
            if tmp_path.exists():
                tmp_path.unlink()

    response: dict = {
        "status":             "success" if not errors or total_records_added > 0 else "failed",
        "records_added":      total_records_added,
        "new_columns_added":  all_new_columns,
        "files":              file_summaries,
    }
    if errors:
        response["warnings"] = errors

    return JSONResponse(content=response)


# ---------------------------------------------------------------------------
# GET /download — export Google Sheets data as .xlsx
# ---------------------------------------------------------------------------
@app.get("/download", summary="Download inventory as Excel file")
def download_excel():
    try:
        xlsx_bytes = export_as_excel()
    except EnvironmentError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.error("Export failed: %s", exc)
        raise HTTPException(status_code=500, detail="Could not export data from Google Sheets.")

    if not xlsx_bytes:
        raise HTTPException(status_code=404, detail="No data yet — upload files first.")

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=master_inventory.xlsx"},
    )


# ---------------------------------------------------------------------------
# GET /schema
# ---------------------------------------------------------------------------
@app.get("/schema", summary="Get current sheet column headers")
def get_schema():
    try:
        columns = get_schema_columns()
        return {"columns": columns}
    except EnvironmentError:
        # Google Sheets not configured yet — return base schema so UI still renders
        from services.schema_manager import MASTER_SCHEMA
        return {"columns": list(MASTER_SCHEMA)}
    except Exception as exc:
        logger.warning("Schema fetch failed (returning fallback): %s", exc)
        from services.schema_manager import MASTER_SCHEMA
        return {"columns": list(MASTER_SCHEMA)}


# ---------------------------------------------------------------------------
# GET /stats
# ---------------------------------------------------------------------------
@app.get("/stats", summary="Get inventory statistics")
def stats():
    try:
        data = get_stats()
        return data
    except EnvironmentError:
        from services.schema_manager import MASTER_SCHEMA
        return {"total_records": 0, "files_processed": 0,
                "total_columns": len(MASTER_SCHEMA), "new_columns_added": 0}
    except Exception as exc:
        logger.warning("Stats fetch failed (returning fallback): %s", exc)
        from services.schema_manager import MASTER_SCHEMA
        return {"total_records": 0, "files_processed": 0,
                "total_columns": len(MASTER_SCHEMA), "new_columns_added": 0}


# ---------------------------------------------------------------------------
# GET /health  (also used as wake-up ping for Render cold starts)
# ---------------------------------------------------------------------------
@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "ok", "backend": "render"}


# ---------------------------------------------------------------------------
# Run directly
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
