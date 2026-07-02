"""
schema_manager.py — Normalizes extracted records, handles date normalization,
direction classification, model inference, and dynamic schema expansion.
"""

import logging
import re
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Master schema — initial column order
# ---------------------------------------------------------------------------
MASTER_SCHEMA: list[str] = [
    "Model",
    "Direction",
    "Date",
    "Tag No",
    "Serial No",
    "Type/Description",
    "Qty",
    "Recipient/Team",
    "Notes",
]

# ---------------------------------------------------------------------------
# Fields the LLM sometimes hallucinates — always strip before saving
# ---------------------------------------------------------------------------
_DISCARD_FIELDS: set[str] = {
    "additional info",
    "additional information",
    "additionalinfo",
}

# ---------------------------------------------------------------------------
# Direction classification
# ---------------------------------------------------------------------------
_RECEIVED_PATTERNS = re.compile(
    r"receiv|incoming|arrived|inbound|from vendor|shipment received",
    re.IGNORECASE,
)
_SHIPPED_PATTERNS = re.compile(
    r"ship|sent|dispatch|outgoing|outbound|transfer(?:red)?",
    re.IGNORECASE,
)
_GIVEN_PATTERNS = re.compile(
    r"issued?\s+to|assigned|given\s+to|distributed",
    re.IGNORECASE,
)
_FAULTY_PATTERNS = re.compile(
    r"defect|fault|damage|broken|rma|repair",
    re.IGNORECASE,
)


def normalize_direction(value: Any) -> str | None:
    if not value or not isinstance(value, str):
        return value  # type: ignore[return-value]
    v = value.strip()
    if _RECEIVED_PATTERNS.search(v):
        return "Received"
    if _SHIPPED_PATTERNS.search(v):
        return "Shipped Out"
    if _GIVEN_PATTERNS.search(v):
        return "Given to Team"
    if _FAULTY_PATTERNS.search(v):
        return "Faulty"
    return v


# ---------------------------------------------------------------------------
# Date normalisation
# ---------------------------------------------------------------------------
_DATE_FORMATS = [
    "%d%b%Y",    # 03Dec2025
    "%d%b%y",    # 10Nov23
    "%d-%b-%Y",  # 03-Dec-2025
    "%d-%b-%y",  # 03-Dec-23
    "%Y/%m/%d",  # 2025/12/03
    "%Y-%m-%d",  # 2025-12-03
    "%m/%d/%Y",  # 12/03/2025
    "%d/%m/%Y",  # 03/12/2025
    "%d/%m/%y",  # 03/12/23
    "%d.%m.%Y",  # 03.12.2025
    "%d.%m.%y",  # 03.12.23
    "%B %d, %Y", # December 3, 2025
    "%d %B %Y",  # 03 December 2025
    "%b %d, %Y", # Dec 3, 2025
    "%d %b %Y",  # 03 Dec 2025
    "%d %b %y",  # 03 Dec 23
    "%Y%m%d",    # 20251203
]


def normalize_date(value: Any) -> str | None:
    if not value or not isinstance(value, str):
        return value  # type: ignore[return-value]
    v = value.strip()
    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.strptime(v, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    logger.warning("Could not normalize date value: '%s'", v)
    return v


# ---------------------------------------------------------------------------
# Model inference from Type/Description part numbers
# ---------------------------------------------------------------------------
# Order matters — more specific patterns first
_MODEL_INFERENCE_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"901-T750SE",   re.IGNORECASE), "T750SE"),
    (re.compile(r"901-T750",     re.IGNORECASE), "T750"),
    (re.compile(r"901-T350",     re.IGNORECASE), "T350"),
    (re.compile(r"901-R850",     re.IGNORECASE), "R850"),
    (re.compile(r"901-R750",     re.IGNORECASE), "R750"),
    (re.compile(r"901-R650",     re.IGNORECASE), "R650"),
    (re.compile(r"901-R550",     re.IGNORECASE), "R550"),
    (re.compile(r"901-H550",     re.IGNORECASE), "H550"),
    (re.compile(r"901-H350",     re.IGNORECASE), "H350"),
    (re.compile(r"901-r350",     re.IGNORECASE), "R350"),
    (re.compile(r"901-h350",     re.IGNORECASE), "H350"),
    (re.compile(r"\bT750SE\b",   re.IGNORECASE), "T750SE"),
    (re.compile(r"\bT750\b",     re.IGNORECASE), "T750"),
    (re.compile(r"\bT350d\b",    re.IGNORECASE), "T350d"),
    (re.compile(r"\bT350\b",     re.IGNORECASE), "T350"),
    (re.compile(r"\bR850\b",     re.IGNORECASE), "R850"),
    (re.compile(r"\bR750\b",     re.IGNORECASE), "R750"),
    (re.compile(r"\bR650\b",     re.IGNORECASE), "R650"),
    (re.compile(r"\bR550\b",     re.IGNORECASE), "R550"),
    (re.compile(r"\bH550\b",     re.IGNORECASE), "H550"),
    (re.compile(r"\bH350\b",     re.IGNORECASE), "H350"),
    (re.compile(r"\bH670",       re.IGNORECASE), "H670"),
    (re.compile(r"\bNUC12",      re.IGNORECASE), "Intel NUC"),
    (re.compile(r"\bNUC\b",      re.IGNORECASE), "Intel NUC"),
]


