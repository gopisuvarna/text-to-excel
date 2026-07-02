"""
Tests for excel_manager.py — duplicate detection and Excel update workflow.
Uses a temporary directory so tests never touch the real output file.
"""

import os
from pathlib import Path

import pandas as pd
import pytest

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_excel_path(tmp_path, monkeypatch):
    """Redirect all Excel operations to a temp directory."""
    excel_path = tmp_path / "test_inventory.xlsx"
    monkeypatch.setenv("MASTER_EXCEL_PATH", str(excel_path))
    return excel_path


# ---------------------------------------------------------------------------
# Import after monkeypatching env
# ---------------------------------------------------------------------------

from services.excel_manager import _build_duplicate_key, _existing_keys, load_existing_data, update_excel


# ---------------------------------------------------------------------------
# Duplicate key building
# ---------------------------------------------------------------------------

class TestBuildDuplicateKey:
    def test_full_key(self):
        row = pd.Series({"Tag No": "RWL123", "Serial No": "SN456", "Date": "2025-01-01"})
        assert _build_duplicate_key(row) == "RWL123|SN456|2025-01-01"

    def test_fallback_no_tag(self):
        row = pd.Series({"Tag No": None, "Serial No": "SN456", "Date": "2025-01-01"})
        assert _build_duplicate_key(row) == "|SN456|2025-01-01"

    def test_none_key_when_both_missing(self):
        row = pd.Series({"Tag No": None, "Serial No": None, "Date": "2025-01-01"})
        assert _build_duplicate_key(row) is None

    def test_empty_string_tag(self):
        row = pd.Series({"Tag No": "", "Serial No": "SN789", "Date": "2025-02-01"})
        key = _build_duplicate_key(row)
        # Empty tag should fall through to serial-based key
        assert key == "|SN789|2025-02-01"


# ---------------------------------------------------------------------------
# Load existing data
# ---------------------------------------------------------------------------

class TestLoadExistingData:
    def test_returns_empty_df_when_no_file(self, tmp_path, monkeypatch):
        non_existent = tmp_path / "no_file.xlsx"
        monkeypatch.setenv("MASTER_EXCEL_PATH", str(non_existent))
        df, cols = load_existing_data(non_existent)
        assert df.empty
        assert "Model" in cols

    def test_loads_existing_records(self, tmp_path, monkeypatch):
        path = tmp_path / "existing.xlsx"
        monkeypatch.setenv("MASTER_EXCEL_PATH", str(path))
        seed = pd.DataFrame([{"Model": "R850", "Date": "2025-01-01", "Tag No": "T1"}])
        seed.to_excel(str(path), index=False, engine="openpyxl")
        df, cols = load_existing_data(path)
        assert len(df) == 1
        assert "Model" in cols


# ---------------------------------------------------------------------------
# update_excel — end-to-end
# ---------------------------------------------------------------------------

SAMPLE_RECORDS = [
    {
        "Model": "R850",
        "Direction": "Received",
        "Date": "2025-12-03",
        "Tag No": "RWL14799",
        "Serial No": "382372003579",
        "Type/Description": "901-R850-WW00",
        "Recipient/Team": None,
        "Notes": None,
    }
]


class TestUpdateExcel:
    def test_creates_file_on_first_run(self, patch_excel_path):
        result = update_excel(SAMPLE_RECORDS)
        assert result["records_added"] == 1
        assert patch_excel_path.exists()

    def test_duplicate_not_inserted(self, patch_excel_path):
        update_excel(SAMPLE_RECORDS)
        result = update_excel(SAMPLE_RECORDS)
        assert result["records_added"] == 0

    def test_new_columns_detected(self, patch_excel_path):
        update_excel(SAMPLE_RECORDS)
        new_record = [
            {
                **SAMPLE_RECORDS[0],
                "Tag No": "RWL99999",  # different → not a duplicate
                "Warranty End Date": "2027-01-01",
                "Rack Location": "A-12",
            }
        ]
        result = update_excel(new_record)
        assert "Warranty End Date" in result["new_columns_added"]
        assert "Rack Location" in result["new_columns_added"]

    def test_multiple_records_appended(self, patch_excel_path):
        records = [
            {**SAMPLE_RECORDS[0], "Tag No": f"TAG{i}", "Serial No": f"SN{i}"}
            for i in range(5)
        ]
        result = update_excel(records)
        assert result["records_added"] == 5

    def test_empty_records_list(self, patch_excel_path):
        result = update_excel([])
        assert result["records_added"] == 0
