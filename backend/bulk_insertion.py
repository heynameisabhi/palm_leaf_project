from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import csv
from PIL import Image
from typing import List, Dict, Any, Optional
import re

class CSVProcessRequest(BaseModel):
    csv_file_path: str
    folders_base_path: str

# Updated header aliases to match your exact CSV headers
HEADER_ALIASES = {
    "s_no": ["s no", "s_no", "S No"],
    "deck_origin": ["deck origin", "deck_origin", "Deck origin"],
    "deck_owner_name": ["deck ownername", "deck owner name", "deck_owner_name", "Deck OwnerName"],
    "deck_id": ["deck id", "deck_id", "Deck Id"],
    "deck_name": ["deck name", "deck_name", "Deck Name"],
    "grantha_name": ["grantha name", "grantha_name", "Grantha Name"],
    "subworks": ["subworks", "Subworks"],
    "scanning_start_date": ["scanning start date", "scanning_start_date", "Scanning Start Date"],
    "scanning_completed_date": ["scanning completed date", "scanning_completed_date", "Scanning Completed Date"],
    "post_scanning_completed_date": ["post scanning completed date", "post_scanning_completed_date", "Post Scanning Completed Date"],
    "length": ["length (cm)", "length", "Length (cm)"],
    "width": ["width (cm)", "width", "Width (cm)"],
    "remarks": ["remarks", "Remarks"],
    "stitch_or_nonstitch": [
        "stitch or nonstitch", "stitch_or_nonstitch", "stitch / nonstitch",
        "stitch_or_non-stitch", "stitch or non-stitch", "Stitch / Nonstitch"
    ],
    "condition": ["condition", "Condition"],
    "horizontal_or_vertical_scan": [
        "horizontal or vertical scan", "horizontal_or_vertical_scan", "horizontal / vertical scan",
        "Horizontal / Vertical Scan"
    ],
    "worked_by": ["worked by", "worked_by", "Worked By"],
    "scanner_model": ["scanner model", "scanner_model", "Scanner Model"],
    "lighting_conditions": ["lighting conditions", "lighting_conditions", "Lighting Conditions"],
}

def clean_key(key: str) -> str:
    """Clean and normalize a key for comparison"""
    return key.strip().lower().replace("-", " ").replace("_", " ").replace("/", " ").replace("(", "").replace(")", "")

def clean_language_text(text: str) -> str:
    """Clean language text by removing all types of quotes and extra whitespace"""
    if not text:
        return text
    
    # Remove all types of quotes: single, double, curly quotes, etc.
    cleaned = text.strip()
    
    # Remove various quote characters
    quote_chars = ['"', "'", '"', '"', ''', ''', '`', '´']
    for quote in quote_chars:
        cleaned = cleaned.replace(quote, '')
    
    # Clean up extra whitespace
    cleaned = cleaned.strip()
    
    # Capitalize first letter for consistency
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:].lower()
    
    return cleaned

def create_header_mapping(csv_headers: List[str]) -> Dict[str, str]:
    """Create a mapping from actual CSV headers to canonical field names"""
    header_mapping = {}
    
    for csv_header in csv_headers:
        cleaned_csv_header = clean_key(csv_header)
        
        # Find matching canonical key
        found_match = False
        for canonical_key, aliases in HEADER_ALIASES.items():
            for alias in aliases:
                if clean_key(alias) == cleaned_csv_header:
                    header_mapping[csv_header] = canonical_key
                    found_match = True
                    break
            if found_match:
                break
        
        # If no match found, keep original (for debugging)
        if not found_match:
            header_mapping[csv_header] = csv_header.lower().replace(" ", "_")
    
    return header_mapping

def read_and_normalize_csv(csv_path: str) -> List[Dict[str, str]]:
    """Read CSV file and normalize all rows with proper header mapping"""
    normalized_rows = []
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        # Read the CSV file
        csv_reader = csv.DictReader(file)
        
        # Get the actual headers from CSV
        actual_headers = csv_reader.fieldnames
        print(f"[DEBUG] Actual CSV Headers: {actual_headers}")
        
        # Create header mapping
        header_mapping = create_header_mapping(actual_headers)
        print(f"[DEBUG] Header Mapping: {header_mapping}")
        
        # Read and normalize all rows
        for row_index, row in enumerate(csv_reader):
            normalized_row = {}
            
            # Map each field using the header mapping
            for original_header, value in row.items():
                canonical_key = header_mapping.get(original_header, original_header)
                normalized_row[canonical_key] = value or ""  # Handle None values
            
            # Debug first few rows
            if row_index < 3:
                print(f"[DEBUG] Row {row_index + 1} Original: {dict(row)}")
                print(f"[DEBUG] Row {row_index + 1} Normalized: {normalized_row}")
                print(f"[DEBUG] deck_name value: '{normalized_row.get('deck_name', 'NOT FOUND')}'")
            
            normalized_rows.append(normalized_row)
    
    return normalized_rows

