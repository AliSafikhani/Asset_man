# backend/algorithms/transformer/dga/pdf_parser.py

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

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Define the DGA gas columns we are interested in.
GAS_COLUMNS = {'H2', 'CH4', 'C2H6', 'CO', 'C2H2', 'C2H4', 'CO2', 'O2', 'N2'}

# Define specific order for gas matching (longest first → avoids partial overlaps like C2H6 vs H2)
GAS_SEARCH_ORDER = sorted(list(GAS_COLUMNS), key=lambda x: (-len(x), x))

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

    for tok in headers:
        tok_norm = normalize_header_token(tok)
        if gas_pattern.search(tok_norm):
            return True
    
    return False

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
        return f'{gregorian_date_obj.year:04d}-{gregorian_date_obj.month:02d}-{gregorian_date_obj.day:02d}'
    except ValueError as e:
        logging.debug(f"Error converting assumed Jalali date {jy}/{jm}/{jd}: {e}")
        return None

def standardize_date(date_str: str) -> Union[str, None]:
    """
    Standardize date format - finds date by value, not by column name
    """
    date_str = str(date_str).strip()
    if not date_str or date_str.lower() in ['na', 'n/a', '-', '']:
        return None

    # Remove time part if exists (e.g., "16/04/2023 00:00")
    date_str = re.sub(r'\s+\d{2}:\d{2}', '', date_str)
    date_str = date_str.strip()

    # Try different date formats
    patterns = [
        (r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})', 'dmy'),      # 16/04/2023
        (r'(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})', 'ymd'),      # 2023/04/16
        (r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})', 'dmy_yy'),   # 16/04/23
        (r'(\d{2})[/\-](\d{2})[/\-](\d{4})', 'mdy'),          # 04/16/2023
    ]
    
    for pattern, format_type in patterns:
        match = re.search(pattern, date_str)
        if match:
            try:
                if format_type == 'dmy':
                    d, m, y = map(int, match.groups())
                    if 1300 <= y <= 1500:
                        return jalali_to_gregorian(y, m, d)
                    elif 1900 <= y <= 2100:
                        try:
                            greg_obj = GregorianDate(y, m, d)
                            return f'{greg_obj.year:04d}-{greg_obj.month:02d}-{greg_obj.day:02d}'
                        except ValueError:
                            pass
                elif format_type == 'ymd':
                    y, m, d = map(int, match.groups())
                    if 1300 <= y <= 1500:
                        return jalali_to_gregorian(y, m, d)
                    elif 1900 <= y <= 2100:
                        try:
                            greg_obj = GregorianDate(y, m, d)
                            return f'{greg_obj.year:04d}-{greg_obj.month:02d}-{greg_obj.day:02d}'
                        except ValueError:
                            pass
                elif format_type == 'dmy_yy':
                    d, m, y = map(int, match.groups())
                    y = 2000 + y if y < 100 else y
                    if 1900 <= y <= 2100:
                        try:
                            greg_obj = GregorianDate(y, m, d)
                            return f'{greg_obj.year:04d}-{greg_obj.month:02d}-{greg_obj.day:02d}'
                        except ValueError:
                            pass
                elif format_type == 'mdy':
                    m, d, y = map(int, match.groups())
                    if 1900 <= y <= 2100:
                        try:
                            greg_obj = GregorianDate(y, m, d)
                            return f'{greg_obj.year:04d}-{greg_obj.month:02d}-{greg_obj.day:02d}'
                        except ValueError:
                            pass
            except Exception:
                continue
    
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
            return None
    return None

