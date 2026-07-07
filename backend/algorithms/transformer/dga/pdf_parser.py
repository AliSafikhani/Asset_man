# backend/algorithms/transformer/dga/pdf_parser.py

"""
PDF Parser for DGA Reports
Extracts DGA gas data from PDF tables
"""

import pdfplumber
import pandas as pd
import re
import logging
from pathlib import Path
from collections import defaultdict
import camelot
import jdatetime
from datetime import date as GregorianDate
from typing import List, Dict, Any, Union

# --- Configuration Constants ---
DEFAULT_X_TOLERANCE = 3
DEFAULT_Y_TOLERANCE = 8
ROW_GAP_THRESHOLD = 40
PRINT_MAX_ROWS = 8

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Define the DGA gas columns we are interested in.
GAS_COLUMNS = {'H2', 'CH4', 'C2H6', 'CO', 'C2H2', 'C2H4', 'CO2', 'O2', 'N2'}

# Define specific order for gas matching (longest first → avoids partial overlaps like C2H6 vs H2)
GAS_SEARCH_ORDER = sorted(list(GAS_COLUMNS), key=lambda x: (-len(x), x))
# ['C2H6', 'C2H4', 'C2H2', 'CH4', 'CO2', 'O2', 'N2', 'CO', 'H2']


# --- Utility Functions ---
def normalize_header_token(tok: str) -> str:
    tok = str(tok or "").strip()
    tok = tok.replace("₂", "2").replace("₆", "6").replace("₄", "4").replace("₅", "5")
    tok = tok.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
    tok = tok.lower().replace(" ", "")
    tok = re.sub(r"[^a-z0-9/آ-ی]", "", tok)
    return tok


def contains_target_gases_only(headers: List[str]) -> bool:
    gas_pattern = re.compile(r"\b(h2|ch4|co|co2|o2|n2|c2h2|c2h4|c2h6)\b", re.IGNORECASE)
    ratio_pattern = re.compile(r"(h2|ch4|co2|co|c2h2|c2h4|c2h6)\s*/\s*(h2|ch4|co2|co|c2h2|c2h4|c2h6)", re.IGNORECASE)

    has_target_gas = False
    for tok in headers:
        tok_norm = normalize_header_token(tok)
        if ratio_pattern.search(tok_norm):
            return False
        if gas_pattern.search(tok_norm):
            has_target_gas = True

    has_date = any('date' in str(h).lower() for h in headers)
    return has_target_gas or has_date


def ensure_valid_headers(headers: List[str]) -> List[str]:
    valid_headers = []
    header_counts = defaultdict(int)
    for i, h in enumerate(headers):
        h = str(h or f"col_{i+1}").strip()
        if not h:
            h = f"col_{i+1}"
        original_key = h.split('_')[0]
        if header_counts[original_key]:
            h = f"{h}_{header_counts[original_key]}"
        header_counts[original_key] += 1
        valid_headers.append(h)
    return valid_headers


def all_textual(df: pd.DataFrame) -> bool:
    return not df.map(
        lambda x: isinstance(x, (int, float, str)) and str(x).replace(".", "").replace("-", "").replace(" ", "").isdigit()
    ).any().any()


def convert_numbers_to_english(df: pd.DataFrame) -> pd.DataFrame:
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    english_digits = "0123456789"
    translation_table = str.maketrans(persian_digits, english_digits)

    def convert_cell(cell):
        if isinstance(cell, str):
            return cell.translate(translation_table)
        return cell

    return df.map(convert_cell)


def is_duplicate(df: pd.DataFrame, existing_tables: List[pd.DataFrame]) -> bool:
    df_str = df.to_json()
    for e in existing_tables:
        if df_str == e.to_json():
            return True
    return False


# --- Date Conversion ---
def jalali_to_gregorian(jy: int, jm: int, jd: int) -> Union[str, None]:
    try:
        jalali_date_obj = jdatetime.date(jy, jm, jd)
        gregorian_date_obj = jalali_date_obj.togregorian()
        return f'{gregorian_date_obj.year:04d}/{gregorian_date_obj.month:02d}/{gregorian_date_obj.day:02d}'
    except ValueError as e:
        logging.debug(f"Error converting assumed Jalali date {jy}/{jm}/{jd}: {e}")
        return None