# Helper functions (keeping your existing ones)
def extract_trailing_number(folder_name: str) -> int:
    """Extract the last number from a folder name like TP_DBU-0001-W03 for sorting"""
    match = re.search(r'(\d+)(?!.*\d)', folder_name)
    return int(match.group(1)) if match else float('inf')

def get_color_depth(img):
    try:
        mode = img.mode
        is_16bit_per_channel = False

        if hasattr(img, 'tag_v2') and img.tag_v2 is not None:
            bits_per_sample = img.tag_v2.get(258)
            if bits_per_sample:
                if isinstance(bits_per_sample, (list, tuple)):
                    if any(b == 16 for b in bits_per_sample):
                        is_16bit_per_channel = True
                elif bits_per_sample == 16:
                    is_16bit_per_channel = True

        if img.format in ['TIFF', 'PNG'] and 'transparency' not in img.info:
            if hasattr(img, 'getextrema'):
                try:
                    extrema = img.getextrema()
                    if isinstance(extrema, tuple) and len(extrema) == 2:
                        if extrema[1] > 255:
                            is_16bit_per_channel = True
                except:
                    pass

        mode_map = {
            "1": "1-bit",
            "L": "16-bit grayscale" if is_16bit_per_channel else "8-bit grayscale",
            "P": "8-bit palette",
            "RGB": "48-bit RGB" if is_16bit_per_channel else "24-bit RGB",
            "RGBA": "64-bit RGBA" if is_16bit_per_channel else "32-bit RGBA",
            "CMYK": "64-bit CMYK" if is_16bit_per_channel else "32-bit CMYK",
            "YCbCr": "48-bit YCbCr" if is_16bit_per_channel else "24-bit YCbCr",
            "LAB": "48-bit LAB" if is_16bit_per_channel else "24-bit LAB",
            "HSV": "48-bit HSV" if is_16bit_per_channel else "24-bit HSV",
            "LA": "32-bit grayscale with alpha" if is_16bit_per_channel else "16-bit grayscale with alpha",
            "PA": "16-bit palette with alpha",
            "I": "32-bit integer",
            "F": "32-bit float"
        }

        return mode_map.get(mode, f"Unknown mode: {mode}")
    except Exception as e:
        return f"Error extracting color depth: {str(e)}"

def make_dpi_serializable(dpi_value):
    if dpi_value is None:
        return None
    try:
        if isinstance(dpi_value, tuple):
            return tuple(float(x) if hasattr(x, "__float__") else x for x in dpi_value)
        elif hasattr(dpi_value, "__float__"):
            return float(dpi_value)
        else:
            return "Unknown"
    except Exception:
        return "Unknown"

def get_folder_structure(root_path):
    folder_structure = {"path": root_path, "files": [], "subfolders": []}
    for root, dirs, files in os.walk(root_path):
        current_folder = {"path": root, "files": [], "subfolders": []}

        for file in files:
            file_path = os.path.join(root, file)
            extension = os.path.splitext(file)[-1].lower()
            file_info = {
                "name": file,
                "path": file_path,
                "extension": extension,
                "size": os.path.getsize(file_path),
            }

            if extension in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]:
                try:
                    with Image.open(file_path) as img:
                        file_info["resolution"] = img.size
                        dpi = img.info.get("dpi")
                        file_info["dpi"] = make_dpi_serializable(dpi)
                        file_info["color_depth"] = get_color_depth(img)
                except Exception as e:
                    file_info["error"] = str(e)
                    file_info["resolution"] = None
                    file_info["dpi"] = None

            current_folder["files"].append(file_info)

        for subdir in sorted(dirs, key=extract_trailing_number):
            subfolder_path = os.path.join(root, subdir)
            subfolder_data = get_folder_structure(subfolder_path)
            current_folder["subfolders"].append(subfolder_data)

        if root == root_path:
            folder_structure = current_folder

    total_images = sum(
        1 for f in folder_structure["files"]
        if os.path.splitext(f["name"])[-1].lower() in
        [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]
    )
    for subfolder in folder_structure.get("subfolders", []):
        total_images += subfolder.get("totalImages", 0)

    return {**folder_structure, "totalImages": total_images}

def parse_grantha_info(grantha_text):
    """Parse grantha info and clean language text"""
    pattern = r"(.+?)\s*:\s*(.+?)\s*-\s*(.+)"
    match = re.match(pattern, grantha_text.strip())
    if match:
        name = match.group(1).strip()
        author = match.group(2).strip()
        language = clean_language_text(match.group(3).strip())  # Clean the language
        
        return {
            "name": name,
            "author": author,
            "language": language
        }
    return {
        "name": grantha_text.strip(),
        "author": "Unknown",
        "language": "Unknown"
    }