# --- Data Integration ---
def dataframes_to_final_dict(dataframes: List[pd.DataFrame]) -> List[Dict[str, Any]]:
    merged_samples_list: List[Dict[str, Any]] = []

    for df in dataframes:
        if df.empty or len(df.columns) < 2:
            continue

        # CRITICAL: Find date column by looking at VALUES, not column name
        date_column = None
        
        # Check each column for date-like values
        for col in df.columns:
            # Check first few rows for date patterns
            for idx in range(min(5, len(df))):
                sample_value = str(df[col].iloc[idx]) if len(df) > idx else ''
                # Check for common date patterns (including time)
                if re.search(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}(\s+\d{1,2}:\d{2})?', sample_value):
                    date_column = col
                    print(f"DEBUG: Found date column: {col} (sample value: {sample_value})")
                    break
            if date_column:
                break
        
        # If no date column found, try by column name
        if date_column is None:
            for col in df.columns:
                col_lower = str(col).lower().strip()
                if 'date' in col_lower or 'تاریخ' in col_lower:
                    date_column = col
                    print(f"DEBUG: Found date column by name: {col}")
                    break
        
        # If still no date column found, use the first column
        if date_column is None:
            date_column = df.columns[0]
            print(f"DEBUG: Using fallback column: {date_column}")
            
        if date_column not in df.columns:
            continue

        data_columns = [c for c in df.columns if c != date_column]

        for row_idx, row in df.iterrows():
            raw_date_key = str(row[date_column]).strip()
            
            # Skip placeholder dates
            if re.search(r'mm[/\-]dd|dd[/\-]mm|mm-dd|dd-mm', raw_date_key, re.IGNORECASE):
                print(f"DEBUG: Skipping placeholder date: {raw_date_key}")
                continue
            
            # Skip empty dates
            if not raw_date_key or raw_date_key.lower() in ['na', 'n/a', '-', '']:
                continue
                
            # Try to parse date
            standardized_date = standardize_date(raw_date_key)
            if not standardized_date:
                print(f"DEBUG: Could not parse date: '{raw_date_key}'")
                continue

            inner_data = {}

            # Map gas values
            for col_name in data_columns:
                value = row[col_name]
                standard_key = None
                normalized_col_name = normalize_header_token(col_name)
                
                # Try to match gas names
                for target_gas in GAS_SEARCH_ORDER:
                    normalized_target_gas = target_gas.lower()
                    # Match gas name in column header
                    if normalized_target_gas in normalized_col_name or normalized_col_name in normalized_target_gas:
                        standard_key = target_gas
                        break
                
                # If no match found, try to infer from column position
                if standard_key is None:
                    # Map by position based on common DGA report format
                    gas_order = ['H2', 'O2', 'N2', 'CO', 'CO2', 'CH4', 'C2H4', 'C2H6', 'C2H2']
                    idx = data_columns.index(col_name) if col_name in data_columns else -1
                    if 0 <= idx < len(gas_order):
                        standard_key = gas_order[idx]

                if standard_key:
                    str_value = str(value).strip()
                    
                    # Remove units like "ppm", "vol%" etc.
                    str_value = re.sub(r'\s*(ppm|ppb|vol%|%|mg/l|mg/L)', '', str_value, flags=re.IGNORECASE)
                    str_value = str_value.strip()
                    
                    # Check if it's "NA" or similar
                    if check_nd(str_value):
                        inner_data[standard_key] = None
                    else:
                        extracted_number = extract_numeric_value(str_value)
                        if isinstance(extracted_number, float):
                            inner_data[standard_key] = extracted_number
                        elif extracted_number is None and str_value and str_value != '':
                            # If not a number, keep as is (might be a string like "NA")
                            inner_data[standard_key] = str_value
                        else:
                            inner_data[standard_key] = None

            # Skip rows where all gas values are None
            gas_values = [v for k, v in inner_data.items() if k != 'date']
            if all(v is None for v in gas_values):
                print(f"DEBUG: Skipping row with all None gas values for date: {standardized_date}")
                continue
                
            inner_data['date'] = standardized_date
            merged_samples_list.append(inner_data)
            print(f"DEBUG: Added row for date: {standardized_date} with {len(inner_data)-1} gas values")

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
        
        for target_gas in GAS_COLUMNS:
            value = data.get(target_gas)
            # Standardize non-float values to 'NA'
            standardized_value = value if isinstance(value, float) else 'NA'
            row_data[target_gas] = standardized_value
        
        final_dict[row_index] = row_data
        row_index += 1
        
    return final_dict

# --- Main PDF Extraction ---
def extract_pdf_tables(pdf_file: str, outdir: str = "output_tables", save_csv: bool = True) -> Dict[int, Dict[str, Any]]:
    pdf_path = Path(pdf_file)
    if not pdf_path.exists():
        logging.error(f"PDF not found: {pdf_path}")
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    all_dataframes: List[pd.DataFrame] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            page_tables = []

            # Try pdfplumber with different strategies
            strategies = ['lines', 'text', 'cells']
            for strategy in strategies:
                try:
                    table_settings = {
                        'vertical_strategy': strategy,
                        'horizontal_strategy': strategy,
                        'snap_tolerance': 3,
                        'join_tolerance': 3,
                        'edge_min_length': 3,
                        'min_words_vertical': 1,
                        'min_words_horizontal': 1,
                    }
                    plumber_tables = page.extract_tables(table_settings)
                    for raw_table in plumber_tables:
                        if raw_table and len(raw_table) > 1:
                            headers = ensure_valid_headers(raw_table[0])
                            df = pd.DataFrame(raw_table[1:], columns=headers)
                            df = convert_numbers_to_english(df)
                            if contains_target_gases_only(df.columns) and not all_textual(df):
                                page_tables.append(df)
                except Exception as e:
                    logging.debug(f"pdfplumber extraction failed with strategy {strategy}: {e}")

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
                    logging.debug(f"Camelot extraction failed on page {page_num}: {e}")

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

# --- Run Main ---
if __name__ == "__main__":
    import sys
    PDF_FILE = sys.argv[1] if len(sys.argv) > 1 else "TFRDGAREPORT6.pdf"
    try:
        logging.getLogger().setLevel(logging.INFO)
        final_dga_data = extract_pdf_tables(PDF_FILE)
        
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