def standardize_date(date_str: str) -> Union[str, None]:
    date_str = date_str.strip()
    if not date_str:
        return None

    date_part = date_str.split(' ')[0]
    try:
        parts = re.split(r'[/\-.]', date_part)
        if len(parts) != 3:
            return None

        p1, p2, p3 = map(int, parts)

        if p1 > 1000:
            y, m, d = p1, p2, p3
        elif p3 > 1000:
            d, m, y = p1, p2, p3
        elif p1 < 100 and p2 < 13 and p3 < 100:
            y = 2000 + p3
            d, m = p1, p2
        else:
            return None
    except ValueError:
        return None

    if 1300 <= y <= 1500:
        return jalali_to_gregorian(y, m, d)
    else:
        try:
            greg_obj = GregorianDate(y, m, d)
            return f'{greg_obj.year:04d}/{greg_obj.month:02d}/{greg_obj.day:02d}'
        except ValueError:
            return None


# --- ND/Zero Check ---
def check_nd(value_str: str) -> bool:
    if not isinstance(value_str, str):
        return False
    nd_placeholders = ['nd', 'n.d.', '---', 'nil', 'none', 'trace', 'n.m.']
    value_str = value_str.lower().strip()
    if re.search(r'\d', value_str):
        return False
    if not value_str or value_str == '-':
        return True
    if any(placeholder in value_str for placeholder in nd_placeholders):
        return True
    return False