def infer_model_from_description(description: str | None) -> str | None:
    """Try to derive a human-readable model name from the Type/Description."""
    if not description or not isinstance(description, str):
        return None
    for pattern, model_name in _MODEL_INFERENCE_RULES:
        if pattern.search(description):
            return model_name
    return None


# ---------------------------------------------------------------------------
# Record normalization
# ---------------------------------------------------------------------------

def normalize_record(record: dict) -> dict:
    """
    Apply field-level normalization to a single extracted record:
    - Strip disallowed fields (Qty, Additional Info, etc.)
    - Normalize Direction and Date
    - Infer Model from Type/Description when missing
    - Move 'Additional Info' content into Notes
    """
    normalized: dict = {}

    # Collect any Additional Info value before discarding the key
    additional_info_value: str | None = None
    for key, val in record.items():
        if key.lower().strip() in {"additional info", "additional information", "additionalinfo"}:
            if val and isinstance(val, str) and val.strip():
                additional_info_value = val.strip()

    for key, val in record.items():
        # Drop discard fields
        if key.lower().strip() in _DISCARD_FIELDS:
            continue

        # Normalize empty strings → None
        if isinstance(val, str) and val.strip() == "":
            val = None

        if key == "Direction":
            val = normalize_direction(val)
        elif key == "Date":
            val = normalize_date(val)

        normalized[key] = val

    # If Additional Info had content, fold it into Notes
    if additional_info_value:
        existing_notes = normalized.get("Notes")
        if existing_notes and isinstance(existing_notes, str):
            normalized["Notes"] = f"{existing_notes} | {additional_info_value}"
        else:
            normalized["Notes"] = additional_info_value

    # Infer Model from Type/Description if missing or blank
    model_val = normalized.get("Model")
    if not model_val or (isinstance(model_val, str) and model_val.strip() == ""):
        inferred = infer_model_from_description(normalized.get("Type/Description"))
        if inferred:
            normalized["Model"] = inferred
            logger.info("Inferred Model '%s' from Type/Description '%s'",
                        inferred, normalized.get("Type/Description"))

    # ── Guarantee all master schema keys are always present ────────────────
    # Missing standard fields default to None, except Qty which defaults to 1
    # because each record represents exactly one physical device.
    for field in MASTER_SCHEMA:
        if field not in normalized:
            normalized[field] = 1 if field == "Qty" else None

    # Normalise Qty: ensure it's an integer ≥ 1
    qty_val = normalized.get("Qty")
    if qty_val is None or (isinstance(qty_val, str) and qty_val.strip() in ("", "null", "None")):
        normalized["Qty"] = 1
    else:
        try:
            normalized["Qty"] = max(1, int(str(qty_val).strip()))
        except (ValueError, TypeError):
            normalized["Qty"] = 1

    return normalized


# ---------------------------------------------------------------------------
# Schema expansion
# ---------------------------------------------------------------------------

def get_new_columns(existing_columns: list[str], record_keys: list[str]) -> list[str]:
    existing_set = set(existing_columns)
    new_cols = [k for k in record_keys if k not in existing_set]
    if new_cols:
        logger.info("New columns detected: %s", new_cols)
    return new_cols


def merge_schemas(existing_columns: list[str], records: list[dict]) -> list[str]:
    seen: set[str] = set(existing_columns)
    merged = list(existing_columns)
    for record in records:
        for key in record.keys():
            if key not in seen:
                merged.append(key)
                seen.add(key)
    return merged