def parse_subworks(subworks_text):
    """Parse subworks and clean language text for each"""
    subworks = []
    for subwork in re.split(r'\s*,\s*', subworks_text.strip()):
        if subwork:
            parsed_subwork = parse_grantha_info(subwork)
            subworks.append(parsed_subwork)
    return subworks

def process_csv(app, csv_path, folders_base_path):
    if not os.path.exists(csv_path) or not os.path.isfile(csv_path):
        raise HTTPException(status_code=400, detail="Invalid CSV file path")
    if not os.path.exists(folders_base_path) or not os.path.isdir(folders_base_path):
        raise HTTPException(status_code=400, detail="Invalid folders base path")

    result = []

    try:
        # Read and normalize all CSV rows first
        normalized_rows = read_and_normalize_csv(csv_path)
        
        for row_index, row in enumerate(normalized_rows):
            deck_id = row.get('deck_id', '').strip()
            deck_name = row.get('deck_name', '').strip()

            print("DECK ID: ", deck_id)
            
            if not deck_id:
                print(f"⚠️  Row {row_index + 1}: Missing deck_id")
                print(f"Available keys: {list(row.keys())}")
                print(f"Row data: {row}")
                continue  # Skip this row

            if not deck_name:
                print(f"⚠️  Row {row_index + 1}: Missing deck_name")
                print(f"Available keys: {list(row.keys())}")
                print(f"Row data: {row}")
                continue  # Skip this row
            
            grantha_info = parse_grantha_info(row.get('grantha_name', ''))
            grantha_id = f"{deck_id}_{grantha_info['name'].replace(' ', '_')}"
            folder_path = os.path.join(folders_base_path, deck_id)
            folder_data = get_folder_structure(folder_path) if os.path.exists(folder_path) else {}
            subworks_info = parse_subworks(row.get('subworks', ''))

            main_grantha_images = []
            subworks_with_images = []

            if folder_data:
                for file_info in folder_data.get("files", []):
                    ext = file_info.get("extension", "").lower()
                    if ext in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]:
                        main_grantha_images.append(file_info)

                subfolders = folder_data.get("subfolders", [])
                for i, subwork in enumerate(subworks_info):
                    if i < len(subfolders):
                        subfolder = subfolders[i]
                        subfolder_name = os.path.basename(subfolder.get("path"))
                        subwork["folder_name"] = subfolder_name
                        subwork["grantha_id"] = f"{subfolder_name}"
                        subwork_images = []
                        for file_info in subfolder.get("files", []):
                            ext = file_info.get("extension", "").lower()
                            if ext in [".jpg", ".png", ".jpeg", ".webp", ".gif", ".tiff", ".tif", ".dng"]:
                                subwork_images.append(file_info)
                        subwork["images"] = subwork_images
                        subwork["image_count"] = len(subwork_images)
                        subworks_with_images.append(subwork)

            # Safe float conversion
            def safe_float(value):
                try:
                    return float(value) if value else 0.0
                except (ValueError, TypeError):
                    return 0.0

            result.append({
                "s_no": row.get("s_no", ""),
                "deck_origin": row.get("deck_origin", ""),
                "deck_owner_name": row.get("deck_owner_name", ""),
                "deck_id": deck_id,
                "deck_name": deck_name,
                "grantha_id": grantha_id,
                "stitch_or_nonstitch": row.get("stitch_or_nonstitch", ""),
                "physical_condition": row.get("condition", ""),
                "length_in_cms": safe_float(row.get("length", "")),
                "width_in_cms": safe_float(row.get("width", "")),
                "scanning_start_date": row.get("scanning_start_date", ""),
                "scanning_completed_date": row.get("scanning_completed_date", ""),
                "post_scanning_completed_date": row.get("post_scanning_completed_date", ""),
                "horizontal_or_vertical_scan": row.get("horizontal_or_vertical_scan", ""),
                "worked_by": row.get("worked_by", ""),
                "scanner_model": row.get("scanner_model", ""),
                "lighting_conditions": row.get("lighting_conditions", ""),
                "remarks": row.get("remarks", ""),
                "grantha": {
                    "id": grantha_id,
                    "name": grantha_info["name"],
                    "author": grantha_info["author"],
                    "language": grantha_info["language"],
                    "images": main_grantha_images,
                    "image_count": len(main_grantha_images)
                },
                "subworks": subworks_with_images,
                "total_images": folder_data.get("totalImages", 0)
            })

        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

# This is the missing function that your main.py is trying to import
def add_bulk_insertion_routes(app: FastAPI):
    """Add bulk insertion routes to the FastAPI app"""
    
    @app.post("/process-csv")
    async def api_process_csv(request: CSVProcessRequest):
        csv_path = request.csv_file_path.strip()
        folders_base_path = request.folders_base_path.strip()
        return process_csv(app, csv_path, folders_base_path)