# --- Numeric Extraction ---
def extract_numeric_value(value_str: str) -> Union[float, None]:
    if not isinstance(value_str, str):
        return None
    cleaned_str = value_str.replace(',', '').replace(' ', '').strip()
    cleaned_str = cleaned_str.replace('<', '').replace('>', '').replace('=', '')
    match = re.search(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', cleaned_str)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            logging.debug(f"Regex match failed float conversion for: {match.group(0)}")
            return None
    return None


# --- Data Integration ---
def dataframes_to_final_dict(dataframes: List[pd.DataFrame]) -> List[Dict[str, Any]]:
    merged_samples_list: List[Dict[str, Any]] = []

    for df in dataframes:
        if df.empty or len(df.columns) < 2:
            continue

        key_column_name = None
        for col in df.columns:
            if 'date' in str(col).lower():
                key_column_name = col
                break
        if key_column_name is None:
            key_column_name = df.columns[0]
        if key_column_name not in df.columns:
            continue

        data_columns = [c for c in df.columns if c != key_column_name]

        for _, row in df.iterrows():
            raw_date_key = str(row[key_column_name]).strip()
            standardized_date = standardize_date(raw_date_key)
            if not standardized_date:
                continue

            inner_data = {}

            for col_name in data_columns:
                value = row[col_name]
                standard_key = None
                normalized_col_name = normalize_header_token(col_name)

                for target_gas in GAS_SEARCH_ORDER:
                    normalized_target_gas = target_gas.lower()
                    pattern = r'\b' + re.escape(normalized_target_gas) + r'(?![\d])\b'
                    if re.search(pattern, normalized_col_name):
                        standard_key = target_gas
                        break

                if standard_key:
                    str_value = str(value).strip()

                    if check_nd(str_value):
                        inner_data[standard_key] = 0.0
                    else:
                        extracted_number = extract_numeric_value(str_value)
                        if isinstance(extracted_number, float):
                            inner_data[standard_key] = extracted_number
                        else:
                            if re.search(r'\d', str_value):
                                logging.warning(f"Failed to extract number for {standard_key} from '{str_value}' → marked 'NA'.")
                            inner_data[standard_key] = str_value

            inner_data['date'] = standardized_date
            merged_samples_list.append(inner_data)

    return merged_samples_list


def filter_negative_samples(samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    filtered_list = []
    for sample in samples:
        has_negative = any(isinstance(sample.get(gas), float) and sample[gas] < 0 for gas in GAS_COLUMNS)
        if not has_negative:
            filtered_list.append(sample)
    return filtered_list


def format_final_output(merged_samples_list: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
    sorted_samples = sorted(merged_samples_list, key=lambda x: x['date'])
    final_dict: Dict[int, Dict[str, Any]] = {}
    row_index = 1
    
    for data in sorted_samples:
        row_data = {'date': data['date']}
        
        gas_values = {}
        for target_gas in GAS_COLUMNS:
            value = data.get(target_gas)
            standardized_value = value if isinstance(value, float) else 'NA'
            row_data[target_gas] = standardized_value
            gas_values[target_gas] = standardized_value

        if all(val == 'NA' for val in gas_values.values()):
            logging.debug(f"Row for date {data['date']} skipped as all gas values are 'NA'.")
            continue
        
        final_dict[row_index] = row_data
        row_index += 1
        
    return final_dict


# --- Main PDF Extraction ---
def extract_pdf_tables(pdf_file: str, outdir: str = "output_tables", save_csv: bool = True) -> Dict[int, Dict[str, Any]]:
    """
    Extract DGA data from PDF file
    
    Args:
        pdf_file: Path to PDF file
        outdir: Directory to save CSV files (if save_csv=True)
        save_csv: Whether to save extracted tables as CSV
    
    Returns:
        Dictionary with extracted DGA data
    """
    pdf_path = Path(pdf_file)
    if not pdf_path.exists():
        logging.error(f"PDF not found: {pdf_path}")
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    all_dataframes: List[pd.DataFrame] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            page_tables = []

            # Try pdfplumber
            try:
                table_settings = {'vertical_strategy': 'lines', 'horizontal_strategy': 'lines'}
                plumber_tables = page.extract_tables(table_settings)
                for raw_table in plumber_tables:
                    if raw_table and len(raw_table) > 1:
                        headers = ensure_valid_headers(raw_table[0])
                        df = pd.DataFrame(raw_table[1:], columns=headers)
                        df = convert_numbers_to_english(df)
                        if contains_target_gases_only(df.columns) and not all_textual(df):
                            page_tables.append(df)
            except Exception as e:
                logging.debug(f"pdfplumber extraction failed: {e}")

            # Fallback to Camelot
            if not page_tables:
                try:
                    tables_c = camelot.read_pdf(str(pdf_path), pages=str(page_num), flavor="stream", suppress_stdout=True)
                    for t in tables_c:
                        df = t.df
                        df = convert_numbers_to_english(df)
                        if not df.empty and contains_target_gases_only(df.iloc[0].tolist()):
                            df.columns = ensure_valid_headers(df.iloc[0].tolist())
                            df = df[1:].reset_index(drop=True)
                            if not all_textual(df):
                                page_tables.append(df)
                except Exception as e:
                    logging.warning(f"Camelot extraction failed on page {page_num}: {e}")

            # Deduplicate
            unique_tables = []
            for df in page_tables:
                if not df.empty and not is_duplicate(df, unique_tables):
                    unique_tables.append(df)

            for i, df in enumerate(unique_tables, 1):
                all_dataframes.append(df)
                if save_csv:
                    outdir_path = Path(outdir)
                    outdir_path.mkdir(parents=True, exist_ok=True)
                    out_file = outdir_path / f"page{page_num}_table{i}.csv"
                    df.to_csv(out_file, index=False, encoding="utf-8-sig")

    if not all_dataframes:
        print("\nNo relevant DGA concentration tables detected.")
        return {}

    merged_samples_list = dataframes_to_final_dict(all_dataframes)
    filtered_samples_list = filter_negative_samples(merged_samples_list)
    final_dga_data = format_final_output(filtered_samples_list)
    return final_dga_data


# --- Test Function ---
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        PDF_FILE = sys.argv[1]
    else:
        PDF_FILE = "TFRDGAREPORT6.pdf"
    
    try:
        logging.getLogger().setLevel(logging.ERROR)
        final_dga_data = extract_pdf_tables(PDF_FILE)
        logging.getLogger().setLevel(logging.INFO)

        print("\n✅ Final Processed DGA Data Dictionary:")
        if not final_dga_data:
            print("  (Empty dictionary - no valid DGA data found.)")
        else:
            for i, (k, v) in enumerate(final_dga_data.items()):
                if i < 10:
                    print(f"  {{{k}: {v}}}")
                else:
                    print(f"  ... ({len(final_dga_data) - 10} more entries)")
                    break
    except FileNotFoundError as e:
        print(f"\n❌ ERROR: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")