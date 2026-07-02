"""
parser.py — Reads and validates uploaded .txt files.
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def read_text_file(file_path: str) -> str:
    """
    Read a .txt file and return its content as a string.
    Raises ValueError for empty files or non-.txt files.
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if path.suffix.lower() != ".txt":
        raise ValueError(f"Invalid file type '{path.suffix}'. Only .txt files are accepted.")

    content = path.read_text(encoding="utf-8", errors="replace").strip()

    if not content:
        raise ValueError(f"File is empty: {file_path}")

    logger.info("File read successfully: %s (%d chars)", path.name, len(content))
    return content
