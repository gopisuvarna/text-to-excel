"""
Tests for groq_extractor.py — JSON parsing and response cleaning.
These tests mock the Groq client so no real API key is needed.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from services.groq_extractor import _clean_llm_response, extract_records


# ---------------------------------------------------------------------------
# _clean_llm_response
# ---------------------------------------------------------------------------

class TestCleanLLMResponse:
    def test_strips_json_fence(self):
        raw = "```json\n{\"records\": []}\n```"
        assert _clean_llm_response(raw) == '{"records": []}'

    def test_strips_plain_fence(self):
        raw = "```\n{\"records\": []}\n```"
        assert _clean_llm_response(raw) == '{"records": []}'

    def test_no_fence_passthrough(self):
        raw = '{"records": []}'
        assert _clean_llm_response(raw) == '{"records": []}'

    def test_strips_whitespace(self):
        raw = "  \n{\"records\": []}  \n"
        assert _clean_llm_response(raw) == '{"records": []}'


# ---------------------------------------------------------------------------
# extract_records — mocked Groq calls
# ---------------------------------------------------------------------------

def _mock_groq_response(content: str):
    """Build a fake Groq completion response object."""
    choice = MagicMock()
    choice.message.content = content
    response = MagicMock()
    response.choices = [choice]
    return response


VALID_JSON = json.dumps({
    "records": [
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
})


class TestExtractRecords:
    @patch("services.groq_extractor.Groq")
    def test_successful_extraction(self, mock_groq_cls, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test-key")
        mock_client = MagicMock()
        mock_groq_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = _mock_groq_response(VALID_JSON)

        records = extract_records("some inventory text")
        assert len(records) == 1
        assert records[0]["Model"] == "R850"

    @patch("services.groq_extractor.Groq")
    def test_markdown_fenced_response_parsed(self, mock_groq_cls, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test-key")
        mock_client = MagicMock()
        mock_groq_cls.return_value = mock_client
        fenced = f"```json\n{VALID_JSON}\n```"
        mock_client.chat.completions.create.return_value = _mock_groq_response(fenced)

        records = extract_records("some text")
        assert len(records) == 1

    @patch("services.groq_extractor.Groq")
    def test_invalid_json_raises_value_error(self, mock_groq_cls, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test-key")
        mock_client = MagicMock()
        mock_groq_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = _mock_groq_response("not json at all")

        with pytest.raises(ValueError, match="invalid JSON"):
            extract_records("some text")

    def test_missing_api_key_raises(self, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "")
        with pytest.raises(EnvironmentError, match="GROQ_API_KEY"):
            extract_records("some text")

    @patch("services.groq_extractor.Groq")
    def test_groq_api_failure_raises_runtime_error(self, mock_groq_cls, monkeypatch):
        monkeypatch.setenv("GROQ_API_KEY", "test-key")
        mock_client = MagicMock()
        mock_groq_cls.return_value = mock_client
        mock_client.chat.completions.create.side_effect = Exception("connection refused")

        with pytest.raises(RuntimeError, match="Groq API error"):
            extract_records("some text")
