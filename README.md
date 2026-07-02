# Inventory AI Agent

A production-ready FastAPI service that converts `.txt` inventory/logistics files into a single, continuously updated Excel workbook using Groq LLM (Llama 3.3 70B) for intelligent field extraction.

---

## Features

- Upload one or multiple `.txt` files via a single API call
- Groq LLM extracts structured records from free-form text
- Automatically normalises dates (any format → `YYYY-MM-DD`)
- Classifies direction values (`Received`, `Shipped Out`, `Given to Team`, `Faulty`)
- Detects and appends new fields as Excel columns without manual intervention
- Duplicate prevention using `Tag No + Serial No + Date` composite key
- Professional Excel formatting (frozen header, auto-width columns, table styling)
- Full logging and meaningful error responses

---

## Project Structure

```
project/
├── app.py                        # FastAPI application & endpoints
├── services/
│   ├── parser.py                 # File reading & validation
│   ├── groq_extractor.py         # Groq LLM extraction
│   ├── schema_manager.py         # Normalisation & dynamic schema
│   └── excel_manager.py          # Excel load/update/format/save
├── prompts/
│   └── extraction_prompt.txt     # LLM system prompt
├── uploads/                      # Temporary file staging (auto-created)
├── output/
│   └── master_inventory.xlsx     # Master workbook (auto-created)
├── tests/
│   ├── test_schema_manager.py
│   ├── test_excel_manager.py
│   └── test_groq_extractor.py
├── .env
├── requirements.txt
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment

Edit `.env` and add your Groq API key:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
MASTER_EXCEL_PATH=output/master_inventory.xlsx
```

Get a free API key at: https://console.groq.com

### 3. Run the server

```bash
python app.py
```

Or with uvicorn directly:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API docs available at: `http://localhost:8000/docs`

---

## API Reference

### `POST /upload`

Upload one or more `.txt` files.

**Request:** `multipart/form-data` with field name `files`

```bash
# Single file
curl -X POST http://localhost:8000/upload \
  -F "files=@inventory_dec2025.txt"

# Multiple files
curl -X POST http://localhost:8000/upload \
  -F "files=@file1.txt" \
  -F "files=@file2.txt"
```

**Response:**

```json
{
  "status": "success",
  "records_added": 35,
  "new_columns_added": ["Warranty End Date", "Rack Location"],
  "files": [
    {
      "file": "inventory_dec2025.txt",
      "records_extracted": 35,
      "records_added": 35,
      "new_columns_added": ["Warranty End Date", "Rack Location"]
    }
  ]
}
```

---

### `GET /download`

Download the master Excel workbook.

```bash
curl -O http://localhost:8000/download
```

Returns `master_inventory.xlsx` as a file download.

---

## Master Schema

Initial columns (extended automatically as new fields appear):

| Column | Description |
|---|---|
| Model | Device model identifier |
| Direction | Normalised movement direction |
| Date | ISO 8601 date (YYYY-MM-DD) |
| Tag No | RWL tag number |
| Serial No | Device serial number |
| Type/Description | Part number or description |
| Recipient/Team | Receiving person or team |
| Notes | Additional notes |

---

## Dynamic Schema Expansion

When a new `.txt` file contains a field not yet in the Excel workbook (e.g. `Warranty End Date`), the agent:

1. Detects the missing column
2. Adds it to the Excel sheet
3. Backfills existing rows with blank values
4. Reports it in the API response under `new_columns_added`

No manual intervention required.

---

## Duplicate Handling

Records are deduplicated using a composite key:

```
Tag No + Serial No + Date
```

Fallback rules:
- If `Tag No` is missing → use `Serial No + Date`
- If both are missing → insert the record (no key to check)

---

## Date Normalization

All of the following are converted to `YYYY-MM-DD`:

| Input | Output |
|---|---|
| `03Dec2025` | `2025-12-03` |
| `03-Dec-2025` | `2025-12-03` |
| `2025/12/03` | `2025-12-03` |
| `12/03/2025` | `2025-12-03` |
| `December 3, 2025` | `2025-12-03` |

---

## Direction Classification

| Raw Value | Normalised |
|---|---|
| Received, Shipment Received, Received from Vendor | `Received` |
| Shipped, Sent Out, Dispatched | `Shipped Out` |
| Issued to Team, Assigned, Given to | `Given to Team` |
| Defective, Faulty, Damaged | `Faulty` |

---

## Running Tests

```bash
pytest tests/ -v
```

Tests cover:
- LLM response parsing and fence stripping
- Schema expansion and column merging
- Duplicate key generation and detection
- Excel create, update, and new-column workflows
- Date and direction normalization

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | *(required)* | Your Groq API key |
| `MASTER_EXCEL_PATH` | `output/master_inventory.xlsx` | Path to master workbook |
