# backend/app/api/upload.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any
import pandas as pd
import io
import logging
import tempfile
import os
from pathlib import Path

# Try to import PDF parser with proper error handling
try:
    # Try direct import from algorithms
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../algorithms/transformer/dga'))
    from pdf_parser import extract_pdf_tables
    logger = logging.getLogger(__name__)
    logger.info("✅ PDF parser loaded successfully")
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ PDF parser not found: {e}")
    logger.warning("⚠️ PDF upload will not work. Install pdfplumber and camelot-py")
    # Fallback function
    def extract_pdf_tables(pdf_path):
        logger.warning("PDF parser not available - returning empty data")
        return {}

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/excel")
async def upload_excel(file: UploadFile = File(...)):
    """
    Upload and parse Excel file containing DGA data
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel (.xlsx or .xls)")
    
    try:
        content = await file.read()
        
        # Read Excel file
        df = pd.read_excel(io.BytesIO(content))
        
        # Define expected gas columns and their aliases
        gas_columns = {
            'h2': ['h2', 'hydrogen'],
            'ch4': ['ch4', 'methane'],
            'c2h2': ['c2h2', 'acetylene'],
            'c2h4': ['c2h4', 'ethylene'],
            'c2h6': ['c2h6', 'ethane'],
            'co': ['co', 'carbon monoxide'],
            'co2': ['co2', 'carbon dioxide'],
            'o2': ['o2', 'oxygen'],
            'n2': ['n2', 'nitrogen']
        }
        
        # Map columns
        column_mapping = {}
        for gas, aliases in gas_columns.items():
            for col in df.columns:
                col_lower = str(col).lower().strip()
                if any(alias in col_lower for alias in aliases):
                    column_mapping[gas] = col
                    break
        
        # Find date column
        date_column = None
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if 'date' in col_lower or 'sample date' in col_lower or 'test date' in col_lower:
                date_column = col
                break
        
        if not date_column:
            date_column = df.columns[0]
        
        # Extract data
        samples = []
        for idx, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row[date_column]):
                continue
                
            sample = {
                'id': idx + 1,
                'date': str(row[date_column]) if pd.notna(row[date_column]) else None,
                'temp': 61  # default temperature
            }
            
            # Extract gas values
            for gas, col_name in column_mapping.items():
                if col_name in df.columns:
                    value = row[col_name]
                    if pd.notna(value):
                        try:
                            sample[gas] = float(value)
                        except (ValueError, TypeError):
                            sample[gas] = None
                    else:
                        sample[gas] = None
                else:
                    sample[gas] = None
            
            # Skip if no date
            if not sample.get('date'):
                continue
                
            samples.append(sample)
        
        return {
            "success": True,
            "filename": file.filename,
            "total_samples": len(samples),
            "samples": samples
        }
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and parse PDF file containing DGA data
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be PDF")
    
    temp_path = None
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            temp_path = tmp_file.name
        
        logger.info(f"PDF saved to: {temp_path}")
        
        # Call your PDF parser
        parsed_data = extract_pdf_tables(temp_path)
        
        # Convert parsed data to samples format
        samples = []
        for idx, (row_num, row_data) in enumerate(parsed_data.items(), 1):
            sample = {
                'id': idx,
                'date': row_data.get('date'),
                'h2': row_data.get('H2'),
                'ch4': row_data.get('CH4'),
                'c2h2': row_data.get('C2H2'),
                'c2h4': row_data.get('C2H4'),
                'c2h6': row_data.get('C2H6'),
                'co': row_data.get('CO'),
                'co2': row_data.get('CO2'),
                'o2': row_data.get('O2'),
                'n2': row_data.get('N2'),
                'temp': 61  # default temperature
            }
            samples.append(sample)
        
        return {
            "success": True,
            "filename": file.filename,
            "total_samples": len(samples),
            "samples": samples
        }
        
    except Exception as e:
        logger.error(f"Error processing PDF file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Deleted temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to delete temporary file: {e}")