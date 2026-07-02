"""
groq_extractor.py — Sends text to Groq LLM and parses the structured JSON response.
"""

import json
import logging
import os
import re
from pathlib import Path

from groq import Groq

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "extraction_prompt.txt"
MODEL = "llama-3.3-70b-versatile"


def _load_system_prompt() -> str:
    """Load the extraction system prompt from disk."""
    if not PROMPT_PATH.exists():
        raise FileNotFoundError(f"Extraction prompt not found at {PROMPT_PATH}")
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def _clean_llm_response(raw: str) -> str:
    """
    Strip markdown fences or any leading/trailing non-JSON text from LLM output.
    The LLM is instructed not to add them, but this acts as a safety net.
    """
    # Remove ```json ... ``` or ``` ... ``` fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw.strip())
    return raw.strip()


def extract_records(text: str) -> list[dict]:
    """
    Send file text to Groq LLM and return a list of extracted record dicts.

    Raises:
        EnvironmentError: If GROQ_API_KEY is missing.
        ValueError: If the LLM response cannot be parsed as valid JSON.
        RuntimeError: If the Groq API call fails.
    """
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY is not set. Add it to your .env file."
        )

    system_prompt = _load_system_prompt()
    client = Groq(api_key=api_key)

    logger.info("Sending text to Groq (%d chars) using model %s", len(text), MODEL)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.0,
            max_tokens=4096,
        )
    except Exception as exc:
        logger.error("Groq API call failed: %s", exc)
        raise RuntimeError(f"Groq API error: {exc}") from exc

    raw_content = response.choices[0].message.content or ""
    logger.debug("Raw LLM response: %s", raw_content[:500])

    cleaned = _clean_llm_response(raw_content)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON response: %s\nRaw: %s", exc, cleaned[:300])
        raise ValueError(
            f"LLM returned invalid JSON: {exc}\nResponse snippet: {cleaned[:200]}"
        ) from exc

    records = parsed.get("records", [])
    if not isinstance(records, list):
        raise ValueError("LLM JSON response missing 'records' list.")

    logger.info("Extracted %d record(s) from LLM response", len(records))
    return records
