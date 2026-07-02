"""
Tests for schema_manager.py — normalization, direction classification,
date parsing, and dynamic schema expansion.
"""

import pytest
from services.schema_manager import (
    get_new_columns,
    merge_schemas,
    normalize_date,
    normalize_direction,
    normalize_record,
)


# ---------------------------------------------------------------------------
# Date normalization
# ---------------------------------------------------------------------------

class TestNormalizeDate:
    def test_iso_format(self):
        assert normalize_date("2025-12-03") == "2025-12-03"

    def test_slash_format_ymd(self):
        assert normalize_date("2025/12/03") == "2025-12-03"

    def test_dd_mon_yyyy(self):
        assert normalize_date("03Dec2025") == "2025-12-03"

    def test_dd_dash_mon_yyyy(self):
        assert normalize_date("03-Dec-2025") == "2025-12-03"

    def test_mm_slash_dd_slash_yyyy(self):
        assert normalize_date("12/03/2025") == "2025-12-03"

    def test_long_month_name(self):
        assert normalize_date("December 3, 2025") == "2025-12-03"

    def test_none_passthrough(self):
        assert normalize_date(None) is None

    def test_unparseable_returns_original(self):
        assert normalize_date("not-a-date") == "not-a-date"

    def test_empty_string_returns_empty(self):
        # Empty string is falsy → returned as-is (empty str)
        assert normalize_date("") == ""


# ---------------------------------------------------------------------------
# Direction normalization
# ---------------------------------------------------------------------------

class TestNormalizeDirection:
    @pytest.mark.parametrize("raw,expected", [
        ("Received", "Received"),
        ("received from vendor", "Received"),
        ("Shipment Received", "Received"),
        ("Shipped", "Shipped Out"),
        ("Sent Out", "Shipped Out"),
        ("Dispatched", "Shipped Out"),
        ("Issued to Team", "Given to Team"),
        ("Assigned", "Given to Team"),
        ("Given to user", "Given to Team"),
        ("Defective", "Faulty"),
        ("Damaged unit", "Faulty"),
        ("Faulty", "Faulty"),
        ("Unknown status", "Unknown status"),  # no match → passthrough
        (None, None),
    ])
    def test_classification(self, raw, expected):
        assert normalize_direction(raw) == expected


# ---------------------------------------------------------------------------
# Record normalization
# ---------------------------------------------------------------------------

class TestNormalizeRecord:
    def test_empty_strings_become_none(self):
        record = {"Model": "R850", "Notes": "", "Direction": ""}
        result = normalize_record(record)
        assert result["Notes"] is None
        assert result["Direction"] is None

    def test_date_normalized(self):
        record = {"Date": "03Dec2025", "Model": "X1"}
        result = normalize_record(record)
        assert result["Date"] == "2025-12-03"

    def test_direction_normalized(self):
        record = {"Direction": "Dispatched", "Model": "X1"}
        result = normalize_record(record)
        assert result["Direction"] == "Shipped Out"

    def test_preserves_unknown_fields(self):
        record = {"Warranty End Date": "2027-01-01", "Rack Location": "A-12"}
        result = normalize_record(record)
        assert result["Warranty End Date"] == "2027-01-01"
        assert result["Rack Location"] == "A-12"


# ---------------------------------------------------------------------------
# Schema expansion
# ---------------------------------------------------------------------------

class TestGetNewColumns:
    def test_returns_new_keys(self):
        existing = ["Model", "Date", "Tag No"]
        record_keys = ["Model", "Date", "Tag No", "Warranty End Date", "Rack Location"]
        new = get_new_columns(existing, record_keys)
        assert new == ["Warranty End Date", "Rack Location"]

    def test_no_new_columns(self):
        existing = ["Model", "Date"]
        record_keys = ["Date", "Model"]
        assert get_new_columns(existing, record_keys) == []

    def test_all_new(self):
        existing: list[str] = []
        record_keys = ["A", "B", "C"]
        assert get_new_columns(existing, record_keys) == ["A", "B", "C"]


class TestMergeSchemas:
    def test_merges_preserving_order(self):
        existing = ["Model", "Date", "Tag No"]
        records = [
            {"Model": "X", "Date": "2025-01-01", "Tag No": "T1", "Rack": "A1"},
            {"Model": "Y", "Warranty": "2027-01-01"},
        ]
        merged = merge_schemas(existing, records)
        assert merged[:3] == ["Model", "Date", "Tag No"]
        assert "Rack" in merged
        assert "Warranty" in merged
        assert merged.index("Rack") < merged.index("Warranty")

    def test_no_duplicates_in_result(self):
        existing = ["A", "B"]
        records = [{"A": 1, "B": 2, "C": 3}, {"A": 1, "C": 3}]
        merged = merge_schemas(existing, records)
        assert merged.count("A") == 1
        assert merged.count("C") == 1
